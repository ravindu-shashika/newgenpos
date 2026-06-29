import React, { useState, useEffect, useMemo } from 'react';

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
    SelectionBar,
} from '../../../../components/ui';
import api from '../../../../services/api';
import authStore from '../../../../stores/authStore';
import usePermissions from '../../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, 100];

const PAID_OPTIONS = [
    { value: '1', label: 'Yes' },
    { value: '0', label: 'No' },
];

const INITIAL_FORM = {
    id: null,
    name: '',
    annual_quota: '',
    encashable: '0',
    carry_forward_limit: '',
};

function hasLeaveTypePermission(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('leave-type') || list.includes('leave-types');
}

const LeaveTypeManager = ({ controllerName }) => {
    const ctrl = controllerName || 'leave-types';
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const legacyAccess = hasLeaveTypePermission(authPerms);
    const canView = perms.canView || legacyAccess;
    const canAdd = perms.canAdd || legacyAccess;
    const canEdit = perms.canEdit || legacyAccess;
    const canDelete = perms.canDelete || legacyAccess;

    const [allRows, setAllRows] = useState([]);
    const [userVerified, setUserVerified] = useState(true);
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
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();
    const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('leave-type');
            setAllRows(res.data?.leave_types || []);
            setUserVerified(res.data?.user_verified !== false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load leave types.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyListResponse = (res) => {
        if (res.data?.leave_types) setAllRows(res.data.leave_types);
    };

    const filteredRows = useMemo(() => {
        let rows = allRows;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.name || '').toLowerCase().includes(q) ||
                (r.encashable_label || '').toLowerCase().includes(q) ||
                String(r.annual_quota ?? '').includes(q) ||
                String(r.carry_forward_limit ?? '').includes(q)
            );
        }
        return [...rows].sort((a, b) => {
            const av = a[sortCol];
            const bv = b[sortCol];
            if (typeof av === 'number' && typeof bv === 'number') {
                return sortDir === 'asc' ? av - bv : bv - av;
            }
            const as = String(av ?? '').toLowerCase();
            const bs = String(bv ?? '').toLowerCase();
            if (as < bs) return sortDir === 'asc' ? -1 : 1;
            if (as > bs) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allRows, search, sortCol, sortDir]);

    const rows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    const totalRows = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize) || 1);

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const ids = rows.map((r) => r.id);
        const allSelected = ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => {
                if (allSelected) next.delete(id);
                else next.add(id);
            });
            return next;
        });
    };

    const openAdd = () => {
        setForm(INITIAL_FORM);
        setAddOpen(true);
    };

    const openEdit = (row) => {
        setForm({
            id: row.id,
            name: row.name || '',
            annual_quota: String(row.annual_quota ?? ''),
            encashable: row.encashable ? '1' : '0',
            carry_forward_limit: String(row.carry_forward_limit ?? ''),
        });
        setEditOpen(true);
        setOpenMenu(null);
    };

    const validateForm = () => {
        if (!form.name?.trim()) {
            showToast('Name is required.', 'error');
            return false;
        }
        if (form.annual_quota === '' || Number(form.annual_quota) < 0) {
            showToast('Annual quota must be zero or greater.', 'error');
            return false;
        }
        if (form.carry_forward_limit === '' || Number(form.carry_forward_limit) < 0) {
            showToast('Carry forward limit must be zero or greater.', 'error');
            return false;
        }
        return true;
    };

    const buildPayload = () => ({
        name: form.name.trim(),
        annual_quota: Number(form.annual_quota),
        encashable: form.encashable === '1' ? 1 : 0,
        carry_forward_limit: Number(form.carry_forward_limit),
    });

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const res = await api.post('leave-type', buildPayload());
            showToast(res.data?.message || 'Leave type added.', 'success');
            applyListResponse(res);
            setAddOpen(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add leave type.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!validateForm() || !form.id) return;
        try {
            setSaving(true);
            const res = await api.put(`leave-type/${form.id}`, {
                ...buildPayload(),
                leave_types: form.id,
            });
            showToast(res.data?.message || 'Leave type updated.', 'success');
            applyListResponse(res);
            setEditOpen(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update leave type.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`leave-type/${deleteId}`);
            showToast(res.data?.message || 'Leave type deleted.', 'success');
            applyListResponse(res);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(deleteId);
                return next;
            });
            setDeleteId(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete leave type.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (!userVerified) {
            showToast('This feature is disabled for demo.', 'error');
            return;
        }
        try {
            const res = await api.post('leave-type/deletebyselection', {
                leaveTypeIdArray: [...selected],
            });
            showToast(res.data?.message || 'Selected leave types deleted.', 'success');
            applyListResponse(res);
            setSelected(new Set());
            setBulkDeleteOpen(false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const renderForm = () => (
        <FormRow cols={2}>
            <FormField label="Name" required span2>
                <TextInput
                    value={form.name}
                    onChange={(e) => patchForm({ name: e.target.value })}
                    placeholder="e.g. Casual Leave, Sick Leave"
                />
            </FormField>
            <FormField label="Annual Quota" required>
                <NumberInput
                    min="0"
                    step="1"
                    value={form.annual_quota}
                    onChange={(e) => patchForm({ annual_quota: e.target.value })}
                />
            </FormField>
            <FormField label="Paid or Unpaid" required>
                <SelectInput
                    value={form.encashable}
                    onChange={(e) => patchForm({ encashable: e.target.value })}
                    options={PAID_OPTIONS}
                />
            </FormField>
            <FormField label="Carry Forward Limit" required span2>
                <NumberInput
                    min="0"
                    step="1"
                    value={form.carry_forward_limit}
                    onChange={(e) => patchForm({ carry_forward_limit: e.target.value })}
                />
            </FormField>
        </FormRow>
    );

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'annual_quota', label: 'Annual Quota', sortable: true, align: 'right' },
        { key: 'encashable_label', label: 'Paid or Unpaid', sortable: true },
        { key: 'carry_forward_limit', label: 'Carry Forward Limit', sortable: true, align: 'right' },
        {
            key: 'actions',
            label: '',
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
            <PageLayout title="Leave Type">
                <p>You do not have permission to view leave types.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Leave Type"
            actions={
                <>
                    {canAdd && (
                        <button type="button" className="ui-btn primary" onClick={openAdd}>
                            + Add Leave Type
                        </button>
                    )}
                    {selected.size > 0 && canDelete && (
                        <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                            Delete Selected ({selected.size})
                        </button>
                    )}
                </>
            }
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
        >
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name or quota…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                loading={loading}
                columns={columns}
                rows={rows}
                emptyText="No leave types found"
                emptyIcon="🏷"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(k) => { setSortCol(k); setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); }}
                selected={canDelete ? selected : undefined}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRows={totalRows}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {addOpen && (
                <Modal
                    title="Add Leave Type"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSubmit}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    {renderForm()}
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Leave Type"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    {renderForm()}
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Leave Type"
                    message="Are you sure you want to delete this leave type?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                    danger
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Selected"
                    message={`Delete ${selected.size} leave type record(s)?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                    danger
                />
            )}
        </PageLayout>
    );
};

export default LeaveTypeManager;
