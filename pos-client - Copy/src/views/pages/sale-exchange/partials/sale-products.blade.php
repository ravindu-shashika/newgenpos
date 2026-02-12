@foreach ($lims_product_sale_data as $key => $product_sale)
@php
    $product = DB::table('products')->find($product_sale->product_id);
    if(!$product) continue;

    $qty = $product_sale->qty - $product_sale->return_qty;

    $tax = DB::table('taxes')->where('rate', $product_sale->tax_rate)->first();
    $unit = DB::table('units')->find($product_sale->sale_unit_id);
@endphp

<tr>
    {{-- Product name --}}
    <td class="product-title">
        <strong>{{ $product->name }}</strong><br>
        <span>{{ $product->code }}</span>

        {{-- hidden --}}
        <input type="hidden" class="product-code" name="product_code[]" value="{{ $product->code }}">
        <input type="hidden" class="product-id" name="product_id[]" value="{{ $product->id }}">
        <input type="hidden" name="product_sale_id[]" value="{{ $product_sale->id }}">
    </td>

    {{-- Quantity --}}
    <td>
        <input type="number"
            name="qty[]"
            class="form-control qty"
            value="{{ $qty }}"
            max="{{ $qty }}"
            onchange="checkQuantity(this.value, true, '.return-order-list')">
    </td>

    {{-- Net unit price --}}
    <td class="product-price">
        {{ number_format($product_sale->net_unit_price, $general_setting->decimal) }}
    </td>

    {{-- Discount --}}
    <td class="discount">
        {{ number_format($product_sale->discount, $general_setting->decimal) }}
    </td>

    {{-- Tax --}}
    <td class="tax">
        {{ number_format($product_sale->tax, $general_setting->decimal) }}
    </td>

    {{-- Subtotal --}}
    <td class="sub-total">
        {{ number_format($product_sale->total, $general_setting->decimal) }}
    </td>

    {{-- IS EXCHANGE --}}
    <td class="is-exchange text-center">
        <input type="checkbox"
            name="is_exchange[]"
            class="exchange-checkbox"
            value="{{ $product->code }}"
            onchange="calculateExchangeValue()"
            style="width:18px;height:18px;cursor:pointer">
    </td>

    {{-- ===== REQUIRED HIDDEN FIELDS FOR JS ===== --}}
    <input type="hidden" name="type[]" value="return">

    <input type="hidden" class="sale-unit"
        name="sale_unit[]" value="{{ $unit->unit_name ?? 'n/a' }}">

    <input type="hidden" class="net_unit_price"
        name="net_unit_price[]" value="{{ $product_sale->net_unit_price }}">

    <input type="hidden" class="discount-value"
        name="discount[]" value="{{ $product_sale->discount }}">

    <input type="hidden" class="tax-rate"
        name="tax_rate[]" value="{{ $product_sale->tax_rate }}">

    <input type="hidden" class="tax-name"
        value="{{ $tax->name ?? 'No Tax' }}">

    <input type="hidden" class="tax-method"
        value="{{ $product->tax_method ?? 1 }}">

    <input type="hidden" class="tax-value"
        name="tax[]" value="{{ $product_sale->tax }}">

    <input type="hidden" class="subtotal-value"
        name="subtotal[]" value="{{ $product_sale->total }}">

    <input type="hidden" class="imei-number"
        name="imei_number[]" value="{{ $product_sale->imei_number ?? '' }}">
</tr>
@endforeach
