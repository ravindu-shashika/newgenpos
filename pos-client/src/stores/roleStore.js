/**
 * Role store for React (no Pinia).
 * Fetches menus by current role and role permissions for building the side menu.
 */
import api from '../services/api';
import cookie from '../services/cookie';

const state = {
  roles: [],
  permissions: [],
  menus: [],
};

/**
 * GET menus/current-role (or similar) – returns menu items for the current user's role.
 * Uses auth token from cookie; backend should resolve role from token.
 * @returns {Promise<Array>} raw menu items
 */
export async function fetchMenuByRole() {
  try {
    const res = await api.get('get-menu');
    const data = res?.data?.data ?? res?.data ?? res;
    const list = Array.isArray(data) ? data : [];
    state.menus = list;
    return list;
  } catch (err) {
    console.error('roleStore.fetchMenuByRole error', err);
    state.menus = [];
    return [];
  }
}

/**
 * GET roles/:roleId/permissions
 * @returns {Promise<Array>} permission slugs
 */
export async function getRolePermissions(roleId) {
  if (!roleId) return [];
  try {
    const res = await api.get(`roles/${roleId}/permissions`);
    const data = res?.data?.data ?? res?.data ?? res;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('roleStore.getRolePermissions error', err);
    return [];
  }
}

export async function fetchRoles() {
  try {
    const res = await api.get('roles');
    state.roles = res?.data?.data ?? res?.data ?? [];
    return state.roles;
  } catch (err) {
    console.error('roleStore.fetchRoles error', err);
    return [];
  }
}

export async function fetchPermissions() {
  try {
    const res = await api.get('permissions');
    state.permissions = res?.data?.data ?? res?.data ?? [];
    return state.permissions;
  } catch (err) {
    console.error('roleStore.fetchPermissions error', err);
    return [];
  }
}

const roleStore = {
  fetchMenuByRole,
  getRolePermissions,
  fetchRoles,
  fetchPermissions,
  get menus() {
    return state.menus;
  },
};

export default roleStore;
