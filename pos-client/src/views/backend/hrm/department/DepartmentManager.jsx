import React, { useState, useEffect, useMemo } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    TextInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../../components/ui';
import { api } from '../../../../services';
import authStore from '../../../../stores/authStore';
import usePermissions from '../../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    name: '',
    department_id: null,
};

function hasDepartmentAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'department' ||
            p === 'departments' ||
            p.startsWith('departments.')
    );
}

const DepartmentManager = ({ controllerName }) => {
    const ctrl = controllerName || 'departments';
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const legacyAccess = hasDepartmentAccess(authPerms);
    const canView = perms.canView || legacyAccess;
    const canAdd = perms.canAdd || legacyAccess;
    const canEdit = perms.canEdit || legacyAccess;
    const canDelete = perms.canDelete || legacyAccess;

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();

    const setField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    useEffect(() => {
        fetchDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await api.get('departments');
            const data = res.data?.data ?? res.data ?? [];
            setRows(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load departments.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredAndSorted = useMemo(() => {
        let list = [...rows];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((r) => (r.name || '').toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            const va = String(a[sortCol] ?? '').toLowerCase();
            const vb = String(b[sortCol] ?? '').toLowerCase();
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [rows, search, sortCol, sortDir]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize) || 1);

    const toggleRow = (id) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const toggleAll = () => {
        const ids = paginated.map((r) => r.id);
        const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const validate = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Department name is required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAdd = async () => {
        if (!validate()) return;
        try {
            setSaving(true);
            const res = await api.post('departments', { name: form.name.trim() });
            showToast(res.data?.message || 'Department created.', 'success');
            setAddOpen(false);
            resetForm();
            fetchDepartments();
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to create department.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row) => {
        setForm({ name: row.name || '', department_id: row.id });
        setFormErrors({});
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!validate() || !form.department_id) return;
        try {
            setSaving(true);
            const res = await api.put(`departments/${form.department_id}`, {
                name: form.name.trim(),
                department_id: form.department_id,
            });
            showToast(res.data?.message || 'Department updated.', 'success');
            setEditOpen(false);
            resetForm();
            fetchDepartments();
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to update department.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`departments/${deleteId}`);
            showToast(res.data?.message || 'Department deleted.', 'success');
            setDeleteId(null);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(deleteId);
                return next;
            });
            fetchDepartments();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete department.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.post('departments/deletebyselection', {
                departmentIdArray: [...selected],
            });
            showToast(res.data?.message || `${selected.size} department(s) deleted.`, 'success');
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchDepartments();
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const columns = [
        { label: 'Department', key: 'name', sortable: true },
        {
            label: 'Action',
            key: 'action',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && { label: '✎ Edit', onClick: () => openEdit(row) },
                        canEdit && canDelete && { divider: true },
                        canDelete && {
                            label: '🗑 Delete',
                            danger: true,
                            onClick: () => setDeleteId(row.id),
                        },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    if (!canView) {
        return (
            <PageLayout title="Department">
                <p>You do not have permission to view departments.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Department"
            onClick={(e) => {
                if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null);
            }}
            actions={
                <>
                    {canAdd && (
                        <button
                            type="button"
                            className="ui-btn primary"
                            onClick={() => {
                                resetForm();
                                setAddOpen(true);
                            }}
                        >
                            Add Department
                        </button>
                    )}
                    {selected.size > 0 && canDelete && (
                        <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                            Delete Selected ({selected.size})
                        </button>
                    )}
                </>
            }
        >
            <Toast toast={toast} />

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                search={search}
                onSearchChange={(v) => {
                    setSearch(v);
                    setPage(1);
                }}
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(col) => {
                    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    else {
                        setSortCol(col);
                        setSortDir('asc');
                    }
                }}
                selected={canDelete ? selected : undefined}
                onToggleRow={canDelete ? toggleRow : undefined}
                onToggleAll={canDelete ? toggleAll : undefined}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                totalItems={filteredAndSorted.length}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />

            {addOpen && (
                <Modal
                    title="Add Department"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setAddOpen(false)}>
                                Cancel
                            </button>
                            {canAdd && (
                                <button type="button" className="ui-btn primary" disabled={saving} onClick={handleAdd}>
                                    {saving ? 'Saving…' : 'Submit'}
                                </button>
                            )}
                        </>
                    }
                >
                    <FormField label="Name" required error={formErrors.name}>
                        <TextInput
                            value={form.name}
                            onChange={setField('name')}
                            placeholder="Type department name"
                        />
                    </FormField>
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Department"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setEditOpen(false)}>
                                Cancel
                            </button>
                            {canEdit && (
                                <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                                    {saving ? 'Saving…' : 'Submit'}
                                </button>
                            )}
                        </>
                    }
                >
                    <FormField label="Name" required error={formErrors.name}>
                        <TextInput value={form.name} onChange={setField('name')} />
                    </FormField>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete department?"
                    message="Are you sure you want to delete this department?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete selected departments?"
                    message={`Are you sure you want to delete ${selected.size} department(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
};

export default DepartmentManager;
