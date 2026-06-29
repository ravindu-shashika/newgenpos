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
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

const SALE_STATUS_OPTIONS = [
    { value: '0', label: 'All statuses' },
    { value: '1', label: 'Completed' },
    { value: '2', label: 'Pending' },
    { value: '3', label: 'Draft' },
    { value: '4', label: 'Returned' },
    { value: '5', label: 'Processing' },
];

const PAYMENT_STATUS_OPTIONS = [
    { value: '0', label: 'All payments' },
    { value: '1', label: 'Pending' },
    { value: '2', label: 'Due' },
    { value: '3', label: 'Partial' },
    { value: '4', label: 'Paid' },
];

export default function SalesList({ controllerName }) {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'sales');

    const [rows, setRows] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const today = new Date().toISOString().slice(0, 10);
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [startingDate, setStartingDate] = useState(yearAgo);
    const [endingDate, setEndingDate] = useState(today);
    const [warehouseId, setWarehouseId] = useState('0');
    const [saleStatus, setSaleStatus] = useState('0');
    const [paymentStatus, setPaymentStatus] = useState('0');

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                starting_date: startingDate,
                ending_date: endingDate,
                warehouse_id: warehouseId,
                sale_status: saleStatus,
                payment_status: paymentStatus,
                search,
            });
            const res = await api.get(`sales?${q}`);
            setRows(res.data?.data || []);
            if (res.data?.warehouses?.length) {
                setWarehouses(res.data.warehouses);
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load sales.', 'error');
        } finally {
            setLoading(false);
        }
    }, [startingDate, endingDate, warehouseId, saleStatus, paymentStatus, search]);

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
            await api.delete(`sales/${id}`);
            showToast('Sale deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete sale.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selected);
        try {
            await Promise.all(ids.map((id) => api.delete(`sales/${id}`)));
            showToast(`Deleted ${ids.length} sale(s).`, 'success');
            setSelected(new Set());
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete selected sales.', 'error');
        }
    };

    const warehouseOptions = [
        { value: '0', label: 'All warehouses' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ];

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'Customer', key: 'customer_name', sortable: true },
        { label: 'Warehouse', key: 'warehouse_name' },
        { label: 'Status', key: 'sale_status_label' },
        { label: 'Payment', key: 'payment_status_label' },
        { label: 'Grand Total', key: 'grand_total', align: 'right' },
        { label: 'Paid', key: 'paid_amount', align: 'right' },
        { label: 'Due', key: 'due', align: 'right' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        perms.canEdit && { label: '✎ Edit', onClick: () => navigate(`/sales/${row.id}/edit`) },
                        (perms.canEdit && perms.canDelete) && { divider: true },
                        perms.canDelete && { label: '🗑 Delete', danger: true, onClick: () => setDeleteId(row.id) },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    return (
        <PageLayout eyebrow="Sale" title="Sale List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {perms.canAdd && (
                    <Link to="/sales/create" className="ui-btn primary">
                        <i className="fa fa-plus" /> Add Sale
                    </Link>
                )}
                {perms.canDelete && selected.size > 0 && (
                    <button type="button" className="ui-btn danger" onClick={() => setDeleteId('bulk')}>
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
                <FormField label="Sale status">
                    <SelectInput value={saleStatus} onChange={(e) => setSaleStatus(e.target.value)} options={SALE_STATUS_OPTIONS} />
                </FormField>
                <FormField label="Payment status">
                    <SelectInput value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} options={PAYMENT_STATUS_OPTIONS} />
                </FormField>
                <FormField label="Search">
                    <TextInput
                        placeholder="Reference, customer, phone…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </FormField>
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No sales found."
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

            {deleteId === 'bulk' && (
                <ConfirmModal
                    title="Bulk Delete Sales"
                    danger
                    message={`Delete ${selected.size} sale(s)?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}
            {deleteId && deleteId !== 'bulk' && (
                <ConfirmModal
                    title="Delete Sale"
                    danger
                    message="Are you sure you want to delete this sale?"
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
