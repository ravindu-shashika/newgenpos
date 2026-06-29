import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    TextareaInput,
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
    name: '',
    warehouse_id: '',
    notes: '',
    terminal_id: null,
};

function hasTerminalPermission(permissions, key) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(`terminals-${key}`);
}

export default function TerminalManager({ controllerName }) {
    const ctrl = controllerName || 'terminals';
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const canView = perms.canView || hasTerminalPermission(authPerms, 'index');
    const canAdd = perms.canAdd || hasTerminalPermission(authPerms, 'add');
    const canEdit = perms.canEdit || hasTerminalPermission(authPerms, 'edit');
    const canDelete = perms.canDelete || hasTerminalPermission(authPerms, 'delete');

    const [rows, setRows] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [tokenModal, setTokenModal] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('terminal');
            setRows(res.data?.data || []);
        } catch (err) {
            showToast(err?.message || 'Failed to load terminals.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchWarehouses = useCallback(async () => {
        try {
            const res = await api.get('warehouse');
            const data = res.data?.data ?? res.data ?? [];
            setWarehouses(Array.isArray(data) ? data : []);
        } catch {
            setWarehouses([]);
        }
    }, []);

    useEffect(() => {
        fetchRows();
        fetchWarehouses();
    }, [fetchRows, fetchWarehouses]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const validate = (f) => {
        const e = {};
        if (!f.name?.trim()) e.name = 'Terminal name is required.';
        return e;
    };

    const handleViewCredentials = async (row) => {
        try {
            const res = await api.get(`terminal/${row.id}`);
            const data = res.data?.data;
            if (!data) {
                showToast('Terminal details not found.', 'error');
                return;
            }
            setTokenModal({
                title: `Terminal — ${data.name || data.code}`,
                name: data.name,
                code: data.code,
                token: data.activation_token_plain || data.activation_token,
                warehouseName: data.warehouse_name,
                deviceId: data.device_id,
                isActive: data.is_active,
                message: 'Enter these on the POS device during setup (Activate & download).',
            });
        } catch (err) {
            showToast(err?.message || 'Failed to load terminal credentials.', 'error');
        }
    };

    const openCredentialsModal = (data, title, message) => {
        setTokenModal({
            title,
            name: data.name,
            code: data.code,
            token: data.activation_token_plain || data.activation_token,
            warehouseName: data.warehouse_name,
            deviceId: data.device_id,
            isActive: data.is_active,
            message,
        });
    };

    const handleAdd = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) {
            setFormErrors(errs);
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('terminal', {
                name: form.name.trim(),
                warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : null,
                notes: form.notes?.trim() || null,
            });
            setAddOpen(false);
            resetForm();
            fetchRows();
            showToast('Terminal created. Activate it and share the code with the POS device.', 'success');
            const created = res.data?.data;
            if (created?.activation_token_plain || created?.activation_token) {
                openCredentialsModal(
                    created,
                    'Terminal created',
                    'Activate this terminal, then share code and token with the POS device.',
                );
            }
        } catch (err) {
            showToast(err?.message || 'Failed to create terminal.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row) => {
        setForm({
            name: row.name || '',
            warehouse_id: row.warehouse_id ? String(row.warehouse_id) : '',
            notes: row.notes || '',
            terminal_id: row.id,
        });
        setFormErrors({});
        setEditOpen(true);
    };

    const handleEdit = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) {
            setFormErrors(errs);
            return;
        }
        setSaving(true);
        try {
            await api.put(`terminal/${form.terminal_id}`, {
                name: form.name.trim(),
                warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : null,
                notes: form.notes?.trim() || null,
            });
            setEditOpen(false);
            resetForm();
            fetchRows();
            showToast('Terminal updated.', 'success');
        } catch (err) {
            showToast(err?.message || 'Failed to update terminal.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`terminal/${deleteId}`);
            setDeleteId(null);
            fetchRows();
            showToast('Terminal deleted.', 'success');
        } catch (err) {
            showToast(err?.message || 'Failed to delete terminal.', 'error');
        }
    };

    const handleActivate = async (id) => {
        try {
            await api.post(`terminal/${id}/activate`);
            fetchRows();
            showToast('Terminal activated.', 'success');
        } catch (err) {
            showToast(err?.message || 'Activation failed.', 'error');
        }
    };

    const handleDeactivate = async (id) => {
        try {
            await api.post(`terminal/${id}/deactivate`);
            fetchRows();
            showToast('Terminal deactivated.', 'success');
        } catch (err) {
            showToast(err?.message || 'Deactivation failed.', 'error');
        }
    };

    const handleRegenerateToken = async (row) => {
        try {
            const res = await api.post(`terminal/${row.id}/regenerate-token`);
            fetchRows();
            const data = res.data?.data;
            if (data?.activation_token_plain || data?.activation_token) {
                openCredentialsModal(
                    data,
                    'New activation token',
                    'Share this token with the POS device. Previous token is invalid.',
                );
            }
            showToast('Activation token regenerated.', 'success');
        } catch (err) {
            showToast(err?.message || 'Failed to regenerate token.', 'error');
        }
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(
            (r) =>
                (r.name || '').toLowerCase().includes(q) ||
                (r.code || '').toLowerCase().includes(q) ||
                (r.device_id || '').toLowerCase().includes(q) ||
                (r.warehouse_name || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);

    const statusBadge = (row) => (
        <span
            className={`badge ${row.is_active ? 'bg-success' : 'bg-secondary'}`}
            style={{ fontSize: '0.75rem' }}
        >
            {row.is_active ? 'Active' : 'Inactive'}
        </span>
    );

    const columns = [
        {
            label: 'Code',
            key: 'code',
            sortable: true,
            render: (row) => (
                canView ? (
                    <button
                        type="button"
                        className="btn btn-link p-0 align-baseline text-decoration-none"
                        onClick={() => handleViewCredentials(row)}
                    >
                        {row.code}
                    </button>
                ) : row.code
            ),
        },
        { label: 'Name', key: 'name', sortable: true },
        { label: 'Warehouse', key: 'warehouse_name', render: (row) => row.warehouse_name || '—' },
        { label: 'Device ID', key: 'device_id', render: (row) => row.device_id || '—' },
        { label: 'Status', key: 'status', render: (row) => statusBadge(row) },
        {
            label: 'Last active',
            key: 'last_active',
            render: (row) => row.last_active ? new Date(row.last_active).toLocaleString() : '—',
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canView && {
                        label: 'View code & token',
                        onClick: () => handleViewCredentials(row),
                    },
                    canEdit && !row.is_active && {
                        label: 'Activate',
                        onClick: () => handleActivate(row.id),
                    },
                    canEdit && row.is_active && {
                        label: 'Deactivate',
                        onClick: () => handleDeactivate(row.id),
                    },
                    canEdit && { label: 'Edit', onClick: () => openEdit(row) },
                    canEdit && {
                        label: 'Regenerate token',
                        onClick: () => handleRegenerateToken(row),
                    },
                    canDelete && { label: 'Delete', danger: true, onClick: () => setDeleteId(row.id) },
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

    const warehouseOptions = [
        { value: '', label: '— Any warehouse —' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ];

    const renderFormFields = () => (
        <>
            <FormRow>
                <FormField label="Terminal name" required error={formErrors.name}>
                    <TextInput
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Counter 1, Main POS"
                    />
                </FormField>
            </FormRow>
            <FormRow>
                <FormField label="Warehouse">
                    <SelectInput
                        value={form.warehouse_id}
                        onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                        options={warehouseOptions}
                    />
                </FormField>
            </FormRow>
            <FormRow>
                <FormField label="Notes">
                    <TextareaInput
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        rows={3}
                        placeholder="Optional notes"
                    />
                </FormField>
            </FormRow>
        </>
    );

    if (!canView) {
        return (
            <PageLayout eyebrow="Settings" title="POS Terminals">
                <p className="text-muted">You do not have permission to view terminals.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Settings" title="POS Terminals">
            <Toast toast={toast} />

            <p className="text-muted mb-3">
                Register POS terminals, activate or deactivate them, and share the terminal code
                and activation token with each device during setup.
            </p>

            <div className="d-flex flex-wrap gap-2 mb-3">
                {canAdd && (
                    <button
                        type="button"
                        className="ui-btn primary"
                        onClick={() => { resetForm(); setAddOpen(true); }}
                    >
                        Add terminal
                    </button>
                )}
            </div>

            <div className="mb-3">
                <TextInput
                    placeholder="Search name, code, device…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No terminals yet. Add a terminal and activate it for POS devices."
            />

            <Pagination
                className="mt-3"
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />

            {addOpen && (
                <Modal title="Add POS Terminal" onClose={() => setAddOpen(false)}>
                    {renderFormFields()}
                    <p className="text-muted small mt-2">
                        New terminals start as <strong>Inactive</strong>. Activate after creation
                        to allow POS registration.
                    </p>
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleAdd}>
                            {saving ? 'Saving…' : 'Create'}
                        </button>
                        <button type="button" className="ui-btn" onClick={() => setAddOpen(false)}>Cancel</button>
                    </div>
                </Modal>
            )}

            {editOpen && (
                <Modal title="Edit Terminal" onClose={() => setEditOpen(false)}>
                    {renderFormFields()}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleEdit}>
                            {saving ? 'Saving…' : 'Update'}
                        </button>
                        <button type="button" className="ui-btn" onClick={() => setEditOpen(false)}>Cancel</button>
                    </div>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete terminal"
                    message="Delete this terminal? Registered devices will no longer be linked."
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {tokenModal && (
                <Modal title={tokenModal.title} onClose={() => setTokenModal(null)}>
                    <p className="text-muted">{tokenModal.message}</p>
                    {tokenModal.name && (
                        <FormField label="Terminal name">
                            <TextInput readOnly value={tokenModal.name} />
                        </FormField>
                    )}
                    <FormField label="Status">
                        <TextInput
                            readOnly
                            value={tokenModal.isActive ? 'Active' : 'Inactive'}
                        />
                    </FormField>
                    {tokenModal.warehouseName && (
                        <FormField label="Warehouse">
                            <TextInput readOnly value={tokenModal.warehouseName} />
                        </FormField>
                    )}
                    <FormField label="Terminal code">
                        <TextInput readOnly value={tokenModal.code || ''} />
                    </FormField>
                    <FormField label="Activation token">
                        <TextInput readOnly value={tokenModal.token || ''} />
                    </FormField>
                    {tokenModal.deviceId && (
                        <FormField label="Registered device ID">
                            <TextInput readOnly value={tokenModal.deviceId} />
                        </FormField>
                    )}
                    <div className="d-flex flex-wrap gap-2 mt-3">
                        <button
                            type="button"
                            className="ui-btn primary"
                            onClick={() => {
                                navigator.clipboard?.writeText(
                                    `Terminal: ${tokenModal.name || ''}\nCode: ${tokenModal.code}\nToken: ${tokenModal.token}`
                                );
                                showToast('Copied to clipboard.', 'success');
                            }}
                        >
                            Copy code & token
                        </button>
                        <button type="button" className="ui-btn" onClick={() => setTokenModal(null)}>Close</button>
                    </div>
                </Modal>
            )}
        </PageLayout>
    );
}
