import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
    PageLayout,
    FormField,
    FormRow,
    TextInput,
    SelectInput,
    CheckboxInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const TYPE_OPTIONS = [
    { value: 'limited', label: 'Limited' },
    { value: 'generic', label: 'Generic' },
];

const EMPTY_FORM = {
    name: '',
    type: 'limited',
    customer_id: [],
    is_active: true,
};

const DiscountPlanForm = ({ controllerName }) => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const ctrl = controllerName || 'discount-plans';
    const { canAdd, canEdit } = usePermissions(ctrl);

    const [customers, setCustomers] = useState([]);
    const [allCustomerIds, setAllCustomerIds] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();

    const canSubmit = isEdit ? canEdit : canAdd;

    useEffect(() => {
        loadFormData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadFormData = async () => {
        try {
            setLoading(true);
            if (isEdit) {
                const res = await api.get(`discount-plans/${id}/edit`);
                const data = res.data?.data ?? {};
                const selected = (res.data?.selected_customer_ids ?? data.customer_ids ?? []).map(Number);
                const customerList = res.data?.customers ?? [];
                const allIds = (res.data?.all_customer_ids ?? customerList.map((c) => c.id)).map(Number);

                setCustomers(customerList);
                setAllCustomerIds(allIds);
                setForm({
                    name: data.name || '',
                    type: data.type || 'limited',
                    customer_id: data.type === 'generic' ? allIds : selected,
                    is_active: !!data.is_active,
                });
            } else {
                const res = await api.get('discount-plans/create');
                const customerList = res.data?.customers ?? [];
                const allIds = customerList.map((c) => Number(c.id));
                setCustomers(customerList);
                setAllCustomerIds(allIds);
                setForm(EMPTY_FORM);
            }
            setFormErrors({});
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load form.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setField = (name) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setForm((f) => ({
            ...f,
            type: newType,
            customer_id: newType === 'generic' ? [...allCustomerIds] : f.customer_id,
        }));
    };

    const handleCustomerChange = (e) => {
        const values = Array.from(e.target.selectedOptions, (option) => Number(option.value));
        setForm((f) => ({ ...f, customer_id: values }));
    };

    const validateForm = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Name is required';
        if (!form.customer_id?.length) errors.customer_id = 'Select at least one customer';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || !validateForm()) return;

        try {
            setSaving(true);
            const payload = {
                name: form.name.trim(),
                type: form.type,
                customer_id: form.customer_id,
                is_active: form.is_active,
            };

            const res = isEdit
                ? await api.put(`discount-plans/${id}`, payload)
                : await api.post('discount-plans', payload);

            showToast(res.data?.message || 'Saved successfully.', 'success');
            navigate('/discount-plans');
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.name?.[0] ||
                'Failed to save discount plan.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const customerOptions = useMemo(
        () =>
            customers.map((c) => ({
                value: String(c.id),
                label: `${c.name}${c.phone_number ? ` (${c.phone_number})` : ''}`,
            })),
        [customers]
    );

    if (loading) {
        return (
            <PageLayout title={isEdit ? 'Update Discount Plan' : 'Create Discount Plan'}>
                <p className="text-muted">Loading…</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title={isEdit ? 'Update Discount Plan' : 'Create Discount Plan'}
            actions={
                <Link to="/discount-plans" className="ui-btn ghost">
                    ← Back to list
                </Link>
            }
        >
            <Toast toast={toast} />

            <form onSubmit={handleSubmit} className="ui-form-grid full">
                <FormRow cols={2}>
                    <FormField label="Name *" error={formErrors.name}>
                        <TextInput
                            value={form.name}
                            onChange={setField('name')}
                            placeholder="Enter discount plan name"
                        />
                    </FormField>
                    <FormField label="Type *">
                        <SelectInput
                            value={form.type}
                            onChange={handleTypeChange}
                            options={TYPE_OPTIONS}
                        />
                    </FormField>
                </FormRow>

                <FormField label="Customer *" error={formErrors.customer_id}>
                    <select
                        multiple
                        className="ui-input"
                        value={form.customer_id.map(String)}
                        onChange={handleCustomerChange}
                        size={Math.min(8, Math.max(4, customerOptions.length))}
                        style={{ minHeight: 120 }}
                        disabled={form.type === 'generic'}
                    >
                        {customerOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ui-muted)', marginTop: 6 }}>
                        Hold Ctrl (Windows) or Cmd (Mac) to select multiple customers.
                        {form.type === 'generic' && ' Generic plans include all regular customers.'}
                    </p>
                </FormField>

                <FormField>
                    <CheckboxInput
                        label="Active"
                        checked={form.is_active}
                        onChange={setField('is_active')}
                    />
                </FormField>

                <div>
                    <button type="submit" className="ui-btn primary" disabled={saving || !canSubmit}>
                        {saving ? 'Saving…' : 'Submit'}
                    </button>
                </div>
            </form>
        </PageLayout>
    );
};

export default DiscountPlanForm;
