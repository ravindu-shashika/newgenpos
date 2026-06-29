import React, { useState, useEffect, useMemo, useRef } from 'react';

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
    FileInput,
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

const DATE_FORMAT_OPTIONS = [
    { value: 'd/m/Y', label: 'dd/mm/yyyy (23/05/2022)' },
    { value: 'm/d/Y', label: 'mm/dd/yyyy (05/23/2022)' },
    { value: 'Y/m/d', label: 'yyyy/mm/dd (2022/05/23)' },
];

const INITIAL_FORM = {
    employee_ids: [],
    date: '',
    checkin: '',
    checkout: '',
    note: '',
};

function rowKey(row) {
    return `${row.date}|${row.employee_id}`;
}

function hasAttendancePermission(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('attendance');
}

const AttendanceManager = ({ controllerName }) => {
    const ctrl = controllerName || 'attendance';
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const legacyAccess = hasAttendancePermission(authPerms);
    const canView = perms.canView || legacyAccess;
    const canAdd = perms.canAdd || legacyAccess;
    const canDelete = perms.canDelete || legacyAccess;

    const [allRows, setAllRows] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [defaults, setDefaults] = useState({ checkin: '', checkout: '' });
    const [userVerified, setUserVerified] = useState(true);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('date');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    const [filterOpen, setFilterOpen] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterWarehouse, setFilterWarehouse] = useState('');

    const [addOpen, setAddOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [importFormat, setImportFormat] = useState('');
    const [saving, setSaving] = useState(false);
    const importFileRef = useRef(null);

    const { toast, showToast } = useToast();
    const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('attendance');
            setAllRows(res.data?.attendances || []);
            setEmployees(res.data?.employees || []);
            setWarehouses(res.data?.warehouses || []);
            setDefaults(res.data?.defaults || { checkin: '', checkout: '' });
            setUserVerified(res.data?.user_verified !== false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load attendance.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const employeeOptions = useMemo(
        () => employees.map((e) => ({ value: String(e.id), label: e.name })),
        [employees]
    );

    const warehouseOptions = useMemo(
        () => warehouses.map((w) => ({ value: String(w.id), label: w.name })),
        [warehouses]
    );

    const filteredRows = useMemo(() => {
        let rows = allRows.map((r) => ({ ...r, id: rowKey(r) }));

        if (filterDate) {
            rows = rows.filter((r) => r.date === filterDate);
        }
        if (filterEmployee) {
            rows = rows.filter((r) => String(r.employee_id) === filterEmployee);
        }
        if (filterStatus === 'Present') {
            rows = rows.filter((r) => r.status === 1);
        } else if (filterStatus === 'Late') {
            rows = rows.filter((r) => r.status === 0);
        }
        if (filterWarehouse) {
            rows = rows.filter((r) => String(r.warehouse_id ?? '') === filterWarehouse);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.employee_name || '').toLowerCase().includes(q) ||
                (r.user_name || '').toLowerCase().includes(q) ||
                (r.date_display || r.date || '').toLowerCase().includes(q) ||
                (r.checkin_checkout_display || '').toLowerCase().includes(q)
            );
        }

        return [...rows].sort((a, b) => {
            const av = String(a[sortCol] ?? '').toLowerCase();
            const bv = String(b[sortCol] ?? '').toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allRows, search, sortCol, sortDir, filterDate, filterEmployee, filterStatus, filterWarehouse]);

    const rows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    const totalRows = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize) || 1);

    const toggleRow = (key) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleAll = () => {
        const keys = rows.map(rowKey);
        const allSelected = keys.every((k) => selected.has(k));
        setSelected((prev) => {
            const next = new Set(prev);
            keys.forEach((k) => {
                if (allSelected) next.delete(k);
                else next.add(k);
            });
            return next;
        });
    };

    const openAdd = () => {
        const today = new Date().toISOString().slice(0, 10);
        setForm({
            employee_ids: [],
            date: today,
            checkin: defaults.checkin || '',
            checkout: defaults.checkout || '',
            note: '',
        });
        setAddOpen(true);
    };

    const handleEmployeeSelect = (e) => {
        const values = Array.from(e.target.selectedOptions, (opt) => Number(opt.value));
        patchForm({ employee_ids: values });
    };

    const handleSubmit = async () => {
        if (!form.employee_ids.length) {
            showToast('Please select at least one employee.', 'error');
            return;
        }
        if (!form.date || !form.checkin || !form.checkout) {
            showToast('Date, check-in and check-out are required.', 'error');
            return;
        }

        try {
            setSaving(true);
            const res = await api.post('attendance', {
                employee_id: form.employee_ids.map(Number),
                date: form.date,
                checkin: form.checkin,
                checkout: form.checkout,
                note: form.note || '',
            });
            showToast(res.data?.message || 'Attendance created.', 'success');
            setAllRows(res.data?.attendances || []);
            setAddOpen(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to save attendance.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleImport = async () => {
        const file = importFileRef.current?.files?.[0];
        if (!importFormat || !file) {
            showToast('Select date format and CSV file.', 'error');
            return;
        }

        const fd = new FormData();
        fd.append('Attendance_Device_date_format', importFormat);
        fd.append('file', file);

        try {
            setSaving(true);
            const res = await api.post('attendance/importDeviceCsv', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showToast(res.data?.message || 'Attendance imported.', 'success');
            setAllRows(res.data?.attendances || []);
            setImportOpen(false);
            setImportFormat('');
            if (importFileRef.current) importFileRef.current.value = '';
        } catch (err) {
            showToast(err.response?.data?.message || 'Import failed.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await api.delete(
                `attendance/${encodeURIComponent(deleteTarget.date)}/${deleteTarget.employee_id}`
            );
            showToast(res.data?.message || 'Attendance deleted.', 'success');
            setAllRows(res.data?.attendances || []);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(rowKey(deleteTarget));
                return next;
            });
            setDeleteTarget(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete attendance.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (!userVerified) {
            showToast('This feature is disabled for demo.', 'error');
            return;
        }

        const attendanceSelectedArray = [...selected].map((key) => {
            const [date, employeeId] = key.split('|');
            return [date, Number(employeeId)];
        });

        try {
            const res = await api.post('attendance/deletebyselection', { attendanceSelectedArray });
            showToast(res.data?.message || 'Selected attendance deleted.', 'success');
            setAllRows(res.data?.attendances || []);
            setSelected(new Set());
            setBulkDeleteOpen(false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const columns = [
        {
            key: 'date_display',
            label: 'Date',
            sortable: true,
            render: (row) => row.date_display || row.date,
        },
        { key: 'employee_name', label: 'Employee', sortable: true },
        {
            key: 'checkin_checkout_display',
            label: 'Check In – Check Out',
            render: (row) => (
                <span style={{ whiteSpace: 'pre-line' }}>
                    {row.checkin_checkout_display || '—'}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => (
                <span className={`ui-badge ${row.status === 1 ? 'success' : 'danger'}`}>
                    {row.status_label || (row.status === 1 ? 'Present' : 'Late')}
                </span>
            ),
        },
        { key: 'user_name', label: 'Created By', sortable: true },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div className="ui-action-wrap">
                    <button
                        type="button"
                        className="ui-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === rowKey(row) ? null : rowKey(row));
                        }}
                    >
                        ⋮
                    </button>
                    {openMenu === rowKey(row) && canDelete && (
                        <ActionMenu
                            items={[
                                {
                                    label: 'Delete',
                                    danger: true,
                                    onClick: () => {
                                        setDeleteTarget({ date: row.date, employee_id: row.employee_id });
                                        setOpenMenu(null);
                                    },
                                },
                            ]}
                        />
                    )}
                </div>
            ),
        },
    ];

    if (!canView) {
        return (
            <PageLayout title="Attendance">
                <p>You do not have permission to view attendance.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Attendance"
            actions={
                <>
                    {canAdd && (
                        <button type="button" className="ui-btn primary" onClick={openAdd}>
                            + Add Attendance
                        </button>
                    )}
                    {canAdd && (
                        <button type="button" className="ui-btn ghost" onClick={() => setImportOpen(true)}>
                            ↑ Import CSV
                        </button>
                    )}
                    <button type="button" className="ui-btn ghost" onClick={() => setFilterOpen((v) => !v)}>
                        Filter
                    </button>
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

            {filterOpen && (
                <div className="ui-card" style={{ marginBottom: 16, padding: 16 }}>
                    <FormRow cols={2}>
                        <FormField label="Date">
                            <input
                                type="date"
                                className="ui-input"
                                value={filterDate}
                                onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                            />
                        </FormField>
                        <FormField label="Employee">
                            <SelectInput
                                value={filterEmployee}
                                onChange={(e) => { setFilterEmployee(e.target.value); setPage(1); }}
                                options={employeeOptions}
                                placeholder="All employees"
                            />
                        </FormField>
                        <FormField label="Status">
                            <SelectInput
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                                options={[
                                    { value: 'Present', label: 'Present' },
                                    { value: 'Late', label: 'Late' },
                                ]}
                                placeholder="All statuses"
                            />
                        </FormField>
                        <FormField label="Warehouse">
                            <SelectInput
                                value={filterWarehouse}
                                onChange={(e) => { setFilterWarehouse(e.target.value); setPage(1); }}
                                options={warehouseOptions}
                                placeholder="All warehouses"
                            />
                        </FormField>
                    </FormRow>
                    <button
                        type="button"
                        className="ui-btn ghost"
                        onClick={() => {
                            setFilterDate('');
                            setFilterEmployee('');
                            setFilterStatus('');
                            setFilterWarehouse('');
                            setPage(1);
                        }}
                    >
                        Clear filters
                    </button>
                </div>
            )}

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by employee, date, or created by…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                loading={loading}
                columns={columns}
                rows={rows}
                emptyText="No attendance records found"
                emptyIcon="📋"
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
                    title="Add Attendance"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSubmit}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                    size="lg"
                >
                    <FormField label="Employee" required>
                        {employeeOptions.length > 0 ? (
                            <>
                                <select
                                    multiple
                                    className="ui-input"
                                    value={form.employee_ids.map(String)}
                                    onChange={handleEmployeeSelect}
                                    size={Math.min(8, Math.max(4, employeeOptions.length))}
                                    style={{ minHeight: 120 }}
                                >
                                    {employeeOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '0.75rem', color: 'var(--ui-muted)', marginTop: 6 }}>
                                    Hold Ctrl (Windows) or Cmd (Mac) to select multiple employees.
                                </p>
                            </>
                        ) : (
                            <p style={{ color: 'var(--ui-muted)', fontSize: '0.85rem' }}>
                                No active employees found. Add employees first under HRM → Employee.
                            </p>
                        )}
                    </FormField>

                    <FormRow cols={2}>
                        <FormField label="Date" required>
                            <input
                                type="date"
                                className="ui-input"
                                value={form.date}
                                onChange={(e) => patchForm({ date: e.target.value })}
                                required
                            />
                        </FormField>
                        <FormField label="Check In" required>
                            <TextInput
                                value={form.checkin}
                                onChange={(e) => patchForm({ checkin: e.target.value })}
                                placeholder="HH:MM AM/PM"
                            />
                        </FormField>
                        <FormField label="Check Out" required>
                            <TextInput
                                value={form.checkout}
                                onChange={(e) => patchForm({ checkout: e.target.value })}
                                placeholder="HH:MM AM/PM"
                            />
                        </FormField>
                        <FormField label="Note" span2>
                            <TextareaInput
                                value={form.note}
                                onChange={(e) => patchForm({ note: e.target.value })}
                                rows={3}
                            />
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {importOpen && (
                <Modal
                    title="Import Attendance CSV"
                    onClose={() => setImportOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleImport}>
                            {saving ? 'Importing…' : 'Save'}
                        </button>
                    }
                >
                    <FormRow cols={1}>
                        <FormField label="Attendance Device Date Format" required>
                            <SelectInput
                                value={importFormat}
                                onChange={(e) => setImportFormat(e.target.value)}
                                options={DATE_FORMAT_OPTIONS}
                                placeholder="Select format"
                            />
                        </FormField>
                        <FormField label="Upload File" required>
                            <FileInput accept=".csv" inputRef={importFileRef} />
                        </FormField>
                    </FormRow>
                    <p className="ui-hint">
                        CSV date format must match the selected format. Do not change the first line or column order. Max file size 2MB.
                    </p>
                </Modal>
            )}

            {deleteTarget && (
                <ConfirmModal
                    title="Delete Attendance"
                    message="Delete all check-in/out records for this employee on this date?"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Selected"
                    message={`Delete ${selected.size} attendance record(s)?`}
                    onConfirm={handleBulkDelete}
                    onCancel={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
};

export default AttendanceManager;
