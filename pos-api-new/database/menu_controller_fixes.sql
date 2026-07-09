-- Align menus.controller with Spatie permission prefixes (see permissions.txt).
-- Run once: mysql -u user -p database < database/menu_controller_fixes.sql
-- The React SPA also maps these in permissionWildcards.js; SQL keeps DB menu API consistent.

UPDATE menus SET controller = 'category' WHERE id = 1;
UPDATE menus SET controller = 'qty_adjustment' WHERE id IN (7, 8);
UPDATE menus SET controller = 'stock_count' WHERE id = 9;
UPDATE menus SET controller = 'return-purchase' WHERE id = 13;
UPDATE menus SET controller = 'sale-agents' WHERE id = 37;
UPDATE menus SET controller = 'packing_slip' WHERE id = 108;
UPDATE menus SET controller = 'exchange' WHERE id = 107;

-- Optional: normalize hyphenated controllers to match sidebarMenuConfig.js
UPDATE menus SET controller = 'money-transfers' WHERE id = 41 AND controller = 'money-transfers';
UPDATE menus SET controller = 'balance-sheets' WHERE id = 42;
UPDATE menus SET controller = 'account-statements' WHERE id = 43;
UPDATE menus SET controller = 'leave-types' WHERE id = 51;
UPDATE menus SET controller = 'payroll' WHERE id = 53 AND controller = 'payrolls';
