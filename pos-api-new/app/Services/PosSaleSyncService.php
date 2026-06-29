<?php

namespace App\Services;

use App\Http\Controllers\SaleController;
use App\Http\Requests\Sale\StoreSaleRequest;
use App\Jobs\SyncPosSaleJob;
use App\Models\PosSyncSale;
use App\Models\User;
use App\Services\Concerns\RunsPosSyncTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PosSaleSyncService
{
    use RunsPosSyncTransaction;

    public function __construct(
        private readonly ?PosReturnSettlementService $returnSettlementService = null,
    ) {}
    /**
     * Accept an offline sale for async processing (HTTP response returns immediately).
     *
     * @return array{client_uuid: string, sale_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    public function acceptAndQueue(array $payload, ?string $deviceId, int $userId): array
    {
        $clientUuid = $payload['client_uuid'] ?? null;
        if (!$clientUuid) {
            return [
                'client_uuid' => '',
                'sale_id' => null,
                'reference_no' => null,
                'status' => 'failed',
                'message' => 'client_uuid is required',
            ];
        }

        $existing = PosSyncSale::where('client_uuid', $clientUuid)->first();
        if ($existing && $existing->sale_id) {
            return [
                'client_uuid' => $clientUuid,
                'sale_id' => (int) $existing->sale_id,
                'reference_no' => $existing->reference_no,
                'status' => 'already_synced',
            ];
        }

        $record = $existing ?? PosSyncSale::create([
            'client_uuid' => $clientUuid,
            'device_id' => $deviceId,
            'sync_status' => 'pending',
            'payload' => $payload,
        ]);

        if ($record->sync_status === 'synced' && $record->sale_id) {
            return [
                'client_uuid' => $clientUuid,
                'sale_id' => (int) $record->sale_id,
                'reference_no' => $record->reference_no,
                'status' => 'already_synced',
            ];
        }

        $record->update([
            'device_id' => $deviceId,
            'sync_status' => 'pending',
            'payload' => $payload,
            'error_message' => null,
        ]);

        SyncPosSaleJob::dispatch($clientUuid, $userId);

        $record->refresh();

        if ($record->sync_status === 'synced' && $record->sale_id) {
            return [
                'client_uuid' => $clientUuid,
                'sale_id' => (int) $record->sale_id,
                'reference_no' => $record->reference_no,
                'status' => 'synced',
            ];
        }

        if ($record->sync_status === 'failed') {
            return [
                'client_uuid' => $clientUuid,
                'sale_id' => null,
                'reference_no' => null,
                'status' => 'failed',
                'message' => $record->error_message,
            ];
        }

        return [
            'client_uuid' => $clientUuid,
            'sale_id' => null,
            'reference_no' => null,
            'status' => 'queued',
        ];
    }

    /**
     * Idempotent POS sale sync from Flutter offline queue (inline / legacy).
     *
     * @return array{client_uuid: string, sale_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    public function syncOne(array $payload, ?string $deviceId = null, ?int $userId = null): array
    {
        $clientUuid = $payload['client_uuid'] ?? null;
        if (!$clientUuid) {
            return [
                'client_uuid' => '',
                'sale_id' => null,
                'reference_no' => null,
                'status' => 'failed',
                'message' => 'client_uuid is required',
            ];
        }

        $existing = PosSyncSale::where('client_uuid', $clientUuid)->first();
        if ($existing && $existing->sale_id) {
            return [
                'client_uuid' => $clientUuid,
                'sale_id' => (int) $existing->sale_id,
                'reference_no' => $existing->reference_no,
                'status' => 'already_synced',
            ];
        }

        $record = $existing ?? PosSyncSale::create([
            'client_uuid' => $clientUuid,
            'device_id' => $deviceId,
            'sync_status' => 'pending',
            'payload' => $payload,
        ]);

        $userId = $userId ?? Auth::id();
        if (!$userId) {
            return [
                'client_uuid' => $clientUuid,
                'sale_id' => null,
                'reference_no' => null,
                'status' => 'failed',
                'message' => 'Authenticated user is required',
            ];
        }

        return $this->processRecord($record, $userId);
    }

    /**
     * Queue worker entry — loads stored payload and creates the sale.
     *
     * @return array{client_uuid: string, sale_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    public function processByClientUuid(string $clientUuid, int $userId): array
    {
        $record = PosSyncSale::where('client_uuid', $clientUuid)->first();
        if (!$record) {
            return [
                'client_uuid' => $clientUuid,
                'sale_id' => null,
                'reference_no' => null,
                'status' => 'failed',
                'message' => 'Sync record not found',
            ];
        }

        if ($record->sale_id) {
            return [
                'client_uuid' => $clientUuid,
                'sale_id' => (int) $record->sale_id,
                'reference_no' => $record->reference_no,
                'status' => 'already_synced',
            ];
        }

        return $this->processRecord($record, $userId);
    }

    /**
     * @return array{client_uuid: string, sale_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    private function processRecord(PosSyncSale $record, int $userId): array
    {
        $clientUuid = $record->client_uuid;
        $payload = $record->payload ?? [];

        $user = User::find($userId);
        if (!$user) {
            $record->update([
                'sync_status' => 'failed',
                'error_message' => 'User not found for POS sync',
            ]);

            return [
                'client_uuid' => $clientUuid,
                'sale_id' => null,
                'reference_no' => null,
                'status' => 'failed',
                'message' => 'User not found for POS sync',
            ];
        }

        Auth::login($user);

        try {
            $result = $this->runPosSyncTransaction(function () use ($record, $payload, $user, $userId) {
                $record->update(['sync_status' => 'processing']);

                $salePayload = $this->normalizeSalePayload($payload);
                $request = Request::create('/api/sales', 'POST', $salePayload);
                $request->setUserResolver(fn () => $user);

                $formRequest = StoreSaleRequest::createFrom($request);
                $formRequest->setContainer(app());
                $formRequest->setRedirector(app('redirect'));
                $formRequest->validateResolved();

                $response = app(SaleController::class)->store($formRequest);

                $saleId = $this->extractSaleIdFromStoreResponse(
                    $response,
                    $salePayload['reference_no'] ?? null
                );

                $settlements = $payload['return_settlements'] ?? [];
                if ($saleId && is_array($settlements) && $settlements !== []) {
                    $settlementService = $this->returnSettlementService ?? app(PosReturnSettlementService::class);
                    $settlementService->applySettlements($saleId, $settlements, $userId);
                }

                $record->update([
                    'sale_id' => $saleId,
                    'reference_no' => $salePayload['reference_no'] ?? null,
                    'sync_status' => 'synced',
                    'error_message' => null,
                ]);

                return [
                    'sale_id' => $saleId,
                    'reference_no' => $record->reference_no,
                ];
            });

            return [
                'client_uuid' => $clientUuid,
                'sale_id' => $result['sale_id'],
                'reference_no' => $result['reference_no'],
                'status' => 'synced',
            ];
        } catch (\Throwable $e) {
            report($e);
            $record->update([
                'sync_status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return [
                'client_uuid' => $clientUuid,
                'sale_id' => null,
                'reference_no' => null,
                'status' => 'failed',
                'message' => $e->getMessage(),
            ];
        }
    }

    private function normalizeSalePayload(array $payload): array
    {
        $data = $payload;
        $data['pos'] = 1;
        $data['draft'] = (int) ($data['draft'] ?? 0);
        $data['coupon_active'] = $data['coupon_active'] ?? 0;
        $data['sale_status'] = (int) ($data['sale_status'] ?? 1);
        $data['payment_status'] = (int) ($data['payment_status'] ?? 4);

        if (!isset($data['reference_no']) || trim((string) $data['reference_no']) === '') {
            if (isset($data['client_uuid'])) {
                $data['reference_no'] = 'posr'.substr(str_replace('-', '', $data['client_uuid']), 0, 20);
            }
        } else {
            $data['reference_no'] = preg_replace('/[\s-]+/', '', trim((string) $data['reference_no']));
        }

        $lines = $data['lines'] ?? $data['products'] ?? [];
        if (is_array($lines) && count($lines) > 0) {
            $data = $this->applyLegacyLineArrays($data, $lines);
            $data = $this->normalizeLegacyTotals($data, $lines);
        }

        $grandTotal = (float) ($data['grand_total'] ?? 0);
        $isDraft = (int) ($data['draft'] ?? 0) === 1;

        if ($isDraft) {
            $data['paid_amount'] = 0;
            $data['paid_by_id'] = [];
            $data['paying_amount'] = [];
        } else {
            $paid = $data['paid_amount'] ?? $grandTotal;
            if (!is_array($paid)) {
                $paid = [(float) $paid];
            }
            $data['paid_amount'] = $paid;

            if (!isset($data['paid_by_id']) || !is_array($data['paid_by_id'])) {
                $data['paid_by_id'] = array_fill(0, count($paid), 1);
            }

            if (!isset($data['paying_amount']) || !is_array($data['paying_amount'])) {
                $data['paying_amount'] = $paid;
            }

            $paidBy = $data['paid_by_id'];
            $paying = $data['paying_amount'];
            $count = count($paid);
            if (!is_array($paidBy) || count($paidBy) !== $count) {
                $data['paid_by_id'] = array_fill(0, $count, 1);
            }
            if (!is_array($paying) || count($paying) !== $count) {
                $data['paying_amount'] = $paid;
            }

            $paidTotal = array_sum(array_map('floatval', $paid));
            if ($paidTotal + 0.0001 >= $grandTotal) {
                $data['payment_status'] = 4;
            } elseif ($paidTotal > 0) {
                $data['payment_status'] = 2;
            } else {
                $data['payment_status'] = 1;
            }
        }

        $data['payment_note'] = $data['payment_note'] ?? '';
        $data['account_id'] = $data['account_id'] ?? 0;
        $data['currency_id'] = $data['currency_id'] ?? 1;
        $data['exchange_rate'] = $data['exchange_rate'] ?? 1;

        if (!isset($data['item'])) {
            $data['item'] = is_array($lines) ? count($lines) : 0;
        }

        return $data;
    }

    /** Match legacy pos.blade.php hidden fields: total_price, order_tax, total_tax. */
    private function normalizeLegacyTotals(array $data, array $lines): array
    {
        $lineTax = 0.0;
        $totalPrice = 0.0;
        foreach ($lines as $line) {
            if (!is_array($line)) {
                continue;
            }
            $lineTax += (float) ($line['tax'] ?? 0);
            $totalPrice += (float) ($line['subtotal'] ?? $line['total'] ?? 0);
        }

        if ($totalPrice > 0) {
            $data['total_price'] = $totalPrice;
            $data['total_tax'] = $lineTax;
        }

        $orderDiscount = (float) ($data['order_discount'] ?? 0);
        $orderTaxRate = (float) ($data['order_tax_rate'] ?? 0);
        if (!isset($data['order_tax']) && isset($data['total_price'])) {
            $data['order_tax'] = ((float) $data['total_price'] - $orderDiscount) * ($orderTaxRate / 100);
        }

        return $data;
    }

    /** Match legacy pos.blade.php POST: product_id[], qty[], sale_unit[], etc. */
    private function applyLegacyLineArrays(array $data, array $lines): array
    {
        $productId = [];
        $productCode = [];
        $qty = [];
        $saleUnit = [];
        $netUnitPrice = [];
        $discount = [];
        $taxRate = [];
        $tax = [];
        $subtotal = [];
        $imeiNumber = [];
        $productBatchId = [];
        $variantId = [];

        foreach ($lines as $line) {
            if (!is_array($line)) {
                continue;
            }
            $productId[] = $line['product_id'] ?? null;
            $productCode[] = $line['code'] ?? '';
            $qty[] = $line['qty'] ?? 1;
            $saleUnit[] = $line['sale_unit'] ?? 'pc';
            $netUnitPrice[] = $line['net_unit_price'] ?? $line['price'] ?? 0;
            $discount[] = $line['discount'] ?? 0;
            $taxRate[] = $line['tax_rate'] ?? 0;
            $tax[] = $line['tax'] ?? 0;
            $subtotal[] = $line['subtotal'] ?? $line['total'] ?? 0;
            $imeiNumber[] = $line['imei_number'] ?? '';
            $productBatchId[] = $line['product_batch_id'] ?? null;
            $variantId[] = $line['variant_id'] ?? $line['product_variant_id'] ?? null;
        }

        $data['product_id'] = $productId;
        $data['product_code'] = $productCode;
        $data['qty'] = $qty;
        $data['sale_unit'] = $saleUnit;
        $data['net_unit_price'] = $netUnitPrice;
        $data['discount'] = $discount;
        $data['tax_rate'] = $taxRate;
        $data['tax'] = $tax;
        $data['subtotal'] = $subtotal;
        $data['imei_number'] = $imeiNumber;
        $data['product_batch_id'] = $productBatchId;
        $data['variant_id'] = $variantId;

        $data['products'] = array_map(function ($line) {
            return [
                'product_id' => $line['product_id'] ?? null,
                'code' => $line['code'] ?? '',
                'qty' => $line['qty'] ?? 1,
                'net_unit_price' => $line['net_unit_price'] ?? $line['price'] ?? 0,
                'discount' => $line['discount'] ?? 0,
                'tax_rate' => $line['tax_rate'] ?? 0,
                'tax' => $line['tax'] ?? 0,
                'subtotal' => $line['subtotal'] ?? $line['total'] ?? 0,
                'sale_unit' => $line['sale_unit'] ?? 'pc',
                'product_batch_id' => $line['product_batch_id'] ?? null,
                'variant_id' => $line['variant_id'] ?? $line['product_variant_id'] ?? null,
                'imei_number' => $line['imei_number'] ?? '',
            ];
        }, $lines);

        return $data;
    }

    private function extractSaleIdFromStoreResponse($response, ?string $referenceNo): ?int
    {
        if ($referenceNo) {
            $sale = DB::table('sales')->where('reference_no', $referenceNo)->orderByDesc('id')->first();
            if ($sale) {
                return (int) $sale->id;
            }
        }

        if (method_exists($response, 'getData')) {
            $data = $response->getData(true);
            if (!empty($data['sale_id'])) {
                return (int) $data['sale_id'];
            }
            if (!empty($data['data']['id'])) {
                return (int) $data['data']['id'];
            }
        }

        return null;
    }
}
