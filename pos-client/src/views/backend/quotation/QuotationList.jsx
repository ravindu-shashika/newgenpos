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

const basePath =
    import.meta.env.VITE_APP_DEFAULT_PATH ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000';

function hasQuotationAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === 'quotes-index' || p.startsWith('quotes-') || p === 'quotations-index'
    );
}

function hasQuotePermission(permissions, name) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(name);
}

export default function QuotationList({ controllerName }) {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'quotations');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasQuotationAccess(authPerms);
    const canAdd = perms.canAdd || hasQuotePermission(authPerms, 'quotes-add');
    const canEdit = perms.canEdit || hasQuotePermission(authPerms, 'quotes-edit');
    const canDelete = perms.canDelete || hasQuotePermission(authPerms, 'quotes-delete');

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
    const [warehouseId, setWarehouseId] = useState('0');

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                starting_date: startingDate,
                ending_date: endingDate,
                warehouse_id: warehouseId,
                search,
            });
            const res = await api.get(`quotations?${q}`);
            setRows(res.data?.data || []);
            if (res.data?.warehouses?.length) {
                setWarehouses(res.data.warehouses);
            }
            if (typeof res.data?.show_warehouse_filter === 'boolean') {
                setShowWarehouseFilter(res.data.show_warehouse_filter);
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load quotations.', 'error');
        } finally {
            setLoading(false);
        }
    }, [startingDate, endingDate, warehouseId, search, showToast]);

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

    const handleDelete = async (id) => {
        try {
            await api.delete(`quotations/${id}`);
            showToast('Quotation deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete quotation.', 'error');
        }
    };

    const openView = async (id) => {
        setViewId(id);
        setViewLoading(true);
        setViewData(null);
        try {
            const res = await api.get(`quotations/${id}`);
            setViewData(res.data || {});
        } catch (err) {
            showToast(err?.message || 'Failed to load quotation details.', 'error');
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
        { label: 'Warehouse', key: 'warehouse_name' },
        { label: 'Biller', key: 'biller_name' },
        { label: 'Customer', key: 'customer_name' },
        { label: 'Supplier', key: 'supplier_name' },
        {
            label: 'Status',
            key: 'status',
            render: (row) => (
                <span className={`badge ${row.status_code === 1 ? 'badge-danger' : 'badge-success'}`}>
                    {row.status}
                </span>
            ),
        },
        { label: 'Grand total', key: 'grand_total', align: 'right' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    {
                        label: '📄 Generate invoice',
                        onClick: () => window.open(`${basePath}/quotations/invoice/${row.id}`, '_blank'),
                    },
                    canView && {
                        label: '👁 View',
                        onClick: () => openView(row.id),
                    },
                    canEdit && {
                        label: '✎ Edit',
                        onClick: () => navigate(`/quotations/${row.id}/edit`),
                    },
                    {
                        label: '🛒 Create sale',
                        onClick: () => navigate(`/quotations/${row.id}/create_sale`),
                    },
                    {
                        label: '🧺 Create purchase',
                        onClick: () => navigate(`/quotations/${row.id}/create_purchase`),
                    },
                    canDelete && {
                        label: '🗑 Delete',
                        danger: true,
                        onClick: () => setDeleteId(row.id),
                    },
                ].filter(Boolean);
                if (!items.length) return '—';
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

    if (!canView) {
        return (
            <PageLayout eyebrow="Quotation" title="Quotation List">
                <p className="text-muted">You do not have permission to view quotations.</p>
            </PageLayout>
        );
    }

    const q = viewData?.quotation;
    const biller = viewData?.biller;
    const customer = viewData?.customer;
    const creator = viewData?.user;

    return (
        <PageLayout eyebrow="Quotation" title="Quotation List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {canAdd && (
                    <Link to="/quotations/create" className="ui-btn primary">
                        <i className="fa fa-plus" /> Add Quotation
                    </Link>
                )}
                <TextInput
                    type="date"
                    value={startingDate}
                    onChange={(e) => { setStartingDate(e.target.value); setPage(1); }}
                />
                <TextInput
                    type="date"
                    value={endingDate}
                    onChange={(e) => { setEndingDate(e.target.value); setPage(1); }}
                />
                {showWarehouseFilter && (
                    <SelectInput
                        value={warehouseId}
                        onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
                        options={warehouseOptions}
                    />
                )}
                <TextInput
                    placeholder="Search reference, biller, customer…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                rowKey="id"
            />
            {!loading && paginated.length > 0 && (
                <p className="small text-muted text-end mt-2">
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
                title="Quotation Details"
                size="lg"
            >
                {viewLoading && <p>Loading…</p>}
                {!viewLoading && q && (
                    <>
                        <p className="small mb-3">
                            <strong>Date:</strong> {q.date}<br />
                            <strong>Reference:</strong> {q.reference_no}<br />
                            <strong>Status:</strong> {q.status}
                            {q.document && (
                                <>
                                    <br />
                                    <strong>Document:</strong>{' '}
                                    <a href={`${basePath}/documents/quotation/${q.document}`} target="_blank" rel="noreferrer">
                                        Download
                                    </a>
                                </>
                            )}
                        </p>
                        <div className="row small mb-3">
                            <div className="col-md-6">
                                <strong>From (biller)</strong><br />
                                {biller?.name}<br />
                                {biller?.company_name}<br />
                                {biller?.email}<br />
                                {biller?.phone_number}<br />
                                {biller?.address}{biller?.city ? `, ${biller.city}` : ''}
                            </div>
                            <div className="col-md-6">
                                <strong>To (customer)</strong><br />
                                {customer?.name}<br />
                                {customer?.phone_number}<br />
                                {customer?.address}{customer?.city ? `, ${customer.city}` : ''}
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
                                        <th>Unit price</th>
                                        <th>Tax</th>
                                        <th>Discount</th>
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
                                            <td>{p.unit_price}</td>
                                            <td>{p.tax} ({p.tax_rate}%)</td>
                                            <td>{p.discount}</td>
                                            <td>{p.subtotal}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan={5} className="text-end"><strong>Total</strong></td>
                                        <td>{q.total_tax}</td>
                                        <td>{q.total_discount}</td>
                                        <td>{q.total_price}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={7} className="text-end"><strong>Order tax</strong></td>
                                        <td>{q.order_tax} ({q.order_tax_rate}%)</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={7} className="text-end"><strong>Order discount</strong></td>
                                        <td>{q.order_discount}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={7} className="text-end"><strong>Shipping cost</strong></td>
                                        <td>{q.shipping_cost}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={7} className="text-end"><strong>Grand total</strong></td>
                                        <td>{q.grand_total}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {q.note && <p className="small"><strong>Note:</strong> {q.note}</p>}
                        {creator && (
                            <p className="small">
                                <strong>Created by:</strong> {creator.name}<br />
                                {creator.email}
                            </p>
                        )}
                    </>
                )}
            </Modal>

            {deleteId != null && (
                <ConfirmModal
                    title="Delete quotation?"
                    message="This action cannot be undone."
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}
            <Toast toast={toast} />
        </PageLayout>
    );
}
