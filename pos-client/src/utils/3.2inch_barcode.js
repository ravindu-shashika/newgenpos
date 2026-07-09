/**
 * Hardcoded 3.2" continuous roll — 2 professional labels per row.
 * Matches Koobiya-style stickers: business name, product name, barcode, code, price.
 */
import {
    BARCODE_PRICE_DISPLAY,
    DEFAULT_BARCODE_PRINT_OPTIONS,
} from './barcodeTemplateDefaults';
import { barcodeImageDataUrl, formatSkuDisplay } from './barcodeLabelPrinter';

/** Inch helper */
const IN = 25.4;

/**
 * Zebra ZD230 driver: 80 mm roll width, 24 mm row height, portrait 0°.
 * 2 × 1.5" labels per row with 0.1" gap between stickers.
 */
export const INCH_32_BARCODE_SPEC = {
    paperWidthMm: 80,
    cellWidthMm: 1.5 * IN,
    cellHeightMm: 25,
    colGapMm: 0.1 * IN,
    paperMarginLeftMm: 0,
    paperMarginRightMm: 0,
    paperMarginTopMm: 0,
    padTopMm: 2.5,
    padSideMm: 0,
    sheetShiftLeftMm: 2,
    stickersPerRow: 2,
    fonts: {
        businessPt: 10,
        namePt: 7,
        codePt: 7.5,
        pricePt: 11,
    },
    barcodeHeightMm: 9,
    barcodeWidthPct: 92,
    gapsMm: {
        afterBusiness: 0.12,
        afterName: 0.15,
        afterBarcode: 0.12,
    },
};

export const INCH_32_DEFAULT_PRINT_OPTIONS = {
    ...DEFAULT_BARCODE_PRINT_OPTIONS,
    layout: '3.2inch',
    business_name: true,
    name: true,
    brand_name: false,
    product_code: true,
    alt_code: false,
    price_display: BARCODE_PRICE_DISPLAY.maxPrice,
};

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

function resolvePriceDisplay(printOptions) {
    const mode = printOptions?.price_display;
    if (
        mode === BARCODE_PRICE_DISPLAY.off
        || mode === BARCODE_PRICE_DISPLAY.price
        || mode === BARCODE_PRICE_DISPLAY.maxPrice
    ) {
        return mode;
    }
    return BARCODE_PRICE_DISPLAY.price;
}

function resolveBarcodeCurrencySymbol(raw) {
    const value = String(raw ?? '').trim();
    if (!value) return 'Rs.';
    if (/^rs\.?$/i.test(value)) return 'Rs.';
    if (value.length <= 5 && !/^[A-Z]{3}$/.test(value)) {
        return value.endsWith('.') ? value : `${value}.`;
    }
    return 'Rs.';
}

function formatLabelPrice(label, printOptions) {
    const display = resolvePriceDisplay(printOptions);
    if (display === BARCODE_PRICE_DISPLAY.off) return '';

    const promo = label.product_promo_price;
    const hasPromo = display === BARCODE_PRICE_DISPLAY.price
        && printOptions.promo_price
        && promo != null
        && promo !== ''
        && promo !== 'null'
        && Number(promo) > 0;

    let amount;
    if (display === BARCODE_PRICE_DISPLAY.maxPrice) {
        const maxPrice = label.product_max_price;
        if (maxPrice == null || maxPrice === '' || Number(maxPrice) <= 0) return '';
        amount = maxPrice;
    } else {
        amount = hasPromo ? promo : label.product_price;
    }

    const priceNum = Number(amount);
    const priceText = Number.isFinite(priceNum) ? priceNum.toFixed(2) : String(amount ?? '');
    const currency = resolveBarcodeCurrencySymbol(label.currency);

    return `${escapeHtml(currency)} ${escapeHtml(priceText)}`;
}

function formatCodeLine(label) {
    const code = String(label.sub_sku ?? '').trim();
    const alt = String(label.alt_code ?? '').trim();
    if (code && alt) return formatSkuDisplay(code, alt);
    return code || alt;
}

function labelInnerHtml(label, printOptions, businessName, spec) {
    const s = spec ?? INCH_32_BARCODE_SPEC;
    const f = s.fonts;
    const g = s.gapsMm;
    const padTop = s.padTopMm + (s.paperMarginTopMm ?? 0);
    const parts = [];

    if (printOptions.business_name !== false && businessName) {
        parts.push(
            `<div class="kb32-biz" style="font-size:${f.businessPt}pt;margin-bottom:${g.afterBusiness}mm;">${escapeHtml(stripHtml(businessName).toUpperCase())}</div>`,
        );
    }

    if (printOptions.name !== false) {
        parts.push(
            `<div class="kb32-name" style="font-size:${f.namePt}pt;margin-bottom:${g.afterName}mm;">${escapeHtml(stripHtml(label.product_actual_name))}</div>`,
        );
    }

    const barcodeSrc = barcodeImageDataUrl(label.sub_sku, label.barcode_type);
    if (barcodeSrc) {
        parts.push(
            `<img class="kb32-barcode" src="${barcodeSrc}" alt="${escapeHtml(label.sub_sku)}" style="height:${s.barcodeHeightMm}mm;width:${s.barcodeWidthPct}%;margin-bottom:${g.afterBarcode}mm;" />`,
        );
    }

    const codeLine = formatCodeLine(label);
    if (printOptions.product_code !== false && codeLine) {
        parts.push(`<div class="kb32-code" style="font-size:${f.codePt}pt;">${escapeHtml(codeLine)}</div>`);
    }

    const priceHtml = formatLabelPrice(label, printOptions);
    if (priceHtml) {
        parts.push(`<div class="kb32-price" style="font-size:${f.pricePt}pt;">${priceHtml}</div>`);
    }

    return `<div class="kb32-label" style="padding:${padTop}mm ${s.padSideMm}mm;">${parts.join('')}</div>`;
}

function buildSheetHtml(cellsHtml) {
    return `<div class="kb32-sheet"><table class="kb32-table" cellspacing="0" cellpadding="0"><tr class="kb32-row">${cellsHtml}</tr></table></div>`;
}

function buildSheets(labels, printOptions, businessName, spec) {
    const perRow = spec.stickersPerRow;
    const sheets = [];
    for (let i = 0; i < labels.length; i += perRow) {
        const chunk = labels.slice(i, i + perRow);
        const cells = chunk.map(
            (label) => `<td class="kb32-cell">${labelInnerHtml(label, printOptions, businessName, spec)}</td>`,
        );
        while (cells.length < perRow) {
            cells.push('<td class="kb32-cell"></td>');
        }
        sheets.push(buildSheetHtml(cells.join('')));
    }
    return sheets.join('');
}

/** Build full print HTML for 3.2" roll. */
export function build32InchBarcodeHtml({
    labels,
    businessName = '',
    printOptions = INCH_32_DEFAULT_PRINT_OPTIONS,
    spec = INCH_32_BARCODE_SPEC,
}) {
    const mergedOptions = { ...INCH_32_DEFAULT_PRINT_OPTIONS, ...printOptions };
    const sheetsHtml = buildSheets(labels, mergedOptions, businessName, spec);
    const rowCount = Math.ceil(labels.length / spec.stickersPerRow);
    const bodyClass = rowCount === 1 ? 'kb32-single' : 'kb32-multi';
    const pageW = spec.paperWidthMm;
    const pageH = spec.cellHeightMm;
    const shiftLeft = spec.sheetShiftLeftMm ?? 0;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Print Barcodes — 3.2"</title>
<style>
@page {
    size: ${pageW}mm ${pageH}mm;
    margin: 0;
}
html, body {
    margin: 0;
    padding: 0;
    width: ${pageW}mm;
    line-height: 0;
    font-size: 0;
}
.kb32-sheet {
    width: ${pageW}mm;
    height: ${pageH}mm;
    max-height: ${pageH}mm;
    overflow: hidden;
    margin: 0;
    padding: 0;
}
.kb32-table {
    border-collapse: separate;
    border-spacing: ${spec.colGapMm}mm 0;
    margin: 0 0 0 ${-shiftLeft}mm;
    table-layout: fixed;
    width: calc(${spec.cellWidthMm}mm * 2 + ${spec.colGapMm}mm);
    height: ${pageH}mm;
    border: 0;
}
.kb32-row {
    height: ${pageH}mm;
    max-height: ${pageH}mm;
}
.kb32-cell {
    width: ${spec.cellWidthMm}mm;
    height: ${pageH}mm;
    max-height: ${pageH}mm;
    padding: 0;
    margin: 0;
    vertical-align: top;
    overflow: hidden;
}
.kb32-label {
    width: 100%;
    height: ${pageH}mm;
    max-height: ${pageH}mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
    font-family: "Times New Roman", Times, serif;
    color: #000;
    overflow: hidden;
    line-height: 1.05;
    font-size: 10pt;
}
.kb32-biz {
    font-weight: bold;
    line-height: 1.05;
    width: 100%;
    word-break: break-word;
}
.kb32-name {
    font-weight: bold;
    line-height: 1.05;
    width: 100%;
    max-height: 4mm;
    overflow: hidden;
    word-break: break-word;
}
.kb32-barcode {
    display: block;
    object-fit: contain;
    flex-shrink: 0;
}
.kb32-code {
    font-weight: bold;
    line-height: 1;
    width: 100%;
    letter-spacing: 0.02em;
}
.kb32-price {
    font-weight: bold;
    line-height: 1.1;
    width: 100%;
}
@media print {
    html, body {
        overflow: hidden;
    }
    body.kb32-single {
        height: ${pageH}mm;
        max-height: ${pageH}mm;
    }
    .kb32-sheet {
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: avoid;
        break-after: avoid-page;
    }
    .kb32-sheet + .kb32-sheet {
        page-break-before: always;
        break-before: page;
    }
}
@media screen {
    .kb32-sheet { margin-bottom: 8px; }
    .kb32-cell { outline: 1px dashed #ccc; }
}
</style>
<script>
window.addEventListener('load', function () {
    function startPrint() {
        window.focus();
        window.print();
    }
    var imgs = document.images;
    if (!imgs.length) {
        startPrint();
        return;
    }
    var pending = imgs.length;
    function done() {
        pending -= 1;
        if (pending <= 0) startPrint();
    }
    for (var i = 0; i < imgs.length; i += 1) {
        if (imgs[i].complete) done();
        else {
            imgs[i].addEventListener('load', done);
            imgs[i].addEventListener('error', done);
        }
    }
});
</script>
</head>
<body class="${bodyClass}">${sheetsHtml}</body>
</html>`;
}

/** Write 3.2" layout into an open print window. */
export function render32InchLabelPrintWindow(
    printWindow,
    { labels, printOptions, businessName, spec },
) {
    if (!printWindow || printWindow.closed) {
        throw new Error('Print preview window was closed');
    }
    if (!labels?.length) {
        throw new Error('No labels to print');
    }

    const html = build32InchBarcodeHtml({
        labels,
        businessName,
        printOptions,
        spec,
    });

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}
