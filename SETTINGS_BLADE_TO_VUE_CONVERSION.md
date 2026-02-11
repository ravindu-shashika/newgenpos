# Settings Blade to Vue Conversion Summary

## Converted to Vue (Completed)

| Blade File | Vue Component | Route | API Endpoints |
|------------|---------------|-------|---------------|
| `general_setting.blade.php` | `general-setting.vue` | `/settings/general-setting` | GET/POST `settings/general` |
| `mail_setting.blade.php` | `mail-setting.vue` | `/settings/mail-setting` | GET/POST `settings/mail` |
| `reward_point_setting.blade.php` | `reward-point-setting.vue` | `/settings/reward-point-setting` | GET/POST `settings/reward-point` |
| `pos_setting.blade.php` | `pos-setting.vue` | `/settings/pos-settings` | GET/POST `settings/pos` |
| `app_setting.blade.php` | `app-setting.vue` | `/settings/app-setting` | GET `settings/app`, GET `settings/app-token-delete/{id}` |
| `invoice_setting/index.blade.php` + create/edit | `invoice-settings.vue` | `/settings/invoice-settings` | (already done) |

## Remaining Blade Files (Not Yet Converted)

| Blade File | Notes |
|------------|-------|
| `activity_log.blade.php` | Activity log table – requires API for activity logs |
| `sms_setting.blade.php` | SMS gateway config – dynamic fields per gateway |
| `create_sms.blade.php` | Create/send SMS – requires SmsService integration |
| `payment-gateways.blade.php` | Payment gateway config – complex structure |
| `hrm_setting.blade.php` | HRM settings |
| `invoice_setting/58mm.blade.php` | **Keep as Blade** – PDF invoice template (server-rendered) |
| `invoice_setting/80mm.blade.php` | **Keep as Blade** – PDF invoice template (server-rendered) |
| `invoice_setting/a4.blade.php` | **Keep as Blade** – PDF invoice template (server-rendered) |
| `theme_settings/*` | Theme CRUD – requires theme API |

## Files Created

### Backend (pos-api)
- `app/Http/Controllers/SettingApiController.php` – API methods for settings

### Frontend (pos-client)
- `src/views/pages/settings/general-setting.vue`
- `src/views/pages/settings/mail-setting.vue`
- `src/views/pages/settings/reward-point-setting.vue`
- `src/views/pages/settings/pos-setting.vue`
- `src/views/pages/settings/app-setting.vue`

### Routes Added
- `GET/POST /api/settings/general`
- `GET/POST /api/settings/mail`
- `GET/POST /api/settings/reward-point`
- `GET/POST /api/settings/pos`
- `GET /api/settings/app`
- `GET /api/settings/app-token-delete/{id}`

## Menu Integration

The Vue routes match the paths in `MenuSeeder`:
- General Setting → `/settings/general-setting`
- Mail Setting → `/settings/mail-setting`
- Reward Point Setting → `/settings/reward-point-setting`
- POS Settings → `/settings/pos-settings`
- Invoice Settings → `/settings/invoice-settings`
- Warehouse → `/settings/warehouse` (redirects to `/product/warehouse`)

## Invoice Templates (58mm, 80mm, A4)

The `invoice_setting/58mm.blade.php`, `80mm.blade.php`, and `a4.blade.php` files are **invoice layout templates** used for server-side PDF generation. They should remain as Blade views because:
- They are rendered by Laravel when generating invoices
- They contain PHP logic for sale data, currency formatting, etc.
- The Vue app does not render PDFs; the API returns PDF or the backend generates it
