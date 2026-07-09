<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $now = now()->toDateTimeString();
        $names = [];

        foreach ($this->crudControllers() as $controller) {
            $names[] = "{$controller}.*";
            foreach (['add', 'edit', 'delete', 'view'] as $action) {
                $names[] = "{$controller}.{$action}";
            }
        }

        foreach ($this->importControllers() as $controller) {
            $names[] = "{$controller}.import";
        }

        $names[] = 'reports.*';
        foreach ($this->reportSlugs() as $slug) {
            $names[] = "reports.{$slug}";
        }

        foreach ($this->extraPermissions() as $name) {
            $names[] = $name;
        }

        $names = array_values(array_unique($names));
        sort($names);

        foreach ($names as $name) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $name, 'guard_name' => 'sanctum'],
                [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        foreach ($this->legacyAliases() as $alias) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $alias, 'guard_name' => 'sanctum'],
                [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $this->command?->info(
            'Seeded '.count($names).' canonical permissions and '
            .count($this->legacyAliases()).' legacy aliases.'
        );
    }

    /**
     * Menu controllers from menus.txt (column: controller).
     * Each gets {controller}.*, .add, .edit, .delete, .view
     *
     * @return list<string>
     */
    private function crudControllers(): array
    {
        $fromMenus = [
            'accounts',
            'account-statements',
            'activity-logs',
            'adjustments',
            'attendance',
            'backup-database',
            'balance-sheets',
            'barcodes',
            'barcode-settings',
            'billers',
            'brands',
            'categories',
            'challans',
            'coupons',
            'couriers',
            'currencies',
            'customer-groups',
            'customers',
            'custom-fields',
            'deliveries',
            'departments',
            'designations',
            'discount-plans',
            'discounts',
            'employees',
            'exchange',
            'expense_categories',
            'expenses',
            'general-settings',
            'gift-cards',
            'holidays',
            'hrm-settings',
            'income_categories',
            'incomes',
            'installment-plans',
            'invoice-settings',
            'languages',
            'leave-types',
            'leaves',
            'mail-settings',
            'money-transfers',
            'notifications',
            'overtime',
            'packing-slips',
            'payment-gateways',
            'payrolls',
            'pos',
            'pos-settings',
            'printers',
            'products',
            'purchase-returns',
            'purchases',
            'quotations',
            'returns',
            'reward-point-settings',
            'role-permissions',
            'sales',
            'shifts',
            'sms-settings',
            'sms-templates',
            'stock-counts',
            'suppliers',
            'tables',
            'taxes',
            'transfers',
            'units',
            'user-profile',
            'users',
            'warehouses',
        ];

        // Modules referenced in app code but not always present as menu rows.
        $extras = [
            'addons',
            'booking',
            'damage-stock',
            'production',
            'purchase-payment',
            'recipe',
            'sale-payment',
            'terminals',
            'whatsapp',
        ];

        return array_values(array_unique(array_merge($fromMenus, $extras)));
    }

    /**
     * @return list<string>
     */
    private function importControllers(): array
    {
        return [
            'billers',
            'categories',
            'customers',
            'products',
            'purchases',
            'sales',
            'suppliers',
            'transfers',
        ];
    }

    /**
     * Report slugs from menus.txt routes (/reports/{slug}) plus legacy report endpoints.
     *
     * @return list<string>
     */
    private function reportSlugs(): array
    {
        return [
            'activity-log',
            'best-seller',
            'biller-report',
            'cash-flow',
            'cash-register',
            'challan-report',
            'customer-due-report',
            'customer-group-report',
            'customer-report',
            'daily-purchase',
            'daily-sale',
            'daily-sale-objective-report',
            'dso',
            'due',
            'monthly-purchase',
            'monthly-sale',
            'monthly-summary',
            'payment-report',
            'product-expiry-report',
            'product-quantity-alert',
            'product-report',
            'profit-loss',
            'purchase-report',
            'revenue-profit-summary',
            'sale-report',
            'sale-report-chart',
            'stock',
            'summary-report',
            'supplier-due-report',
            'supplier-report',
            'user-report',
            'warehouse-report',
            'warehouse-stock',
            'warehouse-stock-chart',
            'yearly',
        ];
    }

    /**
     * Feature flags, sidebar toggles, and POS-specific permissions.
     *
     * @return list<string>
     */
    private function extraPermissions(): array
    {
        return [
            'account-selection',
            'cart-product-update',
            'change_sale_date',
            'cost_edit_in_products',
            'customer_export',
            'empty_database.*',
            'handle_discount',
            'hrm-panel',
            'invoice_create_edit_delete',
            'muri_khur',
            'packing_slip_challan',
            'price_edit_in_sale',
            'print_barcode.*',
            'product-qty-alert.*',
            'product_export',
            'product_history',
            'purchase_export',
            'sale-agents.*',
            'sale_export',
            'send_notification',
            'sidebar_accounting',
            'sidebar_expense',
            'sidebar_hrm',
            'sidebar_income',
            'sidebar_manufacturing',
            'sidebar_people',
            'sidebar_product',
            'sidebar_purchase',
            'sidebar_quotation',
            'sidebar_repair',
            'sidebar_reports',
            'sidebar_sale',
            'sidebar_settings',
            'sidebar_transfer',
            'sidebar_whatsapp',
            'theme_settings',
            'today_profit',
            'today_sale',
        ];
    }

    /**
     * Backward-compatible permission names still checked in legacy Blade / PHP controllers.
     *
     * @return list<string>
     */
    private function legacyAliases(): array
    {
        $aliases = [];

        // Hyphenated CRUD (purchases-add, customers-index, …)
        foreach ($this->crudControllers() as $controller) {
            $aliases[] = "{$controller}-add";
            $aliases[] = "{$controller}-edit";
            $aliases[] = "{$controller}-delete";
            $aliases[] = "{$controller}-index";
        }

        // Singular / legacy module names used in @can / hasPermissionTo checks.
        $singles = [
            'account.index',
            'account.view',
            'adjustment.*',
            'all_notification',
            'attendance',
            'backup_database',
            'balance-sheet.*',
            'barcode_setting',
            'best-seller',
            'biller-report',
            'booking',
            'brand',
            'brand.*',
            'cash_flow',
            'category',
            'category.*',
            'coupon',
            'coupon.*',
            'courier',
            'create_sms.*',
            'currency',
            'currency.*',
            'customer-report',
            'customer_group.*',
            'custom_field',
            'daily-purchase',
            'daily-sale',
            'delivery',
            'delivery.*',
            'department',
            'department.*',
            'designations',
            'designations.*',
            'discount',
            'discount.*',
            'discount_plan',
            'discount_plan.*',
            'dso-report',
            'due-report',
            'exchange-add',
            'exchange-delete',
            'exchange-edit',
            'exchange-index',
            'exchange-view',
            'expense-categories',
            'expense-category',
            'gift_card',
            'gift_card.*',
            'general_setting.*',
            'holiday',
            'holiday.*',
            'hrm_setting.*',
            'income-categories',
            'income-category',
            'invoice_setting.*',
            'language_setting',
            'leave',
            'leave-type.*',
            'leave.*',
            'mail_setting.*',
            'money-transfer',
            'money-transfer.*',
            'monthly-purchase',
            'monthly-sale',
            'monthly_summary',
            'overtime',
            'overtime.*',
            'packing_slip',
            'packing_slip.*',
            'payment-report',
            'payment_gateway_setting',
            'payroll',
            'payroll.*',
            'pos_setting.*',
            'product-expiry-report',
            'product-qty-alert',
            'product-report',
            'profit-loss',
            'purchase-report',
            'purchase-return',
            'purchase-return.*',
            'quotes',
            'quotes.*',
            'return-purchase',
            'return-purchase.*',
            'revenue_profit_summary',
            'reward_point_setting',
            'role_permission',
            'role_permission.*',
            'sale-agents',
            'table',
            'sale-report',
            'sale-report-chart',
            'shift',
            'shift.*',
            'sms_setting.*',
            'stock-report',
            'stock_count',
            'stock_count.*',
            'supplier-due-report',
            'supplier-report',
            'tax',
            'tax.*',
            'unit',
            'unit.*',
            'user-report',
            'warehouse',
            'warehouse-report',
            'warehouse-stock-report',
            'warehouse.*',
            'yearly_report',
        ];

        $aliases = array_merge($aliases, $singles);

        // Legacy report route names (ReportController).
        $aliases = array_merge($aliases, [
            'product-report',
            'purchase-report',
            'sale-report',
            'customer-report',
            'due-report',
            'profit-loss',
            'best-seller',
            'daily-sale',
            'monthly-sale',
            'daily-purchase',
            'monthly-purchase',
            'payment-report',
            'warehouse-stock-report',
            'supplier-report',
            'user-report',
            'warehouse-report',
            'revenue_profit_summary',
            'cash_flow',
            'monthly_summary',
            'yearly_report',
            'product-expiry-report',
            'sale-report-chart',
            'dso-report',
            'supplier-due-report',
            'biller-report',
            'stock-report',
        ]);

        return array_values(array_unique($aliases));
    }
}
