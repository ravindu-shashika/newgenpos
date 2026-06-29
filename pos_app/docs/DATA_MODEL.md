# POS local database — table analysis

Tables the Flutter app caches locally for **fast scan, search, and offline billing**.

## Must cache (read-heavy, needed offline)

### `products`
Core catalog. Fields: `id`, `name`, `code`, `type`, `price`, `cost`, `tax_id`, `tax_method`, `category_id`, `brand_id`, `unit_id`, `sale_unit_id`, `image`, `is_variant`, `is_batch`, `is_imei`, `is_embeded`, `featured`, `updated_at`.

**Indexes:** `code` (unique), `name` (search), `category_id`, `updated_at`.

### `product_variants`
Variant barcodes (`item_code`) for scan when `is_variant = true`.

**Indexes:** `item_code`, `product_id`.

### `product_stock` (maps `product_warehouse` on server)
Stock per warehouse for qty checks and grid display.

Fields: `product_id`, `warehouse_id`, `variant_id`, `qty`, `price`, `product_batch_id`, `imei_number`.

**Indexes:** `(warehouse_id, product_id)`, `(warehouse_id, variant_id)`.

### `categories`, `brands`
Product grid filters and UI chips.

### `taxes`, `units`
Price/tax calculation on device (match server logic).

### `customers`
Required for every sale (`customer_id`). Cache walk-in + frequent customers.

### `billers`
POS biller selection.

### `coupons`
Optional discount at checkout.

### `sync_meta`
Single row: `device_id`, `warehouse_id`, `last_catalog_sync_at`, `pos_base_url` (on device session).

## Must store locally (write offline, sync up)

### `local_sales`
Offline sale queue.

| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | local PK |
| client_uuid | UUID UNIQUE | idempotent sync key |
| warehouse_id | INT | |
| customer_id | INT | |
| biller_id | INT | nullable |
| reference_no | TEXT | local ref until synced |
| grand_total | DECIMAL | |
| paid_amount | DECIMAL | |
| sale_status | INT | 1=completed, 3=draft |
| payment_status | INT | |
| order_tax_rate | DECIMAL | |
| order_discount | DECIMAL | |
| shipping_cost | DECIMAL | |
| coupon_id | INT | nullable |
| payload_json | JSONB | full payload backup |
| sync_status | TEXT | `pending`, `syncing`, `synced`, `failed` |
| server_sale_id | INT | nullable after sync |
| server_reference_no | TEXT | nullable |
| error_message | TEXT | nullable |
| created_at | TIMESTAMPTZ | |

**Index:** `(sync_status) WHERE sync_status = 'pending'`.

### `local_sale_lines`
Line items for each `local_sales.id`.

Maps to server `product_sales`: `product_id`, `variant_id`, `qty`, `net_unit_price`, `discount`, `tax_rate`, `tax`, `total`, `product_batch_id`, `imei_number`, `sale_unit_id`.

### `local_payments`
Optional split payments before sync (maps to server `payments`).

## Server-only (do not duplicate fully)

- `users`, `roles`, `permissions` — auth via token only
- Full `sales` / `product_sales` — created on sync
- Inventory movements — applied by `SaleController::store` on sync

## Sync strategy

| Direction | Endpoint | Local table |
|-----------|----------|-------------|
| Pull catalog | `GET /pos-app/catalog?warehouse_id=&since=` | products, stock, refs |
| Push sales | `POST /pos-app/sales/sync` | local_sales → server sales |
| Status | `POST /pos-app/sales/sync-status` | update sync_status |

Delta sync: pass `since=<last_catalog_sync_at>` to catalog endpoint; upsert rows where `updated_at >= since`.

## Scan lookup order (local)

1. Exact match `product_variants.item_code = :code`
2. Exact match `products.code = :code`
3. Prefix search `products.name ILIKE :q%` (search UI)

Same order on server via `GET /pos-app/scan`.
