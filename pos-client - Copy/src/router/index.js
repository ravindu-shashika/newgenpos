import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import Cookies from 'js-cookie';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { requiresAuth: true }
                },
                // Product routes
                {
                    path: '/product/category',
                    name: 'product-category',
                    component: () => import('@/views/pages/category/category.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/brand',
                    name: 'product-brand',
                    component: () => import('@/views/pages/brand/brand.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/unit',
                    name: 'product-unit',
                    component: () => import('@/views/pages/unit/unit.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/warehouse',
                    name: 'product-warehouse',
                    component: () => import('@/views/pages/warehouse/warehouse.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventory/adjustments',
                    name: 'adjustment-list',
                    component: () => import('@/views/pages/adjustment/adjustment-list.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventory/adjustments/create',
                    name: 'adjustment-create',
                    component: () => import('@/views/pages/adjustment/adjustment-form.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventory/adjustments/:id',
                    name: 'adjustment-edit',
                    component: () => import('@/views/pages/adjustment/adjustment-form.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/stock-count',
                    name: 'product-stock-count',
                    component: () => import('@/views/pages/stock-count/stock-count-list.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/list',
                    name: 'product-list',
                    component: () => import('@/views/pages/product/product-list.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/print-barcode',
                    name: 'product-barcode',
                    component: () => import('@/views/pages/product/product-barcode.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/history',
                    name: 'product-history',
                    component: () => import('@/views/pages/product/product-history.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/gallery-upload',
                    name: 'product-gallery',
                    component: () => import('@/views/pages/product/product-gallery.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/add',
                    name: 'product-add',
                    component: () => import('@/views/pages/product/product-add.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/product/edit/:id',
                    name: 'product-edit',
                    component: () => import('@/views/pages/product/product-add.vue'),
                    meta: { requiresAuth: true }
                },
                // HRM
                {
                    path: '/hrm/attendance',
                    name: 'hrm-attendance',
                    component: () => import('@/views/pages/attendance/attendance.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/hrm/departments',
                    name: 'hrm-departments',
                    component: () => import('@/views/pages/department/department.vue'),
                    meta: { requiresAuth: true }
                },
                // Currencies & expense categories
                {
                    path: '/currencies',
                    name: 'currencies',
                    component: () => import('@/views/pages/currency/currency.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/expense-categories',
                    name: 'expense-categories',
                    component: () => import('@/views/pages/expense-category/expense-category.vue'),
                    meta: { requiresAuth: true }
                },
                // Customers
                {
                    path: '/customer',
                    name: 'customer-list',
                    component: () => import('@/views/pages/customer/customer.vue'),
                    meta: { requiresAuth: true }
                },
                // Employees
                {
                    path: '/employees',
                    name: 'employee-list',
                    component: () => import('@/views/pages/employee/employee.vue'),
                    meta: { requiresAuth: true }
                },
                // Settings
                {
                    path: '/settings/invoice-settings',
                    name: 'invoice-settings',
                    component: () => import('@/views/pages/invoice-settings.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings/general-setting',
                    name: 'general-setting',
                    component: () => import('@/views/pages/settings/general-setting.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings/mail-setting',
                    name: 'mail-setting',
                    component: () => import('@/views/pages/settings/mail-setting.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings/reward-point-setting',
                    name: 'reward-point-setting',
                    component: () => import('@/views/pages/settings/reward-point-setting.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings/pos-settings',
                    name: 'pos-setting',
                    component: () => import('@/views/pages/settings/pos-setting.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings/app-setting',
                    name: 'app-setting',
                    component: () => import('@/views/pages/settings/app-setting.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings/role-permission',
                    name: 'role-permission',
                    component: () => import('@/views/pages/settings/role-permission.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings/role-permission/:id',
                    name: 'role-permission-assign',
                    component: () => import('@/views/pages/settings/role-permission-assign.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings/discount-plan',
                    name: 'discount-plan',
                    component: () => import('@/views/pages/settings/discount-plan.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/settings/discount',
                    name: 'discount',
                    component: () => import('@/views/pages/settings/discount.vue'),
                    meta: { requiresAuth: true }
                },
                // Accounting
                {
                    path: '/accounting/account-list',
                    name: 'account-list',
                    component: () => import('@/views/pages/accounting/account-list.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/accounting/balance-sheet',
                    name: 'account-balance-sheet',
                    component: () => import('@/views/pages/accounting/account-balance-sheet.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/accounting/account-statement',
                    name: 'account-statement',
                    component: () => import('@/views/pages/accounting/account-statement.vue'),
                    meta: { requiresAuth: true }
                },
                // Catch-all redirect - put this last
                { path: '/:pathMatch(.*)*', redirect: '/' }
            ]
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        }
    ]
});

router.beforeEach((to, from, next) => {
    const token = Cookies.get('access_token');

    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (!token) {
            next({ name: 'login' });
        } else {
            next();
        }
    } else if (to.name === 'login' && token) {
        next({ name: 'dashboard' });
    } else {
        next();
    }
});

export default router;
