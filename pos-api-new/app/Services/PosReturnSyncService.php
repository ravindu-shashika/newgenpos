<?php

namespace App\Services;

use App\Models\PosSyncReturn;
use App\Models\User;
use App\Services\Concerns\RunsPosSyncTransaction;
use Illuminate\Support\Facades\Auth;

class PosReturnSyncService
{
    use RunsPosSyncTransaction;

    public function __construct(
        private readonly PosReturnService $returnService,
    ) {}

    /**
     * @return array{client_uuid: string, return_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    public function acceptAndQueue(array $payload, ?string $deviceId, int $userId): array
    {
        $clientUuid = $payload['client_uuid'] ?? null;
        if (!$clientUuid) {
            return $this->fail('', 'client_uuid is required');
        }

        $existing = PosSyncReturn::where('client_uuid', $clientUuid)->first();
        if ($existing && $existing->return_id) {
            return [
                'client_uuid' => $clientUuid,
                'return_id' => (int) $existing->return_id,
                'reference_no' => $existing->reference_no,
                'status' => 'already_synced',
            ];
        }

        $record = $existing ?? PosSyncReturn::create([
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
     * @return array{client_uuid: string, return_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    public function processByClientUuid(string $clientUuid, int $userId): array
    {
        $record = PosSyncReturn::where('client_uuid', $clientUuid)->first();
        if (!$record) {
            return $this->fail($clientUuid, 'Sync record not found');
        }

        if ($record->return_id) {
            return [
                'client_uuid' => $clientUuid,
                'return_id' => (int) $record->return_id,
                'reference_no' => $record->reference_no,
                'status' => 'already_synced',
            ];
        }

        return $this->processRecord($record, $userId);
    }

    /**
     * @return array{client_uuid: string, return_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    private function processRecord(PosSyncReturn $record, int $userId): array
    {
        $clientUuid = $record->client_uuid;
        $user = User::find($userId);
        if (!$user) {
            $record->update([
                'sync_status' => 'failed',
                'error_message' => 'User not found for POS return sync',
            ]);

            return $this->fail($clientUuid, 'User not found for POS return sync');
        }

        Auth::login($user);

        try {
            $result = $this->runPosSyncTransaction(function () use ($record, $userId) {
                $record->update(['sync_status' => 'processing']);

                $payload = $record->payload ?? [];
                $payload['refund'] = 0;
                $created = $this->returnService->createFromPosPayload($payload, $userId);

                $record->update([
                    'return_id' => $created['return_id'],
                    'reference_no' => $created['reference_no'],
                    'sync_status' => 'synced',
                    'error_message' => null,
                ]);

                return $created;
            });

            return [
                'client_uuid' => $clientUuid,
                'return_id' => $result['return_id'],
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
     * @return array{client_uuid: string, return_id: int|null, reference_no: string|null, status: string, message?: string}
     */
    private function fail(string $clientUuid, string $message): array
    {
        return [
            'client_uuid' => $clientUuid,
            'return_id' => null,
            'reference_no' => null,
            'status' => 'failed',
            'message' => $message,
        ];
    }
}
