# Dynamic Menu System Documentation

## Overview
The menu system now supports dynamic loading based on user roles and permissions. Menus are fetched from the backend and filtered based on the user's permissions.

## How It Works

### 1. Login Process
When a user logs in successfully, the following cookies are set:
- `access_token` - Authentication token
- `user_id` - User ID
- `role_id` - User's role ID
- `role_name` - User's role name
- `user_name` - User's display name

### 2. Menu Loading
On application mount, the `AppMenu.vue` component:
1. Reads the `role_id` from cookies
2. Fetches user permissions using `roleStore.getRolePermissions(roleId)`
3. Fetches menu data using `roleStore.fetchMenuByRole()`
4. Filters menus based on permissions
5. Builds a hierarchical menu tree
6. Transforms the menu tree into the format expected by `AppMenuItem`

### 3. Permission Checking
The `hasPermission(controller)` function checks if the user has any permission starting with the controller name:
```javascript
// Example: If user has "product.view" permission
// hasPermission("product") returns true
```

## Backend API Requirements

### 1. Get Role Permissions
**Endpoint:** `GET /roles/{roleId}/permissions`

**Response:**
```json
[
  "product.view",
  "product.create",
  "sale.view",
  "purchase.create"
]
```

### 2. Get Menu by Role
**Endpoint:** `GET /menus/current-role`

**Response:**
```json
[
  {
    "id": 1,
    "main_menu": "Product",
    "main_menu_icon": "pi-box",
    "sub_menu": "Category",
    "sub_menu_icon": "pi-tags",
    "sub_menu_route": "/product/category",
    "controller": "product",
    "route": "/product/category",
    "second_sub_menu": null,
    "second_sub_menu_icon": null,
    "second_sub_menu_route": null
  },
  {
    "id": 2,
    "main_menu": "Product",
    "main_menu_icon": "pi-box",
    "sub_menu": "Product List",
    "sub_menu_icon": "pi-list",
    "sub_menu_route": "/product/list",
    "controller": "product",
    "route": "/product/list",
    "second_sub_menu": null,
    "second_sub_menu_icon": null,
    "second_sub_menu_route": null
  }
]
```

## Menu Structure

### Three-Level Menu Support
The system supports up to 3 levels of menus:

1. **Main Menu** - Top level (e.g., "Product", "Sale")
2. **Sub Menu** - Second level (e.g., "Product List", "Add Product")
3. **Second Sub Menu** - Third level (e.g., nested sub-items)

### Menu Data Fields

| Field | Description | Example |
|-------|-------------|---------|
| `main_menu` | Main menu label | "Product" |
| `main_menu_icon` | PrimeIcon class | "pi-box" |
| `sub_menu` | Sub menu label | "Category" |
| `sub_menu_icon` | PrimeIcon class | "pi-tags" |
| `sub_menu_route` | Vue router path | "/product/category" |
| `controller` | Permission controller | "product" |
| `second_sub_menu` | Third level label | "Sub Item" |
| `second_sub_menu_icon` | PrimeIcon class | "pi-angle-right" |
| `second_sub_menu_route` | Vue router path | "/product/sub-item" |

## Static vs Dynamic Menus

### Static Menu (Fallback)
If the backend API is unavailable or returns an error, the system falls back to the static menu defined in `AppMenu.vue`.

### Dynamic Menu (Default)
When the user is authenticated and has a valid `role_id`, menus are loaded dynamically from the backend.

## Customization

### Adding Permission Checks
To add more granular permission checks, you can extend the `hasPermission` function:

```javascript
const canCreate = (controller) => {
    return userPermissions.value.includes(`${controller}.create`);
};

const canEdit = (controller) => {
    return userPermissions.value.includes(`${controller}.edit`);
};
```

### Custom Menu Transformations
Modify the `transformMenuToModel` function to adjust how backend menu data is converted to the AppMenuItem format.

## Troubleshooting

### Menus Not Loading
1. Check browser console for errors
2. Verify `role_id` cookie exists
3. Check API endpoints are returning correct data format
4. Verify permissions array is not empty

### Permissions Not Working
1. Ensure permission format is `controller.action` (e.g., "product.view")
2. Check backend is returning permissions correctly
3. Verify `hasPermission` function logic

### Menu Icons Not Showing
1. Verify icon names use PrimeIcons format (without "pi pi-fw" prefix in backend)
2. Check icon classes are valid PrimeIcon names
3. The system automatically adds "pi pi-fw" prefix

## Example Backend Menu Response

```json
[
  {
    "id": 1,
    "main_menu": "Product",
    "main_menu_icon": "pi-box",
    "sub_menu": "Category",
    "sub_menu_icon": "pi-tags",
    "sub_menu_route": "/product/category",
    "controller": "product"
  },
  {
    "id": 2,
    "main_menu": "Sale",
    "main_menu_icon": "pi-shopping-bag",
    "sub_menu": "Sale List",
    "sub_menu_icon": "pi-list",
    "sub_menu_route": "/sale/list",
    "controller": "sale"
  },
  {
    "id": 3,
    "main_menu": "Sale",
    "main_menu_icon": "pi-shopping-bag",
    "sub_menu": "POS",
    "sub_menu_icon": "pi-desktop",
    "sub_menu_route": "/sale/pos",
    "controller": "sale"
  }
]
```

## Security Notes

1. **Never trust client-side permission checks alone** - Always validate on the backend
2. The menu system only controls UI visibility
3. Backend APIs should independently verify user permissions
4. Use route guards to protect pages even if menu items are hidden
