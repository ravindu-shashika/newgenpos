import React, { useState, useEffect, useRef } from 'react';
import { faTimes, faPlus, faCheck, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SystemButton, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Invoice Settings';

const SIZE_OPTIONS = [
  { value: 'a4', label: 'A4' },
  { value: '58mm', label: '58mm (Thermal receipt)' },
  { value: '80mm', label: '80mm (Thermal receipt)' },
];

const NUMBERING_OPTIONS = [
  { value: 'sequential', label: 'Sequential' },
  { value: 'random', label: 'Random' },
  { value: 'datewise', label: 'Date Wise' },
];

const DATE_FORMAT_OPTIONS = [
  'd.m.y h:m A',
  'm.d.y h:m A',
  'y.m.d h:m A',
  'd-m-y h:m A',
  'y-m-d h:m A',
  'd/m/y h:m A',
];

const CHECKBOX_FIELDS = [
  { key: 'show_barcode', label: 'Show Barcode' },
  { key: 'show_qr_code', label: 'Show QR Code' },
  { key: 'show_description', label: 'Show Description [58mm, 80mm]' },
  { key: 'show_in_words', label: 'Show Amount In Words' },
  { key: 'active_primary_color', label: 'Active Primary Color' },
  { key: 'show_warehouse_info', label: 'Show Warehouse Info' },
  { key: 'show_bill_to_info', label: 'Show Bill To Info' },
  { key: 'show_biller_info', label: 'Served By' },
  { key: 'show_paid_info', label: 'Show Paid Info' },
  { key: 'show_footer_text', label: 'Show Footer Text' },
  { key: 'show_payment_note', label: 'Show Payment Note' },
  { key: 'show_ref_number', label: 'Show Reference No' },
  { key: 'active_date_format', label: 'Active Date Format' },
  { key: 'active_generat_settings', label: 'Auto Generate Numbering Type' },
  { key: 'active_logo_height_width', label: 'Active Logo Height Width' },
  { key: 'hide_total_due', label: 'Hide Total Due' },
  { key: 'show_vat_registration_number', label: 'Show Vat Registration Number' },
  { key: 'show_sale_note', label: 'Show Sale Note' },
];

const defaultShowColumn = Object.fromEntries(CHECKBOX_FIELDS.map((c) => [c.key, false]));

const defaultForm = {
  size: 'a4',
  template_name: '',
  prefix: '',
  numbering_type: 'sequential',
  number_of_digit: '6',
  start_number: '1',
  header_text: '',
  footer_text: '',
  logo_height: '80',
  logo_width: '120',
  primary_color: '#0036B3',
  invoice_date_format: 'd.m.y h:m A',
  is_default: false,
  show_column: { ...defaultShowColumn },
};

const basePath = (process.env.REACT_APP_DEFAULT_PATH || 'http://127.0.0.1:8000').replace(/\/$/, '');

const InvoiceSetting = () => {
  const [entities, setEntities] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [showModal, setShowModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const isSequential = form.numbering_type === 'sequential';
  const isRandom = form.numbering_type === 'random';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('invoice-settings');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(
          data.data.map((row) => ({
            id: row.id,
            template_name: row.template_name,
            size: row.size || 'a4',
            is_default: !!row.is_default,
            default_badge: row.is_default ? 'Default' : '—',
          }))
        );
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load invoice settings');
    } finally {
      setIsLoading(false);
    }
  };

  const openNew = () => {
    setForm({
      ...defaultForm,
      show_column: { ...defaultShowColumn },
    });
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
    setShowModal(true);
  };

  const hideDialog = () => {
    setShowModal(false);
    setForm(defaultForm);
    setLogoFile(null);
    setLogoPreview(null);
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
  };

  const editRow = (row) => {
    api
      .get('invoice-settings')
      .then((res) => {
        const list = res?.data?.data || [];
        const found = list.find((r) => r.id === row.id);
        if (!found) {
          msg.error('Invoice setting not found');
          return;
        }
        const showColumn =
          typeof found.show_column === 'string'
            ? JSON.parse(found.show_column || '{}')
            : found.show_column || {};
        setForm({
          size: found.size || 'a4',
          template_name: found.template_name || '',
          prefix: found.prefix || '',
          numbering_type: found.numbering_type || 'sequential',
          number_of_digit: String(found.number_of_digit ?? 6),
          start_number: String(found.start_number ?? '1'),
          header_text: found.header_text || '',
          footer_text: found.footer_text || '',
          logo_height: String(found.logo_height ?? 80),
          logo_width: String(found.logo_width ?? 120),
          primary_color: found.primary_color || '#0036B3',
          invoice_date_format: found.invoice_date_format || 'd.m.y h:m A',
          is_default: !!found.is_default,
          show_column: { ...defaultShowColumn, ...showColumn },
        });
        setLogoPreview(
          found.company_logo ? `${basePath}/invoices/${found.company_logo}` : null
        );
        setLogoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedId(row.id);
        setIsEdit(true);
        setSubmitted(false);
        setShowModal(true);
      })
      .catch(() => msg.error('Failed to load invoice setting'));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('show_column.')) {
      const key = name.replace('show_column.', '');
      setForm((prev) => ({
        ...prev,
        show_column: { ...prev.show_column, [key]: checked },
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const setAllCheckboxes = (checked) => {
    setForm((prev) => {
      const next = { ...defaultShowColumn };
      Object.keys(next).forEach((k) => (next[k] = checked));
      return { ...prev, show_column: next };
    });
  };

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result);
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const buildFormData = () => {
    const fd = new FormData();
    if (isEdit && selectedId) fd.append('id', selectedId);
    fd.append('template_name', form.template_name.trim());
    fd.append('prefix', form.prefix.trim());
    fd.append('size', form.size);
    fd.append('numbering_type', form.numbering_type);
    fd.append('number_of_digit', form.number_of_digit || '6');
    fd.append('start_number', form.start_number || '1');
    fd.append('header_text', form.header_text);
    fd.append('footer_text', form.footer_text);
    fd.append('logo_height', form.logo_height || '80');
    fd.append('logo_width', form.logo_width || '120');
    fd.append('primary_color', form.primary_color);
    fd.append('invoice_date_format', form.invoice_date_format);
    fd.append('is_default', form.is_default ? '1' : '0');
    if (logoFile) fd.append('company_logo', logoFile);
    CHECKBOX_FIELDS.forEach(({ key }) => {
      if (form.show_column[key]) fd.append(`show_column[${key}]`, '1');
    });
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.template_name?.trim()) {
      msg.error('Template name is required');
      return;
    }
    if (!form.prefix?.trim()) {
      msg.error('Prefix is required');
      return;
    }
    if (form.prefix.length < 2 || form.prefix.length > 10) {
      msg.error('Prefix must be 2–10 characters');
      return;
    }
    if (isRandom) {
      const digit = parseInt(form.number_of_digit, 10);
      if (digit < 6 || digit > 12) {
        msg.error('Number of digit must be 6–12 for random');
        return;
      }
    }
    if (isSequential && (form.start_number === '' || parseInt(form.start_number, 10) < 0)) {
      msg.error('Start number is required for sequential');
      return;
    }

    const formData = buildFormData();
    try {
      const res = await api.postFormData('save-invoice-setting').values(formData);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Invoice setting saved');
        hideDialog();
        fetchData();
      } else {
        const errMsg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(' ') : 'Save failed');
        msg.error(errMsg);
      }
    } catch (err) {
      const d = err?.response?.data;
      const errMsg = d?.message || (d?.errors ? Object.values(d.errors).flat().join(' ') : 'Failed to save');
      msg.error(errMsg);
    }
  };

  const setDefault = async (row) => {
    try {
      const res = await api.get(`set-default-invoice-setting/${row.id}`);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Default updated');
        fetchData();
      } else {
        msg.error(data?.message || 'Failed to set default');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to set default');
    }
  };

  const confirmDelete = (row) => {
    setItemToDelete(row);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete?.id) {
      setDeleteDialog(false);
      setItemToDelete(null);
      return;
    }
    try {
      const res = await api.get(`delete-invoice-setting/${itemToDelete.id}`);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Deleted');
      } else {
        msg.error(data?.message || 'Default invoice cannot be deleted. Set another as default first.');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton type="add-new" method={openNew} showText btnText="Add Invoice Setting" />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Edit Invoice Setting' : 'Add Invoice Setting'}
        modalState={showModal}
        toggleFormModal={hideDialog}
        width="90%"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body text-left" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <p className="small text-muted">Fields marked with * are required.</p>

            <div className="row">
              <div className="col-md-4 form-group">
                <label>Invoice Type</label>
                <select
                  name="size"
                  className="form-control"
                  value={form.size}
                  onChange={handleChange}
                  disabled={isEdit}
                >
                  {SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Template Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="template_name"
                  className={`form-control ${submitted && !form.template_name?.trim() ? 'is-invalid' : ''}`}
                  value={form.template_name}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Prefix <span className="text-danger">*</span> (2–10 chars)</label>
                <input
                  type="text"
                  name="prefix"
                  className={`form-control ${submitted && !form.prefix?.trim() ? 'is-invalid' : ''}`}
                  value={form.prefix}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={10}
                />
              </div>

              <div className="col-md-4 form-group">
                <label>Numbering Type <span className="text-danger">*</span></label>
                <select name="numbering_type" className="form-control" value={form.numbering_type} onChange={handleChange}>
                  {NUMBERING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {isRandom && (
                <div className="col-md-4 form-group">
                  <label>Number Of Digit (6–12) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="number_of_digit"
                    className="form-control"
                    min={6}
                    max={12}
                    value={form.number_of_digit}
                    onChange={handleChange}
                  />
                </div>
              )}
              {isSequential && (
                <div className="col-md-4 form-group">
                  <label>Start Number <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="start_number"
                    className="form-control"
                    min={0}
                    value={form.start_number}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="col-md-4 form-group">
                <label>Header Text</label>
                <input
                  type="text"
                  name="header_text"
                  className="form-control"
                  value={form.header_text}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Footer Text</label>
                <input
                  type="text"
                  name="footer_text"
                  className="form-control"
                  value={form.footer_text}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Company Logo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={onLogoChange}
                />
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" style={{ height: 50, marginTop: 8 }} className="d-block" />
                )}
              </div>
              <div className="col-md-4 form-group">
                <label>Logo Height</label>
                <input
                  type="number"
                  name="logo_height"
                  className="form-control"
                  value={form.logo_height}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Logo Width</label>
                <input
                  type="number"
                  name="logo_width"
                  className="form-control"
                  value={form.logo_width}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Primary Color</label>
                <input
                  type="color"
                  name="primary_color"
                  className="form-control p-1"
                  style={{ height: 38 }}
                  value={form.primary_color}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Invoice Date Format</label>
                <select
                  name="invoice_date_format"
                  className="form-control"
                  value={form.invoice_date_format}
                  onChange={handleChange}
                >
                  {DATE_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mt-2">
              <div className="col-md-4 form-check">
                <input
                  type="checkbox"
                  name="is_default"
                  id="is_default"
                  className="form-check-input"
                  checked={form.is_default}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="is_default">Default</label>
              </div>
            </div>

            <hr />
            <div className="row">
              <div className="col-12 mb-2">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    onChange={(e) => setAllCheckboxes(e.target.checked)}
                  />
                  {' '}Select All
                </label>
              </div>
              {CHECKBOX_FIELDS.map(({ key, label }) => (
                <div key={key} className="col-md-4 mb-2">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      name={`show_column.${key}`}
                      id={`sc_${key}`}
                      className="form-check-input"
                      checked={!!form.show_column[key]}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor={`sc_${key}`}>{label}</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideDialog}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" />
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <SafeFontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-2" size="sm" />
              {isEdit ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </FormModal>

      {deleteDialog && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm delete</h5>
                <button type="button" className="close" onClick={() => setDeleteDialog(false)} aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p className="text-danger font-weight-bold">Default invoice cannot be deleted.</p>
                <p>Delete invoice setting <strong>"{itemToDelete?.template_name}"</strong>?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteDialog(false)}>
                  <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <br />
      <div className="table-responsive">
        <table className="table table-bordered table-sm">
          <thead className="table-secondary">
            <tr>
              <th>Template Name</th>
              <th>Size</th>
              <th className="text-center">Default</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center">
                  <span className="spinner-border spinner-border-sm text-primary" />
                </td>
              </tr>
            ) : (
              entities.map((row) => (
                <tr key={row.id}>
                  <td>{row.template_name}</td>
                  <td>{row.size}</td>
                  <td className="text-center align-middle">
                    {row.is_default ? (
                      <span className="badge bg-success">Default</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setDefault(row)}
                      >
                        Set Default
                      </button>
                    )}
                  </td>
                  <td className="text-center align-middle">
                    <button
                      type="button"
                      className="btn btn-sm btn-warning mr-1"
                      onClick={() => editRow(row)}
                    >
                      <SafeFontAwesomeIcon icon={faEdit} size="xs" /> Update
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => confirmDelete(row)}
                    >
                      <SafeFontAwesomeIcon icon={faTrash} size="xs" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceSetting;
