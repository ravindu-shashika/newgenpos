# Agent.md

## Name
`NewGenPOS Assistant`

## Purpose
Support development and maintenance of the NewGenPOS project by providing reliable code changes, clear explanations, and safe operational guidance.

## Scope
- Work inside this repository only.
- Implement features, bug fixes, refactors, and documentation updates.
- Run and report relevant checks/tests when possible.

## Responsibilities
- Understand the task before editing files.
- Keep changes minimal, readable, and aligned with existing project patterns.
- Preserve unrelated user changes in a dirty working tree.
- Explain what changed, where, and why.

## Working Style
- Be concise, collaborative, and solution-oriented.
- Prefer safe assumptions and proceed without unnecessary back-and-forth.
- Ask for clarification only when ambiguity could cause harmful or expensive mistakes.

## Code Quality Rules
- Follow existing architecture and naming conventions.
- Add comments only where logic is non-obvious.
- Avoid introducing new dependencies unless necessary.
- Prefer small, review-friendly commits.

## Safety Guardrails
- Do not run destructive commands unless explicitly requested.
- Do not revert unrelated changes.
- Do not modify controller files unless the task requires it (migrations from old code **do** require controller/API work).
- Highlight risks, breaking changes, and migration needs before finalizing.

## Definition of Done
- Requested change is implemented.
- Affected files are validated (lint/test/build where feasible).
- Final summary includes:
  - changed files
  - behavior impact
  - any follow-up actions

---

## Project Layout

| Path | Role |
|------|------|
| `old_codes/` | **Reference only** — original Laravel controllers, Blade views, and business logic. Read this first when migrating a screen. |
| `pos-api/` | Laravel backend — models, controllers, API routes, remaining Blade views. |
| `pos-client/` | React SPA (Vite) — new UI that replaces Blade pages. |
| `database-structure.txt` | Database schema reference. |

The SPA talks to Laravel through **`/api/*`** JSON endpoints. Blade routes in `pos-api/routes/web.php` and `spa_web_routes.php` remain for legacy/non-migrated pages.

---

## Old Code → New SPA Migration Workflow

When migrating a Blade screen to React, **match old behavior first**, then wire the SPA. Do not invent new UX unless the user asks.

### Step 1 — Study the old implementation

1. Find the old controller in `old_codes/app/Http/Controllers/`.
2. Find the Blade view in `old_codes/views/backend/...` (or `pos-api/resources/views/backend/...`).
3. Note:
   - Routes and route names (`web.php` / `spa_web_routes.php`)
   - Permissions (`@can`, Spatie permission names, role checks)
   - Filters, table columns, form fields, calculations (especially JS in Blade)
   - Store/update/delete side effects (stock, payments, accounts, etc.)
   - Edge cases (e.g. exclude `initial stock` from purchase list)

### Step 2 — Backend (Laravel API)

Pick the pattern already used for similar modules:

#### Pattern A — Extend the existing controller

Used for CRUD modules where one controller already owns the feature (e.g. `PurchaseController`, `CategoryController`, `ProductController`).

1. Add `use App\Traits\SpaResponse;` and the trait to the controller.
2. In each action, branch on SPA vs Blade:

```php
if ($this->wantsSpaResponse($request)) {
    return $this->spaJson($request, ['data' => $payload], 200);
}
return view('backend....');
```

3. For `store` / `update` / `destroy`, return JSON on success/error instead of redirects when SPA:

```php
return $this->spaJson($request, ['message' => strip_tags($message), 'data' => $model], 201);
// validation:
return $this->spaJson($request, ['message' => $v->errors()->first(), 'errors' => $v->errors()], 422);
```

4. Register routes in `pos-api/routes/api.php` under the authenticated API group.

#### Pattern B — Dashboard controller + existing store controller

Used when list/form JSON is large or list logic should stay separate (e.g. `ReturnSaleDashboardController`, `ReturnPurchaseDashboardController`, `ChallanDashboardController`).

| Responsibility | Controller |
|----------------|------------|
| `index`, `create` (form data), `show`, sometimes `destroy` | `*DashboardController` — JSON only |
| `store`, `update`, heavy business logic | Existing `*Controller` — add `wantsSpaResponse()` branches |

`SpaResponse` trait (`pos-api/app/Traits/SpaResponse.php`):

- `wantsSpaResponse($request)` — true when `expectsJson()` or path is `api/*`
- `spaJson($request, $payload, $status)` — standard JSON response

**Permission checks:** mirror old Blade `@can` and role logic. Permission names vary in the DB (e.g. `returns-index`, `purchase-return-index`, `purchase-returns-view`) — check aliases in nearby migrated controllers.

**Staff access:** copy `applyStaffAccessFilter()` from similar dashboard controllers when the old list filtered by `staff_access` config.

### Step 3 — Frontend (React)

#### File layout

```
pos-client/src/views/backend/<module>/
  <Module>List.jsx       # list page (or Manager for simple CRUD)
  <Module>Create.jsx     # create/edit form when needed
  index.jsx               # re-export: export { default } from './<Module>List';
  create.jsx              # re-export create component
  edit.jsx                # re-export or placeholder until edit is migrated
```

Export new components from `pos-client/src/views/index.js`.

#### Route registration (`pos-client/src/services/routeRegistry.js`)

1. **`ROUTE_REGISTRY`** — map SPA path → React component.
2. **`MENU_PATH_ALIASES`** — map old DB menu paths → canonical SPA paths (menus table often has wrong/legacy URLs).
3. **`EXTRA_SPA_ROUTES`** — CRUD paths not in the menu (e.g. `/return-purchase/create`, `/purchases/:id/edit`).
4. **`normalizeMenuPath(path, label)`** — resolve ambiguous menu entries using label text (e.g. “Purchase Return List” must go to `/return-purchase`, not create).

Unregistered paths fall back to `PlaceholderPage` via `resolveRouteComponent()`.

`routes.js` uses the registry to build React Router routes from the menu tree and `EXTRA_SPA_ROUTES`.

#### List page conventions

Copy structure from a migrated sibling (best references):

- `ReturnSaleList.jsx` — sale returns list
- `ReturnPurchaseList.jsx` — purchase returns list
- `PurchaseList.jsx` — purchases list

Typical stack:

- `PageLayout`, `DataTable`, `Pagination`, `ActionMenu`
- `useToast()` + `<Toast toast={toast} />`
- `api.get/post/put/delete` from `pos-client/src/services/api.js` (base URL `/api`)
- `usePermissions(controllerName)` + fallback checks on `authStore.getPermissions()` when Spatie names differ
- Delete: `{deleteId != null && <ConfirmModal onClose={...} onConfirm={...} danger />}` — **never** pass `open`/`onCancel` to `ConfirmModal` (it has no `open` prop and always renders when mounted)

#### Create/edit form conventions

- Load form data with `GET /api/<resource>/create` or `GET /api/<resource>/{id}/edit`.
- Port Blade JavaScript calculations literally (totals, tax, line items) — verify against old view.
- Submit with `POST`/`PUT`; show validation errors from `response.data.errors` or `message`.
- Navigate back to list on success.

### Step 4 — Verify behavior

Checklist for each migrated screen:

- [ ] Menu link opens the **list**, not create/edit (fix aliases in `routeRegistry.js` if wrong)
- [ ] Permissions: hidden actions for unauthorized users
- [ ] List filters match old defaults (date range, warehouse, search)
- [ ] Create/update/delete produce same DB side effects as old code
- [ ] Modals/toasts work (ConfirmModal conditional render, Toast uses `toast={toast}`)
- [ ] API errors show user-friendly messages

---

## Reference Examples (completed migrations)

| Feature | Old reference | API | React |
|---------|---------------|-----|-------|
| Purchase list/form | `old_codes/.../PurchaseController.php` | `PurchaseController` + `api.php` `purchases/*` | `PurchaseList.jsx`, `PurchaseForm.jsx` |
| Sale return list | old return views | `ReturnSaleDashboardController` | `ReturnSaleList.jsx` |
| Purchase return | `old_codes/.../ReturnPurchaseController.php` | `ReturnPurchaseDashboardController` + `ReturnPurchaseController::store` | `ReturnPurchaseList.jsx`, `ReturnPurchaseCreate.jsx` |
| Product + initial stock | `old_codes/.../ProductController.php` | `ProductController` SPA branches | `ProductCreate.jsx` |

---

## Common Pitfalls

1. **Wrong menu path** — DB `menus` table paths often differ from SPA paths. Always add `MENU_PATH_ALIASES` and test sidebar navigation.
2. **ConfirmModal always visible** — must conditionally render `{id && <ConfirmModal ... />}`; use `onClose`, not `onCancel`.
3. **Placeholder page shown** — route missing from `ROUTE_REGISTRY` or `EXTRA_SPA_ROUTES`.
4. **Changing business logic** — SPA migration should preserve old controller behavior; only the transport (JSON + React) changes unless fixing a known bug.
5. **Forgetting API routes** — React calls `/api/...`; every screen needs matching entries in `routes/api.php`.
6. **Permission name mismatch** — grep old Blade `@can('...')` and both old/new controllers for all alias names.

---

## Project References
- Database structure: `database-structure.txt`
- SPA response trait: `pos-api/app/Traits/SpaResponse.php`
- Route mapping: `pos-client/src/services/routeRegistry.js`
- Menu + permissions: `pos-client/src/services/menuBuilder.js`
- Shared UI: `pos-client/src/components/ui/`
