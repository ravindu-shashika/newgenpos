export function round(n, d = 2) {
    const f = 10 ** d;
    return Math.round((Number(n) + Number.EPSILON) * f) / f;
}

/** Base unit price → display row price for the first sale unit (Blade unitConversion at add). */
export function rowPriceFromBase(basePrice, unitOperators = [], unitOperationValues = []) {
    const op = unitOperators[0];
    const val = parseFloat(unitOperationValues[0]) || 1;
    const base = parseFloat(basePrice) || 0;
    if (op === '*') return base * val;
    if (op === '/') return base / val;
    return base;
}

/** Alias kept for older imports. */
export const unitRowPrice = rowPriceFromBase;

/** Display row price → base unit price (inverse of rowPriceFromBase). */
export function basePriceFromRow(rowPrice, unitOperator, unitOpValue) {
    const row = parseFloat(rowPrice) || 0;
    const val = parseFloat(unitOpValue) || 1;
    if (unitOperator === '*') return row / val;
    if (unitOperator === '/') return row * val;
    return row;
}

/** Convert base unit price to row price for a target unit operator/value. */
export function unitConversion(basePrice, unitOperator, unitOpValue) {
    const base = parseFloat(basePrice) || 0;
    const val = parseFloat(unitOpValue) || 1;
    if (unitOperator === '*') return base * val;
    if (unitOperator === '/') return base / val;
    return base;
}

export function calcQuotationLine(line, decimal = 2) {
    const qty = parseFloat(line.qty) || 0;
    const rowPrice = parseFloat(line.row_product_price ?? line.product_price) || 0;
    const unitDiscount =
        line.unit_discount != null && line.unit_discount !== ''
            ? parseFloat(line.unit_discount) || 0
            : qty > 0
                ? (parseFloat(line.discount) || 0) / qty
                : 0;
    const taxRate = parseFloat(line.tax_rate) || 0;
    const taxMethod = Number(line.tax_method) || 1;

    let netUnitPrice;
    let tax;
    let subtotal;

    if (taxMethod === 2) {
        const subTotalUnit = rowPrice - unitDiscount;
        netUnitPrice = (100 / (100 + taxRate)) * subTotalUnit;
        tax = (subTotalUnit - netUnitPrice) * qty;
        subtotal = subTotalUnit * qty;
    } else {
        netUnitPrice = rowPrice - unitDiscount;
        tax = netUnitPrice * qty * (taxRate / 100);
        subtotal = netUnitPrice * qty + tax;
    }

    return {
        net_unit_price: round(netUnitPrice, decimal),
        tax: round(tax, decimal),
        subtotal: round(subtotal, decimal),
        unit_discount: unitDiscount,
        discount: round(unitDiscount * qty, decimal),
    };
}

export function calcQuotationTotals(lines, header, decimal = 2) {
    let totalQty = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalPrice = 0;

    const updated = (lines || []).map((line) => {
        const calc = calcQuotationLine(line, decimal);
        const qty = parseFloat(line.qty) || 0;
        totalQty += qty;
        totalDiscount += calc.discount;
        totalTax += calc.tax;
        totalPrice += calc.subtotal;
        return {
            ...line,
            unit_discount: calc.unit_discount,
            discount: calc.discount,
            net_unit_price: calc.net_unit_price,
            tax: calc.tax,
            subtotal: calc.subtotal,
        };
    });

    const orderTaxRate = parseFloat(header.order_tax_rate) || 0;
    const orderDiscount = parseFloat(header.order_discount) || 0;
    const shippingCost = parseFloat(header.shipping_cost) || 0;
    const orderTax = round((totalPrice * orderTaxRate) / 100, decimal);
    const grandTotal = round(totalPrice + orderTax + shippingCost - orderDiscount, decimal);

    const totalDiscountR = round(totalDiscount, decimal);
    const totalTaxR = round(totalTax, decimal);
    const totalPriceR = round(totalPrice, decimal);

    return {
        updated,
        item: updated.length,
        totalQty,
        totalDiscount: totalDiscountR,
        totalTax: totalTaxR,
        totalPrice: totalPriceR,
        orderTax,
        orderTaxRate,
        orderDiscount,
        shippingCost,
        grandTotal,
        // snake_case for QuotationCreateSale
        total_qty: totalQty,
        total_discount: totalDiscountR,
        total_tax: totalTaxR,
        total_price: totalPriceR,
        order_tax: orderTax,
        order_tax_rate: orderTaxRate,
        order_discount: orderDiscount,
        shipping_cost: shippingCost,
        grand_total: grandTotal,
    };
}

export function applyLineCalc(line, decimal = 2) {
    const calc = calcQuotationLine(line, decimal);
    return { ...line, ...calc };
}