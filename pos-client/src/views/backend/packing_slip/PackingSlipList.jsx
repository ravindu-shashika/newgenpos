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
import CookieService from '../../../services/cookie';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

const basePath =
    import.meta.env.VITE_APP_DEFAULT_PATH ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000';

function hasPackingSlipAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'packing_slip_challan' ||
            p === 'packing-slips.view' ||
            p.startsWith('packing-slips.')
    );
}

function statusBadgeClass(status) {
    if (status === 'In Transit') return 'badge-warning';
    if (status === 'Cancelled' || status === 'Pending') return 'badge-danger';
    return 'badge-success';
}

export default function PackingSlipList({ controllerName }) {
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'packing_slip');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasPackingSlipAccess(authPerms);
    const canDelete = perms.canDelete || canView;

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [selected, setSelected] = useState(new Set());

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({ search });
            const res = await api.get(`packing-slips?${q}`);
            setRows(res.data?.data || []);
            setSelected(new Set());
        } catch (err) {
            showToast(err?.message || 'Failed to load packing slips.', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, showToast]);

    useEffect(() => {
        if (canView) fetchList();
        else setLoading(false);
    }, [canView, fetchList]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return rows;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const selectableOnPage = paginated.filter((r) => r.can_select_for_challan);
    const allPageSelected = selectableOnPage.length > 0
        && selectableOnPage.every((r) => selected.has(r.id));

    const toggleRow = (row) => {
        if (!row.can_select_for_challan) return;
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(row.id)) next.delete(row.id);
            else next.add(row.id);
            return next;
        });
    };

    const togglePage = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allPageSelected) {
                selectableOnPage.forEach((r) => next.delete(r.id));
            } else {
                selectableOnPage.forEach((r) => next.add(r.id));
            }
            return next;
        });
    };

    const openLegacy = (path) => {
        window.open(`${basePath}${path}`, '_blank', 'noopener,noreferrer');
    };

    const createChallan = () => {
        const ids = Array.from(selected);
        if (ids.length < 2) {
            showToast('Please select at least two pending packing slips.', 'error');
            return;
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${basePath}/challans/create`;
        form.target = '_blank';

        const csrf = CookieService.get('XSRF-TOKEN');
        if (csrf) {
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = '_token';
            tokenInput.value = decodeURIComponent(csrf);
            form.appendChild(tokenInput);
        }

        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'packing_slip_id';
        idInput.value = ids.join(',');
        form.appendChild(idInput);

        document.body.appendChild(form);
        form.submit();
        form.remove();
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`packing-slips/${id}`);
            showToast('Packing slip deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete packing slip.', 'error');
        }
    };

    const columns = [
        {
            label: (
                <input
                    type="checkbox"
                    checked={allPageSelected}
                    disabled={selectableOnPage.length === 0}
                    onChange={togglePage}
                    aria-label="Select all pending on page"
                />
            ),
            key: 'select',
            render: (row) => (
                <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    disabled={!row.can_select_for_challan}
                    onChange={() => toggleRow(row)}
                    aria-label={`Select ${row.reference}`}
                />
            ),
        },
        { label: 'Reference', key: 'reference', sortable: true },
        { label: 'Sale reference', key: 'sale_reference' },
        { label: 'Delivery reference', key: 'delivery_reference' },
        { label: 'Products', key: 'item_list' },
        { label: 'Amount', key: 'amount', align: 'right' },
        {
            label: 'Status',
            key: 'status',
            render: (row) => (
                <span className={`badge ${statusBadgeClass(row.status)}`}>{row.status}</span>
            ),
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canView && row.sale_id && {
                        label: '🧾 Sale invoice',
                        onClick: () => openLegacy(`/sales/gen_invoice/${row.sale_id}`),
                    },
                    canView && {
                        label: '🏷 Shipping label',
                        onClick: () => openLegacy(`/packing-slips/invoice/${row.id}`),
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
            <PageLayout eyebrow="Sale" title="Packing Slip List">
                <p className="text-muted">You do not have permission to view packing slips.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Sale" title="Packing Slip List">
            <div className="alert alert-warning mb-3">
                Select two or more pending packing slips to create a challan.
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <button
                    type="button"
                    className="ui-btn primary"
                    disabled={selected.size < 2}
                    onClick={createChallan}
                >
                    Create challan
                </button>
                <a
                    href={`${basePath}/challans`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ui-btn secondary"
                >
                    Challan list
                </a>
            </div>

            <FormField label="Search" className="mb-3">
                <TextInput
                    placeholder="Packing slip or sale reference…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </FormField>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No packing slips found."
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
                    title="Delete packing slip?"
                    message="This will restore product stock and remove the linked delivery. This cannot be undone."
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
