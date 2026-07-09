<?php

namespace App\Services;

use App\Models\VariantMaster;
use App\Models\VariantMasterValue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Resolves product variant links through variant_master_values (not legacy variants table).
 */
class VariantMasterResolver
{
    public function masterNameForValue(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return 'Size';
        }
        if (preg_match('/^\d+(\.\d+)?$/', $value)) {
            return 'Numeric Size';
        }
        if (str_contains($value, '/')) {
            return 'Combination';
        }

        return 'Size';
    }

    public function findByName(string $name): ?VariantMasterValue
    {
        $name = trim($name);
        if ($name === '') {
            return null;
        }

        return VariantMasterValue::query()
            ->where('is_active', true)
            ->whereRaw('LOWER(value) = ?', [strtolower($name)])
            ->first();
    }

    public function firstOrCreateByName(string $name): VariantMasterValue
    {
        $name = trim($name);
        $existing = $this->findByName($name);
        if ($existing) {
            return $existing;
        }

        $masterName = $this->masterNameForValue($name);
        $master = VariantMaster::firstOrCreate(
            ['name' => $masterName],
            [
                'position' => (int) VariantMaster::where('is_active', true)->max('position') + 1,
                'is_active' => true,
            ]
        );

        if (!$master->is_active) {
            $master->update(['is_active' => true]);
        }

        $position = (int) $master->allValues()->max('position') + 1;

        return VariantMasterValue::create([
            'variant_master_id' => $master->id,
            'value' => $name,
            'position' => $position,
            'is_active' => true,
        ]);
    }

    public function valueName(?int $id): ?string
    {
        if (!$id) {
            return null;
        }

        return VariantMasterValue::query()
            ->where('is_active', true)
            ->whereKey($id)
            ->value('value');
    }

    /**
     * Map legacy variants.id => variant_master_values.id (by matching name/value).
     *
     * @return array<int, int>
     */
    public function buildLegacyIdMap(): array
    {
        $map = [];

        if (!Schema::hasTable('variants')) {
            return $map;
        }

        foreach (DB::table('variants')->orderBy('id')->get(['id', 'name']) as $row) {
            $name = trim((string) $row->name);
            if ($name === '') {
                continue;
            }
            $value = $this->findByName($name) ?? $this->firstOrCreateByName($name);
            $map[(int) $row->id] = (int) $value->id;
        }

        return $map;
    }

    /**
     * Rewrite variant_id columns to variant_master_values.id across the app.
     *
     * @return array{map: array<int, int>, updated_rows: int, tables: array<string, int>}
     */
    public function migrateProductVariantForeignKeys(): array
    {
        $map = $this->buildLegacyIdMap();
        $tables = [
            'product_variants',
            'product_warehouse',
            'product_sales',
            'product_purchases',
            'product_quotation',
            'product_transfers',
            'product_transfer',
            'product_returns',
            'product_return',
            'purchase_product_return',
            'product_adjustments',
            'product_adjustment',
            'product_damages',
            'product_damage_stock',
            'damage_stocks',
            'packing_slip_products',
            'product_exchanges',
            'quotation_products',
            'combo_products',
        ];

        $updated = 0;
        $perTable = [];

        DB::transaction(function () use ($map, $tables, &$updated, &$perTable) {
            foreach ($tables as $table) {
                if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'variant_id')) {
                    continue;
                }

                $tableUpdated = 0;
                foreach ($map as $oldId => $newId) {
                    if ($oldId === $newId) {
                        continue;
                    }
                    $count = DB::table($table)->where('variant_id', $oldId)->update(['variant_id' => $newId]);
                    $tableUpdated += $count;
                }
                if ($tableUpdated > 0) {
                    $perTable[$table] = $tableUpdated;
                    $updated += $tableUpdated;
                }
            }
        });

        return [
            'map' => $map,
            'updated_rows' => $updated,
            'tables' => $perTable,
        ];
    }

    /** SQL table alias for joins that previously used `variants`. */
    public static function valuesTable(): string
    {
        return 'variant_master_values';
    }

    /** Column to select as legacy variant name. */
    public static function nameColumn(string $alias = 'variant_master_values'): string
    {
        return "{$alias}.value";
    }
}
