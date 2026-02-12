# Quick Start - Dynamic Menu System

## What Changed?

### ✅ Installed & Configured
- **Pinia** - State management for Vue 3
- **Dynamic menu loading** - Menus now load from backend
- **Permission-based filtering** - Menus show based on user role

### 📁 Files Modified

1. **`src/main.js`**
   - Added Pinia initialization

2. **`src/layout/AppMenu.vue`**
   - Added dynamic menu loading
   - Added permission checking
   - Kept static menus as fallback

3. **`src/stores/roleStore.js`** (existing)
   - Already has `fetchMenuByRole()` and `getRolePermissions()` methods

4. **`src/stores/authStore.js`** (existing)
   - Already has permission checking methods

## How It Works (Simple)

```
1. User logs in → role_id saved to cookie
2. AppMenu loads → reads role_id from cookie
3. Fetches permissions → from backend API
4. Fetches menus → from backend API
5. Filters menus → based on permissions
6. Displays menus → in sidebar
```

## Backend API Format

### Get Permissions
**Request:** `GET /api/roles/{roleId}/permissions`

**Response:**
```json
["product.view", "product.create", "sale.view"]
```

### Get Menus
**Request:** `GET /api/menus/current-role`

**Response:**
```json
[
  {
    "main_menu": "Product",
    "main_menu_icon": "pi-box",
    "sub_menu": "Category",
    "sub_menu_icon": "pi-tags",
    "sub_menu_route": "/product/category",
    "controller": "product"
  }
]
```

## Menu Structure Mapping

### Backend Format → Frontend Format

Backend:
```json
{
  "main_menu": "Product",
  "main_menu_icon": "pi-box",
  "sub_menu": "Product List",
  "sub_menu_icon": "pi-list",
  "sub_menu_route": "/product/list",
  "controller": "product"
}
```

Frontend (transformed):
```javascript
{
  label: "Product",
  icon: "pi pi-fw pi-box",
  path: "/product",
  items: [
    {
      label: "Product List",
      icon: "pi pi-fw pi-list",
      to: "/product/list"
    }
  ]
}
```

## Permission Format

Permissions must follow this pattern:
```
{controller}.{action}

Examples:
- product.view
- product.create
- product.edit
- product.delete
- sale.view
- sale.*  (all sale permissions)
```

## Testing Your Implementation

### 1. Check Console Logs
Open browser DevTools and look for:
```
Menu Data: [...]
Permissions: [...]
Final model: [...]
```

### 2. Test Permission Filtering
Remove a permission and verify menu disappears:
```javascript
// Before: user has ["product.view", "sale.view"]
// After: user has ["product.view"]
// Result: Sale menu should disappear
```

### 3. Test Fallback
Stop backend API and verify static menus still show.

## Troubleshooting

### Problem: Menus don't load
**Solution:** Check these in order:
1. Is `role_id` cookie set? (Check DevTools → Application → Cookies)
2. Is API returning data? (Check DevTools → Network tab)
3. Are permissions empty? (Check console logs)

### Problem: All menus hidden
**Solution:** User probably has no permissions. Check:
1. Backend is returning permissions array
2. Permission format is correct (`controller.action`)
3. Controller names match menu data

### Problem: Icons not showing
**Solution:** Backend should return icon names without prefix:
- ✅ Correct: `"pi-box"`
- ❌ Wrong: `"pi pi-fw pi-box"`

### Problem: Static menus showing instead of dynamic
**Solution:** This means API call failed. Check:
1. Backend endpoints exist
2. User is authenticated (token valid)
3. CORS settings allow requests

## Quick Commands

### Install Pinia (already done)
```bash
npm install pinia
```

### Run Frontend
```bash
cd pos-client
npm run dev
```

### Check Menu Loading
```javascript
// In browser console
localStorage.getItem('pinia')  // Check pinia state
document.cookie                // Check cookies
```

## Cookie Structure After Login

```
access_token=your_token_here
user_id=1
user_name=Admin User
role_id=1
role_name=Administrator
```

## File Structure

```
pos-client/
├── src/
│   ├── main.js                 ← Pinia initialized here
│   ├── layout/
│   │   └── AppMenu.vue        ← Dynamic menu logic here
│   ├── stores/
│   │   ├── authStore.js       ← Permission checks
│   │   └── roleStore.js       ← Menu fetching
│   └── views/
│       └── pages/
│           └── auth/
│               └── Login.vue  ← Sets role_id cookie
```

## Key Functions in AppMenu.vue

```javascript
// Check if user has permission for a controller
hasPermission(controller)

// Fetch menus and permissions from backend
fetchMenusAndPermissions()

// Build hierarchical menu tree from flat data
buildMenuTree(menuData, permissions)

// Transform backend format to PrimeVue format
transformMenuToModel(menuTree)
```

## Example: Adding a New Menu

### Backend (Laravel):
```php
Menu::create([
    'main_menu' => 'Reports',
    'main_menu_icon' => 'pi-chart-bar',
    'sub_menu' => 'Sales Report',
    'sub_menu_icon' => 'pi-file',
    'sub_menu_route' => '/reports/sales',
    'controller' => 'reports',
    'sort_order' => 100
]);
```

### Add Permission:
```php
Permission::create(['name' => 'reports.view']);
```

### Assign to Role:
```php
$role->permissions()->attach($permission->id);
$role->menus()->attach($menu->id);
```

### Result:
Menu automatically appears for users with that role!

## Support

For detailed implementation guide, see:
- `IMPLEMENTATION_SUMMARY.md` - Backend implementation
- `MENU_SYSTEM.md` - Detailed system documentation
