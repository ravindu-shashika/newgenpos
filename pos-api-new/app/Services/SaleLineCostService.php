<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductPurchase;
use App\Models\Unit;

class SaleLineCostService
{
    /**
     * Unit cost captured at sale time — from payload, batch purchase, or product cost.
     */
    public function resolveNetUnitCost(
        array $requestedCosts,
        int $index,
        Product $product,
        ?int $batchId = null,
    ): float {
        if (array_key_exists($index, $requestedCosts)) {
            $cost = (float) $requestedCosts[$index];
            if ($cost > 0) {
                return round($cost, (int) config('decimal', 2));
            }
        }

        if ($batchId) {
            $purchaseLine = ProductPurchase::query()
                ->join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
                ->where('product_purchases.product_id', $product->id)
                ->where('product_purchases.product_batch_id', $batchId)
                ->whereNull('purchases.deleted_at')
                ->orderByDesc('product_purchases.id')
                ->select('product_purchases.qty', 'product_purchases.total')
                ->first();

            if ($purchaseLine && (float) $purchaseLine->qty > 0) {
                return round(
                    (float) $purchaseLine->total / (float) $purchaseLine->qty,
                    (int) config('decimal', 2)
                );
            }
        }

        return round(max(0, (float) ($product->cost ?? 0)), (int) config('decimal', 2));
    }

    public function soldLineQty(object $productSale): float
    {
        $sold = (float) (($productSale->sold_qty ?? $productSale->qty ?? 0)
            - ($productSale->return_qty ?? 0));

        if ($sold <= 0) {
            return 0;
        }

        $saleUnitId = (int) ($productSale->sale_unit_id ?? 0);
        if ($saleUnitId <= 0) {
            return $sold;
        }

        $unit = Unit::select('operator', 'operation_value')->find($saleUnitId);
        if (!$unit) {
            return $sold;
        }

        if ($unit->operator === '*') {
            return $sold * (float) $unit->operation_value;
        }

        if ($unit->operator === '/' && (float) $unit->operation_value != 0) {
            return $sold / (float) $unit->operation_value;
        }

        return $sold;
    }

    /**
     * COGS from saved snapshot when present; null means fall back to purchase average.
     */
    public function lineCostFromSnapshot(object $productSale): ?float
    {
        $unitCost = (float) ($productSale->net_unit_cost ?? 0);
        if ($unitCost <= 0) {
            return null;
        }

        return $this->soldLineQty($productSale) * $unitCost;
    }

    public function lineProfit(object $productSale): float
    {
        $qty = max(0, (float) ($productSale->qty ?? 0) - (float) ($productSale->return_qty ?? 0));
        if ($qty <= 0) {
            return 0;
        }

        $revenue = ((float) ($productSale->net_unit_price ?? 0) * $qty)
            - (float) ($productSale->discount ?? 0);
        $unitCost = (float) ($productSale->net_unit_cost ?? 0);
        $cost = $unitCost > 0 ? $unitCost * $qty : 0;

        return round($revenue - $cost, (int) config('decimal', 2));
    }
}
