import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    FormField,
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

function hasReturnAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'returns-index' ||
            p === 'returns-view' ||
            p === 'returns.view' ||
            p.startsWith('returns.')
    );
}

export default function ReturnSaleList({ controllerName }) {
    const { toast, showToast } = useToast();
    const ctrl = controllerName || 'returns';
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasReturnAccess(authPerms);
    const canAdd = perms.canAdd || authPerms.some((p) => /returns-add|returns-create/.test(p));
    const canEdit = perms.canEdit || authPerms.some((p) => /returns-edit|returns-update/.test(p));
    const canDelete = perms.canDelete || authPerms.some((p) => /returns-delete|returns-destroy/.test(p));

    const [rows, setRows] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [showWarehouseFilter, setShowWarehouseFilter] = useState(true);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [refModalOpen, setRefModalOpen] = useState(false);
    const [saleRef, setSaleRef] = useState('');
    const [viewId, setViewId] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const today = new Date().toISOString().slice(0, 10);
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [startingDate, setStartingDate] = useState(yearAgo);
    const [endingDate, setEndingDate] = useState(today);
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
            const res = await api.get(`return-sale?${q}`);
            setRows(res.data?.data || []);
            if (res.data?.warehouses?.length) {
                setWarehouses(res.data.warehouses);
            }
            if (typeof res.data?.show_warehouse_filter === 'boolean') {
                setShowWarehouseFilter(res.data.show_warehouse_filter);
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load sale returns.', 'error');
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

    const openLegacy = (path) => {
        window.open(`${basePath}${path}`, '_blank', 'noopener,noreferrer');
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`return-sale/${id}`);
            showToast('Sale return deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete sale return.', 'error');
        }
    };

    const openView = async (id) => {
        setViewId(id);
        setViewLoading(true);
        setViewData(null);
        try {
            const res = await api.get(`return-sale/${id}`);
            setViewData(res.data || {});
        } catch (err) {
            showToast(err?.message || 'Failed to load return details.', 'error');
            setViewId(null);
        } finally {
            setViewLoading(false);
        }
    };

    const startCreate = () => {
        const ref = saleRef.trim();
        if (!ref) {
            showToast('Sale reference is required.', 'error');
            return;
        }
        setRefModalOpen(false);
        openLegacy(`/return-sale/create?reference_no=${encodeURIComponent(ref)}`);
    };

    const warehouseOptions = [
        { value: '0', label: 'All warehouses' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ];

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'Sale reference', key: 'sale_reference' },
        { label: 'Warehouse', key: 'warehouse_name' },
        { label: 'Biller', key: 'biller_name' },
        { label: 'Customer', key: 'customer_name' },
        { label: 'Grand total', key: 'grand_total', align: 'right' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canView && {
                        label: '👁 View',
                        onClick: () => openView(row.id),
                    },
                    canEdit && {
                        label: '✎ Edit',
                        onClick: () => openLegacy(`/return-sale/${row.id}/edit`),
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
            <PageLayout eyebrow="Sale" title="Sale Return List">
                <p className="text-muted">You do not have permission to view sale returns.</p>
            </PageLayout>
        );
    }

    const ret = viewData?.return;
    const wh = viewData?.warehouse;
    const biller = viewData?.biller;
    const customer = viewData?.customer;

    return (
        <PageLayout eyebrow="Sale" title="Sale Return List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {canAdd && (
                    <button type="button" className="ui-btn primary" onClick={() => setRefModalOpen(true)}>
                        <i className="fa fa-plus" /> Add Return
                    </button>
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
                    placeholder="Search reference, customer, biller, sale…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <DataTable columns={columns} rows={paginated} loading={loading} rowKey="id" emptyText="No sale returns found." />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize === -1 ? rows.length || 10 : pageSize}
                totalRows={rows.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            <Modal isOpen={refModalOpen} onClose={() => setRefModalOpen(false)} title="Add Sale Return">
                <p className="text-muted small mb-3">Enter the sale reference number to return items from that order.</p>
                <FormField label="Sale Reference *">
                    <TextInput
                        value={saleRef}
                        onChange={(e) => setSaleRef(e.target.value)}
                        placeholder="e.g. sr-20250604-123456"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), startCreate())}
                    />
                </FormField>
                <div className="d-flex gap-2 mt-3">
                    <button type="button" className="ui-btn primary" onClick={startCreate}>Submit</button>
                    <button type="button" className="ui-btn" onClick={() => setRefModalOpen(false)}>Cancel</button>
                </div>
            </Modal>

            <Modal isOpen={!!viewId} onClose={() => { setViewId(null); setViewData(null); }} title="Sale Return Details" size="lg">
                {viewLoading && <p>Loading…</p>}
                {!viewLoading && ret && (
                    <>
                        <p className="small mb-3">
                            <strong>Date:</strong> {ret.date}<br />
                            <strong>Reference:</strong> {ret.reference_no}<br />
                            <strong>Sale Reference:</strong> {ret.sale_reference}<br />
                            <strong>Currency:</strong> {ret.currency_code}
                            {ret.exchange_rate ? (
                                <>
                                    <br />
                                    <strong>Exchange Rate:</strong> {ret.exchange_rate}
                                </>
                            ) : null}
                            {ret.document && (
                                <>
                                    <br />
                                    <strong>Document:</strong>{' '}
                                    <a href={`${basePath}/documents/sale_return/${ret.document}`} target="_blank" rel="noreferrer">Download</a>
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
                        <p className="small mb-2">
                            <strong>Warehouse:</strong> {wh?.name}
                            {wh?.phone ? ` · ${wh.phone}` : ''}
                            {wh?.address ? ` · ${wh.address}` : ''}
                        </p>
                        <div className="table-responsive">
                            <table className="table table-bordered table-sm">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Batch</th>
                                        <th>Qty</th>
                                        <th>Unit Price</th>
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
                                        <td>{ret.total_tax}</td>
                                        <td>{ret.total_discount}</td>
                                        <td>{ret.total_price}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={7} className="text-end"><strong>Order Tax</strong></td>
                                        <td>{ret.order_tax} ({ret.order_tax_rate}%)</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={7} className="text-end"><strong>Grand Total</strong></td>
                                        <td>{ret.grand_total}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {ret.return_note && <p className="small"><strong>Return Note:</strong> {ret.return_note}</p>}
                        {ret.staff_note && <p className="small"><strong>Staff Note:</strong> {ret.staff_note}</p>}
                    </>
                )}
            </Modal>

            {deleteId != null && (
                <ConfirmModal
                    title="Delete sale return"
                    message="Delete this return? Stock and sale quantities will be reversed. This cannot be undone."
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
