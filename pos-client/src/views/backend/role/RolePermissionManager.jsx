import React, { useState, useEffect, useMemo } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    TextInput,
    TextareaInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    name: '',
    description: '',
    role_id: null,
};

function formatPermissionLabel(name) {
    return name
        .replace(/[-_.]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function permissionGroupKey(name) {
    const dash = name.indexOf('-');
    if (dash > 0) return name.slice(0, dash);
    const under = name.indexOf('_');
    if (under > 0) return name.slice(0, under);
    return 'general';
}

const RolePermissionManager = ({ controllerName }) => {
    const ctrl = controllerName === 'role-permissions' ? 'role' : (controllerName || 'role');
    const { canAdd, canEdit, canDelete } = usePermissions(ctrl);

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [permissionRole, setPermissionRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [permSearch, setPermSearch] = useState('');
    const [permLoading, setPermLoading] = useState(false);
    const [permSaving, setPermSaving] = useState(false);

    const { toast, showToast } = useToast();

    const setField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    const filteredRoles = useMemo(() => {
        let list = [...roles];
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(
                (r) =>
                    (r.name || '').toLowerCase().includes(low) ||
                    (r.description || '').toLowerCase().includes(low)
            );
        }
        list.sort((a, b) => {
            const valA = (a[sortCol] ?? '').toString().toLowerCase();
            const valB = (b[sortCol] ?? '').toString().toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [roles, search, sortCol, sortDir]);

    const paginatedRoles = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRoles.slice(start, start + pageSize);
    }, [filteredRoles, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));

    const permissionGroups = useMemo(() => {
        const groups = {};
        const term = permSearch.trim().toLowerCase();
        for (const p of permissions) {
            if (term && !p.name.toLowerCase().includes(term)) continue;
            const key = permissionGroupKey(p.name);
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        }
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [permissions, permSearch]);

    const grantedCount = useMemo(
        () => permissions.filter((p) => p.granted).length,
        [permissions]
    );

    useEffect(() => {
        fetchRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await api.get('role');
            const data = res.data?.data ?? res.data ?? [];
            setRoles(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load roles.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const openPermissions = async (role) => {
        try {
            setPermLoading(true);
            setPermissionRole(role);
            setPermSearch('');
            const res = await api.get(`role/permission/${role.id}`);
            setPermissions(res.data?.permissions ?? []);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load permissions.';
            showToast(msg, 'error');
            setPermissionRole(null);
        } finally {
            setPermLoading(false);
        }
    };

    const closePermissions = () => {
        setPermissionRole(null);
        setPermissions([]);
        setPermSearch('');
    };

    const togglePermission = (name) => {
        setPermissions((list) =>
            list.map((p) => (p.name === name ? { ...p, granted: !p.granted } : p))
        );
    };

    const toggleGroup = (groupItems, grant) => {
        const names = new Set(groupItems.map((p) => p.name));
        setPermissions((list) =>
            list.map((p) => (names.has(p.name) ? { ...p, granted: grant } : p))
        );
    };

    const savePermissions = async () => {
        if (!permissionRole) return;
        try {
            setPermSaving(true);
            const granted = permissions.filter((p) => p.granted).map((p) => p.name);
            const res = await api.post('role/set_permission', {
                role_id: permissionRole.id,
                granted,
            });
            showToast(res.data?.message || 'Permissions updated.', 'success');
            closePermissions();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save permissions.';
            showToast(msg, 'error');
        } finally {
            setPermSaving(false);
        }
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Name is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            setSaving(true);
            const res = await api.post('role', {
                name: form.name.trim(),
                description: form.description?.trim() || '',
            });
            showToast(res.data?.message || 'Role created.', 'success');
            setAddOpen(false);
            resetForm();
            fetchRoles();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.name?.[0] ||
                'Failed to create role.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = async (role) => {
        try {
            const res = await api.get(`role/${role.id}/edit`);
            const data = res.data?.data ?? res.data ?? role;
            setForm({
                role_id: data.id,
                name: data.name || '',
                description: data.description || '',
            });
            setFormErrors({});
            setEditOpen(true);
        } catch {
            showToast('Failed to load role.', 'error');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!validateForm() || !form.role_id) return;
        try {
            setSaving(true);
            const res = await api.put(`role/${form.role_id}`, {
                role_id: form.role_id,
                name: form.name.trim(),
                description: form.description?.trim() || '',
            });
            showToast(res.data?.message || 'Role updated.', 'success');
            setEditOpen(false);
            resetForm();
            fetchRoles();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.name?.[0] ||
                'Failed to update role.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`role/${deleteId}`);
            showToast(res.data?.message || 'Role deleted.', 'success');
            setDeleteId(null);
            fetchRoles();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to delete role.';
            showToast(msg, 'error');
        }
    };

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'description', label: 'Description', sortable: true },
        {
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && {
                            label: '✎ Edit',
                            onClick: () => openEdit(row),
                        },
                        canEdit && {
                            label: '🔒 Change Permission',
                            onClick: () => openPermissions(row),
                        },
                        canDelete &&
                            !row.is_system && {
                                label: '🗑 Delete',
                                danger: true,
                                onClick: () => setDeleteId(row.id),
                            },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    if (permissionRole) {
        return (
            <PageLayout title={`Permissions — ${permissionRole.name}`}>
                <Toast toast={toast} />

                <div className="mb-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={closePermissions}>
                        ← Back to roles
                    </button>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                        <span className="text-muted small">
                            {grantedCount} / {permissions.length} granted
                        </span>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={permSaving || permLoading}
                            onClick={savePermissions}
                        >
                            {permSaving ? 'Saving…' : 'Save Permissions'}
                        </button>
                    </div>
                </div>

                <div className="mb-3">
                    <input
                        type="search"
                        className="form-control"
                        placeholder="Filter permissions…"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                    />
                </div>

                {permLoading ? (
                    <p className="text-muted">Loading permissions…</p>
                ) : (
                    <div className="row">
                        {permissionGroups.map(([group, items]) => {
                            const allGranted = items.every((p) => p.granted);
                            const someGranted = items.some((p) => p.granted);
                            return (
                                <div key={group} className="col-md-6 col-lg-4 mb-3">
                                    <div className="card h-100">
                                        <div className="card-header py-2 d-flex align-items-center justify-content-between">
                                            <strong className="text-capitalize">
                                                {formatPermissionLabel(group)}
                                            </strong>
                                            <div className="form-check mb-0">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id={`group-${group}`}
                                                    checked={allGranted}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = someGranted && !allGranted;
                                                    }}
                                                    onChange={() => toggleGroup(items, !allGranted)}
                                                />
                                                <label className="form-check-label small" htmlFor={`group-${group}`}>
                                                    All
                                                </label>
                                            </div>
                                        </div>
                                        <div className="card-body py-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                                            {items.map((p) => (
                                                <div key={p.name} className="form-check mb-1">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={`perm-${p.name}`}
                                                        checked={!!p.granted}
                                                        onChange={() => togglePermission(p.name)}
                                                    />
                                                    <label
                                                        className="form-check-label small"
                                                        htmlFor={`perm-${p.name}`}
                                                        title={p.name}
                                                    >
                                                        {formatPermissionLabel(p.name)}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {!permissionGroups.length && (
                            <div className="col-12">
                                <p className="text-muted mb-0">No permissions match your filter.</p>
                            </div>
                        )}
                    </div>
                )}
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Role Permission"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
        >
            <Toast toast={toast} />

            <div className="mb-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                {canAdd && (
                    <button
                        type="button"
                        className="btn btn-info"
                        onClick={() => {
                            resetForm();
                            setAddOpen(true);
                        }}
                    >
                        + Add Role
                    </button>
                )}
                <input
                    type="search"
                    className="form-control form-control-sm"
                    style={{ maxWidth: 280 }}
                    placeholder="Search roles…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginatedRoles}
                loading={loading}
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(col) => {
                    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    else {
                        setSortCol(col);
                        setSortDir('asc');
                    }
                }}
                emptyText="No roles found."
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                totalRows={filteredRoles.length}
                onChange={setPage}
                onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />

            {addOpen && (
                <Modal
                    title="Add Role"
                    onClose={() => {
                        setAddOpen(false);
                        resetForm();
                    }}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setAddOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" disabled={saving} onClick={handleCreate}>
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </>
                    }
                >
                    <form onSubmit={handleCreate}>
                        <FormField label="Name *" error={formErrors.name}>
                            <TextInput value={form.name} onChange={setField('name')} required />
                        </FormField>
                        <FormField label="Description">
                            <TextareaInput value={form.description} onChange={setField('description')} rows={4} />
                        </FormField>
                    </form>
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Edit Role"
                    onClose={() => {
                        setEditOpen(false);
                        resetForm();
                    }}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setEditOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                                {saving ? 'Saving…' : 'Update'}
                            </button>
                        </>
                    }
                >
                    <form onSubmit={handleUpdate}>
                        <FormField label="Name *" error={formErrors.name}>
                            <TextInput value={form.name} onChange={setField('name')} required />
                        </FormField>
                        <FormField label="Description">
                            <TextareaInput value={form.description} onChange={setField('description')} rows={4} />
                        </FormField>
                    </form>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Role"
                    message="Are you sure you want to delete this role?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </PageLayout>
    );
};

export default RolePermissionManager;
