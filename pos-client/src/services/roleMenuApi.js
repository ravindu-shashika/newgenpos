import api from './api';
import cookie from './cookie';

/**
 * Role & Menu API – same pattern as Vue app (getRolePermissions, fetchMenuByRole).
 * Use these endpoints on your backend so both React and Vue can share the same APIs.
 *
 * --- Backend API contract (for both React and Vue) ---
 *
 * 1) Role permissions
 *    GET /api/roles/:roleId/permissions
 *    Response: { data: string[] }  e.g. ["categories-view", "products.edit", "dashboard"]
 *
 * 2) Menu by role
 *    GET /api/menus?role_id=:roleId
 *    or POST /api/menus with body { role_id: number }
 *    Response: { data: MenuItem[] }
 *
 *    MenuItem:
 *    {
 *      id, main_menu, main_menu_icon, sub_menu, sub_menu_icon,
 *      sub_menu_route, route, controller,
 *      second_sub_menu?, second_sub_menu_icon?  // optional
 *    }
 *
 * Note: This app also uses POST /api/showMenuAccessByRole with { role_ids } for
 * the sidebar (routes.js). You can keep that or unify on the menus API above.
 */

const ROLE_ID_COOKIE = 'role_id';
const USER_ROLES_COOKIE = 'user_roles';

/**
 * Get permissions for a role (same as Vue roleStore.getRolePermissions).
 * @param {string|number} roleId
 * @returns {Promise<string[]>} list of permission slugs (e.g. ['categories-view', 'products.edit'])
 */
export async function getRolePermissions(roleId) {
  if (!roleId) return [];
  try {
    const res = await api.get(`roles/${roleId}/permissions`);
    const data = res?.data?.data ?? res?.data ?? res;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('getRolePermissions error', err);
    return [];
  }
}

/**
 * Fetch menu by current role (same as Vue roleStore.fetchMenuByRole).
 * Uses role_id or user_roles from cookie.
 * @returns {Promise<Array>} raw menu items from backend
 */
export async function fetchMenuByRole() {
  const roleId = cookie.get(ROLE_ID_COOKIE);
  const roleIds = cookie.get(USER_ROLES_COOKIE);
  const id = roleId ?? (Array.isArray(roleIds) ? roleIds[0] : roleIds);
  if (!id) {
    console.warn('No role ID in cookie for fetchMenuByRole');
    return [];
  }
  try {
    const res = await api.get(`menus?role_id=${id}`);
    const data = res?.data?.data ?? res?.data ?? res;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('fetchMenuByRole error', err);
    return [];
  }
}

/**
 * Permission check – supports hyphen and dot format (same as Vue hasPermission).
 * @param {string[]} userPermissions
 * @param {string} controller
 */
export function hasPermission(userPermissions, controller) {
  if (!controller || !Array.isArray(userPermissions)) return false;
  return userPermissions.some((perm) => {
    if (perm.startsWith(controller + '-')) return true;
    if (perm.startsWith(controller + '.')) return true;
    if (perm === controller) return true;
    return false;
  });
}

/**
 * Build menu tree from flat backend list (same structure as Vue buildMenuTree).
 * @param {Array} menuData
 * @param {string[]} permissions
 * @returns {Array} tree with main_menu → children (sub_menu) → children (second_sub_menu)
 */
export function buildMenuTree(menuData, permissions) {
  const menuTreeData = [];
  if (!Array.isArray(menuData)) return menuTreeData;

  menuData.forEach((item) => {
    if (!hasPermission(permissions, item.controller)) return;

    let mainMenu = menuTreeData.find((m) => m.main_menu === item.main_menu);
    if (!mainMenu) {
      mainMenu = {
        id: item.id,
        main_menu: item.main_menu,
        main_menu_icon: item.main_menu_icon,
        children: [],
      };
      menuTreeData.push(mainMenu);
    }

    let subMenu = mainMenu.children.find((c) => c.sub_menu === item.sub_menu);
    if (!subMenu) {
      subMenu = {
        sub_menu: item.sub_menu,
        sub_menu_icon: item.sub_menu_icon,
        sub_menu_route: item.sub_menu_route || item.route || null,
        children: [],
      };
      if (!item.second_sub_menu) {
        delete subMenu.children;
        mainMenu.children.push(subMenu);
      } else {
        mainMenu.children.push(subMenu);
      }
    }

    if (item.second_sub_menu) {
      subMenu.children = subMenu.children || [];
      const exists = subMenu.children.some((c) => c.second_sub_menu === item.second_sub_menu);
      if (!exists) {
        subMenu.children.push({
          second_sub_menu: item.second_sub_menu,
          second_sub_menu_icon: item.second_sub_menu_icon,
          second_sub_menu_route: item.route || null,
        });
      }
    }
  });

  return menuTreeData;
}

export default {
  getRolePermissions,
  fetchMenuByRole,
  hasPermission,
  buildMenuTree,
};
