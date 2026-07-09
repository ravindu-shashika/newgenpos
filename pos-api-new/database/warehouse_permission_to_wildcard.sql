-- Rename Spatie permission id 91: warehouse → warehouse.*
-- Matches other module wildcards (unit.*, tax.*, adjustment.*, etc.)
-- Source: permissions.txt id=91

-- 1) Preview current row
SELECT id, name, guard_name
FROM permissions
WHERE id = 91 OR name IN ('warehouse', 'warehouse.*');

-- 2) Abort if warehouse.* already exists (avoid duplicate)
-- SELECT COUNT(*) FROM permissions WHERE name = 'warehouse.*' AND guard_name = 'sanctum';

-- 3) Update permission name (role links stay on permission_id — no pivot changes needed)
UPDATE permissions
SET name = 'warehouse.*',
    updated_at = NOW()
WHERE id = 91
  AND name = 'warehouse'
  AND guard_name = 'sanctum';

-- 4) Verify
SELECT id, name, guard_name, updated_at
FROM permissions
WHERE id = 91;

-- 5) Optional: list roles still holding this permission
SELECT r.id AS role_id, r.name AS role_name, p.name AS permission_name
FROM roles r
JOIN role_has_permissions rhp ON rhp.role_id = r.id
JOIN permissions p ON p.id = rhp.permission_id
WHERE p.id = 91;

-- After running, clear permission cache on the API server:
--   php artisan cache:clear
--   php artisan permission:cache-reset
