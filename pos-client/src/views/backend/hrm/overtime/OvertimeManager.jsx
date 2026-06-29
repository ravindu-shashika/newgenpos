import React, { useState, useEffect, useMemo } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
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
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
];

const INITIAL_FORM = {
    id: null,
    employee_id: '',
    date: '',
    hours: '',
    rate: '',
    status: 'pending',
};

function hasOvertimePermission(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('overtime');
}

function statusBadgeClass(status) {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'warning';
    return 'ghost';
}

const OvertimeManager = ({ controllerName }) => {
    const ctrl = controllerName || 'overtime';
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const legacyAccess = hasOvertimePermission(authPerms);
    const canView = perms.canView || legacyAccess;
    const canAdd = perms.canAdd || legacyAccess;
    const canEdit = perms.canEdit || legacyAccess;
    const canDelete = perms.canDelete || legacyAccess;

    const [allRows, setAllRows] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [userVerified, setUserVerified] = useState(true);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('date_display');
    const [sortDir, setSortDir] = useState('desc');
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
            const res = await api.get('overtime');
            setAllRows(res.data?.overtimes || []);
            setEmployees(res.data?.employees || []);
            setUserVerified(res.data?.user_verified !== false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load overtime records.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyListResponse = (res) => {
        if (res.data?.overtimes) setAllRows(res.data.overtimes);
    };

    const employeeOptions = useMemo(
        () => employees.map((e) => ({ value: String(e.id), label: e.name })),
        [employees]
    );

    const filteredRows = useMemo(() => {
        let rows = allRows;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.employee_name || '').toLowerCase().includes(q) ||
                (r.date_display || '').toLowerCase().includes(q) ||
                (r.status_label || '').toLowerCase().includes(q) ||
                String(r.hours ?? '').includes(q) ||
                String(r.rate ?? '').includes(q) ||
                String(r.amount ?? '').includes(q)
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
        setForm({ ...INITIAL_FORM, date: today() });
        setAddOpen(true);
    };

    const openEdit = (row) => {
        setForm({
            id: row.id,
            employee_id: String(row.employee_id),
            date: row.date?.slice(0, 10) || '',
            hours: String(row.hours ?? ''),
            rate: String(row.rate ?? ''),
            status: row.status || 'pending',
        });
        setEditOpen(true);
        setOpenMenu(null);
    };

    const validateForm = (includeStatus) => {
        if (!form.employee_id) {
            showToast('Please select an employee.', 'error');
            return false;
        }
        if (!form.date) {
            showToast('Date is required.', 'error');
            return false;
        }
        if (form.hours === '' || Number(form.hours) < 0) {
            showToast('Hours must be zero or greater.', 'error');
            return false;
        }
        if (form.rate === '' || Number(form.rate) < 0) {
            showToast('Rate must be zero or greater.', 'error');
            return false;
        }
        if (includeStatus && !form.status) {
            showToast('Status is required.', 'error');
            return false;
        }
        return true;
    };

    const buildPayload = (includeStatus) => {
        const payload = {
            employee_id: Number(form.employee_id),
            date: form.date,
            hours: Number(form.hours),
            rate: Number(form.rate),
        };
        if (includeStatus) payload.status = form.status;
        return payload;
    };

    const handleSubmit = async () => {
        if (!validateForm(false)) return;
        try {
            setSaving(true);
            const res = await api.post('overtime', buildPayload(false));
            showToast(res.data?.message || 'Overtime added.', 'success');
            applyListResponse(res);
            setAddOpen(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add overtime.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!validateForm(true) || !form.id) return;
        try {
            setSaving(true);
            const res = await api.put(`overtime/${form.id}`, buildPayload(true));
            showToast(res.data?.message || 'Overtime updated.', 'success');
            applyListResponse(res);
            setEditOpen(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update overtime.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`overtime/${deleteId}`);
            showToast(res.data?.message || 'Overtime deleted.', 'success');
            applyListResponse(res);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(deleteId);
                return next;
            });
            setDeleteId(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete overtime.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (!userVerified) {
            showToast('This feature is disabled for demo.', 'error');
            return;
        }
        try {
            const res = await api.post('overtime/deletebyselection', {
                overtimeIdArray: [...selected],
            });
            showToast(res.data?.message || 'Selected overtime records deleted.', 'success');
            applyListResponse(res);
            setSelected(new Set());
            setBulkDeleteOpen(false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const renderForm = (isEdit) => (
        <FormRow cols={2}>
            <FormField label="Employee" required>
                <SelectInput
                    value={form.employee_id}
                    onChange={(e) => patchForm({ employee_id: e.target.value })}
                    options={employeeOptions}
                    placeholder="Select employee"
                />
            </FormField>
            <FormField label="Date" required>
                <input
                    type="date"
                    className="ui-input"
                    value={form.date}
                    onChange={(e) => patchForm({ date: e.target.value })}
                    required
                />
            </FormField>
            <FormField label="Hours" required>
                <NumberInput
                    min="0"
                    step="0.01"
                    value={form.hours}
                    onChange={(e) => patchForm({ hours: e.target.value })}
                />
            </FormField>
            <FormField label="Rate" required>
                <NumberInput
                    min="0"
                    step="0.01"
                    value={form.rate}
                    onChange={(e) => patchForm({ rate: e.target.value })}
                />
            </FormField>
            {isEdit && (
                <FormField label="Status" required>
                    <SelectInput
                        value={form.status}
                        onChange={(e) => patchForm({ status: e.target.value })}
                        options={STATUS_OPTIONS}
                    />
                </FormField>
            )}
        </FormRow>
    );

    const columns = [
        { key: 'employee_name', label: 'Employee', sortable: true },
        { key: 'date_display', label: 'Date', sortable: true },
        { key: 'hours', label: 'Hours', sortable: true, align: 'right' },
        { key: 'rate', label: 'Rate', sortable: true, align: 'right' },
        { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
        {
            key: 'status_label',
            label: 'Status',
            sortable: true,
            render: (row) => (
                <span className={`ui-badge ${statusBadgeClass(row.status)}`}>
                    {row.status_label}
                </span>
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
            <PageLayout title="Overtime">
                <p>You do not have permission to view overtime.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Overtime"
            actions={
                <>
                    {canAdd && (
                        <button type="button" className="ui-btn primary" onClick={openAdd}>
                            + Add Overtime
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
                    placeholder="Search by employee, date, status or amounts…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                loading={loading}
                columns={columns}
                rows={rows}
                emptyText="No overtime records found"
                emptyIcon="⏱"
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
                    title="Add Overtime"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSubmit}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    {renderForm(false)}
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Overtime"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    {renderForm(true)}
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Overtime"
                    message="Are you sure you want to delete this overtime record?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                    danger
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Selected"
                    message={`Delete ${selected.size} overtime record(s)?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                    danger
                />
            )}
        </PageLayout>
    );
};

export default OvertimeManager;
