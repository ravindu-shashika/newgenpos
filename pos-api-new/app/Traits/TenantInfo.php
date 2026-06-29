<?php

namespace App\Traits;

use App\Models\landlord\Tenant;
use Illuminate\Support\Str;
use DB;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\landlord\Package;
use App\Models\landlord\TenantPayment;
use App\Mail\TenantCreate;
use App\Models\landlord\MailSetting;
use Mail;
use Illuminate\Support\Facades\Artisan;
use Database\Seeders\Tenant\TenantDatabaseSeeder;
use Modules\Ecommerce\Database\Seeders\EcommerceDatabaseSeeder;
use Modules\Restaurant\Database\Seeders\RestaurantDatabaseSeeder;

trait TenantInfo
{

    use \App\Traits\MailInfo;

    public function getTenantId()
    {
        return tenant()->id;
    }

    public function features()
    {
        $features = [
            'product_and_categories' => [
                'name' => 'Product and Categories',
                'default' => true,
                'permission_names' => ''
            ],
            'purchase_and_sale' => [
                'name' => 'Purchase and Sale',
                'default' => true,
                'permission_names' => ''
            ],
            'sale_return' => [
                'name' => 'Sale Return',
                'default' => false,
                'permission_names' => 'returns-index,returns-view,returns-add,returns-edit,returns-delete'
            ],
            'purchase_return' => [
                'name' => 'Purchase Return',
                'default' => false,
                'permission_names' => 'purchase-return-index,purchase-return-view,purchase-return-add,purchase-return-edit,purchase-return-delete'
            ],
            'expense' => [
                'name' => 'Expense',
                'default' => false,
                'permission_names' => 'expenses-index,expenses-view,expenses-add,expenses-edit,expenses-delete,expense-categories,sidebar_expense'
            ],
            'income' => [
                'name' => 'Income',
                'default' => false,
                'permission_names' => 'incomes-index,incomes-view,incomes-add,incomes-edit,incomes-delete,income-categories,sidebar_income'
            ],
            'transfer' => [
                'name' => 'Stock Transfer',
                'default' => false,
                'permission_names' => 'transfers-index,transfers-view,transfers-add,transfers-edit,transfers-delete,transfers-import,sidebar_transfer'
            ],
            'quotation' => [
                'name' => 'Quotation',
                'default' => false,
                'permission_names' => 'quotes-index,quotes-view,quotes-add,quotes-edit,quotes-delete,sidebar_quotation'
            ],
            'delivery' => [
                'name' => 'Product Delivery',
                'default' => false,
                'permission_names' => 'delivery'
            ],
            'stock_count_and_adjustment' => [
                'name' => 'Stock Count and Adjustment',
                'default' => false,
                'permission_names' => 'stock_count,adjustment'
            ],
            'report' => [
                'name' => 'Report',
                'default' => false,
                'permission_names' => 'product-report,purchase-report,sale-report,customer-report,due-report,profit-loss,best-seller,daily-sale,monthly-sale,daily-purchase,monthly-purchase,payment-report,warehouse-stock-report,product-qty-alert,supplier-report,user-report,warehouse-report,product-expiry-report,sale-report-chart,dso-report,supplier-due-report,biller-report,sidebar_reports'
            ],
            'hrm' => [
                'name' => 'HRM',
                'default' => false,
                'permission_names' => 'hrm_setting,department,attendance,payroll,employees-index,employees-view,employees-add,employees-edit,employees-delete,holiday,sidebar_hrm,hrm-panel,sale-agents,designations,shift,overtime,leave-type,leave'
            ],
            'accounting' => [
                'name' => 'Accounting',
                'default' => false,
                'permission_names' => 'account-index,account-view,balance-sheet,account-statement,account-selection,money-transfer,sidebar_accounting,account-statement-permission,account-selection-permission'
            ],
            'whatsapp_cloud_api' => [
                'name' => 'WhatsApp Cloud API',
                'default' => false,
                'permission_names' => 'sidebar_whatsapp'
            ],
        ];

        if(file_exists(base_path('Modules/Manufacturing'))){
            $features['manufacturing'] = [
                'name' => 'Manufacturing',
                'default' => false,
                'permission_names' => 'sidebar_manufacturing,production-view,production-add,production-edit,production-delete,recipe-view,recipe-add,recipe-edit,recipe-delete'
            ];
        }
        if(file_exists(base_path('Modules/Ecommerce'))) {
            $features['ecommerce'] = [
                'name' => 'Ecommerce',
                'default' => false,
                'permission_names' => ''
            ];
        }
        if(file_exists(base_path('Modules/Woocommerce'))){
            $features['woocommerce'] = [
                'name' => 'Woocommerce',
                'default' => false,
                'permission_names' => ''
            ];
        }
        if(file_exists(base_path('Modules/Restaurant'))){
            $features['restaurant'] = [
                'name' => 'Restaurant',
                'default' => false,
                'permission_names' => ''
            ];
        }
        if(file_exists(base_path('app/Http/Controllers/Api'))){
            $features['api'] = [
                'name' => 'Mobile App',
                'default' => false,
                'permission_names' => ''
            ];
        }

        return $features;
    }

    //This function is called from tenantCheckout() in payment controller
    public function createTenant($request)
    {
        if (cache()->has('general_setting')) {
            $general_setting = cache()->get('general_setting');
        } else {
            $general_setting = DB::table('general_settings')->latest()->first();
        }

        $package = Package::findOrFail($request->package_id);
        $packageFeatures = json_decode($package->features);
        $modules = [];
        if (in_array('manufacturing', $packageFeatures)) {
            $modules[] = 'manufacturing';
        }
        if (in_array('ecommerce', $packageFeatures)) {
            $modules[] = 'ecommerce';
        }
        if (in_array('woocommerce', $packageFeatures)) {
            $modules[] = 'woocommerce';
        }
        if (in_array('restaurant', $packageFeatures)) {
            $modules[] = 'restaurant';
        }
        if (in_array('api', $packageFeatures)) {
            $modules[] = 'api';
        }

        if (count($modules)) {
            $modules = implode(",", $modules);
        }
        else {
            $modules = Null;
        }

        if ($request->subscription_type == 'free trial' || (!isset($request->created_by_admin) && $package->is_free_trial)) {
            $numberOfDaysToExpired = $general_setting->free_trial_limit;
        }
        elseif ($request->subscription_type == 'monthly') {
            $numberOfDaysToExpired = 30;
        }
        elseif ($request->subscription_type == 'yearly') {
            $numberOfDaysToExpired = 365;
        }

        if (isset($request->payment_method)) {
            $paid_by = $request->payment_method;
        }
        else {
            $paid_by = '';
        }

        //////creating tenant start////////
        DB::beginTransaction();
        try {
            $tenant = Tenant::create([
                'id' => $request->tenant
            ]);

            $tenant->domains()->create([
                'domain' => $request->tenant . '.' . env('CENTRAL_DOMAIN')
            ]);

            DB::commit();

        } catch (\Throwable $e) {
            DB::rollBack();
            return redirect()->back()->with(
                'not_permitted',
                __('db.failed_create_tenant'). ' - ' . $e->getMessage()
            );
        }
        //////creating tenant end/////////
        if ($paid_by) {
            TenantPayment::create(['tenant_id' => $tenant->id, 'amount' => $request->price, 'paid_by' => $paid_by]);
        }

        ///////////////Start if someone wants ecommerce demo as his own demo////////////////
        // if (isset($modules) && str_contains($modules, "ecommerce") && file_exists(public_path('ecommerce_demo.sql'))) {
        //     $tenant->run(function () {
        //         DB::unprepared(file_get_contents(public_path('ecommerce_demo.sql')));
        //     });
        // }
        ///////////////End if someone wants ecommerce demo as his own demo////////////////

        // Start set tenant specific data for TenantDatabaseSeeder
        $tenantData = [
            //set general_setting information
            'site_title' => $general_setting->site_title,
            'site_logo' => $general_setting->site_logo,
            'package_id' => $request->package_id,
            'subscription_type' => $request->subscription_type,
            'developed_by' => $general_setting->developed_by,
            'modules' => $modules,
            'expiry_date' => date("Y-m-d", strtotime("+" . $numberOfDaysToExpired . " days")),
            //set user information
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'phone' => $request->phone_number,
            'company_name' => $request->company_name,
            //set package features
            'package_features' => $packageFeatures,
        ];
        //End set tenant specific data for TenantDatabaseSeeder and call running TenantDatabaseSeeder

        //Start running TenantDatabaseSeeder
        TenantDatabaseSeeder::$tenantData = $tenantData;
        Artisan::call('tenants:seed', [
            '--tenants' => $request->tenant,
            '--force' => true,
        ]);
        //End running TenantDatabaseSeeder

        copy(public_path("landlord/images/logo/") . $general_setting->site_logo, public_path("logo/") . $general_setting->site_logo);

        //Start running Ecommerce seeder for tenant if package has ecommerce module
        if (isset($modules) && str_contains($modules, 'ecommerce')) {
            Artisan::call('tenants:seed', [
                '--tenants' => $request->tenant,
                '--class' => EcommerceDatabaseSeeder::class,
                '--force' => true,
            ]);

            //Update slug column on category,brand,product table as this is needed for ecommerce
            $tenant->run(function () {
                $this->brandSlug();
                $this->categorySlug();
                $this->productSlug();

                DB::table('categories')->whereIn('id', [1, 6, 12, 23, 29, 30, 31, 33, 39])->update([
                    'icon' => DB::raw("
                                    CASE
                                        WHEN id = 1 THEN '20240117121500.png'
                                        WHEN id = 6 THEN '20240117121330.png'
                                        WHEN id = 12 THEN '20240117121400.png'
                                        WHEN id = 23 THEN '20240117121523.png'
                                        WHEN id = 29 THEN '20240117121304.png'
                                        WHEN id = 30 THEN '20240117121238.png'
                                        WHEN id = 31 THEN '20240117122452.png'
                                        WHEN id = 33 THEN '20240117121224.png'
                                        WHEN id = 39 THEN '20240204050037.png'
                                    END
                                ")
                ]);

                DB::table('products')->update(['is_online' => 1]);
            });

            copy(public_path("logo/") . $general_setting->site_logo, public_path("frontend/images/") . $general_setting->site_logo);
        }
        //End running Ecommerce seeder if package has ecommerce module

        //Start running Restaurant seeder for tenant if package has Restaurant module
        if (isset($modules) && str_contains($modules, 'restaurant')) {
            Artisan::call('tenants:seed', [
                '--tenants' => $request->tenant,
                '--class' => RestaurantDatabaseSeeder::class,
                '--force' => true,
            ]);
        }
        //End running Restaurant seeder if package has Restaurant module

        if (!env('WILDCARD_SUBDOMAIN')) {
            $this->addSubdomain($tenant);
        }

        //updating tenant others information on landlord DB
        $tenant->update(['package_id' => $request->package_id, 'subscription_type' => $request->subscription_type, 'company_name' => $request->company_name, 'phone_number' => $request->phone_number, 'email' => $request->email, 'expiry_date' => date("Y-m-d", strtotime("+" . $numberOfDaysToExpired . " days"))]);

        // Below section no use for frontend signup as it is redirect to tenants domain
        // check PaymentController@tenantCheckout function
        if (isset($request->created_by_admin)) {
            $message = 'Client created successfully.';
            //sending welcome message to tenant
            $mail_setting = MailSetting::latest()->first();
            if ($mail_setting) {
                $this->setMailInfo($mail_setting);
                $mail_data['email'] = $request->email;
                $mail_data['company_name'] = $request->company_name;
                $mail_data['superadmin_company_name'] = $general_setting->site_title;
                $mail_data['subdomain'] = $request->tenant;
                $mail_data['name'] = $request->name;
                $mail_data['password'] = $request->password;
                $mail_data['superadmin_email'] = $general_setting->email;
                try {
                    Mail::to($mail_data['email'])->send(new TenantCreate($mail_data));
                } catch (\Exception $e) {
                    $message = 'Client created successfully. Please setup your <a href="mail_setting">mail setting</a> to send mail.';
                }
            }
            return redirect()->back()->with('message', $message);
        }
    }

    public function categorySlug()
    {
        Category::whereNull('slug')->each(function ($cat) {
            $cat->slug = Str::slug($cat->name, '-');
            $cat->save();
        });

        //Best approach for larger dataset
        // DB::table('categories')
        // ->whereNull('slug')
        // ->update(['slug' => DB::raw("REPLACE(LOWER(name), ' ', '-')")]);
    }

    public function brandSlug()
    {
        Brand::whereNull('slug')->each(function ($brand) {
            $brand->slug = Str::slug($brand->title, '-');
            $brand->save();
        });
    }

    public function productSlug()
    {
        Product::whereNull('slug')->each(function ($product) {
            $product->slug = Str::slug($product->name, '-');
            $product->save();
        });
    }

    public function changePermission($tenant, $packageFeatures, int $package_id, $expiry_date = null, $subscription_type = null)
    {
        $tenant->run(function () use ($tenant, $packageFeatures, $package_id, $expiry_date, $subscription_type) {

            $packageFeatures = json_decode($packageFeatures);
            $modules = [];
            if (in_array('manufacturing', $packageFeatures)) {
                $modules[] = 'manufacturing';
            }
            if (in_array('ecommerce', $packageFeatures)) {
                $modules[] = 'ecommerce';
            }
            if (in_array('woocommerce', $packageFeatures)) {
                $modules[] = 'woocommerce';
            }
            if (in_array('restaurant', $packageFeatures)) {
                $modules[] = 'restaurant';
            }
            if (in_array('api', $packageFeatures)) {
                $modules[] = 'api';
            }

            if (count($modules)) {
                $modules = implode(",", $modules);
            }
            else {
                $modules = Null;
            }

            $all_permissions_map = DB::table('permissions')->pluck('id', 'name')->toArray();
            $features = $this->features();

            $excluded_permission_names = [];

            // ৪. লজিক: প্যাকেজে নেই এমন ফিচারের পারমিশনগুলো বের করা (Exclude List)
            foreach ($features as $feature_key => $feature_data) {
                // যদি এই ফিচারটি বর্তমান প্যাকেজে না থাকে
                if (!in_array($feature_key, $packageFeatures)) {
                    if (!empty($feature_data['permission_names'])) {
                        $perms = explode(',', $feature_data['permission_names']);
                        foreach ($perms as $p) {
                            $excluded_permission_names[] = trim($p);
                        }
                    }
                }
            }

            // ২. মডিউল চেক করে addons হ্যান্ডেল করা
            if (empty($modules)) {
                $excluded_permission_names[] = 'addons';
            }

            $permission_ids_to_delete = [];
            $permission_ids_to_insert = [];

            // ৫. পারমিশন ফিল্টার করা (Delete vs Insert)
            foreach ($all_permissions_map as $perm_name => $perm_id) {
                if (in_array($perm_name, $excluded_permission_names)) {
                    // যদি excluded লিস্টে থাকে, তবে এটি ডিলিট হবে
                    $permission_ids_to_delete[] = $perm_id;
                } else {
                    // অন্যথায় এটি রোল-এ থাকতে হবে (Add)
                    $permission_ids_to_insert[] = $perm_id;
                }
            }

            // unnecessary permission delete for all roles
            if (!empty($permission_ids_to_delete)) {
                DB::table('role_has_permissions')
                    ->whereIn('permission_id', $permission_ids_to_delete)
                    ->delete();
            }

            // খ. নতুন পারমিশন ইনসার্ট করা (Bulk Insert for Optimization)
            // আগে চেক করি বর্তমানে রোলের কাছে কী কী পারমিশন আছে, যাতে ডুপ্লিকেট না হয়
            $existing_role_permissions = DB::table('role_has_permissions')
                ->where('role_id', 1)
                ->pluck('permission_id')
                ->toArray();

            $existingMap = array_flip($existing_role_permissions);

            $data_to_insert = [];

            foreach ($permission_ids_to_insert as $id) {
                if (!isset($existingMap[$id])) {
                    $data_to_insert[] = [
                        'permission_id' => $id,
                        'role_id'       => 1
                    ];
                }
            }

            if (!empty($data_to_insert)) {
                DB::table('role_has_permissions')->insert($data_to_insert);
            }

            $general_setting = \App\Models\GeneralSetting::latest()->first();
            $updateData = ['package_id' => $package_id, 'modules' => $modules];
            if ($expiry_date != null && $subscription_type != null) {
                $updateData['expiry_date'] = $expiry_date;
                $updateData['subscription_type'] = $subscription_type;
            }
            $general_setting->update($updateData);

            if (isset($modules) && str_contains($modules, 'ecommerce')) {
                Artisan::call('tenants:seed', [
                    '--tenants' => $tenant->id,
                    '--class' => EcommerceDatabaseSeeder::class,
                    '--force' => true,
                ]);

                $this->categorySlug();
                $this->brandSlug();
                $this->productSlug();

                if($general_setting->site_logo && file_exists(public_path("logo/") . $general_setting->site_logo)){
                    copy(public_path("logo/") . $general_setting->site_logo, public_path("frontend/images/") . $general_setting->site_logo);
                }
            }
        });
    }

    public function addSubdomain($tenant)
    {
        $subdomain = $tenant->id;
        if (env('SERVER_TYPE') == 'cpanel') {
            $url = "https://" . env('CENTRAL_DOMAIN') . ":2083/json-api/cpanel?cpanel_jsonapi_func=addsubdomain&cpanel_jsonapi_module=SubDomain&cpanel_jsonapi_version=2&domain=" . $subdomain . "&rootdomain=" . env('CENTRAL_DOMAIN');
            if (env('ROOT_DOMAIN'))
                $url .= "&dir=public_html";
            else
                $url .= "&dir=" . env('CENTRAL_DOMAIN');
            //return $url;
            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_URL, $url);
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            //setting the curl headers
            $headers = array(
                "Authorization: cpanel " . env('CPANEL_USER_NAME') . ":" . env('CPANEL_API_KEY'),
                "Content-Type: text/plain"
            );
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

            //for debug only!
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

            curl_exec($curl);
            curl_close($curl);
        } elseif (env('SERVER_TYPE') == 'plesk') {
            $host = env('CENTRAL_DOMAIN');
            $username = env('PLESK_USER_NAME');
            $password = env('PLESK_PASSWORD');
            $pleskApiUrl = 'https://' . $host . ':8443/api/v2/domains';
            $domainData = [
                'name' => $subdomain . '.' . $host,
                'hosting_type' => 'virtual',
                'hosting_settings' => [
                    'document_root' => '/httpdocs',
                ],
                'parent_domain' => [
                    "name" => $host,
                ]
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $pleskApiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($domainData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Basic ' . base64_encode("$username:$password"),
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // Disable SSL hostname verification if needed
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL certificate verification if needed

            $response = curl_exec($ch);
            curl_close($ch);
            $response = json_decode($response);
            $tenant->setInternal('domain_id', $response->id);
        }
    }

    public function deleteSubdomain($tenant)
    {
        if (env('SERVER_TYPE') == 'cpanel') {
            $subdomain = $tenant->id;
            $url = "https://" . env('CENTRAL_DOMAIN') . ":2083/json-api/cpanel?cpanel_jsonapi_func=delsubdomain&cpanel_jsonapi_module=SubDomain&cpanel_jsonapi_version=2&domain=" . $subdomain . "." . env('CENTRAL_DOMAIN');
            //return $url;
            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_URL, $url);
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            //setting the curl headers
            $headers = array(
                "Authorization: cpanel " . env('CPANEL_USER_NAME') . ":" . env('CPANEL_API_KEY'),
                "Content-Type: text/plain"
            );
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

            //for debug only!
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

            $resp = curl_exec($curl);
            curl_close($curl);
        } elseif (env('SERVER_TYPE') == 'plesk') {
            $host = env('CENTRAL_DOMAIN');
            $username = env('PLESK_USER_NAME');
            $password = env('PLESK_PASSWORD');
            $domain_id = $tenant->getInternal('domain_id');
            $pleskApiUrl = 'https://' . $host . ':8443/api/v2/domains/' . $domain_id;
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $pleskApiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Basic ' . base64_encode("$username:$password"),
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // Disable SSL hostname verification if needed
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL certificate verification if needed
            curl_exec($ch);
            curl_close($ch);
        }
    }
}
