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
    Toast,
    useToast,
    Modal,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';
import {
    calcTransferLine,
    calcTransferTotals,
    rowCostFromBase,
    round,
} from './transferCalc';

let lineId = 1;

function hasTransferPermission(permissions, name) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(name);
}

function baseQtyFromLine(line) {
    const qty = parseFloat(line.qty) || 0;
    const operators = line.unit_operators || [];
    const values = line.unit_operation_values || [];
    const op = operators[0] ?? '*';
    const val = parseFloat(values[0]) || 1;
    return op === '*' ? qty * val : qty / val;
}

function recalcLine(line, decimal) {
    const calc = calcTransferLine(line);
    return {
        ...line,
        net_unit_cost: round(calc.net_unit_cost, decimal),
        tax: round(calc.tax, decimal),
        subtotal: round(calc.subtotal, decimal),
    };
}

export default function TransferForm() {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions('transfers');
    const authPerms = authStore.getPermissions();
    const canSubmit = perms.canAdd || hasTransferPermission(authPerms, 'transfers-add');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);
    const [warehouseProducts, setWarehouseProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [showHits, setShowHits] = useState(false);
    const [editModal, setEditModal] = useState(null);

    const [header, setHeader] = useState({
        created_at: '',
        from_warehouse_id: '',
        to_warehouse_id: '',
        status: '2',
        shipping_cost: 0,
        note: '',
    });
    const [lines, setLines] = useState([]);

    const decimal = meta?.decimal ?? 2;

    const loadForm = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('transfers/create');
            const data = res.data || {};
            setMeta(data);
            const defaultFrom = data.default_from_warehouse_id
                ? String(data.default_from_warehouse_id)
                : '';
            const defaultStatus = data.status_options?.[0]?.value ?? '2';
            setHeader((h) => ({
                ...h,
                created_at: data.default_created_at || h.created_at,
                from_warehouse_id: defaultFrom,
                status: defaultStatus,
            }));
        } catch (err) {
            showToast(err?.message || 'Failed to load form.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    useEffect(() => {
        if (!header.from_warehouse_id) {
            setWarehouseProducts([]);
            return;
        }
        api.get(`transfers/warehouse-products?warehouse_id=${header.from_warehouse_id}`)
            .then((res) => setWarehouseProducts(res.data?.options || []))
            .catch(() => setWarehouseProducts([]));
    }, [header.from_warehouse_id]);

    const totals = useMemo(
        () => calcTransferTotals(lines, header, decimal),
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

    const warehouseOptions = useMemo(
        () => [
            { value: '', label: 'Select warehouse…' },
            ...(meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name })),
        ],
        [meta]
    );

    const statusOptions = useMemo(
        () => meta?.status_options || [{ value: '2', label: 'Pending' }],
        [meta]
    );

    const checkStock = (line, qty) => {
        const baseQty = baseQtyFromLine({ ...line, qty });
        const stock = parseFloat(line.stock_qty) || 0;
        if (baseQty > stock) {
            showToast('Quantity exceeds stock quantity!', 'error');
            return false;
        }
        return true;
    };

    const appendLineFromSearch = (data, preQty = 0) => {
        const unitNames = data.unit_names || [];
        const unitOperators = data.unit_operators || [];
        const unitOpValues = data.unit_operation_values || [];
        const baseCost = parseFloat(data.cost) || 0;
        const rowUnitCost = rowCostFromBase(baseCost, unitOperators, unitOpValues);
        const stockQty = parseFloat(data.stock_qty) || 0;

        if (stockQty < 1 && preQty === 0) {
            showToast('Quantity not available', 'error');
            return;
        }

        setLines((prev) => {
            const existingIdx = prev.findIndex((l) => l.code === data.code);
            const qty = preQty > 0 ? preQty + 1 : 1;

            if (existingIdx >= 0) {
                const existing = prev[existingIdx];
                const next = recalcLine(
                    {
                        ...existing,
                        qty,
                        product_cost: baseCost,
                        row_unit_cost: rowUnitCost,
                    },
                    decimal
                );
                if (!checkStock(next, qty)) return prev;
                return prev.map((l, i) => (i === existingIdx ? next : l));
            }

            const newLine = recalcLine(
                {
                    _id: lineId++,
                    product_id: data.product_id,
                    product_variant_id: data.product_variant_id ?? '',
                    code: data.code,
                    name: data.name,
                    qty,
                    product_batch_id: '',
                    batch_no: '',
                    tax_rate: data.tax_rate ?? 0,
                    tax_name: data.tax_name ?? 'No Tax',
                    tax_method: data.tax_method ?? 1,
                    product_cost: baseCost,
                    row_unit_cost: rowUnitCost,
                    purchase_unit: unitNames[0] || 'n/a',
                    unit_names: unitNames,
                    unit_operators: unitOperators,
                    unit_operation_values: unitOpValues,
                    is_batch: Boolean(data.is_batch),
                    is_imei: Boolean(data.is_imei),
                    imei_number: data.imei_number ?? '',
                    stock_qty: stockQty,
                },
                decimal
            );

            if (!checkStock(newLine, qty)) return prev;
            return [newLine, ...prev];
        });
    };

    const fetchProduct = async (option) => {
        if (!header.from_warehouse_id) {
            showToast('Please select from warehouse.', 'error');
            return;
        }

        const code = option.code || '';
        const name = option.name || '';
        const imei = option.label?.split('|')[2] || 'null';
        const embed = option.label?.split('|')[3] || '0';
        const stockQty = option.stock_qty ?? option.label?.split('|')[4] ?? '0';

        const existing = lines.find((l) => l.code === code);
        const preQty = existing ? parseFloat(existing.qty) || 0 : 0;

        if (existing?.is_imei && imei !== 'null' && imei) {
            const nums = String(existing.imei_number || '').split(',').map((s) => s.trim());
            if (nums.includes(imei)) {
                showToast('Same imei or serial number is not allowed!', 'error');
                setProductSearch('');
                return;
            }
            setLines((prev) =>
                prev.map((l) =>
                    l.code === code
                        ? {
                            ...l,
                            imei_number: l.imei_number
                                ? `${l.imei_number},${imei}`
                                : imei,
                        }
                        : l
                )
            );
            setProductSearch('');
            setShowHits(false);
            return;
        }

        try {
            const q = new URLSearchParams({
                code,
                name,
                qty: String(preQty + 1),
                imei,
                embed,
                stock_qty: String(stockQty),
            });
            const res = await api.get(`transfers/product-search?${q}`);
            const data = res.data || {};
            appendLineFromSearch(data, preQty);
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
                const next = recalcLine({ ...l, qty: rawQty === '' ? rawQty : qty }, decimal);
                if (rawQty !== '' && !checkStock(next, qty)) return l;
                return next;
            })
        );
    };

    const removeLine = (lineKey) => setLines((prev) => prev.filter((l) => l._id !== lineKey));

    const openEditModal = (line) => {
        setEditModal({
            lineKey: line._id,
            name: line.name,
            code: line.code,
            qty: line.qty,
            unit_cost: round(line.row_unit_cost ?? line.product_cost ?? 0, decimal),
            unit_index: 0,
            unit_names: [...(line.unit_names || [])],
            unit_operators: [...(line.unit_operators || [])],
            unit_operation_values: [...(line.unit_operation_values || [])],
            is_imei: Boolean(line.is_imei),
            imei_number: line.imei_number ?? '',
        });
    };

    const applyEditModal = () => {
        if (!editModal) return;

        const editQty = parseFloat(editModal.qty) || 1;
        if (editQty < 1) {
            showToast("Quantity can't be less than 1", 'error');
            return;
        }

        const unitIndex = parseInt(editModal.unit_index, 10) || 0;
        const unitNames = [...editModal.unit_names];
        const unitOperators = [...editModal.unit_operators];
        const unitOpValues = [...editModal.unit_operation_values];

        if (unitIndex > 0 && unitNames.length > 1) {
            const name = unitNames.splice(unitIndex, 1)[0];
            const op = unitOperators.splice(unitIndex, 1)[0];
            const val = unitOpValues.splice(unitIndex, 1)[0];
            unitNames.unshift(name);
            unitOperators.unshift(op);
            unitOpValues.unshift(val);
        }

        const rowOp = unitOperators[0] ?? '*';
        const rowVal = parseFloat(unitOpValues[0]) || 1;
        const editUnitCost = parseFloat(editModal.unit_cost) || 0;
        const baseCost = rowOp === '*' ? editUnitCost / rowVal : editUnitCost * rowVal;

        setLines((prev) =>
            prev.map((l) => {
                if (l._id !== editModal.lineKey) return l;
                const next = recalcLine(
                    {
                        ...l,
                        qty: editQty,
                        product_cost: baseCost,
                        row_unit_cost: editUnitCost,
                        purchase_unit: unitNames[0] || l.purchase_unit,
                        unit_names: unitNames,
                        unit_operators: unitOperators,
                        unit_operation_values: unitOpValues,
                    },
                    decimal
                );
                if (!checkStock(next, editQty)) return l;
                return next;
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
        if (!header.from_warehouse_id) {
            showToast('From warehouse is required.', 'error');
            return;
        }
        if (!header.to_warehouse_id) {
            showToast('To warehouse is required.', 'error');
            return;
        }
        if (header.from_warehouse_id === header.to_warehouse_id) {
            showToast('From and to warehouse must be different.', 'error');
            return;
        }
        if ((totals.updated?.length ?? 0) === 0) {
            showToast('Please insert product to order table!', 'error');
            return;
        }

        const data = new FormData();
        data.append('created_at', header.created_at || '');
        data.append('from_warehouse_id', header.from_warehouse_id);
        data.append('to_warehouse_id', header.to_warehouse_id);
        data.append('status', header.status);
        data.append('shipping_cost', String(header.shipping_cost || 0));
        data.append('note', header.note || '');
        data.append('total_qty', String(totals.totalQty));
        data.append('total_tax', totals.totalTax.toFixed(decimal));
        data.append('total_cost', totals.totalCost.toFixed(decimal));
        data.append('item', String(totals.item));
        data.append('grand_total', totals.grandTotal.toFixed(decimal));
        if (documentFile) data.append('document', documentFile);

        (totals.updated || []).forEach((l) => {
            data.append('product_id[]', String(l.product_id));
            data.append('product_code[]', l.code);
            data.append('product_batch_id[]', l.product_batch_id ?? '');
            data.append('qty[]', String(l.qty));
            data.append('purchase_unit[]', l.purchase_unit || 'n/a');
            data.append('net_unit_cost[]', Number(l.net_unit_cost).toFixed(decimal));
            data.append('tax_rate[]', String(l.tax_rate));
            data.append('tax[]', Number(l.tax).toFixed(decimal));
            data.append('subtotal[]', Number(l.subtotal).toFixed(decimal));
            data.append('imei_number[]', l.imei_number || '');
        });

        setSubmitting(true);
        try {
            await api.post('transfers', data);
            showToast('Transfer created successfully.', 'success');
            navigate('/transfers');
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
            <PageLayout eyebrow="Transfer" title="Add Transfer">
                <div className="p-5 text-center">Loading…</div>
            </PageLayout>
        );
    }

    if (!canSubmit) {
        return (
            <PageLayout eyebrow="Transfer" title="Add Transfer">
                <p className="text-danger">You are not allowed to access this page.</p>
                <Link to="/transfers" className="ui-btn">Back to list</Link>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Transfer" title="Add Transfer">
            <Toast toast={toast} />
            <p className="text-muted small mb-3">
                Fields marked with * are required.
            </p>

            <form onSubmit={handleSubmit}>
                <FormSection title="Transfer information">
                    <FormRow>
                        <FormField label="Date">
                            <TextInput
                                value={header.created_at}
                                onChange={(e) => setHeader({ ...header, created_at: e.target.value })}
                                placeholder="dd-mm-yyyy"
                            />
                        </FormField>
                        <FormField label="From warehouse" required>
                            <SelectInput
                                required
                                value={header.from_warehouse_id}
                                onChange={(e) => {
                                    setHeader({ ...header, from_warehouse_id: e.target.value });
                                    setLines([]);
                                }}
                                options={warehouseOptions}
                            />
                        </FormField>
                        <FormField label="To warehouse" required>
                            <SelectInput
                                required
                                value={header.to_warehouse_id}
                                onChange={(e) => setHeader({ ...header, to_warehouse_id: e.target.value })}
                                options={warehouseOptions}
                            />
                        </FormField>
                        <FormField label="Status">
                            <SelectInput
                                value={header.status}
                                onChange={(e) => setHeader({ ...header, status: e.target.value })}
                                options={statusOptions}
                            />
                        </FormField>
                    </FormRow>
                </FormSection>

                <FormSection title="Products">
                    <div style={{ position: 'relative', maxWidth: 520, marginBottom: 16 }}>
                        <TextInput
                            placeholder={
                                header.from_warehouse_id
                                    ? 'Type product code or name…'
                                    : 'Select from warehouse first'
                            }
                            disabled={!header.from_warehouse_id}
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
                                        fetchProduct(searchHits[0]);
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
                                        onMouseDown={() => fetchProduct(p)}
                                    >
                                        {p.name}{' '}
                                        <span className="text-muted">({p.code})</span>
                                        {p.stock_qty != null && (
                                            <span className="text-muted ms-1"> — qty: {p.stock_qty}</span>
                                        )}
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
                                    <th>Qty</th>
                                    <th>Net unit cost</th>
                                    <th>Tax</th>
                                    <th>Subtotal</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {(totals.updated?.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-4">
                                            No products — search above to add
                                        </td>
                                    </tr>
                                ) : (
                                    (totals.updated || []).map((l) => (
                                        <tr key={l._id}>
                                            <td>
                                                <div>
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
                                                    {l.stock_qty != null && (
                                                        <small className="text-muted">Stock: {l.stock_qty}</small>
                                                    )}
                                                    {l.is_batch && (
                                                        <TextInput
                                                            className="mt-1"
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
                                                    )}
                                                </div>
                                            </td>
                                            <td><code>{l.code}</code></td>
                                            <td style={{ width: 90 }}>
                                                <NumberInput
                                                    min="1"
                                                    step="any"
                                                    max={l.stock_qty || undefined}
                                                    value={l.qty}
                                                    onChange={(e) => updateLineQty(l._id, e.target.value)}
                                                />
                                            </td>
                                            <td>{Number(l.net_unit_cost).toFixed(decimal)}</td>
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
                                    <th colSpan={2} className="text-end">Totals</th>
                                    <th>{totals.totalQty}</th>
                                    <th />
                                    <th>{totals.totalTax.toFixed(decimal)}</th>
                                    <th>{totals.totalCost.toFixed(decimal)}</th>
                                    <th />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </FormSection>

                <FormSection title="Additional details">
                    <FormRow>
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
                                <td className="text-end">{totals.itemLabel}</td>
                            </tr>
                            <tr>
                                <td><strong>Total</strong></td>
                                <td className="text-end">{totals.totalCost.toFixed(decimal)}</td>
                            </tr>
                            <tr>
                                <td><strong>Shipping cost</strong></td>
                                <td className="text-end">{totals.shippingCost.toFixed(decimal)}</td>
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
                        {submitting ? 'Saving…' : 'Submit'}
                    </button>
                    <Link to="/transfers" className="ui-btn">
                        Cancel
                    </Link>
                </div>
            </form>

            {editModal && (
                <Modal
                    title={`${editModal.name} (${editModal.code})`}
                    onClose={() => setEditModal(null)}
                >
                    <FormRow>
                        <FormField label="Quantity">
                            <NumberInput
                                step="any"
                                min="1"
                                value={editModal.qty}
                                disabled={editModal.is_imei && editModal.imei_number}
                                onChange={(e) =>
                                    setEditModal({ ...editModal, qty: e.target.value })
                                }
                            />
                        </FormField>
                        <FormField label="Unit cost">
                            <NumberInput
                                step="any"
                                min="0"
                                value={editModal.unit_cost}
                                onChange={(e) =>
                                    setEditModal({ ...editModal, unit_cost: e.target.value })
                                }
                            />
                        </FormField>
                        {editModal.unit_names.length > 1 && (
                            <FormField label="Product unit">
                                <SelectInput
                                    value={String(editModal.unit_index)}
                                    onChange={(e) =>
                                        setEditModal({ ...editModal, unit_index: e.target.value })
                                    }
                                    options={editModal.unit_names.map((name, idx) => ({
                                        value: String(idx),
                                        label: name,
                                    }))}
                                />
                            </FormField>
                        )}
                    </FormRow>
                    {editModal.is_imei && editModal.imei_number && (
                        <p className="small text-muted">
                            IMEI: {editModal.imei_number}
                        </p>
                    )}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" onClick={applyEditModal}>
                            Update
                        </button>
                        <button type="button" className="ui-btn" onClick={() => setEditModal(null)}>
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}
        </PageLayout>
    );
}
