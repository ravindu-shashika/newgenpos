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

const STATUS_OPTIONS = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
];

const PAID_OPTIONS = [
    { value: '1', label: 'Yes' },
    { value: '0', label: 'No' },
];

const INITIAL_FORM = {
    id: null,
    employee_id: '',
    leave_types: '',
    start_date: '',
    end_date: '',
};

const INITIAL_LEAVE_TYPE_FORM = {
    name: '',
    annual_quota: '',
    encashable: '0',
    carry_forward_limit: '',
};

function hasLeavePermission(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('leave') || list.includes('leaves');
}

function statusBadgeClass(status) {
    if (status === 'Approved') return 'success';
    if (status === 'Rejected') return 'warning';
    return 'ghost';
}

const LeaveManager = ({ controllerName }) => {
    const ctrl = controllerName || 'leaves';
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const legacyAccess = hasLeavePermission(authPerms);
    const canView = perms.canView || legacyAccess;
    const canAdd = perms.canAdd || legacyAccess;
    const canEdit = perms.canEdit || legacyAccess;
    const canDelete = perms.canDelete || legacyAccess;

    const [allRows, setAllRows] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('start_date_display');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);
    const [statusUpdating, setStatusUpdating] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [leaveTypeOpen, setLeaveTypeOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [leaveTypeForm, setLeaveTypeForm] = useState(INITIAL_LEAVE_TYPE_FORM);
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();
    const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));
    const patchLeaveTypeForm = (patch) => setLeaveTypeForm((f) => ({ ...f, ...patch }));

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('leave');
            applyListResponse(res);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load leaves.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyListResponse = (res) => {
        if (res.data?.leaves) setAllRows(res.data.leaves);
        if (res.data?.employees) setEmployees(res.data.employees);
        if (res.data?.leave_types) setLeaveTypes(res.data.leave_types);
    };

    const employeeOptions = useMemo(
        () => employees.map((e) => ({ value: String(e.id), label: e.name })),
        [employees]
    );

    const leaveTypeOptions = useMemo(
        () => leaveTypes.map((t) => ({ value: String(t.id), label: t.name })),
        [leaveTypes]
    );

    const filteredRows = useMemo(() => {
        let rows = allRows;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.employee_name || '').toLowerCase().includes(q) ||
                (r.leave_type_name || '').toLowerCase().includes(q) ||
                (r.status || '').toLowerCase().includes(q) ||
                (r.start_date_display || '').toLowerCase().includes(q) ||
                (r.end_date_display || '').toLowerCase().includes(q)
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

    const today = () => new Date().toISOString().slice(0, 10);

    const openAdd = () => {
        const d = today();
        setForm({ ...INITIAL_FORM, start_date: d, end_date: d });
        setAddOpen(true);
    };

    const openEdit = (row) => {
        setForm({
            id: row.id,
            employee_id: String(row.employee_id),
            leave_types: String(row.leave_types),
            start_date: row.start_date?.slice(0, 10) || '',
            end_date: row.end_date?.slice(0, 10) || '',
        });
        setEditOpen(true);
        setOpenMenu(null);
    };

    const validateForm = () => {
        if (!form.employee_id) {
            showToast('Please select an employee.', 'error');
            return false;
        }
        if (!form.leave_types) {
            showToast('Please select a leave type.', 'error');
            return false;
        }
        if (!form.start_date || !form.end_date) {
            showToast('Start and end dates are required.', 'error');
            return false;
        }
        if (form.start_date > form.end_date) {
            showToast('End date must be on or after start date.', 'error');
            return false;
        }
        return true;
    };

    const buildPayload = () => ({
        employee_id: Number(form.employee_id),
        leave_types: Number(form.leave_types),
        start_date: form.start_date,
        end_date: form.end_date,
    });

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const res = await api.post('leave', buildPayload());
            showToast(res.data?.message || 'Leave request added.', 'success');
            applyListResponse(res);
            setAddOpen(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add leave.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!validateForm() || !form.id) return;
        try {
            setSaving(true);
            const res = await api.put(`leave/${form.id}`, buildPayload());
            showToast(res.data?.message || 'Leave updated.', 'success');
            applyListResponse(res);
            setEditOpen(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update leave.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            setStatusUpdating(id);
            const res = await api.put(`leave/${id}`, { status });
            applyListResponse(res);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update status.', 'error');
            fetchData();
        } finally {
            setStatusUpdating(null);
        }
    };

    const handleAddLeaveType = async () => {
        if (!leaveTypeForm.name?.trim()) {
            showToast('Leave type name is required.', 'error');
            return;
        }
        if (leaveTypeForm.annual_quota === '' || leaveTypeForm.carry_forward_limit === '') {
            showToast('Annual quota and carry forward limit are required.', 'error');
            return;
        }

        try {
            setSaving(true);
            const res = await api.post('leave-type', {
                name: leaveTypeForm.name.trim(),
                annual_quota: Number(leaveTypeForm.annual_quota),
                encashable: leaveTypeForm.encashable === '1' ? 1 : 0,
                carry_forward_limit: Number(leaveTypeForm.carry_forward_limit),
            });
            const newType = { id: res.data?.id, name: res.data?.name };
            if (newType.id) {
                setLeaveTypes((prev) => [...prev, newType]);
                patchForm({ leave_types: String(newType.id) });
            } else {
                await fetchData();
            }
            showToast(res.data?.message || 'Leave type added.', 'success');
            setLeaveTypeOpen(false);
            setLeaveTypeForm(INITIAL_LEAVE_TYPE_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add leave type.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`leave/${deleteId}`);
            showToast(res.data?.message || 'Leave deleted.', 'success');
            applyListResponse(res);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(deleteId);
                return next;
            });
            setDeleteId(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete leave.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.post('leave/deletebyselection', {
                leaveIdArray: [...selected],
            });
            showToast(res.data?.message || 'Selected leaves deleted.', 'success');
            applyListResponse(res);
            setSelected(new Set());
            setBulkDeleteOpen(false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const renderLeaveForm = () => (
        <>
            <FormRow cols={2}>
                <FormField label="Employee" required>
                    <SelectInput
                        value={form.employee_id}
                        onChange={(e) => patchForm({ employee_id: e.target.value })}
                        options={employeeOptions}
                        placeholder="Select employee"
                    />
                </FormField>
                <FormField label="Leave Type" required>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                            <SelectInput
                                value={form.leave_types}
                                onChange={(e) => patchForm({ leave_types: e.target.value })}
                                options={leaveTypeOptions}
                                placeholder="Select leave type"
                            />
                        </div>
                        {canAdd && (
                            <button
                                type="button"
                                className="ui-btn primary"
                                title="Add leave type"
                                onClick={() => setLeaveTypeOpen(true)}
                            >
                                +
                            </button>
                        )}
                    </div>
                </FormField>
                <FormField label="Start Date" required>
                    <input
                        type="date"
                        className="ui-input"
                        value={form.start_date}
                        onChange={(e) => patchForm({ start_date: e.target.value })}
                        required
                    />
                </FormField>
                <FormField label="End Date" required>
                    <input
                        type="date"
                        className="ui-input"
                        value={form.end_date}
                        onChange={(e) => patchForm({ end_date: e.target.value })}
                        required
                    />
                </FormField>
            </FormRow>
        </>
    );

    const columns = [
        { key: 'employee_name', label: 'Employee', sortable: true },
        { key: 'leave_type_name', label: 'Leave Type', sortable: true },
        { key: 'start_date_display', label: 'Start Date', sortable: true },
        { key: 'end_date_display', label: 'End Date', sortable: true },
        { key: 'days', label: 'Days', sortable: true, align: 'right' },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => (
                canEdit ? (
                    <select
                        className="ui-select-field"
                        value={row.status}
                        disabled={statusUpdating === row.id}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        style={{ minWidth: 120 }}
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <span className={`ui-badge ${statusBadgeClass(row.status)}`}>{row.status}</span>
                )
            ),
        },
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
            <PageLayout title="Leaves">
                <p>You do not have permission to view leaves.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Leaves"
            actions={
                <>
                    {canAdd && (
                        <button type="button" className="ui-btn primary" onClick={openAdd}>
                            + Add Leave
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
                    placeholder="Search by employee, leave type, status or dates…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                loading={loading}
                columns={columns}
                rows={rows}
                emptyText="No leave records found"
                emptyIcon="🗓"
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
                    title="Add Leave"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSubmit}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    {renderLeaveForm()}
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Leave"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    {renderLeaveForm()}
                </Modal>
            )}

            {leaveTypeOpen && (
                <Modal
                    title="Add Leave Type"
                    onClose={() => setLeaveTypeOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleAddLeaveType}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    <FormRow cols={2}>
                        <FormField label="Name" required span2>
                            <TextInput
                                value={leaveTypeForm.name}
                                onChange={(e) => patchLeaveTypeForm({ name: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Annual Quota" required>
                            <NumberInput
                                min="0"
                                step="1"
                                value={leaveTypeForm.annual_quota}
                                onChange={(e) => patchLeaveTypeForm({ annual_quota: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Paid or Unpaid" required>
                            <SelectInput
                                value={leaveTypeForm.encashable}
                                onChange={(e) => patchLeaveTypeForm({ encashable: e.target.value })}
                                options={PAID_OPTIONS}
                            />
                        </FormField>
                        <FormField label="Carry Forward Limit" required span2>
                            <NumberInput
                                min="0"
                                step="1"
                                value={leaveTypeForm.carry_forward_limit}
                                onChange={(e) => patchLeaveTypeForm({ carry_forward_limit: e.target.value })}
                            />
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Leave"
                    message="Are you sure you want to delete this leave record?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                    danger
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Selected"
                    message={`Delete ${selected.size} leave record(s)?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                    danger
                />
            )}
        </PageLayout>
    );
};

export default LeaveManager;
