import React, { useState, useEffect, useMemo, useRef } from 'react';

import {
    PageLayout,
    FormField,
    FormRow,
    FormSection,
    TextInput,
    NumberInput,
    SelectInput,
    TextareaInput,
    FileInput,
    CheckboxInput,
    Toast,
    useToast,
} from '../../../../components/ui';
import { api } from '../../../../services';
import generalSettingStore from '../../../../stores/generalSettingStore';
import usePermissions from '../../../../stores/usePermissions';

const WITHOUT_STOCK_OPTIONS = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
];

const PACKING_SLIP_OPTIONS = [
    { value: '1', label: 'Enable' },
    { value: '0', label: 'Disable' },
];

const CURRENCY_POSITION_OPTIONS = [
    { value: 'prefix', label: 'Prefix' },
    { value: 'suffix', label: 'Suffix' },
];

const SHOW_HIDE_OPTIONS = [
    { value: '1', label: 'Show' },
    { value: '0', label: 'Hide' },
];

const STAFF_ACCESS_OPTIONS = [
    { value: 'all', label: 'All Records' },
    { value: 'own', label: 'Own Records' },
    { value: 'warehouse', label: 'Warehouse Wise' },
];

const INVOICE_FORMAT_OPTIONS = [
    { value: 'standard', label: 'Standard' },
    { value: 'gst', label: 'Indian GST' },
];

const STATE_OPTIONS = [
    { value: '1', label: 'Home State' },
    { value: '2', label: 'Buyer State' },
];

const DATE_FORMAT_OPTIONS = [
    { value: 'd-m-Y', label: 'dd-mm-yyyy' },
    { value: 'd/m/Y', label: 'dd/mm/yyyy' },
    { value: 'd.m.Y', label: 'dd.mm.yyyy' },
    { value: 'm-d-Y', label: 'mm-dd-yyyy' },
    { value: 'm/d/Y', label: 'mm/dd/yyyy' },
    { value: 'm.d.Y', label: 'mm.dd.yyyy' },
    { value: 'Y-m-d', label: 'yyyy-mm-dd' },
    { value: 'Y/m/d', label: 'yyyy/mm/dd' },
    { value: 'Y.m.d', label: 'yyyy.mm.dd' },
];

const MARGIN_TYPE_OPTIONS = [
    { value: '0', label: 'Percentage' },
    { value: '1', label: 'Flat' },
];

const EMPTY_FORM = {
    site_title: '',
    company_name: '',
    vat_registration_number: '',
    timezone: '',
    without_stock: 'no',
    is_packing_slip: '0',
    currency: '',
    currency_position: 'prefix',
    show_products_details_in_purchase_table: '0',
    show_products_details_in_sales_table: '0',
    decimal: 2,
    staff_access: 'all',
    invoice_format: 'standard',
    state: '1',
    date_format: 'd-m-Y',
    expiry_alert_days: '',
    developed_by: '',
    margin_type: '0',
    default_margin_value: '',
    is_rtl: false,
    is_zatca: false,
    disable_signup: false,
    disable_forgot_password: false,
    maintenance_mode: false,
    maintenance_allowed_ips: '',
    font_css: '',
    auth_css: '',
    pos_css: '',
    custom_css: '',
};

const GeneralSettingManager = ({ controllerName }) => {
    const ctrl =
        controllerName === 'general-settings' || controllerName === 'setting'
            ? 'general_setting'
            : (controllerName || 'general_setting');
    const { canEdit } = usePermissions(ctrl);

    const [form, setForm] = useState(EMPTY_FORM);
    const [metadata, setMetadata] = useState({ currencies: [], timezones: [] });
    const [logoPreview, setLogoPreview] = useState(null);
    const [faviconPreview, setFaviconPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const logoRef = useRef(null);
    const faviconRef = useRef(null);

    const { toast, showToast } = useToast();

    const currencyOptions = useMemo(
        () => metadata.currencies.map((c) => ({ value: String(c.id), label: c.name })),
        [metadata.currencies]
    );

    const timezoneOptions = useMemo(
        () =>
            metadata.timezones.map((z) => ({
                value: z.zone,
                label: z.label || `${z.diff_from_GMT} - ${z.zone}`,
            })),
        [metadata.timezones]
    );

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('setting/general_setting');
            const data = res.data?.data ?? {};
            setForm({
                ...EMPTY_FORM,
                site_title: data.site_title || '',
                company_name: data.company_name || '',
                vat_registration_number: data.vat_registration_number || '',
                timezone: data.timezone || '',
                without_stock: data.without_stock || 'no',
                is_packing_slip: String(data.is_packing_slip ?? '0'),
                currency: data.currency ? String(data.currency) : '',
                currency_position: data.currency_position || 'prefix',
                show_products_details_in_purchase_table: String(
                    data.show_products_details_in_purchase_table ?? '0'
                ),
                show_products_details_in_sales_table: String(
                    data.show_products_details_in_sales_table ?? '0'
                ),
                decimal: data.decimal ?? 2,
                staff_access: data.staff_access || 'all',
                invoice_format: data.invoice_format || 'standard',
                state: String(data.state ?? '1'),
                date_format: data.date_format || 'd-m-Y',
                expiry_alert_days: data.expiry_alert_days ?? '',
                developed_by: data.developed_by || '',
                margin_type: String(data.margin_type ?? '0'),
                default_margin_value: data.default_margin_value ?? '',
                is_rtl: Boolean(data.is_rtl),
                is_zatca: Boolean(data.is_zatca),
                disable_signup: Boolean(data.disable_signup),
                disable_forgot_password: Boolean(data.disable_forgot_password),
                maintenance_mode: Boolean(data.maintenance_mode),
                maintenance_allowed_ips: data.maintenance_allowed_ips || '',
                font_css: data.font_css || '',
                auth_css: data.auth_css || '',
                pos_css: data.pos_css || '',
                custom_css: data.custom_css || '',
            });
            setLogoPreview(data.site_logo_url || null);
            setFaviconPreview(data.favicon_url || null);
            if (res.data?.metadata) {
                setMetadata(res.data.metadata);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load general settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setField = (name) => (e) => {
        const value =
            e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const validate = () => {
        const errors = {};
        if (!form.site_title?.trim()) errors.site_title = 'System title is required.';
        if (!form.currency) errors.currency = 'Currency is required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const buildFormData = () => {
        const fd = new FormData();
        const appendIfTruthy = (key, value) => {
            if (value !== null && value !== undefined && value !== '') {
                fd.append(key, value);
            }
        };

        appendIfTruthy('site_title', form.site_title.trim());
        appendIfTruthy('company_name', form.company_name?.trim() || '');
        appendIfTruthy('vat_registration_number', form.vat_registration_number?.trim() || '');
        appendIfTruthy('timezone', form.timezone);
        appendIfTruthy('without_stock', form.without_stock);
        appendIfTruthy('is_packing_slip', form.is_packing_slip);
        appendIfTruthy('currency', form.currency);
        appendIfTruthy('currency_position', form.currency_position);
        appendIfTruthy('show_products_details_in_purchase_table', form.show_products_details_in_purchase_table);
        appendIfTruthy('show_products_details_in_sales_table', form.show_products_details_in_sales_table);
        appendIfTruthy('decimal', String(form.decimal));
        appendIfTruthy('staff_access', form.staff_access);
        appendIfTruthy('invoice_format', form.invoice_format);
        appendIfTruthy('state', form.state);
        appendIfTruthy('date_format', form.date_format);
        appendIfTruthy('expiry_alert_days', form.expiry_alert_days === '' ? '0' : String(form.expiry_alert_days));
        appendIfTruthy('developed_by', form.developed_by?.trim() || '');
        appendIfTruthy('margin_type', form.margin_type);
        appendIfTruthy('default_margin_value', form.default_margin_value === '' ? '0' : String(form.default_margin_value));
        appendIfTruthy('font_css', form.font_css || '');
        appendIfTruthy('auth_css', form.auth_css || '');
        appendIfTruthy('pos_css', form.pos_css || '');
        appendIfTruthy('custom_css', form.custom_css || '');

        if (form.is_rtl) fd.append('is_rtl', '1');
        if (form.is_zatca) fd.append('is_zatca', '1');
        if (form.disable_signup) fd.append('disable_signup', '1');
        if (form.disable_forgot_password) fd.append('disable_forgot_password', '1');
        if (form.maintenance_mode && form.maintenance_allowed_ips?.trim()) {
            fd.append('maintenance_allowed_ips', form.maintenance_allowed_ips.trim());
        }

        const logoFile = logoRef.current?.files?.[0];
        const faviconFile = faviconRef.current?.files?.[0];
        if (logoFile) fd.append('site_logo', logoFile);
        if (faviconFile) fd.append('favicon', faviconFile);

        return fd;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit || !validate()) return;
        try {
            setSaving(true);
            const res = await api.post('setting/general_setting_store', buildFormData(), {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showToast(res.data?.message || 'Settings updated successfully.', 'success');
            if (res.data?.data) {
                setLogoPreview(res.data.data.site_logo_url || logoPreview);
                setFaviconPreview(res.data.data.favicon_url || faviconPreview);
            }
            if (logoRef.current) logoRef.current.value = '';
            if (faviconRef.current) faviconRef.current.value = '';
            await generalSettingStore.fetchSetting();
            fetchSettings();
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to save settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageLayout title="General Setting">
            <Toast toast={toast} />

            {loading ? (
                <p>Loading settings…</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <p className="ui-modal-hint" style={{ marginBottom: 16 }}>
                        Fields marked with * are required.
                    </p>

                    <FormSection label="System Information">
                        <FormRow cols={2}>
                            <FormField label="System Title" required error={formErrors.site_title}>
                                <TextInput
                                    value={form.site_title}
                                    onChange={setField('site_title')}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Company Name">
                                <TextInput
                                    value={form.company_name}
                                    onChange={setField('company_name')}
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="VAT Registration Number">
                                <TextInput
                                    value={form.vat_registration_number}
                                    onChange={setField('vat_registration_number')}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Time Zone">
                                <SelectInput
                                    value={form.timezone}
                                    onChange={setField('timezone')}
                                    options={timezoneOptions}
                                    placeholder="Select timezone…"
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="System Logo">
                                {logoPreview && (
                                    <img
                                        src={logoPreview}
                                        alt="Current logo"
                                        style={{ maxHeight: 48, marginBottom: 8, display: 'block' }}
                                    />
                                )}
                                <FileInput
                                    inputRef={logoRef}
                                    accept="image/png,image/jpeg,image/gif"
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Favicon">
                                {faviconPreview && (
                                    <img
                                        src={faviconPreview}
                                        alt="Current favicon"
                                        style={{ maxHeight: 32, marginBottom: 8, display: 'block' }}
                                    />
                                )}
                                <FileInput
                                    inputRef={faviconRef}
                                    accept="image/png,image/jpeg,image/gif"
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <CheckboxInput
                                label="RTL Layout"
                                checked={form.is_rtl}
                                onChange={setField('is_rtl')}
                            />
                            <CheckboxInput
                                label="ZATCA QrCode"
                                checked={form.is_zatca}
                                onChange={setField('is_zatca')}
                            />
                        </FormRow>
                    </FormSection>

                    <FormSection label="Business Settings">
                        <FormRow cols={2}>
                            <FormField label="Currency" required error={formErrors.currency}>
                                <SelectInput
                                    value={form.currency}
                                    onChange={setField('currency')}
                                    options={currencyOptions}
                                    placeholder="Select currency…"
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Currency Position">
                                <SelectInput
                                    value={form.currency_position}
                                    onChange={setField('currency_position')}
                                    options={CURRENCY_POSITION_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="Sale and Quotation without stock">
                                <SelectInput
                                    value={form.without_stock}
                                    onChange={setField('without_stock')}
                                    options={WITHOUT_STOCK_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Packing Slip">
                                <SelectInput
                                    value={form.is_packing_slip}
                                    onChange={setField('is_packing_slip')}
                                    options={PACKING_SLIP_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="Products details in Purchase List">
                                <SelectInput
                                    value={form.show_products_details_in_purchase_table}
                                    onChange={setField('show_products_details_in_purchase_table')}
                                    options={SHOW_HIDE_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Products details in Sales List">
                                <SelectInput
                                    value={form.show_products_details_in_sales_table}
                                    onChange={setField('show_products_details_in_sales_table')}
                                    options={SHOW_HIDE_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="Digits after decimal point">
                                <NumberInput
                                    value={form.decimal}
                                    onChange={setField('decimal')}
                                    min={0}
                                    max={6}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Staff Access">
                                <SelectInput
                                    value={form.staff_access}
                                    onChange={setField('staff_access')}
                                    options={STAFF_ACCESS_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="Invoice Format">
                                <SelectInput
                                    value={form.invoice_format}
                                    onChange={setField('invoice_format')}
                                    options={INVOICE_FORMAT_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            {form.invoice_format === 'gst' && (
                                <FormField label="State">
                                    <SelectInput
                                        value={form.state}
                                        onChange={setField('state')}
                                        options={STATE_OPTIONS}
                                        disabled={!canEdit}
                                    />
                                </FormField>
                            )}
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="Date Format">
                                <SelectInput
                                    value={form.date_format}
                                    onChange={setField('date_format')}
                                    options={DATE_FORMAT_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Expiry alert days before">
                                <NumberInput
                                    value={form.expiry_alert_days}
                                    onChange={setField('expiry_alert_days')}
                                    min={0}
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormRow cols={2}>
                            <FormField label="Developed By">
                                <TextInput
                                    value={form.developed_by}
                                    onChange={setField('developed_by')}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Profit margin type">
                                <SelectInput
                                    value={form.margin_type}
                                    onChange={setField('margin_type')}
                                    options={MARGIN_TYPE_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </FormField>
                        </FormRow>
                        <FormField label="Default profit margin value">
                            <NumberInput
                                value={form.default_margin_value}
                                onChange={setField('default_margin_value')}
                                step="any"
                                disabled={!canEdit}
                            />
                        </FormField>
                    </FormSection>

                    <FormSection label="Access & Maintenance">
                        <FormRow cols={2}>
                            <CheckboxInput
                                label="Disable registration"
                                checked={form.disable_signup}
                                onChange={setField('disable_signup')}
                            />
                            <CheckboxInput
                                label="Disable password reset"
                                checked={form.disable_forgot_password}
                                onChange={setField('disable_forgot_password')}
                            />
                        </FormRow>
                        <FormRow cols={2}>
                            <CheckboxInput
                                label="Maintenance mode"
                                checked={form.maintenance_mode}
                                onChange={setField('maintenance_mode')}
                            />
                            {form.maintenance_mode && (
                                <FormField label="Maintenance allowed IPs">
                                    <TextInput
                                        value={form.maintenance_allowed_ips}
                                        onChange={setField('maintenance_allowed_ips')}
                                        placeholder="127.0.0.1, 192.168.1.1"
                                        disabled={!canEdit}
                                    />
                                </FormField>
                            )}
                        </FormRow>
                    </FormSection>

                    <FormSection label="Custom CSS">
                        <FormField label="Font CSS">
                            <TextareaInput
                                rows={3}
                                value={form.font_css}
                                onChange={setField('font_css')}
                                disabled={!canEdit}
                            />
                        </FormField>
                        <FormField label="CSS for auth pages">
                            <TextareaInput
                                rows={3}
                                value={form.auth_css}
                                onChange={setField('auth_css')}
                                disabled={!canEdit}
                            />
                        </FormField>
                        <FormField label="POS page CSS">
                            <TextareaInput
                                rows={3}
                                value={form.pos_css}
                                onChange={setField('pos_css')}
                                disabled={!canEdit}
                            />
                        </FormField>
                        <FormField label="Custom CSS / Styles">
                            <TextareaInput
                                rows={3}
                                value={form.custom_css}
                                onChange={setField('custom_css')}
                                disabled={!canEdit}
                            />
                        </FormField>
                    </FormSection>

                    {canEdit && (
                        <div style={{ marginTop: 20 }}>
                            <button type="submit" className="ui-btn primary" disabled={saving}>
                                {saving ? 'Saving…' : 'Submit'}
                            </button>
                        </div>
                    )}
                </form>
            )}
        </PageLayout>
    );
};

export default GeneralSettingManager;
