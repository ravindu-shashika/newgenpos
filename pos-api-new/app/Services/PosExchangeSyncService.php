<?php

namespace App\Services;

use App\Models\PosSyncExchange;
use App\Models\User;
use App\Services\Concerns\RunsPosSyncTransaction;
use Illuminate\Support\Facades\Auth;

class PosExchangeSyncService
{
    use RunsPosSyncTransaction;

    public function __construct(
        private readonly PosExchangeService $exchangeService,
    ) {}

    /**
     * @return array{client_uuid: string, exchange_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    public function acceptAndQueue(array $payload, ?string $deviceId, int $userId): array
    {
        $clientUuid = $payload['client_uuid'] ?? null;
        if (!$clientUuid) {
            return $this->fail('', 'client_uuid is required');
        }

        $existing = PosSyncExchange::where('client_uuid', $clientUuid)->first();
        if ($existing && $existing->exchange_id) {
            return [
                'client_uuid' => $clientUuid,
                'exchange_id' => (int) $existing->exchange_id,
                'reference_no' => $existing->reference_no,
                'status' => 'already_synced',
            ];
        }

        $record = $existing ?? PosSyncExchange::create([
            'client_uuid' => $clientUuid,
            'device_id' => $deviceId,
            'sync_status' => 'pending',
            'payload' => $payload,
        ]);

        $record->update([
            'device_id' => $deviceId,
            'sync_status' => 'pending',
            'payload' => $payload,
            'error_message' => null,
        ]);

        return $this->processRecord($record, $userId);
    }

    /**
     * @return array{client_uuid: string, exchange_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    private function processRecord(PosSyncExchange $record, int $userId): array
    {
        $clientUuid = $record->client_uuid;
        $user = User::find($userId);
        if (!$user) {
            $record->update([
                'sync_status' => 'failed',
                'error_message' => 'User not found for POS exchange sync',
            ]);

            return $this->fail($clientUuid, 'User not found for POS exchange sync');
        }

        Auth::login($user);

        try {
            $result = $this->runPosSyncTransaction(function () use ($record, $userId) {
                $record->update(['sync_status' => 'processing']);

                $payload = $record->payload ?? [];
                $created = $this->exchangeService->createFromPosPayload($payload, $userId);

                $record->update([
                    'exchange_id' => $created['exchange_id'],
                    'reference_no' => $created['reference_no'],
                    'sync_status' => 'synced',
                    'error_message' => null,
                ]);

                return $created;
            });

            return [
                'client_uuid' => $clientUuid,
                'exchange_id' => $result['exchange_id'],
                'reference_no' => $result['reference_no'],
                'status' => 'synced',
            ];
        } catch (\Throwable $e) {
            report($e);
            $record->update([
                'sync_status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return $this->fail($clientUuid, $e->getMessage());
        }
    }

    /**
     * @return array{client_uuid: string, exchange_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    private function fail(string $clientUuid, string $message): array
    {
        return [
            'client_uuid' => $clientUuid,
            'exchange_id' => null,
            'reference_no' => null,
            'status' => 'failed',
            'message' => $message,
        ];
    }
}
