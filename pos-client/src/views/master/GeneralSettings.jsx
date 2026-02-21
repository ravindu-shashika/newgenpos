import React, { useState, useEffect } from 'react';
import { api, msg } from '../../services';

const moduleName = 'General Setting';

const DATE_FORMATS = [
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

const STAFF_ACCESS_OPTIONS = [
  { value: 'all', label: 'All Records' },
  { value: 'own', label: 'Own Records' },
  { value: 'warehouse', label: 'Warehouse Wise' },
];

const defaultForm = {
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
  decimal: '2',
  staff_access: 'all',
  invoice_format: 'standard',
  state: '1',
  date_format: 'd-m-Y',
  expiry_alert_days: '30',
  developed_by: '',
  margin_type: '0',
  default_margin_value: '0',
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

const GeneralSettings = () => {
  const [form, setForm] = useState(defaultForm);
  const [currencies, setCurrencies] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [siteLogoFile, setSiteLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [logoError, setLogoError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('settings/general');
      const data = res?.data;
      if (data?.status === 200) {
        setCurrencies(data.currencies || []);
        setZones(data.zones || []);
        const s = data.data;
        if (s) {
          setForm({
            site_title: s.site_title ?? '',
            company_name: s.company_name ?? '',
            vat_registration_number: s.vat_registration_number ?? '',
            timezone: s.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
            without_stock: s.without_stock === 'yes' ? 'yes' : 'no',
            is_packing_slip: s.is_packing_slip ? '1' : '0',
            currency: s.currency != null ? String(s.currency) : '',
            currency_position: s.currency_position === 'suffix' ? 'suffix' : 'prefix',
            show_products_details_in_purchase_table: s.show_products_details_in_purchase_table ? '1' : '0',
            show_products_details_in_sales_table: s.show_products_details_in_sales_table ? '1' : '0',
            decimal: s.decimal != null ? String(s.decimal) : '2',
            staff_access: s.staff_access ?? 'all',
            invoice_format: s.invoice_format ?? 'standard',
            state: s.state != null ? String(s.state) : '1',
            date_format: s.date_format ?? 'd-m-Y',
            expiry_alert_days: s.expiry_alert_days != null ? String(s.expiry_alert_days) : '30',
            developed_by: s.developed_by ?? '',
            margin_type: s.margin_type != null ? String(s.margin_type) : '0',
            default_margin_value: s.default_margin_value != null ? String(s.default_margin_value) : '0',
            is_rtl: !!s.is_rtl,
            is_zatca: !!s.is_zatca,
            disable_signup: !!s.disable_signup,
            disable_forgot_password: !!s.disable_forgot_password,
            maintenance_mode: !!s.maintenance_allowed_ips,
            maintenance_allowed_ips: s.maintenance_allowed_ips ?? '',
            font_css: s.font_css ?? '',
            auth_css: s.auth_css ?? '',
            pos_css: s.pos_css ?? '',
            custom_css: s.custom_css ?? '',
          });
        }
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load general settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onSiteLogoChange = (e) => {
    const file = e.target.files?.[0];
    setLogoError('');
    if (!file) {
      setSiteLogoFile(null);
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setLogoError('Only JPG, PNG, or GIF images are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('File size must be less than 5 MB.');
      e.target.value = '';
      return;
    }
    setSiteLogoFile(file);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('site_title', form.site_title.trim());
    if (form.company_name !== undefined) fd.append('company_name', form.company_name);
    if (form.vat_registration_number !== undefined) fd.append('vat_registration_number', form.vat_registration_number);
    fd.append('timezone', form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    fd.append('without_stock', form.without_stock);
    fd.append('is_packing_slip', form.is_packing_slip);
    fd.append('currency', form.currency);
    fd.append('currency_position', form.currency_position);
    fd.append('show_products_details_in_purchase_table', form.show_products_details_in_purchase_table);
    fd.append('show_products_details_in_sales_table', form.show_products_details_in_sales_table);
    fd.append('decimal', form.decimal);
    fd.append('staff_access', form.staff_access);
    fd.append('invoice_format', form.invoice_format);
    fd.append('state', form.state);
    fd.append('date_format', form.date_format);
    fd.append('expiry_alert_days', form.expiry_alert_days);
    fd.append('developed_by', form.developed_by);
    fd.append('margin_type', form.margin_type);
    fd.append('default_margin_value', form.default_margin_value);
    if (form.is_rtl) fd.append('is_rtl', '1');
    if (form.is_zatca) fd.append('is_zatca', '1');
    if (form.disable_signup) fd.append('disable_signup', '1');
    if (form.disable_forgot_password) fd.append('disable_forgot_password', '1');
    fd.append('maintenance_allowed_ips', form.maintenance_mode ? (form.maintenance_allowed_ips || '') : '');
    fd.append('font_css', form.font_css ?? '');
    fd.append('auth_css', form.auth_css ?? '');
    fd.append('pos_css', form.pos_css ?? '');
    fd.append('custom_css', form.custom_css ?? '');
    if (siteLogoFile) fd.append('site_logo', siteLogoFile);
    if (faviconFile) fd.append('favicon', faviconFile);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.site_title?.trim()) {
      msg.error('System Title is required');
      return;
    }
    if (!form.currency) {
      msg.error('Currency is required');
      return;
    }
    if (logoError) {
      msg.error(logoError);
      return;
    }
    setSubmitting(true);
    try {
      const formData = buildFormData();
      const res = await api.postFormData('settings/general').values(formData);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'General setting saved');
        setSiteLogoFile(null);
        setFaviconFile(null);
        fetchData();
      } else {
        msg.error(data?.message || 'Save failed');
      }
    } catch (err) {
      const d = err?.response?.data;
      msg.error(d?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <section className="forms">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center">
                  <h4>General Setting</h4>
                </div>
                <div className="card-body">
                  <p className="italic">
                    <small>The field labels marked with * are required input fields.</small>
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>System Title <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            name="site_title"
                            className="form-control"
                            value={form.site_title}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>System Logo (jpg, jpeg, png &amp; gif)</label>
                          <input
                            type="file"
                            name="site_logo"
                            className="form-control"
                            accept="image/png,image/jpeg,image/gif"
                            onChange={onSiteLogoChange}
                          />
                          {logoError && <span className="text-danger small">{logoError}</span>}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Favicon (jpg, jpeg, png &amp; gif)</label>
                          <input
                            type="file"
                            name="favicon"
                            className="form-control"
                            accept="image/png,image/jpeg,image/gif"
                            onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4 mt-4">
                        <div className="form-group">
                          <input
                            type="checkbox"
                            name="is_rtl"
                            checked={form.is_rtl}
                            onChange={handleChange}
                          />
                          &nbsp;<label>RTL Layout</label>
                        </div>
                      </div>
                      <div className="col-md-4 mt-4">
                        <div className="form-group">
                          <input
                            type="checkbox"
                            name="is_zatca"
                            checked={form.is_zatca}
                            onChange={handleChange}
                          />
                          &nbsp;<label>ZATCA QrCode</label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Company Name</label>
                          <input
                            type="text"
                            name="company_name"
                            className="form-control"
                            value={form.company_name}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>VAT Registration Number</label>
                          <input
                            type="text"
                            name="vat_registration_number"
                            className="form-control"
                            value={form.vat_registration_number}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Time Zone</label>
                          <select name="timezone" className="form-control" value={form.timezone} onChange={handleChange}>
                            <option value="">Select TimeZone...</option>
                            {zones.map((z) => (
                              <option key={z.zone} value={z.zone}>
                                {z.diff_from_GMT} - {z.zone}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Sale and Quotation without stock *</label>
                          <br />
                          <label className="radio-inline mr-3">
                            <input
                              type="radio"
                              name="without_stock"
                              value="yes"
                              checked={form.without_stock === 'yes'}
                              onChange={handleChange}
                            /> Yes
                          </label>
                          <label className="radio-inline">
                            <input
                              type="radio"
                              name="without_stock"
                              value="no"
                              checked={form.without_stock === 'no'}
                              onChange={handleChange}
                            /> No
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Packing Slip to manage orders/sales *</label>
                          <br />
                          <label className="radio-inline mr-3">
                            <input
                              type="radio"
                              name="is_packing_slip"
                              value="1"
                              checked={form.is_packing_slip === '1'}
                              onChange={handleChange}
                            /> Enable
                          </label>
                          <label className="radio-inline">
                            <input
                              type="radio"
                              name="is_packing_slip"
                              value="0"
                              checked={form.is_packing_slip === '0'}
                              onChange={handleChange}
                            /> Disable
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Currency <span className="text-danger">*</span></label>
                          <select name="currency" className="form-control" value={form.currency} onChange={handleChange} required>
                            <option value="">Select...</option>
                            {currencies.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Currency Position *</label>
                          <br />
                          <label className="radio-inline mr-3">
                            <input
                              type="radio"
                              name="currency_position"
                              value="prefix"
                              checked={form.currency_position === 'prefix'}
                              onChange={handleChange}
                            /> Prefix
                          </label>
                          <label className="radio-inline">
                            <input
                              type="radio"
                              name="currency_position"
                              value="suffix"
                              checked={form.currency_position === 'suffix'}
                              onChange={handleChange}
                            /> Suffix
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Show Products Details in Purchase List *</label>
                          <br />
                          <label className="radio-inline mr-3">
                            <input
                              type="radio"
                              name="show_products_details_in_purchase_table"
                              value="1"
                              checked={form.show_products_details_in_purchase_table === '1'}
                              onChange={handleChange}
                            /> Show
                          </label>
                          <label className="radio-inline">
                            <input
                              type="radio"
                              name="show_products_details_in_purchase_table"
                              value="0"
                              checked={form.show_products_details_in_purchase_table === '0'}
                              onChange={handleChange}
                            /> Hide
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Show Products Details in Sales List *</label>
                          <br />
                          <label className="radio-inline mr-3">
                            <input
                              type="radio"
                              name="show_products_details_in_sales_table"
                              value="1"
                              checked={form.show_products_details_in_sales_table === '1'}
                              onChange={handleChange}
                            /> Show
                          </label>
                          <label className="radio-inline">
                            <input
                              type="radio"
                              name="show_products_details_in_sales_table"
                              value="0"
                              checked={form.show_products_details_in_sales_table === '0'}
                              onChange={handleChange}
                            /> Hide
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Digits after decimal point *</label>
                          <input
                            type="number"
                            name="decimal"
                            className="form-control"
                            min={0}
                            max={6}
                            value={form.decimal}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Staff Access *</label>
                          <select name="staff_access" className="form-control" value={form.staff_access} onChange={handleChange}>
                            {STAFF_ACCESS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Invoice Format *</label>
                          <select name="invoice_format" className="form-control" value={form.invoice_format} onChange={handleChange} required>
                            <option value="standard">Standard</option>
                            <option value="gst">Indian GST</option>
                          </select>
                        </div>
                      </div>
                      {form.invoice_format === 'gst' && (
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>State *</label>
                            <select name="state" className="form-control" value={form.state} onChange={handleChange}>
                              <option value="1">Home State</option>
                              <option value="2">Buyer State</option>
                            </select>
                          </div>
                        </div>
                      )}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Date Format *</label>
                          <select name="date_format" className="form-control" value={form.date_format} onChange={handleChange}>
                            {DATE_FORMATS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Show expiry alerts before (days)</label>
                          <input
                            type="number"
                            name="expiry_alert_days"
                            className="form-control"
                            value={form.expiry_alert_days}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Developed By</label>
                          <input
                            type="text"
                            name="developed_by"
                            className="form-control"
                            value={form.developed_by}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Profit margin type</label>
                          <select name="margin_type" className="form-control" value={form.margin_type} onChange={handleChange}>
                            <option value="0">percentage</option>
                            <option value="1">flat</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Default Profit Margin Value</label>
                          <input
                            type="number"
                            name="default_margin_value"
                            className="form-control"
                            value={form.default_margin_value}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4 mt-4">
                        <div className="form-group mt-2">
                          <input
                            type="checkbox"
                            name="disable_signup"
                            checked={form.disable_signup}
                            onChange={handleChange}
                          />
                          &nbsp;<label>Disable registration</label>
                        </div>
                      </div>
                      <div className="col-md-4 mt-4">
                        <div className="form-group mt-2">
                          <input
                            type="checkbox"
                            name="disable_forgot_password"
                            checked={form.disable_forgot_password}
                            onChange={handleChange}
                          />
                          &nbsp;<label>Disable password reset</label>
                        </div>
                      </div>
                      <div className="col-md-4 mt-4">
                        <div className="form-group mt-2">
                          <input
                            type="checkbox"
                            checked={form.maintenance_mode}
                            onChange={(e) => setForm((p) => ({ ...p, maintenance_mode: e.target.checked }))}
                          />
                          &nbsp;<label>Maintenance mode</label>
                        </div>
                      </div>
                      {form.maintenance_mode && (
                        <div className="col-md-4 mt-4">
                          <div className="form-group mt-2">
                            <label>Maintenance allowed IPs</label>
                            <input
                              type="text"
                              name="maintenance_allowed_ips"
                              className="form-control"
                              value={form.maintenance_allowed_ips}
                              onChange={handleChange}
                              placeholder="127.0.0.1, 127.0.0.2"
                            />
                          </div>
                        </div>
                      )}
                      <div className="col-md-12 mt-2">
                        <div className="form-group">
                          <label>Font CSS</label>
                          <textarea name="font_css" className="form-control" rows={4} value={form.font_css} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-md-12 mt-2">
                        <div className="form-group">
                          <label>CSS for auth pages (login/registration/forgot password/verification)</label>
                          <textarea name="auth_css" className="form-control" rows={4} value={form.auth_css} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-md-12 mt-2">
                        <div className="form-group">
                          <label>POS page CSS</label>
                          <textarea name="pos_css" className="form-control" rows={4} value={form.pos_css} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-md-12 mt-2">
                        <div className="form-group">
                          <label>Custom CSS/Styles</label>
                          <textarea name="custom_css" className="form-control" rows={4} value={form.custom_css} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                    <div className="form-group mt-3">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Submit'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GeneralSettings;
