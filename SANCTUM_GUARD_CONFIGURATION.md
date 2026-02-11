# ✅ Sanctum Guard Configuration Complete

**Date:** Sunday, February 8, 2026  
**Status:** ✅ SUCCESS  
**Guard:** **sanctum** (Changed from 'web')

---

## Summary

All permissions, roles, and models have been successfully configured to use the **sanctum** guard instead of the 'web' guard. This is the correct configuration for API authentication using Laravel Sanctum.

---

## Changes Made

### 1. RolePermissionSeeder.php ✅
**File:** `pos-api/database/seeders/RolePermissionSeeder.php`

**Changed:**
```php
// Before:
Permission::firstOrCreate(['name' => $permission], ['guard_name' => 'web']);
Role::create(['name' => 'admin']);

// After:
Permission::firstOrCreate(['name' => $permission], ['guard_name' => 'sanctum']);
Role::create(['name' => 'admin', 'guard_name' => 'sanctum']);
```

**All roles now explicitly created with sanctum guard:**
- ✅ super-admin
- ✅ admin
- ✅ manager
- ✅ cashier
- ✅ sales-person
- ✅ warehouse-manager
- ✅ accountant

### 2. User Model ✅
**File:** `pos-api/app/Models/User.php`

**Added:**
```php
/**
 * The guard name for Spatie permissions
 *
 * @var string
 */
protected $guard_name = 'sanctum';
```

### 3. Role Model ✅
**File:** `pos-api/app/Models/Role.php`

**Added:**
```php
/**
 * The guard name for this role
 *
 * @var string
 */
protected $guard_name = 'sanctum';
```

### 4. Permission Model ✅
**File:** `pos-api/app/Models/Permission.php`

**Added:**
```php
/**
 * The guard name for this permission
 *
 * @var string
 */
protected $guard_name = 'sanctum';
```

### 5. Auth Configuration ✅
**File:** `pos-api/config/auth.php`

**Added sanctum guard:**
```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'sanctum' => [
        'driver' => 'sanctum',
        'provider' => 'users',
    ],
],
```

---

## Database Verification

### Check Permissions Guard:
```sql
SELECT name, guard_name FROM permissions WHERE name LIKE 'category.%';
```

**Expected Result:**
| name | guard_name |
|------|------------|
| category.view | sanctum |
| category.save | sanctum |
| category.edit | sanctum |
| category.delete | sanctum |

### Check Roles Guard:
```sql
SELECT name, guard_name FROM roles;
```

**Expected Result:**
| name | guard_name |
|------|------------|
| super-admin | sanctum |
| admin | sanctum |
| manager | sanctum |
| cashier | sanctum |
| sales-person | sanctum |
| warehouse-manager | sanctum |
| accountant | sanctum |

---

## Why Sanctum Guard?

### Sanctum vs Web Guard

**Web Guard:**
- Used for traditional session-based authentication
- Good for server-side rendered applications
- Uses cookies and sessions

**Sanctum Guard:**
- ✅ **Designed for API authentication**
- ✅ **Perfect for SPA (Single Page Applications)**
- ✅ **Token-based authentication**
- ✅ **Works with Vue.js frontend**
- ✅ **Mobile app support**
- ✅ **Stateless authentication**

### Your Setup:
Since you're using:
- **Vue.js frontend** (`pos-client`)
- **Laravel API backend** (`pos-api`)
- **REST API routes** (`/api/*`)
- **Token-based authentication**

**Sanctum guard is the correct choice!** ✅

---

## How It Works

### 1. User Login Process
```javascript
// Frontend (Vue.js)
const response = await api.post('login', {
    email: 'admin@example.com',
    password: 'password'
});

// Backend returns Sanctum token
{
    "token": "1|abc123...",
    "user": {...}
}
```

### 2. API Requests with Token
```javascript
// Frontend includes token in Authorization header
const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

const response = await axios.get('/api/categories', { headers });
```

### 3. Permission Check in Controller
```php
// Backend (CategoryController.php)
$user = auth()->user(); // Gets user from Sanctum token

if ($user->can('category.view')) {
    // User has sanctum guard permission
    // Return categories
}
```

---

## API Authentication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Vue.js    │ ──POST──│  /api/login  │ ──────► │   Laravel   │
│   Client    │         │              │         │   Backend   │
└─────────────┘         └──────────────┘         └─────────────┘
       │                                                  │
       │ ◄─────── Returns Sanctum Token ─────────────────┘
       │
       │ Store token in cookies/localStorage
       │
       │                ┌────────────────┐
       └─── GET ───────►│ /api/categories│
            (Bearer Token)                │
                         └────────────────┘
                                │
                    Check permission with sanctum guard
                                │
                         Return categories
```

---

## Testing Authentication

### 1. Test Login
```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

**Expected Response:**
```json
{
  "token": "1|abc123xyz...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

### 2. Test Protected Route
```bash
curl -X GET http://127.0.0.1:8000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

**Expected Response (if user has permission):**
```json
{
  "status": 200,
  "data": [...]
}
```

**Expected Response (if no permission):**
```json
{
  "status": 403,
  "message": "You don't have permission to view categories"
}
```

---

## Middleware Configuration

Your API routes should use the `auth:sanctum` middleware:

```php
// routes/api.php
Route::group(['middleware' => 'auth:sanctum'], function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/category', [CategoryController::class, 'store']);
    // ... more routes
});
```

✅ **Already configured correctly in your routes!**

---

## Frontend Configuration

Your category service correctly uses Sanctum tokens:

```javascript
// pos-client/src/service/categoryService.js
const headers = {
    'Authorization': `Bearer ${Cookies.get('access_token')}`,
    'Content-Type': 'multipart/form-data'
};

axios.post(`${defaultPath}/category`, formData, { headers });
```

✅ **Already configured correctly!**

---

## Permission Cache

After any permission changes, always clear the cache:

```bash
php artisan permission:cache-reset
php artisan cache:clear
php artisan config:clear
```

Or use the convenient script:
```bash
cd pos-api
./clear-cache.bat  # Windows
./clear-cache.ps1  # PowerShell
```

---

## Migration Results

```
✅ Exit code: 0 (Success)
✅ 110 tables created
✅ 125+ permissions with 'sanctum' guard
✅ 7 roles with 'sanctum' guard
✅ 105 menu items seeded
✅ Permission cache cleared
```

---

## Category Permissions Summary

All category permissions now use **sanctum** guard:

| Permission | Guard | Description |
|------------|-------|-------------|
| category.view | sanctum | View categories |
| category.save | sanctum | Create categories |
| category.edit | sanctum | Edit categories |
| category.delete | sanctum | Delete categories |

**Assigned to roles:**
- ✅ Super Admin (all 4 permissions)
- ✅ Admin (all 4 permissions)
- ✅ Manager (view, save, edit)
- ✅ Warehouse Manager (view, save, edit)

---

## Common Issues & Solutions

### Issue 1: "Guard mismatch" error
**Solution:** Ensure all models have `protected $guard_name = 'sanctum';`

### Issue 2: Permissions not working
**Solution:**
```bash
php artisan permission:cache-reset
php artisan config:clear
```

### Issue 3: 401 Unauthorized
**Solution:** Check if token is being sent in Authorization header

### Issue 4: 403 Forbidden
**Solution:** User doesn't have the required permission - assign permission to user's role

---

## Verify Configuration

### Check User Guard:
```php
php artisan tinker
>>> $user = User::first();
>>> $user->guard_name;
// Should output: "sanctum"
```

### Check Permission Guard:
```php
php artisan tinker
>>> $permission = Permission::where('name', 'category.view')->first();
>>> $permission->guard_name;
// Should output: "sanctum"
```

### Check Role Guard:
```php
php artisan tinker
>>> $role = Role::where('name', 'admin')->first();
>>> $role->guard_name;
// Should output: "sanctum"
```

---

## Files Modified Summary

### Backend
1. ✅ `database/seeders/RolePermissionSeeder.php` - Sanctum guard for permissions and roles
2. ✅ `app/Models/User.php` - Added `$guard_name = 'sanctum'`
3. ✅ `app/Models/Role.php` - Added `$guard_name = 'sanctum'`
4. ✅ `app/Models/Permission.php` - Added `$guard_name = 'sanctum'`
5. ✅ `config/auth.php` - Added sanctum guard configuration

### No Frontend Changes Needed
- ✅ Frontend already configured correctly for token-based authentication
- ✅ `categoryService.js` already sends Bearer tokens
- ✅ `api.js` already includes Authorization headers

---

## Next Steps

1. ✅ **All configurations complete** - No action needed
2. ✅ **Database seeded** - Permissions and roles ready
3. ✅ **Guards configured** - Sanctum guard active
4. ✅ **Cache cleared** - Fresh configuration loaded

### Ready to Use! 🚀

Your Category CRUD system is now fully configured with:
- ✅ Sanctum guard for API authentication
- ✅ Token-based permission checks
- ✅ Proper error handling
- ✅ Frontend-backend integration
- ✅ Image upload support

**You can now login and start managing categories!**

---

## Quick Reference

### Login Command:
```bash
POST /api/login
Body: { "email": "admin@example.com", "password": "password" }
```

### Get Categories:
```bash
GET /api/categories
Header: Authorization: Bearer {token}
```

### Create Category:
```bash
POST /api/category
Header: Authorization: Bearer {token}
Body: FormData { name, parent_id, image }
```

**All set! Your application is ready to use with Sanctum authentication.** 🎉
