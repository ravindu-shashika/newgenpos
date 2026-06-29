/**
 * Auth store — Redux-backed facade for user + permissions.
 * Permissions are loaded from GET /api/fetch-user-permissions after login.
 */
import api from '../services/api';
import { permissionsBypassed, hasPermission } from '../config/permissions';
import { hasControllerAccess, permissionImplies, canViewController } from '../config/permissionWildcards';
import {
  setAuthLoading,
  setAuthData,
  setAuthError,
  clearAuthState,
  selectPermissions,
  selectUser,
} from '../store/authSlice';

let _store = null;

/** Called once from main.jsx before the app renders. */
export function bindAuthStore(store) {
  _store = store;
}

function requireStore() {
  if (!_store) {
    throw new Error('authStore: Redux store not bound. Call bindAuthStore(store) in main.jsx.');
  }
  return _store;
}

function getAuthSnapshot() {
  if (!_store) {
    return { user: null, permissions: [] };
  }
  const state = _store.getState();
  return {
    user: selectUser(state),
    permissions: [...selectPermissions(state)],
  };
}

const listeners = new Set();

function emitChange() {
  const snap = getAuthSnapshot();
  listeners.forEach((fn) => fn(snap));
}

/**
 * Subscribe to auth changes (permissions / user).
 * @returns unsubscribe
 */
export function subscribe(listener) {
  listeners.add(listener);
  if (!_store) {
    return () => listeners.delete(listener);
  }
  const unsub = _store.subscribe(() => {
    listener(getAuthSnapshot());
  });
  return () => {
    listeners.delete(listener);
    unsub();
  };
}

export function getState() {
  return getAuthSnapshot();
}

export function getUser() {
  return getAuthSnapshot().user;
}

export function getPermissions() {
  return getAuthSnapshot().permissions;
}

/**
 * Fetch user and permissions from GET fetch-user-permissions.
 */
export async function fetchUser() {
  requireStore();
  _store.dispatch(setAuthLoading(true));
  try {
    const res = await api.get('fetch-user-permissions');
    const data = res?.data ?? res;
    const user = data.user ?? null;
    const permissions = Array.isArray(data.permissions) ? data.permissions : [];
    _store.dispatch(setAuthData({ user, permissions }));
    emitChange();
    return { user, permissions };
  } catch (err) {
    console.error('authStore.fetchUser error', err);
    _store.dispatch(setAuthError(err?.message || 'Failed to load permissions'));
    emitChange();
    return getAuthSnapshot();
  }
}

export function setUser(user) {
  requireStore();
  _store.dispatch(setAuthData({ user, permissions: getPermissions() }));
  emitChange();
}

export function setPermissions(permissions) {
  requireStore();
  _store.dispatch(setAuthData({ user: getUser(), permissions }));
  emitChange();
}

export function clearAuth() {
  if (_store) {
    _store.dispatch(clearAuthState());
  }
  emitChange();
}

/**
 * Menu / module visibility — controller .view, .index, or .* wildcard.
 */
export function canView(controller) {
  if (permissionsBypassed()) return true;
  if (!controller) return false;
  return canViewController(getPermissions(), controller);
}

/** Check single Spatie permission name (with wildcard support). */
export function can(permission) {
  return hasPermission(permission, getPermissions());
}

/**
 * Permission check for a controller – hyphen, dot, wildcard, or exact match.
 */
export function hasControllerPermission(controller) {
  if (permissionsBypassed()) return true;
  if (!controller) return false;
  return hasControllerAccess(getPermissions(), controller);
}

export function canSave(controller) {
  if (permissionsBypassed()) return true;
  const perms = getPermissions();
  return (
    permissionImplies(perms, `${controller}.save`) ||
    permissionImplies(perms, `${controller}-save`) ||
    permissionImplies(perms, `${controller}.*`) ||
    permissionImplies(perms, `${controller}-*`)
  );
}

export function canEdit(controller) {
  if (permissionsBypassed()) return true;
  const perms = getPermissions();
  return (
    permissionImplies(perms, `${controller}.edit`) ||
    permissionImplies(perms, `${controller}-edit`) ||
    permissionImplies(perms, `${controller}.*`) ||
    permissionImplies(perms, `${controller}-*`)
  );
}

export function canDelete(controller) {
  if (permissionsBypassed()) return true;
  const perms = getPermissions();
  return (
    permissionImplies(perms, `${controller}.delete`) ||
    permissionImplies(perms, `${controller}-delete`) ||
    permissionImplies(perms, `${controller}.*`) ||
    permissionImplies(perms, `${controller}-*`)
  );
}

export function canCancel(controller) {
  if (permissionsBypassed()) return true;
  const perms = getPermissions();
  return (
    permissionImplies(perms, `${controller}.cancel`) ||
    permissionImplies(perms, `${controller}-cancel`) ||
    permissionImplies(perms, `${controller}.*`) ||
    permissionImplies(perms, `${controller}-*`)
  );
}

const authStore = {
  bindAuthStore,
  getState,
  subscribe,
  getUser,
  getPermissions,
  fetchUser,
  setUser,
  setPermissions,
  clearAuth,
  can,
  canView,
  hasPermission: hasControllerPermission,
  canSave,
  canEdit,
  canDelete,
  canCancel,
};

export default authStore;
