import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import { api, msg } from '../../services';
import { FormModal, ListView, SystemButton, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Discount';

const APPLICABLE_OPTIONS = [
  { value: 'All', label: 'All Products' },
  { value: 'Specific', label: 'Specific Products' },
];

const TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'flat', label: 'Flat' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

const defaultForm = {
  name: '',
  discount_plan_id: [],
  applicable_for: 'All',
  is_active: true,
  valid_from: '',
  valid_till: '',
  type: 'percentage',
  value: '',
  minimum_qty: '0',
  maximum_qty: '0',
  days: [...DAYS],
};

const Discount = () => {
  const [entities, setEntities] = useState([]);
  const [discountPlanOptions, setDiscountPlanOptions] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [productList, setProductList] = useState([]);
  const [productCodeInput, setProductCodeInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const dataColumns = [
    { title: 'Name', name: 'name', searchable: true },
    { title: 'Value', name: 'value_display', searchable: false },
    { title: 'Discount Plan', name: 'plans_text', searchable: false },
    { title: 'Validity', name: 'validity_text', searchable: false },
    { title: 'Days', name: 'days', searchable: false },
    { title: 'Products', name: 'products_text', searchable: false },
    { title: 'Status', name: 'status_display', searchable: false },
  ];

  const isSpecific = form.applicable_for === 'Specific';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('discounts');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(
          data.data.map((row) => ({
            id: row.id,
            name: row.name,
            value: row.value,
            type: row.type,
            value_display: `${row.value} (${row.type || ''})`,
            discount_plans: row.discount_plans || [],
            plans_text: (row.discount_plans || []).map((p) => p.name).join(', ') || '—',
            valid_from: row.valid_from_formatted || row.valid_from,
            valid_till: row.valid_till_formatted || row.valid_till,
            validity_text: [row.valid_from_formatted, row.valid_till_formatted].filter(Boolean).join(' - ') || '—',
            days: row.days || '—',
            product_list: row.product_list,
            products_text: row.products_text || (row.product_list ? 'Specific' : 'All Products'),
            is_active: !!row.is_active,
            status_display: row.is_active ? 'Active' : 'Inactive',
          }))
        );
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load discounts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const res = await api.get('discounts/form-data');
      const data = res?.data?.data;
      if (data?.discount_plans) {
        setDiscountPlanOptions(
          data.discount_plans.map((p) => ({ value: p.id, label: p.name }))
        );
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load form data');
    }
  };

  const openNew = async () => {
    await fetchFormData();
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      ...defaultForm,
      valid_from: today,
      valid_till: today,
      days: [...DAYS],
    });
    setProductList([]);
    setProductCodeInput('');
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
    setShowModal(true);
  };

  const hideDialog = () => {
    setShowModal(false);
    setForm(defaultForm);
    setProductList([]);
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? [...prev.days, value].sort() : prev.days.filter((d) => d !== value)) : value,
    }));
  };

  const handlePlanChange = (selected) => {
    setForm((prev) => ({
      ...prev,
      discount_plan_id: selected ? selected.map((s) => s.value) : [],
    }));
  };

  const handleDayChange = (day, checked) => {
    setForm((prev) => ({
      ...prev,
      days: checked ? [...prev.days, day].sort() : prev.days.filter((d) => d !== day),
    }));
  };

  const searchProductAndAdd = async (code) => {
    const trimmed = (code || productCodeInput || '').trim();
    if (!trimmed) return;
    if (productList.some((p) => String(p.code).toLowerCase() === trimmed.toLowerCase())) {
      msg.warning('Product already in list');
      setProductCodeInput('');
      return;
    }
    try {
      const res = await api.get('discounts/product-search/' + encodeURIComponent(trimmed));
      const data = res?.data?.data;
      if (res?.status === 200 && data) {
        setProductList((prev) => [...prev, { id: data.id, name: data.name, code: data.code }]);
        setProductCodeInput('');
      } else {
        msg.error('Product not found');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Product not found');
    }
  };

  const onProductCodeKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const val = productCodeInput.trim();
      if (val) searchProductAndAdd(val);
    }
  };

  const removeProduct = (index) => {
    setProductList((prev) => prev.filter((_, i) => i !== index));
  };

  const editRow = async (row) => {
    try {
      await fetchFormData();
      const res = await api.get('discounts/' + row.id);
      const d = res?.data?.data;
      if (!d) {
        msg.error('Discount not found');
        return;
      }
      const planIds = d.discount_plan_ids || (d.discount_plans || []).map((p) => p.id);
      const daysArr = d.days_array || (d.days ? d.days.split(',') : []);
      const products = d.product_details || [];
      setForm({
        name: d.name || '',
        discount_plan_id: planIds,
        applicable_for: d.applicable_for || 'All',
        is_active: !!d.is_active,
        valid_from: d.valid_from ? d.valid_from.slice(0, 10) : '',
        valid_till: d.valid_till ? d.valid_till.slice(0, 10) : '',
        type: d.type || 'percentage',
        value: String(d.value ?? ''),
        minimum_qty: String(d.minimum_qty ?? 0),
        maximum_qty: String(d.maximum_qty ?? 0),
        days: daysArr.length ? daysArr : [...DAYS],
      });
      setProductList(products);
      setProductCodeInput('');
      setSelectedId(row.id);
      setIsEdit(true);
      setSubmitted(false);
      setShowModal(true);
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load discount');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.name?.trim()) {
      msg.error('Name is required');
      return;
    }
    if (!form.discount_plan_id?.length) {
      msg.error('Select at least one discount plan');
      return;
    }
    if (!form.valid_from || !form.valid_till) {
      msg.error('Valid From and Valid Till are required');
      return;
    }
    if (form.value === '' || form.value === null || form.value === undefined) {
      msg.error('Value is required');
      return;
    }
    if (!form.days?.length) {
      msg.error('Select at least one day');
      return;
    }
    if (isSpecific && !productList.length) {
      msg.error('Add at least one product for Specific');
      return;
    }

    const payload = {
      name: form.name.trim(),
      discount_plan_id: form.discount_plan_id,
      applicable_for: form.applicable_for,
      is_active: form.is_active,
      valid_from: form.valid_from,
      valid_till: form.valid_till,
      type: form.type,
      value: parseFloat(form.value) || 0,
      minimum_qty: parseInt(form.minimum_qty, 10) || 0,
      maximum_qty: parseInt(form.maximum_qty, 10) || 0,
      days: form.days,
      product_list: isSpecific ? productList.map((p) => p.id) : [],
    };

    try {
      if (isEdit && selectedId) {
        const res = await api.post('discounts/' + selectedId).values(payload);
        const data = res?.data;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message || 'Discount updated');
          hideDialog();
          fetchData();
        } else {
          msg.error(data?.message || res?.error || 'Update failed');
        }
      } else {
        const res = await api.post('discounts').values(payload);
        const data = res?.data;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message || 'Discount created');
          hideDialog();
          fetchData();
        } else {
          msg.error(data?.message || res?.error || 'Create failed');
        }
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to save');
    }
  };

  const selectedPlanOptions = discountPlanOptions.filter((o) => form.discount_plan_id.includes(o.value));

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton type="add-new" method={openNew} showText btnText="Create Discount" />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Update Discount' : 'Create Discount'}
        modalState={showModal}
        toggleFormModal={hideDialog}
        width="95%"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body text-left" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <p className="small text-muted">Fields marked with * are required.</p>

            <div className="row">
              <div className="col-md-3 form-group">
                <label>Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="name"
                  className={`form-control ${submitted && !form.name?.trim() ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-3 form-group">
                <label>Discount Plan <span className="text-danger">*</span></label>
                <Select
                  isMulti
                  closeMenuOnSelect={false}
                  options={discountPlanOptions}
                  value={selectedPlanOptions}
                  onChange={handlePlanChange}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Select discount plan..."
                />
              </div>
              <div className="col-md-3 form-group">
                <label>Applicable For <span className="text-danger">*</span></label>
                <select name="applicable_for" className="form-control" value={form.applicable_for} onChange={handleChange}>
                  {APPLICABLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 form-group form-check mt-4">
                <input type="checkbox" name="is_active" id="is_active" className="form-check-input" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
                <label className="form-check-label" htmlFor="is_active">Active</label>
              </div>
            </div>

            {isSpecific && (
              <div className="row">
                <div className="col-md-9 form-group">
                  <label>Select Product <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type product code, then comma or Enter to add"
                    value={productCodeInput}
                    onChange={(e) => setProductCodeInput(e.target.value)}
                    onKeyDown={onProductCodeKeyDown}
                  />
                </div>
                <div className="col-12">
                  <table className="table table-sm table-bordered">
                    <thead><tr><th>#</th><th>Name</th><th>Code</th><th></th></tr></thead>
                    <tbody>
                      {productList.map((p, i) => (
                        <tr key={p.id}>
                          <td>{i + 1}</td>
                          <td>{p.name}</td>
                          <td>{p.code}</td>
                          <td>
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => removeProduct(i)}>
                              <SafeFontAwesomeIcon icon={faTrash} size="xs" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-4 form-group">
                <label>Valid From <span className="text-danger">*</span></label>
                <input type="date" name="valid_from" className="form-control" value={form.valid_from} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Valid Till <span className="text-danger">*</span></label>
                <input type="date" name="valid_till" className="form-control" value={form.valid_till} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Discount Type <span className="text-danger">*</span></label>
                <select name="type" className="form-control" value={form.type} onChange={handleChange}>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Value <span className="text-danger">*</span></label>
                <input type="number" name="value" className="form-control" step="any" min={0} value={form.value} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Minimum Qty <span className="text-danger">*</span></label>
                <input type="number" name="minimum_qty" className="form-control" min={0} value={form.minimum_qty} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Maximum Qty <span className="text-danger">*</span></label>
                <input type="number" name="maximum_qty" className="form-control" min={0} value={form.maximum_qty} onChange={handleChange} required />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <label>Valid on the following days</label>
                <ul className="list-unstyled">
                  {DAYS.map((day) => (
                    <li key={day}>
                      <label className="form-check-label">
                        <input
                          type="checkbox"
                          checked={form.days.includes(day)}
                          onChange={(e) => handleDayChange(day, e.target.checked)}
                        />
                        {' '}{DAY_LABELS[day]}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideDialog}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <SafeFontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-2" size="sm" /> Submit
            </button>
          </div>
        </form>
      </FormModal>

      <br />
      <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        loadingState={isLoading}
        searchAndFetch={() => fetchData()}
        actionsColumn
        showEditButton
        showDeleteButton={false}
        resetSearch={() => fetchData()}
        rowKey="id"
      />
    </div>
  );
};

export default Discount;
