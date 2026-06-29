export function round(value, decimals = 2) {
    const n = parseFloat(value) || 0;
    const f = 10 ** decimals;
    return Math.round(n * f) / f;
}

export function csvToArray(csv) {
    if (!csv || csv === 'n/a,') return [];
    return String(csv)
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v && v !== 'n/a');
}

export function rowCostFromBase(baseCost, unitOperators, unitOpValues, unitIndex = 0) {
    const op = unitOperators[unitIndex] ?? '*';
    const val = parseFloat(unitOpValues[unitIndex]) || 1;
    const base = parseFloat(baseCost) || 0;
    return op === '*' ? base * val : base / val;
}

export function calcTransferLine(line) {
    const qty = parseFloat(line.qty) || 0;
    const taxRate = parseFloat(line.tax_rate) || 0;
    const taxMethod = parseInt(line.tax_method, 10) || 1;
    const unitCost = parseFloat(line.row_unit_cost ?? line.product_cost) || 0;

    if (taxMethod === 1) {
        const netUnitCost = unitCost;
        const tax = netUnitCost * qty * (taxRate / 100);
        const subtotal = netUnitCost * qty + tax;
        return { net_unit_cost: netUnitCost, tax, subtotal };
    }

    const subTotalUnit = unitCost;
    const netUnitCost = (100 / (100 + taxRate)) * subTotalUnit;
    const tax = (subTotalUnit - netUnitCost) * qty;
    const subtotal = subTotalUnit * qty;
    return { net_unit_cost: netUnitCost, tax, subtotal };
}

export function calcTransferTotals(lines, header, decimal = 2) {
    let totalQty = 0;
    let totalTax = 0;
    let totalCost = 0;

    const updated = lines.map((line) => {
        const calc = calcTransferLine(line);
        const qty = parseFloat(line.qty) || 0;
        totalQty += qty;
        totalTax += calc.tax;
        totalCost += calc.subtotal;
        return {
            ...line,
            net_unit_cost: round(calc.net_unit_cost, decimal),
            tax: round(calc.tax, decimal),
            subtotal: round(calc.subtotal, decimal),
        };
    });

    const shipping = parseFloat(header.shipping_cost) || 0;
    const grandTotal = totalCost + shipping;
    const itemCount = updated.length;

    return {
        updated,
        totalQty: round(totalQty, decimal),
        totalTax: round(totalTax, decimal),
        totalCost: round(totalCost, decimal),
        shippingCost: round(shipping, decimal),
        grandTotal: round(grandTotal, decimal),
        item: itemCount,
        itemLabel: `${itemCount}(${round(totalQty, decimal)})`,
    };
}
