<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\User;
use App\Services\PosSyncUserResolver;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Cash register for Flutter POS (device token + local user_id).
 */
class PosCashRegisterController extends Controller
{
    use SpaResponse;

    public function check(Request $request, int $warehouseId)
    {
        $userId = $this->resolvePosUserId($request);
        if (!$userId) {
            return $this->spaJson($request, [
                'message' => 'user_id is required to check cash register',
            ], 422);
        }

        $open = CashRegister::where([
            ['user_id', $userId],
            ['warehouse_id', $warehouseId],
            ['status', true],
        ])->first();

        return $this->spaJson($request, [
            'open' => (bool) $open,
            'cash_register_id' => $open?->id,
        ]);
    }

    public function open(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'cash_in_hand' => 'required|numeric|min:0',
            'user_id' => 'sometimes|integer|exists:users,id',
        ]);

        $userId = $this->resolvePosUserId($request);
        if (!$userId) {
            return $this->spaJson($request, [
                'message' => 'user_id is required to open cash register',
            ], 422);
        }

        $warehouseId = (int) $request->input('warehouse_id');
        $existing = CashRegister::where([
            ['user_id', $userId],
            ['warehouse_id', $warehouseId],
            ['status', true],
        ])->first();

        if ($existing) {
            return $this->spaJson($request, [
                'message' => __('db.Cash register is already open'),
                'cash_register_id' => $existing->id,
                'open' => true,
            ]);
        }

        $register = CashRegister::create([
            'cash_in_hand' => $request->input('cash_in_hand'),
            'user_id' => $userId,
            'warehouse_id' => $warehouseId,
            'status' => true,
        ]);

        return $this->spaJson($request, [
            'message' => __('db.Cash register created successfully'),
            'cash_register_id' => $register->id,
            'open' => true,
        ]);
    }

    public function details(Request $request, int $id)
    {
        if (!$this->resolvePosUserId($request)) {
            return $this->spaJson($request, [
                'message' => 'user_id is required',
            ], 422);
        }

        return app(CashRegisterController::class)->getDetails($request, $id);
    }

    public function close(Request $request)
    {
        $request->validate([
            'cash_register_id' => 'required|integer|exists:cash_registers,id',
            'closing_balance' => 'required|numeric',
            'actual_cash' => 'required|numeric|min:0',
            'user_id' => 'sometimes|integer|exists:users,id',
        ]);

        if (!$this->resolvePosUserId($request)) {
            return $this->spaJson($request, [
                'message' => 'user_id is required to close cash register',
            ], 422);
        }

        return app(CashRegisterController::class)->close($request);
    }

    protected function resolvePosUserId(Request $request): ?int
    {
        if (Auth::check()) {
            return (int) Auth::id();
        }

        $userId = (int) $request->input('user_id', 0);
        if ($userId > 0) {
            $user = User::where('id', $userId)
                ->where('is_active', true)
                ->where('is_deleted', false)
                ->first();
            if ($user) {
                Auth::setUser($user);

                return $user->id;
            }
        }

        $terminal = $request->attributes->get('pos_terminal');
        $user = app(PosSyncUserResolver::class)->resolve($terminal, null);

        return $user?->id;
    }
}
