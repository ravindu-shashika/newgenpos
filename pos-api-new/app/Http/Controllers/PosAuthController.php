<?php

namespace App\Http\Controllers;

use App\Models\Terminal;
use App\Models\Warehouse;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Flutter POS device auth — app generates client_token, server returns pos_token.
 */
class PosAuthController extends Controller
{
    use SpaResponse;

    /** List active warehouses for POS device registration. GET /pos/warehouses */
    public function warehouses(Request $request)
    {
        $warehouses = Warehouse::query()
            ->when(Schema::hasColumn('warehouses', 'is_active'), fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'warehouses' => $warehouses,
        ]);
    }

    /**
     * Self-register POS device using MAC address + app-generated activation token.
     *
     * POST /pos/register
     */
    public function register(Request $request)
    {
        $request->validate([
            'mac_address' => 'required|string|max:64',
            'activation_token' => 'required|string|max:128',
            'device_id' => 'required|string|max:191',
            'client_token' => 'required|string|max:128',
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'name' => 'nullable|string|max:191',
        ]);

        $mac = $this->normalizeMacAddress($request->input('mac_address'));
        if (!$mac) {
            return response()->json(['message' => 'Invalid MAC address.'], 422);
        }

        $code = 'MAC-' . str_replace(':', '', $mac);
        $terminal = Terminal::withoutGlobalScopes()->where('code', $code)->first();

        if (!$terminal) {
            $terminal = Terminal::create([
                'name' => $request->input('name') ?: ('POS ' . $mac),
                'code' => $code,
                'activation_token' => $request->input('activation_token'),
                'warehouse_id' => $request->integer('warehouse_id'),
                'is_active' => false,
                'is_delete' => false,
                'activated_at' => null,
            ]);
        } elseif ($terminal->is_delete) {
            $terminal->update([
                'is_delete' => false,
                'is_active' => false,
                'activated_at' => null,
                'name' => $request->input('name') ?: $terminal->name,
                'warehouse_id' => $request->integer('warehouse_id'),
                'activation_token' => $request->input('activation_token'),
                'device_id' => null,
                'pos_token' => null,
                'pos_token_issued_at' => null,
                'client_token' => null,
            ]);
        } elseif (
            $terminal->device_id
            && $terminal->device_id !== $request->input('device_id')
            && $terminal->activation_token !== $request->input('activation_token')
        ) {
            return response()->json([
                'message' => 'This terminal is already registered to another device.',
            ], 409);
        }

        return response()->json($this->issuePosTokenForTerminal(
            $terminal,
            $request->input('device_id'),
            $request->input('client_token'),
            $request->input('name'),
            $request->ip(),
            $request->input('activation_token'),
            $request->integer('warehouse_id'),
        ));
    }

    /**
     * Exchange terminal credentials + app-generated client_token for a POS API token.
     *
     * POST /pos/auth/token
     */
    public function issueToken(Request $request)
    {
        $request->validate([
            'code' => 'required_without:terminal_id|string|max:64',
            'terminal_id' => 'required_without:code|integer',
            'activation_token' => 'required|string|max:128',
            'device_id' => 'required|string|max:191',
            'client_token' => 'required|string|max:128',
            'name' => 'nullable|string|max:191',
        ]);

        $query = Terminal::query()
            ->where('activation_token', $request->input('activation_token'));

        if ($request->filled('terminal_id')) {
            $terminal = (clone $query)->where('id', $request->input('terminal_id'))->first();
        } else {
            $terminal = (clone $query)->where('code', $request->input('code'))->first();
        }

        if (!$terminal) {
            return response()->json(['message' => 'Invalid terminal code or activation token.'], 422);
        }

        if (!$terminal->is_active) {
            return response()->json([
                'message' => 'This terminal is not activated. Contact your administrator.',
            ], 403);
        }

        $deviceId = $request->input('device_id');
        if ($terminal->device_id && $terminal->device_id !== $deviceId) {
            return response()->json([
                'message' => 'This terminal is already registered to another device.',
            ], 409);
        }

        return response()->json($this->issuePosTokenForTerminal(
            $terminal,
            $deviceId,
            $request->input('client_token'),
            $request->input('name'),
            $request->ip(),
        ));
    }

    /** Check whether this device terminal is active (public). POST /pos/terminal/status */
    public function terminalStatus(Request $request)
    {
        $request->validate([
            'mac_address' => 'required_without:device_id|string|max:64',
            'device_id' => 'required_without:mac_address|string|max:191',
        ]);

        $terminal = null;

        if ($request->filled('mac_address')) {
            $mac = $this->normalizeMacAddress($request->input('mac_address'));
            if ($mac) {
                $code = 'MAC-' . str_replace(':', '', $mac);
                $terminal = Terminal::where('code', $code)->where('is_delete', false)->first();
            }
        }

        if (!$terminal && $request->filled('device_id')) {
            $terminal = Terminal::where('device_id', $request->input('device_id'))
                ->where('is_delete', false)
                ->first();
        }

        if (!$terminal) {
            return response()->json(['message' => 'Terminal not found.'], 404);
        }

        $terminal->load('warehouse:id,name');

        return response()->json([
            'is_active' => (bool) $terminal->is_active,
            'terminal' => [
                'id' => $terminal->id,
                'name' => $terminal->name,
                'code' => $terminal->code,
                'warehouse_id' => $terminal->warehouse_id,
                'warehouse_name' => $terminal->warehouse?->name,
                'is_active' => (bool) $terminal->is_active,
            ],
        ]);
    }

    /** Validate current POS token (GET /pos/auth/me). */
    public function me(Request $request)
    {
        $terminal = $request->attributes->get('pos_terminal');
        if (!$terminal) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $terminal->load('warehouse:id,name');

        return response()->json([
            'terminal' => [
                'id' => $terminal->id,
                'name' => $terminal->name,
                'code' => $terminal->code,
                'warehouse_id' => $terminal->warehouse_id,
                'warehouse_name' => $terminal->warehouse?->name,
                'device_id' => $terminal->device_id,
                'is_active' => (bool) $terminal->is_active,
                'last_active' => $terminal->last_active?->toIso8601String(),
            ],
        ]);
    }

    private function issuePosTokenForTerminal(
        Terminal $terminal,
        string $deviceId,
        string $clientToken,
        ?string $name,
        ?string $ip,
        ?string $activationToken = null,
        ?int $warehouseId = null,
    ): array {
        $posToken = $this->generatePosToken();

        $updates = [
            'device_id' => $deviceId,
            'client_token' => $clientToken,
            'pos_token' => $posToken,
            'pos_token_issued_at' => now(),
            'ip' => $ip,
            'last_active' => now(),
            'name' => $name ?: $terminal->name,
        ];

        if ($activationToken) {
            $updates['activation_token'] = $activationToken;
        }

        if ($warehouseId) {
            $updates['warehouse_id'] = $warehouseId;
        }

        $terminal->update($updates);
        $terminal->load('warehouse:id,name');

        return [
            'message' => 'POS token issued.',
            'pos_token' => $posToken,
            'token_type' => 'Bearer',
            'terminal' => [
                'id' => $terminal->id,
                'name' => $terminal->name,
                'code' => $terminal->code,
                'warehouse_id' => $terminal->warehouse_id,
                'warehouse_name' => $terminal->warehouse?->name,
                'device_id' => $terminal->device_id,
                'is_active' => (bool) $terminal->is_active,
            ],
        ];
    }

    private function normalizeMacAddress(string $value): ?string
    {
        $hex = strtoupper(preg_replace('/[^0-9A-Fa-f]/', '', $value) ?? '');
        if (strlen($hex) !== 12) {
            return null;
        }

        return implode(':', str_split($hex, 2));
    }

    private function generatePosToken(): string
    {
        do {
            $token = 'pos_' . Str::random(48);
        } while (Terminal::withoutGlobalScopes()->where('pos_token', $token)->exists());

        return $token;
    }
}
