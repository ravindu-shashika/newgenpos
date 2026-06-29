import {
  resolveRouteComponent,
  normalizeMenuPath,
  MENU_PATH_ALIASES,
  EXTRA_SPA_ROUTES,
} from './routeRegistry';

let routesList = [];

/**
 * Flatten menu tree to routes for React Router (includes placeholder pages).
 */
export function flattenMenuTreeToRoutes(menuTree) {
  if (!Array.isArray(menuTree) || menuTree.length === 0) return [];
  const out = [];
  const seen = new Set();

  for (const main of menuTree) {
    const group = main.main_menu || 'N/A';
    if (!main.children?.length) continue;

    for (const sub of main.children) {
      if (sub.children?.length) {
        for (const second of sub.children) {
          const pathURL = normalizeMenuPath(
            second.second_sub_menu_route || second.route,
            second.second_sub_menu || second.sub_menu
          );
          if (!pathURL || seen.has(pathURL)) continue;
          seen.add(pathURL);
          out.push({
            name: second.second_sub_menu || second.sub_menu,
            pathURL,
            componentName: resolveRouteComponent(pathURL),
            controllerName: second.controller ?? null,
            group,
          });
        }
      } else {
        const pathURL = normalizeMenuPath(sub.sub_menu_route || sub.route, sub.sub_menu);
        if (!pathURL || seen.has(pathURL)) continue;
        seen.add(pathURL);
        out.push({
          name: sub.sub_menu,
          pathURL,
          componentName: resolveRouteComponent(pathURL),
          controllerName: sub.controller ?? null,
          group,
        });
      }
    }
  }

  // Keep legacy DB paths (e.g. /units) routable when menu links use canonical paths (/unit)
  for (const [legacyPath, canonicalPath] of Object.entries(MENU_PATH_ALIASES)) {
    if (seen.has(canonicalPath) && !seen.has(legacyPath)) {
      const canonical = out.find((r) => r.pathURL === canonicalPath);
      if (canonical) {
        seen.add(legacyPath);
        out.push({ ...canonical, pathURL: legacyPath });
      }
    }
  }

  const extraRoutes = [];
  for (const pathURL of EXTRA_SPA_ROUTES) {
    if (seen.has(pathURL)) continue;
    seen.add(pathURL);
    let name = 'Page';
    let controllerName = null;
    let group = 'App';
    if (pathURL.startsWith('/purchases')) {
      const base = out.find((r) => r.pathURL === '/purchases') || {};
      name = pathURL.includes('create') ? 'Add Purchase' : 'Edit Purchase';
      controllerName = base.controllerName ?? 'purchases';
      group = base.group ?? 'Purchase';
    } else if (pathURL.startsWith('/pos')) {
      const base = out.find((r) => r.pathURL === '/pos') || {};
      name = 'POS Draft';
      controllerName = base.controllerName ?? 'pos';
      group = base.group ?? 'Sale';
    } else if (
      (pathURL.startsWith('/products/') || pathURL.startsWith('/product-list/'))
      && pathURL.includes('/edit')
    ) {
      const base = out.find((r) => r.pathURL === '/products') || out.find((r) => r.pathURL === '/product-list') || {};
      name = 'Edit Product';
      controllerName = base.controllerName ?? 'products';
      group = base.group ?? 'Product';
    } else if (pathURL.startsWith('/qty_adjustment/') && pathURL.includes('/edit')) {
      const base = out.find((r) => r.pathURL === '/qty_adjustment') || {};
      name = 'Edit Adjustment';
      controllerName = base.controllerName ?? 'qty_adjustment';
      group = base.group ?? 'Product';
    } else if (pathURL.startsWith('/discount-plans')) {
      const base = out.find((r) => r.pathURL === '/discount-plans') || {};
      name = pathURL.includes('create') ? 'Create Discount Plan' : 'Edit Discount Plan';
      controllerName = base.controllerName ?? 'discount-plans';
      group = base.group ?? 'Settings';
    } else if (pathURL.startsWith('/discounts')) {
      const base = out.find((r) => r.pathURL === '/discounts') || {};
      name = pathURL.includes('create') ? 'Create Discount' : 'Edit Discount';
      controllerName = base.controllerName ?? 'discounts';
      group = base.group ?? 'Settings';
    } else if (pathURL.startsWith('/employees')) {
      const base = out.find((r) => r.pathURL === '/employees') || out.find((r) => r.pathURL === '/hrm/employee') || {};
      name = 'Add Employee';
      controllerName = base.controllerName ?? 'employees';
      group = base.group ?? 'HRM';
    } else if (pathURL.startsWith('/return-purchase')) {
      const base = out.find((r) => r.pathURL === '/return-purchase') || {};
      name = pathURL.includes('create') ? 'Add Purchase Return' : 'Edit Purchase Return';
      controllerName = base.controllerName ?? 'return-purchase';
      group = base.group ?? 'Purchase';
    } else if (pathURL.startsWith('/quotations') || pathURL.startsWith('/quotation/')) {
      const base = out.find((r) => r.pathURL === '/quotations') || out.find((r) => r.pathURL === '/quotation/list') || {};
      if (pathURL.includes('create_sale')) {
        name = 'Create Sale from Quotation';
      } else if (pathURL.includes('create_purchase')) {
        name = 'Create Purchase from Quotation';
      } else if (pathURL.includes('add') || pathURL.includes('create')) {
        name = 'Add Quotation';
      } else if (pathURL.includes('/edit')) {
        name = 'Edit Quotation';
      } else {
        name = 'Quotation List';
      }
      controllerName = base.controllerName ?? 'quotations';
      group = base.group ?? 'Quotation';
    } else if (pathURL.startsWith('/transfers') || pathURL.startsWith('/transfer')) {
      const base = out.find((r) => r.pathURL === '/transfers') || out.find((r) => r.pathURL === '/transfer-list') || {};
      if (pathURL.includes('import') || pathURL.includes('csv')) {
        name = 'Import Transfer';
      } else if (pathURL.includes('add') || pathURL.includes('create')) {
        name = 'Add Transfer';
      } else if (pathURL.includes('/edit')) {
        name = 'Edit Transfer';
      } else {
        name = 'Transfer List';
      }
      controllerName = base.controllerName ?? 'transfers';
      group = base.group ?? 'Transfer';
    } else if (pathURL.startsWith('/user/profile/')) {
      name = 'User Profile';
      controllerName = 'user-profile';
      group = 'Settings';
    } else if (pathURL.startsWith('/manufacturing/')) {
      const base = out.find((r) => r.pathURL === '/manufacturing/recipes')
        || out.find((r) => r.pathURL === '/manufacturing/productions')
        || {};
      if (pathURL.includes('/recipes/') && pathURL.includes('/edit')) {
        name = 'Edit Recipe';
        controllerName = base.controllerName ?? 'manufacturing-recipes';
      } else if (pathURL.includes('/recipes/create')) {
        name = 'Add Recipe';
        controllerName = base.controllerName ?? 'manufacturing-recipes';
      } else if (pathURL.includes('/productions/create')) {
        name = 'Add Production';
        controllerName = 'manufacturing-productions';
      } else {
        name = 'Manufacturing';
      }
      group = base.group ?? 'Manufacturing';
    } else if (pathURL === '/products/history') {
      const base = out.find((r) => r.pathURL === '/products') || {};
      name = 'Product History';
      controllerName = base.controllerName ?? 'products';
      group = base.group ?? 'Product';
    }
    extraRoutes.push({
      name,
      pathURL,
      componentName: resolveRouteComponent(pathURL) ?? resolveRouteComponent(pathURL.split('/:')[0]),
      controllerName,
      group,
    });
  }

  // Register parametric CRUD routes first so they win over list paths like /products.
  return [...extraRoutes, ...out];
}

export function buildRoutesFromMenuItems(menuItems) {
  if (!Array.isArray(menuItems) || menuItems.length === 0) return [];
  const out = [];
  for (const item of menuItems) {
    const pathURL = normalizeMenuPath(
      item.route ?? item.path ?? item.module_path ?? item.sub_menu_route
    );
    if (!pathURL) continue;
    const controller = item.controller ?? item.component ?? item.name;
    out.push({
      name: item.name ?? item.sub_menu ?? item.main_menu,
      pathURL,
      componentName: resolveRouteComponent(pathURL),
      controllerName: controller,
      group: item.group ?? item.main_menu ?? 'N/A',
      order: item.order ?? item.order_no ?? 999,
    });
  }
  out.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return out;
}

class Routes {
  async routes() {
    routesList = [];
    return Promise.resolve(routesList);
  }
}

export default new Routes();
