# Product Form: Blade vs Vue Alignment Analysis

## Summary
This document compares the Blade product form with the Vue implementation and documents how the Vue page uses the same backend functions.

---

## Blade Form Structure

### Product Types & Conditional Logic
| Type      | Combo Section | Digital File | Unit Section | Cost/Price | Variants | Initial Stock | Batch/IMEI |
|-----------|---------------|--------------|--------------|------------|----------|---------------|------------|
| standard  | hidden        | hidden       | visible      | visible    | visible  | visible       | visible    |
| combo     | visible       | hidden       | visible      | visible    | hidden   | hidden        | hidden     |
| digital   | hidden        | visible      | hidden       | -          | hidden   | visible       | hidden     |
| service   | hidden        | -            | hidden       | -          | hidden   | visible       | hidden     |

### Form Fields (Blade)
- **Basic:** type, name, code, alt_code, barcode_symbology
- **Combo:** product search (lims_productcodeSearch), combo products table
- **Units:** unit_id, sale_unit_id, purchase_unit_id (populated via saleunit/{id})
- **Pricing:** cost, profit_margin_type, profit_margin, price, wholesale_price
- **Other:** daily_sale_objective, alert_quantity, tax_id, tax_method
- **Warranty/Guarantee:** warranty, warranty_type, guarantee, guarantee_type
- **Options:** featured, is_embeded, is_initial_stock, is_variant, is_diffPrice, is_batch, is_imei, promotion
- **Images:** Dropzone (paramName: image)
- **Promotion:** promotion_price, starting_date, last_date
- **Modules:** is_online (ecommerce), is_addon (restaurant), in_stock (ecommerce)

---

## Backend API (save-product)

### Data Handling (matches Blade store/update)
1. **Validation:** code (unique), name, type, category_id
2. **Warranty/Guarantee:** unset if empty
3. **Variants:** json_encode variant_option, variant_value when is_variant
4. **Name:** preg_replace newlines to &lt;br&gt;
5. **Slug:** for ecommerce addon
6. **Combo:** product_list, variant_list, qty_list, price_list when type=combo
7. **Digital/Service:** cost, unit_id = 0 when type=digital|service
8. **Product details:** str_replace " to @
9. **Dates:** starting_date, last_date to Y-m-d
10. **Images:** $request->file('images') - multiple upload, diffSizeImageStore
11. **Initial stock:** autoPurchase per warehouse when is_initial_stock
12. **Variants:** ProductVariant create, Variant::firstOrCreate
13. **Warehouse pricing:** UPDATE in place (preserves stock) - matches Blade updateProduct

### Key Fix Applied
- **Warehouse pricing:** No longer deletes ProductWarehouse records on update. Updates price in place to preserve stock (qty). When is_diffPrice unchecked, clears price column only.

---

## Vue Form ↔ Backend Mapping

| Vue Field              | Backend Expects        | Status |
|------------------------|------------------------|--------|
| product.name           | name                   | ✓      |
| product.code           | code                   | ✓      |
| product.alt_code       | alt_code               | ✓ Added |
| product.type           | type                   | ✓      |
| product.category_id    | category_id            | ✓      |
| product.unit_id        | unit_id                | ✓      |
| product.sale_unit_id   | sale_unit_id           | ✓      |
| product.purchase_unit_id | purchase_unit_id     | ✓      |
| product.cost           | cost                   | ✓      |
| product.price          | price                  | ✓      |
| product.profit_margin  | profit_margin          | ✓      |
| product.profit_margin_type | profit_margin_type | ✓      |
| warehouses[].qty       | stock[]                | ✓      |
| warehouses[].id        | stock_warehouse_id[]   | ✓      |
| warehouses[].diff_price| diff_price[]           | ✓      |
| warehouses[].id        | warehouse_id[]         | ✓      |
| variantCombinations    | variant_name[], item_code[], etc. | ✓ |
| selectedImages         | images[]               | ✓      |

---

## API Endpoints Used by Vue

| Endpoint               | Purpose                           |
|------------------------|-----------------------------------|
| GET /products/form-data| Categories, brands, units, taxes, warehouses |
| POST /save-product     | Create/update product             |
| GET /product/{id}      | Load product for edit             |
| GET /delete-product/{id}| Soft delete product              |

---

## Features Not Yet in Vue (from Blade)

1. **Combo products** - Product search + table with wastage%, qty, unit cost, unit price, subtotal. Requires lims_product_search API.
2. **Digital file upload** - Single file for digital products.
3. **Custom fields** - Dynamic fields from CustomField model.
4. **Ecommerce/Restaurant modules** - Product tags, SEO, related products, extras, kitchen, menu type.
5. **Sale unit population** - Blade uses saleunit/{unit_id} to populate sale/purchase units. Vue uses units API and filters by base_unit.

---

## Files Modified

- `pos-api/app/Http/Controllers/ProductController.php` - saveProduct warehouse logic, alt_code
- `pos-api/app/Models/Product.php` - alt_code in fillable
- `pos-api/app/Models/ProductWarehouse.php` - Created (extends ProductWarehouse, adds FindProductWithoutVariant scope)
- `pos-client/src/views/pages/product-add.vue` - alt_code field
