import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    PageLayout,
    FormRow,
    FormSection,
    FormField,
    SelectInput,
    TextInput,
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

function parseWarehouseSearchOption(opt) {
    const left = opt.split('|')[0];
    const paren = left.indexOf(' (');
    if (paren < 0) {
        return { code: left.trim(), name: '', opt };
    }
    return {
        code: left.slice(0, paren).trim(),
        name: left.slice(paren + 2).replace(/\)\s*$/, '').trim(),
        opt,
    };
}

/** Match product code first (exact, then prefix). Avoids e.g. 01936105 matching 019361051. */
function filterWarehouseProductOptions(options, term) {
    const q = term.trim().toLowerCase();
    if (!q) return [];

    const parsed = options.map(parseWarehouseSearchOption);

    const exactCode = parsed.filter((p) => p.code.toLowerCase() === q);
    if (exactCode.length) {
        return exactCode.map((p) => p.opt);
    }

    const prefixCode = parsed.filter((p) => p.code.toLowerCase().startsWith(q));
    if (prefixCode.length) {
        return prefixCode.map((p) => p.opt).slice(0, 30);
    }

    // Base code search: 90992010 → S-90992010, M-90992010, L-90992010, XL-90992010
    const suffixCode = parsed.filter(
        (p) =>
            p.code.toLowerCase().endsWith(q) ||
            p.code.toLowerCase().endsWith(`-${q}`)
    );
    if (suffixCode.length) {
        return suffixCode.map((p) => p.opt).slice(0, 30);
    }

    return parsed
        .filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q)
        )
        .map((p) => p.opt)
        .slice(0, 30);
}

function findExactWarehouseProductOption(options, term) {
    const q = term.trim().toLowerCase();
    if (!q) return null;
    return options.find((opt) => parseWarehouseSearchOption(opt).code.toLowerCase() === q) ?? null;
}

function mapLineToRow(line, isEditMode) {
    return {
        _id: nextRowId++,
        product_id: line.product_id,
        product_code: line.product_code,
        name: line.name,
        unit_cost: line.unit_cost,
        available_qty: line.available_qty ?? 0,
        previous_qty: line.previous_qty ?? line.qty ?? 0,
        stock_qty: line.available_qty ?? 0,
        qty: isEditMode ? (line.qty ?? line.previous_qty ?? 0) : (line.qty ?? 1),
        variant_id: line.variant_id ?? null,
        product_variant_id: line.product_variant_id ?? line.variant_id ?? null,
        isExisting: Boolean(isEditMode),
    };
}

export default function DamageStockForm() {
    const navigate = useNavigate();
    const { id: damageId } = useParams();
    const isEditMode = Boolean(damageId);
    const { toast, showToast } = useToast();
    const searchRef = useRef(null);

    const [warehouses, setWarehouses] = useState([]);
    const [referenceNo, setReferenceNo] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [warehouseId, setWarehouseId] = useState('');
    const [damagedAt, setDamagedAt] = useState(new Date().toISOString().slice(0, 10));
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
                boosted[row.product_code] += parseFloat(row.previous_qty) || 0;
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
            const res = await api.get(`damage-stock/getproduct/${id}`);
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
                    const res = await api.get(`damage-stock/${damageId}/edit`);
                    const damage = res.data?.damage || {};
                    const lines = res.data?.lines || [];
                    setWarehouses(res.data?.warehouses || []);
                    setReferenceNo(damage.reference_no || '');
                    setWarehouseId(String(damage.warehouse_id || ''));
                    setDamagedAt(damage.damaged_at || new Date().toISOString().slice(0, 10));
                    setNote(damage.note || '');
                    const mappedRows = lines.map((line) => mapLineToRow(line, true));
                    setRows(mappedRows);
                    await loadWarehouseProducts(damage.warehouse_id, mappedRows);
                } else {
                    const res = await api.get('damage-stock/create');
                    setWarehouses(res.data?.warehouses || []);
                    setDamagedAt(res.data?.default_damaged_at || new Date().toISOString().slice(0, 10));
                }
            } catch (err) {
                showToast(err?.message || 'Failed to load form.', 'error');
                if (isEditMode) navigate('/damage-stock');
            } finally {
                setLoading(false);
            }
        })();
    }, [damageId, isEditMode, loadWarehouseProducts, navigate, showToast]);

    const handleWarehouseChange = (id) => {
        setWarehouseId(id);
        setRows([]);
        setSearchTerm('');
        loadWarehouseProducts(id);
    };

    const filteredOptions = useMemo(
        () => filterWarehouseProductOptions(searchOptions, searchTerm),
        [searchTerm, searchOptions]
    );

    const getStockQty = (row) => {
        if (isEditMode) {
            return parseFloat(row.available_qty) || 0;
        }
        return row.stock_qty ?? stockByCode[row.product_code] ?? 0;
    };

    const addProductFromSearch = async (searchValue) => {
        if (!searchValue) return;
        setSearchTerm('');
        setShowDropdown(false);
        try {
            const res = await api.get(
                `damage-stock/lims_product_search?data=${encodeURIComponent(searchValue)}`
            );
            const data = res.data?.data;
            if (!data || data.length < 3) {
                showToast('Product not found.', 'error');
                return;
            }
            const [name, code, productId, variantId, unitCost, availableQty] = data;
            const cost = parseFloat(unitCost) || 0;
            const stockQty = isEditMode
                ? (parseFloat(availableQty) || stockByCode[code] || 0)
                : (stockByCode[code] ?? 0);

            setRows((prev) => {
                const existing = prev.find((r) => r.product_code === code);
                if (existing) {
                    const newQty = (parseFloat(existing.qty) || 0) + 1;
                    if (newQty > getStockQty({ ...existing, available_qty: stockQty })) {
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
                        previous_qty: 0,
                        stock_qty: stockQty,
                        qty: 1,
                        variant_id: variantId || null,
                        product_variant_id: variantId || null,
                        isExisting: false,
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

    const updateRowQty = (id, value) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r._id !== id) return r;
                const qty = value === '' ? '' : parseFloat(value);
                if (qty !== '' && qty > getStockQty(r)) {
                    showToast('Quantity exceeds stock quantity!', 'error');
                    return r;
                }
                return { ...r, qty };
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
        if (!damagedAt) {
            showToast('Date is required.', 'error');
            return;
        }
        if (rows.length === 0) {
            showToast('Please insert product to order table!', 'error');
            return;
        }

        const data = new FormData();
        data.append('warehouse_id', warehouseId);
        data.append('damaged_at', damagedAt);
        data.append('note', note || '');
        data.append('total_qty', String(totalQty));
        data.append('item', String(rows.length));
        if (document) data.append('document', document);

        rows.forEach((r) => {
            data.append('product_id[]', r.product_id);
            data.append('product_code[]', r.product_code);
            data.append('qty[]', String(r.qty));
            data.append('unit_cost[]', String(r.unit_cost));
            if (isEditMode) {
                data.append('product_variant_id[]', r.product_variant_id ?? '');
            }
        });

        setSubmitting(true);
        try {
            if (isEditMode) {
                await api.put(`damage-stock/${damageId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                showToast('Damage record updated successfully.', 'success');
            } else {
                await api.post('damage-stock', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                showToast('Damage record saved successfully.', 'success');
            }
            navigate('/damage-stock');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message
                || (isEditMode ? 'Failed to update damage record.' : 'Failed to save damage record.');
            showToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title={isEditMode ? 'Update Damage Stock' : 'Add Damage Stock'}>
                <div className="p-5 text-center">Loading...</div>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Product" title={isEditMode ? 'Update Damage Stock' : 'Add Damage Stock'}>
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
                        <FormField label="Date" required>
                            <TextInput
                                type="date"
                                required
                                value={damagedAt}
                                onChange={(e) => setDamagedAt(e.target.value)}
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
                                    if (e.key !== 'Enter') return;
                                    e.preventDefault();
                                    const exact = findExactWarehouseProductOption(searchOptions, searchTerm);
                                    if (exact) {
                                        handleSelectOption(exact);
                                        return;
                                    }
                                    if (filteredOptions.length === 1) {
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
                                    {isEditMode && <th>Previous Damage</th>}
                                    <th>{isEditMode ? 'Damage Qty' : 'Quantity'}</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={isEditMode ? 7 : 5} className="text-center text-muted py-4">
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
                                                <td>{Number(r.previous_qty ?? 0).toFixed(2)}</td>
                                            )}
                                            <td style={{ width: 120 }}>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    min="0"
                                                    step="any"
                                                    required
                                                    value={r.qty}
                                                    onChange={(e) => updateRowQty(r._id, e.target.value)}
                                                />
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
                                    <th colSpan={isEditMode ? 5 : 3}>Total</th>
                                    <th colSpan={2}>
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
                        onClick={() => navigate('/damage-stock')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </PageLayout>
    );
}
