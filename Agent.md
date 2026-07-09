# Agent.md — NewGenPOS

## Name
`NewGenPOS Assistant`

## Purpose
Implement features, fixes, and migrations across the NewGenPOS monorepo with minimal, safe, pattern-aligned changes.

## Working rules
- Work in this repo only; preserve unrelated dirty-tree changes.
- Read existing code before editing; match local conventions.
- Keep diffs small; avoid new dependencies unless needed.
- Do not run destructive git/DB commands unless asked.
- Do not commit unless the user asks.
- After changes: lint/test when feasible; summarize files, behavior, and follow-ups.

---

## Monorepo layout

| Path | Stack | Role |
|------|-------|------|
| `pos-api-new/` | Laravel | **Active backend** — REST API, auth, business logic, migrations, seeders |
| `pos-client/` | React + Vite | **Admin SPA** — replaces Blade; calls `/api/*` |
| `pos_app/` | Flutter (Windows) | **Desktop POS** — offline catalog, local sales, sync to cloud |
| `old_codes/` | Laravel + Blade | **Reference only** — original controllers/views when migrating |
| `database-structure.txt` | — | Schema reference |

Legacy `pos-api/` may exist in history; use **`pos-api-new/`** for all backend work.

---

## How the apps connect

```
pos-client (admin)  ──►  pos-api-new  /api/*
pos_app (desktop)   ──►  pos-api-new  /pos/*  (download, sync, terminal)
```

- Admin SPA: Bearer token + optional branch/cluster headers (`pos-client/src/services/api.js`).
- Desktop POS: terminal registration, catalog download → SQLite, offline sales → sync (`pos_app/lib/core/sync/`).

---

## Backend (`pos-api-new`)

| Area | Location |
|------|----------|
| API routes | `routes/api.php` |
| Controllers | `app/Http/Controllers/` |
| Form requests | `app/Http/Requests/` |
| Services | `app/Services/` (e.g. `PosSaleSyncService`, `PosDownloadService`, `SaleLineCostService`) |
| Migrations | `database/migrations/` |
| Permissions | `database/seeders/PermissionSeeder.php`, `permissions.txt` |
| SPA JSON helper | `app/Traits/SpaResponse.php` — `wantsSpaResponse()`, `spaJson()` |

**SPA controller pattern:** branch on `$this->wantsSpaResponse($request)` → JSON for React, Blade/view for legacy. Return `{ message, data, errors }` on validation errors (422).

**After schema changes:** `php artisan migrate` on the target environment.

---

## Admin SPA (`pos-client`)

| Area | Location |
|------|----------|
| Pages | `src/views/backend/<module>/` |
| Routes / menu map | `src/services/routeRegistry.js`, `routes.js`, `menuBuilder.js` |
| HTTP client | `src/services/api.js` |
| API toasts | `src/services/apiMessages.js` + `useToast().showApiSuccess/showApiError` |
| Shared UI | `src/components/ui/` — `PageLayout`, `DataTable`, `Modal`, `Toast`, `tokens.js` (Karla font) |
| Permissions | `usePermissions()`, `src/config/permissionWildcards.js` |

**Page patterns**
- **Simple CRUD:** `<Module>Manager.jsx` — list + modals (Category, User, Terminal, HRM settings, …).
- **Complex flows:** `<Module>List.jsx`, `<Module>Create.jsx` / `<Module>Form.jsx` (purchases, returns, quotations).

Register new screens in `routeRegistry.js` (`ROUTE_REGISTRY`, `MENU_PATH_ALIASES`, `EXTRA_SPA_ROUTES`). Unregistered paths → placeholder.

**Frontend conventions**
- `const res = await api.post(...)` then `showApiSuccess(res, fallback)` / `showApiError(err, fallback)`.
- Do not rely on `err.response?.data?.message` alone — `api.js` throws formatted errors.
- Modals that toast need their own `<Toast toast={toast} />`.
- Delete: `{deleteId && <ConfirmModal onClose onConfirm danger />}` (no `open` prop).

---

## Desktop POS (`pos_app`)

| Area | Location |
|------|----------|
| Entry / config | `lib/main.dart`, `lib/core/config/app_config.dart` |
| API client | `lib/core/pos_http/pos_api_client.dart` |
| Local DB / repos | `lib/core/repositories/` |
| Catalog sync | `lib/core/sync/catalog_download_service.dart` |
| POS UI | `lib/features/pos/` (`pos_screen.dart`, widgets, checkout, returns) |
| Branding | `lib/core/branding/pos_branding.dart` |

Offline-first: sales in SQLite → upload when online. Match server payload shapes used by `PosSaleSyncService`.

---

## Blade → React migration (short)

1. Read `old_codes/` controller + Blade view (fields, permissions, side effects).
2. Add/extend API in `pos-api-new` with `SpaResponse` branches.
3. Build React page under `src/views/backend/<module>/`.
4. Wire `routeRegistry.js` and test menu link → **list** page.
5. Verify permissions, filters, and DB side effects match old behavior.

**Common pitfalls:** wrong menu alias, missing API route, ConfirmModal always mounted, permission name mismatch (grep old `@can` and seeder).

---

## Reference examples

| Feature | API | React / Flutter |
|---------|-----|-----------------|
| Category CRUD | `CategoryController` | `CategoryManager.jsx` |
| Product form | `ProductController` | `ProductCreate.jsx` |
| Purchase flow | `PurchaseController` | `PurchaseList.jsx`, `PurchaseForm.jsx` |
| Sale sync | `PosSaleSyncService` | `pos_app` cart → `toSyncLine()` |
| Terminals | Terminal API | `TerminalManager.jsx` + `pos_app` register flow |

---

## Definition of done
- Request implemented and aligned with patterns above.
- Migrations/seeders noted if applicable.
- Summary: changed files, user-visible behavior, manual test hints.
