<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    public function up(): void
    {
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $perms = Permission::whereIn('name', ['role-permissions.view', 'role-permissions.edit'])->pluck('name');
            foreach ($perms as $p) {
                if (!$admin->hasPermissionTo($p)) {
                    $admin->givePermissionTo($p);
                }
            }
        }
    }

    public function down(): void
    {
        // optional: revoke if needed
    }
};
