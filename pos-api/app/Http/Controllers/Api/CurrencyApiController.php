<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\GeneralSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Auth;
use Cache;
use Spatie\Permission\Models\Role;

class CurrencyApiController extends Controller
{
    public function index(): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('currency')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $currencies = Currency::where('is_active', true)->orderBy('name')->get();
        return response()->json(['status' => 200, 'data' => $currencies]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'symbol' => 'nullable|string|max:20',
            'exchange_rate' => 'required|numeric|min:0.0000001',
        ]);
        $data = $request->only('name', 'code', 'symbol', 'exchange_rate');
        $data['is_active'] = true;
        Currency::create($data);
        Cache::forget('currency');
        return response()->json(['status' => 200, 'message' => __('db.Currency created successfully')]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'currency_id' => 'required|integer|exists:currencies,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'symbol' => 'nullable|string|max:20',
            'exchange_rate' => 'required|numeric|min:0.0000001',
        ]);
        $currency = Currency::findOrFail($request->currency_id);
        $data = $request->only('name', 'code', 'symbol', 'exchange_rate');
        if (isset($data['exchange_rate']) && $data['exchange_rate'] == 1) {
            GeneralSetting::latest()->first()?->update(['currency' => $currency->id]);
        }
        $currency->update($data);
        Cache::forget('currency');
        return response()->json(['status' => 200, 'message' => __('db.Currency updated successfully')]);
    }

    public function destroy(int $id): JsonResponse
    {
        $currency = Currency::findOrFail($id);
        if ((float) $currency->exchange_rate === 1.0) {
            return response()->json(['status' => 400, 'message' => __('db.Cannot delete default currency')], 200);
        }
        $currency->update(['is_active' => false]);
        Cache::forget('currency');
        return response()->json(['status' => 200, 'message' => __('db.Currency deleted successfully')]);
    }
}
