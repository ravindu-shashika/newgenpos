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

function hasPurchaseReturnAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'returns-index' ||
            p === 'purchase-return-index' ||
            p === 'purchase-returns-view' ||
            p.startsWith('purchase-return') ||
            p.startsWith('purchase-returns')
    );
}

export default function ReturnPurchaseList({ controllerName }) {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'return-purchase');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasPurchaseReturnAccess(authPerms);
    const canAdd = perms.canAdd || authPerms.some((p) => /purchase-return.*add|purchase-returns-create|returns-add/.test(p));
    const canEdit = perms.canEdit || authPerms.some((p) => /returns-edit|purchase-return.*edit|purchase-returns-edit/.test(p));
    const canDelete = perms.canDelete || authPerms.some((p) => /returns-delete|purchase-return.*delete|purchase-returns-delete/.test(p));

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
    const [purchaseRef, setPurchaseRef] = useState('');
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
            const res = await api.get(`return-purchase?${q}`);
            setRows(res.data?.data || []);
            if (res.data?.warehouses?.length) {
                setWarehouses(res.data.warehouses);
            }
            if (typeof res.data?.show_warehouse_filter === 'boolean') {
                setShowWarehouseFilter(res.data.show_warehouse_filter);
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load purchase returns.', 'error');
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

    const handleDelete = async (id) => {
        try {
            await api.delete(`return-purchase/${id}`);
            showToast('Purchase return deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete purchase return.', 'error');
        }
    };

    const openView = async (id) => {
        setViewId(id);
        setViewLoading(true);
        setViewData(null);
        try {
            const res = await api.get(`return-purchase/${id}`);
            setViewData(res.data || {});
        } catch (err) {
            showToast(err?.message || 'Failed to load return details.', 'error');
            setViewId(null);
        } finally {
            setViewLoading(false);
        }
    };

    const startCreate = () => {
        const ref = purchaseRef.trim();
        if (!ref) {
            showToast('Purchase reference is required.', 'error');
            return;
        }
        setRefModalOpen(false);
        navigate(`/return-purchase/create?reference_no=${encodeURIComponent(ref)}`);
    };

    const warehouseOptions = [
        { value: '0', label: 'All warehouses' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ];

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'Purchase reference', key: 'purchase_reference' },
        { label: 'Warehouse', key: 'warehouse_name' },
        { label: 'Supplier', key: 'supplier_name' },
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
                        onClick: () => navigate(`/return-purchase/${row.id}/edit`),
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
            <PageLayout eyebrow="Purchase" title="Purchase Return List">
                <p className="text-muted">You do not have permission to view purchase returns.</p>
            </PageLayout>
        );
    }

    const ret = viewData?.return;
    const wh = viewData?.warehouse;
    const sup = viewData?.supplier;

    return (
        <PageLayout eyebrow="Purchase" title="Purchase Return List">
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
                    placeholder="Search reference, supplier, purchase…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <DataTable columns={columns} rows={paginated} loading={loading} rowKey="id" />
            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />

            <Modal isOpen={refModalOpen} onClose={() => setRefModalOpen(false)} title="Add Purchase Return">
                <p className="text-muted small mb-3">Enter the purchase reference number to return items from that order.</p>
                <FormField label="Purchase Reference *">
                    <TextInput
                        value={purchaseRef}
                        onChange={(e) => setPurchaseRef(e.target.value)}
                        placeholder="e.g. pr-20250604-123456"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), startCreate())}
                    />
                </FormField>
                <div className="d-flex gap-2 mt-3">
                    <button type="button" className="ui-btn primary" onClick={startCreate}>Submit</button>
                    <button type="button" className="ui-btn" onClick={() => setRefModalOpen(false)}>Cancel</button>
                </div>
            </Modal>

            <Modal isOpen={!!viewId} onClose={() => { setViewId(null); setViewData(null); }} title="Purchase Return Details" size="lg">
                {viewLoading && <p>Loading…</p>}
                {!viewLoading && ret && (
                    <>
                        <p className="small mb-3">
                            <strong>Date:</strong> {ret.date}<br />
                            <strong>Reference:</strong> {ret.reference_no}<br />
                            <strong>Purchase Reference:</strong> {ret.purchase_reference}
                            {ret.document && (
                                <>
                                    <br />
                                    <strong>Document:</strong>{' '}
                                    <a href={`${basePath}/documents/purchase_return/${ret.document}`} target="_blank" rel="noreferrer">Download</a>
                                </>
                            )}
                        </p>
                        <div className="row small mb-3">
                            <div className="col-md-6">
                                <strong>From (warehouse)</strong><br />
                                {wh?.name}<br />
                                {wh?.phone}<br />
                                {wh?.address}
                            </div>
                            <div className="col-md-6">
                                <strong>To (supplier)</strong><br />
                                {sup?.name}<br />
                                {sup?.company_name}<br />
                                {sup?.email}<br />
                                {sup?.phone_number}<br />
                                {sup?.address}{sup?.city ? `, ${sup.city}` : ''}
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
                                        <td>{ret.total_cost}</td>
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
                    title="Delete purchase return?"
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
