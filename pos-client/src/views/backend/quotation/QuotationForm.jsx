import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
    Toast,
    useToast,
    Modal,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';
import {
    calcQuotationLine,
    calcQuotationTotals,
    rowPriceFromBase,
    basePriceFromRow,
    unitConversion,
    round,
} from './quotationCalc';

let lineId = 1;

const STATUS_OPTIONS = [
    { value: '1', label: 'Pending' },
    { value: '2', label: 'Sent' },
];

const basePath =
    import.meta.env.VITE_APP_DEFAULT_PATH ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000';

function hasQuotePermission(permissions, name) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(name);
}

function mapLineFromApi(l) {
    const qty = parseFloat(l.qty) || 1;
    const totalDiscount = parseFloat(l.discount) || 0;
    return {
        _id: lineId++,
        product_id: l.product_id,
        variant_id: l.variant_id ?? null,
        product_variant_id: l.product_variant_id ?? '',
        code: l.code,
        name: l.name,
        qty,
        product_batch_id: l.product_batch_id ?? '',
        batch_no: l.batch_no ?? '',
        unit_discount: qty ? totalDiscount / qty : 0,
        discount: totalDiscount,
        tax_rate: l.tax_rate ?? 0,
        tax_name: l.tax_name ?? 'No Tax',
        tax_method: l.tax_method ?? 1,
        product_price: l.product_price ?? 0,
        row_product_price: l.row_product_price ?? l.product_price ?? 0,
        net_unit_price: l.net_unit_price ?? 0,
        tax: l.tax ?? 0,
        subtotal: l.subtotal ?? 0,
        sale_unit: l.sale_unit ?? 'n/a',
        unit_names: l.unit_names ?? [],
        unit_operators: l.unit_operators ?? [],
        unit_operation_values: l.unit_operation_values ?? [],
        is_batch: Boolean(l.is_batch),
        is_imei: Boolean(l.is_imei),
        imei_number: l.imei_number ?? '',
        type: l.type ?? 'standard',
    };
}

function buildTaxOptions(meta) {
    const opts = meta?.order_tax_options ?? meta?.taxes ?? [];
    const items = [{ value: '0', label: 'No Tax' }];
    const seen = new Set(['0']);
    const source = opts.length && opts[0].rate !== undefined ? opts : (meta?.taxes || []);
    for (const t of source) {
        const value = String(t.rate);
        if (seen.has(value)) continue;
        seen.add(value);
        items.push({ value, label: t.name });
    }
    return items;
}

function buildLineTaxOptions(meta, lineTaxRate, lineTaxName) {
    const options = buildTaxOptions(meta);
    const rate = String(lineTaxRate ?? 0);
    if (!options.some((o) => o.value === rate)) {
        options.push({ value: rate, label: lineTaxName || rate });
    }
    return options;
}

export default function QuotationForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions('quotations');
    const authPerms = authStore.getPermissions();
    const canSubmit = isEdit
        ? perms.canEdit || hasQuotePermission(authPerms, 'quotes-edit')
        : perms.canAdd || hasQuotePermission(authPerms, 'quotes-add');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [existingDocument, setExistingDocument] = useState('');
    const [documentFile, setDocumentFile] = useState(null);
    const [customerGroupRate, setCustomerGroupRate] = useState(0);
    const [warehouseProducts, setWarehouseProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [showHits, setShowHits] = useState(false);
    const [editModal, setEditModal] = useState(null);

    const [header, setHeader] = useState({
        reference_no: '',
        biller_id: '',
        customer_id: '',
        supplier_id: '',
        warehouse_id: '',
        order_tax_rate: '0',
        order_discount: 0,
        shipping_cost: 0,
        quotation_status: '1',
        note: '',
    });
    const [lines, setLines] = useState([]);

    const decimal = meta?.decimal ?? 2;

    const loadForm = useCallback(async () => {
        setLoading(true);
        try {
            if (isEdit) {
                const res = await api.get(`quotations/${id}/edit`);
                const data = res.data || {};
                setMeta(data);
                const q = data.quotation || {};
                setExistingDocument(q.document || '');
                setHeader({
                    reference_no: q.reference_no || '',
                    biller_id: q.biller_id ? String(q.biller_id) : '',
                    customer_id: q.customer_id ? String(q.customer_id) : '',
                    supplier_id: q.supplier_id ? String(q.supplier_id) : '',
                    warehouse_id: q.warehouse_id ? String(q.warehouse_id) : '',
                    order_tax_rate: String(q.order_tax_rate ?? 0),
                    order_discount: q.order_discount ?? 0,
                    shipping_cost: q.shipping_cost ?? 0,
                    quotation_status: String(q.quotation_status ?? 1),
                    note: q.note || '',
                });
                setLines((data.lines || []).map(mapLineFromApi));
            } else {
                const res = await api.get('quotations/create');
                const data = res.data || {};
                setMeta(data);
                setHeader((h) => ({
                    ...h,
                    biller_id: data.billers?.[0]?.id ? String(data.billers[0].id) : '',
                    customer_id: data.customers?.[0]?.id ? String(data.customers[0].id) : '',
                    warehouse_id: data.warehouses?.[0]?.id ? String(data.warehouses[0].id) : '',
                }));
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load form.', 'error');
        } finally {
            setLoading(false);
        }
    }, [id, isEdit, showToast]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    useEffect(() => {
        if (!header.customer_id) {
            setCustomerGroupRate(0);
            return;
        }
        api.get(`quotations/customer-group/${header.customer_id}`)
            .then((res) => setCustomerGroupRate((parseFloat(res.data?.percentage) || 0) / 100))
            .catch(() => setCustomerGroupRate(0));
    }, [header.customer_id]);

    useEffect(() => {
        if (!header.warehouse_id) {
            setWarehouseProducts([]);
            return;
        }
        api.get(`quotations/warehouse-products?warehouse_id=${header.warehouse_id}`)
            .then((res) => setWarehouseProducts(res.data?.options || []))
            .catch(() => setWarehouseProducts([]));
    }, [header.warehouse_id]);

    const totals = useMemo(
        () => calcQuotationTotals(lines, header, decimal),
        [lines, header, decimal]
    );

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

    const billerOptions = useMemo(
        () => [
            { value: '', label: 'Select biller…' },
            ...(meta?.billers || []).map((b) => ({
                value: String(b.id),
                label: `${b.name}${b.company_name ? ` (${b.company_name})` : ''}`,
            })),
        ],
        [meta]
    );

    const customerOptions = useMemo(
        () => [
            { value: '', label: 'Select customer…' },
            ...(meta?.customers || []).map((c) => ({
                value: String(c.id),
                label: `${c.name}${c.phone_number ? ` (${c.phone_number})` : ''}`,
            })),
        ],
        [meta]
    );

    const supplierOptions = useMemo(
        () => [
            { value: '', label: 'Select supplier…' },
            ...(meta?.suppliers || []).map((s) => ({
                value: String(s.id),
                label: `${s.name}${s.company_name ? ` (${s.company_name})` : ''}`,
            })),
        ],
        [meta]
    );

    const warehouseOptions = useMemo(
        () => [
            { value: '', label: 'Select warehouse…' },
            ...(meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name })),
        ],
        [meta]
    );

    const orderTaxOptions = useMemo(() => buildTaxOptions(meta), [meta]);

    const recalcLine = (line) => {
        const calc = calcQuotationLine(line);
        return {
            ...line,
            discount: round((parseFloat(line.unit_discount) || 0) * (parseFloat(line.qty) || 0), decimal),
            net_unit_price: round(calc.net_unit_price, decimal),
            tax: round(calc.tax, decimal),
            subtotal: round(calc.subtotal, decimal),
        };
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
            showToast('Please select customer.', 'error');
            return;
        }
        if (!header.warehouse_id) {
            showToast('Please select warehouse.', 'error');
            return;
        }

        const parts = label.split('|');
        const code = parts[0] || '';
        const name = parts[1] || '';
        const imei = parts[2] || 'null';
        const embed = parts[3] || '0';

        const existing = lines.find((l) => l.code === code);
        const preQty = existing ? parseFloat(existing.qty) || 0 : 0;

        if (existing?.is_imei && imei !== 'null') {
            const nums = String(existing.imei_number || '').split(',').map((s) => s.trim());
            if (nums.includes(imei)) {
                showToast('Same imei or serial number is not allowed!', 'error');
                setProductSearch('');
                return;
            }
        }

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
            const res = await api.get(`quotations/product-search?${q}`);
            const data = res.data || {};
            appendLineFromSearch(data, preQty);
            setProductSearch('');
            setShowHits(false);
        } catch (err) {
            showToast(err?.message || 'Product not found.', 'error');
        }
    };

    const handleSearchSelect = (option) => {
        fetchProduct(option.label || `${option.code}|${option.name}`);
    };

    const openEditModal = (line) => {
        const rowUnitPrice =
            line.type === 'standard'
                ? rowPriceFromBase(line.product_price, line.unit_operators, line.unit_operation_values)
                : parseFloat(line.product_price) || 0;

        setEditModal({
            lineKey: line._id,
            name: line.name,
            code: line.code,
            qty: line.qty,
            unit_discount: line.unit_discount ?? 0,
            unit_price: round(rowUnitPrice, decimal),
            tax_rate: String(line.tax_rate ?? 0),
            tax_name: line.tax_name,
            unit_index: 0,
            unit_names: [...(line.unit_names || [])],
            unit_operators: [...(line.unit_operators || [])],
            unit_operation_values: [...(line.unit_operation_values || [])],
            type: line.type,
        });
    };

    const applyEditModal = () => {
        if (!editModal) return;

        const unitDiscount = parseFloat(editModal.unit_discount) || 0;
        const unitPrice = parseFloat(editModal.unit_price) || 0;
        const editQty = parseFloat(editModal.qty) || 1;

        if (unitDiscount > unitPrice) {
            showToast('Invalid discount input!', 'error');
            return;
        }
        if (editQty < 1) {
            showToast("Quantity can't be less than 1", 'error');
            return;
        }

        setLines((prev) =>
            prev.map((l) => {
                if (l._id !== editModal.lineKey) return l;

                let productPrice = parseFloat(l.product_price) || 0;
                let unitNames = [...(l.unit_names || [])];
                let unitOperators = [...(l.unit_operators || [])];
                let unitOpValues = [...(l.unit_operation_values || [])];
                let saleUnit = l.sale_unit;

                if (editModal.type === 'standard' && unitNames.length) {
                    const idx = parseInt(editModal.unit_index, 10) || 0;
                    productPrice = basePriceFromRow(unitPrice, unitOperators[0], unitOpValues[0]);

                    if (idx > 0 && idx < unitNames.length) {
                        const name = unitNames[idx];
                        const op = unitOperators[idx];
                        const val = unitOpValues[idx];
                        unitNames.splice(idx, 1);
                        unitOperators.splice(idx, 1);
                        unitOpValues.splice(idx, 1);
                        unitNames.unshift(name);
                        unitOperators.unshift(op);
                        unitOpValues.unshift(val);
                    }
                    saleUnit = unitNames[0] || 'n/a';
                } else if (editModal.type !== 'standard') {
                    productPrice = unitPrice;
                }

                const taxOption = buildLineTaxOptions(meta, editModal.tax_rate, editModal.tax_name)
                    .find((o) => o.value === String(editModal.tax_rate));

                return recalcLine({
                    ...l,
                    qty: editQty,
                    unit_discount: unitDiscount,
                    product_price: productPrice,
                    row_product_price:
                        editModal.type === 'standard'
                            ? unitPrice
                            : unitPrice,
                    tax_rate: parseFloat(editModal.tax_rate) || 0,
                    tax_name: taxOption?.label || l.tax_name,
                    sale_unit: saleUnit,
                    unit_names: unitNames,
                    unit_operators: unitOperators,
                    unit_operation_values: unitOpValues,
                });
            })
        );
        setEditModal(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) {
            showToast('You are not allowed to perform this action.', 'error');
            return;
        }
        if (!header.biller_id) {
            showToast('Biller is required.', 'error');
            return;
        }
        if (!header.customer_id) {
            showToast('Customer is required.', 'error');
            return;
        }
        if (!header.warehouse_id) {
            showToast('Warehouse is required.', 'error');
            return;
        }
        if ((totals.updated?.length ?? 0) === 0) {
            showToast('Add at least one product.', 'error');
            return;
        }

        const data = new FormData();
        data.append('biller_id', header.biller_id);
        data.append('customer_id', header.customer_id);
        if (header.supplier_id) data.append('supplier_id', header.supplier_id);
        data.append('warehouse_id', header.warehouse_id);
        data.append('order_tax_rate', header.order_tax_rate);
        data.append('order_discount', String(header.order_discount || 0));
        data.append('shipping_cost', String(header.shipping_cost || 0));
        data.append('quotation_status', header.quotation_status);
        data.append('note', header.note || '');
        data.append('total_qty', String(totals.totalQty));
        data.append('total_discount', totals.totalDiscount.toFixed(decimal));
        data.append('total_tax', totals.totalTax.toFixed(decimal));
        data.append('total_price', totals.totalPrice.toFixed(decimal));
        data.append('item', String(totals.item));
        data.append('order_tax', totals.orderTax.toFixed(decimal));
        data.append('grand_total', totals.grandTotal.toFixed(decimal));
        if (documentFile) data.append('document', documentFile);

        (totals.updated || []).forEach((l) => {
            data.append('product_id[]', String(l.product_id));
            data.append('product_code[]', l.code);
            data.append('product_batch_id[]', l.product_batch_id ?? '');
            data.append('qty[]', String(l.qty));
            data.append('sale_unit[]', l.sale_unit || 'n/a');
            data.append('net_unit_price[]', Number(l.net_unit_price).toFixed(decimal));
            data.append('discount[]', Number(l.discount).toFixed(decimal));
            data.append('tax_rate[]', String(l.tax_rate));
            data.append('tax[]', Number(l.tax).toFixed(decimal));
            data.append('subtotal[]', Number(l.subtotal).toFixed(decimal));
            data.append('imei_number[]', l.imei_number || '');
            if (isEdit) {
                data.append('product_variant_id[]', l.product_variant_id ?? '');
            }
        });

        setSubmitting(true);
        try {
            if (isEdit) {
                data.append('_method', 'PUT');
                await api.post(`quotations/${id}`, data);
                showToast('Quotation updated.', 'success');
            } else {
                await api.post('quotations', data);
                showToast('Quotation created.', 'success');
            }
            navigate('/quotations');
        } catch (err) {
            const msg = err?.message || 'Save failed.';
            const errs = err?.errors;
            if (errs) {
                const first = Object.values(errs).flat()[0];
                showToast(first || msg, 'error');
            } else {
                showToast(msg, 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageLayout eyebrow="Quotation" title={isEdit ? 'Edit Quotation' : 'Add Quotation'}>
                <div className="p-5 text-center">Loading…</div>
            </PageLayout>
        );
    }

    if (!canSubmit) {
        return (
            <PageLayout eyebrow="Quotation" title={isEdit ? 'Edit Quotation' : 'Add Quotation'}>
                <p className="text-danger">You are not allowed to access this page.</p>
                <Link to="/quotations" className="ui-btn">Back to list</Link>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Quotation" title={isEdit ? 'Edit Quotation' : 'Add Quotation'}>
            <Toast toast={toast} />
            <p className="text-muted small mb-3">
                Fields marked with * are required.
            </p>

            <form onSubmit={handleSubmit}>
                <FormSection title="Quotation information">
                    <FormRow>
                        {isEdit && (
                            <FormField label="Reference">
                                <TextInput value={header.reference_no} readOnly />
                            </FormField>
                        )}
                        <FormField label="Biller" required>
                            <SelectInput
                                required
                                value={header.biller_id}
                                onChange={(e) => setHeader({ ...header, biller_id: e.target.value })}
                                options={billerOptions}
                            />
                        </FormField>
                        <FormField label="Customer" required>
                            <SelectInput
                                required
                                value={header.customer_id}
                                onChange={(e) => setHeader({ ...header, customer_id: e.target.value })}
                                options={customerOptions}
                            />
                        </FormField>
                        <FormField label="Supplier">
                            <SelectInput
                                value={header.supplier_id}
                                onChange={(e) => setHeader({ ...header, supplier_id: e.target.value })}
                                options={supplierOptions}
                            />
                        </FormField>
                        <FormField label="Warehouse" required>
                            <SelectInput
                                required
                                value={header.warehouse_id}
                                onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })}
                                options={warehouseOptions}
                            />
                        </FormField>
                        <FormField label="Status">
                            <SelectInput
                                value={header.quotation_status}
                                onChange={(e) => setHeader({ ...header, quotation_status: e.target.value })}
                                options={STATUS_OPTIONS}
                            />
                        </FormField>
                    </FormRow>
                </FormSection>

                <FormSection title="Products">
                    <div style={{ position: 'relative', maxWidth: 520, marginBottom: 16 }}>
                        <TextInput
                            placeholder="Type product code or name…"
                            value={productSearch}
                            onChange={(e) => {
                                setProductSearch(e.target.value);
                                setShowHits(true);
                            }}
                            onFocus={() => setShowHits(true)}
                            onBlur={() => setTimeout(() => setShowHits(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (searchHits.length === 1) {
                                        handleSearchSelect(searchHits[0]);
                                    }
                                }
                            }}
                        />
                        {showHits && searchHits.length > 0 && (
                            <ul
                                className="list-group position-absolute w-100 shadow-sm"
                                style={{ zIndex: 50, maxHeight: 280, overflowY: 'auto' }}
                            >
                                {searchHits.map((p) => (
                                    <li
                                        key={p.label || p.code}
                                        className="list-group-item list-group-item-action"
                                        style={{ cursor: 'pointer' }}
                                        onMouseDown={() => handleSearchSelect(p)}
                                    >
                                        {p.name}{' '}
                                        <span className="text-muted">({p.code})</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="table-responsive">
                        <table className="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Code</th>
                                    <th>Batch No</th>
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
                                        <td colSpan={9} className="text-center text-muted py-4">
                                            No products — search above to add
                                        </td>
                                    </tr>
                                ) : (
                                    (totals.updated || []).map((l) => (
                                        <tr key={l._id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span>{l.name}</span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm p-0"
                                                        onClick={() => openEditModal(l)}
                                                        title="Edit line"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                            <td><code>{l.code}</code></td>
                                            <td>
                                                {l.is_batch ? (
                                                    <TextInput
                                                        value={l.batch_no}
                                                        onChange={(e) =>
                                                            setLines((prev) =>
                                                                prev.map((row) =>
                                                                    row._id === l._id
                                                                        ? { ...row, batch_no: e.target.value }
                                                                        : row
                                                                )
                                                            )
                                                        }
                                                        placeholder="Batch no"
                                                    />
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
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
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => removeLine(l._id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th colSpan={3} className="text-end">Totals</th>
                                    <th>{totals.totalQty}</th>
                                    <th />
                                    <th>{totals.totalDiscount.toFixed(decimal)}</th>
                                    <th>{totals.totalTax.toFixed(decimal)}</th>
                                    <th>{totals.totalPrice.toFixed(decimal)}</th>
                                    <th />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </FormSection>

                <FormSection title="Order totals">
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
                        <FormField label="Attach document">
                            <FileInput onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                            {existingDocument && !documentFile && (
                                <small className="text-muted d-block mt-1">
                                    Current:{' '}
                                    <a
                                        href={`${basePath}/documents/quotation/${existingDocument}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {existingDocument}
                                    </a>
                                </small>
                            )}
                        </FormField>
                    </FormRow>
                    <FormField label="Note">
                        <TextareaInput
                            rows={4}
                            value={header.note}
                            onChange={(e) => setHeader({ ...header, note: e.target.value })}
                        />
                    </FormField>

                    <table className="table table-bordered table-sm mb-3" style={{ maxWidth: 720 }}>
                        <tbody>
                            <tr>
                                <td><strong>Items</strong></td>
                                <td className="text-end">
                                    {totals.item} ({totals.totalQty})
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Subtotal</strong></td>
                                <td className="text-end">{totals.totalPrice.toFixed(decimal)}</td>
                            </tr>
                            <tr>
                                <td><strong>Order tax</strong></td>
                                <td className="text-end">{totals.orderTax.toFixed(decimal)}</td>
                            </tr>
                            <tr>
                                <td><strong>Order discount</strong></td>
                                <td className="text-end">{Number(header.order_discount || 0).toFixed(decimal)}</td>
                            </tr>
                            <tr>
                                <td><strong>Shipping</strong></td>
                                <td className="text-end">{Number(header.shipping_cost || 0).toFixed(decimal)}</td>
                            </tr>
                            <tr>
                                <td><strong>Grand total</strong></td>
                                <td className="text-end">{totals.grandTotal.toFixed(decimal)}</td>
                            </tr>
                        </tbody>
                    </table>
                </FormSection>

                <div className="d-flex gap-2">
                    <button type="submit" className="ui-btn primary" disabled={submitting}>
                        {submitting ? 'Saving…' : isEdit ? 'Update' : 'Submit'}
                    </button>
                    <button type="button" className="ui-btn" onClick={() => navigate('/quotations')}>
                        Cancel
                    </button>
                </div>
            </form>

            <Modal
                isOpen={Boolean(editModal)}
                title={editModal ? `${editModal.name} (${editModal.code})` : 'Edit product'}
                onClose={() => setEditModal(null)}
            >
                {editModal && (
                    <>
                        <FormRow cols={2}>
                            <FormField label="Quantity">
                                <NumberInput
                                    min="1"
                                    step="any"
                                    value={editModal.qty}
                                    onChange={(e) => setEditModal({ ...editModal, qty: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Unit discount">
                                <NumberInput
                                    min="0"
                                    step="any"
                                    value={editModal.unit_discount}
                                    onChange={(e) => setEditModal({ ...editModal, unit_discount: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Unit price">
                                <NumberInput
                                    min="0"
                                    step="any"
                                    value={editModal.unit_price}
                                    onChange={(e) => setEditModal({ ...editModal, unit_price: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Tax rate">
                                <SelectInput
                                    value={String(editModal.tax_rate)}
                                    onChange={(e) => {
                                        const opt = buildLineTaxOptions(meta, e.target.value).find(
                                            (o) => o.value === e.target.value
                                        );
                                        setEditModal({
                                            ...editModal,
                                            tax_rate: e.target.value,
                                            tax_name: opt?.label,
                                        });
                                    }}
                                    options={buildLineTaxOptions(meta, editModal.tax_rate, editModal.tax_name)}
                                />
                            </FormField>
                            {editModal.type === 'standard' && editModal.unit_names?.length > 0 && (
                                <FormField label="Product unit">
                                    <SelectInput
                                        value={String(editModal.unit_index)}
                                        onChange={(e) => {
                                            const idx = parseInt(e.target.value, 10) || 0;
                                            const rowPrice = unitConversion(
                                                basePriceFromRow(
                                                    parseFloat(editModal.unit_price) || 0,
                                                    editModal.unit_operators[0],
                                                    editModal.unit_operation_values[0]
                                                ),
                                                editModal.unit_operators[idx],
                                                editModal.unit_operation_values[idx]
                                            );
                                            setEditModal({
                                                ...editModal,
                                                unit_index: e.target.value,
                                                unit_price: round(rowPrice, decimal),
                                            });
                                        }}
                                        options={editModal.unit_names.map((name, idx) => ({
                                            value: String(idx),
                                            label: name,
                                        }))}
                                    />
                                </FormField>
                            )}
                        </FormRow>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button type="button" className="ui-btn" onClick={() => setEditModal(null)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" onClick={applyEditModal}>
                                Update
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </PageLayout>
    );
}
