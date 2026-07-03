<?php

namespace App\Jobs;

use App\Services\PosCatalogSnapshotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class BuildPosCatalogSnapshotJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 3600;

    public function __construct(
        public readonly int $warehouseId,
        public readonly string $snapshotId,
    ) {}

    public function handle(PosCatalogSnapshotService $snapshots): void
    {
        $snapshots->buildSnapshot($this->warehouseId, $this->snapshotId);
    }

    public function failed(Throwable $e): void
    {
        $snapshots = app(PosCatalogSnapshotService::class);
        $snapshots->updateProgress(
            $this->warehouseId,
            $this->snapshotId,
            0,
            'failed',
            $e->getMessage()
        );
    }
}
