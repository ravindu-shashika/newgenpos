import React, { useState, useEffect, useMemo } from 'react';

import {
    PageLayout,
    FormField,
    FormRow,
    TextInput,
    SelectInput,
    CheckboxInput,
    Toast,
    useToast,
} from '../../../../components/ui';
import { api } from '../../../../services';
import usePermissions from '../../../../stores/usePermissions';

const GATEWAY_LABELS = {
    revesms: 'revesms',
    bdbulksms: 'bdbulksms',
    tonkra: 'Tonkra',
    twilio: 'Twilio',
    clickatell: 'Clickatell',
    zircon: 'Zircon',
};

const EMPTY_FORM = {
    gateway: '',
    active: false,
    token: '',
    apikey: '',
    secretkey: '',
    callerID: '',
    api_token: '',
    sender_id: '',
    account_sid: '',
    auth_token: '',
    twilio_number: '',
    api_key: '',
    user_id: '',
};

const SmsSettingManager = ({ controllerName }) => {
    const ctrl =
        controllerName === 'sms-settings' || controllerName === 'setting'
            ? 'sms_setting'
            : (controllerName || 'sms_setting');
    const { canEdit } = usePermissions(ctrl);

    const [gateways, setGateways] = useState({});
    const [gatewayOptions, setGatewayOptions] = useState([]);
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

    const applyGatewayValues = (gatewayName, gatewayMap, activeDefault = false) => {
        const cfg = gatewayMap[gatewayName] || {};
        setForm({
            gateway: gatewayName,
            active: activeDefault || Boolean(cfg.active),
            token: cfg.token || '',
            apikey: cfg.apikey || '',
            secretkey: cfg.secretkey || '',
            callerID: cfg.callerID || '',
            api_token: cfg.api_token || '',
            sender_id: cfg.sender_id || '',
            account_sid: cfg.account_sid || '',
            auth_token: cfg.auth_token || '',
            twilio_number: cfg.twilio_number || '',
            api_key: cfg.api_key || '',
            user_id: cfg.user_id || '',
        });
    };

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('setting/sms_setting');
            const data = res.data?.data ?? {};
            const map = data.gateways || {};
            const options = data.gateway_options || Object.keys(map);
            setGateways(map);
            setGatewayOptions(options);
            const selected = data.selected_gateway || options[0] || '';
            if (selected) {
                applyGatewayValues(selected, map, Boolean(map[selected]?.active));
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load SMS settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGatewayChange = (e) => {
        const gatewayName = e.target.value;
        applyGatewayValues(gatewayName, gateways, Boolean(gateways[gatewayName]?.active));
    };

    const selectOptions = useMemo(
        () =>
            gatewayOptions.map((value) => ({
                value,
                label: GATEWAY_LABELS[value] || value,
            })),
        [gatewayOptions]
    );

    const validate = () => {
        const errors = {};
        if (!form.gateway) errors.gateway = 'Gateway is required.';

        if (form.gateway === 'bdbulksms' && !form.token?.trim()) errors.token = 'Token is required.';
        if (form.gateway === 'revesms') {
            if (!form.apikey?.trim()) errors.apikey = 'API Key is required.';
            if (!form.secretkey?.trim()) errors.secretkey = 'Secret Key is required.';
            if (!form.callerID?.trim()) errors.callerID = 'Caller ID is required.';
        }
        if (form.gateway === 'tonkra') {
            if (!form.api_token?.trim()) errors.api_token = 'API Token is required.';
            if (!form.sender_id?.trim()) errors.sender_id = 'Sender ID is required.';
        }
        if (form.gateway === 'twilio') {
            if (!form.account_sid?.trim()) errors.account_sid = 'Account SID is required.';
            if (!form.auth_token?.trim()) errors.auth_token = 'Auth Token is required.';
            if (!form.twilio_number?.trim()) errors.twilio_number = 'Twilio Number is required.';
        }
        if (form.gateway === 'clickatell' && !form.api_key?.trim()) {
            errors.api_key = 'API Key is required.';
        }
        if (form.gateway === 'zircon') {
            if (!form.user_id?.trim()) errors.user_id = 'User ID is required.';
            if (!form.api_key?.trim()) errors.api_key = 'API Key is required.';
            if (!form.sender_id?.trim()) errors.sender_id = 'Sender ID is required.';
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
                type: 'sms',
                gateway: form.gateway,
            };
            if (form.active) payload.active = 1;

            if (form.gateway === 'bdbulksms') payload.token = form.token;
            if (form.gateway === 'revesms') {
                payload.apikey = form.apikey;
                payload.secretkey = form.secretkey;
                payload.callerID = form.callerID;
            }
            if (form.gateway === 'tonkra') {
                payload.api_token = form.api_token;
                payload.sender_id = form.sender_id;
            }
            if (form.gateway === 'twilio') {
                payload.account_sid = form.account_sid;
                payload.auth_token = form.auth_token;
                payload.twilio_number = form.twilio_number;
            }
            if (form.gateway === 'clickatell') payload.api_key = form.api_key;
            if (form.gateway === 'zircon') {
                payload.user_id = form.user_id;
                payload.api_key = form.api_key;
                payload.sender_id = form.sender_id;
            }

            const res = await api.post('setting/sms_setting_store', payload);
            showToast(res.data?.message || 'SMS settings updated.', 'success');
            if (res.data?.data) {
                const map = res.data.data.gateways || {};
                setGateways(map);
                setGatewayOptions(res.data.data.gateway_options || Object.keys(map));
                const selected = res.data.data.selected_gateway || form.gateway;
                applyGatewayValues(selected, map, Boolean(map[selected]?.active));
            } else {
                fetchSettings();
            }
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to save SMS settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageLayout title="SMS Setting">
            <Toast toast={toast} />

            {loading ? (
                <p>Loading settings…</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <p className="ui-modal-hint" style={{ marginBottom: 16 }}>
                        Fields marked with * are required.
                    </p>

                    <FormField label="Gateway" required error={formErrors.gateway}>
                        <SelectInput
                            value={form.gateway}
                            onChange={handleGatewayChange}
                            options={selectOptions}
                            placeholder="Select SMS gateway…"
                            disabled={!canEdit}
                        />
                    </FormField>

                    {form.gateway === 'bdbulksms' && (
                        <FormField label="Token" required error={formErrors.token}>
                            <TextInput value={form.token} onChange={setField('token')} disabled={!canEdit} />
                        </FormField>
                    )}

                    {form.gateway === 'revesms' && (
                        <>
                            <FormField label="API Key" required error={formErrors.apikey}>
                                <TextInput value={form.apikey} onChange={setField('apikey')} disabled={!canEdit} />
                            </FormField>
                            <FormField label="Secret Key" required error={formErrors.secretkey}>
                                <TextInput value={form.secretkey} onChange={setField('secretkey')} disabled={!canEdit} />
                            </FormField>
                            <FormField label="Caller ID" required error={formErrors.callerID}>
                                <TextInput value={form.callerID} onChange={setField('callerID')} disabled={!canEdit} />
                            </FormField>
                        </>
                    )}

                    {form.gateway === 'tonkra' && (
                        <>
                            <FormField label="API Token" required error={formErrors.api_token}>
                                <TextInput value={form.api_token} onChange={setField('api_token')} disabled={!canEdit} />
                            </FormField>
                            <FormField label="Sender ID" required error={formErrors.sender_id}>
                                <TextInput value={form.sender_id} onChange={setField('sender_id')} disabled={!canEdit} />
                            </FormField>
                        </>
                    )}

                    {form.gateway === 'twilio' && (
                        <>
                            <FormField label="Account SID" required error={formErrors.account_sid}>
                                <TextInput value={form.account_sid} onChange={setField('account_sid')} disabled={!canEdit} />
                            </FormField>
                            <FormField label="Auth Token" required error={formErrors.auth_token}>
                                <TextInput value={form.auth_token} onChange={setField('auth_token')} disabled={!canEdit} />
                            </FormField>
                            <FormField label="Twilio Number" required error={formErrors.twilio_number}>
                                <TextInput value={form.twilio_number} onChange={setField('twilio_number')} disabled={!canEdit} />
                            </FormField>
                        </>
                    )}

                    {form.gateway === 'clickatell' && (
                        <FormField label="API Key" required error={formErrors.api_key}>
                            <TextInput value={form.api_key} onChange={setField('api_key')} disabled={!canEdit} />
                        </FormField>
                    )}

                    {form.gateway === 'zircon' && (
                        <>
                            <FormField label="User ID" required error={formErrors.user_id}>
                                <TextInput value={form.user_id} onChange={setField('user_id')} disabled={!canEdit} />
                            </FormField>
                            <FormField label="API Key" required error={formErrors.api_key}>
                                <TextInput value={form.api_key} onChange={setField('api_key')} disabled={!canEdit} />
                            </FormField>
                            <FormField label="Sender ID" required error={formErrors.sender_id}>
                                <TextInput value={form.sender_id} onChange={setField('sender_id')} disabled={!canEdit} />
                            </FormField>
                        </>
                    )}

                    <FormRow cols={2}>
                        <CheckboxInput
                            label="Default"
                            checked={form.active}
                            onChange={setField('active')}
                        />
                    </FormRow>

                    {canEdit && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            <button type="submit" className="ui-btn primary" disabled={saving}>
                                {saving ? 'Saving…' : 'Submit'}
                            </button>
                            {form.gateway === 'tonkra' && (
                                <a
                                    href="https://sms.tonkra.com/account/top-up"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ui-btn ghost"
                                >
                                    Top Up
                                </a>
                            )}
                        </div>
                    )}
                </form>
            )}
        </PageLayout>
    );
};

export default SmsSettingManager;
