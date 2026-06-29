import React, { useState, useEffect } from 'react';

import {
    PageLayout,
    FormField,
    FormRow,
    TextInput,
    Toast,
    useToast,
} from '../../../../components/ui';
import { api } from '../../../../services';
import usePermissions from '../../../../stores/usePermissions';

const EMPTY_FORM = {
    checkin: '',
    checkout: '',
};

const HrmSettingManager = ({ controllerName }) => {
    const ctrl =
        controllerName === 'hrm-settings' || controllerName === 'setting'
            ? 'hrm_setting'
            : (controllerName || 'hrm_setting');
    const { canEdit } = usePermissions(ctrl);

    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const { toast, showToast } = useToast();

    const setField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('setting/hrm_setting');
            const data = res.data?.data ?? {};
            setForm({
                checkin: data.checkin || '',
                checkout: data.checkout || '',
            });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load HRM settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const errors = {};
        if (!form.checkin?.trim()) errors.checkin = 'Check-in time is required.';
        if (!form.checkout?.trim()) errors.checkout = 'Check-out time is required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit || !validate()) return;
        try {
            setSaving(true);
            const res = await api.post('setting/hrm_setting_store', {
                checkin: form.checkin.trim(),
                checkout: form.checkout.trim(),
            });
            showToast(res.data?.message || 'HRM settings updated.', 'success');
            if (res.data?.data) {
                setForm({
                    checkin: res.data.data.checkin || '',
                    checkout: res.data.data.checkout || '',
                });
            }
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to save HRM settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageLayout title="HRM Setting">
            <Toast toast={toast} />

            {loading ? (
                <p>Loading settings…</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <p className="ui-modal-hint" style={{ marginBottom: 16 }}>
                        Fields marked with * are required. Use times like <strong>10:00am</strong> or{' '}
                        <strong>6:00pm</strong>.
                    </p>

                    <FormRow cols={2}>
                        <FormField label="Default Check In" required error={formErrors.checkin}>
                            <TextInput
                                value={form.checkin}
                                onChange={setField('checkin')}
                                placeholder="10:00am"
                                disabled={!canEdit}
                            />
                        </FormField>
                        <FormField label="Default Check Out" required error={formErrors.checkout}>
                            <TextInput
                                value={form.checkout}
                                onChange={setField('checkout')}
                                placeholder="6:00pm"
                                disabled={!canEdit}
                            />
                        </FormField>
                    </FormRow>

                    {canEdit && (
                        <button type="submit" className="ui-btn primary" disabled={saving} style={{ marginTop: 16 }}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    )}
                </form>
            )}
        </PageLayout>
    );
};

export default HrmSettingManager;
