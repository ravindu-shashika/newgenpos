<?php

namespace App\Http\Controllers\Concerns;

use App\Services\PosStockBroadcastService;

trait BroadcastsPosStockChanges
{
    /**
     * @param  list<int>  $stockIds
     * @param  list<int>  $batchIds
     */
    protected function broadcastPosStockChanges(
        int $warehouseId,
        string $reason,
        ?string $reference,
        array $stockIds = [],
        array $batchIds = [],
    ): void {
        app(PosStockBroadcastService::class)->broadcast(
            $warehouseId,
            $reason,
            $reference,
            $stockIds,
            $batchIds,
        );
    }
}
