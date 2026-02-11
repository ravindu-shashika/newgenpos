<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AddMenuPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'permissions:add-menu';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add menu permissions to the system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $menuPermissions = [
            'menu.view',
            'menu.save',
            'menu.edit',
            'menu.delete',
        ];

        $this->info('Adding menu permissions...');

        // Create permissions if they don't exist
        foreach ($menuPermissions as $permissionName) {
            $permission = Permission::firstOrCreate(
                ['name' => $permissionName],
                ['guard_name' => 'web']
            );
            $this->line("✓ Permission: {$permissionName}");
        }

        // Give all menu permissions to super-admin and admin roles
        $superAdmin = Role::where('name', 'super-admin')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo($menuPermissions);
            $this->info('✓ Added menu permissions to super-admin role');
        }

        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->givePermissionTo($menuPermissions);
            $this->info('✓ Added menu permissions to admin role');
        }

        $manager = Role::where('name', 'manager')->first();
        if ($manager) {
            $manager->givePermissionTo(['menu.view']);
            $this->info('✓ Added menu.view permission to manager role');
        }

        $this->info('');
        $this->info('Menu permissions added successfully!');

        return Command::SUCCESS;
    }
}
