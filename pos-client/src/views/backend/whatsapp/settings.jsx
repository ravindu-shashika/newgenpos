import React, { useEffect, useState } from 'react';
import {
    PageLayout,
    FormField,
    FormRow,
    TextInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

const EMPTY_FORM = {
    permanent_access_token: '',
    phone_number_id: '',
    business_account_id: '',
};

export default function WhatsappSettings() {
    const canEdit = permissionsBypassed()
        || authStore.getPermissions()?.includes('sidebar_whatsapp');
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const { toast, showToast } = useToast();

    const setField = (name) => (e) => {
        setForm((prev) => ({ ...prev, [name]: e.target.value }));
        if (formErrors[name]) {
            setFormErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await api.get('whatsapp/settings');
                const data = res.data?.data ?? res.data ?? {};
                setForm({
                    permanent_access_token: data.permanent_access_token ?? '',
                    phone_number_id: data.phone_number_id ?? '',
                    business_account_id: data.business_account_id ?? '',
                });
            } catch (err) {
                showToast(err?.message || 'Failed to load WhatsApp settings.', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [showToast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) {
            showToast('You do not have permission to update WhatsApp settings.', 'error');
            return;
        }

        setSaving(true);
        setFormErrors({});
        try {
            await api.post('whatsapp/settings', form);
            showToast('WhatsApp settings updated successfully.', 'success');
        } catch (err) {
            if (err?.errors && typeof err.errors === 'object') {
                setFormErrors(err.errors);
            }
            showToast(err?.message || 'Failed to update WhatsApp settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageLayout title="WhatsApp Settings">
            <Toast toast={toast} />

            {loading ? (
                <p className="text-muted">Loading…</p>
            ) : (
                <form onSubmit={handleSubmit} className="ui-card" style={{ padding: '20px 24px', maxWidth: 720 }}>
                    <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                        Configure your Meta WhatsApp Cloud API credentials. These are required for templates and sending messages.
                    </p>

                    <FormField
                        label="Permanent Access Token"
                        error={formErrors.permanent_access_token?.[0]}
                    >
                        <TextInput
                            name="permanent_access_token"
                            value={form.permanent_access_token}
                            onChange={setField('permanent_access_token')}
                            disabled={!canEdit}
                            autoComplete="off"
                        />
                    </FormField>

                    <FormRow>
                        <FormField
                            label="Phone Number ID"
                            error={formErrors.phone_number_id?.[0]}
                        >
                            <TextInput
                                name="phone_number_id"
                                value={form.phone_number_id}
                                onChange={setField('phone_number_id')}
                                disabled={!canEdit}
                                autoComplete="off"
                            />
                        </FormField>
                        <FormField
                            label="Business Account ID"
                            error={formErrors.business_account_id?.[0]}
                        >
                            <TextInput
                                name="business_account_id"
                                value={form.business_account_id}
                                onChange={setField('business_account_id')}
                                disabled={!canEdit}
                                autoComplete="off"
                            />
                        </FormField>
                    </FormRow>

                    {canEdit && (
                        <div className="mt-4">
                            <button type="submit" className="ui-btn primary" disabled={saving}>
                                {saving ? 'Saving…' : 'Submit'}
                            </button>
                        </div>
                    )}
                </form>
            )}
        </PageLayout>
    );
}
