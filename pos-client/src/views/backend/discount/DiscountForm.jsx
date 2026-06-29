import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
    PageLayout,
    FormField,
    FormRow,
    TextInput,
    NumberInput,
    SelectInput,
    CheckboxInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const APPLICABLE_OPTIONS = [
    { value: 'All', label: 'All Products' },
    { value: 'Specific', label: 'Specific Products' },
];

const TYPE_OPTIONS = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'flat', label: 'Flat' },
];

const DAY_OPTIONS = [
    { value: 'Mon', label: 'Monday' },
    { value: 'Tue', label: 'Tuesday' },
    { value: 'Wed', label: 'Wednesday' },
    { value: 'Thu', label: 'Thursday' },
    { value: 'Fri', label: 'Friday' },
    { value: 'Sat', label: 'Saturday' },
    { value: 'Sun', label: 'Sunday' },
];

const DEFAULT_DAYS = DAY_OPTIONS.map((d) => d.value);

const EMPTY_FORM = {
    name: '',
    discount_plan_id: [],
    applicable_for: 'All',
    is_active: true,
    valid_from: '',
    valid_till: '',
    type: 'percentage',
    value: '',
    minimum_qty: '',
    maximum_qty: '',
    days: [...DEFAULT_DAYS],
};

const DiscountForm = ({ controllerName }) => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const ctrl = controllerName || 'discounts';
    const { canAdd, canEdit } = usePermissions(ctrl);

    const [discountPlans, setDiscountPlans] = useState([]);
    const [products, setProducts] = useState([]);
    const [productCode, setProductCode] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();
    const canSubmit = isEdit ? canEdit : canAdd;
    const showProductSection = form.applicable_for === 'Specific';

    useEffect(() => {
        loadFormData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadFormData = async () => {
        try {
            setLoading(true);
            if (isEdit) {
                const res = await api.get(`discounts/${id}/edit`);
                const data = res.data?.data ?? {};
                setDiscountPlans(res.data?.discount_plans ?? []);
                setProducts(data.products ?? []);
                setForm({
                    name: data.name || '',
                    discount_plan_id: (res.data?.selected_discount_plan_ids ?? data.discount_plan_ids ?? []).map(Number),
                    applicable_for: data.applicable_for || 'All',
                    is_active: !!data.is_active,
                    valid_from: data.valid_from || '',
                    valid_till: data.valid_till || '',
                    type: data.type || 'percentage',
                    value: data.value ?? '',
                    minimum_qty: data.minimum_qty ?? '',
                    maximum_qty: data.maximum_qty ?? '',
                    days: data.days?.length ? data.days : [...DEFAULT_DAYS],
                });
            } else {
                const res = await api.get('discounts/create');
                setDiscountPlans(res.data?.discount_plans ?? []);
                setProducts([]);
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

    const handlePlanChange = (e) => {
        const values = Array.from(e.target.selectedOptions, (option) => Number(option.value));
        setForm((f) => ({ ...f, discount_plan_id: values }));
    };

    const toggleDay = (day) => {
        setForm((f) => ({
            ...f,
            days: f.days.includes(day)
                ? f.days.filter((d) => d !== day)
                : [...f.days, day],
        }));
    };

    const handleProductCodeInput = async (e) => {
        const value = e.target.value;
        setProductCode(value);

        if (!value.includes(',')) return;

        const code = value.slice(0, -1).trim();
        setProductCode('');

        if (!code) return;
        if (products.some((p) => p.code === code)) {
            showToast('This product is already in the list.', 'error');
            return;
        }

        try {
            const res = await api.get(`discounts/product-search/${encodeURIComponent(code)}`);
            const product = res.data?.data;
            if (product?.id) {
                setProducts((list) => [...list, product]);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Product not found.', 'error');
        }
    };

    const removeProduct = (productId) => {
        setProducts((list) => list.filter((p) => p.id !== productId));
    };

    const validateForm = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Name is required';
        if (!form.discount_plan_id?.length) errors.discount_plan_id = 'Select at least one discount plan';
        if (!form.valid_from) errors.valid_from = 'Valid from is required';
        if (!form.valid_till) errors.valid_till = 'Valid till is required';
        if (form.value === '' || form.value === null) errors.value = 'Value is required';
        if (form.minimum_qty === '' || form.minimum_qty === null) errors.minimum_qty = 'Minimum qty is required';
        if (form.maximum_qty === '' || form.maximum_qty === null) errors.maximum_qty = 'Maximum qty is required';
        if (!form.days?.length) errors.days = 'Select at least one day';
        if (form.applicable_for === 'Specific' && !products.length) {
            errors.products = 'Add at least one product';
        }
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
                discount_plan_id: form.discount_plan_id,
                applicable_for: form.applicable_for,
                is_active: form.is_active,
                valid_from: form.valid_from,
                valid_till: form.valid_till,
                type: form.type,
                value: Number(form.value),
                minimum_qty: Number(form.minimum_qty),
                maximum_qty: Number(form.maximum_qty),
                days: form.days,
                product_list: form.applicable_for === 'Specific' ? products.map((p) => p.id) : [],
            };

            const res = isEdit
                ? await api.put(`discounts/${id}`, payload)
                : await api.post('discounts', payload);

            showToast(res.data?.message || 'Saved successfully.', 'success');
            navigate('/discounts');
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.name?.[0] ||
                'Failed to save discount.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title={isEdit ? 'Update Discount' : 'Create Discount'}>
                <p className="text-muted">Loading…</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title={isEdit ? 'Update Discount' : 'Create Discount'}
            actions={
                <Link to="/discounts" className="ui-btn ghost">
                    ← Back to list
                </Link>
            }
        >
            <Toast toast={toast} />

            <form onSubmit={handleSubmit} className="ui-form-grid full">
                <FormRow cols={2}>
                    <FormField label="Name *" error={formErrors.name}>
                        <TextInput value={form.name} onChange={setField('name')} />
                    </FormField>
                    <FormField label="Discount Plan *" error={formErrors.discount_plan_id}>
                        <select
                            multiple
                            className="ui-input"
                            value={form.discount_plan_id.map(String)}
                            onChange={handlePlanChange}
                            size={Math.min(6, Math.max(3, discountPlans.length))}
                            style={{ minHeight: 90 }}
                        >
                            {discountPlans.map((plan) => (
                                <option key={plan.id} value={String(plan.id)}>
                                    {plan.name}
                                </option>
                            ))}
                        </select>
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    <FormField label="Applicable For *">
                        <SelectInput
                            value={form.applicable_for}
                            onChange={setField('applicable_for')}
                            options={APPLICABLE_OPTIONS}
                        />
                    </FormField>
                    <FormField>
                        <CheckboxInput
                            label="Active"
                            checked={form.is_active}
                            onChange={setField('is_active')}
                        />
                    </FormField>
                </FormRow>

                {showProductSection && (
                    <>
                        <FormField
                            label="Select Product *"
                            error={formErrors.products}
                            span2
                        >
                            <TextInput
                                value={productCode}
                                onChange={handleProductCodeInput}
                                placeholder="Type product code followed by comma"
                            />
                        </FormField>

                        {products.length > 0 && (
                            <div className="ui-table-wrap" style={{ gridColumn: '1 / -1' }}>
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Code</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product, index) => (
                                            <tr key={product.id}>
                                                <td>{index + 1}</td>
                                                <td>{product.name}</td>
                                                <td>{product.code}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="ui-btn danger"
                                                        onClick={() => removeProduct(product.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                <FormRow cols={2}>
                    <FormField label="Valid From *" error={formErrors.valid_from}>
                        <TextInput type="date" value={form.valid_from} onChange={setField('valid_from')} />
                    </FormField>
                    <FormField label="Valid Till *" error={formErrors.valid_till}>
                        <TextInput type="date" value={form.valid_till} onChange={setField('valid_till')} />
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    <FormField label="Discount Type *">
                        <SelectInput
                            value={form.type}
                            onChange={setField('type')}
                            options={TYPE_OPTIONS}
                        />
                    </FormField>
                    <FormField label="Value *" error={formErrors.value}>
                        <NumberInput value={form.value} onChange={setField('value')} />
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    <FormField label="Minimum Qty *" error={formErrors.minimum_qty}>
                        <NumberInput value={form.minimum_qty} onChange={setField('minimum_qty')} />
                    </FormField>
                    <FormField label="Maximum Qty *" error={formErrors.maximum_qty}>
                        <NumberInput value={form.maximum_qty} onChange={setField('maximum_qty')} />
                    </FormField>
                </FormRow>

                <FormField label="Valid on the following days *" error={formErrors.days}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {DAY_OPTIONS.map((day) => (
                            <CheckboxInput
                                key={day.value}
                                label={day.label}
                                checked={form.days.includes(day.value)}
                                onChange={() => toggleDay(day.value)}
                            />
                        ))}
                    </div>
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

export default DiscountForm;
