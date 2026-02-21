import React, { useState, useEffect } from 'react';
import { api, msg } from '../../services';

const moduleName = 'POS Setting';

const FIXED_PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'credit', label: 'Credit Sale' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'gift_card', label: 'Gift Card' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'points', label: 'Points' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'pesapal', label: 'Pesapal' },
  { value: 'installment', label: 'Installment' },
];

const defaultForm = {
  customer_id: '',
  biller_id: '',
  warehouse_id: '',
  product_number: '16',
  keybord_active: false,
  is_table: false,
  send_sms: false,
  cash_register: false,
  show_print_invoice: false,
};

const PosSetting = () => {
  const [form, setForm] = useState(defaultForm);
  const [customers, setCustomers] = useState([]);
  const [billers, setBillers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [customOptions, setCustomOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('settings/pos');
      const data = res?.data;
      if (data?.status === 200) {
        setCustomers(data.customers || []);
        setBillers(data.billers || []);
        setWarehouses(data.warehouses || []);
        const opts = data.options || [];
        const fixedValues = FIXED_PAYMENT_OPTIONS.map((o) => o.value);
        const selected = fixedValues.filter((v) => opts.includes(v));
        const custom = opts.filter((v) => v && !fixedValues.includes(v));
        setSelectedOptions(selected);
        setCustomOptions(custom.length ? custom : ['']);
        const s = data.data;
        if (s) {
          setForm({
            customer_id: s.customer_id != null ? String(s.customer_id) : '',
            biller_id: s.biller_id != null ? String(s.biller_id) : '',
            warehouse_id: s.warehouse_id != null ? String(s.warehouse_id) : '',
            product_number: s.product_number != null ? String(s.product_number) : '16',
            keybord_active: !!s.keybord_active,
            is_table: !!s.is_table,
            send_sms: !!s.send_sms,
            cash_register: !!s.cash_register,
            show_print_invoice: !!s.show_print_invoice,
          });
        }
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load POS setting');
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

  const toggleOption = (value) => {
    setSelectedOptions((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const addCustomOption = () => {
    setCustomOptions((prev) => [...prev, '']);
  };

  const updateCustomOption = (index, val) => {
    setCustomOptions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const removeCustomOption = (index) => {
    setCustomOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) {
      msg.error('Default Customer is required');
      return;
    }
    if (!form.biller_id) {
      msg.error('Default Biller is required');
      return;
    }
    if (!form.warehouse_id) {
      msg.error('Default Warehouse is required');
      return;
    }
    if (!form.product_number || parseInt(form.product_number, 10) < 1) {
      msg.error('Displayed Number of Product Row is required');
      return;
    }
    const customFiltered = customOptions.map((s) => s.trim()).filter(Boolean);
    const allOptions = [...selectedOptions, ...customFiltered];
    if (allOptions.length !== new Set(allOptions).size) {
      msg.error('Payment options must be unique');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer_id: form.customer_id,
        biller_id: form.biller_id,
        warehouse_id: form.warehouse_id,
        product_number: parseInt(form.product_number, 10) || 16,
        keybord_active: form.keybord_active ? 1 : 0,
        is_table: form.is_table ? 1 : 0,
        send_sms: form.send_sms ? 1 : 0,
        cash_register: form.cash_register ? 1 : 0,
        show_print_invoice: form.show_print_invoice ? 1 : 0,
        options: allOptions.length ? allOptions : ['cash', 'card', 'credit'],
      };
      const res = await api.post('settings/pos').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'POS setting saved');
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
                  <h4>POS Setting</h4>
                </div>
                <div className="card-body">
                  <p className="italic">
                    <small>The field labels marked with * are required input fields.</small>
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Default Customer <span className="text-danger">*</span></label>
                          <select
                            name="customer_id"
                            className="form-control"
                            value={form.customer_id}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select customer...</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.phone_number})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Default Biller <span className="text-danger">*</span></label>
                          <select
                            name="biller_id"
                            className="form-control"
                            value={form.biller_id}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Biller...</option>
                            {billers.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} ({b.company_name})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Default Warehouse <span className="text-danger">*</span></label>
                          <select
                            name="warehouse_id"
                            className="form-control"
                            value={form.warehouse_id}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select warehouse...</option>
                            {warehouses.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Displayed Number of Product Row <span className="text-danger">*</span></label>
                          <input
                            type="number"
                            name="product_number"
                            className="form-control"
                            value={form.product_number}
                            onChange={handleChange}
                            required
                            min={1}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-3 mt-2 mb-2">
                        <input
                          type="checkbox"
                          name="keybord_active"
                          className="mt-2"
                          checked={form.keybord_active}
                          onChange={handleChange}
                        />
                        <label className="mt-2 ml-1">Touchscreen keybord</label>
                      </div>
                      <div className="col-md-3 mt-2 mb-2">
                        <input
                          type="checkbox"
                          name="is_table"
                          className="mt-2"
                          checked={form.is_table}
                          onChange={handleChange}
                        />
                        <label className="mt-2 ml-1">Table Management</label>
                      </div>
                      <div className="col-md-3 mt-2 mb-2">
                        <input
                          type="checkbox"
                          name="send_sms"
                          className="mt-2"
                          checked={form.send_sms}
                          onChange={handleChange}
                        />
                        <label className="mt-2 ml-1" title="You'll have to set up SMS gateway settings for sending SMS (settings > SMS settings)">
                          Send SMS After Sale
                        </label>
                      </div>
                      <div className="col-md-3 mt-2 mb-2">
                        <input
                          type="checkbox"
                          name="cash_register"
                          className="mt-2"
                          checked={form.cash_register}
                          onChange={handleChange}
                        />
                        <label className="mt-2 ml-1" title="If enabled, cash register will be activated on POS page">
                          Cash Register
                        </label>
                      </div>
                      <div className="col-md-3 mt-2 mb-2">
                        <input
                          type="checkbox"
                          name="show_print_invoice"
                          className="mt-2"
                          checked={form.show_print_invoice}
                          onChange={handleChange}
                        />
                        <label className="mt-2 ml-1" title="If unchecked invoice will not print after sales">
                          Print invoice
                        </label>
                      </div>
                    </div>

                    <hr />

                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <h4 title="Selected payment gateways will show on pos page">Payment Options</h4>
                      </div>
                      {FIXED_PAYMENT_OPTIONS.map((opt) => (
                        <div key={opt.value} className="form-group col-md-2">
                          <input
                            type="checkbox"
                            className="mt-2"
                            checked={selectedOptions.includes(opt.value)}
                            onChange={() => toggleOption(opt.value)}
                          />
                          <label className="mt-2 ml-1">{opt.label}</label>
                        </div>
                      ))}
                    </div>

                    <div className="row mt-3">
                      <div className="form-group col-md-12">
                        <button type="button" className="btn btn-info" onClick={addCustomOption}>
                          + Add More Payment Option
                        </button>
                      </div>
                    </div>

                    <div className="row mt-2">
                      <div className="col-md-6 form-group" id="payment-options">
                        {customOptions.map((val, index) => (
                          <div key={index} className="d-flex align-items-center mb-2">
                            <input
                              type="text"
                              className="form-control mt-2 mr-2"
                              style={{ maxWidth: 200 }}
                              placeholder="Payment Options"
                              value={val}
                              onChange={(e) => updateCustomOption(index, e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removeCustomOption(index)}
                              aria-label="Remove"
                            >
                              X
                            </button>
                          </div>
                        ))}
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

export default PosSetting;
