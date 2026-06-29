import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PageLayout,
    DataTable,
    ConfirmModal,
    TextInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    FormField,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

const basePath =
    import.meta.env.VITE_APP_DEFAULT_PATH ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000';

function hasDeliveryAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === 'delivery' || p.startsWith('deliveries.')
    );
}

export default function DeliveryList({ controllerName }) {
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'delivery');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasDeliveryAccess(authPerms);
    const canEdit = perms.canEdit || canView;
    const canDelete = perms.canDelete || canEdit;

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({ search });
            const res = await api.get(`deliveries?${q}`);
            setRows(res.data?.data || []);
        } catch (err) {
            showToast(err?.message || 'Failed to load deliveries.', 'error');
        } finally {
            setLoading(false);
        }
    }, [search]);

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
            await api.delete(`deliveries/${id}`);
            showToast('Delivery deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete delivery.', 'error');
        }
    };

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Delivery ref.', key: 'reference_no', sortable: true },
        { label: 'Sale ref.', key: 'sale_reference' },
        { label: 'Packing slip', key: 'packing_slip_references' },
        {
            label: 'Customer',
            key: 'customer_name',
            render: (row) =>
                row.customer_phone ? (
                    <>
                        {row.customer_name}
                        <br />
                        <small className="text-muted">{row.customer_phone}</small>
                    </>
                ) : (
                    row.customer_name
                ),
        },
        { label: 'Courier', key: 'courier_name' },
        { label: 'Tracking', key: 'tracking_code' },
        { label: 'Address', key: 'address' },
        { label: 'Products', key: 'products' },
        { label: 'Grand total', key: 'grand_total', align: 'right' },
        { label: 'Status', key: 'status_label' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canEdit && {
                        label: '✎ Edit',
                        onClick: () => openLegacy(`/delivery/${row.id}/edit`),
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
            <PageLayout eyebrow="Sale" title="Delivery List">
                <p className="text-muted">You do not have permission to view deliveries.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Sale" title="Delivery List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <a
                    href={`${basePath}/packing-slips`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ui-btn secondary"
                >
                    Packing slips
                </a>
            </div>

            <div className="ui-form-grid two mb-3">
                <FormField label="Search">
                    <TextInput
                        placeholder="Reference, customer, phone, packing slip…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </FormField>
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No deliveries found."
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

            {deleteId != null && (
                <ConfirmModal
                    title="Delete delivery"
                    message="Delete this delivery? This cannot be undone."
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
