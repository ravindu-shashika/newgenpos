import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

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
    FileInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../../components/ui';
import { api } from '../../../../services';
import authStore from '../../../../stores/authStore';
import usePermissions from '../../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_META = {
    departments: [],
    designations: [],
    shifts: [],
    roles: [],
    warehouses: [],
    billers: [],
};

const EMPTY_FORM = {
    name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    country: '',
    staff_id: '',
    basic_salary: '',
    department_id: '',
    shift_id: '',
    designation_id: '',
    role_id: '',
    warehouse_id: '',
    biller_id: '',
    employee_id: null,
    image: null,
};

function hasEmployeePermission(permissions, key) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(`employees-${key}`);
}

function toOptions(items, labelFn = (item) => item.name) {
    return (items || []).map((item) => ({
        value: String(item.id),
        label: labelFn(item),
    }));
}

const EmployeeManager = ({ controllerName }) => {
    const ctrl = controllerName || 'employees';
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasEmployeePermission(authPerms, 'index');
    const canAdd = perms.canAdd || hasEmployeePermission(authPerms, 'add');
    const canEdit = perms.canEdit || hasEmployeePermission(authPerms, 'edit');
    const canDelete = perms.canDelete || hasEmployeePermission(authPerms, 'delete');

    const [rows, setRows] = useState([]);
    const [metadata, setMetadata] = useState(EMPTY_META);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();

    const setField = (name) => (e) => {
        const { type, value, files } = e.target;
        setForm((f) => ({
            ...f,
            [name]: type === 'file' ? (files?.[0] || null) : value,
        }));
    };

    useEffect(() => {
        fetchEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await api.get('employees');
            const data = res.data?.data ?? res.data ?? [];
            setRows(Array.isArray(data) ? data : []);
            if (res.data?.metadata) setMetadata(res.data.metadata);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load employees.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredAndSorted = useMemo(() => {
        let list = [...rows];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (r) =>
                    (r.name || '').toLowerCase().includes(q) ||
                    (r.email || '').toLowerCase().includes(q) ||
                    (r.phone_number || '').toLowerCase().includes(q) ||
                    (r.department_name || '').toLowerCase().includes(q)
            );
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

    const validate = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Name is required.';
        if (!form.email?.trim()) errors.email = 'Email is required.';
        if (!form.phone_number?.trim()) errors.phone_number = 'Phone number is required.';
        if (!form.basic_salary && form.basic_salary !== 0) errors.basic_salary = 'Basic salary is required.';
        if (!form.department_id) errors.department_id = 'Department is required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const openEdit = (row) => {
        setForm({
            ...EMPTY_FORM,
            employee_id: row.id,
            name: row.name || '',
            email: row.email || '',
            phone_number: row.phone_number || '',
            address: row.address || '',
            city: row.city || '',
            country: row.country || '',
            staff_id: row.staff_id || '',
            basic_salary: row.basic_salary ?? '',
            department_id: row.department_id ? String(row.department_id) : '',
            shift_id: row.shift_id ? String(row.shift_id) : '',
            designation_id: row.designation_id ? String(row.designation_id) : '',
            role_id: row.role_id ? String(row.role_id) : '',
            warehouse_id: row.warehouse_id ? String(row.warehouse_id) : '',
            biller_id: row.biller_id ? String(row.biller_id) : '',
        });
        setFormErrors({});
        setEditOpen(true);
    };

    const buildFormData = () => {
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('email', form.email.trim());
        fd.append('phone_number', form.phone_number.trim());
        fd.append('address', form.address?.trim() || '');
        fd.append('city', form.city?.trim() || '');
        fd.append('country', form.country?.trim() || '');
        fd.append('staff_id', form.staff_id?.trim() || '');
        fd.append('basic_salary', form.basic_salary);
        fd.append('employee_id', form.employee_id);
        if (form.department_id) fd.append('department_id', form.department_id);
        if (form.shift_id) fd.append('shift_id', form.shift_id);
        if (form.designation_id) fd.append('designation_id', form.designation_id);
        if (form.role_id) fd.append('role_id', form.role_id);
        if (form.warehouse_id) fd.append('warehouse_id', form.warehouse_id);
        if (form.biller_id) fd.append('biller_id', form.biller_id);
        if (form.image) fd.append('image', form.image);
        return fd;
    };

    const handleUpdate = async () => {
        if (!validate() || !form.employee_id) return;
        try {
            setSaving(true);
            const res = await api.put(`employees/${form.employee_id}`, buildFormData());
            showToast(res.data?.message || 'Employee updated.', 'success');
            setEditOpen(false);
            fetchEmployees();
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || err.message || 'Failed to update employee.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`employees/${deleteId}`);
            showToast(res.data?.message || 'Employee deleted.', 'success');
            setDeleteId(null);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(deleteId);
                return next;
            });
            fetchEmployees();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete employee.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.post('employees/deletebyselection', {
                employeeIdArray: [...selected],
            });
            showToast(res.data?.message || `${selected.size} employee(s) deleted.`, 'success');
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchEmployees();
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const billerOptions = toOptions(metadata.billers, (b) =>
        b.company_name ? `${b.name} (${b.company_name})` : b.name
    );

    const columns = [
        {
            label: 'Image',
            key: 'image',
            render: (row) =>
                row.image_url ? (
                    <img src={row.image_url} alt={row.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                ) : (
                    '—'
                ),
        },
        { label: 'Name', key: 'name', sortable: true },
        { label: 'Email', key: 'email', sortable: true },
        { label: 'Phone', key: 'phone_number', sortable: true },
        { label: 'Department', key: 'department_name', sortable: true },
        {
            label: 'Address',
            key: 'address',
            render: (row) => {
                const parts = [row.address, row.city, row.country].filter(Boolean);
                return parts.length ? parts.join(', ') : '—';
            },
        },
        { label: 'Staff ID', key: 'staff_id', sortable: true },
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
            <PageLayout title="Employee">
                <p>You do not have permission to view employees.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Employee"
            onClick={(e) => {
                if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null);
            }}
            actions={
                <>
                    {canAdd && (
                        <Link to="/employees/create" className="ui-btn primary">
                            Add Employee
                        </Link>
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

            <div className="ui-toolbar" style={{ marginBottom: 12 }}>
                <input
                    className="ui-search"
                    placeholder="Search employees…"
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

            {editOpen && (
                <Modal
                    title="Update Employee"
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
                    <FormRow cols={2}>
                        <FormField label="Name" required error={formErrors.name}>
                            <TextInput value={form.name} onChange={setField('name')} />
                        </FormField>
                        <FormField label="Email" required error={formErrors.email}>
                            <TextInput type="email" value={form.email} onChange={setField('email')} />
                        </FormField>
                    </FormRow>
                    <FormRow cols={2}>
                        <FormField label="Phone number" required error={formErrors.phone_number}>
                            <TextInput value={form.phone_number} onChange={setField('phone_number')} />
                        </FormField>
                        <FormField label="Basic salary" required error={formErrors.basic_salary}>
                            <NumberInput value={form.basic_salary} onChange={setField('basic_salary')} step="any" />
                        </FormField>
                    </FormRow>
                    <FormRow cols={3}>
                        <FormField label="Address" error={formErrors.address}>
                            <TextInput value={form.address} onChange={setField('address')} />
                        </FormField>
                        <FormField label="City" error={formErrors.city}>
                            <TextInput value={form.city} onChange={setField('city')} />
                        </FormField>
                        <FormField label="Country" error={formErrors.country}>
                            <TextInput value={form.country} onChange={setField('country')} />
                        </FormField>
                    </FormRow>
                    <FormRow cols={2}>
                        <FormField label="Staff ID" error={formErrors.staff_id}>
                            <TextInput value={form.staff_id} onChange={setField('staff_id')} />
                        </FormField>
                        <FormField label="Image" error={formErrors.image}>
                            <FileInput onChange={setField('image')} accept="image/*" />
                        </FormField>
                    </FormRow>
                    <FormRow cols={3}>
                        <FormField label="Department" required error={formErrors.department_id}>
                            <SelectInput value={form.department_id} onChange={setField('department_id')} options={toOptions(metadata.departments)} placeholder="Select department" />
                        </FormField>
                        <FormField label="Shift" error={formErrors.shift_id}>
                            <SelectInput value={form.shift_id} onChange={setField('shift_id')} options={toOptions(metadata.shifts)} placeholder="Select shift" />
                        </FormField>
                        <FormField label="Designation" error={formErrors.designation_id}>
                            <SelectInput value={form.designation_id} onChange={setField('designation_id')} options={toOptions(metadata.designations)} placeholder="Select designation" />
                        </FormField>
                    </FormRow>
                    <FormRow cols={2}>
                        <FormField label="Warehouse" error={formErrors.warehouse_id}>
                            <SelectInput value={form.warehouse_id} onChange={setField('warehouse_id')} options={toOptions(metadata.warehouses)} placeholder="Select warehouse" />
                        </FormField>
                        <FormField label="Biller" error={formErrors.biller_id}>
                            <SelectInput value={form.biller_id} onChange={setField('biller_id')} options={billerOptions} placeholder="Select biller" />
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete employee?"
                    message="Are you sure you want to delete this employee?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete selected employees?"
                    message={`Are you sure you want to delete ${selected.size} employee(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
};

export default EmployeeManager;
