<?php

namespace App\Services;

use App\Events\PosStockUpdated;
use App\Models\ProductBatch;
use App\Models\Product_Warehouse;

class PosStockBroadcastService
{
    /**
     * @param  list<int>  $stockIds
     * @param  list<int>  $batchIds
     */
    public function broadcast(
        int $warehouseId,
        string $reason,
        ?string $reference,
        array $stockIds = [],
        array $batchIds = [],
    ): void {
        // REVERB_DISABLED: uncomment block below when Reverb live stock sync is enabled.
        return;

        /*
        if (!$this->isEnabled()) {
            return;
        }

        $stockIds = array_values(array_unique(array_filter(array_map('intval', $stockIds))));
        $batchIds = array_values(array_unique(array_filter(array_map('intval', $batchIds))));

        if ($stockIds === [] && $batchIds === []) {
            return;
        }

        $stock = $stockIds === []
            ? []
            : Product_Warehouse::query()
                ->whereIn('id', $stockIds)
                ->get([
                    'id',
                    'product_id',
                    'variant_id',
                    'warehouse_id',
                    'qty',
                    'price',
                    'max_price',
                    'product_batch_id',
                    'imei_number',
                    'updated_at',
                ])
                ->map(static fn (Product_Warehouse $row) => $row->toArray())
                ->all();

        $batches = $batchIds === []
            ? []
            : ProductBatch::query()
                ->whereIn('id', $batchIds)
                ->get([
                    'id',
                    'product_id',
                    'batch_no',
                    'expired_date',
                    'qty',
                    'updated_at',
                ])
                ->map(static fn (ProductBatch $row) => $row->toArray())
                ->all();

        event(new PosStockUpdated(
            warehouseId: $warehouseId,
            reason: $reason,
            reference: $reference,
            stock: $stock,
            batches: $batches,
        ));
        */
    }

    public function isEnabled(): bool
    {
        // REVERB_DISABLED: uncomment block below when Reverb is enabled.
        return false;

        /*
        if (!filter_var(env('REVERB_ENABLED', false), FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        $driver = config('broadcasting.default');

        return in_array($driver, ['reverb', 'pusher'], true);
        */
    }
}
