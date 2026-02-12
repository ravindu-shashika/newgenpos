# Router Configuration Guide

## Issue Fixed

The menu items weren't navigating because the routes didn't exist in the router configuration.

## What Was Fixed

### 1. **Updated Router** (`src/router/index.js`)
Added routes for:
- `/product/category` → `category.vue`
- `/product/brand` → `brand.vue`
- `/product/unit` → `unit.vue`
- `/product/list` → `product-list.vue`

### 2. **Fixed Route Mapping** (`src/layout/AppMenu.vue`)
Changed line 83 to use `item.route` as fallback:
```javascript
sub_menu_route: item.sub_menu_route || item.route || null
```

### 3. **Created Placeholder Pages**
Created basic Vue components for:
- `src/views/pages/brand.vue`
- `src/views/pages/unit.vue`
- `src/views/pages/product-list.vue`

## How to Add New Routes

### Step 1: Add Route to Router

Edit `src/router/index.js`:

```javascript
{
    path: '/your-path',
    name: 'your-route-name',
    component: () => import('@/views/pages/your-page.vue'),
    meta: { requiresAuth: true }
}
```

### Step 2: Create Vue Page

Create `src/views/pages/your-page.vue`:

```vue
<script setup>
import { ref } from 'vue';

const pageTitle = ref('Your Page Title');
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>{{ pageTitle }}</h5>
                <p>Your page content here.</p>
            </div>
        </div>
    </div>
</template>
```

### Step 3: Backend Menu Configuration

Make sure your backend menu has the correct route:

```json
{
    "route": "/your-path",
    "controller": "your-controller"
}
```

## Example: Adding Sale Routes

### Backend Menu Data
```json
{
    "main_menu": "Main",
    "sub_menu": "Sale",
    "second_sub_menu": "Sale List",
    "route": "/sale/list",
    "controller": "sale"
}
```

### Add to Router
```javascript
{
    path: '/sale/list',
    name: 'sale-list',
    component: () => import('@/views/pages/sale-list.vue'),
    meta: { requiresAuth: true }
}
```

### Create Page
Create `src/views/pages/sale-list.vue` with your content.

## Testing

1. **Check Backend Data**
   - Open browser console
   - Look for: `Menu Data: [...]`
   - Verify `route` field has correct path

2. **Check Route Mapping**
   - Look for: `Final model: {...}`
   - Verify `to` property has correct route

3. **Click Menu Item**
   - Should navigate to the page
   - URL should change to match route

## Common Issues

### Issue: Route not found (404)
**Solution:** Add route to `router/index.js`

### Issue: Page component not found
**Solution:** Create the `.vue` file in `views/pages/`

### Issue: Route is null in menu
**Solution:** Check backend `route` field has value

### Issue: Permission denied
**Solution:** Check user has permission for controller

## Route Structure

Your backend sends routes in this format:
```
/main-section/sub-section
```

Examples:
- `/product/category`
- `/sale/list`
- `/purchase/add`
- `/reports/sales-report`

Make sure:
1. Route in backend matches route in router
2. Route is exactly as backend sends it (including `/`)
3. Component file exists

## Debugging Routes

### Check Console Logs
```javascript
// Menu data from backend
Menu Data: [...]

// Transformed menu with routes
Final model: [...]

// Permission checks
✓ Permission granted for "categories"
```

### Check Vue Router
Open Vue DevTools → Router tab to see all registered routes.

### Check Navigation
```javascript
// In browser console
console.log($router.getRoutes())
```

## Auto-generated Routes (Future Enhancement)

Instead of manually adding each route, you could:

1. **Option 1: Catch-all Dynamic Route**
```javascript
{
    path: '/:module/:page',
    name: 'dynamic-page',
    component: (route) => import(`@/views/pages/${route.params.page}.vue`)
}
```

2. **Option 2: Generate Routes from Backend**
Fetch routes from backend and add them dynamically.

## Next Steps

For each menu item in your backend:
1. ✅ Verify `route` field has correct path
2. ✅ Add route to `router/index.js`
3. ✅ Create corresponding `.vue` file
4. ✅ Test navigation

## Quick Checklist

When adding a new menu page:
- [ ] Backend menu has `route` field
- [ ] Route added to `router/index.js`
- [ ] Page component created
- [ ] Permission exists for controller
- [ ] Test: Click menu item
- [ ] Test: Page loads correctly
- [ ] Test: URL changes correctly
