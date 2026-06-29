import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    NumberInput,
    SelectInput,
    TextareaInput,
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

const METHOD_OPTIONS = [
    { value: '0', label: 'Cash' },
    { value: '1', label: 'Cheque' },
    { value: '2', label: 'Credit Card' },
];

const INITIAL_EDIT = {
    payroll_id: null,
    employee_id: '',
    account_id: '',
    month: '',
    salary_amount: '',
    previous_transactions: '',
    commission: '',
    amount: '',
    created_at: '',
    paying_method: '0',
    note: '',
};

function hasPayrollPermission(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('payroll') || list.includes('payrolls');
}

function calcTotal(salary, commission, expense) {
    return (Number(salary) || 0) + (Number(commission) || 0) - (Number(expense) || 0);
}

const PayrollManager = ({ controllerName }) => {
    const navigate = useNavigate();
    const ctrl = controllerName || 'payrolls';
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const legacyAccess = hasPayrollPermission(authPerms);
    const canView = perms.canView || legacyAccess;
    const canAdd = perms.canAdd || legacyAccess;
    const canEdit = perms.canEdit || legacyAccess;
    const canDelete = perms.canDelete || legacyAccess;

    const [allRows, setAllRows] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [userVerified, setUserVerified] = useState(true);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('date_display');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);

    const [generateOpen, setGenerateOpen] = useState(false);
    const [generateForm, setGenerateForm] = useState({
        warehouse_id: '0',
        month: new Date().toISOString().slice(0, 7),
        employee_ids: [],
    });
    const [warehouseEmployees, setWarehouseEmployees] = useState([]);

    const [editOpen, setEditOpen] = useState(false);
    const [viewRow, setViewRow] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [editForm, setEditForm] = useState(INITIAL_EDIT);
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();
    const patchEdit = (patch) => setEditForm((f) => ({ ...f, ...patch }));

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (generateOpen) {
            loadWarehouseEmployees(generateForm.warehouse_id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [generateOpen, generateForm.warehouse_id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('payroll');
            applyListResponse(res);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load payroll.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyListResponse = (res) => {
        if (res.data?.payrolls) setAllRows(res.data.payrolls);
        if (res.data?.employees) setEmployees(res.data.employees);
        if (res.data?.accounts) setAccounts(res.data.accounts);
        if (res.data?.warehouses) setWarehouses(res.data.warehouses);
        if (res.data?.user_verified !== undefined) setUserVerified(res.data.user_verified !== false);
    };

    const loadWarehouseEmployees = async (warehouseId) => {
        try {
            const res = await api.get('payroll/get-employees-by-warehouse', {
                params: { warehouse_id: warehouseId || 0 },
            });
            setWarehouseEmployees(Array.isArray(res.data) ? res.data : []);
        } catch {
            setWarehouseEmployees([]);
        }
    };

    const employeeOptions = useMemo(
        () => employees.map((e) => ({ value: String(e.id), label: e.name })),
        [employees]
    );

    const accountOptions = useMemo(
        () => accounts.map((a) => ({
            value: String(a.id),
            label: `${a.name}${a.account_no ? ` [${a.account_no}]` : ''}`,
        })),
        [accounts]
    );

    const warehouseOptions = useMemo(
        () => [{ value: '0', label: 'All Warehouse' }, ...warehouses.map((w) => ({ value: String(w.id), label: w.name }))],
        [warehouses]
    );

    const filteredRows = useMemo(() => {
        let rows = allRows;
        if (filterEmployee) rows = rows.filter((r) => String(r.employee_id) === filterEmployee);
        if (filterMonth) rows = rows.filter((r) => r.month === filterMonth);
        if (filterDate) rows = rows.filter((r) => r.date === filterDate);
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.employee_name || '').toLowerCase().includes(q) ||
                (r.reference_no || '').toLowerCase().includes(q) ||
                (r.account_name || '').toLowerCase().includes(q) ||
                (r.month_display || '').toLowerCase().includes(q)
            );
        }
        return [...rows].sort((a, b) => {
            const av = a[sortCol];
            const bv = b[sortCol];
            if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
            const as = String(av ?? '').toLowerCase();
            const bs = String(bv ?? '').toLowerCase();
            if (as < bs) return sortDir === 'asc' ? -1 : 1;
            if (as > bs) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allRows, search, sortCol, sortDir, filterEmployee, filterMonth, filterDate]);

    const rows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    const totalRows = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize) || 1);
    const amountTotal = useMemo(
        () => filteredRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
        [filteredRows]
    );

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
            ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    const handleEmployeeSelect = (e) => {
        const values = Array.from(e.target.selectedOptions, (opt) => Number(opt.value));
        setGenerateForm((f) => ({ ...f, employee_ids: values }));
    };

    const handleGenerate = async () => {
        if (!generateForm.month) {
            showToast('Please select a month.', 'error');
            return;
        }
        try {
            setSaving(true);
            const res = await api.post('payroll/generate', {
                warehouse_id: generateForm.warehouse_id,
                month: generateForm.month,
                employee_ids: generateForm.employee_ids,
            });
            setGenerateOpen(false);
            navigate('/payroll/generate', { state: res.data });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to generate payroll.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row) => {
        setEditForm({
            payroll_id: row.id,
            employee_id: String(row.employee_id),
            account_id: String(row.account_id || ''),
            month: row.month || '',
            salary_amount: String(row.salary ?? ''),
            previous_transactions: String(row.expense ?? ''),
            commission: String(row.commission ?? ''),
            amount: String(row.total ?? row.amount ?? ''),
            created_at: row.date || '',
            paying_method: String(row.paying_method ?? '0'),
            note: row.note || '',
        });
        setEditOpen(true);
        setOpenMenu(null);
    };

    const handleEditTotal = (patch) => {
        setEditForm((f) => {
            const next = { ...f, ...patch };
            next.amount = String(calcTotal(next.salary_amount, next.commission, next.previous_transactions).toFixed(2));
            return next;
        });
    };

    const handleUpdate = async () => {
        if (!editForm.payroll_id) return;
        try {
            setSaving(true);
            const res = await api.put(`payroll/${editForm.payroll_id}`, {
                payroll_id: editForm.payroll_id,
                employee_id: Number(editForm.employee_id),
                account_id: Number(editForm.account_id),
                month: editForm.month,
                salary_amount: Number(editForm.salary_amount),
                previous_transactions: Number(editForm.previous_transactions),
                expense: Number(editForm.previous_transactions),
                commission: Number(editForm.commission),
                amount: Number(editForm.amount),
                created_at: editForm.created_at,
                paying_method: editForm.paying_method,
                note: editForm.note,
            });
            showToast(res.data?.message || 'Payroll updated.', 'success');
            applyListResponse(res);
            setEditOpen(false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update payroll.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`payroll/${deleteId}`);
            showToast(res.data?.message || 'Payroll deleted.', 'success');
            applyListResponse(res);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(deleteId);
                return next;
            });
            setDeleteId(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete payroll.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (!userVerified) {
            showToast('This feature is disabled for demo.', 'error');
            return;
        }
        try {
            const res = await api.post('payroll/deletebyselection', { payrollIdArray: [...selected] });
            showToast(res.data?.message || 'Selected payroll records deleted.', 'success');
            applyListResponse(res);
            setSelected(new Set());
            setBulkDeleteOpen(false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const columns = [
        { key: 'date_display', label: 'Date', sortable: true },
        { key: 'reference_no', label: 'Reference', sortable: true },
        { key: 'employee_name', label: 'Employee', sortable: true },
        { key: 'account_name', label: 'Account', sortable: true },
        { key: 'amount_display', label: 'Amount', sortable: true, align: 'right' },
        { key: 'paying_method_label', label: 'Method', sortable: true },
        { key: 'month_display', label: 'Month', sortable: true },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        { label: '👁 View', onClick: () => setViewRow(row) },
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
            <PageLayout title="Payroll">
                <p>You do not have permission to view payroll.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Payroll"
            actions={
                <>
                    {canAdd && (
                        <button type="button" className="ui-btn primary" onClick={() => setGenerateOpen(true)}>
                            Generate Payroll
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
                        <FormField label="Employee">
                            <SelectInput
                                value={filterEmployee}
                                onChange={(e) => { setFilterEmployee(e.target.value); setPage(1); }}
                                options={employeeOptions}
                                placeholder="All employees"
                            />
                        </FormField>
                        <FormField label="Month">
                            <input
                                type="month"
                                className="ui-input"
                                value={filterMonth}
                                onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
                            />
                        </FormField>
                        <FormField label="Date">
                            <input
                                type="date"
                                className="ui-input"
                                value={filterDate}
                                onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                            />
                        </FormField>
                    </FormRow>
                </div>
            )}

            <div className="ui-toolbar" style={{ justifyContent: 'space-between' }}>
                <input
                    className="ui-search"
                    placeholder="Search by employee, reference, account or month…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--ui-muted)' }}>
                    Total amount: <strong>{amountTotal.toFixed(2)}</strong>
                </span>
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                loading={loading}
                columns={columns}
                rows={rows}
                emptyText="No payroll records found"
                emptyIcon="💰"
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

            {generateOpen && (
                <Modal
                    title="Generate Payroll"
                    onClose={() => setGenerateOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleGenerate}>
                            {saving ? 'Loading…' : 'Continue'}
                        </button>
                    }
                    size="lg"
                >
                    <FormRow cols={2}>
                        <FormField label="Warehouse" required>
                            <SelectInput
                                value={generateForm.warehouse_id}
                                onChange={(e) => setGenerateForm((f) => ({ ...f, warehouse_id: e.target.value, employee_ids: [] }))}
                                options={warehouseOptions}
                            />
                        </FormField>
                        <FormField label="Month" required>
                            <input
                                type="month"
                                className="ui-input"
                                value={generateForm.month}
                                onChange={(e) => setGenerateForm((f) => ({ ...f, month: e.target.value }))}
                                required
                            />
                        </FormField>
                        <FormField label="Employees" required span2>
                            <select
                                multiple
                                className="ui-input"
                                value={generateForm.employee_ids.map(String)}
                                onChange={handleEmployeeSelect}
                                size={Math.min(8, Math.max(4, warehouseEmployees.length))}
                                style={{ minHeight: 120 }}
                            >
                                {warehouseEmployees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--ui-muted)', marginTop: 6 }}>
                                Leave empty to include all active employees. Hold Ctrl/Cmd to select multiple.
                            </p>
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Payroll"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                    size="lg"
                >
                    <FormRow cols={2}>
                        <FormField label="Employee" required>
                            <SelectInput value={editForm.employee_id} onChange={(e) => patchEdit({ employee_id: e.target.value })} options={employeeOptions} />
                        </FormField>
                        <FormField label="Month" required>
                            <input type="month" className="ui-input" value={editForm.month} onChange={(e) => patchEdit({ month: e.target.value })} />
                        </FormField>
                        <FormField label="Salary Amount">
                            <NumberInput step="0.01" value={editForm.salary_amount} onChange={(e) => handleEditTotal({ salary_amount: e.target.value })} />
                        </FormField>
                        <FormField label="Expense">
                            <NumberInput step="0.01" value={editForm.previous_transactions} onChange={(e) => handleEditTotal({ previous_transactions: e.target.value })} />
                        </FormField>
                        <FormField label="Sale Commission">
                            <NumberInput step="0.01" value={editForm.commission} onChange={(e) => handleEditTotal({ commission: e.target.value })} />
                        </FormField>
                        <FormField label="Total">
                            <input className="ui-input" readOnly value={editForm.amount} />
                        </FormField>
                        <FormField label="Date">
                            <input type="date" className="ui-input" value={editForm.created_at} onChange={(e) => patchEdit({ created_at: e.target.value })} />
                        </FormField>
                        <FormField label="Account" required>
                            <SelectInput value={editForm.account_id} onChange={(e) => patchEdit({ account_id: e.target.value })} options={accountOptions} />
                        </FormField>
                        <FormField label="Method" required>
                            <SelectInput value={editForm.paying_method} onChange={(e) => patchEdit({ paying_method: e.target.value })} options={METHOD_OPTIONS} />
                        </FormField>
                        <FormField label="Note" span2>
                            <TextareaInput value={editForm.note} onChange={(e) => patchEdit({ note: e.target.value })} rows={3} />
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {viewRow && (
                <Modal title="Payroll Details" onClose={() => setViewRow(null)} footer={null} size="lg">
                    <h4 style={{ marginTop: 0 }}>{viewRow.employee_name}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                        <div className="ui-card" style={{ padding: 12, textAlign: 'center' }}>
                            <div style={{ color: 'var(--ui-muted)', fontSize: '0.75rem' }}>Leaves</div>
                            <strong>{viewRow.leaves} days</strong>
                        </div>
                        <div className="ui-card" style={{ padding: 12, textAlign: 'center' }}>
                            <div style={{ color: 'var(--ui-muted)', fontSize: '0.75rem' }}>Work Duration</div>
                            <strong>{viewRow.work_duration} hour</strong>
                        </div>
                        <div className="ui-card" style={{ padding: 12, textAlign: 'center' }}>
                            <div style={{ color: 'var(--ui-muted)', fontSize: '0.75rem' }}>Attendance</div>
                            <strong>{viewRow.attendance} days</strong>
                        </div>
                    </div>
                    <FormRow cols={2}>
                        <FormField label="Month"><p>{viewRow.month_display || '—'}</p></FormField>
                        <FormField label="Salary"><p>{viewRow.salary}</p></FormField>
                        <FormField label="Commission"><p>{viewRow.commission}</p></FormField>
                        <FormField label="Expense"><p>{viewRow.expense}</p></FormField>
                        <FormField label="Total Payable"><p>{viewRow.total ?? viewRow.amount}</p></FormField>
                        <FormField label="Payment Method"><p>{viewRow.paying_method_label}</p></FormField>
                        <FormField label="Note" span2><p>{viewRow.note || '—'}</p></FormField>
                    </FormRow>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Payroll"
                    message="Are you sure you want to delete this payroll record?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                    danger
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Selected"
                    message={`Delete ${selected.size} payroll record(s)?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                    danger
                />
            )}
        </PageLayout>
    );
};

export default PayrollManager;
