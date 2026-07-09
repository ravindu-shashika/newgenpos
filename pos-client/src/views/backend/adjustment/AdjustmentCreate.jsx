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
    PermissionDenied,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

let nextRowId = 1;

function buildSearchCatalog(codes, names, costs, productIds = [], isVariants = [], variantLabels = []) {
    const singles = [];
    const variantGroups = new Map();

    for (let i = 0; i < codes.length; i += 1) {
        const item = {
            code: codes[i],
            name: names[i],
            cost: costs[i],
            productId: productIds[i] ?? null,
            isVariant: Boolean(isVariants[i]),
            variantLabel: variantLabels[i] || '',
            opt: `${codes[i]} (${names[i]})|${costs[i]}`,
        };

        if (!item.isVariant || !item.productId) {
            singles.push({
                type: 'single',
                key: `single:${item.code}`,
                display: `${item.code} — ${item.name}`,
                ...item,
            });
            continue;
        }

        if (!variantGroups.has(item.productId)) {
            variantGroups.set(item.productId, {
                type: 'variant_group',
                key: `group:${item.productId}`,
                productId: item.productId,
                name: item.name,
                cost: item.cost,
                codes: [],
                labels: [],
                opts: [],
            });
        }

        const group = variantGroups.get(item.productId);
        group.codes.push(item.code);
        group.labels.push(item.variantLabel || item.code);
        group.opts.push(item.opt);
    }

    const grouped = [];
    variantGroups.forEach((group) => {
        const preview = group.labels.slice(0, 4).join(', ');
        const suffix = group.labels.length > 4 ? '…' : '';
        grouped.push({
            ...group,
            display: `${group.name} — ${preview}${suffix} (${group.codes.length} variants)`,
        });
    });

    return [...grouped, ...singles];
}

function filterSearchCatalog(catalog, term) {
    const q = term.trim().toLowerCase();
    if (!q) return [];

    const exactSingle = catalog.find(
        (item) => item.type === 'single' && item.code.toLowerCase() === q
    );
    if (exactSingle) return [exactSingle];

    const exactGroup = catalog.find(
        (item) => item.type === 'variant_group'
            && item.codes.some((code) => code.toLowerCase() === q)
    );
    if (exactGroup) return [exactGroup];

    const prefixMatches = catalog.filter((item) => {
        if (item.type === 'single') {
            return item.code.toLowerCase().startsWith(q);
        }
        return item.codes.some((code) => code.toLowerCase().startsWith(q));
    });
    if (prefixMatches.length) return prefixMatches.slice(0, 30);

    const suffixMatches = catalog.filter((item) => {
        if (item.type === 'single') {
            const code = item.code.toLowerCase();
            return code.endsWith(q) || code.endsWith(`-${q}`);
        }
        return item.codes.some((code) => {
            const lower = code.toLowerCase();
            return lower.endsWith(q) || lower.endsWith(`-${q}`);
        });
    });
    if (suffixMatches.length) return suffixMatches.slice(0, 30);

    return catalog
        .filter((item) => {
            if (item.type === 'single') {
                return item.name.toLowerCase().includes(q)
                    || item.code.toLowerCase().includes(q);
            }
            return item.name.toLowerCase().includes(q)
                || item.codes.some((code) => code.toLowerCase().includes(q))
                || item.labels.some((label) => String(label).toLowerCase().includes(q));
        })
        .slice(0, 30);
}

function findExactSearchCatalogItem(catalog, term) {
    const q = term.trim().toLowerCase();
    if (!q) return null;

    const exactSingle = catalog.find(
        (item) => item.type === 'single' && item.code.toLowerCase() === q
    );
    if (exactSingle) return exactSingle;

    return catalog.find(
        (item) => item.type === 'variant_group'
            && item.codes.some((code) => code.toLowerCase() === q)
    ) ?? null;
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
        variant_label: line.variant_label ?? '',
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

export default function AdjustmentCreate({ controllerName }) {
    const navigate = useNavigate();
    const { id: adjustmentId } = useParams();
    const isEditMode = Boolean(adjustmentId);
    const { toast, showToast } = useToast();
    const searchRef = useRef(null);
    const permsPrimary = usePermissions(controllerName || 'qty_adjustment');
    const permsAlt = usePermissions('adjustment');
    const canAdd = permsPrimary.canAdd || permsAlt.canAdd;
    const canEdit = permsPrimary.canEdit || permsAlt.canEdit;

    if (isEditMode && !canEdit) {
        return <PermissionDenied action="edit adjustments" />;
    }
    if (!isEditMode && !canAdd) {
        return <PermissionDenied action="add adjustments" />;
    }

    const [warehouses, setWarehouses] = useState([]);
    const [referenceNo, setReferenceNo] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [warehouseId, setWarehouseId] = useState('');
    const [note, setNote] = useState('');
    const [document, setDocument] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchCatalog, setSearchCatalog] = useState([]);
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
            setSearchCatalog([]);
            setStockByCode({});
            return;
        }
        try {
            const res = await api.get(`qty_adjustment/getproduct/${id}`);
            const codes = res.data?.product_code || [];
            const names = res.data?.product_name || [];
            const qtys = res.data?.product_qty || [];
            const costs = res.data?.unit_cost || [];
            const productIds = res.data?.product_id || [];
            const isVariants = res.data?.is_variant || [];
            const variantLabels = res.data?.variant_label || [];
            setSearchCatalog(buildSearchCatalog(
                codes,
                names,
                costs,
                productIds,
                isVariants,
                variantLabels,
            ));
            const stock = {};
            codes.forEach((code, i) => {
                stock[code] = parseFloat(qtys[i]) || 0;
            });
            setStockByCode(applyRowStockBoost(stock, rowList));
        } catch {
            showToast('Failed to load warehouse products.', 'error');
            setSearchCatalog([]);
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

    const filteredOptions = useMemo(
        () => filterSearchCatalog(searchCatalog, searchTerm),
        [searchTerm, searchCatalog]
    );

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

    const buildRowFromSearchData = (data, payload, variantLabel = '') => {
        const [name, code, productId, variantId, unitCost, availableQty] = data;
        const isBatch = Boolean(payload.is_batch);
        const batches = payload.batches || [];
        const cost = parseFloat(unitCost) || 0;
        const stockQty = isEditMode
            ? (parseFloat(availableQty) || stockByCode[code] || 0)
            : (stockByCode[code] ?? (parseFloat(availableQty) || 0));

        return {
            _id: nextRowId++,
            product_id: productId,
            product_code: code,
            name,
            unit_cost: cost,
            available_qty: stockQty,
            adjustment_qty: 0,
            stock_qty: stockQty,
            qty: 1,
            action: '-',
            variant_id: variantId || null,
            product_variant_id: variantId || null,
            variant_label: variantLabel,
            isExisting: false,
            is_batch: isBatch,
            batches,
            product_batch_id: '',
            batch_no: '',
            expired_date: '',
        };
    };

    const addVariantsToGrid = (variants, productName) => {
        if (!variants?.length) {
            showToast('No variants found for this product.', 'warning');
            return;
        }

        setRows((prev) => {
            const next = [...prev];
            let added = 0;

            variants.forEach((variantPayload) => {
                const data = variantPayload.data;
                if (!data || data.length < 3) return;

                const code = data[1];
                const exists = next.find(
                    (row) => row.product_code === code
                        && (!variantPayload.is_batch || !row.product_batch_id)
                );
                if (exists) return;

                next.push(buildRowFromSearchData(
                    data,
                    variantPayload,
                    variantPayload.variant_label || '',
                ));
                added += 1;
            });

            if (added === 0) {
                showToast('All variants for this product are already in the table.', 'info');
            } else {
                showToast(
                    `Added ${added} variant${added === 1 ? '' : 's'} for ${productName || 'product'}.`,
                    'success',
                );
            }

            return next;
        });
        setTimeout(() => searchRef.current?.focus(), 0);
    };

    const addProductFromSearch = async (searchValue, catalogItem = null) => {
        if (!warehouseId) {
            showToast('Select a warehouse first.', 'error');
            return;
        }
        setSearchTerm('');
        setShowDropdown(false);

        try {
            let url;
            if (catalogItem?.type === 'variant_group') {
                url = `qty_adjustment/lims_product_search?product_id=${encodeURIComponent(catalogItem.productId)}&warehouse_id=${encodeURIComponent(warehouseId)}&unit_cost=${encodeURIComponent(catalogItem.cost)}&expand_variants=1`;
            } else if (searchValue) {
                url = `qty_adjustment/lims_product_search?data=${encodeURIComponent(searchValue)}&warehouse_id=${encodeURIComponent(warehouseId)}&expand_variants=1`;
            } else {
                return;
            }

            const res = await api.get(url);
            const payload = res.data || {};

            if (payload.expand_variants && Array.isArray(payload.variants)) {
                addVariantsToGrid(payload.variants, payload.product_name);
                return;
            }

            const data = payload.data;
            if (!data || data.length < 3) {
                showToast('Product not found.', 'error');
                return;
            }

            const [name, code] = data;
            const isBatch = Boolean(payload.is_batch);

            setRows((prev) => {
                const existing = prev.find(
                    (r) =>
                        r.product_code === code
                        && (!isBatch || !r.product_batch_id)
                );
                if (existing && !isBatch) {
                    const newQty = (parseFloat(existing.qty) || 0) + 1;
                    if (newQty > getStockQty({ ...existing }) && existing.action === '-') {
                        showToast('Quantity exceeds stock quantity!', 'error');
                        return prev;
                    }
                    return prev.map((r) =>
                        r.product_code === code ? { ...r, qty: newQty } : r
                    );
                }
                return [...prev, buildRowFromSearchData(data, payload)];
            });
            setTimeout(() => searchRef.current?.focus(), 0);
        } catch (err) {
            showToast(err?.message || 'Product lookup failed.', 'error');
        }
    };

    const handleSelectOption = (item) => {
        if (item.type === 'variant_group') {
            addProductFromSearch(null, item);
            return;
        }
        addProductFromSearch(item.opt);
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
                                        ? 'Scan barcode or type product code'
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
                                    const exact = findExactSearchCatalogItem(
                                        searchCatalog,
                                        searchTerm
                                    );
                                    if (exact) {
                                        handleSelectOption(exact);
                                        return;
                                    }
                                    if (filteredOptions.length === 1) {
                                        handleSelectOption(filteredOptions[0]);
                                        return;
                                    }
                                    if (searchTerm.trim()) {
                                        showToast('Product not found.', 'error');
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
                                {filteredOptions.map((item) => (
                                    <li
                                        key={item.key}
                                        className="list-group-item list-group-item-action"
                                        style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                                        onMouseDown={() => handleSelectOption(item)}
                                    >
                                        {item.display}
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
                                    <th>Variant</th>
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
                                        <td colSpan={isEditMode ? 11 : 9} className="text-center text-muted py-4">
                                            No products — search above to add items
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((r) => (
                                        <tr key={r._id}>
                                            <td>{r.name}</td>
                                            <td>{r.variant_label || '—'}</td>
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
                                    <th colSpan={isEditMode ? 8 : 6}>Total</th>
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
