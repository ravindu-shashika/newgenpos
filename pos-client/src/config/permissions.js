/**
 * Permission enforcement for React SPA.
 * Set VITE_ENFORCE_PERMISSIONS=false to bypass checks during development.
 */
export const ENFORCE_PERMISSIONS =
  import.meta.env.VITE_ENFORCE_PERMISSIONS !== 'false';

export const ALL_PERMISSIONS_GRANTED = {
  canView: true,
  canAdd: true,
  canEdit: true,
  canDelete: true,
  canImport: true,
  canExport: true,
  canSave: true,
  canCancel: true,
  canPrint: true,
  canApprove: true,
};

export function permissionsBypassed() {
  return !ENFORCE_PERMISSIONS;
}

import { permissionImplies } from './permissionWildcards';

/** Check a single Spatie permission name (exact match only). */
export function hasExactPermission(permission, permissions) {
  if (permissionsBypassed()) return true;
  if (!permission || !Array.isArray(permissions)) return false;
  return permissions.includes(permission);
}

/** Check permission with Spatie wildcard support (base.*, base-*, *). */
export function hasPermission(permission, permissions) {
  if (permissionsBypassed()) return true;
  if (!permission || !Array.isArray(permissions)) return false;
  return permissionImplies(permissions, permission);
}
