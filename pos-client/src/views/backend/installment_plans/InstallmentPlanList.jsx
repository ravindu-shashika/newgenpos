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

function hasInstallmentAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'sales-index' ||
            p === 'sales-view' ||
            p.startsWith('sales-')
    );
}

function statusBadgeClass(label) {
    if (label === 'Completed') return 'badge-success';
    if (label === 'Overdue') return 'badge-danger';
    return 'badge-warning';
}

export default function InstallmentPlanList({ controllerName }) {
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'installment-plans');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasInstallmentAccess(authPerms);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [viewId, setViewId] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({ search });
            if (status) q.set('status', status);
            const res = await api.get(`installment-plans?${q}`);
            setRows(res.data?.data || []);
        } catch (err) {
            showToast(err?.message || 'Failed to load installment plans.', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, status, showToast]);

    useEffect(() => {
        if (canView) fetchList();
        else setLoading(false);
    }, [canView, fetchList]);

    const openView = async (id) => {
        setViewId(id);
        setViewLoading(true);
        setViewData(null);
        try {
            const res = await api.get(`installment-plans/${id}`);
            setViewData(res.data?.plan || null);
        } catch (err) {
            showToast(err?.message || 'Failed to load installment plan.', 'error');
            setViewId(null);
        } finally {
            setViewLoading(false);
        }
    };

    const paginated = useMemo(() => {
        if (pageSize === -1) return rows;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const columns = [
        { key: 'name', label: 'Plan' },
        { key: 'reference_no', label: 'Sale ref' },
        { key: 'customer_name', label: 'Customer' },
        {
            key: 'total_amount',
            label: 'Total',
            render: (row) => Number(row.total_amount).toFixed(2),
        },
        {
            key: 'down_payment',
            label: 'Down payment',
            render: (row) => Number(row.down_payment).toFixed(2),
        },
        { key: 'months', label: 'Months' },
        {
            key: 'pending_count',
            label: 'Pending',
            render: (row) => (
                <>
                    {row.pending_count}
                    {row.overdue_count > 0 && (
                        <span className="badge badge-danger ms-1">{row.overdue_count} overdue</span>
                    )}
                </>
            ),
        },
        { key: 'created_at', label: 'Created' },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        {
                            label: 'View',
                            onClick: () => openView(row.id),
                        },
                        {
                            label: 'Legacy payments',
                            onClick: () => window.open(`${basePath}/installmentplan/${row.id}`, '_blank', 'noopener,noreferrer'),
                        },
                    ]}
                />
            ),
        },
    ];

    const plan = viewData;

    if (!canView) {
        return (
            <PageLayout eyebrow="Sale" title="Installment List">
                <p className="text-muted">You do not have permission to view installment plans.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Sale" title="Installment List">
            <div className="ui-form-grid two mb-3">
                <FormField label="Search">
                    <TextInput
                        placeholder="Plan name, sale reference, customer…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </FormField>
                <FormField label="Status">
                    <SelectInput
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        options={[
                            { value: '', label: 'All plans' },
                            { value: 'pending', label: 'Has pending installments' },
                            { value: 'overdue', label: 'Has overdue installments' },
                        ]}
                    />
                </FormField>
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No installment plans found."
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

            <Modal
                isOpen={!!viewId}
                onClose={() => { setViewId(null); setViewData(null); }}
                title="Installment plan details"
                footer={
                    plan ? (
                        <button
                            type="button"
                            className="ui-btn ghost"
                            onClick={() => window.open(`${basePath}/installmentplan/${plan.id}`, '_blank', 'noopener,noreferrer')}
                        >
                            Open legacy payment screen
                        </button>
                    ) : null
                }
            >
                {viewLoading && <p>Loading…</p>}
                {!viewLoading && plan && (
                    <>
                        <div className="row g-2 mb-3 small">
                            <div className="col-md-4"><strong>Plan:</strong> {plan.name}</div>
                            <div className="col-md-4"><strong>Sale:</strong> {plan.reference_no}</div>
                            <div className="col-md-4"><strong>Customer:</strong> {plan.customer_name}</div>
                            <div className="col-md-4"><strong>Price:</strong> {Number(plan.price).toFixed(2)}</div>
                            <div className="col-md-4"><strong>Additional:</strong> {Number(plan.additional_amount).toFixed(2)}</div>
                            <div className="col-md-4"><strong>Total:</strong> {Number(plan.total_amount).toFixed(2)}</div>
                            <div className="col-md-4"><strong>Down payment:</strong> {Number(plan.down_payment).toFixed(2)}</div>
                            <div className="col-md-4"><strong>Months:</strong> {plan.months}</div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Payment date</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(plan.installments || []).length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted">No installments</td>
                                        </tr>
                                    ) : (
                                        plan.installments.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.no}</td>
                                                <td>{item.payment_date}</td>
                                                <td>
                                                    <span className={`badge ${statusBadgeClass(item.status_label)}`}>
                                                        {item.status_label}
                                                    </span>
                                                </td>
                                                <td>{Number(item.amount).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Modal>

            <Toast toast={toast} />
        </PageLayout>
    );
}
