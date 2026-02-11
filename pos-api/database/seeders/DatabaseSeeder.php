<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call([
            RolePermissionSeeder::class,
            MenuSeeder::class,
        ]);

        // User::factory(10)->create();

        // Create a test super admin user (password: password)
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'username' => 'admin', 
            'email' => 'admin@example.com',
            'password' => bcrypt('admin'),
            'phone' => '1234567890',
            'role_id' => 1,
            'is_active' => true,
            'is_deleted' => false,
        ]);
        $superAdmin->assignRole('super-admin');
    }
}
