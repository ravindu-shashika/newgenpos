import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    ConfirmModal,
    TextInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

export default function DamageStockList({ controllerName }) {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const { toast, showToast } = useToast();

    const perms = usePermissions(controllerName || 'damage-stock');
    const canAdd = perms.canAdd;
    const canEdit = perms.canEdit;
    const canDelete = perms.canDelete;

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('damage-stock');
            setRows(res.data?.data || []);
        } catch (err) {
            const msg = err?.message || err?.response?.data?.message || 'Failed to load damage records.';
            showToast(msg.includes('not allowed') ? msg : 'Failed to load damage records.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

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
            await api.delete(`damage-stock/${id}`);
            showToast('Damage record deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch {
            showToast('Failed to delete damage record.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('damage-stock/deletebyselection', {
                damageIdArray: Array.from(selected),
            });
            showToast('Selected damage records deleted.', 'success');
            setSelected(new Set());
            setBulkDeleteOpen(false);
            fetchList();
        } catch {
            showToast('Failed to delete damage records.', 'error');
        }
    };

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'Warehouse', key: 'warehouse_name', sortable: true },
        {
            label: 'Products',
            key: 'products_summary',
            render: (row) => (
                <div style={{ whiteSpace: 'pre-line', fontSize: 13 }}>
                    {(row.products || []).map((p, i) => (
                        <div key={i}>
                            {p.name}
                            <br />
                            <span className="text-muted">{p.qty} x {p.unit_cost}</span>
                        </div>
                    ))}
                </div>
            ),
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
                        canEdit && { label: '✎ Edit', onClick: () => navigate(`/damage-stock/${row.id}/edit`) },
                        (canEdit && canDelete) && { divider: true },
                        canDelete && { label: '🗑 Delete', danger: true, onClick: () => setDeleteId(row.id) },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    return (
        <PageLayout eyebrow="Product" title="Damage List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {canAdd && (
                    <Link to="/damage-stock/create" className="ui-btn primary">
                        <i className="fa fa-plus" /> Add Damage Stock
                    </Link>
                )}
                {canDelete && selected.size > 0 && (
                    <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                        <i className="fa fa-trash" /> Delete selected ({selected.size})
                    </button>
                )}
                <div style={{ marginLeft: 'auto', width: 260 }}>
                    <TextInput
                        placeholder="Search reference, warehouse, note..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No damage records found."
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

            {deleteId && (
                <ConfirmModal
                    title="Delete Damage Record"
                    danger
                    message="Are you sure you want to delete this damage record? Stock will be restored."
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk Delete Damage Records"
                    danger
                    message={`Are you sure you want to delete ${selected.size} damage record(s)? Stock will be restored.`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
