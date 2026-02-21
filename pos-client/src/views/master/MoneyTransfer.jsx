import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Money Transfer';

const defaultForm = {
  from_account_id: '',
  to_account_id: '',
  amount: '',
  created_at: '',
};

const MoneyTransfer = () => {
  const [entities, setEntities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchData();
    fetchAccounts();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('money-transfers');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load money transfers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('money-transfers/accounts');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setAccounts(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load accounts');
    }
  };

  const openAdd = () => {
    setForm(defaultForm);
    setSelectedId(null);
    setShowAddModal(true);
  };

  const hideAddModal = () => {
    setShowAddModal(false);
    setForm(defaultForm);
  };

  const openEdit = (row) => {
    const d = row.created_at ? row.created_at.slice(0, 16).replace('T', ' ') : '';
    const datePart = d ? d.slice(0, 10) : '';
    setForm({
      from_account_id: row.from_account_id ?? '',
      to_account_id: row.to_account_id ?? '',
      amount: row.amount != null ? String(row.amount) : '',
      created_at: datePart,
    });
    setSelectedId(row.id);
    setShowEditModal(true);
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

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    const fromId = form.from_account_id ? Number(form.from_account_id) : null;
    const toId = form.to_account_id ? Number(form.to_account_id) : null;
    if (!fromId || !toId) {
      msg.error('From Account and To Account are required');
      return;
    }
    if (fromId === toId) {
      msg.error('From and To account must be different');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      msg.error('Amount is required and must be greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        from_account_id: fromId,
        to_account_id: toId,
        amount,
      };
      const res = await api.post('money-transfers').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Money transfer created');
        hideAddModal();
        fetchData();
      } else {
        msg.error(data?.message || 'Create failed');
      }
    } catch (err) {
      const d = err?.response?.data;
      msg.error(d?.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    const fromId = form.from_account_id ? Number(form.from_account_id) : null;
    const toId = form.to_account_id ? Number(form.to_account_id) : null;
    if (!fromId || !toId) {
      msg.error('From Account and To Account are required');
      return;
    }
    if (fromId === toId) {
      msg.error('From and To account must be different');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      msg.error('Amount is required and must be greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        from_account_id: fromId,
        to_account_id: toId,
        amount,
      };
      if (form.created_at) payload.created_at = form.created_at + ' 00:00:00';
      const res = await api.put('money-transfers', selectedId).values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Money transfer updated');
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
      const res = await api.delete('money-transfers/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Money transfer deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const totalAmount = entities.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="container-fluid">
        <button type="button" className="btn btn-info" onClick={openAdd}>
          <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Money Transfer
        </button>
      </div>

      {/* Add Money Transfer Modal */}
      <FormModal
        moduleName="Add Money Transfer"
        modalState={showAddModal}
        toggleFormModal={hideAddModal}
        width="520px"
      >
        <form onSubmit={handleSubmitAdd}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>From Account <span className="text-danger">*</span></label>
                <select
                  name="from_account_id"
                  className="form-control"
                  value={form.from_account_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select from account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} [{acc.account_no || acc.id}]
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>To Account <span className="text-danger">*</span></label>
                <select
                  name="to_account_id"
                  className="form-control"
                  value={form.to_account_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select to account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} [{acc.account_no || acc.id}]
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Amount <span className="text-danger">*</span></label>
                <input
                  type="number"
                  name="amount"
                  className="form-control"
                  step="any"
                  min="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideAddModal}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Submit
            </button>
          </div>
        </form>
      </FormModal>

      {/* Edit Money Transfer Modal */}
      <FormModal
        moduleName="Update Money Transfer"
        modalState={showEditModal}
        toggleFormModal={hideEditModal}
        width="520px"
      >
        <form onSubmit={handleSubmitEdit}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="created_at"
                  className="form-control"
                  value={form.created_at}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 form-group">
                <label>From Account <span className="text-danger">*</span></label>
                <select
                  name="from_account_id"
                  className="form-control"
                  value={form.from_account_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select from account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} [{acc.account_no || acc.id}]
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>To Account <span className="text-danger">*</span></label>
                <select
                  name="to_account_id"
                  className="form-control"
                  value={form.to_account_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select to account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} [{acc.account_no || acc.id}]
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Amount <span className="text-danger">*</span></label>
                <input
                  type="number"
                  name="amount"
                  className="form-control"
                  step="any"
                  min="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideEditModal}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <SafeFontAwesomeIcon icon={faCheck} className="mr-2" size="sm" /> Submit
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
                <p>Are you sure you want to delete this money transfer (Ref: {itemToDelete?.reference_no})?</p>
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
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference No</th>
                <th>From Account</th>
                <th>To Account</th>
                <th>Amount</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((row) => (
                <tr key={row.id}>
                  <td>{row.created_at_formatted ?? row.created_at ?? '—'}</td>
                  <td>{row.reference_no ?? '—'}</td>
                  <td>{row.from_account_name ?? '—'}</td>
                  <td>{row.to_account_name ?? '—'}</td>
                  <td>{row.amount_formatted ?? row.amount ?? '0'}</td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-link"
                      onClick={() => openEdit(row)}
                      title="Edit"
                    >
                      <SafeFontAwesomeIcon icon={faEdit} size="sm" /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger"
                      onClick={() => confirmDelete(row)}
                      title="Delete"
                    >
                      <SafeFontAwesomeIcon icon={faTrash} size="sm" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="tfoot active">
              <tr>
                <td colSpan="4" className="text-right"><strong>Total</strong></td>
                <td><strong>{totalAmount.toFixed(2)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default MoneyTransfer;
