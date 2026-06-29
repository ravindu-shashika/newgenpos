<?php

namespace App\Services;

use App\Models\ReturnSaleSettlement;
use App\Models\Returns;
use App\Services\Concerns\RunsPosSyncTransaction;

class PosReturnSettlementService
{
    use RunsPosSyncTransaction;

    /**
     * Apply return credit against a completed sale (no cash refund).
     *
     * @param  array<int, array{return_id?: int, return_client_uuid?: string, amount: float|int|string}>  $settlements
     */
    public function applySettlements(int $saleId, array $settlements, int $userId): void
    {
        if ($settlements === []) {
            return;
        }

        $this->runPosSyncTransaction(function () use ($saleId, $settlements, $userId) {
            foreach ($settlements as $row) {
                if (!is_array($row)) {
                    continue;
                }

                $amount = (float) ($row['amount'] ?? 0);
                if ($amount <= 0) {
                    continue;
                }

                $return = null;
                if (!empty($row['return_id'])) {
                    $return = Returns::find((int) $row['return_id']);
                } elseif (!empty($row['return_client_uuid'])) {
                    $return = Returns::where('client_uuid', $row['return_client_uuid'])->first();
                }

                if (!$return) {
                    continue;
                }

                $remaining = (float) $return->grand_total - (float) ($return->settled_amount ?? 0);
                if ($remaining <= 0) {
                    continue;
                }

                $apply = min($amount, $remaining);

                ReturnSaleSettlement::create([
                    'return_id' => $return->id,
                    'sale_id' => $saleId,
                    'amount' => $apply,
                    'user_id' => $userId,
                ]);

                $return->settled_amount = (float) ($return->settled_amount ?? 0) + $apply;
                $return->save();
            }
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function pendingCredits(int $warehouseId, ?int $customerId = null): array
    {
        $q = Returns::query()
            ->where('warehouse_id', $warehouseId)
            ->whereRaw('grand_total > COALESCE(settled_amount, 0)');

        if ($customerId) {
            $q->where('customer_id', $customerId);
        }

        return $q->orderByDesc('id')->limit(50)->get()->map(function (Returns $row) {
            $remaining = (float) $row->grand_total - (float) ($row->settled_amount ?? 0);

            return [
                'return_id' => $row->id,
                'client_uuid' => $row->client_uuid,
                'reference_no' => $row->reference_no,
                'sale_id' => $row->sale_id,
                'customer_id' => $row->customer_id,
                'grand_total' => (float) $row->grand_total,
                'settled_amount' => (float) ($row->settled_amount ?? 0),
                'credit_remaining' => $remaining,
                'created_at' => $row->created_at?->toIso8601String(),
            ];
        })->values()->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function lookupByReference(string $referenceNo, int $warehouseId, ?int $customerId = null): ?array
    {
        $referenceNo = trim($referenceNo);
        if ($referenceNo === '') {
            return null;
        }

        $compact = preg_replace('/[\s-]+/', '', strtolower($referenceNo));

        $q = Returns::query()
            ->where('warehouse_id', $warehouseId)
            ->whereRaw('grand_total > COALESCE(settled_amount, 0)');

        if ($customerId) {
            $q->where('customer_id', $customerId);
        }

        $row = $q->where(function ($query) use ($referenceNo, $compact) {
            $query->where('reference_no', $referenceNo)
                ->orWhere('client_uuid', $referenceNo)
                ->orWhereRaw(
                    "LOWER(REPLACE(REPLACE(TRIM(reference_no), '-', ''), ' ', '')) = ?",
                    [$compact]
                );
        })->orderByDesc('id')->first();

        if (!$row) {
            return null;
        }

        $remaining = (float) $row->grand_total - (float) ($row->settled_amount ?? 0);
        if ($remaining <= 0) {
            return null;
        }

        return [
            'return_id' => $row->id,
            'client_uuid' => $row->client_uuid,
            'reference_no' => $row->reference_no,
            'sale_id' => $row->sale_id,
            'customer_id' => $row->customer_id,
            'grand_total' => (float) $row->grand_total,
            'settled_amount' => (float) ($row->settled_amount ?? 0),
            'credit_remaining' => $remaining,
        ];
    }
}
