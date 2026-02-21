/**
 * Auth store for React (no Pinia).
 * Mirrors Vue useAuthStore: user, permissions, fetchUser, can(), canSave(), etc.
 */
import api from '../services/api';

const state = {
  user: null,
  permissions: [],
};

const listeners = new Set();

function getState() {
  return { user: state.user, permissions: [...state.permissions] };
}

function emitChange() {
  listeners.forEach((fn) => fn(getState()));
}

/**
 * Subscribe to store changes (e.g. in useEffect for re-render on auth update).
 * @returns unsubscribe function
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUser() {
  return state.user;
}

export function getPermissions() {
  return state.permissions;
}

/**
 * Fetch user and permissions (same as Vue: api.get('fetch-user-permissions')).
 * @returns {Promise<{ user, permissions }>}
 */
export async function fetchUser() {
  try {
    const res = await api.get('fetch-user-permissions');
    const data = res?.data ?? res;
    state.user = data.user ?? state.user;
    state.permissions = Array.isArray(data.permissions) ? data.permissions : [];
    emitChange();
    return { user: state.user, permissions: state.permissions };
  } catch (err) {
    console.error('authStore.fetchUser error', err);
    return { user: state.user, permissions: state.permissions };
  }
}

export function setUser(user) {
  state.user = user;
  emitChange();
}

export function setPermissions(permissions) {
  state.permissions = Array.isArray(permissions) ? permissions : [];
  emitChange();
}

export function clearAuth() {
  state.user = null;
  state.permissions = [];
  emitChange();
}

/** Check single permission */
export function can(permission) {
  return state.permissions.includes(permission);
}

/**
 * Permission check for a controller – supports hyphen, dot, and exact match (same as Vue).
 * e.g. hasPermission('categories') matches 'categories-view', 'categories.edit', 'categories'.
 * @param {string} controller
 * @returns {boolean}
 */
export function hasPermission(controller) {
  if (!controller) return false;
  const perms = state.permissions;
  return perms.some((perm) => {
    if (perm.startsWith(controller + '-')) return true;
    if (perm.startsWith(controller + '.')) return true;
    if (perm === controller) return true;
    return false;
  });
}

export function canSave(controller) {
  return can(`${controller}.save`) || can(`${controller}.*`);
}

export function canEdit(controller) {
  return can(`${controller}.edit`) || can(`${controller}.*`);
}

export function canDelete(controller) {
  return can(`${controller}.delete`) || can(`${controller}.*`);
}

export function canCancel(controller) {
  return can(`${controller}.cancel`) || can(`${controller}.*`);
}

const authStore = {
  getState,
  subscribe,
  getUser,
  getPermissions,
  fetchUser,
  setUser,
  setPermissions,
  clearAuth,
  can,
  hasPermission,
  canSave,
  canEdit,
  canDelete,
  canCancel,
};

export default authStore;
