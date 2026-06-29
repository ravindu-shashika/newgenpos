import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PageLayout,
    DataTable,
    TextInput,
    SelectInput,
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
const STATUS_OPTIONS = [
    { value: '0', label: 'All statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Close', label: 'Close' },
];

const basePath =
    import.meta.env.VITE_APP_DEFAULT_PATH ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000';

function hasChallanAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'packing_slip_challan' ||
            p === 'challans.view' ||
            p.startsWith('challans.')
    );
}

export default function ChallanList({ controllerName }) {
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'challan');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasChallanAccess(authPerms);
    const canEdit = perms.canEdit || canView;

    const [rows, setRows] = useState([]);
    const [couriers, setCouriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [courierId, setCourierId] = useState('0');
    const [status, setStatus] = useState('0');

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                courier_id: courierId,
                status,
                search,
            });
            const res = await api.get(`challans?${q}`);
            setRows(res.data?.data || []);
            if (res.data?.couriers?.length) {
                setCouriers(res.data.couriers);
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load challans.', 'error');
        } finally {
            setLoading(false);
        }
    }, [courierId, status, search]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return rows;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const courierOptions = [
        { value: '0', label: 'All couriers' },
        ...couriers.map((c) => ({
            value: String(c.id),
            label: c.label || c.name,
        })),
    ];

    const openLegacy = (path) => {
        window.open(`${basePath}${path}`, '_blank', 'noopener,noreferrer');
    };

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'Order no.', key: 'sale_reference' },
        { label: 'Courier', key: 'courier_name' },
        { label: 'Status', key: 'status' },
        { label: 'Closing date', key: 'closing_date' },
        { label: 'Total amount', key: 'total_amount', align: 'right' },
        { label: 'Created by', key: 'created_by' },
        { label: 'Closed by', key: 'closed_by' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canView && {
                        label: '🖨 Print challan',
                        onClick: () => openLegacy(`/challans/invoice/${row.id}`),
                    },
                    row.status === 'Active' && canEdit && {
                        label: '✓ Finalize',
                        onClick: () => openLegacy(`/challans/finalize/${row.id}`),
                    },
                    row.status === 'Close' && canView && {
                        label: '🧾 Money receipt',
                        onClick: () => openLegacy(`/challans/money-reciept/${row.id}`),
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

    return (
        <PageLayout eyebrow="Sale" title="Challan List">
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
                <FormField label="Courier">
                    <SelectInput
                        value={courierId}
                        onChange={(e) => { setCourierId(e.target.value); setPage(1); }}
                        options={courierOptions}
                    />
                </FormField>
                <FormField label="Status">
                    <SelectInput
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        options={STATUS_OPTIONS}
                    />
                </FormField>
                <FormField label="Search">
                    <TextInput
                        placeholder="Reference, courier, status…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </FormField>
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No challans found."
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

            <Toast toast={toast} />
        </PageLayout>
    );
}
