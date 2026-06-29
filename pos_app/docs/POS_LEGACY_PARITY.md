# Flutter POS vs original web POS (`old_codes`)

Reference: `old_codes/views/backend/sale/pos.blade.php` + `old_codes/routes/web.php`

Route: `GET pos/{id?}` → `SaleController::posSale` (draft resume)

## Catalog (left panel)

| Feature | Web POS | Flutter | Notes |
|---------|---------|---------|-------|
| Product grid | `sales/getproducts/{warehouse}/{key}/{value}` | `warehouseProductsProvider` | |
| Featured filter | `#featured-filter` | Filter chip | |
| Brand filter | Brand overlay | Brand picker dialog | |
| Category filter | Category overlay | Category picker dialog | |
| Load more | Infinite scroll | Pagination TODO | |
| Barcode search | `sales/lims_product_search` | Scan field + local/API | |
| Product images | Grid images | Text cards only | TODO images |
| Sound on add | `playSound()` | — | TODO |

## Checkout header

| Feature | Web POS | Flutter |
|---------|---------|---------|
| Sale date | Date picker | Sale date field |
| Customer | Select + add modal | Dropdown |
| Warehouse | Panel / locked | Session + dropdown |
| Biller | Panel / locked | Dropdown |
| Currency + rate | Panel | TODO (needs download) |
| Account | Panel | TODO |
| Retail / Wholesale | `#price_type` | Price type dropdown |
| Restaurant table/waiter | Module | — (module off) |
| Custom sale fields | Dynamic | — |

## Cart

| Feature | Web POS | Flutter |
|---------|---------|---------|
| Line qty +/- | Yes | Yes |
| Edit line modal | `#editModal` | Line edit dialog |
| Remove line | Yes | Yes |
| Batch / IMEI | Yes | Lookup only |
| Combo products | Modal | — |

## Totals

| Feature | Web POS | Flutter |
|---------|---------|---------|
| Subtotal / line tax | Yes | Yes |
| Order discount Flat/% | `#order-discount-modal` | Modal |
| Coupon | `#coupon-modal` + validate | Modal + local coupons |
| Order tax | `#order-tax` | Dropdown |
| Shipping | `#shipping-cost-modal` | Modal |
| Grand total | Yes | Yes |

## Payment bar (fixed bottom)

| Method | paid_by_id | Flutter |
|--------|------------|---------|
| Cash | 1 | Yes |
| Card | 3 | Yes |
| Cheque | 4 | Yes |
| Gift Card | 2 | Yes |
| Deposit | 6 | Yes |
| Credit Sale | credit | Yes |
| Multiple Payment | multiple | Partial |
| Points | 7 | TODO |
| Razorpay / PayPal | — | Online only TODO |
| Installment | — | TODO |
| Draft | `sale_status=3` | Local draft |
| Cancel | Clear cart | Yes |
| Recent | `#recentTransaction` | Recent dialog |

## Finalize sale modal

| Field | Web | Flutter |
|-------|-----|---------|
| Paying amount | Yes | Cash modal |
| Change / due | Yes | Change display |
| Sale note | Yes | Sale note field |
| Staff note | Yes | Staff note field |
| Print invoice | Checkbox | TODO print |

## Navbar / tools

| Tool | Web | Flutter |
|------|-----|---------|
| Home menu | Dashboard links | — (desktop app) |
| Keyboard shortcuts | Shift+* list | Shortcuts dialog |
| Calculator | Dropdown | Calculator dialog |
| Sale return | Quick form | TODO |
| Fullscreen | Yes | TODO |
| Customer display | Second screen | — |
| Print last receipt | `sales/print-last-reciept` | TODO when online |
| Cash register | `cash-register/*` | TODO |
| Today sale / profit | Modals | TODO |

## Keyboard shortcuts (web)

| Shortcut | Action | Flutter |
|----------|--------|---------|
| Shift+S | Focus search | Yes |
| Shift+C | Focus customer | TODO |
| Shift+D | Save draft | Yes |
| Shift+F | Cash payment | Yes |
| Shift+E | Order discount | Yes |
| Shift+K | Coupon | Yes |
| Shift+Q | Shipping | Yes |
| Shift+X | Order tax | Partial |
| Shift+P | Print last receipt | TODO |
| Shift+R | Cash register | TODO |

## Web routes used by POS (sales)

```
GET  pos/{id?}                    — open POS / resume draft
POST sales                        — complete sale / draft
GET  sales/getproducts/...        — product grid
GET  sales/lims_product_search    — barcode search
GET  sales/recent-sale            — recent sales
GET  sales/recent-draft           — recent drafts
GET  sales/getcustomergroup/{id}  — customer group %
GET  sales/get_gift_card          — gift card balance
GET  sales/gen_invoice/{id}       — print
GET  sales/print-last-reciept     — last receipt
POST sales/set-price-type         — retail/wholesale session
GET  cash-register/*              — register open/close
```

Flutter uses `/pos/*` (see `pos-api/routes/pos-routes.php`) for download, scan, sync — not web session routes.
