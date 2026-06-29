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
    SelectionBar,
    FormField,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions, { useCan } from '../../../stores/usePermissions';
import {
    PurchaseViewModal,
    PurchaseAddPaymentModal,
    PurchasePaymentsModal,
} from './PurchaseListModals';

function canViewDeletedPurchases() {
    const roleId = authStore.getUser()?.role_id;
    return roleId != null && Number(roleId) <= 2;
}

const PAGE_SIZES = [10, 25, 50, -1];
const STATUS_OPTIONS = [
    { value: '0', label: 'All statuses' },
    { value: '1', label: 'Received' },
    { value: '2', label: 'Partial' },
    { value: '3', label: 'Pending' },
    { value: '4', label: 'Ordered' },
];
const PAYMENT_OPTIONS = [
    { value: '0', label: 'All payments' },
    { value: '1', label: 'Due' },
    { value: '2', label: 'Paid' },
];

export default function PurchaseList({ controllerName }) {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'purchases');

    const [rows, setRows] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [viewId, setViewId] = useState(null);
    const [paymentsRow, setPaymentsRow] = useState(null);
    const [addPaymentRow, setAddPaymentRow] = useState(null);

    const canViewPayment = useCan('purchase-payment-index');
    const canAddPayment = useCan('purchase-payment-add');
    const canEditPayment = useCan('purchase-payment-edit');
    const canDeletePayment = useCan('purchase-payment-delete');

    const today = new Date().toISOString().slice(0, 10);
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [startingDate, setStartingDate] = useState(yearAgo);
    const [endingDate, setEndingDate] = useState(today);
    const [warehouseId, setWarehouseId] = useState('0');
    const [purchaseStatus, setPurchaseStatus] = useState('0');
    const [paymentStatus, setPaymentStatus] = useState('0');

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                starting_date: startingDate,
                ending_date: endingDate,
                warehouse_id: warehouseId,
                purchase_status: purchaseStatus,
                payment_status: paymentStatus,
                search,
            });
            const res = await api.get(`purchases?${q}`);
            setRows(res.data?.data || []);
            if (res.data?.warehouses?.length) {
                setWarehouses(res.data.warehouses);
            }
            if (res.data?.accounts) {
                setAccounts(res.data.accounts);
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load purchases.', 'error');
        } finally {
            setLoading(false);
        }
    }, [startingDate, endingDate, warehouseId, purchaseStatus, paymentStatus, search]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return rows;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === paginated.length && paginated.length > 0) {
            setSelected(new Set());
        } else {
            setSelected(new Set(paginated.map((r) => r.id)));
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`purchases/${id}`);
            showToast('Purchase deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.response?.data?.message || err?.message || 'Failed to delete purchase.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('purchases/deletebyselection', {
                purchaseIdArray: Array.from(selected),
            });
            showToast('Selected purchases deleted.', 'success');
            setSelected(new Set());
            setBulkDeleteOpen(false);
            fetchList();
        } catch (err) {
            showToast(err?.response?.data?.message || err?.message || 'Failed to delete purchases.', 'error');
        }
    };

    const warehouseOptions = [
        { value: '0', label: 'All warehouses' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ];

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'Created By', key: 'created_by_name' },
        { label: 'Supplier', key: 'supplier_name', sortable: true },
        { label: 'Warehouse', key: 'warehouse_name' },
        { label: 'Status', key: 'status_label' },
        { label: 'Grand Total', key: 'grand_total', align: 'right' },
        { label: 'Returned', key: 'returned_amount', align: 'right' },
        { label: 'Paid', key: 'paid_amount', align: 'right' },
        { label: 'Due', key: 'due', align: 'right' },
        { label: 'Payment', key: 'payment_status_label' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    perms.canView && { label: '👁 View', onClick: () => setViewId(row.id) },
                    perms.canAdd && {
                        label: '📋 Duplicate',
                        onClick: () => navigate(`/purchases/create?duplicate_from=${row.id}`),
                    },
                    perms.canEdit && { label: '✎ Edit', onClick: () => navigate(`/purchases/${row.id}/edit`) },
                    canViewPayment && { label: '💰 View Payment', onClick: () => setPaymentsRow(row) },
                    canAddPayment && Number(row.due) > 0 && {
                        label: '➕ Add Payment',
                        onClick: () => setAddPaymentRow(row),
                    },
                    (perms.canDelete && (perms.canView || perms.canAdd || perms.canEdit || canViewPayment || canAddPayment)) && { divider: true },
                    perms.canDelete && { label: '🗑 Delete', danger: true, onClick: () => setDeleteId(row.id) },
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

    return (
        <PageLayout eyebrow="Purchase" title="Purchase List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {perms.canAdd && (
                    <Link to="/purchases/create" className="ui-btn primary">
                        <i className="fa fa-plus" /> Add Purchase
                    </Link>
                )}
                {perms.canImport && (
                    <Link to="/purchases/purchase_by_csv" className="ui-btn">
                        <i className="fa fa-copy" /> Import Purchase
                    </Link>
                )}
                {canViewDeletedPurchases() && (
                    <Link to="/purchases/deleted_data" className="ui-btn ghost">
                        <i className="fa fa-trash" /> Deleted Purchases
                    </Link>
                )}
                {perms.canDelete && selected.size > 0 && (
                    <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                        <i className="fa fa-trash" /> Delete selected ({selected.size})
                    </button>
                )}
            </div>

            <div className="ui-form-grid two mb-3">
                <FormField label="From">
                    <input type="date" className="ui-input" value={startingDate} onChange={(e) => setStartingDate(e.target.value)} />
                </FormField>
                <FormField label="To">
                    <input type="date" className="ui-input" value={endingDate} onChange={(e) => setEndingDate(e.target.value)} />
                </FormField>
                <FormField label="Warehouse">
                    <SelectInput value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} options={warehouseOptions} />
                </FormField>
                <FormField label="Purchase status">
                    <SelectInput value={purchaseStatus} onChange={(e) => setPurchaseStatus(e.target.value)} options={STATUS_OPTIONS} />
                </FormField>
                <FormField label="Payment status">
                    <SelectInput value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} options={PAYMENT_OPTIONS} />
                </FormField>
                <FormField label="Search">
                    <TextInput placeholder="Reference or supplier…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </FormField>
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No purchases found."
                selected={perms.canDelete ? selected : undefined}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize === -1 ? rows.length || 10 : pageSize}
                totalRows={rows.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {deleteId && (
                <ConfirmModal
                    title="Delete Purchase"
                    danger
                    message="Are you sure? Purchases linked to sales cannot be deleted."
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}
            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk Delete Purchases"
                    danger
                    message={`Delete ${selected.size} purchase(s)?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            {viewId && (
                <PurchaseViewModal purchaseId={viewId} onClose={() => setViewId(null)} />
            )}
            {paymentsRow && (
                <PurchasePaymentsModal
                    purchaseId={paymentsRow.id}
                    referenceNo={paymentsRow.reference_no}
                    accounts={accounts}
                    canEditPayment={canEditPayment}
                    canDeletePayment={canDeletePayment}
                    onClose={() => setPaymentsRow(null)}
                    onChanged={fetchList}
                    showToast={showToast}
                />
            )}
            {addPaymentRow && (
                <PurchaseAddPaymentModal
                    row={addPaymentRow}
                    accounts={accounts}
                    onClose={() => setAddPaymentRow(null)}
                    onSuccess={() => {
                        setAddPaymentRow(null);
                        fetchList();
                    }}
                    showToast={showToast}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
