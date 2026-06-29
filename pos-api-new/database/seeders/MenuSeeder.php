<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Two-level menu matching old_codes/views/backend/layout/sidebar.blade.php.
     * React SPA resolves legacy paths via MENU_PATH_ALIASES in routeRegistry.js.
     */
    public function run(): void
    {
        Menu::truncate();

        $year = date('Y');
        $month = date('m');

        $sections = [
            [
                'main' => 'Dashboard',
                'icon' => 'dripicons-meter',
                'order' => 1,
                'items' => [
                    ['label' => 'Dashboard', 'route' => '/dashboard', 'controller' => 'dashboard'],
                ],
            ],
            [
                'main' => 'Product',
                'icon' => 'dripicons-list',
                'order' => 2,
                'items' => [
                    ['label' => 'Category', 'route' => '/category', 'controller' => 'categories'],
                    ['label' => 'Brand', 'route' => '/brand', 'controller' => 'brand'],
                    ['label' => 'Unit', 'route' => '/unit', 'controller' => 'unit'],
                    ['label' => 'Product List', 'route' => '/products', 'controller' => 'products'],
                    ['label' => 'Add Product', 'route' => '/products/create', 'controller' => 'products'],
                    ['label' => 'Print Barcode', 'route' => '/products/print_barcode', 'controller' => 'products'],
                    ['label' => 'Adjustment List', 'route' => '/qty_adjustment', 'controller' => 'qty_adjustment'],
                    ['label' => 'Add Adjustment', 'route' => '/qty_adjustment/create', 'controller' => 'qty_adjustment'],
                    ['label' => 'Stock Count', 'route' => '/stock-count', 'controller' => 'stock_count'],
                    ['label' => 'Damage List', 'route' => '/damage-stock', 'controller' => 'damage-stock'],
                ],
            ],
            [
                'main' => 'Purchase',
                'icon' => 'dripicons-card',
                'order' => 3,
                'items' => [
                    ['label' => 'Purchase List', 'route' => '/purchases', 'controller' => 'purchases'],
                    ['label' => 'Add Purchase', 'route' => '/purchases/create', 'controller' => 'purchases'],
                    ['label' => 'Import Purchase By CSV', 'route' => '/purchases/purchase_by_csv', 'controller' => 'purchases'],
                    ['label' => 'Purchase Return', 'route' => '/return-purchase', 'controller' => 'return-purchase'],
                ],
            ],
            [
                'main' => 'Sale',
                'icon' => 'dripicons-cart',
                'order' => 4,
                'items' => [
                    ['label' => 'Sale List', 'route' => '/sales', 'controller' => 'sales'],
                    ['label' => 'POS', 'route' => '/pos', 'controller' => 'pos'],
                    ['label' => 'Add Sale', 'route' => '/sales/create', 'controller' => 'sales'],
                    ['label' => 'Import Sale By CSV', 'route' => '/sales/sale_by_csv', 'controller' => 'sales'],
                    ['label' => 'Packing Slip List', 'route' => '/packing-slips', 'controller' => 'packing_slip'],
                    ['label' => 'Challan List', 'route' => '/challans', 'controller' => 'challan'],
                    ['label' => 'Delivery List', 'route' => '/delivery', 'controller' => 'delivery'],
                    ['label' => 'Gift Card List', 'route' => '/gift_cards', 'controller' => 'gift_card'],
                    ['label' => 'Coupon List', 'route' => '/coupons', 'controller' => 'coupon'],
                    ['label' => 'Courier List', 'route' => '/couriers', 'controller' => 'courier'],
                    ['label' => 'Sale Return', 'route' => '/return-sale', 'controller' => 'return-sale'],
                    ['label' => 'Sale Exchange', 'route' => '/exchange', 'controller' => 'exchange'],
                ],
            ],
            [
                'main' => 'Quotation',
                'icon' => 'dripicons-document',
                'order' => 5,
                'items' => [
                    ['label' => 'Quotation List', 'route' => '/quotations', 'controller' => 'quotations'],
                    ['label' => 'Add Quotation', 'route' => '/quotations/create', 'controller' => 'quotations'],
                ],
            ],
            [
                'main' => 'Transfer',
                'icon' => 'dripicons-export',
                'order' => 6,
                'items' => [
                    ['label' => 'Transfer List', 'route' => '/transfers', 'controller' => 'transfers'],
                    ['label' => 'Add Transfer', 'route' => '/transfers/create', 'controller' => 'transfers'],
                    ['label' => 'Import Transfer By CSV', 'route' => '/transfers/transfer_by_csv', 'controller' => 'transfers'],
                ],
            ],
            [
                'main' => 'Expense',
                'icon' => 'dripicons-wallet',
                'order' => 7,
                'items' => [
                    ['label' => 'Expense Category', 'route' => '/expense_categories', 'controller' => 'expense_categories'],
                    ['label' => 'Expense List', 'route' => '/expenses', 'controller' => 'expenses'],
                    ['label' => 'Add Expense', 'route' => '/expenses', 'controller' => 'expenses'],
                ],
            ],
            [
                'main' => 'Income',
                'icon' => 'dripicons-rocket',
                'order' => 8,
                'items' => [
                    ['label' => 'Income Category', 'route' => '/income_categories', 'controller' => 'income_categories'],
                    ['label' => 'Income List', 'route' => '/incomes', 'controller' => 'incomes'],
                    ['label' => 'Add Income', 'route' => '/incomes', 'controller' => 'incomes'],
                ],
            ],
            [
                'main' => 'Booking',
                'icon' => 'dripicons-calendar',
                'order' => 9,
                'items' => [
                    ['label' => 'Booking', 'route' => '/bookings/calendar', 'controller' => 'booking'],
                ],
            ],
            [
                'main' => 'People',
                'icon' => 'dripicons-user',
                'order' => 10,
                'items' => [
                    ['label' => 'Customer List', 'route' => '/customer', 'controller' => 'customers'],
                    ['label' => 'Supplier List', 'route' => '/supplier', 'controller' => 'suppliers'],
                    ['label' => 'User List', 'route' => '/user', 'controller' => 'users'],
                    ['label' => 'Sale Agents', 'route' => '/sale-agents', 'controller' => 'sale-agents'],
                    ['label' => 'Biller List', 'route' => '/biller', 'controller' => 'billers'],
                ],
            ],
            [
                'main' => 'Accounting',
                'icon' => 'dripicons-briefcase',
                'order' => 11,
                'items' => [
                    ['label' => 'Account List', 'route' => '/accounts', 'controller' => 'accounts'],
                    ['label' => 'Add Account', 'route' => '/accounts', 'controller' => 'accounts'],
                    ['label' => 'Money Transfer', 'route' => '/money-transfers', 'controller' => 'money-transfers'],
                    ['label' => 'Balance Sheet', 'route' => '/balancesheet', 'controller' => 'balance-sheets'],
                    ['label' => 'Account Statement', 'route' => '/account-statement', 'controller' => 'account-statements'],
                ],
            ],
            [
                'main' => 'HRM',
                'icon' => 'dripicons-user-group',
                'order' => 12,
                'items' => [
                    ['label' => 'Department', 'route' => '/departments', 'controller' => 'departments'],
                    ['label' => 'Designation', 'route' => '/designations', 'controller' => 'designations'],
                    ['label' => 'Shift', 'route' => '/shift', 'controller' => 'shift'],
                    ['label' => 'Employee', 'route' => '/employees', 'controller' => 'employees'],
                    ['label' => 'Attendance', 'route' => '/attendance', 'controller' => 'attendance'],
                    ['label' => 'Holiday', 'route' => '/holidays', 'controller' => 'holidays'],
                    ['label' => 'Overtime', 'route' => '/overtime', 'controller' => 'overtime'],
                    ['label' => 'Leave Type', 'route' => '/leave-type', 'controller' => 'leave-types'],
                    ['label' => 'Leaves', 'route' => '/leave', 'controller' => 'leave'],
                    ['label' => 'Payroll', 'route' => '/payroll', 'controller' => 'payroll'],
                ],
            ],
            [
                'main' => 'WhatsApp',
                'icon' => 'dripicons-message',
                'order' => 13,
                'items' => [
                    ['label' => 'WhatsApp Settings', 'route' => '/whatsapp/settings', 'controller' => 'whatsapp'],
                    ['label' => 'Message Templates', 'route' => '/whatsapp/templates', 'controller' => 'whatsapp'],
                    ['label' => 'Send Message', 'route' => '/whatsapp/send', 'controller' => 'whatsapp'],
                ],
            ],
            [
                'main' => 'Reports',
                'icon' => 'dripicons-document-remove',
                'order' => 14,
                'items' => [
                    ['label' => 'Activity Log', 'route' => '/setting/activity-log', 'controller' => 'reports'],
                    ['label' => 'Profit / Loss', 'route' => '/report/profit-loss', 'controller' => 'reports'],
                    ['label' => 'Best Seller', 'route' => '/report/best_seller', 'controller' => 'reports'],
                    ['label' => 'Product Report', 'route' => '/report/product_report', 'controller' => 'reports'],
                    ['label' => 'Stock Report', 'route' => '/report/stock', 'controller' => 'reports'],
                    ['label' => 'Daily Sale', 'route' => "/report/daily_sale/{$year}/{$month}", 'controller' => 'reports'],
                    ['label' => 'Monthly Sale', 'route' => "/report/monthly_sale/{$year}", 'controller' => 'reports'],
                    ['label' => 'Daily Purchase', 'route' => "/report/daily_purchase/{$year}/{$month}", 'controller' => 'reports'],
                    ['label' => 'Monthly Purchase', 'route' => "/report/monthly_purchase/{$year}", 'controller' => 'reports'],
                    ['label' => 'Sale Report', 'route' => '/report/sale_report', 'controller' => 'reports'],
                    ['label' => 'Challan Report', 'route' => '/report/challan-report', 'controller' => 'reports'],
                    ['label' => 'Sale Report Chart', 'route' => '/report/sale-report-chart', 'controller' => 'reports'],
                    ['label' => 'Payment Report', 'route' => '/report/payment_report_by_date', 'controller' => 'reports'],
                    ['label' => 'Purchase Report', 'route' => '/report/purchase', 'controller' => 'reports'],
                    ['label' => 'Customer Report', 'route' => '/report/customer_report', 'controller' => 'reports'],
                    ['label' => 'Customer Group Report', 'route' => '/report/customer-group', 'controller' => 'reports'],
                    ['label' => 'Customer Due Report', 'route' => '/report/customer-due-report', 'controller' => 'reports'],
                    ['label' => 'Supplier Report', 'route' => '/report/supplier', 'controller' => 'reports'],
                    ['label' => 'Supplier Due Report', 'route' => '/report/supplier-due-report', 'controller' => 'reports'],
                    ['label' => 'Warehouse Report', 'route' => '/report/warehouse_report', 'controller' => 'reports'],
                    ['label' => 'Warehouse Stock Chart', 'route' => '/report/warehouse_stock', 'controller' => 'reports'],
                    ['label' => 'Product Expiry Report', 'route' => '/report/product-expiry', 'controller' => 'reports'],
                    ['label' => 'Product Quantity Alert', 'route' => '/report/product_quantity_alert', 'controller' => 'reports'],
                    ['label' => 'Daily Sale Objective Report', 'route' => '/report/daily-sale-objective', 'controller' => 'reports'],
                    ['label' => 'User Report', 'route' => '/report/user_report', 'controller' => 'reports'],
                    ['label' => 'Biller Report', 'route' => '/report/biller_report', 'controller' => 'reports'],
                    ['label' => 'Cash Register', 'route' => '/cash-register', 'controller' => 'cash_register'],
                ],
            ],
            [
                'main' => 'Settings',
                'icon' => 'dripicons-gear',
                'order' => 15,
                'items' => [
                    ['label' => 'Receipt Printers', 'route' => '/printers', 'controller' => 'printers'],
                    ['label' => 'Invoice Settings', 'route' => '/setting/invoice', 'controller' => 'invoice_setting'],
                    ['label' => 'Role Permission', 'route' => '/role', 'controller' => 'role'],
                    ['label' => 'SMS Template', 'route' => '/smstemplates', 'controller' => 'smstemplates'],
                    ['label' => 'Custom Field List', 'route' => '/custom-fields', 'controller' => 'custom-fields'],
                    ['label' => 'Discount Plan', 'route' => '/discount-plans', 'controller' => 'discount-plans'],
                    ['label' => 'Discount', 'route' => '/discounts', 'controller' => 'discounts'],
                    ['label' => 'All Notification', 'route' => '/notifications', 'controller' => 'notifications'],
                    ['label' => 'Send Notification', 'route' => '/notifications', 'controller' => 'notifications'],
                    ['label' => 'Warehouse', 'route' => '/warehouse', 'controller' => 'warehouse'],
                    ['label' => 'Tables', 'route' => '/tables', 'controller' => 'tables'],
                    ['label' => 'Customer Group', 'route' => '/customer_group', 'controller' => 'customer_group'],
                    ['label' => 'Currency', 'route' => '/currency', 'controller' => 'currency'],
                    ['label' => 'Tax', 'route' => '/tax', 'controller' => 'tax'],
                    ['label' => 'User Profile', 'route' => '/user-profile', 'controller' => 'user-profile'],
                    ['label' => 'Create SMS', 'route' => '/setting/createsms', 'controller' => 'setting'],
                    ['label' => 'Backup Database', 'route' => '/backup', 'controller' => 'setting'],
                    ['label' => 'General Setting', 'route' => '/setting/general_setting', 'controller' => 'general-settings'],
                    ['label' => 'Mail Setting', 'route' => '/setting/mail_setting', 'controller' => 'setting'],
                    ['label' => 'Reward Point Setting', 'route' => '/setting/reward-point-setting', 'controller' => 'reward-point-settings'],
                    ['label' => 'SMS Setting', 'route' => '/setting/sms_setting', 'controller' => 'sms-settings'],
                    ['label' => 'Payment Gateways', 'route' => '/setting/payment-gateways/list', 'controller' => 'setting'],
                    ['label' => 'POS Settings', 'route' => '/setting/pos_setting', 'controller' => 'pos-settings'],
                    ['label' => 'POS Terminals', 'route' => '/terminals', 'controller' => 'terminals'],
                    ['label' => 'HRM Setting', 'route' => '/setting/hrm_setting', 'controller' => 'hrm-settings'],
                    ['label' => 'Barcode Settings', 'route' => '/barcodes', 'controller' => 'barcode-settings'],
                    ['label' => 'Languages', 'route' => '/languages', 'controller' => 'languages'],
                ],
            ],
        ];

        foreach ($sections as $section) {
            $childOrder = 1;
            foreach ($section['items'] as $item) {
                Menu::create([
                    'main_menu' => $section['main'],
                    'main_menu_icon' => $section['icon'],
                    'main_menu_order' => $section['order'],
                    'sub_menu' => $item['label'],
                    'sub_menu_icon' => $section['icon'],
                    'sub_menu_route' => $item['route'],
                    'sub_menu_order' => 1,
                    'child_menu_order' => $childOrder++,
                    'controller' => $item['controller'],
                    'is_active' => true,
                ]);
            }
        }

        $this->command?->info('Menu seeded successfully! Total menus created: ' . Menu::count());
    }
}
