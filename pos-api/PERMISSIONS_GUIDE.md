# Spatie Laravel Permission - Implementation Guide

## Overview
This project now uses [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission) for managing user roles and permissions.

## Installation Complete ✅

The following has been set up:
- ✅ Spatie Laravel Permission package installed
- ✅ Configuration published
- ✅ Custom Role and Permission models created
- ✅ User model updated with HasRoles trait
- ✅ Migration files ready
- ✅ Role and Permission seeder created
- ✅ Custom middleware registered

## Database Setup

1. **Run migrations** to create permission tables:
```bash
php artisan migrate
```

2. **Seed roles and permissions**:
```bash
php artisan db:seed --class=RolePermissionSeeder
```

Or run all seeders:
```bash
php artisan db:seed
```

## Default Roles Created

The seeder creates the following roles:

1. **super-admin** - Full system access (all permissions)
2. **admin** - Most permissions except critical system settings
3. **manager** - Daily operations management
4. **cashier** - Sales and basic operations only
5. **sales-person** - Sales and customer management
6. **warehouse-manager** - Inventory and warehouse management
7. **accountant** - Financial operations and reporting

## Default Permissions Created

Permissions are organized by module:
- **users**: view, create, edit, delete
- **products**: view, create, edit, delete
- **sales**: view, create, edit, delete
- **purchases**: view, create, edit, delete
- **customers**: view, create, edit, delete
- **suppliers**: view, create, edit, delete
- **expenses**: view, create, edit, delete
- **quotations**: view, create, edit, delete
- **returns**: view, create, edit, delete
- **transfers**: view, create, edit, delete
- **adjustments**: view, create, edit, delete
- **reports**: view, export
- **settings**: view, edit
- **hrm**: view, create, edit, delete
- **accounting**: view, create, edit, delete
- **inventory**: view, edit
- **warehouses**: view, create, edit, delete
- **categories**: view, create, edit, delete
- **brands**: view, create, edit, delete
- **payments**: view, create, edit, delete

## Usage Examples

### 1. Assign Role to User

```php
$user = User::find(1);
$user->assignRole('admin');

// Or assign multiple roles
$user->assignRole(['admin', 'warehouse-manager']);

// Sync roles (remove all current and set new ones)
$user->syncRoles(['cashier']);
```

### 2. Give Permission to User

```php
$user->givePermissionTo('products-create');

// Or multiple permissions
$user->givePermissionTo(['products-create', 'products-edit']);
```

### 3. Give Permission to Role

```php
$role = Role::findByName('cashier');
$role->givePermissionTo('products-view');
```

### 4. Check Permissions in Code

```php
// Check if user has permission
if (auth()->user()->can('products-create')) {
    // User can create products
}

// Check if user has role
if (auth()->user()->hasRole('admin')) {
    // User is admin
}

// Check if user has any role
if (auth()->user()->hasAnyRole(['admin', 'super-admin'])) {
    // User is either admin or super admin
}

// Check if user has all roles
if (auth()->user()->hasAllRoles(['admin', 'manager'])) {
    // User has both roles
}
```

### 5. Protect Routes with Middleware

In your routes file (`routes/web.php` or `routes/api.php`):

```php
use Illuminate\Support\Facades\Route;

// Require specific permission
Route::middleware(['auth', 'permission:products-create'])->group(function () {
    Route::post('/products', [ProductController::class, 'store']);
});

// Require specific role
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
});

// Using Spatie's built-in middleware (alternative)
Route::middleware(['auth', 'role:admin|manager'])->group(function () {
    Route::get('/reports', [ReportController::class, 'index']);
});

Route::middleware(['auth', 'permission:users-create|users-edit'])->group(function () {
    Route::post('/users', [UserController::class, 'store']);
});
```

### 6. Check Permissions in Controllers

```php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function store(Request $request)
    {
        // Check permission
        if (!auth()->user()->can('products-create')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Or use authorization
        $this->authorize('products-create');

        // Your code here...
    }
}
```

### 7. Check Permissions in Blade Views

```blade
@can('products-create')
    <button>Create Product</button>
@endcan

@role('admin')
    <a href="/admin">Admin Panel</a>
@endrole

@hasanyrole('admin|manager')
    <a href="/reports">Reports</a>
@endhasanyrole
```

## Advanced Usage

### Create New Permission

```php
use App\Models\Permission;

Permission::create(['name' => 'custom-permission']);
```

### Create New Role

```php
use App\Models\Role;

$role = Role::create(['name' => 'custom-role']);
$role->givePermissionTo(['products-view', 'products-create']);
```

### Direct Database Queries

```php
// Get all roles for a user
$roles = $user->roles;

// Get all permissions for a user
$permissions = $user->getAllPermissions();

// Get all users with a specific role
$admins = User::role('admin')->get();

// Get all users with a specific permission
$usersWithPermission = User::permission('products-create')->get();
```

## Middleware Reference

### Custom Middleware (JSON API responses)
- `role:role-name` - Check if user has specific role
- `permission:permission-name` - Check if user has specific permission

### Spatie Built-in Middleware
- `role:admin` - Single role check
- `role:admin|manager` - Multiple roles (OR)
- `permission:products-create` - Single permission
- `permission:products-create|products-edit` - Multiple permissions (OR)

## API Response Format

The custom middleware returns JSON responses:

**401 Unauthorized** (not logged in):
```json
{
    "message": "Unauthorized"
}
```

**403 Forbidden** (no permission):
```json
{
    "message": "You do not have permission to perform this action"
}
```

## Best Practices

1. **Always check permissions in controllers** - Don't rely only on route middleware
2. **Use descriptive permission names** - Follow the pattern: `module-action` (e.g., `products-create`)
3. **Assign roles, not individual permissions** - It's easier to manage
4. **Cache permissions** - Spatie caches by default (24 hours)
5. **Clear cache after changes**:
   ```bash
   php artisan cache:forget spatie.permission.cache
   ```
   Or use:
   ```php
   app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
   ```

## Testing Accounts

After running seeders, you can login with:
- **Email**: admin@example.com
- **Password**: password
- **Role**: super-admin (has all permissions)

## Configuration

The permission configuration is located at: `config/permission.php`

Key settings:
- Models: Points to custom Role and Permission models
- Table names: Default table names for roles and permissions
- Cache: Permissions cached for 24 hours by default

## Troubleshooting

### Permission denied errors
```bash
php artisan cache:forget spatie.permission.cache
php artisan config:clear
```

### Need to add more permissions
Update `database/seeders/RolePermissionSeeder.php` and re-run:
```bash
php artisan db:seed --class=RolePermissionSeeder
```

### Check user permissions
```php
$user = User::find(1);
dd($user->getAllPermissions());
dd($user->roles);
```

## Additional Resources

- [Official Documentation](https://spatie.be/docs/laravel-permission)
- [GitHub Repository](https://github.com/spatie/laravel-permission)
