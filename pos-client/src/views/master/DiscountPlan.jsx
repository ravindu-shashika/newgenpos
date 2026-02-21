import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import { api, msg } from '../../services';
import { FormModal, ListView, SystemButton, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Discount Plan';

const TYPE_OPTIONS = [
  { value: 'limited', label: 'Limited' },
  { value: 'generic', label: 'Generic' },
];

const defaultForm = {
  name: '',
  type: 'limited',
  customer_id: [],
  is_active: true,
};

const DiscountPlan = () => {
  const [entities, setEntities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const dataColumns = [
    { title: 'Name', name: 'name', searchable: true },
    { title: 'Customer', name: 'customers_text', searchable: false },
    { title: 'Type', name: 'type_display', searchable: false },
    { title: 'Status', name: 'status_display', searchable: false },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('discount-plans');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(
          data.data.map((row) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            type_display: row.type ? row.type.charAt(0).toUpperCase() + row.type.slice(1) : '—',
            is_active: !!row.is_active,
            status_display: row.is_active ? 'Active' : 'Inactive',
            customers: row.customers || [],
            customers_text: (row.customers || []).map((c) => c.name).join(', ') || '—',
          }))
        );
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load discount plans');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const res = await api.get('discount-plans/form-data');
      const data = res?.data;
      if (data?.status === 200 && data?.data?.customers) {
        const list = data.data.customers;
        setCustomers(list);
        setCustomerOptions(
          list.map((c) => ({
            value: c.id,
            label: `${c.name || ''} (${c.phone_number || ''})`,
          }))
        );
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load customers');
    }
  };

  const openNew = async () => {
    await fetchFormData();
    setForm({
      ...defaultForm,
      customer_id: [],
    });
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
    setShowModal(true);
  };

  const hideDialog = () => {
    setShowModal(false);
    setForm(defaultForm);
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'type' && value === 'generic') {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        customer_id: customerOptions.map((o) => o.value),
      }));
    }
  };

  const handleCustomerChange = (selected) => {
    const selectedValues = selected ? selected.map((s) => s.value) : [];
    setForm((prev) => ({ ...prev, customer_id: selectedValues }));
  };

  const editRow = async (row) => {
    try {
      const [formRes, planRes] = await Promise.all([
        api.get('discount-plans/form-data'),
        api.get(`discount-plans/${row.id}`),
      ]);
      const plan = planRes?.data?.data;
      const formData = formRes?.data?.data;
      if (!plan) {
        msg.error('Plan not found');
        return;
      }
      const custList = formData?.customers || [];
      const options = custList.map((c) => ({
        value: c.id,
        label: `${c.name || ''} (${c.phone_number || ''})`,
      }));
      setCustomers(custList);
      setCustomerOptions(options);
      const planCustomerIds = (plan.customers || []).map((c) => c.id);
      const allIds = options.map((o) => o.value);
      const isGeneric = plan.type === 'generic';
      setForm({
        name: plan.name || '',
        type: plan.type || 'limited',
        customer_id: isGeneric ? allIds : planCustomerIds,
        is_active: !!plan.is_active,
      });
      setSelectedId(row.id);
      setIsEdit(true);
      setSubmitted(false);
      setShowModal(true);
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load plan');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.name?.trim()) {
      msg.error('Name is required');
      return;
    }
    if (!form.customer_id?.length) {
      msg.error('Select at least one customer');
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      customer_id: form.customer_id,
      is_active: form.is_active,
    };

    try {
      if (isEdit && selectedId) {
        const res = await api.post('discount-plans/' + selectedId).values(payload);
        const data = res?.data;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message || 'Discount plan updated');
          hideDialog();
          fetchData();
        } else {
          msg.error(data?.message || res?.error || 'Update failed');
        }
      } else {
        const res = await api.post('discount-plans').values(payload);
        const data = res?.data;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message || 'Discount plan created');
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

  const selectedCustomerOptions = customerOptions.filter((o) => form.customer_id.includes(o.value));

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton type="add-new" method={openNew} showText btnText="Create Discount Plan" />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Update Discount Plan' : 'Create Discount Plan'}
        modalState={showModal}
        toggleFormModal={hideDialog}
        width="560px"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="form-group">
              <label>Name <span className="text-danger">*</span></label>
              <input
                type="text"
                name="name"
                className={`form-control ${submitted && !form.name?.trim() ? 'is-invalid' : ''}`}
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Customer <span className="text-danger">*</span></label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                options={customerOptions}
                value={selectedCustomerOptions}
                onChange={handleCustomerChange}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder="Select customer..."
              />
              {form.type === 'generic' && (
                <small className="text-muted">Generic type: all active customers are included.</small>
              )}
            </div>
            <div className="form-group">
              <label>Type <span className="text-danger">*</span></label>
              <select
                name="type"
                id="type-select"
                className="form-control"
                value={form.type}
                onChange={handleChange}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <small className="text-muted">Generic = apply to all customers; Limited = selected customers only.</small>
            </div>
            <div className="form-group form-check">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                className="form-check-input"
                checked={form.is_active}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="is_active">Active</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideDialog}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" />
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <SafeFontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-2" size="sm" />
              Submit
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

export default DiscountPlan;
