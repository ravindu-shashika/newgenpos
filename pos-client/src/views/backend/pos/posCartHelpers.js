import { calcQuotationLine, rowPriceFromBase, round } from '../quotation/quotationCalc';

let lineId = 1;

export function resetLineIdCounter() {
    lineId = 1;
}

export function recalcPosLine(line, decimal) {
    const calc = calcQuotationLine(line, decimal);
    return {
        ...line,
        discount: round((parseFloat(line.unit_discount) || 0) * (parseFloat(line.qty) || 0), decimal),
        net_unit_price: calc.net_unit_price,
        tax: calc.tax,
        subtotal: calc.subtotal,
    };
}

export function buildLineFromLookup(data, customerGroupRate, decimal, preQty = 1) {
    const basePrice = parseFloat(data.price) || 0;
    const adjustedPrice = basePrice + basePrice * customerGroupRate;
    const unitNames = data.unit_names || [];
    const unitOperators = data.unit_operators || [];
    const unitOpValues = data.unit_operation_values || [];
    const rowProductPrice =
        data.type === 'standard'
            ? rowPriceFromBase(adjustedPrice, unitOperators, unitOpValues)
            : adjustedPrice;

    return recalcPosLine(
        {
            _id: lineId++,
            product_id: data.product_id,
            variant_id: data.variant_id ?? data.product_variant_id ?? null,
            product_variant_id: data.product_variant_id ?? '',
            code: data.code,
            name: data.name,
            qty: preQty,
            product_batch_id: data.batch_id || '',
            batch_no: data.batch_no || '',
            unit_discount: 0,
            tax_rate: data.tax_rate ?? 0,
            tax_name: data.tax_name ?? 'No Tax',
            tax_method: data.tax_method ?? 1,
            product_price: adjustedPrice,
            row_product_price: rowProductPrice,
            sale_unit: unitNames[0] || 'n/a',
            unit_names: unitNames,
            unit_operators: unitOperators,
            unit_operation_values: unitOpValues,
            is_batch: Boolean(data.is_batch),
            is_imei: Boolean(data.is_imei),
            imei_number: data.imei_number ?? '',
            type: data.type ?? 'standard',
            warehouse_qty: data.warehouse_qty ?? 0,
        },
        decimal
    );
}

export function mergeOrAppendLine(lines, newLine, customerGroupRate, decimal) {
    const idx = lines.findIndex(
        (l) => l.code === newLine.code && String(l.product_batch_id || '') === String(newLine.product_batch_id || '')
    );
    if (idx >= 0) {
        return lines.map((l, i) =>
            i === idx
                ? recalcPosLine(
                    {
                        ...l,
                        qty: (parseFloat(l.qty) || 0) + (parseFloat(newLine.qty) || 1),
                        product_price: newLine.product_price,
                        row_product_price: newLine.row_product_price,
                    },
                    decimal
                )
                : l
        );
    }
    return [newLine, ...lines];
}

/** Totals aligned with legacy pos.blade.php calculateGrandTotal(). */
export function calcPosTotals(lines, header, decimal) {
    const recalculated = lines.map((l) => recalcPosLine(l, decimal));

    let totalQty = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalPrice = 0;

    recalculated.forEach((line) => {
        totalQty += parseFloat(line.qty) || 0;
        totalDiscount += parseFloat(line.discount) || 0;
        totalTax += parseFloat(line.tax) || 0;
        totalPrice += parseFloat(line.subtotal) || 0;
    });

    const orderDiscountValue =
        parseFloat(header.order_discount_value ?? header.order_discount) || 0;
    const orderDiscountType = header.order_discount_type || 'Flat';
    const orderDiscount =
        orderDiscountType === 'Percentage'
            ? round(totalPrice * (orderDiscountValue / 100), decimal)
            : round(orderDiscountValue, decimal);

    const orderTaxRate = parseFloat(header.order_tax_rate) || 0;
    const shippingCost = parseFloat(header.shipping_cost) || 0;
    const orderTax = round((totalPrice - orderDiscount) * (orderTaxRate / 100), decimal);
    const couponDiscount = parseFloat(header.coupon_discount) || 0;
    const grandTotal = round(
        totalPrice + orderTax + shippingCost - orderDiscount - couponDiscount,
        decimal
    );

    const totalDiscountR = round(totalDiscount, decimal);
    const totalTaxR = round(totalTax, decimal);
    const totalPriceR = round(totalPrice, decimal);

    return {
        updated: recalculated,
        item: recalculated.length,
        totalQty,
        totalDiscount: totalDiscountR,
        totalTax: totalTaxR,
        totalPrice: totalPriceR,
        orderTax,
        orderTaxRate,
        orderDiscount,
        orderDiscountValue,
        orderDiscountType,
        shippingCost,
        couponDiscount,
        grandTotal,
        total_qty: totalQty,
        total_discount: totalDiscountR,
        total_tax: totalTaxR,
        total_price: totalPriceR,
        order_tax: orderTax,
        order_tax_rate: orderTaxRate,
        order_discount: orderDiscount,
        shipping_cost: shippingCost,
        coupon_discount: couponDiscount,
        grand_total: grandTotal,
    };
}

export function buildLineFromDraft(data, decimal) {
    return recalcPosLine(
        {
            _id: lineId++,
            product_id: data.product_id,
            variant_id: data.variant_id ?? null,
            product_variant_id: data.product_variant_id ?? data.variant_id ?? '',
            code: data.code,
            name: data.name,
            qty: parseFloat(data.qty) || 1,
            product_batch_id: data.product_batch_id || '',
            batch_no: '',
            unit_discount: parseFloat(data.unit_discount) || 0,
            tax_rate: data.tax_rate ?? 0,
            tax_name: data.tax_name ?? 'No Tax',
            tax_method: data.tax_method ?? 1,
            product_price: parseFloat(data.product_price) || parseFloat(data.net_unit_price) || 0,
            row_product_price: parseFloat(data.net_unit_price) || 0,
            sale_unit: data.sale_unit || 'n/a',
            unit_names: ['n/a'],
            unit_operators: ['n/a'],
            unit_operation_values: [1],
            is_batch: Boolean(data.product_batch_id),
            is_imei: false,
            imei_number: '',
            type: 'standard',
            warehouse_qty: 0,
        },
        decimal
    );
}

export function buildPosFormData({
    header,
    totals,
    paidById,
    paidAmount,
    draftSaleId,
    accountId,
    isDraft = false,
}) {
    const fd = new FormData();
    fd.append('pos', '1');
    fd.append('draft', draftSaleId ? '1' : '0');
    if (draftSaleId) fd.append('sale_id', String(draftSaleId));

    fd.append('created_at', header.created_at || new Date().toISOString().slice(0, 10));
    fd.append('customer_id', header.customer_id);
    fd.append('warehouse_id', header.warehouse_id);
    fd.append('biller_id', header.biller_id);
    fd.append('currency_id', header.currency_id);
    fd.append('exchange_rate', header.exchange_rate);
    fd.append('sale_status', isDraft ? '3' : '1');
    fd.append('payment_status', isDraft ? '1' : '4');
    fd.append('order_tax_rate', totals.order_tax_rate);
    fd.append('order_tax', totals.order_tax);
    fd.append('order_discount', totals.order_discount);
    fd.append('order_discount_type', header.order_discount_type || 'Flat');
    fd.append('order_discount_value', header.order_discount_value ?? totals.order_discount);
    fd.append('shipping_cost', totals.shipping_cost);
    if (header.coupon_id) {
        fd.append('coupon_active', '1');
        fd.append('coupon_id', String(header.coupon_id));
        fd.append('coupon_discount', totals.coupon_discount ?? header.coupon_discount ?? 0);
    }
    fd.append('total_qty', totals.total_qty);
    fd.append('total_discount', totals.total_discount);
    fd.append('total_tax', totals.total_tax);
    fd.append('total_price', totals.total_price);
    fd.append('item', totals.item);
    fd.append('grand_total', totals.grand_total);
    fd.append('sale_note', header.sale_note || '');
    fd.append('staff_note', header.staff_note || '');

    if (!isDraft) {
        const pay = paidAmount ?? totals.grand_total;
        fd.append('paid_by_id[]', String(paidById));
        fd.append('paying_amount[]', String(pay));
        fd.append('paid_amount[]', String(pay));
        if (accountId) fd.append('account_id[]', String(accountId));
    }

    totals.updated.forEach((l) => {
        fd.append('product_id[]', l.product_id);
        fd.append('product_code[]', l.code);
        fd.append('product_batch_id[]', l.product_batch_id || '');
        if (l.product_variant_id) fd.append('product_variant_id[]', l.product_variant_id);
        fd.append('qty[]', l.qty);
        fd.append('sale_unit[]', l.sale_unit || 'n/a');
        fd.append('net_unit_price[]', l.net_unit_price);
        fd.append('discount[]', l.discount);
        fd.append('tax_rate[]', l.tax_rate);
        fd.append('tax[]', l.tax);
        fd.append('subtotal[]', l.subtotal);
        fd.append('product_price[]', l.product_price);
        if (l.imei_number) fd.append('imei_number[]', l.imei_number);
    });

    return fd;
}

export { round };
