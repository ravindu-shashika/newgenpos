<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductExchange;
use App\Models\Product_Sale;
use App\Models\Product_Warehouse;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleExchange;
use App\Models\Unit;
use App\Services\Concerns\RunsPosSyncTransaction;

class PosExchangeService
{
    use RunsPosSyncTransaction;

    /**
     * Create a sale exchange from POS payload (return lines + new lines).
     *
     * @return array{exchange_id: int, reference_no: string, balance: float, payment_type: string|null}
     */
    public function createFromPosPayload(array $payload, int $userId): array
    {
        return $this->runPosSyncTransaction(function () use ($payload, $userId) {
            $saleId = (int) ($payload['sale_id'] ?? 0);
            $saleRef = trim((string) ($payload['sale_reference_no'] ?? ''));

            $sale = null;
            if ($saleId > 0) {
                $sale = Sale::whereNull('deleted_at')->find($saleId);
            }
            if (!$sale && $saleRef !== '') {
                $sale = $this->findSaleByReference($saleRef);
            }

            if (!$sale) {
                throw new \RuntimeException('Original sale not found.');
            }

            if ((int) $sale->sale_status === 3) {
                throw new \RuntimeException('Draft sales cannot be exchanged.');
            }

            $lines = $payload['lines'] ?? [];
            if (!is_array($lines) || $lines === []) {
                throw new \RuntimeException('Exchange lines are required.');
            }

            $returnLines = array_values(array_filter(
                $lines,
                fn ($line) => is_array($line) && ($line['type'] ?? '') === 'return'
            ));
            $newLines = array_values(array_filter(
                $lines,
                fn ($line) => is_array($line) && ($line['type'] ?? '') === 'new'
            ));

            if ($returnLines === []) {
                throw new \RuntimeException('Select at least one item to return.');
            }
            if ($newLines === []) {
                throw new \RuntimeException('Add at least one new product.');
            }

            $exchangeValue = (float) ($payload['exchange_value'] ?? 0);
            $newProductsTotal = (float) ($payload['new_products_total'] ?? 0);
            $balance = (float) ($payload['balance'] ?? ($newProductsTotal - $exchangeValue));
            $paymentType = $payload['payment_type'] ?? null;

            if ($paymentType === null) {
                if ($balance > 0) {
                    $paymentType = 'receive';
                } elseif ($balance < 0) {
                    $paymentType = 'pay';
                } else {
                    $paymentType = null;
                }
            }

            $referenceNo = trim((string) ($payload['reference_no'] ?? ''));
            if ($referenceNo === '') {
                $referenceNo = 'exc'.date('Ymd').date('His');
            } else {
                $referenceNo = preg_replace('/[\s-]+/', '', $referenceNo);
            }

            $exchange = SaleExchange::create([
                'client_uuid' => $payload['client_uuid'] ?? null,
                'reference_no' => $referenceNo,
                'sale_id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'user_id' => $userId,
                'warehouse_id' => $sale->warehouse_id,
                'biller_id' => $sale->biller_id,
                'item' => (int) ($payload['item'] ?? count($lines)),
                'total_qty' => (float) ($payload['total_qty'] ?? 0),
                'total_discount' => (float) ($payload['total_discount'] ?? 0),
                'total_tax' => (float) ($payload['total_tax'] ?? 0),
                'amount' => (float) ($payload['amount'] ?? abs($balance)),
                'payment_type' => $paymentType,
                'order_tax_rate' => (float) ($payload['order_tax_rate'] ?? 0),
                'order_tax' => (float) ($payload['order_tax'] ?? 0),
                'grand_total' => (float) ($payload['grand_total'] ?? $newProductsTotal),
                'exchange_note' => $payload['exchange_note'] ?? '',
                'staff_note' => $payload['staff_note'] ?? '',
            ]);

            foreach ($returnLines as $line) {
                $this->processReturnLine($exchange->id, (int) $sale->warehouse_id, $sale, $line);
            }

            foreach ($newLines as $line) {
                $this->processNewLine($exchange->id, (int) $sale->warehouse_id, $line);
            }

            return [
                'exchange_id' => (int) $exchange->id,
                'reference_no' => $exchange->reference_no,
                'balance' => $balance,
                'payment_type' => $paymentType,
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $line
     */
    private function processReturnLine(int $exchangeId, int $warehouseId, Sale $sale, array $line): void
    {
        $qty = (float) ($line['qty'] ?? 0);
        if ($qty <= 0) {
            return;
        }

        $productId = (int) ($line['product_id'] ?? 0);
        $product = Product::find($productId);
        if (!$product) {
            throw new \RuntimeException('Product not found for return line.');
        }

        $productSaleId = (int) ($line['product_sale_id'] ?? 0);
        $productSale = $productSaleId > 0
            ? Product_Sale::find($productSaleId)
            : Product_Sale::where('sale_id', $sale->id)
                ->where('product_id', $productId)
                ->first();

        if (!$productSale) {
            throw new \RuntimeException('Original sale line not found for exchange return.');
        }

        $returnable = (float) $productSale->qty - (float) ($productSale->return_qty ?? 0);
        if ($qty > $returnable + 0.0001) {
            throw new \RuntimeException('Exchange return qty exceeds returnable qty.');
        }

        $saleUnit = (string) ($line['sale_unit'] ?? 'n/a');
        $productCode = (string) ($line['product_code'] ?? $product->code);
        $batchId = $line['product_batch_id'] ?? $productSale->product_batch_id;
        $imei = (string) ($line['imei_number'] ?? '');

        $this->restoreStock(
            product: $product,
            warehouseId: $warehouseId,
            qty: $qty,
            saleUnit: $saleUnit,
            productCode: $productCode,
            batchId: $batchId,
            imei: $imei,
            variantId: $productSale->variant_id,
        );

        ProductExchange::create([
            'exchange_id' => $exchangeId,
            'product_id' => $productId,
            'qty' => $qty,
            'sale_unit_id' => $productSale->sale_unit_id,
            'net_unit_price' => (float) ($line['net_unit_price'] ?? $productSale->net_unit_price),
            'discount' => (float) ($line['discount'] ?? 0),
            'tax_rate' => (float) ($line['tax_rate'] ?? 0),
            'tax' => (float) ($line['tax'] ?? 0),
            'total' => (float) ($line['subtotal'] ?? $line['total'] ?? 0),
            'type' => 'returned',
        ]);

        $productSale->return_qty = (float) ($productSale->return_qty ?? 0) + $qty;
        $productSale->save();
    }

    /**
     * @param  array<string, mixed>  $line
     */
    private function processNewLine(int $exchangeId, int $warehouseId, array $line): void
    {
        $qty = (float) ($line['qty'] ?? 0);
        if ($qty <= 0) {
            return;
        }

        $productId = (int) ($line['product_id'] ?? 0);
        $product = Product::find($productId);
        if (!$product) {
            throw new \RuntimeException('Product not found for new exchange line.');
        }

        $saleUnit = (string) ($line['sale_unit'] ?? 'n/a');
        $productCode = (string) ($line['product_code'] ?? $product->code);
        $batchId = $line['product_batch_id'] ?? null;
        $imei = (string) ($line['imei_number'] ?? '');

        $saleUnitId = 0;
        $quantity = $qty;

        if ($saleUnit !== 'n/a') {
            $saleUnitData = Unit::where('unit_name', $saleUnit)->first();
            if ($saleUnitData) {
                $saleUnitId = (int) $saleUnitData->id;
                if ($saleUnitData->operator === '*') {
                    $quantity = $qty * (float) $saleUnitData->operation_value;
                } elseif ($saleUnitData->operator === '/') {
                    $quantity = $qty / (float) $saleUnitData->operation_value;
                }
            }
        }

        $product->qty -= $quantity;
        $product->save();

        $warehouseRow = null;

        if ($product->is_variant) {
            $variantRow = ProductVariant::select('id', 'variant_id', 'qty')
                ->FindExactProductWithCode($productId, $productCode)
                ->first();
            if ($variantRow) {
                $variantRow->qty -= $quantity;
                $variantRow->save();
                $warehouseRow = Product_Warehouse::FindProductWithVariant(
                    $productId,
                    $variantRow->variant_id,
                    $warehouseId,
                )->first();
            }
        } elseif ($batchId) {
            $batch = ProductBatch::find($batchId);
            if ($batch) {
                $batch->qty -= $quantity;
                $batch->save();
            }
            $warehouseRow = Product_Warehouse::where([
                ['product_batch_id', $batchId],
                ['warehouse_id', $warehouseId],
            ])->first();
        } else {
            $warehouseRow = Product_Warehouse::FindProductWithoutVariant($productId, $warehouseId)->first();
        }

        if ($warehouseRow) {
            $warehouseRow->qty -= $quantity;
            if ($imei !== '' && !str_contains($imei, 'null')) {
                $imeiNumbers = explode(',', $imei);
                $allImei = explode(',', $warehouseRow->imei_number ?? '');
                foreach ($imeiNumbers as $number) {
                    if (($j = array_search($number, $allImei)) !== false) {
                        unset($allImei[$j]);
                    }
                }
                $warehouseRow->imei_number = implode(',', array_filter($allImei));
            }
            $warehouseRow->save();
        }

        ProductExchange::create([
            'exchange_id' => $exchangeId,
            'product_id' => $productId,
            'qty' => $qty,
            'sale_unit_id' => $saleUnitId,
            'net_unit_price' => (float) ($line['net_unit_price'] ?? 0),
            'discount' => (float) ($line['discount'] ?? 0),
            'tax_rate' => (float) ($line['tax_rate'] ?? 0),
            'tax' => (float) ($line['tax'] ?? 0),
            'total' => (float) ($line['subtotal'] ?? $line['total'] ?? 0),
            'type' => 'new',
        ]);
    }

    private function restoreStock(
        Product $product,
        int $warehouseId,
        float $qty,
        string $saleUnit,
        string $productCode,
        $batchId,
        string $imei,
        ?int $variantId,
    ): void {
        $quantity = $qty;
        $warehouseRow = null;

        if ($saleUnit !== 'n/a') {
            $saleUnitData = Unit::where('unit_name', $saleUnit)->first();
            if ($saleUnitData) {
                if ($saleUnitData->operator === '*') {
                    $quantity = $qty * (float) $saleUnitData->operation_value;
                } elseif ($saleUnitData->operator === '/') {
                    $quantity = $qty / (float) $saleUnitData->operation_value;
                }
            }
        }

        if ($product->is_variant && $variantId) {
            $variantRow = ProductVariant::find($variantId);
            if ($variantRow) {
                $variantRow->qty += $quantity;
                $variantRow->save();
            }
            $warehouseRow = Product_Warehouse::FindProductWithVariant(
                $product->id,
                $variantId,
                $warehouseId,
            )->first();
        } elseif ($batchId) {
            $batch = ProductBatch::find($batchId);
            if ($batch) {
                $batch->qty += $quantity;
                $batch->save();
            }
            $warehouseRow = Product_Warehouse::where([
                ['product_batch_id', $batchId],
                ['warehouse_id', $warehouseId],
            ])->first();
        } else {
            $warehouseRow = Product_Warehouse::FindProductWithoutVariant($product->id, $warehouseId)->first();
        }

        $product->qty += $quantity;

        if ($warehouseRow) {
            $warehouseRow->qty += $quantity;
            if ($imei !== '' && !str_contains($imei, 'null')) {
                $warehouseRow->imei_number = $warehouseRow->imei_number
                    ? $warehouseRow->imei_number.','.$imei
                    : $imei;
            }
            $warehouseRow->save();
        }

        $product->save();
    }

    private function findSaleByReference(string $referenceNo): ?Sale
    {
        $referenceNo = trim($referenceNo);
        if ($referenceNo === '') {
            return null;
        }

        $sale = Sale::whereNull('deleted_at')
            ->where('reference_no', $referenceNo)
            ->first();

        if ($sale) {
            return $sale;
        }

        $compact = preg_replace('/[\s-]+/', '', strtolower($referenceNo));

        return Sale::whereNull('deleted_at')
            ->whereRaw(
                "LOWER(REPLACE(REPLACE(TRIM(reference_no), '-', ''), ' ', '')) = ?",
                [$compact]
            )
            ->first();
    }
}
