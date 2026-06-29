/**
 * Build menu tree from flat API menu data, filtering by user permissions (Vue-style).
 * Supports hyphen (controller-view), dot (controller.edit), and exact match.
 */

import { SIDEBAR_MENU } from '../config/sidebarMenuConfig';
import { normalizeMenuPath } from './routeRegistry';
import { permissionsBypassed, hasPermission as checkPermission } from '../config/permissions';
import { hasControllerAccess, canViewController } from '../config/permissionWildcards';
import { resolveMenuIcon } from './menuIconResolver';

/**
 * Check if user has access to controller (hyphen, dot, or exact).
 * @param {string} controller
 * @param {string[]} userPermissions
 * @returns {boolean}
 */
export function hasPermission(controller, userPermissions) {
  if (permissionsBypassed()) return true;
  if (!controller || !Array.isArray(userPermissions)) return false;

  if (hasControllerAccess(userPermissions, controller)) return true;

  return userPermissions.some((perm) => {
    const hyphenFromUnderscore = controller.replace(/_/g, '-');
    const underscoreFromHyphen = controller.replace(/-/g, '_');
    return perm === hyphenFromUnderscore || perm === underscoreFromHyphen;
  }) || (controller === 'accounts' && userPermissions.some((perm) => perm.startsWith('account-')))
    || (controller === 'pos' && userPermissions.some((perm) => perm === 'sales-add' || perm.startsWith('sales-')))
    || (controller === 'returns' && userPermissions.some((perm) => perm.startsWith('returns')))
    || (controller === 'money-transfers' && userPermissions.some((perm) => perm.startsWith('money-transfer')))
    || (controller === 'balance-sheets' && userPermissions.some((perm) => perm.startsWith('balance-sheet')))
    || (controller === 'account-statements' && userPermissions.some((perm) => perm.startsWith('account-statement')))
    || (controller === 'packing_slip' && userPermissions.includes('packing_slip_challan'))
    || (controller === 'packing-slips' && userPermissions.includes('packing_slip_challan'))
    || (controller === 'installment-plans' && userPermissions.some((perm) => perm.startsWith('sales-')))
    || (controller === 'payroll' && userPermissions.includes('payroll'))
    || (controller === 'payrolls' && userPermissions.includes('payroll'));
}

/** Exact Spatie permission name (matches Blade @can), with wildcard support. */
export function hasExactPermission(permission, userPermissions) {
  return checkPermission(permission, userPermissions);
}

function canSeeMenuItem(item, permissions, roleId) {
  if (permissionsBypassed()) return true;
  if (item.roleMax != null && roleId != null && roleId > item.roleMax) {
    return false;
  }

  if (item.permission && hasExactPermission(item.permission, permissions)) {
    return true;
  }

  if (item.controller && canViewController(permissions, item.controller)) {
    return true;
  }

  if (!item.permission && !item.controller) {
    return true;
  }

  return false;
}

function sectionVisible(section, permissions, roleId, modules = []) {
  if (permissionsBypassed()) return true;
  if (section.moduleRequired && !modules.includes(section.moduleRequired)) {
    return false;
  }
  if (section.path) {
    return canSeeMenuItem(section, permissions, roleId);
  }
  if (section.settingsMenu && roleId != null && roleId <= 2) {
    return (section.children || []).some((c) => canSeeMenuItem(c, permissions, roleId));
  }
  if (section.sidebarPermission) {
    if (!hasExactPermission(section.sidebarPermission, permissions)) {
      return false;
    }
  }
  return (section.children || []).some((c) => canSeeMenuItem(c, permissions, roleId));
}

/**
 * Build menu tree from sidebar.blade.php structure (permission-filtered).
 * @param {string[]} permissions
 * @param {{ roleId?: number }} options
 */
export function buildSidebarMenuTree(permissions, options = {}) {
  const roleId = options.roleId ?? null;
  const modules = options.modules ?? [];
  const tree = [];

  for (const section of SIDEBAR_MENU) {
    if (!sectionVisible(section, permissions, roleId, modules)) continue;

    if (section.path) {
      const icon = resolveMenuIcon({ label: section.label, icon: section.icon, controller: section.controller });
      tree.push({
        main_menu: section.label,
        main_menu_icon: icon,
        children: [
          {
            sub_menu: section.label,
            sub_menu_icon: icon,
            sub_menu_route: normalizeMenuPath(section.path),
            controller: section.controller,
          },
        ],
      });
      continue;
    }

    const children = (section.children || [])
      .filter((item) => canSeeMenuItem(item, permissions, roleId))
      .map((item) => ({
        sub_menu: item.label,
        sub_menu_icon: resolveMenuIcon({
          label: item.label,
          icon: item.icon,
          controller: item.controller,
          parentLabel: section.label,
        }),
        sub_menu_route: normalizeMenuPath(item.path),
        controller: item.controller,
        openInNewTab: item.openInNewTab === true,
      }))
      .filter((item, index, list) => {
        const label = (item.sub_menu || '').toLowerCase();
        if (!label) return true;
        return list.findIndex((other) => (other.sub_menu || '').toLowerCase() === label) === index;
      });

    if (children.length === 0) continue;

    tree.push({
      main_menu: section.label,
      main_menu_icon: resolveMenuIcon({ label: section.label, icon: section.icon }),
      children,
    });
  }

  return tree;
}

/**
 * Build hierarchical menu tree from flat backend data; only includes items user has permission for.
 * Backend fields: main_menu, main_menu_icon, sub_menu, sub_menu_icon, sub_menu_route, second_sub_menu, second_sub_menu_icon, route, controller.
 * @param {Array} menuData - flat list from get-menu / fetchMenuByRole
 * @param {string[]} permissions - user permissions from authStore.getPermissions()
 * @returns {Array} tree: { main_menu, main_menu_icon, children: [ { sub_menu, sub_menu_icon, sub_menu_route, children?: [ { second_sub_menu, second_sub_menu_icon, second_sub_menu_route } ] } ] }
 */
export function buildMenuTree(menuData, permissions) {
  const menuTreeData = [];
  if (!Array.isArray(menuData)) return menuTreeData;

  menuData.forEach((item) => {
    const hasPerm = hasPermission(item.controller, permissions);
    if (!hasPerm) return;

    let mainMenu = menuTreeData.find((menu) => menu.main_menu === item.main_menu);
    if (!mainMenu) {
      mainMenu = {
        id: item.id,
        main_menu: item.main_menu,
        main_menu_icon: resolveMenuIcon({ label: item.main_menu, icon: item.main_menu_icon }),
        children: [],
      };
      menuTreeData.push(mainMenu);
    } else if (!mainMenu.main_menu_icon) {
      mainMenu.main_menu_icon = resolveMenuIcon({ label: item.main_menu, icon: item.main_menu_icon });
    }

    let subMenu = mainMenu.children.find((child) => child.sub_menu === item.sub_menu);
    if (!subMenu) {
      subMenu = {
        sub_menu: item.sub_menu,
        sub_menu_icon: resolveMenuIcon({
          label: item.sub_menu,
          icon: item.sub_menu_icon,
          controller: item.controller,
          parentLabel: item.main_menu,
        }),
        sub_menu_route: normalizeMenuPath(
          item.sub_menu_route || item.route || null,
          item.sub_menu
        ),
        controller: item.controller ?? null,   // ← preserve from API
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
      const exists = subMenu.children.some(
        (child) => child.second_sub_menu === item.second_sub_menu
      );
      if (!exists) {
        subMenu.children.push({
          second_sub_menu: item.second_sub_menu,
          second_sub_menu_icon: resolveMenuIcon({
            label: item.second_sub_menu,
            icon: item.second_sub_menu_icon,
            controller: item.controller,
            parentLabel: item.main_menu,
          }),
          second_sub_menu_route: normalizeMenuPath(item.route || null, item.second_sub_menu),
          controller: item.controller,
        });
      }
    }
  });

  for (const main of menuTreeData) {
    if (!main.children?.length) continue;
    const seen = new Set();
    main.children = main.children.filter((child) => {
      const route = child.sub_menu_route;
      if (!route) return true;
      if (seen.has(route)) return false;
      seen.add(route);
      return true;
    });
  }

  return menuTreeData;
}

function menuItemExistsInMain(mainNode, sidebarChild) {
  const sideRoute = normalizeMenuPath(sidebarChild.sub_menu_route, sidebarChild.sub_menu);
  const sideLabel = (sidebarChild.sub_menu || '').toLowerCase();
  if (!sideRoute && !sideLabel) return false;

  for (const child of mainNode.children || []) {
    const childRoute = normalizeMenuPath(child.sub_menu_route, child.sub_menu);
    if (sideRoute && childRoute === sideRoute) return true;
    if (sideLabel && (child.sub_menu || '').toLowerCase() === sideLabel) return true;
    for (const nested of child.children || []) {
      const nestedRoute = normalizeMenuPath(nested.second_sub_menu_route, nested.second_sub_menu);
      if (sideRoute && nestedRoute === sideRoute) return true;
    }
  }

  return false;
}

/**
 * Merge permission-filtered sidebar items missing from the DB menu tree.
 * Keeps SPA routes in sync when legacy databases lack newly migrated menu rows.
 */
export function augmentMenuTreeWithSidebar(menuTree, permissions, options = {}) {
  const sidebarTree = buildSidebarMenuTree(permissions, options);
  const result = Array.isArray(menuTree) ? [...menuTree] : [];

  for (const sidebarMain of sidebarTree) {
    const label = (sidebarMain.main_menu || '').toLowerCase();
    let dbMain = result.find((menu) => (menu.main_menu || '').toLowerCase() === label);

    if (!dbMain) {
      result.push(sidebarMain);
      continue;
    }

    if (!dbMain.main_menu_icon && sidebarMain.main_menu_icon) {
      dbMain.main_menu_icon = sidebarMain.main_menu_icon;
    } else if (!dbMain.main_menu_icon) {
      dbMain.main_menu_icon = resolveMenuIcon({ label: dbMain.main_menu, icon: sidebarMain.main_menu_icon });
    }

    for (const sidebarChild of sidebarMain.children || []) {
      const sideRoute = normalizeMenuPath(
        sidebarChild.sub_menu_route,
        sidebarChild.sub_menu
      );
      if (!sideRoute) continue;

      dbMain.children = dbMain.children || [];
      const sideLabel = (sidebarChild.sub_menu || '').toLowerCase();
      const existingIdx = dbMain.children.findIndex((child) => {
        const childRoute = normalizeMenuPath(child.sub_menu_route, child.sub_menu);
        if (childRoute === sideRoute) return true;
        if (sideLabel && (child.sub_menu || '').toLowerCase() === sideLabel) return true;
        return false;
      });

      if (existingIdx >= 0) {
        const existing = dbMain.children[existingIdx];
        const existingRoute = normalizeMenuPath(existing.sub_menu_route, existing.sub_menu);
        const resolvedIcon = resolveMenuIcon({
          label: sidebarChild.sub_menu,
          icon: existing.sub_menu_icon || sidebarChild.sub_menu_icon,
          controller: sidebarChild.controller ?? existing.controller,
          parentLabel: dbMain.main_menu,
        });
        if (
          existingRoute !== sideRoute
          || (sidebarChild.controller && existing.controller !== sidebarChild.controller)
          || sidebarChild.openInNewTab
          || !existing.sub_menu_icon
        ) {
          dbMain.children[existingIdx] = {
            ...existing,
            sub_menu_route: sideRoute,
            sub_menu_icon: resolvedIcon,
            controller: sidebarChild.controller ?? existing.controller,
            openInNewTab: sidebarChild.openInNewTab ?? existing.openInNewTab,
          };
        }
        continue;
      }

      dbMain.children.unshift({
        ...sidebarChild,
        sub_menu_route: sideRoute,
        sub_menu_icon: resolveMenuIcon({
          label: sidebarChild.sub_menu,
          icon: sidebarChild.sub_menu_icon,
          controller: sidebarChild.controller,
          parentLabel: dbMain.main_menu,
        }),
      });
    }
  }

  return result;
}
