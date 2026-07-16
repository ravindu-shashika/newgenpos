import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    ConfirmModal,
    Modal,
    Button,
    SearchInput,
    ListToolbar,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
    PermissionDenied,
    actionItem,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';
import AdjustmentForm from './AdjustmentForm';

const PAGE_SIZES = [10, 25, 50, -1];

export default function AdjustmentList({ controllerName }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const legacyHandled = useRef(false);

    /** @type {[{ type: 'create' } | { type: 'edit', id: string } | null, Function]} */
    const [formMode, setFormMode] = useState(null);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const { toast, showToast, dismissToast } = useToast();

    const permsAdjustments = usePermissions(controllerName || 'adjustments');
    const permsAdjustment = usePermissions('adjustment');
    const permsQty = usePermissions('qty_adjustment');
    const canView = permsAdjustments.canView || permsAdjustment.canView || permsQty.canView;
    const canAdd = permsAdjustments.canAdd || permsAdjustment.canAdd || permsQty.canAdd;
    const canEdit = permsAdjustments.canEdit || permsAdjustment.canEdit || permsQty.canEdit;
    const canDelete = permsAdjustments.canDelete || permsAdjustment.canDelete || permsQty.canDelete;

    const closeForm = useCallback(() => {
        setFormMode(null);
    }, []);

    const openCreate = useCallback(() => {
        if (!canAdd) {
            showToast('You are not allowed to add adjustments.', 'error');
            return;
        }
        setFormMode({ type: 'create' });
    }, [canAdd, showToast]);

    const openEdit = useCallback((id) => {
        if (!canEdit) {
            showToast('You are not allowed to edit adjustments.', 'error');
            return;
        }
        setFormMode({ type: 'edit', id: String(id) });
    }, [canEdit, showToast]);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('qty_adjustment');
            setRows(res.data?.data || []);
        } catch (err) {
            const msg = err?.message || err?.response?.data?.message || 'Failed to load adjustments.';
            showToast(msg.includes('not allowed') ? msg : 'Failed to load adjustments.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    useEffect(() => {
        if (legacyHandled.current) return;
        legacyHandled.current = true;

        const createParam = searchParams.get('create');
        const editParam = searchParams.get('edit');
        const navState = location.state;

        if (createParam === '1' || navState?.adjustmentForm === 'create') {
            if (canAdd) setFormMode({ type: 'create' });
        } else if (editParam || navState?.adjustmentForm === 'edit') {
            const id = editParam || navState?.id;
            if (id && canEdit) setFormMode({ type: 'edit', id: String(id) });
        }

        if (createParam || editParam) {
            setSearchParams({}, { replace: true });
        }
        if (navState?.adjustmentForm) {
            navigate('/qty_adjustment', { replace: true, state: null });
        }
    }, [
        canAdd,
        canEdit,
        location.state,
        navigate,
        searchParams,
        setSearchParams,
    ]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter((r) =>
            (r.reference_no || '').toLowerCase().includes(q) ||
            (r.warehouse_name || '').toLowerCase().includes(q) ||
            (r.note || '').toLowerCase().includes(q) ||
            (r.products_summary || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize) || 1);

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
            await api.delete(`qty_adjustment/${id}`);
            showToast('Adjustment deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch {
            showToast('Failed to delete adjustment.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('qty_adjustment/deletebyselection', {
                adjustmentIdArray: Array.from(selected),
            });
            showToast('Selected adjustments deleted.', 'success');
            setSelected(new Set());
            setBulkDeleteOpen(false);
            fetchList();
        } catch {
            showToast('Failed to delete adjustments.', 'error');
        }
    };

    const handleFormSaved = () => {
        closeForm();
        fetchList();
    };

    if (!canView) {
        return (
            <PermissionDenied
                title="Adjustments"
                action="view adjustments"
            />
        );
    }

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'Warehouse', key: 'warehouse_name', sortable: true },
        {
            label: 'Products',
            key: 'products_summary',
            render: (row) => {
                const products = row.products || [];
                if (!products.length) {
                    return <span className="cell-muted">—</span>;
                }
                const summary = row.products_summary
                    || products.map((p) => p.label || p.display || p.name).join(', ');
                return (
                    <span
                        className="ui-cell-compact"
                        title={summary}
                    >
                        {summary}
                    </span>
                );
            },
        },
        { label: 'Note', key: 'note' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && actionItem('edit', 'Edit', { onClick: () => openEdit(row.id) }),
                        (canEdit && canDelete) && { divider: true },
                        canDelete && actionItem('delete', 'Delete', { danger: true, onClick: () => setDeleteId(row.id) }),
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    const formTitle = formMode?.type === 'edit' ? 'Update Adjustment' : 'Add Adjustment';
    const formEditId = formMode?.type === 'edit' ? formMode.id : null;

    return (
        <PageLayout
            eyebrow="Product"
            title="Adjustments"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                <>
                    {canAdd && (
                        <Button variant="primary" icon="pi pi-plus" onClick={openCreate}>
                            Add Adjustment
                        </Button>
                    )}
                    {canDelete && selected.size > 0 && (
                        <Button variant="danger" icon="pi pi-trash" onClick={() => setBulkDeleteOpen(true)}>
                            Delete selected ({selected.size})
                        </Button>
                    )}
                </>
            }
        >
            <ListToolbar>
                <SearchInput
                    placeholder="Search reference, warehouse, note…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </ListToolbar>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No adjustments found."
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize === -1 ? filtered.length || 10 : pageSize}
                totalRows={filtered.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {formMode && (
                <Modal
                    isOpen
                    size="2xl"
                    title={formTitle}
                    onClose={closeForm}
                >
                    <AdjustmentForm
                        key={formEditId ?? 'create'}
                        adjustmentId={formEditId}
                        onSaved={handleFormSaved}
                        onCancel={closeForm}
                    />
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Adjustment"
                    danger
                    message="Are you sure you want to delete this adjustment?"
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk Delete Adjustments"
                    danger
                    message={`Are you sure you want to delete ${selected.size} adjustment(s)?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            <Toast toast={toast} onDismiss={dismissToast} />
        </PageLayout>
    );
}
