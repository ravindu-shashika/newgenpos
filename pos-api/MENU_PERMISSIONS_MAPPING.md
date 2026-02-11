# Menu-Permission Mapping Complete ✓

## Overview

All menu items are now linked to their corresponding permissions via the `controller` field. This allows automatic permission checking for menu access.

## How It Works

Each menu item has a `controller` field that maps to a permission prefix. For example:

- Menu with `controller: 'categories'` requires one of:
  - `categories-view` (for viewing)
  - `categories-create` (for creating)
  - `categories-edit` (for editing)
  - `categories-delete` (for deleting)

## Complete Permission Mapping

### Product Module (9 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Category | `categories` | categories-view, categories-create, categories-edit, categories-delete |
| Brand | `brands` | brands-view, brands-create, brands-edit, brands-delete |
| Unit | `units` | units-view, units-create, units-edit, units-delete |
| Product List | `products` | products-view, products-create, products-edit, products-delete |
| Add Product | `products` | products-view, products-create, products-edit, products-delete |
| Print Barcode | `barcodes` | barcodes-view, barcodes-create, barcodes-edit, barcodes-delete |
| Adjustment List | `adjustments` | adjustments-view, adjustments-create, adjustments-edit, adjustments-delete |
| Add Adjustment | `adjustments` | adjustments-view, adjustments-create, adjustments-edit, adjustments-delete |
| Stock Count | `stock-counts` | stock-counts-view, stock-counts-create, stock-counts-edit, stock-counts-delete |

### Purchase Module (4 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Purchase List | `purchases` | purchases-view, purchases-create, purchases-edit, purchases-delete |
| Add Purchase | `purchases` | purchases-view, purchases-create, purchases-edit, purchases-delete |
| Import Purchase By CSV | `purchases` | purchases-view, purchases-create, purchases-edit, purchases-delete |
| Purchase Return List | `purchase-returns` | purchase-returns-view, purchase-returns-create, purchase-returns-edit, purchase-returns-delete |

### Sale Module (11 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Sale List | `sales` | sales-view, sales-create, sales-edit, sales-delete |
| POS | `pos` | pos-view, pos-create |
| Add Sale | `sales` | sales-view, sales-create, sales-edit, sales-delete |
| Import Sale By CSV | `sales` | sales-view, sales-create, sales-edit, sales-delete |
| Packing Slip List | `packing-slips` | packing-slips-view, packing-slips-create, packing-slips-edit, packing-slips-delete |
| Challan List | `challans` | challans-view, challans-create, challans-edit, challans-delete |
| Delivery List | `deliveries` | deliveries-view, deliveries-create, deliveries-edit, deliveries-delete |
| Gift Card List | `gift-cards` | gift-cards-view, gift-cards-create, gift-cards-edit, gift-cards-delete |
| Coupon List | `coupons` | coupons-view, coupons-create, coupons-edit, coupons-delete |
| Courier List | `couriers` | couriers-view, couriers-create, couriers-edit, couriers-delete |
| Sale Return | `returns` | returns-view, returns-create, returns-edit, returns-delete |

### Quotation Module (2 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Quotation List | `quotations` | quotations-view, quotations-create, quotations-edit, quotations-delete |
| Add Quotation | `quotations` | quotations-view, quotations-create, quotations-edit, quotations-delete |

### Transfer Module (3 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Transfer List | `transfers` | transfers-view, transfers-create, transfers-edit, transfers-delete |
| Add Transfer | `transfers` | transfers-view, transfers-create, transfers-edit, transfers-delete |
| Import Transfer By CSV | `transfers` | transfers-view, transfers-create, transfers-edit, transfers-delete |

### Expense Module (2 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Expense List | `expenses` | expenses-view, expenses-create, expenses-edit, expenses-delete |
| Add Expense | `expenses` | expenses-view, expenses-create, expenses-edit, expenses-delete |

### Income Module (2 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Income List | `incomes` | incomes-view, incomes-create, incomes-edit, incomes-delete |
| Add Income | `incomes` | incomes-view, incomes-create, incomes-edit, incomes-delete |

### People Module (5 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Customer List | `customers` | customers-view, customers-create, customers-edit, customers-delete |
| Supplier List | `suppliers` | suppliers-view, suppliers-create, suppliers-edit, suppliers-delete |
| User List | `users` | users-view, users-create, users-edit, users-delete |
| Sale Agents | `employees` | employees-view, employees-create, employees-edit, employees-delete |
| Biller List | `billers` | billers-view, billers-create, billers-edit, billers-delete |

### Accounting Module (5 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Account List | `accounts` | accounts-view, accounts-create, accounts-edit, accounts-delete |
| Add Account | `accounts` | accounts-view, accounts-create, accounts-edit, accounts-delete |
| Money Transfer | `money-transfers` | money-transfers-view, money-transfers-create, money-transfers-edit, money-transfers-delete |
| Balance Sheet | `balance-sheets` | balance-sheets-view |
| Account Statement | `account-statements` | account-statements-view |

### HRM Module (10 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Department | `departments` | departments-view, departments-create, departments-edit, departments-delete |
| Designation | `designations` | designations-view, designations-create, designations-edit, designations-delete |
| Shift | `shifts` | shifts-view, shifts-create, shifts-edit, shifts-delete |
| Employee | `employees` | employees-view, employees-create, employees-edit, employees-delete |
| Attendance | `attendance` | attendance-view, attendance-create, attendance-edit, attendance-delete |
| Holiday | `holidays` | holidays-view, holidays-create, holidays-edit, holidays-delete |
| Overtime | `overtime` | overtime-view, overtime-create, overtime-edit, overtime-delete |
| Leave Type | `leave-types` | leave-types-view, leave-types-create, leave-types-edit, leave-types-delete |
| Leaves | `leaves` | leaves-view, leaves-create, leaves-edit, leaves-delete |
| Payroll | `payrolls` | payrolls-view, payrolls-create, payrolls-edit, payrolls-delete |

### Reports Module (26 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Activity Log | `activity-logs` | activity-logs-view |
| All Others | `reports` | reports-view, reports-export |

### Settings Module (26 items)

| Menu Item | Controller | Permissions Available |
|-----------|-----------|----------------------|
| Receipt Printers | `printers` | printers-view, printers-create, printers-edit, printers-delete |
| Invoice Settings | `invoice-settings` | invoice-settings-view, invoice-settings-edit |
| Role Permission | `role-permissions` | role-permissions-view, role-permissions-edit |
| SMS Template | `sms-templates` | sms-templates-view, sms-templates-create, sms-templates-edit, sms-templates-delete |
| Custom Field List | `custom-fields` | custom-fields-view, custom-fields-create, custom-fields-edit, custom-fields-delete |
| Discount Plan | `discount-plans` | discount-plans-view, discount-plans-create, discount-plans-edit, discount-plans-delete |
| Discount | `discounts` | discounts-view, discounts-create, discounts-edit, discounts-delete |
| All Notification | `notifications` | notifications-view, notifications-create, notifications-edit, notifications-delete |
| Send Notification | `notifications` | notifications-view, notifications-create, notifications-edit, notifications-delete |
| Warehouse | `warehouses` | warehouses-view, warehouses-create, warehouses-edit, warehouses-delete |
| Tables | `tables` | tables-view, tables-create, tables-edit, tables-delete |
| Customer Group | `customer-groups` | customer-groups-view, customer-groups-create, customer-groups-edit, customer-groups-delete |
| Currency | `currencies` | currencies-view, currencies-create, currencies-edit, currencies-delete |
| Tax | `taxes` | taxes-view, taxes-create, taxes-edit, taxes-delete |
| User Profile | `user-profile` | user-profile-view, user-profile-edit |
| Create SMS | `sms-templates` | sms-templates-view, sms-templates-create, sms-templates-edit, sms-templates-delete |
| Backup Database | `backup-database` | backup-database-view, backup-database-create |
| General Setting | `general-settings` | general-settings-view, general-settings-edit |
| Mail Setting | `mail-settings` | mail-settings-view, mail-settings-edit |
| Reward Point Setting | `reward-point-settings` | reward-point-settings-view, reward-point-settings-edit |
| SMS Setting | `sms-settings` | sms-settings-view, sms-settings-edit |
| Payment Gateways | `payment-gateways` | payment-gateways-view, payment-gateways-edit |
| POS Settings | `pos-settings` | pos-settings-view, pos-settings-edit |
| HRM Setting | `hrm-settings` | hrm-settings-view, hrm-settings-edit |
| Barcode Settings | `barcode-settings` | barcode-settings-view, barcode-settings-edit |
| Languages | `languages` | languages-view, languages-create, languages-edit, languages-delete |

## Usage Example

### Backend: Check Permission for Menu Item

```php
use App\Models\Menu;

// Get menu item
$menu = Menu::where('route', '/product/category')->first();

// Check if user can view this menu
$controller = $menu->controller; // 'categories'
if (auth()->user()->can("{$controller}-view")) {
    // User can view categories
}

// Check if user can create
if (auth()->user()->can("{$controller}-create")) {
    // User can create categories
}
```

### Frontend: Filter Menus by Permission

```javascript
// Fetch menus for current user
async function getAuthorizedMenus() {
    const response = await axios.get('/api/menus/current-role');
    const menus = response.data.data;
    const userPermissions = response.data.user.permissions;
    
    // Filter menus based on permissions
    return menus.filter(menu => {
        const controller = menu.controller;
        // Check if user has at least -view permission for this controller
        return userPermissions.some(p => 
            p.name === `${controller}-view` || 
            p.name === `${controller}-create` ||
            p.name === `${controller}-edit` ||
            p.name === `${controller}-delete`
        );
    });
}
```

### MenuController: Filter by Permission

Update your `getMenuCurrentRole()` method:

```php
public function getMenuCurrentRole()
{
    $user = auth()->user();
    
    $menus = Menu::active()
        ->orderBy('main_menu_order')
        ->orderBy('sub_menu_order')
        ->orderBy('child_menu_order')
        ->get()
        ->filter(function ($menu) use ($user) {
            // Check if user has any permission for this controller
            $controller = $menu->controller;
            return $user->can("{$controller}-view") ||
                   $user->can("{$controller}-create") ||
                   $user->can("{$controller}-edit") ||
                   $user->can("{$controller}-delete");
        });

    return response()->json([
        'status' => 200,
        'data' => $menus->values(),
        'user' => $user->load('roles', 'permissions')
    ]);
}
```

## Statistics

- **Total Menus:** 105
- **Total Permissions:** 247
- **Total Roles:** 7
- **Permission Pattern:** `{controller}-{action}`
- **Actions:** view, create, edit, delete (or custom like export, import)

## Database Schema

### Menu Table
```
controller (varchar 191)
  ↓ maps to
Permission names: {controller}-view, {controller}-create, etc.
```

Example:
```
Menu: Category
controller: 'categories'
  ↓
Permissions:
  - categories-view
  - categories-create
  - categories-edit
  - categories-delete
```

## Commands

### Verify Setup
```bash
# Check menu-permission mapping
php artisan menu:verify

# List all permissions
php artisan permission:show

# Add missing permissions
php artisan permissions:add-missing
```

## Next Steps

1. ✓ Menu items linked to controllers
2. ✓ Permissions created and mapped
3. ✓ Super-admin has all permissions
4. Implement middleware protection on routes
5. Filter frontend menus based on user permissions
6. Add permission checks in controllers

---

**Updated:** February 8, 2026  
**Total Menu Items:** 105  
**Total Permissions:** 247  
**Mapping:** Complete ✓
