import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PageLayout,
    DataTable,
    ConfirmModal,
    Modal,
    TextInput,
    SelectInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    FormField,
    FormRow,
    FormSection,
    SelectionBar,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

const TYPE_OPTIONS = [
    { value: '', label: 'Select type…' },
    { value: 'steadfast', label: 'Steadfast' },
    { value: 'pathao', label: 'Pathao' },
    { value: 'redx', label: 'Redx' },
    { value: 'paperfly', label: 'Paperfly' },
    { value: 'other', label: 'Other' },
];

const emptyForm = () => ({
    id: '',
    name: '',
    type: '',
    phone_number: '',
    address: '',
    api_key: '',
    secret_key: '',
    base_url: '',
    client_id: '',
    client_secret: '',
    pathao_username: '',
    pathao_password: '',
    paperfly_username: '',
    paperfly_password: '',
    api_token: '',
});

function hasCourierAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'courier' ||
            p === 'couriers.view' ||
            p.startsWith('couriers.')
    );
}

function formatValidationError(err) {
    if (err?.errors && typeof err.errors === 'object') {
        const first = Object.values(err.errors).flat()[0];
        if (first) return first;
    }
    return err?.message || 'Request failed';
}

function TypeFields({ type, form, setForm }) {
    if (type === 'steadfast') {
        return (
            <FormSection title="Steadfast API settings">
                <FormRow>
                    <FormField label="API key *">
                        <TextInput
                            value={form.api_key}
                            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Secret key *">
                        <TextInput
                            value={form.secret_key}
                            onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
                        />
                    </FormField>
                </FormRow>
            </FormSection>
        );
    }

    if (type === 'pathao') {
        return (
            <FormSection title="Pathao API settings">
                <FormField label="Base URL *">
                    <TextInput
                        value={form.base_url}
                        onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                        placeholder="https://courier-api-sandbox.pathao.com"
                    />
                </FormField>
                <FormRow>
                    <FormField label="Client ID *">
                        <TextInput
                            value={form.client_id}
                            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Client secret *">
                        <TextInput
                            value={form.client_secret}
                            onChange={(e) => setForm({ ...form, client_secret: e.target.value })}
                        />
                    </FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Username *">
                        <TextInput
                            value={form.pathao_username}
                            onChange={(e) => setForm({ ...form, pathao_username: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Password *">
                        <TextInput
                            type="password"
                            value={form.pathao_password}
                            onChange={(e) => setForm({ ...form, pathao_password: e.target.value })}
                        />
                    </FormField>
                </FormRow>
            </FormSection>
        );
    }

    if (type === 'redx') {
        return (
            <FormSection title="Redx API settings">
                <FormField label="API token *">
                    <TextInput
                        value={form.api_token}
                        onChange={(e) => setForm({ ...form, api_token: e.target.value })}
                    />
                </FormField>
            </FormSection>
        );
    }

    if (type === 'paperfly') {
        return (
            <FormSection title="Paperfly API settings">
                <FormRow>
                    <FormField label="Username *">
                        <TextInput
                            value={form.paperfly_username}
                            onChange={(e) => setForm({ ...form, paperfly_username: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Password *">
                        <TextInput
                            type="password"
                            value={form.paperfly_password}
                            onChange={(e) => setForm({ ...form, paperfly_password: e.target.value })}
                        />
                    </FormField>
                </FormRow>
            </FormSection>
        );
    }

    return null;
}

export default function CourierList({ controllerName }) {
    const { toast, showToast } = useToast();
    const ctrl = controllerName || 'couriers';
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasCourierAccess(authPerms);
    const canAdd = perms.canAdd || hasCourierAccess(authPerms);
    const canEdit = perms.canEdit || hasCourierAccess(authPerms);
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

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({ search });
            const res = await api.get(`couriers?${q}`);
            setRows(res.data?.data || []);
            setSelected(new Set());
        } catch (err) {
            showToast(err?.message || 'Failed to load couriers.', 'error');
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

    const openAdd = () => {
        setForm(emptyForm());
        setAddOpen(true);
    };

    const openEdit = async (row) => {
        try {
            const res = await api.get(`couriers/${row.id}`);
            const c = res.data?.courier || {};
            setForm({
                id: String(c.id || row.id),
                name: c.name || '',
                type: c.type || '',
                phone_number: c.phone_number || '',
                address: c.address || '',
                api_key: c.api_key || '',
                secret_key: c.secret_key || '',
                base_url: c.base_url || '',
                client_id: c.client_id || '',
                client_secret: c.client_secret || '',
                pathao_username: c.pathao_username || '',
                pathao_password: c.pathao_password || '',
                paperfly_username: c.paperfly_username || '',
                paperfly_password: c.paperfly_password || '',
                api_token: c.api_token || '',
            });
            setEditOpen(true);
        } catch (err) {
            showToast(err?.message || 'Failed to load courier.', 'error');
        }
    };

    const buildPayload = () => ({
        name: form.name.trim(),
        type: form.type,
        phone_number: form.phone_number || '',
        address: form.address || '',
        api_key: form.api_key || null,
        secret_key: form.secret_key || null,
        base_url: form.base_url || null,
        client_id: form.client_id || null,
        client_secret: form.client_secret || null,
        pathao_username: form.pathao_username || null,
        pathao_password: form.pathao_password || null,
        paperfly_username: form.paperfly_username || null,
        paperfly_password: form.paperfly_password || null,
        api_token: form.api_token || null,
    });

    const handleAdd = async () => {
        if (!form.name || !form.type) {
            showToast('Name and courier type are required.', 'error');
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('couriers', buildPayload());
            showToast(res.data?.message || 'Courier created.', 'success');
            setAddOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async () => {
        if (!form.name || !form.type) {
            showToast('Name and courier type are required.', 'error');
            return;
        }
        setSaving(true);
        try {
            const res = await api.put(`couriers/${form.id}`, buildPayload());
            showToast(res.data?.message || 'Courier updated.', 'success');
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
            await api.delete(`couriers/${id}`);
            showToast('Courier deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete courier.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.post('couriers/deletebyselection', {
                courierIdArray: Array.from(selected),
            });
            showToast(res.data?.message || 'Couriers deleted.', 'success');
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
        <>
            <FormRow>
                <FormField label="Name *">
                    <TextInput
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />
                </FormField>
                <FormField label="Courier type *">
                    <SelectInput
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        options={TYPE_OPTIONS}
                    />
                </FormField>
                <FormField label="Phone number">
                    <TextInput
                        value={form.phone_number}
                        onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    />
                </FormField>
                <FormField label="Address">
                    <TextInput
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                </FormField>
            </FormRow>
            <TypeFields type={form.type} form={form} setForm={setForm} />
        </>
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
        { label: 'Name', key: 'name', sortable: true },
        {
            label: 'Type',
            key: 'type',
            render: (row) => <span className="ui-badge ghost">{row.type}</span>,
        },
        { label: 'Phone number', key: 'phone_number' },
        { label: 'Address', key: 'address' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canEdit && {
                        label: 'Edit',
                        onClick: () => openEdit(row),
                    },
                    canDelete && {
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
            <PageLayout eyebrow="Sale" title="Courier List">
                <p className="text-muted">You do not have permission to view couriers.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Sale" title="Courier List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {canAdd && (
                    <button type="button" className="ui-btn primary" onClick={openAdd}>
                        Add courier
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
                        placeholder="Name, type, phone, address…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </FormField>
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No couriers found."
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
                isOpen={addOpen}
                title="Add courier"
                onClose={() => !saving && setAddOpen(false)}
                footer={
                    <>
                        <button type="button" className="ui-btn ghost" disabled={saving} onClick={() => setAddOpen(false)}>Cancel</button>
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleAdd}>
                            {saving ? 'Saving…' : 'Create'}
                        </button>
                    </>
                }
            >
                {renderFormFields()}
            </Modal>

            <Modal
                isOpen={editOpen}
                title="Update courier"
                onClose={() => !saving && setEditOpen(false)}
                footer={
                    <>
                        <button type="button" className="ui-btn ghost" disabled={saving} onClick={() => setEditOpen(false)}>Cancel</button>
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleEdit}>
                            {saving ? 'Saving…' : 'Update'}
                        </button>
                    </>
                }
            >
                {renderFormFields()}
            </Modal>

            {deleteId != null && (
                <ConfirmModal
                    title="Delete courier"
                    message="Deactivate this courier? It will no longer appear in the list."
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete selected couriers"
                    message={`Deactivate ${selected.size} courier(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
