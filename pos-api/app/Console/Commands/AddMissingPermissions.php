<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AddMissingPermissions extends Command
{
    protected $signature = 'permissions:add-missing';
    protected $description = 'Add all missing permissions from RolePermissionSeeder';

    public function handle()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $allPermissions = [
            // Users
            'users-view', 'users-create', 'users-edit', 'users-delete',
            
            // Products
            'products-view', 'products-create', 'products-edit', 'products-delete',
            
            // Categories & Brands & Units
            'categories-view', 'categories-create', 'categories-edit', 'categories-delete',
            'brands-view', 'brands-create', 'brands-edit', 'brands-delete',
            'units-view', 'units-create', 'units-edit', 'units-delete',
            
            // Barcodes
            'barcodes-view', 'barcodes-create', 'barcodes-edit', 'barcodes-delete',
            
            // Adjustments & Stock Count
            'adjustments-view', 'adjustments-create', 'adjustments-edit', 'adjustments-delete',
            'stock-counts-view', 'stock-counts-create', 'stock-counts-edit', 'stock-counts-delete',
            
            // Purchases
            'purchases-view', 'purchases-create', 'purchases-edit', 'purchases-delete',
            'purchase-returns-view', 'purchase-returns-create', 'purchase-returns-edit', 'purchase-returns-delete',
            
            // Sales
            'sales-view', 'sales-create', 'sales-edit', 'sales-delete',
            'pos-view', 'pos-create',
            'packing-slips-view', 'packing-slips-create', 'packing-slips-edit', 'packing-slips-delete',
            'challans-view', 'challans-create', 'challans-edit', 'challans-delete',
            'deliveries-view', 'deliveries-create', 'deliveries-edit', 'deliveries-delete',
            'gift-cards-view', 'gift-cards-create', 'gift-cards-edit', 'gift-cards-delete',
            'coupons-view', 'coupons-create', 'coupons-edit', 'coupons-delete',
            'couriers-view', 'couriers-create', 'couriers-edit', 'couriers-delete',
            
            // Returns
            'returns-view', 'returns-create', 'returns-edit', 'returns-delete',
            
            // Quotations
            'quotations-view', 'quotations-create', 'quotations-edit', 'quotations-delete',
            
            // Transfers
            'transfers-view', 'transfers-create', 'transfers-edit', 'transfers-delete',
            
            // Expenses & Income
            'expenses-view', 'expenses-create', 'expenses-edit', 'expenses-delete',
            'incomes-view', 'incomes-create', 'incomes-edit', 'incomes-delete',
            
            // People
            'customers-view', 'customers-create', 'customers-edit', 'customers-delete',
            'suppliers-view', 'suppliers-create', 'suppliers-edit', 'suppliers-delete',
            'billers-view', 'billers-create', 'billers-edit', 'billers-delete',
            
            // Accounting
            'accounts-view', 'accounts-create', 'accounts-edit', 'accounts-delete',
            'money-transfers-view', 'money-transfers-create', 'money-transfers-edit', 'money-transfers-delete',
            'balance-sheets-view', 'account-statements-view',
            
            // HRM
            'departments-view', 'departments-create', 'departments-edit', 'departments-delete',
            'designations-view', 'designations-create', 'designations-edit', 'designations-delete',
            'shifts-view', 'shifts-create', 'shifts-edit', 'shifts-delete',
            'employees-view', 'employees-create', 'employees-edit', 'employees-delete',
            'attendance-view', 'attendance-create', 'attendance-edit', 'attendance-delete',
            'holidays-view', 'holidays-create', 'holidays-edit', 'holidays-delete',
            'overtime-view', 'overtime-create', 'overtime-edit', 'overtime-delete',
            'leave-types-view', 'leave-types-create', 'leave-types-edit', 'leave-types-delete',
            'leaves-view', 'leaves-create', 'leaves-edit', 'leaves-delete',
            'payrolls-view', 'payrolls-create', 'payrolls-edit', 'payrolls-delete',
            
            // Reports
            'reports-view', 'reports-export',
            'activity-logs-view',
            
            // Settings
            'printers-view', 'printers-create', 'printers-edit', 'printers-delete',
            'invoice-settings-view', 'invoice-settings-edit',
            'role-permissions-view', 'role-permissions-edit',
            'sms-templates-view', 'sms-templates-create', 'sms-templates-edit', 'sms-templates-delete',
            'custom-fields-view', 'custom-fields-create', 'custom-fields-edit', 'custom-fields-delete',
            'discount-plans-view', 'discount-plans-create', 'discount-plans-edit', 'discount-plans-delete',
            'discounts-view', 'discounts-create', 'discounts-edit', 'discounts-delete',
            'notifications-view', 'notifications-create', 'notifications-edit', 'notifications-delete',
            'warehouses-view', 'warehouses-create', 'warehouses-edit', 'warehouses-delete',
            'tables-view', 'tables-create', 'tables-edit', 'tables-delete',
            'customer-groups-view', 'customer-groups-create', 'customer-groups-edit', 'customer-groups-delete',
            'currencies-view', 'currencies-create', 'currencies-edit', 'currencies-delete',
            'taxes-view', 'taxes-create', 'taxes-edit', 'taxes-delete',
            'user-profile-view', 'user-profile-edit',
            'general-settings-view', 'general-settings-edit',
            'mail-settings-view', 'mail-settings-edit',
            'reward-point-settings-view', 'reward-point-settings-edit',
            'sms-settings-view', 'sms-settings-edit',
            'payment-gateways-view', 'payment-gateways-edit',
            'pos-settings-view', 'pos-settings-edit',
            'hrm-settings-view', 'hrm-settings-edit',
            'barcode-settings-view', 'barcode-settings-edit',
            'languages-view', 'languages-create', 'languages-edit', 'languages-delete',
            'backup-database-view', 'backup-database-create',
            
            // Payments
            'payments-view', 'payments-create', 'payments-edit', 'payments-delete',
            
            // Menus
            'menu.view', 'menu.save', 'menu.edit', 'menu.delete',
        ];

        $this->info('Adding missing permissions...');
        $newCount = 0;

        // Create permissions if they don't exist
        foreach ($allPermissions as $permissionName) {
            $permission = Permission::firstOrCreate(
                ['name' => $permissionName],
                ['guard_name' => 'web']
            );
            
            if ($permission->wasRecentlyCreated) {
                $this->line("✓ Created: {$permissionName}");
                $newCount++;
            }
        }

        if ($newCount === 0) {
            $this->info('All permissions already exist.');
        } else {
            $this->info("\n✓ Added {$newCount} new permissions");
        }

        // Give all permissions to super-admin
        $superAdmin = Role::where('name', 'super-admin')->first();
        if ($superAdmin) {
            $superAdmin->syncPermissions(Permission::all());
            $this->info('✓ Updated super-admin role with all permissions');
        }

        $this->info("\nTotal permissions: " . Permission::count());

        return Command::SUCCESS;
    }
}
