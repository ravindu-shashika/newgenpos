# Menu Model Setup Complete ✓

## Summary

The Menu model has been successfully created with all specified fields and relationships.

### Created Files

#### 1. Model
- **`app/Models/Menu.php`**
  - Complete Menu model with all fields
  - Includes useful query scopes
  - Many-to-many relationship with Role model

#### 2. Migrations
- **`database/migrations/2026_02_08_114747_create_menus_table.php`**
  - Creates menus table with all specified fields
  - ✓ Successfully executed

- **`database/migrations/2026_02_08_114829_create_menu_role_table.php`**
  - Creates pivot table for menu-role relationships
  - ✓ Successfully executed

#### 3. Updated Files
- **`app/Models/Role.php`**
  - Added `menus()` relationship method
  
- **`app/Http/Controllers/MenuController.php`**
  - Updated validation rules to include order fields
  - Now supports all new fields

### Menu Table Structure

```
menus
├── id (bigint, primary key)
├── main_menu_icon (varchar 191, nullable)
├── main_menu (varchar 191, nullable)
├── sub_menu_icon (varchar 191, nullable)
├── sub_menu (varchar 191, nullable)
├── sub_menu_route (varchar 191, nullable)
├── second_sub_menu_icon (varchar 191, nullable)
├── second_sub_menu (varchar 191, nullable)
├── route (varchar 191, nullable)
├── controller (varchar 191, nullable)
├── main_menu_order (int, nullable)
├── sub_menu_order (int, nullable)
├── child_menu_order (int, nullable)
├── is_active (boolean, default: 1)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Pivot Table Structure

```
menu_role
├── id (bigint, primary key)
├── menu_id (bigint, foreign key -> menus.id)
├── role_id (bigint, foreign key -> roles.id)
├── created_at (timestamp)
└── updated_at (timestamp)
└── UNIQUE(menu_id, role_id)
```

### Model Features

#### Query Scopes

```php
// Get main menu items (no parent)
$mainMenus = Menu::mainMenu()->get();

// Get sub menu items
$subMenus = Menu::subMenu()->get();

// Get only active menus
$activeMenus = Menu::active()->get();

// Combine scopes
$activeMainMenus = Menu::active()->mainMenu()->get();
```

#### Relationships

```php
// Get roles for a menu
$menu = Menu::find(1);
$roles = $menu->roles; // Returns collection of Role models

// Get menus for a role
$role = Role::find(1);
$menus = $role->menus; // Returns collection of Menu models

// Attach menu to role
$menu->roles()->attach($roleId);

// Detach menu from role
$menu->roles()->detach($roleId);

// Sync menus for a role (replace all)
$role->menus()->sync([1, 2, 3]);
```

### MenuController Methods

The controller already includes all CRUD operations:

1. **`index()`** - Get all menus
   - Permission: `menu.view`
   - Method: GET
   - Route: `/api/menus`

2. **`store(Request $request)`** - Create new menu
   - Permission: `menu.save`
   - Method: POST
   - Route: `/api/menus`

3. **`update(Request $request, $id)`** - Update existing menu
   - Permission: `menu.edit`
   - Method: PUT/PATCH
   - Route: `/api/menus/{id}`

4. **`destroy($id)`** - Delete menu
   - Permission: `menu.delete`
   - Method: DELETE
   - Route: `/api/menus/{id}`

5. **`getMenuCurrentRole()`** - Get menus for current user's role
   - Method: GET
   - Returns menus ordered by main_menu_order, sub_menu_order, child_menu_order

### Usage Examples

#### Creating a Menu

```php
$menu = Menu::create([
    'main_menu' => 'Dashboard',
    'main_menu_icon' => 'pi pi-home',
    'main_menu_order' => 1,
    'route' => '/dashboard',
    'controller' => 'DashboardController',
    'is_active' => true,
]);
```

#### Creating a Submenu

```php
$submenu = Menu::create([
    'main_menu' => 'Products',
    'main_menu_icon' => 'pi pi-box',
    'main_menu_order' => 2,
    'sub_menu' => 'Product List',
    'sub_menu_icon' => 'pi pi-list',
    'sub_menu_order' => 1,
    'route' => '/products',
    'controller' => 'ProductController',
    'is_active' => true,
]);
```

#### Creating a Second Level Submenu

```php
$childMenu = Menu::create([
    'main_menu' => 'Products',
    'main_menu_icon' => 'pi pi-box',
    'main_menu_order' => 2,
    'sub_menu' => 'Categories',
    'sub_menu_icon' => 'pi pi-tags',
    'sub_menu_order' => 2,
    'second_sub_menu' => 'Add Category',
    'second_sub_menu_icon' => 'pi pi-plus',
    'child_menu_order' => 1,
    'route' => '/products/categories/create',
    'controller' => 'CategoryController@create',
    'is_active' => true,
]);
```

#### Getting Menus for Current User

```php
// In your controller
$user = auth()->user();
$roleId = $user->role_id;

$menus = Menu::with(['roles' => function ($query) use ($roleId) {
    $query->where('role_id', $roleId);
}])
->active()
->orderBy('main_menu_order')
->orderBy('sub_menu_order')
->orderBy('child_menu_order')
->get();
```

### API Endpoints

Make sure these routes are defined in `routes/api.php`:

```php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/menus', [MenuController::class, 'index']);
    Route::post('/menus', [MenuController::class, 'store']);
    Route::put('/menus/{id}', [MenuController::class, 'update']);
    Route::delete('/menus/{id}', [MenuController::class, 'destroy']);
    Route::get('/menus/current-role', [MenuController::class, 'getMenuCurrentRole']);
});
```

### Required Permissions

Add these permissions to your `RolePermissionSeeder` if not already present:

```php
'menu.view',
'menu.save',
'menu.edit',
'menu.delete',
```

### Frontend Integration Example

```javascript
// Fetch menus for current user's role
async getMenus() {
    const response = await axios.get('/api/menus/current-role');
    return response.data.data;
}

// Structure menus hierarchically
function buildMenuTree(menus) {
    const tree = {};
    
    menus.forEach(menu => {
        if (!tree[menu.main_menu]) {
            tree[menu.main_menu] = {
                icon: menu.main_menu_icon,
                label: menu.main_menu,
                order: menu.main_menu_order,
                items: []
            };
        }
        
        if (menu.sub_menu) {
            const subMenuItem = {
                icon: menu.sub_menu_icon,
                label: menu.sub_menu,
                route: menu.sub_menu_route || menu.route,
                order: menu.sub_menu_order,
            };
            
            if (menu.second_sub_menu) {
                if (!subMenuItem.items) subMenuItem.items = [];
                subMenuItem.items.push({
                    icon: menu.second_sub_menu_icon,
                    label: menu.second_sub_menu,
                    route: menu.route,
                    order: menu.child_menu_order,
                });
            }
            
            tree[menu.main_menu].items.push(subMenuItem);
        }
    });
    
    return Object.values(tree)
        .sort((a, b) => a.order - b.order)
        .map(item => ({
            ...item,
            items: item.items.sort((a, b) => a.order - b.order)
        }));
}
```

---

**Setup Date:** February 8, 2026  
**Status:** ✓ Complete and Ready to Use  
**Database Tables:** menus, menu_role  
**Relationships:** Menu ↔ Role (many-to-many)
