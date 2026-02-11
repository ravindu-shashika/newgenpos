# Spatie Permission Setup - Complete ✅

## What Has Been Installed

### 1. **Spatie Laravel Permission Package**
- Version: 6.24.0
- Installed via Composer
- Configuration published to `config/permission.php`

### 2. **Custom Models Created**
- `app/Models/Role.php` - Extends Spatie's Role model
- `app/Models/Permission.php` - Extends Spatie's Permission model
- `app/Models/User.php` - Updated with `HasRoles` trait

### 3. **Middleware Created**
- `app/Http/Middleware/CheckPermission.php` - Check user permissions
- `app/Http/Middleware/CheckRole.php` - Check user roles
- Registered in `bootstrap/app.php` as:
  - `permission` middleware
  - `role` middleware

### 4. **Helper Trait**
- `app/Traits/HasPermissionChecks.php` - Reusable permission check methods

### 5. **Seeders**
- `database/seeders/RolePermissionSeeder.php` - Seeds default roles and permissions
- `database/seeders/DatabaseSeeder.php` - Updated to include role seeding

### 6. **Example Files (Reference)**
- `routes/api-example.php` - Route protection examples
- `app/Http/Controllers/ExamplePermissionController.php` - Controller examples
- `app/Http/Controllers/PermissionControllerExample.php` - Trait usage examples
- `PERMISSIONS_GUIDE.md` - Complete documentation

### 7. **Database Migrations**
- Spatie's permission tables migration published
- Will create: `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`

## Quick Start

### Step 1: Run Migrations
```bash
php artisan migrate
```

This creates the permission tables:
- `roles` - Stores roles
- `permissions` - Stores permissions
- `model_has_roles` - User-role assignments
- `model_has_permissions` - Direct user-permission assignments
- `role_has_permissions` - Role-permission assignments

### Step 2: Seed Roles & Permissions
```bash
php artisan db:seed --class=RolePermissionSeeder
```

Or seed everything:
```bash
php artisan db:seed
```

This creates:
- **7 default roles**: super-admin, admin, manager, cashier, sales-person, warehouse-manager, accountant
- **60+ permissions** organized by module
- **1 test user**: admin@example.com (password: password) with super-admin role

### Step 3: Use in Your Routes

```php
// In routes/api.php
Route::middleware(['auth:sanctum', 'permission:products-create'])->group(function () {
    Route::post('/products', [ProductController::class, 'store']);
});
```

### Step 4: Use in Your Controllers

**Method 1: Using the trait**
```php
use App\Traits\HasPermissionChecks;

class ProductController extends Controller
{
    use HasPermissionChecks;

    public function store(Request $request)
    {
        if ($error = $this->checkPermission('products-create')) {
            return $error;
        }
        
        // Your logic...
    }
}
```

**Method 2: Manual check**
```php
public function store(Request $request)
{
    if (!auth()->user()->can('products-create')) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    
    // Your logic...
}
```

## Default Roles & Their Permissions

### 🔴 super-admin
- **All permissions** (complete system access)

### 🟠 admin  
- All permissions except critical system settings
- Can manage users, products, sales, purchases, etc.

### 🟡 manager
- Daily operations: sales, purchases, inventory
- Can create and edit most records
- View reports

### 🟢 cashier
- Products: view only
- Sales: view, create
- Customers: view only
- Returns: view, create
- Payments: view, create

### 🔵 sales-person
- Products: view
- Sales: view, create, edit
- Customers: view, create, edit
- Quotations: view, create, edit

### 🟣 warehouse-manager
- Products: view, create, edit
- Purchases: view, create, edit
- Inventory: view, edit
- Transfers & Adjustments: full access

### 🟤 accountant
- Expenses: view, create, edit
- Accounting: view, create, edit
- Reports: view, export
- Payments: view, create, edit

## Common Tasks

### Assign Role to User
```php
$user->assignRole('admin');
```

### Give Permission to User
```php
$user->givePermissionTo('products-create');
```

### Check Permission
```php
if ($user->can('products-create')) {
    // allowed
}
```

### Check Role
```php
if ($user->hasRole('admin')) {
    // allowed
}
```

### Clear Permission Cache
```bash
php artisan cache:forget spatie.permission.cache
php artisan config:clear
```

## Files Modified/Created

**Modified:**
- ✏️ `app/Models/User.php` - Added HasRoles trait and relationships
- ✏️ `config/permission.php` - Updated to use custom models
- ✏️ `bootstrap/app.php` - Registered middleware aliases
- ✏️ `database/seeders/DatabaseSeeder.php` - Added role seeding

**Created:**
- ✨ `app/Models/Role.php`
- ✨ `app/Models/Permission.php`
- ✨ `app/Http/Middleware/CheckPermission.php`
- ✨ `app/Http/Middleware/CheckRole.php`
- ✨ `app/Traits/HasPermissionChecks.php`
- ✨ `database/seeders/RolePermissionSeeder.php`
- ✨ `app/Http/Controllers/ExamplePermissionController.php` (reference)
- ✨ `app/Http/Controllers/PermissionControllerExample.php` (reference)
- ✨ `routes/api-example.php` (reference)
- ✨ `PERMISSIONS_GUIDE.md` (documentation)
- ✨ `SPATIE_PERMISSION_SETUP.md` (this file)

## Next Steps

1. ✅ Run `php artisan migrate`
2. ✅ Run `php artisan db:seed`
3. 🔧 Add permission checks to your controllers
4. 🔧 Protect your routes with middleware
5. 🔧 Create additional roles/permissions as needed
6. 📚 Read `PERMISSIONS_GUIDE.md` for detailed usage

## Need Help?

- 📖 Full guide: `PERMISSIONS_GUIDE.md`
- 💡 Controller examples: `app/Http/Controllers/*PermissionController*.php`
- 🛣️ Route examples: `routes/api-example.php`
- 📦 Official docs: https://spatie.be/docs/laravel-permission

## Test Login

After seeding:
- **Email**: admin@example.com
- **Password**: password
- **Role**: super-admin

---

🎉 **Spatie Permission is now fully configured!**
