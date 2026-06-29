<?php

namespace App\Jobs;

use App\Models\PosSyncSale;
use App\Services\PosSaleSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Process one offline POS sale (idempotent by client_uuid).
 */
class SyncPosSaleJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 180;

    public function __construct(
        public string $clientUuid,
        public int $userId,
    ) {
        $this->onQueue(config('pos.sale_sync_queue', 'pos-sales'));
    }

    public function uniqueId(): string
    {
        return $this->clientUuid;
    }

    public function handle(PosSaleSyncService $syncService): void
    {
        $syncService->processByClientUuid($this->clientUuid, $this->userId);
    }

    public function failed(\Throwable $exception): void
    {
        PosSyncSale::where('client_uuid', $this->clientUuid)->update([
            'sync_status' => 'failed',
            'error_message' => $exception->getMessage(),
        ]);
    }
}
