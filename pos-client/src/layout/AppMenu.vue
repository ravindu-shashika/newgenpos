<script setup>
import { ref, onMounted } from 'vue';
import Cookies from 'js-cookie';
import { useRoleStore } from '@/stores/roleStore';
import AppMenuItem from './AppMenuItem.vue';

const userPermissions = ref([]);
const menuTree = ref([]);
const model = ref([
    {
        label: 'Home',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/'
            }
        ]
    },
    
    
]);

// Permission checking function - supports both hyphen and dot format
const hasPermission = (controller) => {
    if (!controller) return false;
    
    const hasAccess = userPermissions.value.some((perm) => {
        // Check for hyphen format: categories-view, categories-edit, etc.
        if (perm.startsWith(controller + '-')) return true;
        
        // Check for dot format: categories.view, categories.edit, etc.
        if (perm.startsWith(controller + '.')) return true;
        
        // Check for exact match
        if (perm === controller) return true;
        
        return false;
    });
    
    if (hasAccess) {
        const matchedPerms = userPermissions.value.filter(p => 
            p.startsWith(controller + '-') || 
            p.startsWith(controller + '.') || 
            p === controller
        );
        // console.log(`✓ Permission granted for "${controller}" - Matched: ${matchedPerms.join(', ')}`);
    }
    
    return hasAccess;
};

// Build menu tree from backend data
function buildMenuTree(menuData, permissions) {
    // console.log('Menu Data:', menuData);
    // console.log('Permissions:', permissions);
    const menuTreeData = [];

    menuData.forEach((item) => {
        const hasPerm = hasPermission(item.controller);
        // console.log(`Checking menu: ${item.second_sub_menu || item.sub_menu} (controller: ${item.controller}) - Has Permission: ${hasPerm}`);
        
        if (!hasPerm) return;

        // Check if main_menu already exists
        let mainMenu = menuTreeData.find((menu) => menu.main_menu === item.main_menu);
        if (!mainMenu) {
            mainMenu = {
                id: item.id,
                main_menu: item.main_menu,
                main_menu_icon: item.main_menu_icon,
                children: []
            };
            menuTreeData.push(mainMenu);
        }

        // Check if sub_menu already exists under this main_menu
        let subMenu = mainMenu.children.find((child) => child.sub_menu === item.sub_menu);
        if (!subMenu) {
            subMenu = {
                sub_menu: item.sub_menu,
                sub_menu_icon: item.sub_menu_icon,
                sub_menu_route: item.sub_menu_route || item.route || null,
                children: []
            };

            // Only push subMenu if no second_sub_menu
            if (!item.second_sub_menu) {
                delete subMenu.children;
                mainMenu.children.push(subMenu);
            } else {
                mainMenu.children.push(subMenu);
            }
        }

        // Handle second_sub_menu if exists
        if (item.second_sub_menu) {
            subMenu.children = subMenu.children || [];
            // Avoid duplicates
            const exists = subMenu.children.some(child => 
                child.second_sub_menu === item.second_sub_menu
            );
            if (!exists) {
                subMenu.children.push({
                    second_sub_menu: item.second_sub_menu,
                    second_sub_menu_icon: item.second_sub_menu_icon,
                    second_sub_menu_route: item.route || null
                });
            }
        }
    });

    return menuTreeData;
}

// Transform backend menu structure to AppMenuItem format
function transformMenuToModel(menuTreeData) {
    return menuTreeData.map((mainMenu) => {
        const mainItem = {
            label: mainMenu.main_menu,
            icon: mainMenu.main_menu_icon || 'pi pi-fw pi-box',
            path: `/${mainMenu.main_menu.toLowerCase().replace(/\s+/g, '-')}`,
            items: []
        };

        if (mainMenu.children && mainMenu.children.length > 0) {
            mainItem.items = mainMenu.children.map((subMenu) => {
                const subItem = {
                    label: subMenu.sub_menu,
                    icon: subMenu.sub_menu_icon || 'pi pi-fw pi-circle',
                    to: subMenu.sub_menu_route || null
                };

                // If sub_menu has children (second_sub_menu)
                if (subMenu.children && subMenu.children.length > 0) {
                    subItem.path = `/${subMenu.sub_menu.toLowerCase().replace(/\s+/g, '-')}`;
                    delete subItem.to;
                    subItem.items = subMenu.children.map((secondSubMenu) => ({
                        label: secondSubMenu.second_sub_menu,
                        icon: secondSubMenu.second_sub_menu_icon || 'pi pi-fw pi-angle-right',
                        to: secondSubMenu.second_sub_menu_route || null
                    }));
                }

                return subItem;
            });
        }

        return mainItem;
    });
}

// Fetch menus and permissions from backend
const fetchMenusAndPermissions = async () => {
    try {
        const roleStore = useRoleStore();
        const roleId = Cookies.get('role_id');

        if (!roleId) {
            console.warn('No role ID found in cookies, using static menu');
            return;
        }

        const permissions = await roleStore.getRolePermissions(roleId);
        userPermissions.value = permissions;

        const menus = await roleStore.fetchMenuByRole();
        menuTree.value = buildMenuTree(menus, permissions);

        // Transform and merge with static menus
        const dynamicMenus = transformMenuToModel(menuTree.value);
        
        // Keep Dashboard at the beginning, then add dynamic menus
        const dashboardMenu = model.value.find(item => item.label === 'Home');
        if (dashboardMenu) {
            model.value = [dashboardMenu, ...dynamicMenus];
        } else {
            model.value = dynamicMenus;
        }

        ensureProductShortcuts();

        // console.log('Final model:', JSON.stringify(model.value, null, 2));
        // console.log('Menu tree before transform:', JSON.stringify(menuTree.value, null, 2));
    } catch (error) {
        console.error('Error fetching menus and permissions:', error);
        // Keep using static menus on error
        ensureProductShortcuts();
    }
};

function ensureProductShortcuts() {
    const findOrCreateProductMenu = () => {
        let menu = model.value.find((item) => {
            const label = (item?.label || '').toLowerCase();
            return label === 'product' || label === 'products';
        });

        if (!menu) {
            menu = {
                label: 'Products',
                icon: 'pi pi-fw pi-box',
                path: '/products',
                items: []
            };
            model.value.push(menu);
        }

        menu.items = menu.items || [];
        return menu;
    };

    const productMenu = findOrCreateProductMenu();

    const ensureLink = (label, path, icon) => {
        const exists = productMenu.items.some((entry) => entry.to === path);
        if (!exists) {
            productMenu.items.push({
                label,
                icon,
                to: path
            });
        }
    };

    ensureLink('Adjustment List', '/inventory/adjustments', 'pi pi-fw pi-sync');
    ensureLink('Add Adjustment', '/inventory/adjustments/create', 'pi pi-fw pi-plus-circle');
    ensureLink('Stock Count', '/inventory/stock-counts', 'pi pi-fw pi-clipboard');
}

// Load menus on component mount
onMounted(() => {
    fetchMenusAndPermissions();
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item.label || i">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator">
                <div class="separator-line"></div>
            </li>
        </template>
    </ul>
</template>

<style lang="scss" scoped>
.layout-menu {
    padding-bottom: 1rem;
}

.menu-separator {
    margin: 0.75rem 0;
    padding: 0 1rem;
    list-style: none;
}

.separator-line {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--surface-border), transparent);
}
</style>
