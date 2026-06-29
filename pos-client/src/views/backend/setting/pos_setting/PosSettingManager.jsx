import React, { useState, useEffect, useMemo } from 'react';

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
} from '../../../../components/ui';
import { api } from '../../../../services';
import usePermissions from '../../../../stores/usePermissions';

const PAYMENT_LABELS = {
    cash: 'Cash',
    card: 'Card',
    credit: 'Credit Sale',
    cheque: 'Cheque',
    gift_card: 'Gift Card',
    deposit: 'Deposit',
    points: 'Points',
    razorpay: 'Razorpay',
    pesapal: 'Pesapal',
    installment: 'Installment',
};

const STANDARD_OPTIONS = Object.keys(PAYMENT_LABELS);

const EMPTY_FORM = {
    customer_id: '',
    biller_id: '',
    warehouse_id: '',
    product_number: '',
    keybord_active: false,
    is_table: false,
    send_sms: false,
    cash_register: false,
    show_print_invoice: false,
};

function FieldInfo({ title }) {
    return (
        <span
            title={title}
            style={{
                marginLeft: 6,
                cursor: 'help',
                color: 'var(--ui-muted, #6b7280)',
                fontSize: 14,
                lineHeight: 1,
            }}
            aria-label={title}
        >
            ⓘ
        </span>
    );
}

const PosSettingManager = ({ controllerName }) => {
    const ctrl =
        controllerName === 'pos-settings' || controllerName === 'setting'
            ? 'pos_setting'
            : (controllerName || 'pos_setting');
    const { canEdit } = usePermissions(ctrl);

    const [form, setForm] = useState(EMPTY_FORM);
    const [metadata, setMetadata] = useState({
        customers: [],
        warehouses: [],
        billers: [],
        standard_payment_options: STANDARD_OPTIONS,
    });
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [customOptions, setCustomOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const { toast, showToast } = useToast();

    const standardOptions = metadata.standard_payment_options || STANDARD_OPTIONS;

    const setField = (name) => (e) => {
        const value =
            e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [name]: value }));
    };

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('setting/pos_setting');
            const data = res.data?.data ?? {};
            const meta = res.data?.metadata ?? {};
            const std = meta.standard_payment_options || STANDARD_OPTIONS;
            const allPayment = (data.payment_options || []).map((o) => String(o).trim()).filter(Boolean);

            setForm({
                customer_id: data.customer_id ? String(data.customer_id) : '',
                biller_id: data.biller_id ? String(data.biller_id) : '',
                warehouse_id: data.warehouse_id ? String(data.warehouse_id) : '',
                product_number: data.product_number ?? '',
                keybord_active: Boolean(data.keybord_active),
                is_table: Boolean(data.is_table),
                send_sms: Boolean(data.send_sms),
                cash_register: Boolean(data.cash_register),
                show_print_invoice: Boolean(data.show_print_invoice),
            });
            setSelectedOptions(allPayment.filter((o) => std.includes(o)));
            setCustomOptions(allPayment.filter((o) => !std.includes(o)));
            setMetadata((m) => ({ ...m, ...meta }));
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load POS settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const customerOptions = useMemo(
        () => metadata.customers.map((c) => ({ value: String(c.id), label: c.label || c.name })),
        [metadata.customers]
    );
    const warehouseOptions = useMemo(
        () => metadata.warehouses.map((w) => ({ value: String(w.id), label: w.name })),
        [metadata.warehouses]
    );
    const billerOptions = useMemo(
        () => metadata.billers.map((b) => ({ value: String(b.id), label: b.label || b.name })),
        [metadata.billers]
    );

    const setPaymentOption = (option, checked) => {
        setSelectedOptions((prev) => {
            if (checked) {
                return prev.includes(option) ? prev : [...prev, option];
            }
            return prev.filter((o) => o !== option);
        });
    };

    const addCustomOption = () => setCustomOptions((prev) => [...prev, '']);

    const updateCustomOption = (index, value) => {
        setCustomOptions((prev) => prev.map((item, i) => (i === index ? value : item)));
    };

    const removeCustomOption = (index) => {
        setCustomOptions((prev) => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const errors = {};
        if (!form.customer_id) errors.customer_id = 'Default customer is required.';
        if (!form.biller_id) errors.biller_id = 'Default biller is required.';
        if (!form.warehouse_id) errors.warehouse_id = 'Default warehouse is required.';
        if (!form.product_number && form.product_number !== 0) {
            errors.product_number = 'Product row count is required.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit || !validate()) return;

        const custom = customOptions.map((o) => o.trim()).filter(Boolean);
        const allOptions = [...selectedOptions, ...custom];
        if (new Set(allOptions).size !== allOptions.length) {
            showToast('Payment options must be unique.', 'error');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                customer_id: Number(form.customer_id),
                biller_id: Number(form.biller_id),
                warehouse_id: Number(form.warehouse_id),
                product_number: Number(form.product_number),
                options: allOptions,
                keybord_active: form.keybord_active ? 1 : 0,
                is_table: form.is_table ? 1 : 0,
                send_sms: form.send_sms ? 1 : 0,
                cash_register: form.cash_register ? 1 : 0,
                show_print_invoice: form.show_print_invoice ? 1 : 0,
            };

            const res = await api.post('setting/pos_setting_store', payload);
            showToast(res.data?.message || 'POS setting updated successfully.', 'success');
            if (res.data?.data) {
                const data = res.data.data;
                const std = metadata.standard_payment_options || STANDARD_OPTIONS;
                const allPayment = (data.payment_options || []).map((o) => String(o).trim()).filter(Boolean);
                setForm((f) => ({
                    ...f,
                    keybord_active: Boolean(data.keybord_active),
                    is_table: Boolean(data.is_table),
                    send_sms: Boolean(data.send_sms),
                    cash_register: Boolean(data.cash_register),
                    show_print_invoice: Boolean(data.show_print_invoice),
                }));
                setSelectedOptions(allPayment.filter((o) => std.includes(o)));
                setCustomOptions(allPayment.filter((o) => !std.includes(o)));
            } else {
                fetchSettings();
            }
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to save POS settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageLayout title="POS Setting">
            <Toast toast={toast} />

            {loading ? (
                <p>Loading settings…</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <p className="ui-modal-hint" style={{ marginBottom: 20, fontStyle: 'italic' }}>
                        The field labels marked with * are required input fields.
                    </p>

                    <FormRow cols={4}>
                        <FormField label="Default Customer" required error={formErrors.customer_id}>
                            <SelectInput
                                value={form.customer_id}
                                onChange={setField('customer_id')}
                                options={customerOptions}
                                placeholder="Select customer…"
                                disabled={!canEdit}
                            />
                        </FormField>
                        <FormField label="Default Biller" required error={formErrors.biller_id}>
                            <SelectInput
                                value={form.biller_id}
                                onChange={setField('biller_id')}
                                options={billerOptions}
                                placeholder="Select biller…"
                                disabled={!canEdit}
                            />
                        </FormField>
                        <FormField label="Default Warehouse" required error={formErrors.warehouse_id}>
                            <SelectInput
                                value={form.warehouse_id}
                                onChange={setField('warehouse_id')}
                                options={warehouseOptions}
                                placeholder="Select warehouse…"
                                disabled={!canEdit}
                            />
                        </FormField>
                        <FormField
                            label="Displayed Number of Product Row"
                            required
                            error={formErrors.product_number}
                        >
                            <NumberInput
                                value={form.product_number}
                                onChange={setField('product_number')}
                                min={1}
                                disabled={!canEdit}
                            />
                        </FormField>
                    </FormRow>

                    <div
                        className="ui-form-grid four"
                        style={{ marginTop: 8, marginBottom: 8 }}
                    >
                        <CheckboxInput
                            label="Touchscreen keybord"
                            checked={form.keybord_active}
                            onChange={setField('keybord_active')}
                            disabled={!canEdit}
                        />
                        <CheckboxInput
                            label="Table Management"
                            checked={form.is_table}
                            onChange={setField('is_table')}
                            disabled={!canEdit}
                        />
                        <CheckboxInput
                            label={
                                <>
                                    Send SMS After Sale
                                    <FieldInfo title="You'll have to set up SMS gateway settings for sending SMS (settings > SMS settings)" />
                                </>
                            }
                            checked={form.send_sms}
                            onChange={setField('send_sms')}
                            disabled={!canEdit}
                        />
                        <CheckboxInput
                            label={
                                <>
                                    Cash Register
                                    <FieldInfo title="If enabled, cash register will be activated on POS page" />
                                </>
                            }
                            checked={form.cash_register}
                            onChange={setField('cash_register')}
                            disabled={!canEdit}
                        />
                        <CheckboxInput
                            label={
                                <>
                                    print_invoice
                                    <FieldInfo title="If unchecked invoice will not print after sales" />
                                </>
                            }
                            checked={form.show_print_invoice}
                            onChange={setField('show_print_invoice')}
                            disabled={!canEdit}
                        />
                    </div>

                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--ui-border, #e5e7eb)' }} />

                    <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
                        Payment Options
                        <FieldInfo title="Selected payment gateways will show on pos page" />
                    </h4>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                            gap: '12px 16px',
                            marginBottom: 16,
                        }}
                    >
                        {standardOptions.map((option) => (
                            <CheckboxInput
                                key={option}
                                label={PAYMENT_LABELS[option] || option}
                                checked={selectedOptions.includes(option)}
                                onChange={(e) => setPaymentOption(option, e.target.checked)}
                                disabled={!canEdit}
                            />
                        ))}
                    </div>

                    {canEdit && (
                        <button type="button" className="ui-btn ghost" onClick={addCustomOption}>
                            + Add More Payment Option
                        </button>
                    )}

                    {customOptions.length > 0 && (
                        <div style={{ marginTop: 16, display: 'grid', gap: 12, maxWidth: 480 }}>
                            {customOptions.map((value, index) => (
                                <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <TextInput
                                        value={value}
                                        onChange={(e) => updateCustomOption(index, e.target.value)}
                                        placeholder="Payment Options"
                                        disabled={!canEdit}
                                    />
                                    {canEdit && (
                                        <button
                                            type="button"
                                            className="ui-btn danger"
                                            onClick={() => removeCustomOption(index)}
                                            aria-label="Remove payment option"
                                        >
                                            X
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {canEdit && (
                        <button type="submit" className="ui-btn primary" disabled={saving} style={{ marginTop: 24 }}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    )}
                </form>
            )}
        </PageLayout>
    );
};

export default PosSettingManager;
