import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    ConfirmModal,
    TextInput,
    SelectInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    Modal,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

const basePath =
    import.meta.env.VITE_APP_DEFAULT_PATH ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000';

function toLocalDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function addLocalDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return toLocalDateString(next);
}

function hasTransferAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === 'transfers-index' || p.startsWith('transfers-') || p === 'transfers-index'
    );
}

function hasTransferPermission(permissions, name) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(name);
}

function statusBadgeClass(code) {
    if (code === 1) return 'badge-success';
    if (code === 2) return 'badge-danger';
    if (code === 3) return 'badge-warning';
    return 'badge-secondary';
}

export default function TransferList({ controllerName }) {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'transfers');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasTransferAccess(authPerms);
    const canAdd = perms.canAdd || hasTransferPermission(authPerms, 'transfers-add');
    const canEdit = perms.canEdit || hasTransferPermission(authPerms, 'transfers-edit');
    const canDelete = perms.canDelete || hasTransferPermission(authPerms, 'transfers-delete');

    const [rows, setRows] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [showWarehouseFilter, setShowWarehouseFilter] = useState(true);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [viewId, setViewId] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const yearAgo = addLocalDays(new Date(), -365);
    const [startingDate, setStartingDate] = useState(yearAgo);
    const [endingDate, setEndingDate] = useState(addLocalDays(new Date(), 1));
    const [fromWarehouseId, setFromWarehouseId] = useState('0');
    const [toWarehouseId, setToWarehouseId] = useState('0');

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                starting_date: startingDate,
                ending_date: endingDate,
                from_warehouse_id: fromWarehouseId,
                to_warehouse_id: toWarehouseId,
                search,
            });
            const res = await api.get(`transfers?${q}`);
            setRows(res.data?.data || []);
            if (res.data?.warehouses?.length) {
                setWarehouses(res.data.warehouses);
            }
            if (typeof res.data?.show_warehouse_filter === 'boolean') {
                setShowWarehouseFilter(res.data.show_warehouse_filter);
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load transfers.', 'error');
        } finally {
            setLoading(false);
        }
    }, [startingDate, endingDate, fromWarehouseId, toWarehouseId, search, showToast]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return rows;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const grandTotalSum = useMemo(
        () => paginated.reduce((sum, row) => sum + parseFloat(row.grand_total || 0), 0),
        [paginated]
    );

    const shippingSum = useMemo(
        () => paginated.reduce((sum, row) => sum + parseFloat(row.shipping_cost || 0), 0),
        [paginated]
    );

    const handleDelete = async (id) => {
        try {
            await api.delete(`transfers/${id}`);
            showToast('Transfer deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete transfer.', 'error');
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.put(`transfers/${id}/approve`, { status: 1 });
            showToast('Transfer approved.', 'success');
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to approve transfer.', 'error');
        }
    };

    const openView = async (id) => {
        setViewId(id);
        setViewLoading(true);
        setViewData(null);
        try {
            const res = await api.get(`transfers/${id}`);
            setViewData(res.data || {});
        } catch (err) {
            showToast(err?.message || 'Failed to load transfer details.', 'error');
            setViewId(null);
        } finally {
            setViewLoading(false);
        }
    };

    const warehouseOptions = [
        { value: '0', label: 'All warehouses' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ];

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'From warehouse', key: 'from_warehouse_name' },
        { label: 'To warehouse', key: 'to_warehouse_name' },
        { label: 'Shipping cost', key: 'shipping_cost', align: 'right' },
        { label: 'Grand total', key: 'grand_total', align: 'right' },
        {
            label: 'Status',
            key: 'status',
            render: (row) => (
                <span className={`badge ${statusBadgeClass(row.status_code)}`}>{row.status}</span>
            ),
        },
        {
            label: 'Email sent',
            key: 'is_sent',
            render: (row) => (
                <span className={`badge ${row.is_sent_code === 1 ? 'badge-success' : 'badge-danger'}`}>
                    {row.is_sent}
                </span>
            ),
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canView && {
                        label: '👁 View',
                        onClick: () => openView(row.id),
                    },
                    row.can_approve && {
                        label: '✓ Approve',
                        onClick: () => handleApprove(row.id),
                    },
                    canEdit && {
                        label: '✎ Edit',
                        onClick: () => navigate(`/transfers/${row.id}/edit`),
                    },
                    canDelete && {
                        label: '🗑 Delete',
                        onClick: () => setDeleteId(row.id),
                    },
                ].filter(Boolean);

                return (
                    <ActionMenu
                        open={openMenu === row.id}
                        onToggle={() => setOpenMenu(openMenu === row.id ? null : row.id)}
                        items={items}
                    />
                );
            },
        },
    ];

    if (!canView) {
        return (
            <PageLayout title="Transfer List">
                <p>You do not have permission to view transfers.</p>
            </PageLayout>
        );
    }

    const t = viewData?.transfer;
    const fromWh = viewData?.from_warehouse;
    const toWh = viewData?.to_warehouse;

    return (
        <PageLayout title="Transfer List">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-end">
                {canAdd && (
                    <Link to="/transfers/create" className="ui-btn primary">
                        + Add Transfer
                    </Link>
                )}
                <Link to="/transfers/transfer_by_csv" className="ui-btn">
                    Import CSV
                </Link>
            </div>

            <div className="row g-2 mb-3">
                <div className="col-md-3">
                    <label className="form-label small">From date</label>
                    <input
                        type="date"
                        className="ui-input"
                        value={startingDate}
                        onChange={(e) => { setStartingDate(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="col-md-3">
                    <label className="form-label small">To date</label>
                    <input
                        type="date"
                        className="ui-input"
                        value={endingDate}
                        onChange={(e) => { setEndingDate(e.target.value); setPage(1); }}
                    />
                </div>
                {showWarehouseFilter && (
                    <>
                        <div className="col-md-3">
                            <label className="form-label small">From warehouse</label>
                            <SelectInput
                                value={fromWarehouseId}
                                onChange={(e) => { setFromWarehouseId(e.target.value); setPage(1); }}
                                options={warehouseOptions}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small">To warehouse</label>
                            <SelectInput
                                value={toWarehouseId}
                                onChange={(e) => { setToWarehouseId(e.target.value); setPage(1); }}
                                options={warehouseOptions}
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="mb-3">
                <TextInput
                    placeholder="Search reference or warehouse…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <DataTable columns={columns} rows={paginated} loading={loading} rowKey="id" />
            {!loading && paginated.length > 0 && (
                <p className="small text-muted text-end mt-2">
                    Page shipping: <strong>{shippingSum.toFixed(2)}</strong>
                    {' · '}
                    Page total: <strong>{grandTotalSum.toFixed(2)}</strong>
                </p>
            )}
            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize === -1 ? rows.length || 10 : pageSize}
                totalRows={rows.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            <Modal
                isOpen={!!viewId}
                onClose={() => { setViewId(null); setViewData(null); }}
                title="Transfer Details"
                size="lg"
            >
                {viewLoading && <p>Loading…</p>}
                {!viewLoading && t && (
                    <>
                        <p className="small mb-3">
                            <strong>Date:</strong> {t.date}<br />
                            <strong>Reference:</strong> {t.reference_no}<br />
                            <strong>Status:</strong> {t.status}<br />
                            <strong>Email sent:</strong> {t.is_sent ? 'Yes' : 'No'}
                            {t.document && (
                                <>
                                    <br />
                                    <strong>Document:</strong>{' '}
                                    <a href={`${basePath}/documents/transfer/${t.document}`} target="_blank" rel="noreferrer">
                                        Download
                                    </a>
                                </>
                            )}
                        </p>
                        <div className="row small mb-3">
                            <div className="col-md-6">
                                <strong>From</strong><br />
                                {fromWh?.name}<br />
                                {fromWh?.phone}<br />
                                {fromWh?.address}
                            </div>
                            <div className="col-md-6">
                                <strong>To</strong><br />
                                {toWh?.name}<br />
                                {toWh?.phone}<br />
                                {toWh?.address}
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-bordered table-sm">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Batch</th>
                                        <th>Qty</th>
                                        <th>Unit cost</th>
                                        <th>Tax</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(viewData.products || []).map((p, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{p.name}</td>
                                            <td>{p.batch_no}</td>
                                            <td>{p.qty} {p.unit}</td>
                                            <td>{p.unit_cost}</td>
                                            <td>{p.tax} ({p.tax_rate}%)</td>
                                            <td>{p.subtotal}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan={5} className="text-end"><strong>Total tax</strong></td>
                                        <td>{t.total_tax}</td>
                                        <td>{t.total_cost}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5} className="text-end"><strong>Shipping</strong></td>
                                        <td colSpan={2}>{t.shipping_cost}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5} className="text-end"><strong>Grand total</strong></td>
                                        <td colSpan={2}>{t.grand_total}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {t.note && (
                            <p className="small mt-2"><strong>Note:</strong> {t.note}</p>
                        )}
                        {viewData.user && (
                            <p className="small text-muted">
                                Created by {viewData.user.name}
                                {viewData.user.email ? ` (${viewData.user.email})` : ''}
                            </p>
                        )}
                    </>
                )}
            </Modal>

            {deleteId != null && (
                <ConfirmModal
                    title="Delete transfer"
                    message="Are you sure you want to delete this transfer?"
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </PageLayout>
    );
}
