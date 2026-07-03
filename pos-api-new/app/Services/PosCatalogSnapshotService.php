<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Builds warehouse-scoped SQLite catalog snapshots for bulk POS import.
 */
class PosCatalogSnapshotService
{
    public function __construct(
        private readonly PosDownloadService $download,
    ) {}

    public function request(int $warehouseId): array
    {
        $id = (string) Str::uuid();
        $meta = [
            'id' => $id,
            'warehouse_id' => $warehouseId,
            'status' => 'pending',
            'progress' => 0,
            'message' => 'Queued',
            'file' => null,
            'created_at' => now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
        ];

        $this->writeMeta($warehouseId, $id, $meta);

        return $meta;
    }

    public function getStatus(int $warehouseId, string $id): ?array
    {
        $path = $this->metaPath($warehouseId, $id);
        if (! Storage::disk($this->disk())->exists($path)) {
            return null;
        }

        return json_decode(
            Storage::disk($this->disk())->get($path),
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    }

    public function updateProgress(
        int $warehouseId,
        string $id,
        int $progress,
        string $status,
        ?string $message = null,
        ?string $file = null,
    ): void {
        $meta = $this->getStatus($warehouseId, $id);
        if (! $meta) {
            return;
        }

        $meta['progress'] = max(0, min(100, $progress));
        $meta['status'] = $status;
        if ($message !== null) {
            $meta['message'] = $message;
        }
        if ($file !== null) {
            $meta['file'] = $file;
        }
        $meta['updated_at'] = now()->toIso8601String();
        $this->writeMeta($warehouseId, $id, $meta);
    }

    public function buildSnapshot(int $warehouseId, string $id): void
    {
        $this->updateProgress($warehouseId, $id, 1, 'building', 'Creating snapshot database');

        $disk = Storage::disk($this->disk());
        $dir = $this->snapshotDir($warehouseId);
        $dbRel = "{$dir}/{$id}.db";
        $gzRel = "{$dir}/{$id}.db.gz";
        $localDb = $disk->path($dbRel);

        if (file_exists($localDb)) {
            @unlink($localDb);
        }
        if ($disk->exists($gzRel)) {
            $disk->delete($gzRel);
        }

        $pdo = new \PDO('sqlite:' . $localDb);
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $this->createSchema($pdo);

        $resources = [
            'warehouses' => 5,
            'users' => 8,
            'categories' => 10,
            'brands' => 12,
            'taxes' => 14,
            'units' => 16,
            'customers' => 30,
            'billers' => 32,
            'coupons' => 34,
            'products' => 55,
            'product_variants' => 70,
            'product_batches' => 82,
            'product_stock' => 95,
        ];

        foreach ($resources as $resource => $progress) {
            $this->updateProgress(
                $warehouseId,
                $id,
                $progress,
                'building',
                "Exporting {$resource}"
            );
            $this->exportResource($pdo, $resource, $warehouseId);
        }

        $pdo = null;

        $this->updateProgress($warehouseId, $id, 97, 'compressing', 'Compressing snapshot');
        $gzPath = $disk->path($gzRel);
        $in = fopen($localDb, 'rb');
        $out = gzopen($gzPath, 'wb9');
        while (! feof($in)) {
            gzwrite($out, fread($in, 1024 * 512));
        }
        fclose($in);
        gzclose($out);
        @unlink($localDb);

        $this->updateProgress(
            $warehouseId,
            $id,
            100,
            'ready',
            'Snapshot ready',
            $gzRel
        );

        $this->purgeOldSnapshots($warehouseId, $id);
    }

    public function snapshotFilePath(int $warehouseId, string $id): ?string
    {
        $meta = $this->getStatus($warehouseId, $id);
        if (! $meta || ($meta['status'] ?? '') !== 'ready' || empty($meta['file'])) {
            return null;
        }

        $path = $meta['file'];
        if (! Storage::disk($this->disk())->exists($path)) {
            return null;
        }

        return Storage::disk($this->disk())->path($path);
    }

    private function exportResource(\PDO $pdo, string $resource, int $warehouseId): void
    {
        $table = match ($resource) {
            'users' => 'local_users',
            'coupons' => 'local_coupons',
            default => $resource,
        };

        $cursorId = null;
        $page = 1;
        $perPage = 5000;

        do {
            $chunk = $this->download->download($resource, $page, $perPage, [
                'warehouse_id' => $warehouseId,
                'mode' => PosDownloadService::MODE_FULL,
                'since' => null,
                'cursor_id' => $cursorId,
            ]);

            $rows = $chunk['data'] ?? [];
            if ($rows === []) {
                break;
            }

            $this->insertRows($pdo, $table, $resource, $rows);

            $hasMore = (bool) ($chunk['has_more'] ?? false);
            $cursorId = isset($chunk['next_cursor_id']) ? (int) $chunk['next_cursor_id'] : null;
            $page++;
        } while ($hasMore && $cursorId !== null);
    }

  private function insertRows(\PDO $pdo, string $table, string $resource, array $rows): void
    {
        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }

            if ($resource === 'users') {
                $mapped = [
                    'id' => $row['id'] ?? null,
                    'name' => $row['name'] ?? '',
                    'username' => $row['username'] ?? null,
                    'email' => $row['email'] ?? null,
                    'password_hash' => $row['password'] ?? '',
                    'access_pin_hash' => $row['access_pin'] ?? null,
                    'warehouse_id' => $row['warehouse_id'] ?? null,
                    'role_id' => $row['role_id'] ?? null,
                    'biller_id' => $row['biller_id'] ?? null,
                    'updated_at' => $row['updated_at'] ?? null,
                ];
                $this->insertOne($pdo, $table, $mapped);

                continue;
            }

            if ($resource === 'brands') {
                $row['name'] = $row['name'] ?? $row['title'] ?? '';
            }

            if ($resource === 'products') {
                $row = $this->normalizeProductRow($row);
            }

            $this->insertOne($pdo, $table, $row);
        }
    }

    private function normalizeProductRow(array $row): array
    {
        foreach (['is_variant', 'is_batch', 'is_imei', 'is_embeded'] as $boolCol) {
            if (array_key_exists($boolCol, $row)) {
                $row[$boolCol] = $row[$boolCol] ? 1 : 0;
            }
        }

        return $row;
    }

    private function insertOne(\PDO $pdo, string $table, array $row): void
    {
        $columns = array_keys($row);
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));
        $sql = 'INSERT OR REPLACE INTO ' . $table . ' (' . implode(', ', $columns) . ') VALUES (' . $placeholders . ')';
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($row));
    }

    private function createSchema(\PDO $pdo): void
    {
        $pdo->exec(<<<'SQL'
CREATE TABLE warehouses (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, updated_at TEXT
);
CREATE TABLE local_users (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, username TEXT, email TEXT,
  password_hash TEXT NOT NULL, access_pin_hash TEXT, warehouse_id INTEGER,
  role_id INTEGER, biller_id INTEGER, updated_at TEXT
);
CREATE TABLE categories (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, image TEXT, updated_at TEXT
);
CREATE TABLE brands (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, image TEXT, updated_at TEXT
);
CREATE TABLE taxes (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, rate REAL DEFAULT 0, updated_at TEXT
);
CREATE TABLE units (
  id INTEGER PRIMARY KEY, unit_code TEXT, unit_name TEXT NOT NULL,
  base_unit INTEGER, operator TEXT, operation_value REAL DEFAULT 1, updated_at TEXT
);
CREATE TABLE customers (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone_number TEXT, email TEXT,
  city TEXT, customer_group_id INTEGER, updated_at TEXT
);
CREATE TABLE billers (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, company_name TEXT, updated_at TEXT
);
CREATE TABLE local_coupons (
  id INTEGER PRIMARY KEY, code TEXT NOT NULL, type TEXT DEFAULT 'percentage',
  amount REAL DEFAULT 0, minimum_amount REAL DEFAULT 0, quantity REAL,
  used REAL DEFAULT 0, expired_date TEXT, updated_at TEXT
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, alt_code TEXT,
  type TEXT DEFAULT 'standard', brand_id INTEGER, category_id INTEGER,
  unit_id INTEGER, sale_unit_id INTEGER, cost REAL DEFAULT 0, price REAL DEFAULT 0,
  max_price REAL, wholesale_price REAL DEFAULT 0, tax_id INTEGER, tax_method INTEGER DEFAULT 1,
  image TEXT, is_variant INTEGER DEFAULT 0, is_batch INTEGER DEFAULT 0,
  is_imei INTEGER DEFAULT 0, is_embeded INTEGER DEFAULT 0, featured INTEGER DEFAULT 0,
  updated_at TEXT
);
CREATE TABLE product_variants (
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, variant_id INTEGER,
  item_code TEXT NOT NULL, additional_price REAL DEFAULT 0, updated_at TEXT
);
CREATE TABLE product_batches (
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, batch_no TEXT NOT NULL,
  expired_date TEXT, qty REAL DEFAULT 0, updated_at TEXT
);
CREATE TABLE product_stock (
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, warehouse_id INTEGER NOT NULL,
  variant_id INTEGER, qty REAL DEFAULT 0, price REAL, product_batch_id INTEGER,
  imei_number TEXT, updated_at TEXT
);
SQL);
    }

    private function writeMeta(int $warehouseId, string $id, array $meta): void
    {
        Storage::disk($this->disk())->put(
            $this->metaPath($warehouseId, $id),
            json_encode($meta, JSON_THROW_ON_ERROR)
        );
    }

    private function metaPath(int $warehouseId, string $id): string
    {
        return $this->snapshotDir($warehouseId) . "/{$id}.json";
    }

    private function snapshotDir(int $warehouseId): string
    {
        return "pos-snapshots/{$warehouseId}";
    }

    private function disk(): string
    {
        return (string) config('pos.snapshot_disk', 'local');
    }

    private function purgeOldSnapshots(int $warehouseId, string $keepId): void
    {
        $ttlHours = (int) config('pos.snapshot_ttl_hours', 48);
        if ($ttlHours <= 0) {
            return;
        }

        $disk = Storage::disk($this->disk());
        $dir = $this->snapshotDir($warehouseId);
        if (! $disk->exists($dir)) {
            return;
        }

        $cutoff = now()->subHours($ttlHours)->getTimestamp();
        foreach ($disk->files($dir) as $file) {
            if (str_contains($file, $keepId)) {
                continue;
            }
            $mtime = $disk->lastModified($file);
            if ($mtime < $cutoff) {
                $disk->delete($file);
            }
        }
    }
}
