import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { selectPermissions } from '../store/authSlice';
import { ALL_PERMISSIONS_GRANTED, permissionsBypassed, hasPermission } from '../config/permissions';
import { MODULE_SINGLE_PERMISSION, permissionImplies, controllerWildcardHeld, userHoldsDotWildcard, permissionBasesForController } from '../config/permissionWildcards';
import generalSettingStore from '../stores/generalSettingStore';

// ─── Core lookup (no hook, safe to call anywhere) ─────────────────────────────
/**
 * Given the current permissions array and a controller name, return the full
 * permissions object for list/form action buttons.
 */
export function resolvePermissions(permissions, controller) {
  if (permissionsBypassed() || !controller) {
    return { ...ALL_PERMISSIONS_GRANTED };
  }

  const perms = Array.isArray(permissions) ? permissions : [];
  const bases = permissionBasesForController(controller);

  for (const base of bases) {
    const singlePerm = MODULE_SINGLE_PERMISSION[base];
    if (singlePerm && (permissionImplies(perms, singlePerm) || userHoldsDotWildcard(perms, singlePerm))) {
      return { ...ALL_PERMISSIONS_GRANTED };
    }
  }

  if (controllerWildcardHeld(perms, controller)) {
    return { ...ALL_PERMISSIONS_GRANTED };
  }

  const implies = (name) => permissionImplies(perms, name);

  const check = (...keys) =>
    bases.some((base) =>
      keys.some((k) => implies(`${base}-${k}`) || implies(`${base}.${k}`))
    );

  const canView =
    check('view', 'read', 'list', 'index') ||
    bases.some((base) => implies(`${base}-index`) || implies(base));

  return {
    canView,
    canAdd: check('add', 'create', 'store'),
    canEdit: check('edit', 'update'),
    canDelete: check('delete', 'destroy'),
    canImport: check('import'),
    canExport: check('export'),
    canSave: check('save', 'add', 'create', 'edit', 'update'),
    canCancel: check('cancel'),
    canPrint: check('print'),
    canApprove: check('approve'),
  };
}

/**
 * @param {string} controller  e.g. 'categories', 'products', 'purchases'
 */
export function usePermissions(controller) {
  const permissions = useSelector(selectPermissions);
  return resolvePermissions(permissions, controller);
}

/** Raw Spatie permission names from Redux. */
export function usePermissionNames() {
  return useSelector(selectPermissions);
}

/** Check one exact permission name (e.g. 'purchase-payment-add'). */
export function useCan(permission) {
  const permissions = useSelector(selectPermissions);
  if (permissionsBypassed()) return true;
  return hasPermission(permission, permissions);
}

export function useGeneralSetting() {
  const [setting, setSetting] = useState(() => generalSettingStore.getSetting());

  useEffect(() => {
    setSetting(generalSettingStore.getSetting());
    const unsub = generalSettingStore.subscribe(({ setting: s }) => setSetting(s));
    return unsub;
  }, []);

  return setting;
}

export default usePermissions;
