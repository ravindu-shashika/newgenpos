<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use App\Models\GeneralSetting;
use App\Models\Role;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CurrencyController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('currency');
    }

    protected function getDefaultCurrency(): ?Currency
    {
        $setting = GeneralSetting::latest()->first();
        if ($setting?->currency) {
            return Currency::find($setting->currency);
        }

        return Currency::where('is_active', true)->where('exchange_rate', 1)->first();
    }

    protected function formatCurrency(Currency $currency): array
    {
        $default = $this->getDefaultCurrency();

        return [
            'id' => $currency->id,
            'name' => $currency->name,
            'code' => $currency->code,
            'symbol' => $currency->symbol,
            'exchange_rate' => $currency->exchange_rate,
            'is_default' => $default && (int) $default->id === (int) $currency->id,
        ];
    }

    protected function metadataPayload(): array
    {
        $default = $this->getDefaultCurrency();

        return [
            'default_currency' => $default ? [
                'id' => $default->id,
                'name' => $default->name,
                'exchange_rate' => $default->exchange_rate,
            ] : null,
        ];
    }

    protected function denyAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function validateExchangeRate(Request $request, ?int $currencyId = null): ?string
    {
        $rate = $request->input('exchange_rate');
        if ((float) $rate != 1) {
            return null;
        }

        $default = $this->getDefaultCurrency();
        if (!$default) {
            return null;
        }

        if ($currencyId && (int) $default->id === (int) $currencyId) {
            return null;
        }

        return __('db.Only default currency can have 1 as exchange rate. Please change the exchange rate of your default currency')
            . ' - ' . $default->name;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $lims_currency_all = Currency::where('is_active', true)->orderBy('name')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_currency_all->map(fn ($currency) => $this->formatCurrency($currency)),
                'metadata' => $this->metadataPayload(),
            ]);
        }

        return view('backend.currency.index', compact('lims_currency_all'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $this->validate($request, [
            'name' => 'required|max:255',
            'code' => 'required|max:255',
            'symbol' => 'nullable|max:255',
            'exchange_rate' => 'required|numeric|min:0.0000001',
        ]);

        if ($message = $this->validateExchangeRate($request)) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => $message], 422);
            }

            return redirect()->back()->with('not_permitted', $message);
        }

        $data = $request->only(['name', 'code', 'symbol', 'exchange_rate']);
        $data['is_active'] = true;
        $currency = Currency::create($data);
        cache()->forget('currency');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Currency created successfully'),
                'data' => $this->formatCurrency($currency),
            ], 201);
        }

        return redirect()->back()->with('message', __('db.Currency created successfully'));
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $currencyId = (int) ($request->input('currency_id') ?: $id);
        $currency = Currency::find($currencyId);

        if (!$currency) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Currency not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Currency not found'));
        }

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('currencies')->ignore($currencyId)->where(fn ($query) => $query->where('is_active', true)),
            ],
            'code' => 'required|max:255',
            'symbol' => 'nullable|max:255',
            'exchange_rate' => 'required|numeric|min:0.0000001',
        ]);

        if ($message = $this->validateExchangeRate($request, $currencyId)) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => $message], 422);
            }

            return redirect()->back()->with('not_permitted', $message);
        }

        $data = $request->only(['name', 'code', 'symbol', 'exchange_rate']);

        if ((float) $data['exchange_rate'] == 1) {
            GeneralSetting::latest()->first()?->update(['currency' => $currencyId]);
        }

        $currency->update($data);
        cache()->forget('currency');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Currency updated successfully'),
                'data' => $this->formatCurrency($currency->fresh()),
            ]);
        }

        return redirect()->back()->with('message', __('db.Currency updated successfully'));
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        $currency = Currency::find($id);
        if (!$currency) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Currency not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Currency not found'));
        }

        if ((float) $currency->exchange_rate == 1) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Default currency cannot be deleted'),
                ], 422);
            }

            return redirect()->back()->with('not_permitted', __('db.Default currency cannot be deleted'));
        }

        $currency->update(['is_active' => false]);
        cache()->forget('currency');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Currency deleted successfully'),
            ]);
        }

        return redirect()->back()->with('message', __('db.Currency deleted successfully'));
    }
}
