import React, { useState, useEffect } from 'react';

import {
    PageLayout,
    FormField,
    FormRow,
    FormSection,
    NumberInput,
    SelectInput,
    CheckboxInput,
    Toast,
    useToast,
} from '../../../../components/ui';
import { api } from '../../../../services';
import usePermissions from '../../../../stores/usePermissions';

const DURATION_TYPE_OPTIONS = [
    { value: 'days', label: 'Days' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' },
];

const EMPTY_FORM = {
    is_active: false,
    per_point_amount: '',
    minimum_amount: '',
    duration: '',
    type: 'days',
    redeem_amount_per_unit_rp: '',
    min_order_total_for_redeem: '',
    min_redeem_point: '',
    max_redeem_point: '',
};

const RewardPointSettingManager = ({ controllerName }) => {
    const ctrl =
        controllerName === 'reward-point-settings' || controllerName === 'setting'
            ? 'reward_point_setting'
            : (controllerName || 'reward_point_setting');
    const { canEdit } = usePermissions(ctrl);

    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const { toast, showToast } = useToast();

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
            const res = await api.get('setting/reward-point-setting');
            const data = res.data?.data ?? {};
            setForm({
                is_active: Boolean(data.is_active),
                per_point_amount: data.per_point_amount ?? '',
                minimum_amount: data.minimum_amount ?? '',
                duration: data.duration ?? '',
                type: data.type || 'days',
                redeem_amount_per_unit_rp: data.redeem_amount_per_unit_rp ?? '',
                min_order_total_for_redeem: data.min_order_total_for_redeem ?? '',
                min_redeem_point: data.min_redeem_point ?? '',
                max_redeem_point: data.max_redeem_point ?? '',
            });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load reward point settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const errors = {};
        if (!form.per_point_amount && form.per_point_amount !== 0) {
            errors.per_point_amount = 'Sold amount per point is required.';
        }
        if (!form.minimum_amount && form.minimum_amount !== 0) {
            errors.minimum_amount = 'Minimum sold amount is required.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit || !validate()) return;
        try {
            setSaving(true);
            const payload = {
                per_point_amount: form.per_point_amount,
                minimum_amount: form.minimum_amount,
                duration: form.duration === '' ? null : form.duration,
                type: form.type,
                redeem_amount_per_unit_rp: form.redeem_amount_per_unit_rp || null,
                min_order_total_for_redeem: form.min_order_total_for_redeem || null,
                min_redeem_point: form.min_redeem_point === '' ? null : form.min_redeem_point,
                max_redeem_point: form.max_redeem_point === '' ? null : form.max_redeem_point,
            };
            if (form.is_active) {
                payload.is_active = 1;
            }
            const res = await api.post('setting/reward-point-setting_store', payload);
            showToast(res.data?.message || 'Reward point settings updated.', 'success');
            if (res.data?.data) {
                setForm({
                    is_active: Boolean(res.data.data.is_active),
                    per_point_amount: res.data.data.per_point_amount ?? '',
                    minimum_amount: res.data.data.minimum_amount ?? '',
                    duration: res.data.data.duration ?? '',
                    type: res.data.data.type || 'days',
                    redeem_amount_per_unit_rp: res.data.data.redeem_amount_per_unit_rp ?? '',
                    min_order_total_for_redeem: res.data.data.min_order_total_for_redeem ?? '',
                    min_redeem_point: res.data.data.min_redeem_point ?? '',
                    max_redeem_point: res.data.data.max_redeem_point ?? '',
                });
            }
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to save settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageLayout title="Reward Point Setting">
            <Toast toast={toast} />

            {loading ? (
                <p>Loading settings…</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <p className="ui-modal-hint" style={{ marginBottom: 16 }}>
                        Fields marked with * are required.
                    </p>

                    <FormSection label="Reward Point Configuration">
                        <FormRow cols={2}>
                            <CheckboxInput
                                label="Active reward point"
                                checked={form.is_active}
                                onChange={setField('is_active')}
                            />
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField
                                label="Sold amount per point"
                                required
                                error={formErrors.per_point_amount}
                            >
                                <NumberInput
                                    value={form.per_point_amount}
                                    onChange={setField('per_point_amount')}
                                    min={0}
                                    step="any"
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField
                                label="Minimum sold amount to get point"
                                required
                                error={formErrors.minimum_amount}
                            >
                                <NumberInput
                                    value={form.minimum_amount}
                                    onChange={setField('minimum_amount')}
                                    min={0}
                                    step="any"
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="Point expiry duration">
                                <NumberInput
                                    value={form.duration}
                                    onChange={setField('duration')}
                                    min={0}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Duration type">
                                <SelectInput
                                    value={form.type}
                                    onChange={setField('type')}
                                    options={DURATION_TYPE_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                    </FormSection>

                    <FormSection label="Redeem Points Settings">
                        <FormRow cols={2}>
                            <FormField label="Redeem amount per unit point">
                                <NumberInput
                                    value={form.redeem_amount_per_unit_rp}
                                    onChange={setField('redeem_amount_per_unit_rp')}
                                    min={0}
                                    step="any"
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Minimum order total to redeem points">
                                <NumberInput
                                    value={form.min_order_total_for_redeem}
                                    onChange={setField('min_order_total_for_redeem')}
                                    min={0}
                                    step="any"
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="Minimum redeem point">
                                <NumberInput
                                    value={form.min_redeem_point}
                                    onChange={setField('min_redeem_point')}
                                    min={0}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Maximum redeem point per order">
                                <NumberInput
                                    value={form.max_redeem_point}
                                    onChange={setField('max_redeem_point')}
                                    min={0}
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                    </FormSection>

                    {canEdit && (
                        <button type="submit" className="ui-btn primary" disabled={saving}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    )}
                </form>
            )}
        </PageLayout>
    );
};

export default RewardPointSettingManager;
