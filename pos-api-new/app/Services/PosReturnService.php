<?php

namespace App\Services;

use App\Models\Account;
use App\Models\CashRegister;
use App\Models\Product;
use App\Models\Product_Sale;
use App\Models\Product_Warehouse;
use App\Models\ProductBatch;
use App\Models\ProductReturn;
use App\Models\ProductVariant;
use App\Models\Returns;
use App\Models\Sale;
use App\Models\Unit;
use App\Models\Variant;
use App\Services\Concerns\RunsPosSyncTransaction;
use Illuminate\Support\Facades\Auth;

class PosReturnService
{
    use RunsPosSyncTransaction;

    /**
     * @return array<string, mixed>
     */
    public function lookupSaleForReturn(string $referenceNo): array
    {
        $referenceNo = trim($referenceNo);
        if ($referenceNo === '') {
            throw new \InvalidArgumentException('Sale reference is required.');
        }

        $sale = Sale::whereNull('deleted_at')
            ->where('reference_no', $referenceNo)
            ->first();

        if (!$sale) {
            $compact = preg_replace('/[\s-]+/', '', strtolower($referenceNo));
            $sale = Sale::whereNull('deleted_at')
                ->whereRaw(
                    "LOWER(REPLACE(REPLACE(TRIM(reference_no), '-', ''), ' ', '')) = ?",
                    [$compact]
                )
                ->first();
        }

        if (!$sale) {
            throw new \RuntimeException('Sale not found for this reference.');
        }

        if ((int) $sale->sale_status === 3) {
            throw new \RuntimeException('Draft sales cannot be returned. Complete the sale first.');
        }

        $lines = [];
        foreach (Product_Sale::where('sale_id', $sale->id)->get() as $ps) {
            $returnable = (float) $ps->qty - (float) ($ps->return_qty ?? 0);
            if ($returnable <= 0) {
                continue;
            }

            $product = Product::find($ps->product_id);
            $code = $product?->code ?? '';
            if ($ps->variant_id && $product) {
                $variant = ProductVariant::select('id', 'item_code')
                    ->FindExactProduct($product->id, $ps->variant_id)
                    ->first();
                if ($variant) {
                    $code = $variant->item_code;
                }
            }

            $unitName = 'n/a';
            if ($product && $product->type === 'standard' && $ps->sale_unit_id) {
                $unitName = Unit::find($ps->sale_unit_id)?->unit_name ?? 'n/a';
            }

            $lines[] = [
                'product_sale_id' => $ps->id,
                'product_id' => $ps->product_id,
                'variant_id' => $ps->variant_id,
                'product_batch_id' => $ps->product_batch_id,
                'name' => $product?->name ?? 'Product',
                'code' => $code,
                'qty' => (float) $ps->qty,
                'return_qty' => (float) ($ps->return_qty ?? 0),
                'returnable_qty' => $returnable,
                'net_unit_price' => (float) $ps->net_unit_price,
                'discount' => (float) $ps->discount,
                'tax_rate' => (float) $ps->tax_rate,
                'tax' => (float) $ps->tax,
                'subtotal' => (float) $ps->total,
                'sale_unit' => $unitName,
                'imei_number' => $ps->imei_number ?? '',
            ];
        }

        if ($lines === []) {
            throw new \RuntimeException('No returnable items on this sale.');
        }

        return [
            'sale' => [
                'id' => $sale->id,
                'reference_no' => $sale->reference_no,
                'customer_id' => $sale->customer_id,
                'warehouse_id' => $sale->warehouse_id,
                'biller_id' => $sale->biller_id,
                'sale_status' => (int) $sale->sale_status,
                'payment_status' => (int) $sale->payment_status,
                'grand_total' => (float) $sale->grand_total,
                'order_discount' => (float) ($sale->order_discount ?? 0),
                'order_tax_rate' => (float) ($sale->order_tax_rate ?? 0),
            ],
            'lines' => $lines,
        ];
    }

    /**
     * Create a sale return from POS payload. No cash refund (refund=0).
     *
     * @return array{return_id: int, reference_no: string, grand_total: float, credit_remaining: float}
     */
    public function createFromPosPayload(array $payload, int $userId): array
    {
        if (($payload['return_type'] ?? '') === 'without_sale') {
            return $this->createWithoutSaleFromPosPayload($payload, $userId);
        }

        return $this->runPosSyncTransaction(function () use ($payload, $userId) {
            $saleId = (int) ($payload['sale_id'] ?? 0);
            $saleRef = trim((string) ($payload['sale_reference_no'] ?? ''));

            $sale = $saleId > 0
                ? Sale::whereNull('deleted_at')->find($saleId)
                : Sale::whereNull('deleted_at')->where('reference_no', $saleRef)->first();

            if (!$sale) {
                throw new \RuntimeException('Original sale not found.');
            }

            if ((int) $sale->sale_status === 3) {
                throw new \RuntimeException('Draft sales cannot be returned.');
            }

            $lines = $payload['lines'] ?? [];
            if (!is_array($lines) || $lines === []) {
                throw new \RuntimeException('Return lines are required.');
            }

            $cashRegister = CashRegister::where([
                ['user_id', $userId],
                ['warehouse_id', $sale->warehouse_id],
                ['status', true],
            ])->first();

            $account = Account::where('is_default', true)->first();

            $returnData = [
                'client_uuid' => $payload['client_uuid'] ?? null,
                'reference_no' => $payload['reference_no'] ?? ('rr-' . date('Ymd') . '-' . date('his')),
                'user_id' => $userId,
                'sale_id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'warehouse_id' => $sale->warehouse_id,
                'biller_id' => $sale->biller_id,
                'currency_id' => $sale->currency_id,
                'exchange_rate' => $sale->exchange_rate,
                'cash_register_id' => $cashRegister?->id,
                'account_id' => $account?->id,
                'item' => (int) ($payload['item'] ?? count($lines)),
                'total_qty' => (float) ($payload['total_qty'] ?? 0),
                'total_discount' => (float) ($payload['total_discount'] ?? 0),
                'total_tax' => (float) ($payload['total_tax'] ?? 0),
                'total_price' => (float) ($payload['total_price'] ?? 0),
                'order_tax_rate' => (float) ($payload['order_tax_rate'] ?? 0),
                'order_tax' => (float) ($payload['order_tax'] ?? 0),
                'grand_total' => (float) ($payload['grand_total'] ?? 0),
                'settled_amount' => 0,
                'return_note' => $payload['return_note'] ?? '',
                'staff_note' => $payload['staff_note'] ?? '',
            ];

            $returnRecord = Returns::create($returnData);

            foreach ($lines as $line) {
                if (!is_array($line)) {
                    continue;
                }

                $qty = (float) ($line['qty'] ?? 0);
                if ($qty <= 0) {
                    continue;
                }

                $productSaleId = (int) ($line['product_sale_id'] ?? 0);
                $productSale = $productSaleId > 0
                    ? Product_Sale::find($productSaleId)
                    : Product_Sale::where('sale_id', $sale->id)
                        ->where('product_id', (int) ($line['product_id'] ?? 0))
                        ->first();

                if (!$productSale) {
                    throw new \RuntimeException('Sale line not found for return.');
                }

                $returnable = (float) $productSale->qty - (float) ($productSale->return_qty ?? 0);
                if ($qty > $returnable + 0.0001) {
                    throw new \RuntimeException('Return qty exceeds returnable qty for '.$productSale->product_id);
                }

                $isDamage = (bool) ($line['is_damage'] ?? false);
                $proId = (int) $productSale->product_id;
                $product = Product::find($proId);
                if (!$product) {
                    continue;
                }

                $variantId = null;
                $saleUnit = (string) ($line['sale_unit'] ?? 'n/a');
                $productCode = (string) ($line['product_code'] ?? $product->code);
                $batchId = $line['product_batch_id'] ?? $productSale->product_batch_id;

                if (!$isDamage) {
                    $this->restoreStock(
                        product: $product,
                        warehouseId: (int) $sale->warehouse_id,
                        qty: $qty,
                        saleUnit: $saleUnit,
                        productCode: $productCode,
                        batchId: $batchId,
                        imei: (string) ($line['imei_number'] ?? ''),
                        variantIdOut: $variantId,
                    );
                }

                ProductReturn::create([
                    'return_id' => $returnRecord->id,
                    'product_id' => $proId,
                    'variant_id' => $variantId ?? $productSale->variant_id,
                    'product_batch_id' => $batchId,
                    'imei_number' => $line['imei_number'] ?? '',
                    'qty' => $qty,
                    'sale_unit_id' => $productSale->sale_unit_id,
                    'net_unit_price' => (float) ($line['net_unit_price'] ?? $productSale->net_unit_price),
                    'discount' => (float) ($line['discount'] ?? 0),
                    'tax_rate' => (float) ($line['tax_rate'] ?? 0),
                    'tax' => (float) ($line['tax'] ?? 0),
                    'total' => (float) ($line['subtotal'] ?? $line['total'] ?? 0),
                    'is_damage' => $isDamage,
                ]);

                $productSale->return_qty = (float) ($productSale->return_qty ?? 0) + $qty;
                $productSale->save();
            }

            if (!empty($payload['change_sale_status'])) {
                $sale->update(['sale_status' => 4]);
            }

            $credit = (float) $returnRecord->grand_total - (float) ($returnRecord->settled_amount ?? 0);

            return [
                'return_id' => (int) $returnRecord->id,
                'reference_no' => $returnRecord->reference_no,
                'grand_total' => (float) $returnRecord->grand_total,
                'credit_remaining' => $credit,
            ];
        });
    }

    /**
     * POS return without original sale bill — product scan only.
     *
     * @return array{return_id: int, reference_no: string, grand_total: float, credit_remaining: float}
     */
    public function createWithoutSaleFromPosPayload(array $payload, int $userId): array
    {
        return $this->runPosSyncTransaction(function () use ($payload, $userId) {
            $warehouseId = (int) ($payload['warehouse_id'] ?? 0);
            $customerId = (int) ($payload['customer_id'] ?? 0);
            if ($warehouseId <= 0 || $customerId <= 0) {
                throw new \RuntimeException('warehouse_id and customer_id are required.');
            }

            $lines = $payload['lines'] ?? [];
            if (!is_array($lines) || $lines === []) {
                throw new \RuntimeException('Return lines are required.');
            }

            $cashRegister = CashRegister::where([
                ['user_id', $userId],
                ['warehouse_id', $warehouseId],
                ['status', true],
            ])->first();

            $account = Account::where('is_default', true)->first();
            $billerId = (int) ($payload['biller_id'] ?? 0);

            $returnData = [
                'client_uuid' => $payload['client_uuid'] ?? null,
                'reference_no' => $payload['reference_no'] ?? ('rr-' . date('Ymd') . '-' . date('his')),
                'user_id' => $userId,
                'sale_id' => null,
                'customer_id' => $customerId,
                'warehouse_id' => $warehouseId,
                'biller_id' => $billerId > 0 ? $billerId : null,
                'cash_register_id' => $cashRegister?->id,
                'account_id' => $account?->id,
                'item' => (int) ($payload['item'] ?? count($lines)),
                'total_qty' => (float) ($payload['total_qty'] ?? 0),
                'total_discount' => (float) ($payload['total_discount'] ?? 0),
                'total_tax' => (float) ($payload['total_tax'] ?? 0),
                'total_price' => (float) ($payload['total_price'] ?? 0),
                'order_tax_rate' => (float) ($payload['order_tax_rate'] ?? 0),
                'order_tax' => (float) ($payload['order_tax'] ?? 0),
                'grand_total' => (float) ($payload['grand_total'] ?? 0),
                'settled_amount' => 0,
                'return_note' => $payload['return_note'] ?? 'POS return without bill',
                'staff_note' => $payload['staff_note'] ?? '',
            ];

            $returnRecord = Returns::create($returnData);

            foreach ($lines as $line) {
                if (!is_array($line)) {
                    continue;
                }

                $qty = (float) ($line['qty'] ?? 0);
                if ($qty <= 0) {
                    continue;
                }

                $proId = (int) ($line['product_id'] ?? 0);
                $product = Product::find($proId);
                if (!$product) {
                    continue;
                }

                $isDamage = (bool) ($line['is_damage'] ?? false);
                $variantId = null;
                $saleUnit = (string) ($line['sale_unit'] ?? 'n/a');
                $productCode = (string) ($line['product_code'] ?? $product->code);
                $batchId = $line['product_batch_id'] ?? null;

                if (!$isDamage) {
                    $this->restoreStock(
                        product: $product,
                        warehouseId: $warehouseId,
                        qty: $qty,
                        saleUnit: $saleUnit,
                        productCode: $productCode,
                        batchId: $batchId,
                        imei: (string) ($line['imei_number'] ?? ''),
                        variantIdOut: $variantId,
                    );
                }

                ProductReturn::create([
                    'return_id' => $returnRecord->id,
                    'product_id' => $proId,
                    'variant_id' => $line['product_variant_id'] ?? null,
                    'product_batch_id' => $batchId,
                    'imei_number' => $line['imei_number'] ?? '',
                    'qty' => $qty,
                    'net_unit_price' => (float) ($line['net_unit_price'] ?? 0),
                    'discount' => (float) ($line['discount'] ?? 0),
                    'tax_rate' => (float) ($line['tax_rate'] ?? 0),
                    'tax' => (float) ($line['tax'] ?? 0),
                    'total' => (float) ($line['subtotal'] ?? $line['total'] ?? 0),
                    'is_damage' => $isDamage,
                ]);
            }

            $credit = (float) $returnRecord->grand_total - (float) ($returnRecord->settled_amount ?? 0);

            return [
                'return_id' => (int) $returnRecord->id,
                'reference_no' => $returnRecord->reference_no,
                'grand_total' => (float) $returnRecord->grand_total,
                'credit_remaining' => $credit,
            ];
        });
    }

    private function restoreStock(
        Product $product,
        int $warehouseId,
        float $qty,
        string $saleUnit,
        string $productCode,
        $batchId,
        string $imei,
        ?int &$variantIdOut,
    ): void {
        $quantity = $qty;
        $limsProductWarehouseData = null;

        if ($saleUnit !== 'n/a') {
            $saleUnitData = Unit::where('unit_name', $saleUnit)->first();
            if ($saleUnitData) {
                if ($saleUnitData->operator === '*') {
                    $quantity = $qty * (float) $saleUnitData->operation_value;
                } elseif ($saleUnitData->operator === '/') {
                    $quantity = $qty / (float) $saleUnitData->operation_value;
                }
            }

            if ($product->is_variant) {
                $variantRow = ProductVariant::select('id', 'variant_id', 'qty')
                    ->FindExactProductWithCode($product->id, $productCode)
                    ->first();
                if ($variantRow) {
                    $variantRow->qty += $quantity;
                    $variantRow->save();
                    $variantIdOut = Variant::find($variantRow->variant_id)?->id;
                    $limsProductWarehouseData = Product_Warehouse::FindProductWithVariant(
                        $product->id,
                        $variantRow->variant_id,
                        $warehouseId,
                    )->first();
                }
            } elseif ($batchId) {
                $limsProductWarehouseData = Product_Warehouse::where([
                    ['product_batch_id', $batchId],
                    ['warehouse_id', $warehouseId],
                ])->first();
                $batch = ProductBatch::find($batchId);
                if ($batch) {
                    $batch->qty += $quantity;
                    $batch->save();
                }
            } else {
                $limsProductWarehouseData = Product_Warehouse::FindProductWithoutVariant($product->id, $warehouseId)->first();
            }

            $product->qty += $quantity;
            if ($limsProductWarehouseData) {
                if ($imei !== '' && !str_contains($imei, 'null')) {
                    $limsProductWarehouseData->imei_number = $limsProductWarehouseData->imei_number
                        ? $limsProductWarehouseData->imei_number.','.$imei
                        : $imei;
                }
                $limsProductWarehouseData->qty += $quantity;
                $limsProductWarehouseData->save();
            }
            $product->save();
        }
    }
}
