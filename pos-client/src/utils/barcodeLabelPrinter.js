import JsBarcode from 'jsbarcode';

const MM_PER_IN = 25.4;

/** Map Laravel / product symbology codes to jsbarcode format names. */
export function toJsBarcodeFormat(symbology) {
    const key = String(symbology || 'C128').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const map = {
        C128: 'CODE128',
        CODE128: 'CODE128',
        C39: 'CODE39',
        CODE39: 'CODE39',
        UPCA: 'UPC',
        UPCE: 'UPCE',
        EAN8: 'EAN8',
        EAN13: 'EAN13',
        EAN: 'EAN13',
    };
    return map[key] || 'CODE128';
}

/** Render scannable barcode as a PNG data URL (matches legacy DNS1D scale 1, height 30). */
export function barcodeImageDataUrl(code, symbology = 'C128') {
    const value = String(code ?? '').trim();
    if (!value) return '';

    const canvas = document.createElement('canvas');
    try {
        JsBarcode(canvas, value, {
            format: toJsBarcodeFormat(symbology),
            width: 1,
            height: 30,
            displayValue: false,
            margin: 0,
        });
        return canvas.toDataURL('image/png');
    } catch (err) {
        console.error('Barcode render failed:', err);
        return '';
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function stripHtml(value) {
    return String(value ?? '').replace(/<[^>]*>/g, '').trim();
}

function toMm(inches, fallbackMm) {
    const n = Number(inches);
    if (!Number.isFinite(n) || n <= 0) return fallbackMm;
    return n * MM_PER_IN;
}

/** Legacy SKU line: first segment of code + alt_code when present. */
export function formatSkuDisplay(subSku, altCode) {
    const sku = String(subSku ?? '').trim();
    const alt = String(altCode ?? '').trim();
    if (!sku) return '';
    if (!alt) return sku;
    const first = sku.split('-')[0] || sku;
    return `${first}-${alt}`;
}

function formatPriceHtml(label, printOptions) {
    if (!printOptions.price) return '';

    const promo = label.product_promo_price;
    const hasPromo = printOptions.promo_price
        && promo != null
        && promo !== ''
        && promo !== 'null'
        && Number(promo) > 0;
    const price = hasPromo ? promo : label.product_price;
    const currency = String(label.currency ?? '').trim();
    const position = label.currency_position === 'suffix' ? 'suffix' : 'prefix';
    const priceText = `${price}/=`;

    if (position === 'suffix') {
        return `<span class="label-price" style="font-size:${printOptions.price_size || 12}px;font-weight:bold;">
            ${escapeHtml(priceText)}${currency ? ` <span style="font-size:12px">${escapeHtml(currency)}</span>` : ''}
        </span>`;
    }

    return `<span class="label-price" style="font-size:${printOptions.price_size || 12}px;font-weight:bold;">
        ${currency ? `<span style="font-size:12px">${escapeHtml(currency)}</span> ` : ''}${escapeHtml(priceText)}
    </span>`;
}

function labelInnerHtml(label, printOptions, businessName) {
    const barcodeSrc = barcodeImageDataUrl(label.sub_sku, label.barcode_type);
    const skuText = formatSkuDisplay(label.sub_sku, label.alt_code);
    const parts = [];

    if (printOptions.business_name && businessName) {
        parts.push(`<b class="biz" style="font-size:${printOptions.business_name_size || 13}px;">${escapeHtml(stripHtml(businessName))}</b>`);
    }
    if (printOptions.name) {
        parts.push(`<span class="name" style="font-size:${printOptions.name_size || 12}px;">${escapeHtml(stripHtml(label.product_actual_name))}</span>`);
    }
    if (printOptions.brand_name && label.brand_name) {
        parts.push(`<span class="name" style="font-size:${printOptions.brand_name_size || 12}px;">${escapeHtml(stripHtml(label.brand_name))}</span>`);
    }
    if (barcodeSrc) {
        parts.push(`<img class="barcode" src="${barcodeSrc}" alt="${escapeHtml(label.sub_sku)}" />`);
    }
    parts.push(`<span class="sku">${escapeHtml(skuText)}</span>`);
    parts.push(formatPriceHtml(label, printOptions));

    return `<div class="zebra-label">${parts.filter(Boolean).join('')}</div>`;
}

const ZEBRA_PRINT_CSS = `
body {
    margin: auto !important;
    margin-top: 2px !important;
}
.zebra-table {
    border-collapse: separate;
    border-spacing: var(--zebra-col-gap) 0;
    margin: 0 auto;
}
.zebra-cell {
    width: var(--zebra-cell-w);
    height: var(--zebra-cell-h);
    padding: 0;
    vertical-align: middle;
}
.zebra-label {
    width: var(--zebra-cell-w);
    height: var(--zebra-cell-h);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-align: center;
    font-family: "Times New Roman", Times, serif;
}
.biz {
    font-weight: bold;
    line-height: 1;
}
.name {
    font-weight: bold;
    line-height: 1.1;
}
.barcode {
    width: 90%;
    height: 9mm;
    object-fit: contain;
}
.sku {
    font-size: 12px;
    font-weight: bold;
    line-height: 1;
}
.label-price {
    line-height: 1.1;
}
@media print {
    table, tr, td {
        page-break-inside: avoid;
    }
    @page {
        size: var(--zebra-paper-w) auto;
        margin: 0;
    }
}
@media screen {
    .zebra-cell {
        outline: 1px dashed #ccc;
    }
}
`;

function buildZebraRows(labels, printOptions, businessName, perRow) {
    const rows = [];
    for (let i = 0; i < labels.length; i += perRow) {
        const chunk = labels.slice(i, i + perRow);
        const cells = chunk.map(
            (label) => `<td class="zebra-cell">${labelInnerHtml(label, printOptions, businessName)}</td>`
        );
        while (cells.length < perRow) {
            cells.push('<td class="zebra-cell"></td>');
        }
        rows.push(`<tr>${cells.join('')}</tr>`);
    }
    return rows.join('');
}

function buildZebraTableHtml(labels, barcodeDetails, printOptions, businessName) {
    const cellWidthMm = Math.round(toMm(barcodeDetails.width, 38) * 10) / 10;
    const cellHeightMm = Math.round(toMm(barcodeDetails.height, 25) * 10) / 10;
    const paperWidthMm = Math.round(toMm(barcodeDetails.paper_width, 80) * 10) / 10;
    const colGapMm = Math.round(toMm(barcodeDetails.col_distance, 2 / MM_PER_IN) * 10) / 10;
    const perRow = Math.max(1, parseInt(barcodeDetails.stickers_in_one_row, 10) || 2);

    const tableBody = buildZebraRows(labels, printOptions, businessName, perRow);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Print Barcodes</title>
<style>
:root {
    --zebra-cell-w: ${cellWidthMm}mm;
    --zebra-cell-h: ${cellHeightMm}mm;
    --zebra-paper-w: ${paperWidthMm}mm;
    --zebra-col-gap: ${colGapMm}mm;
}
${ZEBRA_PRINT_CSS}
</style>
</head>
<body onload="window.print()">
<table class="zebra-table">
${tableBody}
</table>
</body>
</html>`;
}

/** Expand selected products into one label object per sticker. */
export function expandProductsToLabels(products, printOptions) {
    const labels = [];

    products.forEach((product) => {
        const price = product.diff_price ? product.selected_price : product.price;
        const qty = Math.max(1, parseInt(product.quantity, 10) || 1);
        const details = {
            product_actual_name: product.name,
            product_name: product.name,
            product_price: price,
            default_price: product.default_price ?? product.price,
            product_promo_price: product.promo_price ?? '',
            currency: product.currency ?? '',
            currency_position: product.currency_position ?? '',
            product_id: product.id,
            brand_name: product.brand ?? '',
            sub_sku: product.code,
            alt_code: product.alt_code ?? '',
            barcode_type: product.barcode_symbology || 'C128',
        };

        for (let i = 0; i < qty; i += 1) {
            labels.push(details);
        }
    });

    return labels;
}

/** Open a blank print window — must be called synchronously from a click handler. */
export function createLabelPrintWindow() {
    const printWindow = window.open('about:blank', 'printBarcode');
    if (!printWindow) {
        return null;
    }

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Print Barcodes</title></head>
<body style="font-family:sans-serif;padding:24px;">Preparing labels…</body></html>`);
    printWindow.document.close();
    return printWindow;
}

/** Write label HTML into an already-open print window. */
export function renderLabelPrintWindow(printWindow, { labels, barcodeDetails, printOptions, businessName }) {
    if (!printWindow || printWindow.closed) {
        throw new Error('Print preview window was closed');
    }
    if (!labels?.length) {
        throw new Error('No labels to print');
    }
    if (!barcodeDetails) {
        throw new Error('Barcode paper settings are required');
    }

    const html = buildZebraTableHtml(labels, barcodeDetails, printOptions, businessName);

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}

/** Open a print preview window with labels rendered via jsbarcode. */
export function openLabelPrintWindow(options) {
    const printWindow = createLabelPrintWindow();
    if (!printWindow) {
        throw new Error('Please allow pop-ups to open the print preview');
    }
    renderLabelPrintWindow(printWindow, options);
}
