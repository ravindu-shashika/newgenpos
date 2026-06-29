import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PageLayout,
    DataTable,
    ConfirmModal,
    Modal,
    TextInput,
    NumberInput,
    SelectInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    FormField,
    FormRow,
    SelectionBar,
} from '../../../components/ui';
import { api, generateUniqueCode, assertCodeAvailable } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

const TYPE_OPTIONS = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed amount' },
];

const emptyForm = () => ({
    coupon_id: '',
    code: '',
    type: 'percentage',
    amount: '',
    minimum_amount: '',
    quantity: '',
    expired_date: new Date().toISOString().slice(0, 10),
});

function hasCouponAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'coupon' ||
            p === 'coupons.view' ||
            p.startsWith('coupons.')
    );
}

function formatValidationError(err) {
    if (err?.errors && typeof err.errors === 'object') {
        const first = Object.values(err.errors).flat()[0];
        if (first) return first;
    }
    return err?.message || 'Request failed';
}

export default function CouponList({ controllerName }) {
    const { toast, showToast } = useToast();
    const ctrl = controllerName || 'coupons';
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasCouponAccess(authPerms);
    const canAdd = perms.canAdd || hasCouponAccess(authPerms);
    const canEdit = perms.canEdit || hasCouponAccess(authPerms);
    const canDelete = perms.canDelete || canEdit;

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const showMinimum = form.type === 'fixed';
    const amountSuffix = form.type === 'fixed' ? '$' : '%';

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({ search });
            const res = await api.get(`coupons?${q}`);
            setRows(res.data?.data || []);
            setSelected(new Set());
        } catch (err) {
            showToast(err?.message || 'Failed to load coupons.', 'error');
        } finally {
            setLoading(false);
        }
    }, [search]);

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

    const openAdd = () => {
        setForm(emptyForm());
        setAddOpen(true);
    };

    const openEdit = (row) => {
        setForm({
            coupon_id: String(row.id),
            code: row.code || '',
            type: row.type || 'percentage',
            amount: row.amount ?? '',
            minimum_amount: row.type === 'fixed' ? (row.minimum_amount_raw ?? row.minimum_amount ?? '') : '',
            quantity: row.quantity ?? '',
            expired_date: row.expired_raw || new Date().toISOString().slice(0, 10),
        });
        setEditOpen(true);
    };

    const handleGenerateCode = async () => {
        try {
            const code = await generateUniqueCode('coupon', {
                exceptId: form.coupon_id || null,
            });
            setForm((f) => ({ ...f, code: String(code) }));
        } catch (err) {
            showToast(err?.message || 'Failed to generate code.', 'error');
        }
    };

    const buildPayload = () => ({
        code: form.code.trim(),
        type: form.type,
        amount: Number(form.amount),
        minimum_amount: form.type === 'fixed' ? Number(form.minimum_amount || 0) : 0,
        quantity: parseInt(form.quantity, 10),
        expired_date: form.expired_date,
    });

    const handleAdd = async () => {
        setSaving(true);
        try {
            await assertCodeAvailable('coupon', form.code);
            await api.post('coupons', buildPayload());
            showToast('Coupon created.', 'success');
            setAddOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async () => {
        setSaving(true);
        try {
            await assertCodeAvailable('coupon', form.code, form.coupon_id);
            await api.put(`coupons/${form.coupon_id}`, buildPayload());
            showToast('Coupon updated.', 'success');
            setEditOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`coupons/${id}`);
            showToast('Coupon deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete coupon.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.post('coupons/deletebyselection', {
                couponIdArray: Array.from(selected),
            });
            showToast(res.data?.message || 'Coupons deleted.', 'success');
            setBulkDeleteOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        }
    };

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === paginated.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(paginated.map((r) => r.id)));
        }
    };

    const renderFormFields = () => (
        <FormRow>
            <FormField label="Coupon code *">
                <div className="d-flex gap-2">
                    <TextInput
                        value={form.code}
                        onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                        required
                    />
                    <button type="button" className="ui-btn secondary" onClick={handleGenerateCode}>
                        Generate
                    </button>
                </div>
            </FormField>
            <FormField label="Type *">
                <SelectInput
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    options={TYPE_OPTIONS}
                />
            </FormField>
            {showMinimum && (
                <FormField label="Minimum amount *">
                    <NumberInput
                        value={form.minimum_amount}
                        onChange={(e) => setForm((f) => ({ ...f, minimum_amount: e.target.value }))}
                        min={0}
                        step="any"
                    />
                </FormField>
            )}
            <FormField label={`Amount * (${amountSuffix})`}>
                <NumberInput
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    min={0}
                    step="any"
                    required
                />
            </FormField>
            <FormField label="Qty *">
                <NumberInput
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    min={1}
                    step={1}
                    required
                />
            </FormField>
            <FormField label="Expired date *">
                <input
                    type="date"
                    className="ui-input"
                    value={form.expired_date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm((f) => ({ ...f, expired_date: e.target.value }))}
                />
            </FormField>
        </FormRow>
    );

    const columns = [
        {
            label: (
                <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleSelectAll}
                />
            ),
            key: 'select',
            render: (row) => (
                <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                />
            ),
        },
        { label: 'Coupon code', key: 'code', sortable: true },
        {
            label: 'Type',
            key: 'type',
            render: (row) => (
                <span className={`ui-badge ${row.type === 'percentage' ? 'success' : 'ghost'}`}>
                    {row.type}
                </span>
            ),
        },
        { label: 'Amount', key: 'amount', align: 'right' },
        { label: 'Minimum amount', key: 'minimum_amount_label', align: 'right' },
        { label: 'Qty', key: 'quantity', align: 'right' },
        {
            label: 'Available',
            key: 'available',
            align: 'center',
            render: (row) => (
                <span className={row.has_available ? 'ui-badge success' : 'ui-badge warning'}>
                    {row.available}
                </span>
            ),
        },
        {
            label: 'Expired date',
            key: 'expired_date',
            render: (row) => (
                <span className={row.is_expired ? 'ui-badge warning' : 'ui-badge success'}>
                    {row.expired_date}
                </span>
            ),
        },
        { label: 'Created by', key: 'created_by' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canEdit && {
                        label: '✎ Edit',
                        onClick: () => openEdit(row),
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
            <PageLayout eyebrow="Sale" title="Coupon List">
                <p className="text-muted">You do not have permission to view coupons.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Sale" title="Coupon List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {canAdd && (
                    <button type="button" className="ui-btn primary" onClick={openAdd}>
                        <i className="fa fa-plus" /> Add coupon
                    </button>
                )}
                {canDelete && selected.size > 0 && (
                    <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                        Delete selected ({selected.size})
                    </button>
                )}
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <div className="ui-form-grid two mb-3">
                <FormField label="Search">
                    <TextInput
                        placeholder="Code or type…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </FormField>
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No coupons found."
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

            {addOpen && (
                <Modal
                    title="Add coupon"
                    onClose={() => !saving && setAddOpen(false)}
                    footer={
                        <>
                            <button
                                type="button"
                                className="ui-btn ghost"
                                disabled={saving}
                                onClick={() => setAddOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ui-btn primary"
                                disabled={saving}
                                onClick={handleAdd}
                            >
                                {saving ? 'Saving…' : 'Submit'}
                            </button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update coupon"
                    onClose={() => !saving && setEditOpen(false)}
                    footer={
                        <>
                            <button
                                type="button"
                                className="ui-btn ghost"
                                disabled={saving}
                                onClick={() => setEditOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ui-btn primary"
                                disabled={saving}
                                onClick={handleEdit}
                            >
                                {saving ? 'Saving…' : 'Submit'}
                            </button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {deleteId != null && (
                <ConfirmModal
                    title="Delete coupon"
                    message="Deactivate this coupon? It will no longer appear in the list."
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete selected coupons"
                    message={`Deactivate ${selected.size} coupon(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
