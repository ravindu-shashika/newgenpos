<?php

namespace App\Http\Controllers;

use ZipArchive;
use Clickatell\Rest;
use App\Models\Biller;
use App\Models\Account;
use Twilio\Rest\Client;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\Warehouse;
use App\Models\HrmSetting;
use App\Models\PosSetting;
use App\Models\MailSetting;
use App\Models\MobileToken;
use App\Models\SmsTemplate;
use App\Services\SmsService;
use Illuminate\Http\Request;
use App\Models\CustomerGroup;
use App\Models\GeneralSetting;
use App\Models\ExternalService;
use App\Models\RewardPointSetting;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;
use App\Models\Role as AppRole;
use Spatie\Permission\Models\Role;
use Clickatell\ClickatellException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;

class SettingController extends Controller
{
    use \App\Traits\CacheForget;
    use \App\Traits\TenantInfo;
    use \App\Traits\MailInfo;
    use \App\Traits\SpaResponse;
    private $_smsService;

    public function __construct(SmsService $smsService)
    {
        $this->_smsService = $smsService;
    }

    protected function userCanAccessGeneralSetting(): bool
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

        $role = AppRole::find($user->role_id);

        return $role && $role->hasPermissionTo('general_setting');
    }

    protected function denyGeneralSettingAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function buildTimezoneOptions(): array
    {
        $zones_array = [];
        $timestamp = time();
        $originalTimezone = date_default_timezone_get();

        foreach (timezone_identifiers_list() as $key => $zone) {
            date_default_timezone_set($zone);
            $zones_array[] = [
                'zone' => $zone,
                'diff_from_GMT' => 'UTC/GMT ' . date('P', $timestamp),
                'label' => 'UTC/GMT ' . date('P', $timestamp) . ' - ' . $zone,
            ];
        }

        date_default_timezone_set($originalTimezone);

        return $zones_array;
    }

    protected function formatGeneralSetting(GeneralSetting $setting): array
    {
        return [
            'id' => $setting->id,
            'site_title' => $setting->site_title,
            'site_logo' => $setting->site_logo,
            'site_logo_url' => $setting->site_logo ? url('logo/' . $setting->site_logo) : null,
            'favicon' => $setting->favicon,
            'favicon_url' => $setting->favicon ? url('logo/' . $setting->favicon) : null,
            'is_rtl' => (bool) $setting->is_rtl,
            'is_zatca' => (bool) $setting->is_zatca,
            'company_name' => $setting->company_name,
            'vat_registration_number' => $setting->vat_registration_number,
            'timezone' => $setting->timezone ?? config('app.timezone'),
            'without_stock' => $setting->without_stock ?? 'no',
            'is_packing_slip' => (string) (int) ($setting->is_packing_slip ?? 0),
            'currency' => $setting->currency,
            'currency_position' => $setting->currency_position ?? 'prefix',
            'show_products_details_in_purchase_table' => (string) (int) ($setting->show_products_details_in_purchase_table ?? 0),
            'show_products_details_in_sales_table' => (string) (int) ($setting->show_products_details_in_sales_table ?? 0),
            'decimal' => $setting->decimal ?? 2,
            'staff_access' => $setting->staff_access ?? 'all',
            'invoice_format' => $setting->invoice_format ?? 'standard',
            'state' => (string) ($setting->state ?? '1'),
            'date_format' => $setting->date_format ?? 'd-m-Y',
            'expiry_alert_days' => $setting->expiry_alert_days,
            'developed_by' => $setting->developed_by,
            'margin_type' => (string) ($setting->margin_type ?? 0),
            'default_margin_value' => $setting->default_margin_value,
            'disable_signup' => (bool) $setting->disable_signup,
            'disable_forgot_password' => (bool) $setting->disable_forgot_password,
            'maintenance_allowed_ips' => $setting->maintenance_allowed_ips,
            'maintenance_mode' => !empty($setting->maintenance_allowed_ips),
            'font_css' => $setting->font_css,
            'auth_css' => $setting->auth_css,
            'pos_css' => $setting->pos_css,
            'custom_css' => $setting->custom_css,
            'app_key' => $setting->app_key,
        ];
    }

    protected function formatRewardPointSetting(?RewardPointSetting $setting): array
    {
        if (!$setting) {
            return [
                'is_active' => false,
                'per_point_amount' => '',
                'minimum_amount' => '',
                'duration' => '',
                'type' => 'days',
                'redeem_amount_per_unit_rp' => '',
                'min_order_total_for_redeem' => '',
                'min_redeem_point' => '',
                'max_redeem_point' => '',
            ];
        }

        return [
            'id' => $setting->id,
            'is_active' => (bool) $setting->is_active,
            'per_point_amount' => $setting->per_point_amount,
            'minimum_amount' => $setting->minimum_amount,
            'duration' => $setting->duration,
            'type' => $setting->type ?? 'days',
            'redeem_amount_per_unit_rp' => $setting->redeem_amount_per_unit_rp,
            'min_order_total_for_redeem' => $setting->min_order_total_for_redeem,
            'min_redeem_point' => $setting->min_redeem_point,
            'max_redeem_point' => $setting->max_redeem_point,
        ];
    }

    protected function userCanAccessRewardPointSetting(): bool
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

        $role = AppRole::find($user->role_id);

        return $role && $role->hasPermissionTo('reward_point_setting');
    }

    protected function denyRewardPointSettingAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function userCanAccessSmsSetting(): bool
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

        $role = AppRole::find($user->role_id);

        return $role && $role->hasPermissionTo('sms_setting');
    }

    protected function denySmsSettingAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function buildSmsSettingPayload(): array
    {
        $settings = ExternalService::all();
        $tonkra = [];
        $revesms = [];
        $bdbulksms = [];
        $twilio = [];
        $clickatell = [];
        $zircon = [];

        foreach ($settings as $setting) {
            if ($setting->name == 'tonkra') {
                $tonkra['sms_id'] = $setting->id ?? '';
                $tonkra['active'] = $setting->active ?? '';
                $tonkra['details'] = json_decode($setting->details) ?? '';
            }

            if ($setting->name == 'revesms') {
                $revesms['sms_id'] = $setting->id ?? '';
                $revesms['active'] = $setting->active ?? '';
                $revesms['details'] = json_decode($setting->details) ?? '';
            }

            if ($setting->name == 'bdbulksms') {
                $bdbulksms['sms_id'] = $setting->id ?? '';
                $bdbulksms['active'] = $setting->active ?? '';
                $bdbulksms['details'] = json_decode($setting->details) ?? '';
            }

            if ($setting->name == 'twilio') {
                $twilio['sms_id'] = $setting->id ?? '';
                $twilio['active'] = $setting->active ?? '';
                $twilio['details'] = json_decode($setting->details) ?? '';
            }

            if ($setting->name == 'clickatell') {
                $clickatell['sms_id'] = $setting->id ?? '';
                $clickatell['active'] = $setting->active ?? '';
                $clickatell['details'] = json_decode($setting->details) ?? '';
            }
            if ($setting->name == 'zircon') {
                $zircon['sms_id'] = $setting->id ?? '';
                $zircon['active'] = $setting->active ?? '';
                $zircon['details'] = json_decode($setting->details) ?? '';
            }
        }

        $tonkra['sms_id'] = $tonkra['sms_id'] ?? '';
        $tonkra['active'] = $tonkra['active'] ?? '';
        $tonkra['api_token'] = $tonkra['details']->api_token ?? '';
        $tonkra['recipent'] = $tonkra['details']->recipent ?? '';
        $tonkra['sender_id'] = $tonkra['details']->sender_id ?? '';

        $revesms['sms_id'] = $revesms['sms_id'] ?? '';
        $revesms['active'] = $revesms['active'] ?? '';
        $revesms['apikey'] = $revesms['details']->apikey ?? '';
        $revesms['secretkey'] = $revesms['details']->secretkey ?? '';
        $revesms['callerID'] = $revesms['details']->callerID ?? '';

        $bdbulksms['sms_id'] = $bdbulksms['sms_id'] ?? '';
        $bdbulksms['active'] = $bdbulksms['active'] ?? '';
        $bdbulksms['token'] = $bdbulksms['details']->token ?? '';

        $twilio['sms_id'] = $twilio['sms_id'] ?? '';
        $twilio['active'] = $twilio['active'] ?? '';
        $twilio['account_sid'] = $twilio['details']->account_sid ?? '';
        $twilio['auth_token'] = $twilio['details']->auth_token ?? '';
        $twilio['twilio_number'] = $twilio['details']->twilio_number ?? '';

        $clickatell['sms_id'] = $clickatell['sms_id'] ?? '';
        $clickatell['active'] = $clickatell['active'] ?? '';
        $clickatell['api_key'] = $clickatell['details']->api_key ?? '';

        $zircon['sms_id'] = $zircon['sms_id'] ?? '';
        $zircon['active'] = $zircon['active'] ?? '';
        $zircon['user_id'] = $zircon['details']->user_id ?? '';
        $zircon['api_key'] = $zircon['details']->api_key ?? '';
        $zircon['sender_id'] = $zircon['details']->sender_id ?? '';

        return compact('tonkra', 'twilio', 'clickatell', 'revesms', 'bdbulksms', 'zircon');
    }

    protected function formatSmsSettingForSpa(array $payload): array
    {
        $gateways = [];
        $selectedGateway = null;

        foreach (['revesms', 'bdbulksms', 'tonkra', 'twilio', 'clickatell', 'zircon'] as $name) {
            $cfg = $payload[$name] ?? [];
            $gateways[$name] = [
                'sms_id' => $cfg['sms_id'] ?? '',
                'active' => filter_var($cfg['active'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'api_token' => $cfg['api_token'] ?? '',
                'sender_id' => $cfg['sender_id'] ?? '',
                'apikey' => $cfg['apikey'] ?? '',
                'secretkey' => $cfg['secretkey'] ?? '',
                'callerID' => $cfg['callerID'] ?? '',
                'token' => $cfg['token'] ?? '',
                'account_sid' => $cfg['account_sid'] ?? '',
                'auth_token' => $cfg['auth_token'] ?? '',
                'twilio_number' => $cfg['twilio_number'] ?? '',
                'api_key' => $cfg['api_key'] ?? '',
                'user_id' => $cfg['user_id'] ?? '',
            ];

            if ($gateways[$name]['active']) {
                $selectedGateway = $name;
            }
        }

        if (!$selectedGateway) {
            foreach (array_keys($gateways) as $name) {
                if (!empty($gateways[$name]['sms_id'])) {
                    $selectedGateway = $name;
                    break;
                }
            }
        }

        return [
            'gateways' => $gateways,
            'selected_gateway' => $selectedGateway,
            'gateway_options' => array_keys($gateways),
        ];
    }

    protected function userCanAccessPosSetting(): bool
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

        $role = AppRole::find($user->role_id);

        return $role && $role->hasPermissionTo('pos_setting');
    }

    protected function denyPosSettingAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function standardPaymentOptions(): array
    {
        return [
            'cash', 'card', 'credit', 'cheque', 'gift_card', 'deposit',
            'points', 'razorpay', 'pesapal', 'installment',
        ];
    }

    protected function formatPosSetting(?PosSetting $setting): array
    {
        $options = $setting && $setting->payment_options
            ? array_values(array_filter(
                array_map('trim', explode(',', $setting->payment_options)),
                fn ($option) => $option !== '' && $option !== 'none' && $option !== '"none"'
            ))
            : [];

        $standard = $this->standardPaymentOptions();
        $customOptions = array_values(array_filter($options, function ($option) use ($standard) {
            return $option !== '' && !in_array($option, $standard, true);
        }));

        return [
            'id' => $setting->id ?? null,
            'customer_id' => $setting->customer_id ?? '',
            'warehouse_id' => $setting->warehouse_id ?? '',
            'biller_id' => $setting->biller_id ?? '',
            'product_number' => $setting->product_number ?? '',
            'keybord_active' => (bool) ($setting->keybord_active ?? false),
            'is_table' => (bool) ($setting->is_table ?? false),
            'send_sms' => (bool) ($setting->send_sms ?? false),
            'cash_register' => (bool) ($setting->cash_register ?? false),
            'show_print_invoice' => (bool) ($setting->show_print_invoice ?? false),
            'payment_options' => $options,
            'custom_payment_options' => $customOptions,
        ];
    }

    protected function posSettingMetadata(): array
    {
        return [
            'customers' => Customer::where('is_active', true)->orderBy('name')->get()->map(fn ($customer) => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone_number' => $customer->phone_number,
                'label' => trim($customer->name . ($customer->phone_number ? ' (' . $customer->phone_number . ')' : '')),
            ]),
            'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get()->map(fn ($warehouse) => [
                'id' => $warehouse->id,
                'name' => $warehouse->name,
            ]),
            'billers' => Biller::where('is_active', true)->orderBy('name')->get()->map(fn ($biller) => [
                'id' => $biller->id,
                'name' => $biller->name,
                'company_name' => $biller->company_name,
                'label' => trim($biller->name . ($biller->company_name ? ' (' . $biller->company_name . ')' : '')),
            ]),
            'standard_payment_options' => $this->standardPaymentOptions(),
        ];
    }

    protected function formatHrmSetting(?HrmSetting $setting): array
    {
        return [
            'id' => $setting->id ?? null,
            'checkin' => $setting->checkin ?? '',
            'checkout' => $setting->checkout ?? '',
        ];
    }

    protected function userCanAccessHrmSetting(): bool
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

        $role = AppRole::find($user->role_id);

        return $role && $role->hasPermissionTo('hrm_setting');
    }

    protected function denyHrmSettingAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function emptyDatabase()
    {
        if (!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));

        // Clear cached queries
        $this->cacheForget('biller_list');
        $this->cacheForget('brand_list');
        $this->cacheForget('category_list');
        $this->cacheForget('coupon_list');
        $this->cacheForget('customer_list');
        $this->cacheForget('customer_group_list');
        $this->cacheForget('product_list');
        $this->cacheForget('product_list_with_variant');
        $this->cacheForget('warehouse_list');
        $this->cacheForget('tax_list');
        $this->cacheForget('currency');
        $this->cacheForget('general_setting');
        $this->cacheForget('pos_setting');
        $this->cacheForget('user_role');
        $this->cacheForget('permissions');
        $this->cacheForget('role_has_permissions');
        $this->cacheForget('role_has_permissions_list');

        $tables = DB::select('SHOW TABLES');

        if (!config('database.connections.saleprosaas_landlord'))
            $database_name = env('DB_DATABASE');
        else
            $database_name = env('DB_PREFIX') . $this->getTenantId();

        $str = 'Tables_in_' . $database_name;

        // Disable FK checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        foreach ($tables as $table) {
            if (!in_array($table->$str, [
                'accounts',
                'currencies',
                'ecommerce_settings',
                'external_services',
                'general_settings',
                'hrm_settings',
                'invoice_settings',
                'languages',
                'migrations',
                'password_resets',
                'permissions',
                'pos_setting',
                'reward_point_settings',
                'roles',
                'role_has_permissions',
                'translations',
                'users',
            ])) {
                DB::table($table->$str)->truncate();
            }
        }

        // Re-enable FK checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        return redirect()->back()->with('message', __('db.Database cleared successfully'));
    }

    public function activityLog(Request $request)
    {
        $query = DB::table('activity_logs')
            ->join('users', 'activity_logs.user_id', '=', 'users.id')
            ->orderBy('activity_logs.id', 'desc')
            ->select(
                'activity_logs.*',
                'users.username as user_name',
                'users.username as username'
            );

        if (auth()->user()->role_id > 2) {
            $query->where('activity_logs.user_id', auth()->id());
        }

        $activity_log_data = $query->get();

        $general_setting = GeneralSetting::latest()->first();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'date_format' => $general_setting->date_format ?? 'd-m-Y',
                'rows' => $activity_log_data->map(fn ($row) => [
                    'id' => $row->id,
                    'date' => $row->date,
                    'user_id' => $row->user_id,
                    'username' => $row->username ?? $row->user_name,
                    'user_name' => $row->username ?? $row->user_name,
                    'action' => $row->action,
                    'reference_no' => $row->reference_no,
                    'item_description' => $row->item_description,
                    'created_at' => $row->created_at,
                ])->values(),
            ]);
        }

        return view('backend.setting.activity_log', compact('activity_log_data', 'general_setting'));
    }

    public function generalSetting(Request $request)
    {
        if (!$this->userCanAccessGeneralSetting()) {
            return $this->denyGeneralSettingAccess($request);
        }

        $lims_general_setting_data = GeneralSetting::latest()->first();
        $lims_currency_list = Currency::where('is_active', 1)->get();
        $zones_array = $this->buildTimezoneOptions();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_general_setting_data
                    ? $this->formatGeneralSetting($lims_general_setting_data)
                    : [],
                'metadata' => [
                    'currencies' => $lims_currency_list->map(fn ($currency) => [
                        'id' => $currency->id,
                        'name' => $currency->name,
                    ]),
                    'timezones' => $zones_array,
                ],
            ]);
        }

        $lims_account_list = Account::where('is_active', true)->get();

        return view('backend.setting.general_setting', compact(
            'lims_general_setting_data',
            'lims_account_list',
            'zones_array',
            'lims_currency_list'
        ));
    }

    public function appSetting()
    {
        $lims_general_setting_data = GeneralSetting::latest()->first();

        if (empty($lims_general_setting_data->app_key)) {
            $lims_general_setting_data->app_key = rand(100000, 999999);
            $lims_general_setting_data->save();
        }

        if (!config('database.connections.saleprosaas_landlord'))
            $installUrl = config('app.url');
        else
            $installUrl = "https://" . $this->getTenantId() . '.' . env('CENTRAL_DOMAIN');

        $mobile_tokens = MobileToken::where('is_active', true)->get();

        return view('backend.setting.app_setting', compact('installUrl', 'lims_general_setting_data', 'mobile_tokens'));
    }

    public function appSettingDelete($id)
    {
        MobileToken::find($id)->update(['is_active' => false]);
        return redirect()->back()->with('message', __('db.Token deleted successfully'));
    }

    public function generalSettingStore(Request $request)
    {
        if (!$this->userCanAccessGeneralSetting()) {
            return $this->denyGeneralSettingAccess($request);
        }

        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        $this->validate($request, [
            'site_logo' => 'image|mimes:jpg,jpeg,png,gif|max:5120',
            'dark_logo' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
        ]);

        $data = $request->except('site_logo', 'dark_logo');

        $general_setting = GeneralSetting::latest()->first();
        $general_setting->id = 1;
        $general_setting->site_title = $data['site_title'];

        if (isset($data['is_rtl']))
            $general_setting->is_rtl = true;
        else
            $general_setting->is_rtl = false;

        if (isset($data['is_zatca'])) {
            $general_setting->is_zatca = true;
        } else
            $general_setting->is_zatca = false;

        $general_setting->company_name = $data['company_name'];
        $general_setting->vat_registration_number = $data['vat_registration_number'];
        $general_setting->currency = $data['currency'];
        $general_setting->currency_position = $data['currency_position'];
        $general_setting->decimal = $data['decimal'];
        $general_setting->staff_access = $data['staff_access'];
        $general_setting->without_stock = $data['without_stock'];
        $general_setting->is_packing_slip = $data['is_packing_slip'];
        $general_setting->date_format = $data['date_format'];
        $general_setting->developed_by = $data['developed_by'];
        $general_setting->invoice_format = $data['invoice_format'];
        $general_setting->state = $data['state'];
        $general_setting->margin_type = $data['margin_type'];
        $general_setting->default_margin_value = $data['default_margin_value'];
        $general_setting->app_key = $data['app_key'] ?? null;
        $general_setting->font_css = $data['font_css'];
        $general_setting->pos_css = $data['pos_css'];
        $general_setting->auth_css = $data['auth_css'];
        $general_setting->custom_css = $data['custom_css'];
        $general_setting->expiry_alert_days = $data['expiry_alert_days'];

        if (isset($data['disable_signup']))
            $general_setting->disable_signup = true;
        else
            $general_setting->disable_signup = false;

        if (isset($data['disable_forgot_password']))
            $general_setting->disable_forgot_password = true;
        else
            $general_setting->disable_forgot_password = false;

        if ($request->filled('maintenance_allowed_ips')) {

            $userIps = array_filter(array_map(
                'trim',
                explode(',', $request->maintenance_allowed_ips)
            ));

            $currentIp = $request->ip();

            if (!in_array($currentIp, $userIps)) {
                $userIps[] = $currentIp;
            }

            $general_setting->maintenance_allowed_ips = implode(',', array_unique($userIps));
        } else {
            // Checkbox off → IP empty → maintenance off
            $general_setting->maintenance_allowed_ips = null;
        }

        $general_setting->show_products_details_in_sales_table = $data['show_products_details_in_sales_table'];
        $general_setting->show_products_details_in_purchase_table = $data['show_products_details_in_purchase_table'];
        $general_setting->timezone = $request->timezone;
        $logo = $request->site_logo;
        $darkLogo = $request->dark_logo;

        if (isset($data['onesignal_api_key'])) {
            $general_setting->onesignal_api_key = $data['onesignal_api_key'];
        }

        if ($logo) {
            $this->fileDelete('logo/', $general_setting->site_logo);

            $ext = pathinfo($logo->getClientOriginalName(), PATHINFO_EXTENSION);
            $logoName = date("Ymdhis") . '.' . $ext;
            $logo->move(public_path('logo'), $logoName);
            $general_setting->site_logo = $logoName;
        }

        if ($darkLogo) {
            $this->fileDelete('logo/', $general_setting->dark_logo);

            $ext = pathinfo($darkLogo->getClientOriginalName(), PATHINFO_EXTENSION);
            $darkLogoName = date("Ymdhis") . '_dark.' . $ext;
            $darkLogo->move(public_path('logo'), $darkLogoName);
            $general_setting->dark_logo = $darkLogoName;
        }

        $favicon = $request->favicon;
        if ($favicon) {
            $this->fileDelete('logo/', $general_setting->favicon);

            $ext = pathinfo($favicon->getClientOriginalName(), PATHINFO_EXTENSION);
            $faviconName = date("Ymdhis") . 'fav.' . $ext;
            $favicon->move(public_path('logo'), $faviconName);
            $general_setting->favicon = $faviconName;
        }

        // $general_setting->expiry_type = $data['expiry_type'];
        // $general_setting->expiry_value = $data['expiry_value'];

        $general_setting->save();
        cache()->forget('general_setting');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatGeneralSetting($general_setting->fresh()),
            ]);
        }

        return redirect()->back()->with('message', __('db.Data updated successfully'));
    }

    public function rewardPointSetting(Request $request)
    {
        if (!$this->userCanAccessRewardPointSetting()) {
            return $this->denyRewardPointSettingAccess($request);
        }

        $lims_reward_point_setting_data = RewardPointSetting::latest()->first();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatRewardPointSetting($lims_reward_point_setting_data),
            ]);
        }

        return view('backend.setting.reward_point_setting', compact('lims_reward_point_setting_data'));
    }

    public function rewardPointSettingStore(Request $request)
    {
        if (!$this->userCanAccessRewardPointSetting()) {
            return $this->denyRewardPointSettingAccess($request);
        }

        $this->validate($request, [
            'per_point_amount' => 'required|numeric|min:0',
            'minimum_amount' => 'required|numeric|min:0',
            'duration' => 'nullable|integer|min:0',
            'type' => 'nullable|in:days,months,years',
            'redeem_amount_per_unit_rp' => 'nullable|numeric|min:0',
            'min_order_total_for_redeem' => 'nullable|numeric|min:0',
            'min_redeem_point' => 'nullable|integer|min:0',
            'max_redeem_point' => 'nullable|integer|min:0',
        ]);

        $data = $request->only([
            'per_point_amount',
            'minimum_amount',
            'duration',
            'type',
            'redeem_amount_per_unit_rp',
            'min_order_total_for_redeem',
            'min_redeem_point',
            'max_redeem_point',
        ]);
        $data['is_active'] = $request->has('is_active') || $request->boolean('is_active');

        $lims_reward_point_data = RewardPointSetting::latest()->first();

        if ($lims_reward_point_data) {
            $lims_reward_point_data->update($data);
            $record = $lims_reward_point_data->fresh();
        } else {
            $record = RewardPointSetting::create($data);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Reward point setting updated successfully'),
                'data' => $this->formatRewardPointSetting($record),
            ]);
        }

        return redirect()->back()->with('message', __('db.Reward point setting updated successfully'));
    }


    public function backup()
    {
        if (!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));

        // Database configuration
        $host = env('DB_HOST');
        $username = env('DB_USERNAME');
        $password = env('DB_PASSWORD');
        if (!config('database.connections.saleprosaas_landlord'))
            $database_name = env('DB_DATABASE');
        else
            $database_name = env('DB_PREFIX') . $this->getTenantId();

        // Get connection object and set the charset
        $conn = mysqli_connect($host, $username, $password, $database_name);
        $conn->set_charset("utf8");


        // Get All Table Names From the Database
        $tables = array();
        $sql = "SHOW TABLES";
        $result = mysqli_query($conn, $sql);

        while ($row = mysqli_fetch_row($result)) {
            $tables[] = $row[0];
        }

        $sqlScript = "";
        foreach ($tables as $table) {

            // Prepare SQLscript for creating table structure
            $query = "SHOW CREATE TABLE $table";
            $result = mysqli_query($conn, $query);
            $row = mysqli_fetch_row($result);

            $sqlScript .= "\n\n" . $row[1] . ";\n\n";


            $query = "SELECT * FROM $table";
            $result = mysqli_query($conn, $query);

            $columnCount = mysqli_num_fields($result);

            // Prepare SQLscript for dumping data for each table
            for ($i = 0; $i < $columnCount; $i++) {
                while ($row = mysqli_fetch_row($result)) {
                    $sqlScript .= "INSERT INTO $table VALUES(";
                    for ($j = 0; $j < $columnCount; $j++) {
                        $row[$j] = $row[$j];

                        if (isset($row[$j])) {
                            $sqlScript .= '"' . $row[$j] . '"';
                        } else {
                            $sqlScript .= '""';
                        }
                        if ($j < ($columnCount - 1)) {
                            $sqlScript .= ',';
                        }
                    }
                    $sqlScript .= ");\n";
                }
            }

            $sqlScript .= "\n";
        }

        if (!empty($sqlScript)) {
            // Save the SQL script to a backup file
            $backup_file_name = public_path() . '/' . $database_name . '_backup_' . time() . '.sql';
            //return $backup_file_name;
            $fileHandler = fopen($backup_file_name, 'w+');
            $number_of_lines = fwrite($fileHandler, $sqlScript);
            fclose($fileHandler);

            $zip = new ZipArchive();
            $zipFileName = $database_name . '_backup_' . time() . '.zip';
            $zip->open(public_path() . '/' . $zipFileName, ZipArchive::CREATE);
            $zip->addFile($backup_file_name, $database_name . '_backup_' . time() . '.sql');
            $zip->close();
        }
        return redirect('' . $zipFileName);
    }

    public function changeTheme($theme)
    {
        $lims_general_setting_data = GeneralSetting::latest()->first();
        $lims_general_setting_data->theme = $theme;
        $lims_general_setting_data->save();
    }

    public function mailSetting()
    {
        $mail_setting_data = MailSetting::latest()->first();
        return view('backend.setting.mail_setting', compact('mail_setting_data'));
    }

    public function mailSettingStore(Request $request)
    {
        if (!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));

        $data = $request->all();
        $mail_setting = MailSetting::latest()->first();
        if (!$mail_setting)
            $mail_setting = new MailSetting;
        $mail_setting->driver = $data['driver'];
        $mail_setting->host = $data['host'];
        $mail_setting->port = $data['port'];
        $mail_setting->from_address = $data['from_address'];
        $mail_setting->from_name = $data['from_name'];
        $mail_setting->username = $data['username'];
        $mail_setting->password = trim($data['password']);
        $mail_setting->encryption = $data['encryption'];
        $mail_setting->save();

        try {
            $this->setMailInfo($mail_setting);
            // Send test mail to from_address
            Mail::raw(__('db.This is a test mail to confirm your SMTP settings are working.'), function ($message) use ($mail_setting) {
                $message->to($mail_setting->from_address)
                    ->subject(__('db.Test Mail'));
            });

            return redirect()->back()->with(
                'message',
                __('db.data_updated_mail_sent') . ' ' . $mail_setting->from_address
            );
        } catch (\Exception $e) {
            return redirect()->back()->with(
                'not_permitted',
                __('db.data_updated_mail_fail') . ' ' . $e->getMessage()
            );
        }
    }

    public function smsSetting(Request $request)
    {
        if (!$this->userCanAccessSmsSetting()) {
            return $this->denySmsSettingAccess($request);
        }

        $payload = $this->buildSmsSettingPayload();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatSmsSettingForSpa($payload),
            ]);
        }

        return view('backend.setting.sms_setting', $payload);
    }

    public function smsSettingStore(Request $request)
    {
        if (!$this->userCanAccessSmsSetting()) {
            return $this->denySmsSettingAccess($request);
        }

        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        $this->validate($request, [
            'gateway' => 'required|in:revesms,bdbulksms,tonkra,twilio,clickatell,zircon',
        ]);

        $data = $request->all();

        $data['active'] = $request->has('active') || $request->boolean('active') ? 1 : 0;
        $tonkra = [];
        $revesms = [];
        $bdbulksms = [];
        $twilio = [];
        $clickatell = [];
        if ($data['gateway'] == 'zircon') {
            $zircon['user_id']   = $data['user_id'];
            $zircon['api_key']   = $data['api_key'];
            $zircon['sender_id'] = $data['sender_id'];
            $data['details'] = json_encode($zircon);
        }

        if ($data['gateway'] == 'revesms') {
            $revesms['apikey'] = $data['apikey'];
            $revesms['secretkey'] = $data['secretkey'];
            $revesms['callerID'] = $data['callerID'];
            $data['details'] = json_encode($revesms);
        }

        if ($data['gateway'] == 'bdbulksms') {
            $bdbulksms['token'] = $data['token'];
            $data['details'] = json_encode($bdbulksms);
        }

        if ($data['gateway'] == 'twilio') {
            $twilio['account_sid'] = $data['account_sid'];
            $twilio['auth_token'] = $data['auth_token'];
            $twilio['twilio_number'] = $data['twilio_number'];
            $data['details'] = json_encode($twilio);
        }

        if ($data['gateway'] == 'tonkra') {
            $tonkra['api_token'] = $data['api_token'];
            $tonkra['sender_id'] = $data['sender_id'];
            $data['details'] = json_encode($tonkra);
        }

        if ($data['gateway'] == 'clickatell') {
            $clickatell['api_key'] = $data['api_key'];
            $data['details'] = json_encode($clickatell);
        }
        if (isset($data['active']) && $data['active'] == true) {
            ExternalService::where('type', 'sms')
                ->where('active', true)
                ->update(['active' => false]);
        }
        ExternalService::updateOrCreate(
            [
                'name' => $data['gateway']
            ],
            [
                'name' => $data['gateway'],
                'type' => $data['type'] ?? 'sms',
                'details' => $data['details'],
                'active' => $data['active']
            ]
        );

        if ($this->wantsSpaResponse($request)) {
            $payload = $this->buildSmsSettingPayload();

            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatSmsSettingForSpa($payload),
            ]);
        }

        return redirect()->back()->with('message', __('db.Data updated successfully'));
    }

    public function createSms()
    {
        $lims_customer_list = Customer::where('is_active', true)->get();
        $smsTemplates = SmsTemplate::all();
        // dd($smsTemplates);
        return view('backend.setting.create_sms', compact('lims_customer_list', 'smsTemplates'));
    }

    public function sendSms(Request $request)
    {
        $data = $request->all();

        $smsProvider = ExternalService::where('active', true)->where('type', 'sms')->first();

        $smsData['sms_provider_name'] = $smsProvider->name;
        $smsData['details'] = $smsProvider->details;
        $smsData['message'] = $data['message'];
        $smsData['recipent'] = $data['mobile'];
        $numbers = explode(",", $data['mobile']);
        $smsData['numbers'] = $numbers;

        $this->_smsService->initialize($smsData);

        return redirect()->back()->with('message', __('db.SMS sent successfully'));
    }

    public function processSmsData($templateId, $customerId, $referenceNo)
    {
        $smsData = [];

        $smsTemplate = SmsTemplate::find($templateId);
        $template = $smsTemplate['content'];

        $customer = Customer::find($customerId);
        $customerName = $customer['name'];

        $smsData['message'] = $this->replacePlaceholders($template, $customerName, $referenceNo);

        $smsProvider = ExternalService::where('active', true)->where('type', 'sms')->first();
        $smsData['sms_provider_name'] = $smsProvider->name;
        $smsData['details'] = $smsProvider->details;

        return $smsData;
    }

    public function replacePlaceholders($template, $customerName, $referenceNo)
    {
        // Check for the presence of the [customer] placeholder in the template
        if (strpos($template, '[customer]') !== false) {
            // Replace [customer] with the value of $customerName
            $template = str_replace('[customer]', $customerName, $template);
        }

        // Check for the presence of the [reference] placeholder in the template
        if (strpos($template, '[reference]') !== false) {
            // Replace [reference] with the value of $referenceNo
            $template = str_replace('[reference]', $referenceNo, $template);
        }

        // Return the modified template with the placeholders replaced (if found)
        return $template;
    }

    public function gateway()
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('payment_gateway_setting')) {
            return redirect('/dashboard')
                ->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $payment_gateways = DB::table('external_services')->where('type', 'payment')->get();

        return view('backend.setting.payment-gateways', compact('payment_gateways'));
    }

    public function gatewayUpdate(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('payment_gateway_setting')) {
            return redirect('/dashboard')
                ->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        if (!env('USER_VERIFIED')) {
            Session::flash('message', 'This feature is disabled for demo!');
            Session::flash('type', 'error');
            return redirect()->back();
        }

        // Fetch all payment gateways from the database
        $gateways = DB::table('external_services')->where('type', 'payment')->get();

        // Define all possible modules (e.g., "pos", "ecommerce")
        $allModules = ['pos', 'ecommerce'];

        // Get inputs
        $pgs = $request->input('pg_name', []); // Payment gateway names
        $actives = $request->input('active', []); // Active status for each gateway
        $moduleStatuses = $request->input('module_status', []); // Module status (multi-select)

        foreach ($pgs as $index => $pg) {
            $gateway = $gateways->where('name', $pg)->first();

            if (!$gateway) {
                continue; // Skip if gateway not found
            }

            // Update the `details` field
            $lines = explode(';', $gateway->details);
            $keys = explode(',', $lines[0]);
            $vals = [];
            foreach ($keys as $key) {
                $para = $pg . '_' . str_replace(' ', '_', $key);
                $val = $request->$para ?? ''; // Default to empty string if null
                array_push($vals, $val);
            }
            $lines[1] = implode(',', $vals);
            $details = $lines[0] . ';' . $lines[1];

            // Update `module_status` field
            $selectedModules = $moduleStatuses[$index] ?? []; // Selected modules for this gateway
            $selectedModules = is_array($selectedModules) ? $selectedModules : [$selectedModules];

            // Create a status array with all modules
            $moduleStatusArray = [];
            foreach ($allModules as $module) {
                $moduleStatusArray[$module] = in_array($module, $selectedModules);
            }

            $moduleStatusJson = json_encode($moduleStatusArray);

            // Update the gateway in the database
            DB::table('external_services')
                ->where('name', $pg)
                ->update([
                    'details' => $details,
                    'module_status' => $moduleStatusJson,
                    'active' => $actives[$index] ?? 1, // Default to active if not set
                ]);
        }

        Session::flash('message', 'Payment gateways updated successfully.');
        Session::flash('type', 'success');

        return redirect()->back();
    }

    public function hrmSetting(Request $request)
    {
        if (!$this->userCanAccessHrmSetting()) {
            return $this->denyHrmSettingAccess($request);
        }

        $lims_hrm_setting_data = HrmSetting::latest()->first();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatHrmSetting($lims_hrm_setting_data),
            ]);
        }

        return view('backend.setting.hrm_setting', compact('lims_hrm_setting_data'));
    }

    public function hrmSettingStore(Request $request)
    {
        if (!$this->userCanAccessHrmSetting()) {
            return $this->denyHrmSettingAccess($request);
        }

        $this->validate($request, [
            'checkin' => 'required|max:255',
            'checkout' => 'required|max:255',
        ]);

        $lims_hrm_setting_data = HrmSetting::firstOrNew(['id' => 1]);
        $lims_hrm_setting_data->checkin = $request->checkin;
        $lims_hrm_setting_data->checkout = $request->checkout;
        $lims_hrm_setting_data->save();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatHrmSetting($lims_hrm_setting_data->fresh()),
            ]);
        }

        return redirect()->back()->with('message', __('db.Data updated successfully'));
    }

    public function posSetting(Request $request)
    {
        if (!$this->userCanAccessPosSetting()) {
            return $this->denyPosSettingAccess($request);
        }

        $lims_pos_setting_data = PosSetting::latest()->first();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatPosSetting($lims_pos_setting_data),
                'metadata' => $this->posSettingMetadata(),
            ]);
        }

        $lims_customer_list = Customer::where('is_active', true)->get();
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_biller_list = Biller::where('is_active', true)->get();

        if ($lims_pos_setting_data) {
            $options = explode(',', $lims_pos_setting_data->payment_options);
        } else {
            $options = [];
        }

        return view('backend.setting.pos_setting', compact(
            'lims_customer_list',
            'lims_warehouse_list',
            'lims_biller_list',
            'lims_pos_setting_data',
            'options'
        ));
    }

    public function posSettingStore(Request $request)
    {
        if (!$this->userCanAccessPosSetting()) {
            return $this->denyPosSettingAccess($request);
        }

        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        $this->validate($request, [
            'customer_id' => 'required|integer',
            'warehouse_id' => 'required|integer',
            'biller_id' => 'required|integer',
            'product_number' => 'required|integer|min:1',
        ]);

        $data = $request->all();

        if (array_key_exists('options', $data)) {
            $optionList = is_array($data['options'])
                ? array_values(array_filter(array_map('trim', $data['options']), fn ($o) => $o !== ''))
                : [];

            if (count(array_unique($optionList)) !== count($optionList)) {
                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, [
                        'message' => __('db.Payment options must be unique'),
                    ], 422);
                }

                return redirect()->back()->with('not_permitted', __('db.Payment options must be unique'));
            }

            $options = implode(',', $optionList);
        } else {
            $options = '';
        }

        $pos_setting = PosSetting::firstOrNew(['id' => 1]);
        $pos_setting->id = 1;
        $pos_setting->customer_id = $data['customer_id'];
        $pos_setting->warehouse_id = $data['warehouse_id'];
        $pos_setting->biller_id = $data['biller_id'];
        $pos_setting->product_number = $data['product_number'];
        $pos_setting->payment_options = $options;
        $pos_setting->keybord_active = $request->boolean('keybord_active');
        $pos_setting->is_table = $request->boolean('is_table');
        $pos_setting->send_sms = $request->boolean('send_sms');
        $pos_setting->cash_register = $request->boolean('cash_register');
        $pos_setting->show_print_invoice = $request->boolean('show_print_invoice');
        $pos_setting->save();
        cache()->forget('pos_setting');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.POS setting updated successfully'),
                'data' => $this->formatPosSetting($pos_setting->fresh()),
            ]);
        }

        return redirect()->back()->with('message', __('db.POS setting updated successfully'));
    }
}
