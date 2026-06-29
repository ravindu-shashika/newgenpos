import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    TextInput,
    SelectInput,
    FormField,
    ConfirmModal,
    ActionMenu,
    Modal,
    Pagination,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

function hasPermission(name) {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes(name);
}

function stripHtml(html) {
    if (!html || typeof html !== 'string') return html ?? '';
    return html.replace(/<[^>]*>/g, '').trim();
}

function defaultYearAgo() {
    return new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
}

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

async function postForm(endpoint, payload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
    });
    const res = await api.post(endpoint, formData);
    return res.data ?? {};
}

export default function ProductionList() {
    const { showToast } = useToast();
    const canAdd = hasPermission('production-add');
    const canDelete = hasPermission('production-delete');

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [viewRow, setViewRow] = useState(null);
    const [viewLines, setViewLines] = useState([]);
    const [viewInfo, setViewInfo] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const [startingDate, setStartingDate] = useState(defaultYearAgo());
    const [endingDate, setEndingDate] = useState(todayIso());
    const [warehouseId, setWarehouseId] = useState('0');
    const [status, setStatus] = useState('0');
    const [warehouses, setWarehouses] = useState([]);
    const [showWarehouseFilter, setShowWarehouseFilter] = useState(false);

    useEffect(() => {
        const loadMeta = async () => {
            try {
                const res = await api.get('manufacturing/productions');
                const data = res.data ?? {};
                setStartingDate(data.starting_date || defaultYearAgo());
                setEndingDate(data.ending_date || todayIso());
                setWarehouseId(String(data.warehouse_id ?? '0'));
                setStatus(String(data.status ?? '0'));
                setWarehouses(Array.isArray(data.warehouses) ? data.warehouses : []);
                setShowWarehouseFilter(Boolean(data.show_warehouse_filter));
            } catch (err) {
                showToast(err?.message || 'Failed to load production filters.', 'error');
            }
        };
        loadMeta();
    }, [showToast]);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const data = await postForm('manufacturing/productions/production-data', {
                starting_date: startingDate,
                ending_date: endingDate,
                warehouse_id: warehouseId,
                status,
                start: page * size,
                length: size,
                draw: 1,
                'order[0][column]': 1,
                'order[0][dir]': 'desc',
                'search[value]': search,
            });
            setRows(Array.isArray(data.data) ? data.data : []);
            setTotalRecords(Number(data.recordsFiltered ?? 0));
        } catch (err) {
            showToast(err?.message || 'Failed to load productions.', 'error');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [startingDate, endingDate, warehouseId, status, page, size, search, showToast]);

    useEffect(() => {
        const t = setTimeout(fetchRows, 300);
        return () => clearTimeout(t);
    }, [fetchRows]);

    useEffect(() => {
        setPage(0);
    }, [startingDate, endingDate, warehouseId, status, search, size]);

    const openView = async (row) => {
        setViewRow(row);
        setViewLoading(true);
        setViewLines([]);
        setViewInfo(null);
        try {
            const res = await api.get(`manufacturing/productions/product_production/${row.id}`);
            const payload = res.data ?? {};
            setViewLines(Array.isArray(payload.data) ? payload.data : []);
            setViewInfo(payload.production_info ?? null);
        } catch (err) {
            showToast(err?.message || 'Failed to load production details.', 'error');
        } finally {
            setViewLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`manufacturing/productions/${id}`);
            showToast('Production deleted.', 'success');
            setDeleteId(null);
            fetchRows();
        } catch (err) {
            showToast(err?.message || 'Failed to delete production.', 'error');
        }
    };

    const warehouseOptions = useMemo(
        () => [
            { value: '0', label: 'All Warehouse' },
            ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
        ],
        [warehouses]
    );

    const columns = [
        { key: 'date', label: 'Date' },
        { key: 'reference_no', label: 'Reference' },
        {
            key: 'status',
            label: 'Status',
            render: (row) => stripHtml(String(row.status ?? '')) || '—',
        },
        { key: 'product', label: 'Product' },
        { key: 'warehouse', label: 'Warehouse' },
        { key: 'quantity', label: 'Qty', align: 'right' },
        { key: 'grand_total', label: 'Grand Total', align: 'right' },
        {
            key: 'actions',
            label: 'Action',
            render: (row) => {
                const items = [
                    { label: '👁 View', onClick: () => openView(row) },
                ];
                if (canDelete) {
                    items.push({ divider: true });
                    items.push({
                        label: '🗑 Delete',
                        danger: true,
                        onClick: () => setDeleteId(row.id),
                    });
                }
                return (
                    <ActionMenu
                        id={row.id}
                        openId={openMenu}
                        setOpenId={setOpenMenu}
                        items={items}
                    />
                );
            },
        },
    ];

    const totalPages = Math.max(1, Math.ceil(totalRecords / size) || 1);

    return (
        <PageLayout title="Production List">
            <div className="d-flex flex-wrap gap-2 mb-3">
                {canAdd && (
                    <Link to="/manufacturing/productions/create" className="ui-btn primary">
                        Add Production
                    </Link>
                )}
                <button type="button" className="ui-btn secondary" onClick={() => setShowFilters((v) => !v)}>
                    Filter
                </button>
            </div>

            {showFilters && (
                <div className="ui-form-grid two mb-3">
                    <FormField label="From">
                        <TextInput type="date" value={startingDate} onChange={(e) => setStartingDate(e.target.value)} />
                    </FormField>
                    <FormField label="To">
                        <TextInput type="date" value={endingDate} onChange={(e) => setEndingDate(e.target.value)} />
                    </FormField>
                    {showWarehouseFilter && (
                        <FormField label="Warehouse">
                            <SelectInput value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} options={warehouseOptions} />
                        </FormField>
                    )}
                    <FormField label="Status">
                        <SelectInput
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            options={[
                                { value: '0', label: 'All' },
                                { value: '1', label: 'Completed' },
                            ]}
                        />
                    </FormField>
                    <FormField label="Search">
                        <TextInput placeholder="Reference, product, date…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </FormField>
                </div>
            )}

            <DataTable columns={columns} rows={rows} loading={loading} emptyText="No productions found." />

            <Pagination
                page={page + 1}
                totalPages={totalPages}
                pageSize={size}
                totalRows={totalRecords}
                onChange={(next) => setPage(next - 1)}
                pageSizes={[10, 25, 50, 100]}
                onPageSize={(nextSize) => { setSize(nextSize); setPage(0); }}
            />

            {deleteId != null && (
                <ConfirmModal
                    title="Delete production"
                    message="Delete this production? Stock will be reversed."
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {viewRow && (
                <Modal
                    title="Production Details"
                    onClose={() => setViewRow(null)}
                    size="lg"
                    hideHint
                    footer={
                        <button type="button" className="ui-btn ghost" onClick={() => setViewRow(null)}>
                            Close
                        </button>
                    }
                >
                    <dl className="mb-3" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 12px', fontSize: '0.9rem' }}>
                        <dt>Date</dt><dd>{viewRow.date}</dd>
                        <dt>Reference</dt><dd>{viewRow.reference_no}</dd>
                        <dt>Product</dt><dd>{viewRow.product}</dd>
                        <dt>Warehouse</dt><dd>{viewRow.warehouse}</dd>
                        <dt>Quantity</dt><dd>{viewRow.quantity}</dd>
                        <dt>Grand Total</dt><dd>{viewRow.grand_total}</dd>
                        {viewInfo && (
                            <>
                                <dt>Shipping</dt><dd>{viewInfo.shipping_cost ?? '—'}</dd>
                                <dt>Production Cost</dt><dd>{viewInfo.production_cost ?? '—'}</dd>
                            </>
                        )}
                    </dl>

                    {viewLoading ? (
                        <p className="text-muted">Loading ingredients…</p>
                    ) : (
                        <DataTable
                            columns={[
                                { key: 'name', label: 'Product', render: (r) => `${r.name} [${r.code}]` },
                                { key: 'wastage_percent', label: 'Wastage %', align: 'right' },
                                { key: 'qty', label: 'Qty', align: 'right' },
                                { key: 'unit_name', label: 'Unit' },
                                { key: 'unit_price', label: 'Price', align: 'right' },
                                { key: 'subtotal', label: 'Subtotal', align: 'right' },
                            ]}
                            rows={viewLines}
                            rowKey="id"
                            emptyText="No ingredient lines."
                        />
                    )}
                </Modal>
            )}
        </PageLayout>
    );
}
