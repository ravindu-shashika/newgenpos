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

        foreach ($this->permissions() as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['id' => $permission['id']],
                [
                    'name' => $permission['name'],
                    'guard_name' => 'sanctum',
                    'created_at' => $permission['created_at'] ?? $now,
                    'updated_at' => $permission['updated_at'] ?? $now,
                ]
            );
        }

        foreach ($this->legacyReportAliases() as $alias) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $alias, 'guard_name' => 'sanctum'],
                [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $aliasCount = count($this->legacyReportAliases());
        $this->command?->info('Seeded '.count($this->permissions()).' permissions and '.$aliasCount.' legacy report aliases.');
    }

    /**
     * Canonical POS permission names:
     * - CRUD: {module}.index|add|edit|delete|view|import
     * - Reports: reports.{report-name}
     * - Wildcards: {module}.*
     * - Singles: feature flags, sidebar toggles, settings
     *
     * @return array<int, array{id: int, name: string, created_at?: string|null, updated_at?: string|null}>
     */
    private function permissions(): array
    {
        $t = static fn (string $at) => ['created_at' => $at, 'updated_at' => $at];
        $n = static fn (?string $at = null) => $at === null ? [] : ['created_at' => $at, 'updated_at' => $at];

        return array_merge(
            // Products
            $this->rows(4, 'products', ['edit', 'delete', 'add', 'index'], '2018-06-03 06:30:09', '2018-06-04 09:04:27'),
            // Purchases
            $this->rows(8, 'purchases', ['index', 'add', 'edit', 'delete'], '2018-06-04 13:33:19', '2018-06-04 15:17:36'),
            // Sales
            $this->rows(12, 'sales', ['index', 'add', 'edit', 'delete'], '2018-06-04 16:19:08', '2018-06-04 16:19:53'),
            // Quotations
            $this->rows(16, 'quotes', ['index', 'add', 'edit', 'delete'], '2018-06-05 03:35:10', '2018-06-05 03:35:10'),
            // Transfers
            $this->rows(20, 'transfers', ['index', 'add', 'edit', 'delete'], '2018-06-05 04:00:03', '2018-06-05 04:00:03'),
            // Returns
            $this->rows(24, 'returns', ['index', 'add', 'edit', 'delete'], '2018-06-05 04:20:24', '2018-06-05 04:20:25'),
            // Customers
            $this->rows(28, 'customers', ['index', 'add', 'edit', 'delete'], '2018-06-05 04:45:54', '2018-06-05 04:45:55'),
            // Suppliers
            $this->rows(32, 'suppliers', ['index', 'add', 'edit', 'delete'], '2018-06-05 05:10:12', '2018-06-05 05:10:12'),
            // Reports (legacy names normalized to reports.*)
            [
                ['id' => 36, 'name' => 'reports.product', ...$t('2018-06-25 04:35:33')],
                ['id' => 37, 'name' => 'reports.purchase', ...$t('2018-06-25 04:54:56')],
                ['id' => 38, 'name' => 'reports.sale', ...$t('2018-06-25 05:03:13')],
                ['id' => 39, 'name' => 'reports.customer', ...$t('2018-06-25 05:06:51')],
                ['id' => 40, 'name' => 'reports.due', ...$t('2018-06-25 05:09:52')],
            ],
            // Users
            $this->rows(41, 'users', ['index', 'add', 'edit', 'delete'], '2018-06-25 05:30:10', '2018-06-25 05:31:30'),
            // Reports (reports.* namespace)
            [
                ['id' => 45, 'name' => 'reports.profit-loss', ...$t('2018-07-15 03:20:05')],
                ['id' => 46, 'name' => 'reports.best-seller', ...$t('2018-07-15 03:31:38')],
                ['id' => 47, 'name' => 'reports.daily-sale', ...$t('2018-07-15 03:54:21')],
                ['id' => 48, 'name' => 'reports.monthly-sale', ...$t('2018-07-15 04:00:41')],
                ['id' => 49, 'name' => 'reports.daily-purchase', ...$t('2018-07-15 04:06:46')],
                ['id' => 50, 'name' => 'reports.monthly-purchase', ...$t('2018-07-15 04:18:17')],
                ['id' => 51, 'name' => 'reports.payment', ...$t('2018-07-15 04:40:41')],
                ['id' => 52, 'name' => 'reports.warehouse-stock', ...$t('2018-07-15 04:46:55')],
                ['id' => 53, 'name' => 'product-qty-alert.*', ...$t('2018-07-15 05:03:21')],
                ['id' => 54, 'name' => 'reports.supplier', ...$t('2018-07-30 08:30:01')],
            ],
            // Expenses
            $this->rows(55, 'expenses', ['index', 'add', 'edit', 'delete'], '2018-09-05 06:37:10', '2018-09-05 06:37:11'),
            // Settings wildcards & singles
            [
                ['id' => 59, 'name' => 'general_setting.*', ...$t('2018-10-20 04:40:04')],
                ['id' => 60, 'name' => 'mail_setting', ...$t('2018-10-20 04:40:04')],
                ['id' => 61, 'name' => 'pos_setting.*', ...$t('2018-10-20 04:40:04')],
                ['id' => 62, 'name' => 'hrm_setting.*', ...$t('2019-01-02 16:00:23')],
            ],
            // Purchase returns
            $this->rows(63, 'purchase-return', ['index', 'add', 'edit', 'delete'], '2019-01-03 03:15:14', '2019-01-03 03:15:14'),
            // Accounting
            [
                ['id' => 67, 'name' => 'account.index', ...$t('2019-01-03 03:36:13')],
                ['id' => 68, 'name' => 'balance-sheet.*', ...$t('2019-01-03 03:36:14')],
                ['id' => 69, 'name' => 'account-statement.*', ...$t('2019-01-03 03:36:14')],
            ],
            // HRM wildcards
            [
                ['id' => 70, 'name' => 'department.*', ...$t('2019-01-03 04:00:01')],
                ['id' => 71, 'name' => 'attendance.*', ...$t('2019-01-03 04:00:01')],
                ['id' => 72, 'name' => 'payroll.*', ...$t('2019-01-03 04:00:01')],
            ],
            // Employees
            $this->rows(73, 'employees', ['index', 'add', 'edit', 'delete'], '2019-01-03 04:22:19', '2019-01-03 04:22:19'),
            [
                ['id' => 77, 'name' => 'reports.user', ...$t('2019-01-16 12:18:18')],
                ['id' => 78, 'name' => 'stock_count.*', ...$t('2019-02-17 16:02:01')],
                ['id' => 79, 'name' => 'adjustment.*', ...$t('2019-02-17 16:02:02')],
                ['id' => 80, 'name' => 'sms_setting.*', ...$t('2019-02-22 10:48:03')],
                ['id' => 81, 'name' => 'create_sms.*', ...$t('2019-02-22 10:48:03')],
                ['id' => 82, 'name' => 'print_barcode.*', ...$t('2019-03-07 10:32:19')],
                ['id' => 83, 'name' => 'empty_database.*', ...$t('2019-03-07 10:32:19')],
                ['id' => 84, 'name' => 'customer_group.*', ...$t('2019-03-07 11:07:15')],
                ['id' => 85, 'name' => 'unit.*', ...$t('2019-03-07 11:07:15')],
                ['id' => 86, 'name' => 'tax.*', ...$t('2019-03-07 11:07:15')],
                ['id' => 87, 'name' => 'gift_card.*', ...$t('2019-03-07 11:59:38')],
                ['id' => 88, 'name' => 'coupon', ...$t('2019-03-07 11:59:38')],
                ['id' => 89, 'name' => 'holiday', ...$t('2019-10-19 14:27:15')],
                ['id' => 90, 'name' => 'reports.warehouse', ...$t('2019-10-22 11:30:23')],
                ['id' => 91, 'name' => 'warehouse', ...$t('2020-02-26 12:17:32')],
                ['id' => 92, 'name' => 'brand', ...$t('2020-02-26 12:29:59')],
            ],
            // Billers
            $this->rows(93, 'billers', ['index', 'add', 'edit', 'delete'], '2020-02-26 12:41:15', '2020-02-26 12:41:15'),
            [
                ['id' => 97, 'name' => 'money-transfer', ...$t('2020-03-02 11:11:48')],
                ['id' => 98, 'name' => 'category', ...$t('2020-07-13 17:43:16')],
                ['id' => 99, 'name' => 'delivery', ...$t('2020-07-13 17:43:16')],
                ['id' => 100, 'name' => 'send_notification', ...$t('2020-10-31 11:51:31')],
                ['id' => 101, 'name' => 'today_sale', ...$t('2020-10-31 12:27:04')],
                ['id' => 102, 'name' => 'today_profit', ...$t('2020-10-31 12:27:04')],
                ['id' => 103, 'name' => 'currency', ...$t('2020-11-09 05:53:11')],
                ['id' => 104, 'name' => 'backup_database', ...$t('2020-11-15 05:46:55')],
                ['id' => 105, 'name' => 'reward_point_setting', ...$t('2021-06-27 10:04:42')],
                ['id' => 106, 'name' => 'reports.revenue-profit-summary', ...$t('2022-02-08 19:27:21')],
                ['id' => 107, 'name' => 'reports.cash-flow', ...$t('2022-02-08 19:27:22')],
                ['id' => 108, 'name' => 'reports.monthly-summary', ...$t('2022-02-08 19:27:22')],
                ['id' => 109, 'name' => 'reports.yearly', ...$t('2022-02-08 19:27:22')],
                ['id' => 110, 'name' => 'discount_plan', ...$t('2022-02-16 14:42:26')],
                ['id' => 111, 'name' => 'discount', ...$t('2022-02-16 14:42:38')],
                ['id' => 112, 'name' => 'reports.product-expiry', ...$t('2022-03-30 11:09:20')],
            ],
            // Purchase payments
            $this->rows(113, 'purchase-payment', ['index', 'add', 'edit', 'delete'], '2022-06-05 19:42:27', '2022-06-05 19:42:28'),
            // Sale payments
            $this->rows(117, 'sale-payment', ['index', 'add', 'edit', 'delete'], '2022-06-05 19:42:28', '2022-06-05 19:42:28'),
            [
                ['id' => 121, 'name' => 'all_notification', ...$t('2022-06-05 19:42:29')],
                ['id' => 122, 'name' => 'reports.sale-report-chart', ...$t('2022-06-05 19:42:29')],
                ['id' => 123, 'name' => 'reports.dso', ...$t('2022-06-05 19:42:29')],
                ['id' => 124, 'name' => 'product_history', ...$t('2022-08-25 19:34:05')],
                ['id' => 125, 'name' => 'reports.supplier-due', ...$t('2022-08-31 15:16:33')],
                ['id' => 126, 'name' => 'custom_field', ...$t('2023-05-02 13:11:35')],
            ],
            // Incomes
            $this->rows(127, 'incomes', ['index', 'add', 'edit', 'delete'], '2024-08-11 10:20:59', '2024-08-11 10:20:59'),
            [
                ['id' => 131, 'name' => 'packing_slip_challan', ...$t('2024-08-11 10:21:00')],
                ['id' => 132, 'name' => 'reports.biller', ...$t('2024-08-26 05:00:44')],
                ['id' => 133, 'name' => 'payment_gateway_setting', ...$t('2025-01-29 11:40:49')],
                ['id' => 134, 'name' => 'barcode_setting', ...$t('2025-01-29 15:56:14')],
                ['id' => 135, 'name' => 'language_setting', ...$t('2025-01-29 16:05:47')],
                ['id' => 136, 'name' => 'addons', ...$t('2025-02-02 16:55:47')],
                ['id' => 137, 'name' => 'account-selection', ...$t('2025-02-03 18:24:05')],
                ['id' => 138, 'name' => 'invoice_setting.*', ...$t('2025-06-03 11:34:51')],
                ['id' => 139, 'name' => 'invoice_create_edit_delete', ...$t('2025-06-03 11:34:51')],
                ['id' => 141, 'name' => 'handle_discount', ...$t('2025-06-03 12:07:55')],
                ['id' => 142, 'name' => 'muri_khur', ...$t('2025-08-02 10:11:09')],
            ],
            // Imports
            [
                ['id' => 145, 'name' => 'products.import', ...$n()],
                ['id' => 146, 'name' => 'purchases.import', ...$n()],
                ['id' => 147, 'name' => 'sales.import', ...$n()],
                ['id' => 148, 'name' => 'customers.import', ...$n()],
                ['id' => 149, 'name' => 'billers.import', ...$n()],
                ['id' => 150, 'name' => 'suppliers.import', ...$n()],
            ],
            // Categories
            $this->rows(151, 'categories', ['add', 'import', 'index', 'edit', 'delete'], null, null),
            [
                ['id' => 156, 'name' => 'role_permission.*', ...$n()],
                ['id' => 157, 'name' => 'cart-product-update', ...$n()],
                ['id' => 158, 'name' => 'transfers.import', ...$n()],
                ['id' => 159, 'name' => 'change_sale_date', ...$n()],
                ['id' => 160, 'name' => 'sidebar_product', ...$n()],
                ['id' => 161, 'name' => 'sidebar_purchase', ...$n()],
                ['id' => 162, 'name' => 'sidebar_sale', ...$n()],
                ['id' => 163, 'name' => 'sidebar_quotation', ...$n()],
                ['id' => 164, 'name' => 'sidebar_transfer', ...$n()],
                ['id' => 165, 'name' => 'sidebar_expense', ...$n()],
                ['id' => 166, 'name' => 'sidebar_income', ...$n()],
                ['id' => 167, 'name' => 'sidebar_accounting', ...$n()],
                ['id' => 168, 'name' => 'sidebar_hrm', ...$n()],
                ['id' => 169, 'name' => 'sidebar_people', ...$n()],
                ['id' => 170, 'name' => 'sidebar_reports', ...$n()],
                ['id' => 171, 'name' => 'sidebar_settings', ...$n()],
                ['id' => 172, 'name' => 'sale_export', ...$n()],
                ['id' => 173, 'name' => 'product_export', ...$n()],
                ['id' => 174, 'name' => 'purchase_export', ...$n()],
                ['id' => 175, 'name' => 'designations', ...$n()],
                ['id' => 176, 'name' => 'shift', ...$n()],
                ['id' => 177, 'name' => 'overtime', ...$n()],
                ['id' => 178, 'name' => 'leave-type', ...$n()],
                ['id' => 179, 'name' => 'leave', ...$n()],
                ['id' => 180, 'name' => 'hrm-panel', ...$n()],
                ['id' => 181, 'name' => 'sale-agents', ...$n()],
                ['id' => 182, 'name' => 'customer_export', ...$n()],
                ['id' => 183, 'name' => 'income-category', ...$n()],
                ['id' => 184, 'name' => 'expense-category', ...$n()],
            ],
            // Exchange
            $this->rows(185, 'exchange', ['index', 'add', 'edit', 'delete'], '2026-01-21 14:33:15', '2026-01-21 14:33:15'),
            [
                ['id' => 189, 'name' => 'income-categories', ...$t('2026-01-21 14:33:15')],
                ['id' => 190, 'name' => 'expense-categories', ...$t('2026-01-21 14:33:16')],
            ],
            // WhatsApp
            $this->rows(191, 'whatsapp', ['index', 'view', 'add', 'edit', 'delete'], '2026-01-21 14:40:19', '2026-01-21 14:40:20'),
            [
                ['id' => 196, 'name' => 'suppliers.view', ...$t('2026-01-21 14:40:20')],
                ['id' => 197, 'name' => 'sidebar_manufacturing', ...$t('2026-01-21 14:40:20')],
                ['id' => 198, 'name' => 'sidebar_whatsapp', ...$t('2026-01-21 14:40:20')],
            ],
            // Manufacturing
            $this->rows(199, 'production', ['view', 'add', 'edit', 'delete'], '2026-01-21 14:40:20', '2026-01-21 14:40:20'),
            $this->rows(203, 'recipe', ['view', 'add', 'edit', 'delete'], '2026-01-21 14:40:20', '2026-01-21 14:40:20'),
            [
                ['id' => 207, 'name' => 'theme_settings', ...$n()],
                ['id' => 208, 'name' => 'categories.view', ...$n()],
                ['id' => 209, 'name' => 'products.view', ...$n()],
                ['id' => 210, 'name' => 'purchases.view', ...$n()],
                ['id' => 211, 'name' => 'purchase-payment.view', ...$n()],
                ['id' => 212, 'name' => 'sales.view', ...$n()],
                ['id' => 213, 'name' => 'sale-payment.view', ...$n()],
                ['id' => 214, 'name' => 'expenses.view', ...$n()],
                ['id' => 215, 'name' => 'incomes.view', ...$n()],
                ['id' => 216, 'name' => 'quotes.view', ...$n()],
                ['id' => 217, 'name' => 'transfers.view', ...$n()],
                ['id' => 218, 'name' => 'returns.view', ...$n()],
                ['id' => 219, 'name' => 'exchange.view', ...$t('2026-01-21 14:33:15')],
                ['id' => 220, 'name' => 'purchase-return.view', ...$n()],
                ['id' => 221, 'name' => 'employees.view', ...$n()],
                ['id' => 222, 'name' => 'users.view', ...$n()],
                ['id' => 223, 'name' => 'customers.view', ...$n()],
                ['id' => 224, 'name' => 'billers.view', ...$n()],
                ['id' => 225, 'name' => 'account.view', ...$n()],
                ['id' => 226, 'name' => 'reports.stock', ...$t('2026-03-05 03:17:24')],
                ['id' => 227, 'name' => 'damage-stock', ...$t('2026-03-15 12:28:36')],
                ['id' => 228, 'name' => 'booking', ...$t('2026-03-20 19:07:41')],
                ['id' => 229, 'name' => 'sidebar_repair', ...$n()],
                ['id' => 230, 'name' => 'price_edit_in_sale', ...$n()],
                ['id' => 231, 'name' => 'cost_edit_in_products', ...$n()],
                ['id' => 232, 'name' => 'terminals.*', ...$n()],
            ],
        );
    }

    /**
     * Hyphenated report names still referenced by the React SPA and legacy Blade checks.
     *
     * @return list<string>
     */
    private function legacyReportAliases(): array
    {
        return [
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
        ];
    }

    /**
     * @param  list<string>  $actions
     * @return list<array{id: int, name: string, created_at?: string|null, updated_at?: string|null}>
     */
    private function rows(
        int $startId,
        string $module,
        array $actions,
        ?string $firstTimestamp,
        ?string $lastTimestamp,
    ): array {
        $rows = [];
        $lastIndex = count($actions) - 1;

        foreach ($actions as $index => $action) {
            $timestamp = match (true) {
                $firstTimestamp === null => null,
                $lastIndex === 0 || $index === 0 => $firstTimestamp,
                $index === $lastIndex => $lastTimestamp ?? $firstTimestamp,
                default => $firstTimestamp,
            };

            $row = [
                'id' => $startId + $index,
                'name' => "{$module}.{$action}",
            ];

            if ($timestamp !== null) {
                $row['created_at'] = $timestamp;
                $row['updated_at'] = $timestamp;
            }

            $rows[] = $row;
        }

        return $rows;
    }
}
