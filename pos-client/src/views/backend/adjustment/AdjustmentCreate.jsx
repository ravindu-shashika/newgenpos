import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    PageLayout,
    FormRow,
    FormSection,
    FormField,
    SelectInput,
    TextareaInput,
    FileInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';

let nextRowId = 1;

function buildSearchOptions(codes, names, costs) {
    const options = [];
    for (let i = 0; i < codes.length; i++) {
        options.push(`${codes[i]} (${names[i]})|${costs[i]}`);
    }
    return options;
}

function mapLineToRow(line, isEditMode) {
    return {
        _id: nextRowId++,
        product_id: line.product_id,
        product_code: line.product_code,
        name: line.name,
        unit_cost: line.unit_cost,
        available_qty: line.available_qty ?? line.stock_qty ?? 0,
        adjustment_qty: line.adjustment_qty ?? 0,
        stock_qty: line.available_qty ?? line.stock_qty ?? 0,
        qty: isEditMode ? 0 : (line.qty ?? 1),
        action: line.action ?? '-',
        variant_id: line.variant_id ?? null,
        product_variant_id: line.product_variant_id ?? line.variant_id ?? null,
        isExisting: Boolean(isEditMode),
        is_batch: Boolean(line.is_batch),
        batches: line.batches || [],
        product_batch_id: line.product_batch_id ? String(line.product_batch_id) : '',
        batch_no: line.batch_no || '',
        expired_date: line.expired_date || '',
    };
}

function minExpiryDateString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}

export default function AdjustmentCreate() {
    const navigate = useNavigate();
    const { id: adjustmentId } = useParams();
    const isEditMode = Boolean(adjustmentId);
    const { toast, showToast } = useToast();
    const searchRef = useRef(null);

    const [warehouses, setWarehouses] = useState([]);
    const [referenceNo, setReferenceNo] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [warehouseId, setWarehouseId] = useState('');
    const [note, setNote] = useState('');
    const [document, setDocument] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchOptions, setSearchOptions] = useState([]);
    const [stockByCode, setStockByCode] = useState({});
    const [rows, setRows] = useState([]);

    const applyRowStockBoost = useCallback((stock, rowList) => {
        const boosted = { ...stock };
        if (!isEditMode) return boosted;
        rowList.forEach((row) => {
            if (boosted[row.product_code] !== undefined) {
                boosted[row.product_code] += parseFloat(row.qty) || 0;
            }
        });
        return boosted;
    }, [isEditMode]);

    const loadWarehouseProducts = useCallback(async (id, rowList = []) => {
        if (!id) {
            setSearchOptions([]);
            setStockByCode({});
            return;
        }
        try {
            const res = await api.get(`qty_adjustment/getproduct/${id}`);
            const codes = res.data?.product_code || [];
            const names = res.data?.product_name || [];
            const qtys = res.data?.product_qty || [];
            const costs = res.data?.unit_cost || [];
            setSearchOptions(buildSearchOptions(codes, names, costs));
            const stock = {};
            codes.forEach((code, i) => {
                stock[code] = parseFloat(qtys[i]) || 0;
            });
            setStockByCode(applyRowStockBoost(stock, rowList));
        } catch {
            showToast('Failed to load warehouse products.', 'error');
            setSearchOptions([]);
            setStockByCode({});
        }
    }, [applyRowStockBoost, showToast]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                if (isEditMode) {
                    const res = await api.get(`qty_adjustment/${adjustmentId}/edit`);
                    const adjustment = res.data?.adjustment || {};
                    const lines = res.data?.lines || [];
                    setWarehouses(res.data?.warehouses || []);
                    setReferenceNo(adjustment.reference_no || '');
                    setWarehouseId(String(adjustment.warehouse_id || ''));
                    setNote(adjustment.note || '');
                    const mappedRows = lines.map((line) => mapLineToRow(line, true));
                    setRows(mappedRows);
                    await loadWarehouseProducts(adjustment.warehouse_id, mappedRows);
                } else {
                    const res = await api.get('qty_adjustment/create');
                    setWarehouses(res.data?.warehouses || []);
                }
            } catch (err) {
                showToast(err?.message || 'Failed to load form.', 'error');
                if (isEditMode) navigate('/qty_adjustment');
            } finally {
                setLoading(false);
            }
        })();
    }, [adjustmentId, isEditMode, loadWarehouseProducts, navigate, showToast]);

    const handleWarehouseChange = (id) => {
        setWarehouseId(id);
        setRows([]);
        setSearchTerm('');
        loadWarehouseProducts(id);
    };

    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const q = searchTerm.toLowerCase();
        return searchOptions.filter((opt) => opt.toLowerCase().includes(q)).slice(0, 30);
    }, [searchTerm, searchOptions]);

    const getStockQty = (row) => {
        if (row.is_batch && row.action === '-' && row.product_batch_id) {
            const batch = (row.batches || []).find(
                (b) => String(b.id) === String(row.product_batch_id)
            );
            if (batch) return parseFloat(batch.qty) || 0;
        }
        if (isEditMode) {
            return parseFloat(row.available_qty) || 0;
        }
        return row.stock_qty ?? stockByCode[row.product_code] ?? 0;
    };

    const addProductFromSearch = async (searchValue) => {
        if (!searchValue) return;
        if (!warehouseId) {
            showToast('Select a warehouse first.', 'error');
            return;
        }
        setSearchTerm('');
        setShowDropdown(false);
        try {
            const res = await api.get(
                `qty_adjustment/lims_product_search?data=${encodeURIComponent(searchValue)}&warehouse_id=${encodeURIComponent(warehouseId)}`
            );
            const payload = res.data || {};
            const data = payload.data;
            if (!data || data.length < 3) {
                showToast('Product not found.', 'error');
                return;
            }
            const [name, code, productId, variantId, unitCost, availableQty] = data;
            const isBatch = Boolean(payload.is_batch);
            const batches = payload.batches || [];
            const cost = parseFloat(unitCost) || 0;
            const stockQty = isEditMode
                ? (parseFloat(availableQty) || stockByCode[code] || 0)
                : (stockByCode[code] ?? 0);
            const defaultQty = isEditMode ? 1 : 1;

            setRows((prev) => {
                const existing = prev.find(
                    (r) =>
                        r.product_code === code
                        && (!isBatch || !r.product_batch_id)
                );
                if (existing && !isBatch) {
                    const newQty = (parseFloat(existing.qty) || 0) + 1;
                    if (newQty > getStockQty({ ...existing, available_qty: stockQty }) && existing.action === '-') {
                        showToast('Quantity exceeds stock quantity!', 'error');
                        return prev;
                    }
                    return prev.map((r) =>
                        r.product_code === code ? { ...r, qty: newQty } : r
                    );
                }
                return [
                    ...prev,
                    {
                        _id: nextRowId++,
                        product_id: productId,
                        product_code: code,
                        name,
                        unit_cost: cost,
                        available_qty: stockQty,
                        adjustment_qty: 0,
                        stock_qty: stockQty,
                        qty: defaultQty,
                        action: '-',
                        variant_id: variantId || null,
                        product_variant_id: variantId || null,
                        isExisting: false,
                        is_batch: isBatch,
                        batches,
                        product_batch_id: '',
                        batch_no: '',
                        expired_date: '',
                    },
                ];
            });
        } catch (err) {
            showToast(err?.message || 'Product lookup failed.', 'error');
        }
    };

    const handleSelectOption = (opt) => {
        addProductFromSearch(opt);
    };

    const updateRow = (id, field, value) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r._id !== id) return r;
                const updated = { ...r, [field]: value };
                if (field === 'action') {
                    if (updated.is_batch && value === '+') {
                        updated.product_batch_id = '';
                    }
                    if (updated.is_batch && value === '-') {
                        updated.batch_no = '';
                        updated.expired_date = '';
                    }
                }
                if (field === 'product_batch_id' && updated.is_batch) {
                    const batch = (updated.batches || []).find(
                        (b) => String(b.id) === String(value)
                    );
                    if (batch) {
                        updated.batch_no = batch.batch_no || '';
                        updated.expired_date = batch.expired_date || '';
                    }
                }
                if ((field === 'qty' || field === 'action' || field === 'product_batch_id') && updated.action === '-') {
                    const qty = parseFloat(updated.qty) || 0;
                    if (qty > getStockQty(updated)) {
                        showToast('Quantity exceeds stock quantity!', 'error');
                        if (field === 'qty') return r;
                    }
                }
                return updated;
            })
        );
    };

    const removeRow = (id) => setRows((prev) => prev.filter((r) => r._id !== id));

    const totalQty = useMemo(
        () => rows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0),
        [rows]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!warehouseId) {
            showToast('Warehouse is required.', 'error');
            return;
        }
        if (rows.length === 0) {
            showToast('Please insert product to order table!', 'error');
            return;
        }

        const invalidBatch = rows.find((r) => {
            if (!r.is_batch) return false;
            if (r.action === '+') {
                return !String(r.batch_no || '').trim() || !String(r.expired_date || '').trim();
            }
            return !String(r.product_batch_id || '').trim();
        });
        if (invalidBatch) {
            showToast('Batch No and Expired Date are required for batch additions; select a batch for subtractions.', 'error');
            return;
        }

        const data = new FormData();
        data.append('warehouse_id', warehouseId);
        data.append('note', note || '');
        data.append('total_qty', String(totalQty));
        data.append('item', String(rows.length));
        if (document) data.append('document', document);

        rows.forEach((r) => {
            data.append('product_id[]', r.product_id);
            data.append('product_code[]', r.product_code);
            data.append('qty[]', String(r.qty));
            data.append('unit_cost[]', String(r.unit_cost));
            data.append('action[]', r.action);
            data.append('batch_no[]', r.is_batch && r.action === '+' ? (r.batch_no || '') : '');
            data.append('expired_date[]', r.is_batch && r.action === '+' ? (r.expired_date || '') : '');
            data.append('product_batch_id[]', r.is_batch && r.action === '-' ? (r.product_batch_id || '') : '');
            if (isEditMode) {
                data.append('product_variant_id[]', r.product_variant_id ?? '');
            }
        });

        setSubmitting(true);
        try {
            if (isEditMode) {
                data.append('_method', 'PUT');
                await api.post(`qty_adjustment/${adjustmentId}`, data);
                showToast('Adjustment updated successfully.', 'success');
            } else {
                await api.post('qty_adjustment', data);
                showToast('Adjustment saved successfully.', 'success');
            }
            navigate('/qty_adjustment');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message
                || (isEditMode ? 'Failed to update adjustment.' : 'Failed to save adjustment.');
            showToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title={isEditMode ? 'Update Adjustment' : 'Add Adjustment'}>
                <div className="p-5 text-center">Loading...</div>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Inventory" title={isEditMode ? 'Update Adjustment' : 'Add Adjustment'}>
            <Toast toast={toast} />
            <form onSubmit={handleSubmit}>
                <FormSection title="Details">
                    {isEditMode && referenceNo && (
                        <FormRow>
                            <FormField label="Reference">
                                <p className="mb-0"><strong>{referenceNo}</strong></p>
                            </FormField>
                        </FormRow>
                    )}
                    <FormRow>
                        <FormField label="Warehouse" required>
                            <SelectInput
                                required
                                value={warehouseId}
                                onChange={(e) => handleWarehouseChange(e.target.value)}
                                options={[
                                    { value: '', label: 'Select warehouse...' },
                                    ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
                                ]}
                            />
                        </FormField>
                        <FormField label="Attach Document">
                            <FileInput onChange={(e) => setDocument(e.target.files?.[0] || null)} />
                        </FormField>
                    </FormRow>
                </FormSection>

                <FormSection title="Select Product">
                    <div style={{ position: 'relative', maxWidth: 640 }}>
                        <div className="input-group">
                            <span className="input-group-text">⊞</span>
                            <input
                                ref={searchRef}
                                type="text"
                                className="form-control"
                                placeholder={
                                    warehouseId
                                        ? 'Type product code and select'
                                        : 'Select a warehouse first'
                                }
                                disabled={!warehouseId}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => searchTerm && setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && filteredOptions.length === 1) {
                                        e.preventDefault();
                                        handleSelectOption(filteredOptions[0]);
                                    }
                                }}
                                autoComplete="off"
                            />
                        </div>
                        {showDropdown && filteredOptions.length > 0 && (
                            <ul
                                className="list-group position-absolute w-100 shadow-sm"
                                style={{ zIndex: 50, maxHeight: 220, overflowY: 'auto' }}
                            >
                                {filteredOptions.map((opt) => (
                                    <li
                                        key={opt}
                                        className="list-group-item list-group-item-action"
                                        style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                                        onMouseDown={() => handleSelectOption(opt)}
                                    >
                                        {opt.split('|')[0]}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </FormSection>

                <FormSection title="Order Table *">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Code</th>
                                    <th>Unit Cost</th>
                                    {isEditMode && <th>Available Qty</th>}
                                    {isEditMode && <th>Adjustment Qty</th>}
                                    <th>{isEditMode ? 'Adjust Qty' : 'Quantity'}</th>
                                    <th>Batch</th>
                                    <th>Expired</th>
                                    <th>Action</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={isEditMode ? 10 : 8} className="text-center text-muted py-4">
                                            No products — search above to add items
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((r) => (
                                        <tr key={r._id}>
                                            <td>{r.name}</td>
                                            <td>{r.product_code}</td>
                                            <td>{Number(r.unit_cost).toFixed(2)}</td>
                                            {isEditMode && (
                                                <td>{Number(r.available_qty ?? 0).toFixed(2)}</td>
                                            )}
                                            {isEditMode && (
                                                <td>{Number(r.adjustment_qty ?? 0).toFixed(2)}</td>
                                            )}
                                            <td style={{ width: 120 }}>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    min="0"
                                                    step="any"
                                                    required
                                                    value={r.qty}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            r._id,
                                                            'qty',
                                                            e.target.value === ''
                                                                ? ''
                                                                : parseFloat(e.target.value)
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td style={{ minWidth: 140 }}>
                                                {r.is_batch ? (
                                                    r.action === '+' ? (
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="Batch no"
                                                            required
                                                            value={r.batch_no || ''}
                                                            onChange={(e) =>
                                                                updateRow(r._id, 'batch_no', e.target.value)
                                                            }
                                                        />
                                                    ) : (
                                                        <select
                                                            className="form-select form-select-sm"
                                                            required
                                                            value={r.product_batch_id || ''}
                                                            onChange={(e) =>
                                                                updateRow(r._id, 'product_batch_id', e.target.value)
                                                            }
                                                        >
                                                            <option value="">Select batch…</option>
                                                            {(r.batches || []).map((b) => (
                                                                <option key={b.id} value={String(b.id)}>
                                                                    {b.batch_no} ({Number(b.qty).toFixed(2)})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                            <td style={{ minWidth: 140 }}>
                                                {r.is_batch && r.action === '+' ? (
                                                    <input
                                                        type="date"
                                                        className="form-control form-control-sm"
                                                        required
                                                        min={minExpiryDateString()}
                                                        value={r.expired_date || ''}
                                                        onChange={(e) =>
                                                            updateRow(r._id, 'expired_date', e.target.value)
                                                        }
                                                    />
                                                ) : r.is_batch && r.batch_no ? (
                                                    <span className="small">{r.expired_date || '—'}</span>
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                            <td style={{ width: 160 }}>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={r.action}
                                                    onChange={(e) =>
                                                        updateRow(r._id, 'action', e.target.value)
                                                    }
                                                >
                                                    {isEditMode && r.isExisting && r.action === '+' ? (
                                                        <>
                                                            <option value="+">Addition</option>
                                                            <option value="-">Subtraction</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="-">Subtraction</option>
                                                            <option value="+">Addition</option>
                                                        </>
                                                    )}
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => removeRow(r._id)}
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
                                    <th colSpan={isEditMode ? 7 : 5}>Total</th>
                                    <th colSpan={4}>
                                        {totalQty % 1 === 0 ? totalQty : totalQty.toFixed(2)}
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </FormSection>

                <FormSection title="Note">
                    <FormField label="Note">
                        <TextareaInput
                            rows={5}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </FormField>
                </FormSection>

                <div className="d-flex gap-2">
                    <button type="submit" className="ui-btn primary" disabled={submitting}>
                        {submitting ? 'Saving...' : (isEditMode ? 'Update' : 'Submit')}
                    </button>
                    <button
                        type="button"
                        className="ui-btn"
                        onClick={() => navigate('/qty_adjustment')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </PageLayout>
    );
}
