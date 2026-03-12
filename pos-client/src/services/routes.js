import {
  Dashboard,
  AccountStatement,
  // BalanceSheet,
  AccountList,

} from '../views';

import { Users, Roles } from '../auth';

import { api, cookie } from '../services';
import AdjustmentList from '../views/adjustment/adjustment_list';

const componentsList = [
  {
    name: 'Dashboard',
    route: '/home',
    value: Dashboard,
  },
  {
    name: 'AccountStatement',
    route: '/account-statement',
    value: AccountStatement,
  },
  // {
  //   name: 'BalanceSheet',
  //   route: '/balance-sheet',
  //   value: BalanceSheet,
  // },
  {
    name: 'AccountList',
    route: '/account-list',
    value: AccountList, // Reusing AccountStatement for demonstration; replace with actual component if available
  },
  {
    name: 'Adjustment List',
    route: '/adjustment-list',
    value: AdjustmentList, // Placeholder, replace with actual component when implemented
  }
];

let routesList = [];

/**
 * Resolve React component from route path or controller name using componentsList.
 */
function resolveComponent(pathURL, controllerOrName) {
  if (pathURL) {
    const normalized = pathURL.startsWith('/') ? pathURL : '/' + pathURL;
    const byRoute = componentsList.find((c) => {
      if (!c.route) return false;
      const base = c.route.split(':')[0];
      return c.route === pathURL || c.route === normalized || pathURL === c.route || pathURL.startsWith(base) || normalized.startsWith(base);
    });
    if (byRoute) return byRoute.value;
  }
  if (controllerOrName) {
    const byName = componentsList.find(
      (c) =>
        c.name === controllerOrName ||
        String(c.name).toLowerCase() === String(controllerOrName).toLowerCase()
    );
    if (byName) return byName.value;
  }
  return null;
}

/**
 * Flatten menu tree (from buildMenuTree) to flat route list for SideNav.
 * Each leaf: sub_menu + sub_menu_route, or second_sub_menu + second_sub_menu_route.
 * @param {Array} menuTree - from buildMenuTree(menuData, permissions)
 * @returns {Array<{ name, pathURL, componentName, group }>}
 */
export function flattenMenuTreeToRoutes(menuTree) {
  if (!Array.isArray(menuTree) || menuTree.length === 0) return [];
  const out = [];
  for (const main of menuTree) {
    const group = main.main_menu || 'N/A';
    if (!main.children || main.children.length === 0) continue;
    for (const sub of main.children) {
      if (sub.children && sub.children.length > 0) {
        for (const second of sub.children) {
          const pathURL = second.second_sub_menu_route || second.route || null;
          if (!pathURL) continue;
          const comp = resolveComponent(pathURL, second.controller);
          if (!comp) continue;
          out.push({
            name: second.second_sub_menu || second.sub_menu,
            pathURL,
            componentName: comp,
            group,
          });
        }
      } else {
        const pathURL = sub.sub_menu_route || null;
        if (!pathURL) continue;
        const comp = resolveComponent(pathURL, null);
        if (!comp) continue;
        out.push({
          name: sub.sub_menu,
          pathURL,
          componentName: comp,
          group,
        });
      }
    }
  }
  return out;
}

export function buildRoutesFromMenuItems(menuItems) {
  if (!Array.isArray(menuItems) || menuItems.length === 0) return [];
  const out = [];
  for (const item of menuItems) {
    const compName =
      item.component ?? item.controller ?? item.name ?? item.module_name ?? item.sub_menu;
    if (!compName) continue;
    const comp = componentsList.find(
      (c) => c.name === compName || String(c.name).toLowerCase() === String(compName).toLowerCase()
    );
    if (!comp) continue;
    const pathURL =
      item.route ??
      item.path ??
      item.module_path ??
      item.sub_menu_route ??
      comp.route;
    if (!pathURL) continue;
    const name =
      item.name ?? item.module_name ?? item.sub_menu ?? item.main_menu ?? comp.name;
    const group =
      item.group ??
      item.module_category ??
      item.main_menu ??
      'N/A';
    const order = item.order ?? item.order_no ?? 999;
    out.push({
      name,
      pathURL,
      componentName: comp.value,
      group: group ?? 'N/A',
      order,
      level: item.level ?? 1,
    });
  }
  out.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return out;
}

class Routes {
  /**
   * Legacy: returns all components as routes (no API). Prefer using
   * roleStore.fetchMenuByRole() + buildRoutesFromMenuItems(menus) for role-based menu.
   */
  async routes() {
    routesList = [];
    componentsList.forEach((component) => {
      if (component.route) {
        routesList.push({
          name: component.name,
          pathURL: component.route,
          componentName: component.value,
          group: 'N/A',
        });
      }
    });
    return Promise.resolve(routesList);
  }
}

export default new Routes();
