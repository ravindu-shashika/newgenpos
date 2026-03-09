<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CurrencyResource;
use App\Http\Requests\CurrencyRequest;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\Currency;
use App\Models\GeneralSetting;
use Auth;
use Cache;

class CurrencyController extends Controller
{
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('currency')) {
            $currencies = Currency::where('is_active', true)->get();
            return response()->json(CurrencyResource::collection($currencies));
        }
        else
            return response()->json(['not_permitted'=>'Sorry! You are not allowed to access this module']);
    }
    
    public function store(CurrencyRequest $request)
    {
        $currency = Currency::create($request->validated());
        cache()->forget('currency');
        return response()->json([
            'success' => true,
            'message' => 'Currency created successfully.',
            'data' => new CurrencyResource($currency),
        ], 201);
    }
    
    public function update(CurrencyRequest $request, Currency $currency)
    {
        $data = $request->validated();
        if($data['exchange_rate'] == 1) {
            GeneralSetting::latest()->first()->update(['currency' => $currency->id]);
        }
        $currency->update($data);
        cache()->forget('currency');
        return response()->json([
            'success' => true,
            'message' => 'Currency updated successfully.',
            'data' => new CurrencyResource($currency),
        ], 200);
    }

    public function destroy(Currency $currency)
    {
        $currency->update(['is_active' => false]);
        cache()->forget('currency');
        return response()->json([
            'success' => true,
            'message' => 'Currency has been deleted successfully.'
        ], 200);
    }
}
