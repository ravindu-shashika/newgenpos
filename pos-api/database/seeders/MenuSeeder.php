<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing menu data
        Menu::truncate();

        $mainMenuOrder = 1;

        // Product Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Product', 'pi pi-fw pi-user', $mainMenuOrder, 1, [
            ['label' => 'Category', 'icon' => 'pi pi-fw pi-times-circle', 'route' => '/product/category', 'controller' => 'categories'],
            ['label' => 'Brand', 'icon' => 'pi pi-fw pi-lock', 'route' => '/product/brand', 'controller' => 'brands'],
            ['label' => 'Unit', 'icon' => 'pi pi-fw pi-calculator', 'route' => '/product/unit', 'controller' => 'units'],
            ['label' => 'Product List', 'icon' => 'pi pi-fw pi-box', 'route' => '/product/list', 'controller' => 'products'],
            ['label' => 'Add Product', 'icon' => 'pi pi-fw pi-plus', 'route' => '/product/add', 'controller' => 'products'],
            ['label' => 'Print Barcode', 'icon' => 'pi pi-fw pi-print', 'route' => '/product/print-barcode', 'controller' => 'barcodes'],
            ['label' => 'Adjustment List', 'icon' => 'pi pi-fw pi-sliders-h', 'route' => '/product/adjustment-list', 'controller' => 'adjustments'],
            ['label' => 'Add Adjustment', 'icon' => 'pi pi-fw pi-plus-circle', 'route' => '/product/add-adjustment', 'controller' => 'adjustments'],
            ['label' => 'Stock Count', 'icon' => 'pi pi-fw pi-chart-bar', 'route' => '/product/stock-count', 'controller' => 'stock-counts'],
        ]);

        // Purchase Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Purchase', 'pi pi-fw pi-shopping-cart', $mainMenuOrder, 2, [
            ['label' => 'Purchase List', 'icon' => 'pi pi-fw pi-list', 'route' => '/purchase/list', 'controller' => 'purchases'],
            ['label' => 'Add Purchase', 'icon' => 'pi pi-fw pi-plus', 'route' => '/purchase/add', 'controller' => 'purchases'],
            ['label' => 'Import Purchase By CSV', 'icon' => 'pi pi-fw pi-upload', 'route' => '/purchase/import-csv', 'controller' => 'purchases'],
            ['label' => 'Purchase Return List', 'icon' => 'pi pi-fw pi-undo', 'route' => '/purchase/return-list', 'controller' => 'purchase-returns'],
        ]);

        // Sale Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Sale', 'pi pi-fw pi-shopping-bag', $mainMenuOrder, 3, [
            ['label' => 'Sale List', 'icon' => 'pi pi-fw pi-list', 'route' => '/sale/list', 'controller' => 'sales'],
            ['label' => 'POS', 'icon' => 'pi pi-fw pi-desktop', 'route' => '/sale/pos', 'controller' => 'pos'],
            ['label' => 'Add Sale', 'icon' => 'pi pi-fw pi-plus', 'route' => '/sale/add', 'controller' => 'sales'],
            ['label' => 'Import Sale By CSV', 'icon' => 'pi pi-fw pi-upload', 'route' => '/sale/import-csv', 'controller' => 'sales'],
            ['label' => 'Packing Slip List', 'icon' => 'pi pi-fw pi-file', 'route' => '/sale/packing-slip-list', 'controller' => 'packing-slips'],
            ['label' => 'Challan List', 'icon' => 'pi pi-fw pi-file-pdf', 'route' => '/sale/challan-list', 'controller' => 'challans'],
            ['label' => 'Delivery List', 'icon' => 'pi pi-fw pi-truck', 'route' => '/sale/delivery-list', 'controller' => 'deliveries'],
            ['label' => 'Gift Card List', 'icon' => 'pi pi-fw pi-gift', 'route' => '/sale/gift-card-list', 'controller' => 'gift-cards'],
            ['label' => 'Coupon List', 'icon' => 'pi pi-fw pi-ticket', 'route' => '/sale/coupon-list', 'controller' => 'coupons'],
            ['label' => 'Courier List', 'icon' => 'pi pi-fw pi-send', 'route' => '/sale/courier-list', 'controller' => 'couriers'],
            ['label' => 'Sale Return', 'icon' => 'pi pi-fw pi-undo', 'route' => '/sale/return', 'controller' => 'returns'],
        ]);

        // Quotation Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Quotation', 'pi pi-fw pi-file-edit', $mainMenuOrder, 4, [
            ['label' => 'Quotation List', 'icon' => 'pi pi-fw pi-list', 'route' => '/quotation/list', 'controller' => 'quotations'],
            ['label' => 'Add Quotation', 'icon' => 'pi pi-fw pi-plus', 'route' => '/quotation/add', 'controller' => 'quotations'],
        ]);

        // Transfer Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Transfer', 'pi pi-fw pi-arrow-right-arrow-left', $mainMenuOrder, 5, [
            ['label' => 'Transfer List', 'icon' => 'pi pi-fw pi-list', 'route' => '/transfer/list', 'controller' => 'transfers'],
            ['label' => 'Add Transfer', 'icon' => 'pi pi-fw pi-plus', 'route' => '/transfer/add', 'controller' => 'transfers'],
            ['label' => 'Import Transfer By CSV', 'icon' => 'pi pi-fw pi-upload', 'route' => '/transfer/import-csv', 'controller' => 'transfers'],
        ]);

        // Expense Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Expense', 'pi pi-fw pi-wallet', $mainMenuOrder, 6, [
            ['label' => 'Expense List', 'icon' => 'pi pi-fw pi-list', 'route' => '/expense/list', 'controller' => 'expenses'],
            ['label' => 'Add Expense', 'icon' => 'pi pi-fw pi-plus', 'route' => '/expense/add', 'controller' => 'expenses'],
        ]);

        // Income Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Income', 'pi pi-fw pi-money-bill', $mainMenuOrder, 7, [
            ['label' => 'Income List', 'icon' => 'pi pi-fw pi-list', 'route' => '/income/list', 'controller' => 'incomes'],
            ['label' => 'Add Income', 'icon' => 'pi pi-fw pi-plus', 'route' => '/income/add', 'controller' => 'incomes'],
        ]);

        // People Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'People', 'pi pi-fw pi-users', $mainMenuOrder, 8, [
            ['label' => 'Customer List', 'icon' => 'pi pi-fw pi-user', 'route' => '/people/customer-list', 'controller' => 'customers'],
            ['label' => 'Supplier List', 'icon' => 'pi pi-fw pi-building', 'route' => '/people/supplier-list', 'controller' => 'suppliers'],
            ['label' => 'User List', 'icon' => 'pi pi-fw pi-users', 'route' => '/people/user-list', 'controller' => 'users'],
            ['label' => 'Sale Agents', 'icon' => 'pi pi-fw pi-user-plus', 'route' => '/people/sale-agents', 'controller' => 'employees'],
            ['label' => 'Biller List', 'icon' => 'pi pi-fw pi-id-card', 'route' => '/people/biller-list', 'controller' => 'billers'],
        ]);

        // Accounting Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Accounting', 'pi pi-fw pi-calculator', $mainMenuOrder, 9, [
            ['label' => 'Account List', 'icon' => 'pi pi-fw pi-list', 'route' => '/accounting/account-list', 'controller' => 'accounts'],
            ['label' => 'Add Account', 'icon' => 'pi pi-fw pi-plus', 'route' => '/accounting/add-account', 'controller' => 'accounts'],
            ['label' => 'Money Transfer', 'icon' => 'pi pi-fw pi-arrow-right-arrow-left', 'route' => '/accounting/money-transfer', 'controller' => 'money-transfers'],
            ['label' => 'Balance Sheet', 'icon' => 'pi pi-fw pi-chart-line', 'route' => '/accounting/balance-sheet', 'controller' => 'balance-sheets'],
            ['label' => 'Account Statement', 'icon' => 'pi pi-fw pi-file', 'route' => '/accounting/account-statement', 'controller' => 'account-statements'],
        ]);

        // HRM Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'HRM', 'pi pi-fw pi-sitemap', $mainMenuOrder, 10, [
            ['label' => 'Department', 'icon' => 'pi pi-fw pi-building', 'route' => '/hrm/department', 'controller' => 'departments'],
            ['label' => 'Designation', 'icon' => 'pi pi-fw pi-id-card', 'route' => '/hrm/designation', 'controller' => 'designations'],
            ['label' => 'Shift', 'icon' => 'pi pi-fw pi-clock', 'route' => '/hrm/shift', 'controller' => 'shifts'],
            ['label' => 'Employee', 'icon' => 'pi pi-fw pi-users', 'route' => '/hrm/employee', 'controller' => 'employees'],
            ['label' => 'Attendance', 'icon' => 'pi pi-fw pi-check-circle', 'route' => '/hrm/attendance', 'controller' => 'attendance'],
            ['label' => 'Holiday', 'icon' => 'pi pi-fw pi-calendar', 'route' => '/hrm/holiday', 'controller' => 'holidays'],
            ['label' => 'Overtime', 'icon' => 'pi pi-fw pi-hourglass', 'route' => '/hrm/overtime', 'controller' => 'overtime'],
            ['label' => 'Leave Type', 'icon' => 'pi pi-fw pi-tag', 'route' => '/hrm/leave-type', 'controller' => 'leave-types'],
            ['label' => 'Leaves', 'icon' => 'pi pi-fw pi-calendar-times', 'route' => '/hrm/leaves', 'controller' => 'leaves'],
            ['label' => 'Payroll', 'icon' => 'pi pi-fw pi-money-bill', 'route' => '/hrm/payroll', 'controller' => 'payrolls'],
        ]);

        // Reports Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Reports', 'pi pi-fw pi-chart-bar', $mainMenuOrder, 11, [
            ['label' => 'Activity Log', 'icon' => 'pi pi-fw pi-history', 'route' => '/reports/activity-log', 'controller' => 'activity-logs'],
            ['label' => 'Summary Report', 'icon' => 'pi pi-fw pi-file', 'route' => '/reports/summary-report', 'controller' => 'reports'],
            ['label' => 'Best Seller', 'icon' => 'pi pi-fw pi-star', 'route' => '/reports/best-seller', 'controller' => 'reports'],
            ['label' => 'Product Report', 'icon' => 'pi pi-fw pi-box', 'route' => '/reports/product-report', 'controller' => 'reports'],
            ['label' => 'Daily Sale', 'icon' => 'pi pi-fw pi-calendar', 'route' => '/reports/daily-sale', 'controller' => 'reports'],
            ['label' => 'Monthly Sale', 'icon' => 'pi pi-fw pi-calendar-plus', 'route' => '/reports/monthly-sale', 'controller' => 'reports'],
            ['label' => 'Daily Purchase', 'icon' => 'pi pi-fw pi-calendar', 'route' => '/reports/daily-purchase', 'controller' => 'reports'],
            ['label' => 'Monthly Purchase', 'icon' => 'pi pi-fw pi-calendar-plus', 'route' => '/reports/monthly-purchase', 'controller' => 'reports'],
            ['label' => 'Sale Report', 'icon' => 'pi pi-fw pi-shopping-bag', 'route' => '/reports/sale-report', 'controller' => 'reports'],
            ['label' => 'Challan Report', 'icon' => 'pi pi-fw pi-file-pdf', 'route' => '/reports/challan-report', 'controller' => 'reports'],
            ['label' => 'Sale Report Chart', 'icon' => 'pi pi-fw pi-chart-line', 'route' => '/reports/sale-report-chart', 'controller' => 'reports'],
            ['label' => 'Payment Report', 'icon' => 'pi pi-fw pi-credit-card', 'route' => '/reports/payment-report', 'controller' => 'reports'],
            ['label' => 'Purchase Report', 'icon' => 'pi pi-fw pi-shopping-cart', 'route' => '/reports/purchase-report', 'controller' => 'reports'],
            ['label' => 'Customer Report', 'icon' => 'pi pi-fw pi-user', 'route' => '/reports/customer-report', 'controller' => 'reports'],
            ['label' => 'Customer Group Report', 'icon' => 'pi pi-fw pi-users', 'route' => '/reports/customer-group-report', 'controller' => 'reports'],
            ['label' => 'Customer Due Report', 'icon' => 'pi pi-fw pi-exclamation-circle', 'route' => '/reports/customer-due-report', 'controller' => 'reports'],
            ['label' => 'Supplier Report', 'icon' => 'pi pi-fw pi-building', 'route' => '/reports/supplier-report', 'controller' => 'reports'],
            ['label' => 'Supplier Due Report', 'icon' => 'pi pi-fw pi-exclamation-triangle', 'route' => '/reports/supplier-due-report', 'controller' => 'reports'],
            ['label' => 'Warehouse Report', 'icon' => 'pi pi-fw pi-warehouse', 'route' => '/reports/warehouse-report', 'controller' => 'reports'],
            ['label' => 'Warehouse Stock Chart', 'icon' => 'pi pi-fw pi-chart-pie', 'route' => '/reports/warehouse-stock-chart', 'controller' => 'reports'],
            ['label' => 'Product Expiry Report', 'icon' => 'pi pi-fw pi-calendar-times', 'route' => '/reports/product-expiry-report', 'controller' => 'reports'],
            ['label' => 'Product Quantity Alert', 'icon' => 'pi pi-fw pi-bell', 'route' => '/reports/product-quantity-alert', 'controller' => 'reports'],
            ['label' => 'Daily Sale Objective Report', 'icon' => 'pi pi-fw pi-flag', 'route' => '/reports/daily-sale-objective-report', 'controller' => 'reports'],
            ['label' => 'User Report', 'icon' => 'pi pi-fw pi-user', 'route' => '/reports/user-report', 'controller' => 'reports'],
            ['label' => 'Biller Report', 'icon' => 'pi pi-fw pi-id-card', 'route' => '/reports/biller-report', 'controller' => 'reports'],
            ['label' => 'Cash Register', 'icon' => 'pi pi-fw pi-wallet', 'route' => '/reports/cash-register', 'controller' => 'reports'],
        ]);

        // Settings Menu
        $this->createSubMenu('Main', 'pi pi-fw pi-briefcase', 'Settings', 'pi pi-fw pi-cog', $mainMenuOrder, 12, [
            ['label' => 'Receipt Printers', 'icon' => 'pi pi-fw pi-print', 'route' => '/settings/receipt-printers', 'controller' => 'printers'],
            ['label' => 'Invoice Settings', 'icon' => 'pi pi-fw pi-file-edit', 'route' => '/settings/invoice-settings', 'controller' => 'invoice-settings'],
            ['label' => 'Role Permission', 'icon' => 'pi pi-fw pi-shield', 'route' => '/settings/role-permission', 'controller' => 'role-permissions'],
            ['label' => 'SMS Template', 'icon' => 'pi pi-fw pi-comment', 'route' => '/settings/sms-template', 'controller' => 'sms-templates'],
            ['label' => 'Custom Field List', 'icon' => 'pi pi-fw pi-list', 'route' => '/settings/custom-field-list', 'controller' => 'custom-fields'],
            ['label' => 'Discount Plan', 'icon' => 'pi pi-fw pi-percentage', 'route' => '/settings/discount-plan', 'controller' => 'discount-plans'],
            ['label' => 'Discount', 'icon' => 'pi pi-fw pi-tag', 'route' => '/settings/discount', 'controller' => 'discounts'],
            ['label' => 'All Notification', 'icon' => 'pi pi-fw pi-bell', 'route' => '/settings/all-notification', 'controller' => 'notifications'],
            ['label' => 'Send Notification', 'icon' => 'pi pi-fw pi-send', 'route' => '/settings/send-notification', 'controller' => 'notifications'],
            ['label' => 'Warehouse', 'icon' => 'pi pi-fw pi-warehouse', 'route' => '/settings/warehouse', 'controller' => 'warehouses'],
            ['label' => 'Tables', 'icon' => 'pi pi-fw pi-table', 'route' => '/settings/tables', 'controller' => 'tables'],
            ['label' => 'Customer Group', 'icon' => 'pi pi-fw pi-users', 'route' => '/settings/customer-group', 'controller' => 'customer-groups'],
            ['label' => 'Currency', 'icon' => 'pi pi-fw pi-dollar', 'route' => '/settings/currency', 'controller' => 'currencies'],
            ['label' => 'Tax', 'icon' => 'pi pi-fw pi-percentage', 'route' => '/settings/tax', 'controller' => 'taxes'],
            ['label' => 'User Profile', 'icon' => 'pi pi-fw pi-user', 'route' => '/settings/user-profile', 'controller' => 'user-profile'],
            ['label' => 'Create SMS', 'icon' => 'pi pi-fw pi-mobile', 'route' => '/settings/create-sms', 'controller' => 'sms-templates'],
            ['label' => 'Backup Database', 'icon' => 'pi pi-fw pi-database', 'route' => '/settings/backup-database', 'controller' => 'backup-database'],
            ['label' => 'General Setting', 'icon' => 'pi pi-fw pi-wrench', 'route' => '/settings/general-setting', 'controller' => 'general-settings'],
            ['label' => 'Mail Setting', 'icon' => 'pi pi-fw pi-envelope', 'route' => '/settings/mail-setting', 'controller' => 'mail-settings'],
            ['label' => 'Reward Point Setting', 'icon' => 'pi pi-fw pi-star', 'route' => '/settings/reward-point-setting', 'controller' => 'reward-point-settings'],
            ['label' => 'SMS Setting', 'icon' => 'pi pi-fw pi-comment', 'route' => '/settings/sms-setting', 'controller' => 'sms-settings'],
            ['label' => 'Payment Gateways', 'icon' => 'pi pi-fw pi-credit-card', 'route' => '/settings/payment-gateways', 'controller' => 'payment-gateways'],
            ['label' => 'POS Settings', 'icon' => 'pi pi-fw pi-desktop', 'route' => '/settings/pos-settings', 'controller' => 'pos-settings'],
            ['label' => 'HRM Setting', 'icon' => 'pi pi-fw pi-sitemap', 'route' => '/settings/hrm-setting', 'controller' => 'hrm-settings'],
            ['label' => 'Barcode Settings', 'icon' => 'pi pi-fw pi-qrcode', 'route' => '/settings/barcode-settings', 'controller' => 'barcode-settings'],
            ['label' => 'Languages', 'icon' => 'pi pi-fw pi-globe', 'route' => '/settings/languages', 'controller' => 'languages'],
        ]);

        $this->command->info('Menu seeded successfully! Total menus created: ' . Menu::count());
    }

    /**
     * Create submenu with child items
     */
    private function createSubMenu($mainMenu, $mainIcon, $subMenu, $subIcon, $mainOrder, $subOrder, $items)
    {
        $childOrder = 1;
        foreach ($items as $item) {
            Menu::create([
                'main_menu' => $mainMenu,
                'main_menu_icon' => $mainIcon,
                'main_menu_order' => $mainOrder,
                'sub_menu' => $subMenu,
                'sub_menu_icon' => $subIcon,
                'sub_menu_order' => $subOrder,
                'second_sub_menu' => $item['label'],
                'second_sub_menu_icon' => $item['icon'],
                'route' => $item['route'],
                'controller' => $item['controller'],
                'child_menu_order' => $childOrder++,
                'is_active' => true,
            ]);
        }
    }
}
