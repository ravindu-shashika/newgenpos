<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<style>
body {
    margin: 0;
    padding: 0;
}

@media print {

    @page {
        size: {{ $barcode_details->width }}in {{ $barcode_details->height }}in;
        margin: 0;
    }

    body {
        margin: 0;
    }

    .single-label {
        width: {{ $barcode_details->width }}in;
        height: {{ $barcode_details->height }}in;
        box-sizing: border-box;
        overflow: hidden;
        page-break-after: always;
        padding: 1mm;
        break-after: page;
        text-align: center;
    }

    .label-inner {
        width: 95%;
        text-align: center;
    }

    img.barcode-img {
        width: auto;
        height: {{ $barcode_details->height * 0.40 }}in;
    }
}
</style>
</head>

<body onload="window.print()">

@foreach($labels as $label)

<div class="single-label">
    <div class="label-inner">

        {{-- Business Name --}}
        @if(!empty($print['business_name']))
            <div style="font-size: {{ $print['business_name_size'] ?? 12 }}px; font-weight: bold;">
                {{ $business_name }}
            </div>
        @endif

        {{-- Product Name --}}
        @if(!empty($print['name']))
            <div style="font-size: {{ $print['name_size'] ?? 11 }}px;">
                {{ $label['product_actual_name'] }}
            </div>
        @endif

        {{-- Brand --}}
        @if(!empty($print['brand_name']))
            <div style="font-size: {{ $print['brand_name_size'] ?? 10 }}px;">
                {{ $label['brand_name'] }}
            </div>
        @endif

        {{-- Price --}}
        @if(!empty($print['price']))
            <div style="font-size: {{ $print['price_size'] ?? 11 }}px; margin: 2px 0;">
                @if($label['currency_position'] == 'prefix')
                    {{ $label['currency'] }} {{ $label['product_price'] }}
                @else
                    {{ $label['product_price'] }} {{ $label['currency'] }}
                @endif
            </div>
        @endif

        {{-- Barcode --}}
        <div style="margin-top: 3px;">
            <img class="barcode-img"
                 src="data:image/png;base64,
                 {{ DNS1D::getBarcodePNG($label['sub_sku'], $label['barcode_type'], 2, 60) }}">
        </div>

        <div style="font-size: 8px;">
            {{ $label['sub_sku'] }}
        </div>

    </div>
</div>

@endforeach

</body>
</html>