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
    TextareaInput,
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
    account_id: '',
    account_no: '',
    name: '',
    initial_balance: '',
    note: '',
};

function hasAccountAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === 'account-index' || p === 'account-view' || p.startsWith('account-')
    );
}

function formatValidationError(err) {
    if (err?.errors && typeof err.errors === 'object') {
        const first = Object.values(err.errors).flat()[0];
        if (first) return first;
    }
    return err?.message || 'Request failed';
}

export default function AccountList({ controllerName }) {
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'accounts');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasAccountAccess(authPerms);
    const canManage = canView;

    const [rows, setRows] = useState([]);
    const [decimal, setDecimal] = useState(2);
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
    const [defaultLoadingId, setDefaultLoadingId] = useState(null);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('accounts');
            setRows(res.data?.data || []);
            if (res.data?.decimal != null) setDecimal(res.data.decimal);
        } catch (err) {
            showToast(err?.message || 'Failed to load accounts.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(
            (r) =>
                (r.account_no || '').toLowerCase().includes(q) ||
                (r.name || '').toLowerCase().includes(q) ||
                (r.note || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);

    const totalInitial = useMemo(
        () => filtered.reduce((sum, row) => sum + (parseFloat(row.initial_balance_raw) || 0), 0),
        [filtered]
    );

    const totalBalance = useMemo(
        () => filtered.reduce((sum, row) => sum + (parseFloat(row.balance_raw) || 0), 0),
        [filtered]
    );

    const resetForm = () => setForm(EMPTY_FORM);

    const validateForm = () => {
        if (!form.account_no?.trim() || !form.name?.trim()) {
            showToast('Account number and name are required.', 'error');
            return false;
        }
        return true;
    };

    const handleAdd = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            await api.post('accounts', {
                account_no: form.account_no.trim(),
                name: form.name.trim(),
                initial_balance: form.initial_balance === '' ? 0 : form.initial_balance,
                note: form.note || '',
            });
            showToast('Account created.', 'success');
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
            account_id: String(row.id),
            account_no: row.account_no || '',
            name: row.name || '',
            initial_balance: row.initial_balance_raw ?? '',
            note: row.note || '',
        });
        setEditOpen(true);
    };

    const handleEdit = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            await api.put(`accounts/${form.account_id}`, {
                account_id: form.account_id,
                account_no: form.account_no.trim(),
                name: form.name.trim(),
                initial_balance: form.initial_balance === '' ? 0 : form.initial_balance,
                note: form.note || '',
            });
            showToast('Account updated.', 'success');
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
            await api.delete(`accounts/${id}`);
            showToast('Account deleted.', 'success');
            setDeleteId(null);
            fetchRows();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        }
    };

    const handleMakeDefault = async (row) => {
        if (row.is_default) {
            showToast('Please make another account default first!', 'error');
            return;
        }
        setDefaultLoadingId(row.id);
        try {
            await api.get(`make-default/${row.id}`);
            showToast('Account set as default.', 'success');
            fetchRows();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setDefaultLoadingId(null);
        }
    };

    const renderFormFields = () => (
        <>
            <FormRow>
                <FormField label="Account No" required>
                    <TextInput
                        required
                        value={form.account_no}
                        onChange={(e) => setForm({ ...form, account_no: e.target.value })}
                        placeholder="Account number"
                    />
                </FormField>
                <FormField label="Name" required>
                    <TextInput
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Account name"
                    />
                </FormField>
            </FormRow>
            <FormRow>
                <FormField label="Initial balance">
                    <NumberInput
                        step="any"
                        value={form.initial_balance}
                        onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
                    />
                </FormField>
            </FormRow>
            <FormField label="Note">
                <TextareaInput
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
            </FormField>
        </>
    );

    const columns = [
        { label: 'Account No', key: 'account_no', sortable: true },
        { label: 'Name', key: 'name', sortable: true },
        { label: 'Initial Balance', key: 'initial_balance', align: 'right' },
        { label: 'Available Balance', key: 'balance', align: 'right' },
        {
            label: 'Default',
            key: 'is_default',
            render: (row) => (
                <input
                    type="checkbox"
                    checked={!!row.is_default}
                    disabled={defaultLoadingId === row.id}
                    onChange={() => handleMakeDefault(row)}
                    title={row.is_default ? 'Default account' : 'Set as default'}
                />
            ),
        },
        {
            label: 'Note',
            key: 'note',
            render: (row) => (
                <span className="text-truncate d-inline-block" style={{ maxWidth: 160 }} title={row.note}>
                    {row.note || '—'}
                </span>
            ),
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canManage && { label: 'Edit', onClick: () => openEdit(row) },
                    canManage && !row.is_default && {
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
            <PageLayout eyebrow="Accounting" title="Account List">
                <p className="text-muted">You do not have permission to view accounts.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Accounting" title="Account List">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3">
                {canManage && (
                    <button type="button" className="ui-btn primary" onClick={() => { resetForm(); setAddOpen(true); }}>
                        Add account
                    </button>
                )}
            </div>

            <div className="mb-3">
                <TextInput
                    placeholder="Search account no, name, note…"
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
                emptyMessage="No accounts found."
            />

            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                <div className="d-flex flex-wrap gap-3">
                    <strong>Initial total: {totalInitial.toFixed(decimal)}</strong>
                    <strong>Available total: {totalBalance.toFixed(decimal)}</strong>
                </div>
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
                <Modal title="Add Account" onClose={() => setAddOpen(false)}>
                    {renderFormFields()}
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
                <Modal title="Update Account" onClose={() => setEditOpen(false)}>
                    {renderFormFields()}
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
                    title="Delete account"
                    message="Are you sure you want to delete this account?"
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </PageLayout>
    );
}
