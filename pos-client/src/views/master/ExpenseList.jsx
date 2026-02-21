import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Expense List';

const getDefaultDates = () => {
  const end = new Date();
  const start = new Date(end.getFullYear() - 1, end.getMonth(), 1);
  return {
    starting_date: start.toISOString().slice(0, 10),
    ending_date: end.toISOString().slice(0, 10),
  };
};

const defaultForm = {
  created_at: '',
  expense_category_id: '',
  warehouse_id: '',
  account_id: '',
  amount: '',
  note: '',
  employee_id: '',
  type: 'expense',
};

const ExpenseList = () => {
  const { starting_date: defStart, ending_date: defEnd } = getDefaultDates();
  const [filter, setFilter] = useState({ starting_date: defStart, ending_date: defEnd, warehouse_id: '0' });
  const [entities, setEntities] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [formData, setFormData] = useState({
    expense_categories: [],
    warehouses: [],
    accounts: [],
    employees: [],
  });
  const [form, setForm] = useState(defaultForm);
  const [referenceNo, setReferenceNo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const isEmployeeExpense = form.expense_category_id === '0';

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filter.starting_date, filter.ending_date, filter.warehouse_id]);

  const fetchFormData = async () => {
    try {
      const res = await api.get('expenses/form-data');
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        setFormData(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load form data');
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        starting_date: filter.starting_date,
        ending_date: filter.ending_date,
        warehouse_id: filter.warehouse_id,
      });
      const res = await api.get('expenses/list?' + params.toString());
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
        setTotalAmount(data?.total_amount ?? 0);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setForm({
      ...defaultForm,
      created_at: new Date().toISOString().slice(0, 10),
      account_id: formData.accounts.find((a) => a.is_default)?.id?.toString() || (formData.accounts[0]?.id?.toString() ?? ''),
    });
    setReferenceNo('er-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString().slice(-6));
    setSelectedId(null);
    setShowAddModal(true);
  };

  const hideAddModal = () => {
    setShowAddModal(false);
    setForm(defaultForm);
  };

  const openEdit = async (row) => {
    try {
      const res = await api.get('expenses/edit/' + row.id);
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        const s = data.data;
        setForm({
          created_at: s.created_at || (s.date && s.date.split('-').reverse().join('-')) || '',
          expense_category_id: String(s.expense_category_id ?? ''),
          warehouse_id: String(s.warehouse_id ?? ''),
          account_id: s.account_id ? String(s.account_id) : '',
          amount: s.amount != null ? String(s.amount) : '',
          note: s.note ?? '',
          employee_id: s.employee_id ? String(s.employee_id) : '',
          type: s.type === 'advance' ? 'advance' : 'expense',
        });
        setReferenceNo(s.reference_no ?? '');
        setSelectedId(row.id);
        setShowEditModal(true);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load expense');
    }
  };

  const hideEditModal = () => {
    setShowEditModal(false);
    setForm(defaultForm);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    const payload = {
      expense_category_id: Number(form.expense_category_id),
      warehouse_id: Number(form.warehouse_id),
      amount: parseFloat(form.amount),
      note: form.note?.trim() || '',
    };
    if (form.created_at) payload.created_at = form.created_at + ' 00:00:00';
    if (form.account_id) payload.account_id = Number(form.account_id);
    if (form.expense_category_id === '0') {
      if (form.employee_id) payload.employee_id = Number(form.employee_id);
      payload.type = form.type === 'advance' ? 'advance' : 'expense';
    }
    return payload;
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (form.expense_category_id === '' || form.expense_category_id === undefined) {
      msg.error('Expense Category is required');
      return;
    }
    if (!form.warehouse_id) {
      msg.error('Warehouse is required');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0) {
      msg.error('Amount is required and must be >= 0');
      return;
    }
    if (isEmployeeExpense && !form.employee_id) {
      msg.error('Employee is required for Employee Expense');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('expenses/store').values(buildPayload());
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Expense created');
        hideAddModal();
        fetchData();
      } else {
        msg.error(data?.message || 'Create failed');
      }
    } catch (err) {
      const d = err?.response?.data;
      msg.error(d?.message || (d?.errors ? Object.values(d.errors).flat().join(' ') : 'Create failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (form.expense_category_id === '' || !form.warehouse_id) {
      msg.error('Expense Category and Warehouse are required');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0) {
      msg.error('Amount is required and must be >= 0');
      return;
    }
    if (isEmployeeExpense && !form.employee_id) {
      msg.error('Employee is required for Employee Expense');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.put('expenses', selectedId).values(buildPayload());
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Expense updated');
        hideEditModal();
        fetchData();
      } else {
        msg.error(data?.message || 'Update failed');
      }
    } catch (err) {
      const d = err?.response?.data;
      msg.error(d?.message || 'Update failed');
    } finally {
      setSubmitting(false);
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
      const res = await api.delete('expenses/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        setTotalAmount((prev) => prev - (parseFloat(itemToDelete.amount) || 0));
        msg.success(data?.message || 'Expense deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
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
      <div className="container-fluid">
        <div className="card mb-3">
          <div className="card-body">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchData();
              }}
              className="row align-items-end"
            >
              <div className="col-md-3 form-group">
                <label className="font-weight-bold">Choose Your Date (from)</label>
                <input
                  type="date"
                  name="starting_date"
                  className="form-control"
                  value={filter.starting_date}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3 form-group">
                <label className="font-weight-bold">To</label>
                <input
                  type="date"
                  name="ending_date"
                  className="form-control"
                  value={filter.ending_date}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3 form-group">
                <label className="font-weight-bold">Warehouse</label>
                <select
                  name="warehouse_id"
                  className="form-control"
                  value={filter.warehouse_id}
                  onChange={handleFilterChange}
                >
                  <option value="0">All Warehouse</option>
                  {formData.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group">
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
        <button type="button" className="btn btn-info" onClick={openAdd}>
          <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Expense
        </button>
      </div>

      <FormModal moduleName="Add Expense" modalState={showAddModal} toggleFormModal={hideAddModal} width="560px">
        <form onSubmit={handleSubmitAdd}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="form-group">
              <label>Reference</label>
              <p className="mb-0">{referenceNo}</p>
            </div>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Date</label>
                <input type="date" name="created_at" className="form-control" value={form.created_at} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Expense Category <span className="text-danger">*</span></label>
                <select name="expense_category_id" className="form-control" value={form.expense_category_id} onChange={handleChange} required>
                  <option value="">Select...</option>
                  <option value="0">Employee Expense</option>
                  {formData.expense_categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Warehouse <span className="text-danger">*</span></label>
                <select name="warehouse_id" className="form-control" value={form.warehouse_id} onChange={handleChange} required>
                  <option value="">Select...</option>
                  {formData.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Amount <span className="text-danger">*</span></label>
                <input type="number" name="amount" step="any" min="0" className="form-control" value={form.amount} onChange={handleChange} required />
              </div>
              {isEmployeeExpense && (
                <>
                  <div className="col-md-6 form-group">
                    <label>Employee <span className="text-danger">*</span></label>
                    <select name="employee_id" className="form-control" value={form.employee_id} onChange={handleChange} required={isEmployeeExpense}>
                      <option value="">Select...</option>
                      {formData.employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 form-group">
                    <label>Type <span className="text-danger">*</span></label>
                    <select name="type" className="form-control" value={form.type} onChange={handleChange}>
                      <option value="expense">Expense</option>
                      <option value="advance">Advance</option>
                    </select>
                  </div>
                </>
              )}
              <div className="col-md-6 form-group">
                <label>Account</label>
                <select name="account_id" className="form-control" value={form.account_id} onChange={handleChange}>
                  <option value="">Select...</option>
                  {formData.accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} [{acc.account_no || acc.id}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Note</label>
              <textarea name="note" rows="2" className="form-control" value={form.note} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideAddModal}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              Submit
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal moduleName="Update Expense" modalState={showEditModal} toggleFormModal={hideEditModal} width="560px">
        <form onSubmit={handleSubmitEdit}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="form-group">
              <label>Reference</label>
              <p className="mb-0">{referenceNo}</p>
            </div>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Date</label>
                <input type="date" name="created_at" className="form-control" value={form.created_at} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Expense Category <span className="text-danger">*</span></label>
                <select name="expense_category_id" className="form-control" value={form.expense_category_id} onChange={handleChange} required>
                  <option value="">Select...</option>
                  <option value="0">Employee Expense</option>
                  {formData.expense_categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Warehouse <span className="text-danger">*</span></label>
                <select name="warehouse_id" className="form-control" value={form.warehouse_id} onChange={handleChange} required>
                  <option value="">Select...</option>
                  {formData.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Amount <span className="text-danger">*</span></label>
                <input type="number" name="amount" step="any" min="0" className="form-control" value={form.amount} onChange={handleChange} required />
              </div>
              {isEmployeeExpense && (
                <>
                  <div className="col-md-6 form-group">
                    <label>Employee <span className="text-danger">*</span></label>
                    <select name="employee_id" className="form-control" value={form.employee_id} onChange={handleChange} required={isEmployeeExpense}>
                      <option value="">Select...</option>
                      {formData.employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 form-group">
                    <label>Type <span className="text-danger">*</span></label>
                    <select name="type" className="form-control" value={form.type} onChange={handleChange}>
                      <option value="expense">Expense</option>
                      <option value="advance">Advance</option>
                    </select>
                  </div>
                </>
              )}
              <div className="col-md-6 form-group">
                <label>Account</label>
                <select name="account_id" className="form-control" value={form.account_id} onChange={handleChange}>
                  <option value="">Select...</option>
                  {formData.accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} [{acc.account_no || acc.id}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Note</label>
              <textarea name="note" rows="2" className="form-control" value={form.note} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideEditModal}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <SafeFontAwesomeIcon icon={faCheck} className="mr-2" size="sm" /> Update
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
                <p>
                  Are you sure you want to delete expense <strong>"{itemToDelete?.reference_no}"</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteDialog(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive mt-3">
        {isLoading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference No</th>
                  <th>Warehouse</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                  <th>Note</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date ?? '—'}</td>
                    <td>{row.reference_no ?? '—'}</td>
                    <td>{row.warehouse ?? '—'}</td>
                    <td>{row.expense_category ?? '—'}</td>
                    <td className="text-right">{row.amount != null ? Number(row.amount).toFixed(2) : '—'}</td>
                    <td>{row.note ?? '—'}</td>
                    <td className="text-center">
                      <button type="button" className="btn btn-sm btn-link" onClick={() => openEdit(row)} title="Edit">
                        <SafeFontAwesomeIcon icon={faEdit} size="sm" /> Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => confirmDelete(row)} title="Delete">
                        <SafeFontAwesomeIcon icon={faTrash} size="sm" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="tfoot active">
                <tr>
                  <td colSpan="4" className="text-right font-weight-bold">Total</td>
                  <td className="text-right font-weight-bold">{Number(totalAmount).toFixed(2)}</td>
                  <td colSpan="2" />
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
