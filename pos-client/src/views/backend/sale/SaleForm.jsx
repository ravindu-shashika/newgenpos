import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PageLayout,
    FormField,
    FormRow,
    FormSection,
    SelectInput,
    TextInput,
    TextareaInput,
    FileInput,
    NumberInput,
    CheckboxInput,
    Modal,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';
import {
    calcQuotationLine,
    calcQuotationTotals,
    rowPriceFromBase,
    round,
} from '../quotation/quotationCalc';

let lineId = 1;

function hasSaleAddAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === 'sales-add' || p.startsWith('sales-')
    );
}

function buildTaxOptions(meta) {
    const opts = meta?.order_tax_options ?? meta?.taxes ?? [];
    const items = [{ value: '0', label: 'No Tax' }];
    const seen = new Set(['0']);
    if (opts.length && opts[0].rate !== undefined) {
        for (const t of opts) {
            const value = String(t.rate);
            if (seen.has(value)) continue;
            seen.add(value);
            items.push({ value, label: t.name });
        }
    }
    return items;
}

function defaultAccountId(meta) {
    if (meta?.default_account_id) return String(meta.default_account_id);
    const def = (meta?.accounts || []).find((a) => a.is_default);
    return def ? String(def.id) : (meta?.accounts?.[0]?.id ? String(meta.accounts[0].id) : '');
}

export default function SaleForm() {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions('sales');
    const authPerms = authStore.getPermissions();
    const canAdd = perms.canAdd || hasSaleAddAccess(authPerms);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);
    const [customerGroupRate, setCustomerGroupRate] = useState(0);
    const [warehouseProducts, setWarehouseProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [showHits, setShowHits] = useState(false);

    const [header, setHeader] = useState({
        created_at: new Date().toISOString().slice(0, 10),
        reference_no: '',
        customer_id: '',
        warehouse_id: '',
        biller_id: '',
        currency_id: '',
        exchange_rate: 1,
        order_tax_rate: '0',
        order_discount: 0,
        shipping_cost: 0,
        sale_status: '1',
        payment_status: '2',
        paid_by_id: '1',
        paying_amount: '',
        paid_amount: '',
        account_id: '',
        sale_note: '',
        staff_note: '',
    });
    const [lines, setLines] = useState([]);
    const [installmentOpen, setInstallmentOpen] = useState(false);
    const [installment, setInstallment] = useState({
        enabled: false,
        name: '12 Months',
        additional_amount: 0,
        down_payment: 0,
        months: 12,
    });

    const decimal = meta?.decimal ?? 2;

    const loadForm = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('sales/create');
            const data = res.data || {};
            setMeta(data);
            setHeader((h) => ({
                ...h,
                created_at: data.default_created_at || h.created_at,
                customer_id: data.default_customer_id ? String(data.default_customer_id) : (data.customers?.[0]?.id ? String(data.customers[0].id) : ''),
                warehouse_id: data.default_warehouse_id ? String(data.default_warehouse_id) : (data.warehouses?.[0]?.id ? String(data.warehouses[0].id) : ''),
                biller_id: data.default_biller_id ? String(data.default_biller_id) : (data.billers?.[0]?.id ? String(data.billers[0].id) : ''),
                currency_id: data.default_currency_id ? String(data.default_currency_id) : '',
                exchange_rate: data.default_exchange_rate || 1,
                account_id: defaultAccountId(data),
            }));
        } catch (err) {
            showToast(err?.message || 'Failed to load sale form.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (canAdd) loadForm();
        else setLoading(false);
    }, [canAdd, loadForm]);

    useEffect(() => {
        if (!header.customer_id) {
            setCustomerGroupRate(0);
            return;
        }
        api.get(`sales/customer-group/${header.customer_id}`)
            .then((res) => setCustomerGroupRate((parseFloat(res.data?.percentage) || 0) / 100))
            .catch(() => setCustomerGroupRate(0));
    }, [header.customer_id]);

    useEffect(() => {
        if (!header.warehouse_id) {
            setWarehouseProducts([]);
            return;
        }
        api.get(`sales/warehouse-products?warehouse_id=${header.warehouse_id}`)
            .then((res) => setWarehouseProducts(res.data?.options || []))
            .catch(() => setWarehouseProducts([]));
    }, [header.warehouse_id]);

    const totals = useMemo(
        () => calcQuotationTotals(lines, header, decimal),
        [lines, header, decimal]
    );

    const baseGrandTotal = totals.grandTotal;
    const installmentPrice = baseGrandTotal;
    const installmentTotal = round(
        installmentPrice + (parseFloat(installment.additional_amount) || 0),
        decimal
    );
    const displayGrandTotal = installment.enabled ? installmentTotal : baseGrandTotal;
    const hasLines = (totals.updated?.length ?? 0) > 0;
    const showInstallment = meta?.installment_enabled ?? true;

    useEffect(() => {
        if (!installment.enabled) return;
        const down = parseFloat(installment.down_payment) || 0;
        if (down > 0) {
            setHeader((h) => ({
                ...h,
                payment_status: '3',
                paying_amount: String(down),
                paid_amount: String(down),
            }));
        }
    }, [installment.enabled, installment.down_payment]);

    const resetInstallment = () => {
        setInstallment({
            enabled: false,
            name: '12 Months',
            additional_amount: 0,
            down_payment: 0,
            months: 12,
        });
    };

    const closeInstallmentModal = (reset = false) => {
        if (reset) resetInstallment();
        setInstallmentOpen(false);
    };

    const searchHits = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (term.length < 1) return [];
        return warehouseProducts.filter(
            (p) =>
                (p.code || '').toLowerCase().includes(term) ||
                (p.name || '').toLowerCase().includes(term) ||
                (p.label || '').toLowerCase().includes(term)
        ).slice(0, 20);
    }, [productSearch, warehouseProducts]);

    const recalcLine = (line) => {
        const calc = calcQuotationLine(line, decimal);
        return {
            ...line,
            discount: round((parseFloat(line.unit_discount) || 0) * (parseFloat(line.qty) || 0), decimal),
            net_unit_price: calc.net_unit_price,
            tax: calc.tax,
            subtotal: calc.subtotal,
        };
    };

    const appendLineFromSearch = (data, preQty = 0) => {
        const basePrice = parseFloat(data.price) || 0;
        const adjustedPrice = basePrice + basePrice * customerGroupRate;
        const unitNames = data.unit_names || [];
        const unitOperators = data.unit_operators || [];
        const unitOpValues = data.unit_operation_values || [];
        const rowProductPrice =
            data.type === 'standard'
                ? rowPriceFromBase(adjustedPrice, unitOperators, unitOpValues)
                : adjustedPrice;

        setLines((prev) => {
            const existingIdx = prev.findIndex((l) => l.code === data.code);
            const qty = preQty > 0 ? parseFloat(data.qty) || preQty + 1 : 1;

            if (existingIdx >= 0) {
                const existing = prev[existingIdx];
                return prev.map((l, i) =>
                    i === existingIdx
                        ? recalcLine({
                            ...existing,
                            qty,
                            product_price: adjustedPrice,
                            row_product_price: rowProductPrice,
                        })
                        : l
                );
            }

            return [
                recalcLine({
                    _id: lineId++,
                    product_id: data.product_id,
                    variant_id: data.variant_id ?? null,
                    product_variant_id: data.product_variant_id ?? '',
                    code: data.code,
                    name: data.name,
                    qty,
                    product_batch_id: '',
                    batch_no: '',
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
                }),
                ...prev,
            ];
        });
    };

    const fetchProduct = async (label) => {
        if (!header.customer_id) {
            showToast('Please select a customer.', 'error');
            return;
        }
        if (!header.warehouse_id) {
            showToast('Please select a warehouse.', 'error');
            return;
        }

        const parts = label.split('|');
        const code = parts[0] || '';
        const name = parts[1] || '';
        const imei = parts[2] || 'null';
        const embed = parts[3] || '0';

        const existing = lines.find((l) => l.code === code);
        const preQty = existing ? parseFloat(existing.qty) || 0 : 0;

        try {
            const q = new URLSearchParams({
                code,
                name,
                customer_id: header.customer_id,
                warehouse_id: header.warehouse_id,
                qty: String(preQty + 1),
                imei,
                embed,
            });
            const res = await api.get(`sales/product-search?${q}`);
            appendLineFromSearch(res.data || {}, preQty);
            setProductSearch('');
            setShowHits(false);
        } catch (err) {
            showToast(err?.message || 'Product not found.', 'error');
        }
    };

    const updateLineQty = (lineKey, rawQty) => {
        setLines((prev) =>
            prev.map((l) => {
                if (l._id !== lineKey) return l;
                let qty = rawQty === '' ? '' : parseFloat(rawQty);
                if (rawQty !== '' && (Number.isNaN(qty) || qty < 1)) {
                    showToast("Quantity can't be less than 1", 'error');
                    qty = 1;
                }
                return recalcLine({ ...l, qty: rawQty === '' ? rawQty : qty });
            })
        );
    };

    const removeLine = (lineKey) => setLines((prev) => prev.filter((l) => l._id !== lineKey));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!header.customer_id || !header.warehouse_id || !header.biller_id) {
            showToast('Customer, warehouse, and biller are required.', 'error');
            return;
        }
        if (!totals.updated?.length) {
            showToast('Add at least one product.', 'error');
            return;
        }

        const fd = new FormData();
        if (header.reference_no) fd.append('reference_no', header.reference_no);
        if (meta?.can_change_sale_date) fd.append('created_at', header.created_at);
        fd.append('customer_id', header.customer_id);
        fd.append('warehouse_id', header.warehouse_id);
        fd.append('biller_id', header.biller_id);
        fd.append('currency_id', header.currency_id);
        fd.append('exchange_rate', header.exchange_rate);
        fd.append('sale_status', header.sale_status);
        fd.append('payment_status', header.payment_status);
        fd.append('order_tax_rate', totals.order_tax_rate);
        fd.append('order_tax', totals.order_tax);
        fd.append('order_discount', totals.order_discount);
        fd.append('shipping_cost', totals.shipping_cost);
        fd.append('total_qty', totals.total_qty);
        fd.append('total_discount', totals.total_discount);
        fd.append('total_tax', totals.total_tax);
        fd.append('total_price', installment.enabled ? installmentTotal : totals.total_price);
        fd.append('item', totals.item);
        fd.append('grand_total', installment.enabled ? installmentTotal : totals.grand_total);
        fd.append('sale_note', header.sale_note || '');
        fd.append('staff_note', header.staff_note || '');
        if (documentFile) fd.append('document', documentFile);

        fd.append('enable_installment', installment.enabled ? '1' : '0');
        if (installment.enabled) {
            fd.append('installment_plan[name]', installment.name);
            fd.append('installment_plan[price]', String(installmentPrice));
            fd.append('installment_plan[additional_amount]', String(installment.additional_amount || 0));
            fd.append('installment_plan[total_amount]', String(installmentTotal));
            fd.append('installment_plan[down_payment]', String(installment.down_payment || 0));
            fd.append('installment_plan[months]', String(installment.months || 12));
            fd.append('installment_plan[reference_type]', 'sale');
        }

        const payAmt = parseFloat(header.paid_amount) || 0;
        fd.append('paid_by_id[]', header.paid_by_id);
        fd.append('paying_amount[]', header.paying_amount || payAmt);
        fd.append('paid_amount[]', payAmt);
        if (header.paid_by_id === '6' && header.account_id) {
            fd.append('account_id[]', header.account_id);
        }

        totals.updated.forEach((l) => {
            fd.append('product_id[]', l.product_id);
            fd.append('product_code[]', l.code);
            fd.append('product_batch_id[]', l.product_batch_id || '');
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

        setSubmitting(true);
        try {
            await api.post('sales', fd);
            showToast('Sale created.', 'success');
            navigate('/sales');
        } catch (err) {
            showToast(err?.message || 'Failed to create sale.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!canAdd) {
        return (
            <PageLayout eyebrow="Sale" title="Add Sale">
                <p className="text-muted">You do not have permission to add sales.</p>
            </PageLayout>
        );
    }

    if (loading) {
        return (
            <PageLayout eyebrow="Sale" title="Add Sale">
                <p>Loading…</p>
            </PageLayout>
        );
    }

    const orderTaxOptions = buildTaxOptions(meta);
    const paymentMethods = meta?.payment_method_options || [
        { value: '1', label: 'Cash' },
        { value: '4', label: 'Cheque' },
        { value: '6', label: 'Deposit' },
    ];

    return (
        <PageLayout eyebrow="Sale" title="Add Sale">
            <p className="text-muted small mb-3">
                <Link to="/sales">Back to sale list</Link>
            </p>

            <form onSubmit={handleSubmit}>
                <FormSection title="Sale details">
                    <FormRow>
                        <FormField label="Date">
                            <input
                                type="date"
                                className="ui-input"
                                value={header.created_at}
                                readOnly={!meta?.can_change_sale_date}
                                onChange={(e) => setHeader({ ...header, created_at: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Reference no">
                            <TextInput
                                value={header.reference_no}
                                onChange={(e) => setHeader({ ...header, reference_no: e.target.value })}
                                placeholder="Auto if empty"
                            />
                        </FormField>
                        <FormField label="Customer *">
                            <SelectInput
                                value={header.customer_id}
                                onChange={(e) => setHeader({ ...header, customer_id: e.target.value })}
                                options={[
                                    { value: '', label: 'Select customer…' },
                                    ...(meta?.customers || []).map((c) => ({
                                        value: String(c.id),
                                        label: `${c.name}${c.phone_number ? ` (${c.phone_number})` : ''}`,
                                    })),
                                ]}
                            />
                        </FormField>
                        {!meta?.lock_warehouse_id && (
                            <FormField label="Warehouse *">
                                <SelectInput
                                    value={header.warehouse_id}
                                    onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })}
                                    options={[
                                        { value: '', label: 'Select warehouse…' },
                                        ...(meta?.warehouses || []).map((w) => ({
                                            value: String(w.id),
                                            label: w.name,
                                        })),
                                    ]}
                                />
                            </FormField>
                        )}
                        {!meta?.lock_biller_id && (
                            <FormField label="Biller *">
                                <SelectInput
                                    value={header.biller_id}
                                    onChange={(e) => setHeader({ ...header, biller_id: e.target.value })}
                                    options={[
                                        { value: '', label: 'Select biller…' },
                                        ...(meta?.billers || []).map((b) => ({
                                            value: String(b.id),
                                            label: `${b.name}${b.company_name ? ` (${b.company_name})` : ''}`,
                                        })),
                                    ]}
                                />
                            </FormField>
                        )}
                        <FormField label="Currency">
                            <SelectInput
                                value={header.currency_id}
                                onChange={(e) => {
                                    const cur = (meta?.currencies || []).find((c) => String(c.id) === e.target.value);
                                    setHeader({
                                        ...header,
                                        currency_id: e.target.value,
                                        exchange_rate: cur?.exchange_rate ?? header.exchange_rate,
                                    });
                                }}
                                options={[
                                    { value: '', label: 'Select currency…' },
                                    ...(meta?.currencies || []).map((c) => ({
                                        value: String(c.id),
                                        label: `${c.code} (${c.exchange_rate})`,
                                    })),
                                ]}
                            />
                        </FormField>
                        <FormField label="Exchange rate">
                            <NumberInput
                                step="any"
                                min="0"
                                value={header.exchange_rate}
                                onChange={(e) => setHeader({ ...header, exchange_rate: e.target.value })}
                            />
                        </FormField>
                    </FormRow>
                </FormSection>

                <FormSection title="Products">
                    <FormField label="Search product">
                        <div style={{ position: 'relative' }}>
                            <TextInput
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setShowHits(true);
                                }}
                                onFocus={() => setShowHits(true)}
                                placeholder="Type product name or code…"
                            />
                            {showHits && searchHits.length > 0 && (
                                <div
                                    className="border rounded bg-white shadow-sm mt-1"
                                    style={{ position: 'absolute', zIndex: 20, width: '100%', maxHeight: 240, overflow: 'auto' }}
                                >
                                    {searchHits.map((p) => (
                                        <button
                                            key={p.label || p.code}
                                            type="button"
                                            className="dropdown-item text-start w-100 border-0 bg-transparent px-3 py-2"
                                            onClick={() => fetchProduct(p.label)}
                                        >
                                            {p.code} — {p.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </FormField>

                    <div className="table-responsive mb-3">
                        <table className="table table-sm table-bordered">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Code</th>
                                    <th>Qty</th>
                                    <th>Net unit price</th>
                                    <th>Discount</th>
                                    <th>Tax</th>
                                    <th>Subtotal</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {(totals.updated?.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center text-muted py-4">
                                            No products — search above to add
                                        </td>
                                    </tr>
                                ) : (
                                    (totals.updated || []).map((l) => (
                                        <tr key={l._id}>
                                            <td>{l.name}</td>
                                            <td><code>{l.code}</code></td>
                                            <td style={{ width: 90 }}>
                                                <NumberInput
                                                    min="1"
                                                    step="any"
                                                    value={l.qty}
                                                    onChange={(e) => updateLineQty(l._id, e.target.value)}
                                                />
                                            </td>
                                            <td>{Number(l.net_unit_price).toFixed(decimal)}</td>
                                            <td>{Number(l.discount).toFixed(decimal)}</td>
                                            <td>{Number(l.tax).toFixed(decimal)}</td>
                                            <td>{Number(l.subtotal).toFixed(decimal)}</td>
                                            <td>
                                                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeLine(l._id)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </FormSection>

                <FormSection title="Totals & payment">
                    <FormRow>
                        <FormField label="Order tax">
                            <SelectInput
                                value={header.order_tax_rate}
                                onChange={(e) => setHeader({ ...header, order_tax_rate: e.target.value })}
                                options={orderTaxOptions}
                            />
                        </FormField>
                        <FormField label="Order discount">
                            <NumberInput
                                step="any"
                                min="0"
                                value={header.order_discount}
                                onChange={(e) => setHeader({ ...header, order_discount: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Shipping cost">
                            <NumberInput
                                step="any"
                                min="0"
                                value={header.shipping_cost}
                                onChange={(e) => setHeader({ ...header, shipping_cost: e.target.value })}
                            />
                        </FormField>
                    </FormRow>

                    <FormRow>
                        <FormField label="Sale status">
                            <SelectInput
                                value={header.sale_status}
                                onChange={(e) => setHeader({ ...header, sale_status: e.target.value })}
                                options={[
                                    { value: '1', label: 'Completed' },
                                    { value: '2', label: 'Pending' },
                                    { value: '3', label: 'Draft' },
                                ]}
                            />
                        </FormField>
                        <FormField label="Payment status">
                            <SelectInput
                                value={header.payment_status}
                                onChange={(e) => setHeader({ ...header, payment_status: e.target.value })}
                                options={[
                                    { value: '1', label: 'Pending' },
                                    { value: '2', label: 'Due' },
                                    { value: '3', label: 'Partial' },
                                    { value: '4', label: 'Paid' },
                                ]}
                            />
                        </FormField>
                        <FormField label="Paid by">
                            <SelectInput
                                value={header.paid_by_id}
                                onChange={(e) => setHeader({ ...header, paid_by_id: e.target.value })}
                                options={paymentMethods}
                            />
                        </FormField>
                        {header.paid_by_id === '6' && (
                            <FormField label="Account">
                                <SelectInput
                                    value={header.account_id}
                                    onChange={(e) => setHeader({ ...header, account_id: e.target.value })}
                                    options={[
                                        { value: '', label: 'Select account…' },
                                        ...(meta?.accounts || []).map((a) => ({
                                            value: String(a.id),
                                            label: a.name,
                                        })),
                                    ]}
                                />
                            </FormField>
                        )}
                        <FormField label="Paying amount">
                            <NumberInput
                                step="any"
                                value={header.paying_amount}
                                onChange={(e) => setHeader({ ...header, paying_amount: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Paid amount">
                            <NumberInput
                                step="any"
                                value={header.paid_amount}
                                onChange={(e) => setHeader({ ...header, paid_amount: e.target.value })}
                            />
                        </FormField>
                    </FormRow>

                    <div className="border rounded p-3 mb-3">
                        <div><strong>Grand total:</strong> {displayGrandTotal.toFixed(decimal)}</div>
                        {installment.enabled && (
                            <div className="text-muted small mt-1">
                                Installment plan: {installment.name} — {installment.months} month(s)
                                {parseFloat(installment.down_payment) > 0
                                    ? `, down payment ${Number(installment.down_payment).toFixed(decimal)}`
                                    : ''}
                            </div>
                        )}
                    </div>

                    <FormRow>
                        <FormField label="Sale note">
                            <TextareaInput
                                rows={3}
                                value={header.sale_note}
                                onChange={(e) => setHeader({ ...header, sale_note: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Staff note">
                            <TextareaInput
                                rows={3}
                                value={header.staff_note}
                                onChange={(e) => setHeader({ ...header, staff_note: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Document">
                            <FileInput onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                        </FormField>
                    </FormRow>
                </FormSection>

                <div className="d-flex gap-2 flex-wrap align-items-center">
                    <button type="submit" className="ui-btn primary" disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Create sale'}
                    </button>
                    <button type="button" className="ui-btn" onClick={() => navigate('/sales')}>
                        Cancel
                    </button>
                    {showInstallment && (
                        <button
                            type="button"
                            className="ui-btn"
                            style={{ marginLeft: 'auto' }}
                            disabled={!hasLines}
                            onClick={() => setInstallmentOpen(true)}
                        >
                            Installment plan
                        </button>
                    )}
                </div>
            </form>

            {showInstallment && (
                <Modal
                    isOpen={installmentOpen}
                    title="Installment plan"
                    size="sm"
                    onClose={() => closeInstallmentModal(false)}
                    footer={
                        <>
                            <button
                                type="button"
                                className="ui-btn ghost"
                                onClick={() => closeInstallmentModal(true)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="ui-btn primary"
                                onClick={() => setInstallmentOpen(false)}
                            >
                                Done
                            </button>
                        </>
                    }
                >
                    <CheckboxInput
                        label="Enable installment plan"
                        checked={installment.enabled}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setInstallment((prev) => ({
                                ...prev,
                                enabled: checked,
                                additional_amount: checked ? prev.additional_amount : 0,
                                down_payment: checked ? prev.down_payment : 0,
                            }));
                            if (!checked) {
                                setHeader((h) => ({
                                    ...h,
                                    payment_status: '2',
                                    paying_amount: '',
                                    paid_amount: '',
                                }));
                            }
                        }}
                    />

                    {installment.enabled && (
                        <div className="mt-3 d-flex flex-column gap-3">
                            <FormField label="Plan name">
                                <TextInput
                                    value={installment.name}
                                    onChange={(e) => setInstallment({ ...installment, name: e.target.value })}
                                    placeholder="e.g. 6 Month Plan"
                                />
                            </FormField>
                            <FormField label="Price">
                                <NumberInput
                                    step="any"
                                    value={installmentPrice.toFixed(decimal)}
                                    disabled
                                />
                            </FormField>
                            <FormField label="Additional amount">
                                <NumberInput
                                    step="any"
                                    min="0"
                                    value={installment.additional_amount}
                                    onChange={(e) =>
                                        setInstallment({
                                            ...installment,
                                            additional_amount: e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                            <FormField label="Total amount">
                                <NumberInput
                                    step="any"
                                    value={installmentTotal.toFixed(decimal)}
                                    disabled
                                />
                            </FormField>
                            <FormField label="Down payment">
                                <NumberInput
                                    step="any"
                                    min="0"
                                    value={installment.down_payment}
                                    onChange={(e) =>
                                        setInstallment({
                                            ...installment,
                                            down_payment: e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                            <FormField label="Months">
                                <NumberInput
                                    step="1"
                                    min="1"
                                    value={installment.months}
                                    onChange={(e) =>
                                        setInstallment({
                                            ...installment,
                                            months: e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                        </div>
                    )}
                </Modal>
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
