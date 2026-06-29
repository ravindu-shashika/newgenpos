import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    NumberInput,
    SelectInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    id: '',
    created_at: '',
    from_account_id: '',
    to_account_id: '',
    amount: '',
};

function hasMoneyTransferAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === 'money-transfer' || p === 'money-transfers' || p.startsWith('money-transfer')
    );
}

function formatValidationError(err) {
    if (err?.errors && typeof err.errors === 'object') {
        const first = Object.values(err.errors).flat()[0];
        if (first) return first;
    }
    return err?.message || 'Request failed';
}

export default function MoneyTransferList({ controllerName }) {
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'money-transfers');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasMoneyTransferAccess(authPerms);
    const canManage = canView;

    const [rows, setRows] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [decimal, setDecimal] = useState(2);
    const [defaultCreatedAt, setDefaultCreatedAt] = useState('');
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('money-transfers');
            setRows(res.data?.data || []);
            setAccounts(res.data?.accounts || []);
            if (res.data?.decimal != null) setDecimal(res.data.decimal);
            if (res.data?.default_created_at) setDefaultCreatedAt(res.data.default_created_at);
        } catch (err) {
            showToast(err?.message || 'Failed to load money transfers.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const accountOptions = useMemo(
        () => [
            { value: '', label: 'Select account…' },
            ...accounts.map((a) => ({ value: String(a.id), label: a.label || a.name })),
        ],
        [accounts]
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(
            (r) =>
                (r.reference_no || '').toLowerCase().includes(q) ||
                (r.from_account || '').toLowerCase().includes(q) ||
                (r.to_account || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);

    const totalAmount = useMemo(
        () => filtered.reduce((sum, row) => sum + (parseFloat(row.amount_raw) || 0), 0),
        [filtered]
    );

    const resetForm = () => setForm({ ...EMPTY_FORM, created_at: defaultCreatedAt });

    const validateForm = () => {
        if (!form.from_account_id || !form.to_account_id || form.amount === '') {
            showToast('From account, to account and amount are required.', 'error');
            return false;
        }
        if (form.from_account_id === form.to_account_id) {
            showToast('From and to accounts must be different.', 'error');
            return false;
        }
        return true;
    };

    const handleAdd = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            await api.post('money-transfers', {
                from_account_id: form.from_account_id,
                to_account_id: form.to_account_id,
                amount: form.amount,
            });
            showToast('Money transfer created.', 'success');
            setAddOpen(false);
            resetForm();
            fetchRows();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row) => {
        setForm({
            id: String(row.id),
            created_at: row.date || defaultCreatedAt,
            from_account_id: row.from_account_id ? String(row.from_account_id) : '',
            to_account_id: row.to_account_id ? String(row.to_account_id) : '',
            amount: row.amount_raw ?? row.amount ?? '',
        });
        setEditOpen(true);
    };

    const handleEdit = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            await api.put(`money-transfers/${form.id}`, {
                id: form.id,
                created_at: form.created_at || '',
                from_account_id: form.from_account_id,
                to_account_id: form.to_account_id,
                amount: form.amount,
            });
            showToast('Money transfer updated.', 'success');
            setEditOpen(false);
            resetForm();
            fetchRows();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`money-transfers/${id}`);
            showToast('Money transfer deleted.', 'success');
            setDeleteId(null);
            fetchRows();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        }
    };

    const renderFormFields = (includeDate = false) => (
        <>
            {includeDate && (
                <FormField label="Date">
                    <TextInput
                        value={form.created_at}
                        onChange={(e) => setForm({ ...form, created_at: e.target.value })}
                        placeholder="dd-mm-yyyy"
                    />
                </FormField>
            )}
            <FormRow>
                <FormField label="From account" required>
                    <SelectInput
                        required
                        value={form.from_account_id}
                        onChange={(e) => setForm({ ...form, from_account_id: e.target.value })}
                        options={accountOptions}
                    />
                </FormField>
                <FormField label="To account" required>
                    <SelectInput
                        required
                        value={form.to_account_id}
                        onChange={(e) => setForm({ ...form, to_account_id: e.target.value })}
                        options={accountOptions}
                    />
                </FormField>
                <FormField label="Amount" required>
                    <NumberInput
                        step="any"
                        min="0"
                        required
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                </FormField>
            </FormRow>
        </>
    );

    const columns = [
        { label: 'Date', key: 'datetime', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'From account', key: 'from_account' },
        { label: 'To account', key: 'to_account' },
        { label: 'Amount', key: 'amount', align: 'right' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canManage && { label: 'Edit', onClick: () => openEdit(row) },
                    canManage && {
                        label: 'Delete',
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
            <PageLayout eyebrow="Accounting" title="Money Transfer">
                <p className="text-muted">You do not have permission to view money transfers.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Accounting" title="Money Transfer">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3">
                {canManage && (
                    <button type="button" className="ui-btn primary" onClick={() => { resetForm(); setAddOpen(true); }}>
                        Add money transfer
                    </button>
                )}
            </div>

            <div className="mb-3">
                <TextInput
                    placeholder="Search reference or account…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyMessage="No money transfers found."
            />

            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                <strong>Total: {totalAmount.toFixed(decimal)}</strong>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    pageSizes={PAGE_SIZES}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />
            </div>

            {addOpen && (
                <Modal title="Add Money Transfer" onClose={() => setAddOpen(false)}>
                    {renderFormFields(false)}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleAdd}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                        <button type="button" className="ui-btn" onClick={() => setAddOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {editOpen && (
                <Modal title="Update Money Transfer" onClose={() => setEditOpen(false)}>
                    {renderFormFields(true)}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleEdit}>
                            {saving ? 'Saving…' : 'Update'}
                        </button>
                        <button type="button" className="ui-btn" onClick={() => setEditOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete money transfer"
                    message="Are you sure you want to delete this money transfer?"
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </PageLayout>
    );
}
