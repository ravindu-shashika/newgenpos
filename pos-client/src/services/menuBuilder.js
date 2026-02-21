/**
 * Build menu tree from flat API menu data, filtering by user permissions (Vue-style).
 * Supports hyphen (controller-view), dot (controller.edit), and exact match.
 */

/**
 * Check if user has access to controller (hyphen, dot, or exact).
 * @param {string} controller
 * @param {string[]} userPermissions
 * @returns {boolean}
 */
export function hasPermission(controller, userPermissions) {
  if (!controller || !Array.isArray(userPermissions)) return false;
  return userPermissions.some((perm) => {
    if (perm.startsWith(controller + '-')) return true;
    if (perm.startsWith(controller + '.')) return true;
    if (perm === controller) return true;
    return false;
  });
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
        main_menu_icon: item.main_menu_icon,
        children: [],
      };
      menuTreeData.push(mainMenu);
    }

    let subMenu = mainMenu.children.find((child) => child.sub_menu === item.sub_menu);
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
      const exists = subMenu.children.some(
        (child) => child.second_sub_menu === item.second_sub_menu
      );
      if (!exists) {
        subMenu.children.push({
          second_sub_menu: item.second_sub_menu,
          second_sub_menu_icon: item.second_sub_menu_icon,
          second_sub_menu_route: item.route || null,
          controller: item.controller,
        });
      }
    }
  });

  return menuTreeData;
}
