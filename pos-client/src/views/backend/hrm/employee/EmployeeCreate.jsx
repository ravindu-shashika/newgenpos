import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
    PageLayout,
    FormField,
    FormRow,
    TextInput,
    NumberInput,
    SelectInput,
    FileInput,
    CheckboxInput,
    Toast,
    useToast,
} from '../../../../components/ui';
import { api } from '../../../../services';
import authStore from '../../../../stores/authStore';
import usePermissions from '../../../../stores/usePermissions';

const EMPTY_META = {
    departments: [],
    designations: [],
    shifts: [],
    roles: [],
    warehouses: [],
    billers: [],
};

const EMPTY_FORM = {
    employee_name: '',
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
    image: null,
    add_user: false,
    username: '',
    password: '',
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

const EmployeeCreate = ({ controllerName }) => {
    const navigate = useNavigate();
    const ctrl = controllerName || 'employees';
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const canAdd = perms.canAdd || hasEmployeePermission(authPerms, 'add');

    const [metadata, setMetadata] = useState(EMPTY_META);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});

    const { toast, showToast } = useToast();

    const setField = (name) => (e) => {
        const { type, value, checked, files } = e.target;
        setForm((f) => ({
            ...f,
            [name]: type === 'checkbox' ? checked : type === 'file' ? (files?.[0] || null) : value,
        }));
    };

    useEffect(() => {
        fetchCreateData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCreateData = async () => {
        try {
            setLoading(true);
            const res = await api.get('employees/create');
            if (res.data?.metadata) setMetadata(res.data.metadata);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load form data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const errors = {};
        if (!form.employee_name?.trim()) errors.employee_name = 'Name is required.';
        if (!form.email?.trim()) errors.email = 'Email is required.';
        if (!form.phone_number?.trim()) errors.phone_number = 'Phone number is required.';
        if (!form.basic_salary && form.basic_salary !== 0) errors.basic_salary = 'Basic salary is required.';
        if (!form.role_id) errors.role_id = 'Role is required.';
        if (!form.warehouse_id) errors.warehouse_id = 'Warehouse is required.';
        if (!form.biller_id) errors.biller_id = 'Biller is required.';
        if (!form.department_id) errors.department_id = 'Department is required.';
        if (!form.shift_id) errors.shift_id = 'Shift is required.';
        if (!form.designation_id) errors.designation_id = 'Designation is required.';
        if (form.add_user) {
            if (!form.username?.trim()) errors.username = 'Username is required.';
            if (!form.password?.trim()) errors.password = 'Password is required.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const buildFormData = () => {
        const fd = new FormData();
        fd.append('employee_name', form.employee_name.trim());
        fd.append('email', form.email.trim());
        fd.append('phone_number', form.phone_number.trim());
        fd.append('address', form.address?.trim() || '');
        fd.append('city', form.city?.trim() || '');
        fd.append('country', form.country?.trim() || '');
        fd.append('staff_id', form.staff_id?.trim() || '');
        fd.append('basic_salary', form.basic_salary);
        fd.append('department_id', form.department_id);
        fd.append('shift_id', form.shift_id);
        fd.append('designation_id', form.designation_id);
        fd.append('role_id', form.role_id);
        fd.append('warehouse_id', form.warehouse_id);
        fd.append('biller_id', form.biller_id);
        if (form.image) fd.append('image', form.image);
        if (form.add_user) {
            fd.append('user', '1');
            fd.append('name', form.username.trim());
            fd.append('password', form.password);
        }
        return fd;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canAdd || !validate()) return;
        try {
            setSaving(true);
            const res = await api.post('employees', buildFormData());
            showToast(res.data?.message || 'Employee created.', 'success');
            navigate(res.data?.redirect || '/employees');
        } catch (err) {
            if (err.errors) setFormErrors(err.errors);
            else showToast(err.message || 'Failed to create employee.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const billerOptions = toOptions(metadata.billers, (b) =>
        b.company_name ? `${b.name} (${b.company_name})` : b.name
    );

    if (!canAdd) {
        return (
            <PageLayout title="Add Employee">
                <p>You do not have permission to add employees.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Add Employee"
            actions={
                <Link to="/employees" className="ui-btn ghost">
                    Back to list
                </Link>
            }
        >
            <Toast toast={toast} />

            {loading ? (
                <p>Loading form…</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <FormRow cols={1}>
                        <FormField label="Image" error={formErrors.image}>
                            <FileInput onChange={setField('image')} accept="image/*" />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="Name" required error={formErrors.employee_name}>
                            <TextInput value={form.employee_name} onChange={setField('employee_name')} />
                        </FormField>
                        <FormField label="Email" required error={formErrors.email}>
                            <TextInput type="email" value={form.email} onChange={setField('email')} />
                        </FormField>
                        <FormField label="Phone number" required error={formErrors.phone_number}>
                            <TextInput value={form.phone_number} onChange={setField('phone_number')} />
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

                    <FormRow cols={3}>
                        <FormField label="Basic salary" required error={formErrors.basic_salary}>
                            <NumberInput value={form.basic_salary} onChange={setField('basic_salary')} step="any" />
                        </FormField>
                        <FormField label="Staff ID" error={formErrors.staff_id}>
                            <TextInput value={form.staff_id} onChange={setField('staff_id')} />
                        </FormField>
                        <FormField label="Role" required error={formErrors.role_id}>
                            <SelectInput value={form.role_id} onChange={setField('role_id')} options={toOptions(metadata.roles)} placeholder="Select role" />
                        </FormField>
                    </FormRow>

                    <FormRow cols={2}>
                        <FormField label="Warehouse" required error={formErrors.warehouse_id}>
                            <SelectInput value={form.warehouse_id} onChange={setField('warehouse_id')} options={toOptions(metadata.warehouses)} placeholder="Select warehouse" />
                        </FormField>
                        <FormField label="Biller" required error={formErrors.biller_id}>
                            <SelectInput value={form.biller_id} onChange={setField('biller_id')} options={billerOptions} placeholder="Select biller" />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="Department" required error={formErrors.department_id}>
                            <SelectInput value={form.department_id} onChange={setField('department_id')} options={toOptions(metadata.departments)} placeholder="Select department" />
                        </FormField>
                        <FormField label="Shift" required error={formErrors.shift_id}>
                            <SelectInput value={form.shift_id} onChange={setField('shift_id')} options={toOptions(metadata.shifts)} placeholder="Select shift" />
                        </FormField>
                        <FormField label="Designation" required error={formErrors.designation_id}>
                            <SelectInput value={form.designation_id} onChange={setField('designation_id')} options={toOptions(metadata.designations)} placeholder="Select designation" />
                        </FormField>
                    </FormRow>

                    <FormRow cols={1}>
                        <FormField label="">
                            <CheckboxInput label="Add user login for this employee" checked={form.add_user} onChange={setField('add_user')} />
                        </FormField>
                    </FormRow>

                    {form.add_user && (
                        <FormRow cols={2}>
                            <FormField label="Username" required error={formErrors.username}>
                                <TextInput value={form.username} onChange={setField('username')} />
                            </FormField>
                            <FormField label="Password" required error={formErrors.password}>
                                <TextInput type="password" value={form.password} onChange={setField('password')} />
                            </FormField>
                        </FormRow>
                    )}

                    <button type="submit" className="ui-btn primary" disabled={saving} style={{ marginTop: 16 }}>
                        {saving ? 'Saving…' : 'Submit'}
                    </button>
                </form>
            )}
        </PageLayout>
    );
};

export default EmployeeCreate;
