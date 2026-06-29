<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions for each module
        $permissions = [
            // Users
            'users.view', 'users.create', 'users.edit', 'users.delete',
            
            // Products
            'products.view', 'products.create', 'products.edit', 'products.delete',
            
            // Categories & Brands & Units
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'brands.view', 'brands.create', 'brands.edit', 'brands.delete',
            'units.view', 'units.create', 'units.edit', 'units.delete',
            
            // Barcodes
            'barcodes.view', 'barcodes.create', 'barcodes.edit', 'barcodes.delete',
            
            // Adjustments & Stock Count
            'adjustments.view', 'adjustments.create', 'adjustments.edit', 'adjustments.delete',
            'stock-counts.view', 'stock-counts.create', 'stock-counts.edit', 'stock-counts.delete',
            
            // Purchases
            'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete',
            'purchase-returns-view', 'purchase-returns-create', 'purchase-returns-edit', 'purchase-returns-delete',
            
            // Sales
            'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
            'pos-view', 'pos-create',
            'packing-slips.view', 'packing-slips.create', 'packing-slips.edit', 'packing-slips.delete',
            'challans.view', 'challans.create', 'challans.edit', 'challans.delete',
            'deliveries.view', 'deliveries.create', 'deliveries.edit', 'deliveries.delete',
            'gift-cards.view', 'gift-cards.create', 'gift-cards.edit', 'gift-cards.delete',
            'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
            'couriers.view', 'couriers.create', 'couriers.edit', 'couriers.delete',
            
            // Returns
            'returns.view', 'returns.create', 'returns.edit', 'returns.delete',
            
            // Quotations
            'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.delete',
            
            // Transfers
            'transfers.view', 'transfers.create', 'transfers.edit', 'transfers.delete',
            
            // Expenses & Income
            'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
            'incomes.view', 'incomes.create', 'incomes.edit', 'incomes.delete',
            
            // People
            'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
            'billers.view', 'billers.create', 'billers.edit', 'billers.delete',
            
            // Accounting
            'accounts.view', 'accounts.create', 'accounts.edit', 'accounts.delete',
            'money-transfers.view', 'money-transfers.create', 'money-transfers.edit', 'money-transfers.delete',
            'balance-sheets.view', 'account-statements.view',
            
            // HRM
            'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
            'designations.view', 'designations.create', 'designations.edit', 'designations.delete',
            'shifts.view', 'shifts.create', 'shifts.edit', 'shifts.delete',
            'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
            'attendance.view', 'attendance.create', 'attendance.edit', 'attendance.delete',
            'holidays.view', 'holidays.create', 'holidays.edit', 'holidays.delete',
            'overtime.view', 'overtime.create', 'overtime.edit', 'overtime.delete',
            'leave-types.view', 'leave-types.create', 'leave-types.edit', 'leave-types.delete',
            'leaves.view', 'leaves.create', 'leaves.edit', 'leaves.delete',
            'payrolls.view', 'payrolls.create', 'payrolls.edit', 'payrolls.delete',
            
            // Reports
            'reports.view', 'reports.export',
            'activity-logs.view',
            
            // Settings
            'printers.view', 'printers.create', 'printers.edit', 'printers.delete',
            'invoice-settings.view', 'invoice-settings.edit',
            'role-permissions.view', 'role-permissions.edit',
            'sms-templates.view', 'sms-templates.create', 'sms-templates.edit', 'sms-templates.delete',
            'custom-fields-view', 'custom-fields-create', 'custom-fields-edit', 'custom-fields-delete',
            'discount-plans.view', 'discount-plans.create', 'discount-plans.edit', 'discount-plans.delete',
            'discounts.view', 'discounts.create', 'discounts.edit', 'discounts.delete',
            'notifications.view', 'notifications.create', 'notifications.edit', 'notifications.delete',
            'warehouses-view', 'warehouses-create', 'warehouses-edit', 'warehouses-delete',
            'tables.view', 'tables.create', 'tables.edit', 'tables.delete',
            'customer-groups.view', 'customer-groups.create', 'customer-groups.edit', 'customer-groups.delete',
            'currencies-view', 'currencies-create', 'currencies-edit', 'currencies-delete',
            'taxes.view', 'taxes.create', 'taxes.edit', 'taxes.delete',
            'user-profile.view', 'user-profile.edit',
            'general-settings.view', 'general-settings.edit',
            'mail-settings.view', 'mail-settings.edit',
            'reward-point-settings.view', 'reward-point-settings.edit',
            'sms-settings.view', 'sms-settings.edit',
            'payment-gateways.view', 'payment-gateways.edit',
            'pos-settings.view', 'pos-settings.edit',
            'hrm-settings.view', 'hrm-settings.edit',
            'barcode-settings.view', 'barcode-settings.edit',
            'languages.view', 'languages.create', 'languages.edit', 'languages.delete',
            'backup-database.view', 'backup-database.create',
            
            // Payments
            'payments.view', 'payments.create', 'payments.edit', 'payments.delete',
            
            // Menus
            'menu.view', 'menu.save', 'menu.edit', 'menu.delete',
            
            // Categories (API)
            'category.view', 'category.save', 'category.edit', 'category.delete',
        ];

        // Create all permissions (skip if already exists)
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission], ['guard_name' => 'sanctum']);
        }

        // Create roles and assign permissions
        
        // Super Admin - has all permissions
        $superAdmin = Role::create(['name' => 'super-admin', 'guard_name' => 'sanctum']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin - has most permissions except critical system settings
        $admin = Role::create(['name' => 'admin', 'guard_name' => 'sanctum']);
        $admin->givePermissionTo([
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
            'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete',
            'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
            'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
            'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.delete',
            'returns.view', 'returns.create', 'returns.edit', 'returns.delete',
            'transfers.view', 'transfers.create', 'transfers.edit', 'transfers.delete',
            'adjustments.view', 'adjustments.create', 'adjustments.edit', 'adjustments.delete',
            'reports.view', 'reports.export',
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'brands.view', 'brands.create', 'brands.edit', 'brands.delete',
            'payments.view', 'payments.create', 'payments.edit', 'payments.delete',
            'category.view', 'category.save', 'category.edit', 'category.delete',
            'menu.view', 'menu.save', 'menu.edit', 'menu.delete',
            'role-permissions.view', 'role-permissions.edit',
        ]);

        // Manager - can manage daily operations
        $manager = Role::create(['name' => 'manager', 'guard_name' => 'sanctum']);
        $manager->givePermissionTo([
            'products.view', 'products.create', 'products.edit',
            'sales.view', 'sales.create', 'sales.edit',
            'purchases.view', 'purchases.create', 'purchases.edit',
            'customers.view', 'customers.create', 'customers.edit',
            'suppliers.view', 'suppliers.create', 'suppliers.edit',
            'expenses.view', 'expenses.create',
            'quotations.view', 'quotations.create', 'quotations.edit',
            'returns.view', 'returns.create',
            'transfers.view', 'transfers.create',
            'adjustments.view', 'adjustments.create',
            'reports.view',
            'payments.view', 'payments.create',
            'categories.view', 'categories.create', 'categories.edit',
            'category.view', 'category.save', 'category.edit',
        ]);

        // Cashier - limited to sales and basic operations
        $cashier = Role::create(['name' => 'cashier', 'guard_name' => 'sanctum']);
        $cashier->givePermissionTo([
            'products.view',
            'sales.view', 'sales.create',
            'customers.view',
            'quotations.view', 'quotations.create',
            'returns.view', 'returns.create',
            'payments.view', 'payments.create',
        ]);

        // Sales Person - focused on sales and customers
        $salesPerson = Role::create(['name' => 'sales-person', 'guard_name' => 'sanctum']);
        $salesPerson->givePermissionTo([
            'products.view',
            'sales.view', 'sales.create', 'sales.edit',
            'customers.view', 'customers.create', 'customers.edit',
            'quotations.view', 'quotations.create', 'quotations.edit',
            'returns.view', 'returns.create',
        ]);

        // Warehouse Manager - focused on inventory
        $warehouseManager = Role::create(['name' => 'warehouse-manager', 'guard_name' => 'sanctum']);
        $warehouseManager->givePermissionTo([
            'products.view', 'products.create', 'products.edit',
            'purchases.view', 'purchases.create', 'purchases.edit',
            'suppliers.view',
            'transfers.view', 'transfers.create', 'transfers.edit',
            'adjustments.view', 'adjustments.create', 'adjustments.edit',
            'categories.view', 'categories.create', 'categories.edit',
            'category.view', 'category.save', 'category.edit',
        ]);

        // Accountant - focused on financial operations
        $accountant = Role::create(['name' => 'accountant', 'guard_name' => 'sanctum']);
        $accountant->givePermissionTo([
            'expenses.view', 'expenses.create', 'expenses.edit',
            'incomes.view', 'incomes.create', 'incomes.edit',
            'accounts.view', 'accounts.create', 'accounts.edit',
            'money-transfers.view', 'money-transfers.create', 'money-transfers.edit',
            'reports.view', 'reports.export',
            'payments.view', 'payments.create', 'payments.edit',
        ]);

        $this->command->info('Roles and permissions created successfully!');
    }
}
