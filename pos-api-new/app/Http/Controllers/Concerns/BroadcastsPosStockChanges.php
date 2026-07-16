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
        // REVERB_DISABLED: uncomment below when Reverb live stock sync is enabled.
        return;

        /*
        app(PosStockBroadcastService::class)->broadcast(
            $warehouseId,
            $reason,
            $reference,
            $stockIds,
            $batchIds,
        );
        */
    }
}
