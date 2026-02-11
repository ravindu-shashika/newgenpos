<?php

namespace App\Http\Controllers;

use App\Models\Biller;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\GeneralSetting;
use App\Models\MailSetting;
use App\Models\MobileToken;
use App\Models\PosSetting;
use App\Models\RewardPointSetting;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class SettingApiController extends Controller
{
    use \App\Traits\CacheForget;
    use \App\Traits\TenantInfo;

    /**
     * Get general setting form data.
     */
    public function getGeneralSetting()
    {
        try {
            $setting = GeneralSetting::latest()->first();
            $currencies = Currency::get(['id', 'name', 'code']);
            $zones = [];
            foreach (timezone_identifiers_list() as $zone) {
                date_default_timezone_set($zone);
                $zones[] = ['zone' => $zone, 'diff_from_GMT' => 'UTC/GMT ' . date('P', time())];
            }
            return response()->json(['status' => 200, 'data' => $setting, 'currencies' => $currencies, 'zones' => $zones]);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Save general setting.
     */
    public function saveGeneralSetting(Request $request)
    {
        try {
            $data = $request->except('site_logo', 'dark_logo', 'favicon');
            $general_setting = GeneralSetting::latest()->first();
            if (!$general_setting) {
                $general_setting = new GeneralSetting();
                $general_setting->site_title = $data['site_title'] ?? 'POS';
                $general_setting->currency = $data['currency'] ?? 1;
                $general_setting->staff_access = $data['staff_access'] ?? 'all';
                $general_setting->without_stock = $data['without_stock'] ?? 'no';
                $general_setting->date_format = $data['date_format'] ?? 'd-m-Y';
                $general_setting->theme = 'default.css';
                $general_setting->currency_position = $data['currency_position'] ?? 'prefix';
            }

            foreach (['is_rtl', 'is_zatca', 'disable_signup', 'disable_forgot_password'] as $bool) {
                $general_setting->$bool = isset($data[$bool]) ? true : false;
            }

            $general_setting->site_title = $data['site_title'] ?? $general_setting->site_title;
            $general_setting->company_name = $data['company_name'] ?? null;
            $general_setting->vat_registration_number = $data['vat_registration_number'] ?? null;
            $general_setting->currency = $data['currency'] ?? $general_setting->currency;
            $general_setting->currency_position = $data['currency_position'] ?? 'prefix';
            $general_setting->decimal = $data['decimal'] ?? 2;
            $general_setting->staff_access = $data['staff_access'] ?? 'all';
            $general_setting->without_stock = $data['without_stock'] ?? 'no';
            $general_setting->is_packing_slip = $data['is_packing_slip'] ?? false;
            $general_setting->date_format = $data['date_format'] ?? 'd-m-Y';
            $general_setting->developed_by = $data['developed_by'] ?? null;
            $general_setting->invoice_format = $data['invoice_format'] ?? 'standard';
            $general_setting->state = $data['state'] ?? 1;
            $general_setting->margin_type = $data['margin_type'] ?? 0;
            $general_setting->default_margin_value = $data['default_margin_value'] ?? 0;
            $general_setting->font_css = $data['font_css'] ?? null;
            $general_setting->auth_css = $data['auth_css'] ?? null;
            $general_setting->pos_css = $data['pos_css'] ?? null;
            $general_setting->custom_css = $data['custom_css'] ?? null;
            $general_setting->expiry_alert_days = $data['expiry_alert_days'] ?? 30;
            $general_setting->show_products_details_in_sales_table = $data['show_products_details_in_sales_table'] ?? 0;
            $general_setting->show_products_details_in_purchase_table = $data['show_products_details_in_purchase_table'] ?? 0;
            $general_setting->timezone = $data['timezone'] ?? config('app.timezone');
            $general_setting->maintenance_allowed_ips = $data['maintenance_allowed_ips'] ?? null;

            if ($request->hasFile('site_logo')) {
                $logo = $request->file('site_logo');
                $name = date('Ymdhis') . '.' . $logo->getClientOriginalExtension();
                $logo->move(public_path('logo'), $name);
                $general_setting->site_logo = $name;
            }
            // dark_logo - only if column exists
            if ($request->hasFile('dark_logo') && Schema::hasColumn('general_settings', 'dark_logo')) {
                $logo = $request->file('dark_logo');
                $name = date('Ymdhis') . '_dark.' . $logo->getClientOriginalExtension();
                $logo->move(public_path('logo'), $name);
                $general_setting->dark_logo = $name;
            }
            if ($request->hasFile('favicon')) {
                $logo = $request->file('favicon');
                $name = date('Ymdhis') . 'fav.' . $logo->getClientOriginalExtension();
                $logo->move(public_path('logo'), $name);
                $general_setting->favicon = $name;
            }

            $general_setting->save();
            cache()->forget('general_setting');

            return response()->json(['status' => 200, 'message' => 'General setting saved successfully']);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get mail setting.
     */
    public function getMailSetting()
    {
        try {
            $setting = MailSetting::latest()->first();
            return response()->json(['status' => 200, 'data' => $setting]);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Save mail setting.
     */
    public function saveMailSetting(Request $request)
    {
        try {
            $request->validate([
                'driver' => 'required|string',
                'host' => 'required|string',
                'port' => 'required|string',
                'from_address' => 'required|email',
                'from_name' => 'required|string',
                'username' => 'required|string',
                'password' => 'required|string',
                'encryption' => 'required|string',
            ]);

            $setting = MailSetting::latest()->first() ?? new MailSetting();
            $setting->driver = $request->driver;
            $setting->host = $request->host;
            $setting->port = $request->port;
            $setting->from_address = $request->from_address;
            $setting->from_name = $request->from_name;
            $setting->username = $request->username;
            $setting->password = trim($request->password);
            $setting->encryption = $request->encryption;
            $setting->save();

            return response()->json(['status' => 200, 'message' => 'Mail setting saved successfully']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['status' => 400, 'message' => $e->errors()], 400);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get reward point setting.
     */
    public function getRewardPointSetting()
    {
        try {
            $setting = RewardPointSetting::latest()->first();
            return response()->json(['status' => 200, 'data' => $setting]);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Save reward point setting.
     */
    public function saveRewardPointSetting(Request $request)
    {
        try {
            $data = $request->all();
            $data['is_active'] = isset($data['is_active']);

            $setting = RewardPointSetting::latest()->first();
            if ($setting) {
                $setting->update($data);
            } else {
                RewardPointSetting::create($data);
            }

            return response()->json(['status' => 200, 'message' => 'Reward point setting saved successfully']);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get POS setting form data.
     */
    public function getPosSetting()
    {
        try {
            $setting = PosSetting::latest()->first();
            $customers = Customer::where('is_active', true)->get(['id', 'name', 'phone_number']);
            $billers = Biller::where('is_active', true)->get(['id', 'name', 'company_name']);
            $warehouses = Warehouse::where('is_active', true)->get(['id', 'name']);
            $options = $setting ? explode(',', $setting->payment_options ?? '') : ['cash', 'card', 'credit'];
            return response()->json([
                'status' => 200,
                'data' => $setting,
                'customers' => $customers,
                'billers' => $billers,
                'warehouses' => $warehouses,
                'options' => array_filter($options),
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Save POS setting.
     */
    public function savePosSetting(Request $request)
    {
        try {
            $options = $request->options;
            $optionsStr = is_array($options) ? implode(',', array_filter($options)) : $options;

            $setting = PosSetting::latest()->first() ?? new PosSetting();
            $setting->customer_id = $request->customer_id;
            $setting->biller_id = $request->biller_id;
            $setting->warehouse_id = $request->warehouse_id;
            $setting->product_number = $request->product_number ?? 16;
            $setting->keybord_active = (bool) $request->keybord_active;
            $setting->is_table = (bool) $request->is_table;
            $setting->send_sms = (bool) $request->send_sms;
            $setting->cash_register = (bool) $request->cash_register;
            $setting->show_print_invoice = (bool) $request->show_print_invoice;
            $setting->payment_options = $optionsStr;
            $setting->save();

            $this->cacheForget('pos_setting');
            return response()->json(['status' => 200, 'message' => 'POS setting saved successfully']);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get app setting (server URL, app key, devices).
     */
    public function getAppSetting()
    {
        try {
            $general = GeneralSetting::latest()->first();
            if (!$general->app_key) {
                $general->app_key = rand(100000, 999999);
                $general->save();
            }
            $installUrl = (config()->has('database.connections.saleprosaas_landlord') && config('database.connections.saleprosaas_landlord'))
                ? 'https://' . $this->getTenantId() . '.' . (env('CENTRAL_DOMAIN') ?? 'localhost')
                : config('app.url');
            $tokens = MobileToken::where('is_active', true)->get();
            return response()->json([
                'status' => 200,
                'install_url' => $installUrl,
                'app_key' => $general->app_key,
                'qr_url' => $installUrl . '?app_key=' . $general->app_key,
                'devices' => $tokens,
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete mobile token (device).
     */
    public function deleteAppToken($id)
    {
        try {
            MobileToken::findOrFail($id)->update(['is_active' => false]);
            return response()->json(['status' => 200, 'message' => 'Device removed successfully']);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }
}
