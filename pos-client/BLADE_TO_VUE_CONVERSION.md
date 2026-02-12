# Blade to Vue Conversion Plan

This document tracks conversion of `src/views/pages/**/*.blade.php` to Vue SPA pages.

## Status Legend

- **Done** – Vue component exists and is routed
- **To convert** – Blade page to be converted to Vue
- **Skip (layout)** – Laravel layout/partial, not an SPA page
- **Skip (mail)** – Email template, not an SPA page
- **Skip (other)** – Modal partial, print template, etc.

## Already Have Vue Equivalents (No Conversion Needed)

| Blade area | Vue component(s) | Route(s) |
|------------|------------------|----------|
| category | category.vue | /product/category |
| brand | brand.vue | /product/brand |
| unit | unit.vue | /product/unit |
| warehouse | warehouse.vue | /product/warehouse |
| attendance | attendance.vue | /hrm/attendance |
| product (create, edit, list, barcode, history, gallery) | product-add, product-list, product-barcode, product-history, product-gallery | /product/add, /product/edit/:id, /product/list, etc. |
| adjustment | adjustment-list.vue, adjustment-form.vue | /inventory/adjustments, /inventory/adjustments/create, :id |
| stock-count | stock-count-list.vue | /product/stock-count |
| settings (general, mail, reward-point, pos, app, role-permission, discount-plan, discount) | settings/*.vue | /settings/* |
| accounting | account-list, account-balance-sheet, account-statement | /accounting/* |
| invoice-settings | invoice-settings.vue | /settings/invoice-settings |

## Skip (Layout / Shell)

- `layout/main.blade.php`, `layout/sidebar.blade.php`, `layout/top-head.blade.php`, `layout/top-head-rtl.blade.php`, `layout/0main_rtl.blade.php`
- `layouts/app.blade.php`
- `setting/theme_settings/_form.blade.php` (partial)

## Skip (Mail / Email Templates)

- `mail/*.blade.php` (all email templates)

## To Convert (by area)

### HRM (partially done)
- **Done:** attendance/index → attendance.vue
- **Done:** department/index → department.vue
- **To convert:** hrm/designation/index, hrm/shift/index, hrm/leave_type/index, hrm/leave/index, hrm/holiday/*, hrm/overtime/index, hrm/payroll/*, hrm/panel.blade.php, hrm/panel/attendance (duplicate of attendance), hrm/sale_agent/*

### Settings / Master data
- **To convert:** role/permission.blade.php, role/create.blade.php
- **To convert:** setting/general_setting.blade.php (may overlap with settings/general-setting.vue)
- **To convert:** setting/invoice_setting/create, edit
- **To convert:** setting/theme_settings/index, create, edit
- **To convert:** setting/activity_log.blade.php

### Currency & Finance
- **Done:** currency/index → currency.vue
- **Done:** expense_category/index → expense-category.vue
- **To convert:** income_category/index, expense/index, income/index

### People & Org
- **Done:** customer/index, create, edit → customer.vue
- **Done:** employee/index, create → employee.vue
- **To convert:** user/create, edit
- **To convert:** biller/index, create, edit
- **To convert:** customer_group/create

### Product & Inventory (partial)
- **Done:** product list, add, edit, barcode, history, gallery
- **To convert:** warehouse/create (or merge into warehouse.vue)
- **To convert:** barcode/index, create, edit
- **To convert:** labels/show, print_label
- **To convert:** custom_field/index, create, edit

### Sales & Purchases
- **To convert:** sale/index, create, edit, pos
- **To convert:** purchase/create, edit, index, etc.
- **To convert:** quotation/index, create, edit, create_sale, create_purchase
- **To convert:** return/*, return_purchase/*
- **To convert:** delivery/index, index_new, steadfast/delivery_status

### Other
- **To convert:** challan/*, coupon/index, courier/index, cash_register/index, gift_card/index, installment_plans/show
- **To convert:** department/index, currency/index, expense_category/index (first batch)
- **To convert:** whatsapp/templates, etc.

## Conversion Order (Recommended)

1. **Batch 1 (simple CRUD):** department, currency, expense_category ✅ Done
2. **Batch 2:** customer, employee, user (list + create/edit)
3. **Batch 3:** sale, purchase, quotation, delivery
4. **Batch 4:** HRM (designation, shift, leave, holiday, payroll)
5. **Batch 5:** settings (theme, activity log), role/permission
6. **Remaining:** barcode, labels, custom_field, challan, coupon, etc.

## Notes

- Each conversion may require new or updated API routes in `pos-api/routes/api.php`.
- Vue pages follow the pattern of `unit.vue` / `category.vue` (PrimeVue DataTable, Dialog, Toast).
- Router entries go in `pos-client/src/router/index.js`.
