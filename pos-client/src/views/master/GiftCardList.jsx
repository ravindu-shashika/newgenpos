import React, { useState, useEffect } from 'react';
import { faPlus, faEdit, faTrash, faEye, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Gift Card List';

const defaultForm = {
  card_no: '',
  amount: '',
  user: false,
  user_id: '',
  customer_id: '',
  expired_date: '',
};

const GiftCardList = () => {
  const [entities, setEntities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [addForm, setAddForm] = useState({ ...defaultForm });
  const [editForm, setEditForm] = useState({ ...defaultForm, id: null });
  const [viewDetails, setViewDetails] = useState(null);
  const [rechargeCard, setRechargeCard] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCustomers();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('gift_cards/list');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load gift cards');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('customers/list');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setCustomers(data.data);
      }
    } catch (err) {
      // optional
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('users/list');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setUsers(data.data);
      }
    } catch (err) {
      // optional
    }
  };

  const openAdd = () => {
    setAddForm({
      ...defaultForm,
      expired_date: new Date().toISOString().slice(0, 10),
    });
    setShowAddModal(true);
  };

  const closeAdd = () => {
    setShowAddModal(false);
    setAddForm({ ...defaultForm });
  };

  const openEdit = async (row) => {
    try {
      const res = await api.get('gift_cards/edit/' + row.id);
      const d = res?.data?.data;
      if (!d) return;
      setEditForm({
        id: d.id,
        card_no: d.card_no || '',
        amount: d.amount != null ? String(d.amount) : '',
        user: !!d.user_id,
        user_id: d.user_id || '',
        customer_id: d.customer_id || '',
        expired_date: d.expired_date || '',
      });
      setShowEditModal(true);
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load gift card');
    }
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditForm({ ...defaultForm, id: null });
  };

  const openView = (row) => {
    setViewDetails({
      card_no: row.card_no,
      client: row.client,
      balance: row.balance,
      expired_date: row.expired_date_formatted || row.expired_date,
    });
    setShowViewModal(true);
  };

  const openRecharge = (row) => {
    setRechargeCard(row);
    setRechargeAmount('');
    setShowRechargeModal(true);
  };

  const closeRecharge = () => {
    setShowRechargeModal(false);
    setRechargeCard(null);
    setRechargeAmount('');
  };

  const generateCode = async (forEdit = false) => {
    setGenLoading(true);
    try {
      const res = await api.get('gift_cards/gencode');
      const code = typeof res?.data === 'string' ? res.data : res?.data?.card_no || '';
      if (forEdit) {
        setEditForm((prev) => ({ ...prev, card_no: code }));
      } else {
        setAddForm((prev) => ({ ...prev, card_no: code }));
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to generate code');
    } finally {
      setGenLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const isUser = !!addForm.user;
    if (isUser && !addForm.user_id) {
      msg.error('Please select a user');
      return;
    }
    if (!isUser && !addForm.customer_id) {
      msg.error('Please select a customer');
      return;
    }
    const payload = {
      card_no: addForm.card_no.trim(),
      amount: parseFloat(addForm.amount) || 0,
      user: isUser,
      user_id: isUser ? addForm.user_id : null,
      customer_id: !isUser ? addForm.customer_id : null,
      expired_date: addForm.expired_date || null,
    };
    setSubmitting(true);
    try {
      const res = await api.post('gift_cards/store', payload);
      const data = res?.data;
      if (data?.status === 200) {
        msg.success(data?.message || 'Gift card created');
        closeAdd();
        fetchData();
      } else {
        msg.error(data?.message || 'Create failed');
      }
    } catch (err) {
      const m = err?.response?.data?.message || (err?.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(' ')
        : 'Failed to create gift card');
      msg.error(m);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.id) return;
    const isUser = !!editForm.user;
    if (isUser && !editForm.user_id) {
      msg.error('Please select a user');
      return;
    }
    if (!isUser && !editForm.customer_id) {
      msg.error('Please select a customer');
      return;
    }
    const payload = {
      card_no: editForm.card_no.trim(),
      amount_edit: parseFloat(editForm.amount) || 0,
      user_edit: isUser ? 1 : 0,
      user_id_edit: isUser ? editForm.user_id : null,
      customer_id_edit: !isUser ? editForm.customer_id : null,
      expired_date_edit: editForm.expired_date || null,
    };
    setSubmitting(true);
    try {
      const res = await api.put('gift_cards/update/' + editForm.id, payload);
      const data = res?.data;
      if (data?.status === 200) {
        msg.success(data?.message || 'Gift card updated');
        closeEdit();
        fetchData();
      } else {
        msg.error(data?.message || 'Update failed');
      }
    } catch (err) {
      const m = err?.response?.data?.message || (err?.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(' ')
        : 'Failed to update gift card');
      msg.error(m);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    if (!rechargeCard?.id) return;
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount <= 0) {
      msg.error('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('gift_cards/recharge-api/' + rechargeCard.id, { amount });
      const data = res?.data;
      if (data?.status === 200) {
        msg.success(data?.message || 'Gift card recharged');
        closeRecharge();
        fetchData();
      } else {
        msg.error(data?.message || 'Recharge failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Recharge failed');
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
      const res = await api.delete('gift_cards/delete/' + itemToDelete.id);
      const data = res?.data;
      if (data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Gift card deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const DECIMAL = 2;

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="container-fluid">
        <div className="mb-2">
          <button type="button" className="btn btn-info" onClick={openAdd}>
            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Gift Card
          </button>
        </div>

        <div className="table-responsive">
          {isLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : (
            <table className="table table-bordered table-hover table-striped">
              <thead className="thead-light">
                <tr>
                  <th>Card No</th>
                  <th>Customer</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Expense</th>
                  <th className="text-right">Balance</th>
                  <th>Created By</th>
                  <th>Expired Date</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted">
                      No gift cards found.
                    </td>
                  </tr>
                ) : (
                  entities.map((row) => (
                    <tr key={row.id}>
                      <td>{row.card_no || '-'}</td>
                      <td>{row.client || '-'}</td>
                      <td className="text-right">{row.amount != null ? Number(row.amount).toFixed(DECIMAL) : '-'}</td>
                      <td className="text-right">{row.expense != null ? Number(row.expense).toFixed(DECIMAL) : '-'}</td>
                      <td className="text-right">{row.balance != null ? Number(row.balance).toFixed(DECIMAL) : '-'}</td>
                      <td>{row.created_by || '-'}</td>
                      <td>
                        <span className={`badge ${row.is_expired ? 'badge-danger' : 'badge-success'}`}>
                          {row.expired_date_formatted || row.expired_date || 'N/A'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary mr-1"
                          onClick={() => openView(row)}
                          title="View"
                        >
                          <SafeFontAwesomeIcon icon={faEye} size="sm" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary mr-1"
                          onClick={() => openEdit(row)}
                          title="Edit"
                        >
                          <SafeFontAwesomeIcon icon={faEdit} size="sm" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success mr-1"
                          onClick={() => openRecharge(row)}
                          title="Recharge"
                        >
                          <SafeFontAwesomeIcon icon={faMoneyBillWave} size="sm" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => confirmDelete(row)}
                          title="Delete"
                        >
                          <SafeFontAwesomeIcon icon={faTrash} size="sm" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Gift Card Modal */}
      <FormModal moduleName="Add Gift Card" modalState={showAddModal} toggleFormModal={closeAdd} width="560px">
        <div className="modal-body">
          <p className="italic small text-muted">The field labels marked with * are required.</p>
          <form onSubmit={handleAddSubmit}>
            <div className="form-group">
              <label>Card No *</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={addForm.card_no}
                  onChange={(e) => setAddForm((f) => ({ ...f, card_no: e.target.value }))}
                  required
                />
                <div className="input-group-append">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => generateCode(false)} disabled={genLoading}>
                    {genLoading ? '...' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                step="any"
                min="0"
                className="form-control"
                value={addForm.amount}
                onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="mr-2">User List</label>
              <input
                type="checkbox"
                checked={addForm.user}
                onChange={(e) => setAddForm((f) => ({ ...f, user: e.target.checked }))}
              />
            </div>
            {addForm.user ? (
              <div className="form-group">
                <label>User *</label>
                <select
                  className="form-control"
                  value={addForm.user_id}
                  onChange={(e) => setAddForm((f) => ({ ...f, user_id: e.target.value }))}
                  required
                >
                  <option value="">Select User...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Customer *</label>
                <select
                  className="form-control"
                  value={addForm.customer_id}
                  onChange={(e) => setAddForm((f) => ({ ...f, customer_id: e.target.value }))}
                  required
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.customer_details && c.customer_details.split('\n')[0]) || c.name || 'Customer #' + c.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Expired Date</label>
              <input
                type="date"
                className="form-control"
                value={addForm.expired_date}
                onChange={(e) => setAddForm((f) => ({ ...f, expired_date: e.target.value }))}
              />
            </div>
            <div className="form-group mb-0">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </FormModal>

      {/* Edit Gift Card Modal */}
      <FormModal moduleName="Update Gift Card" modalState={showEditModal} toggleFormModal={closeEdit} width="560px">
        <div className="modal-body">
          <p className="italic small text-muted">The field labels marked with * are required.</p>
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label>Card No *</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={editForm.card_no}
                  onChange={(e) => setEditForm((f) => ({ ...f, card_no: e.target.value }))}
                  required
                />
                <div className="input-group-append">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => generateCode(true)} disabled={genLoading}>
                    {genLoading ? '...' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                step="any"
                min="0"
                className="form-control"
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="mr-2">User List</label>
              <input
                type="checkbox"
                checked={editForm.user}
                onChange={(e) => setEditForm((f) => ({ ...f, user: e.target.checked }))}
              />
            </div>
            {editForm.user ? (
              <div className="form-group">
                <label>User *</label>
                <select
                  className="form-control"
                  value={editForm.user_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, user_id: e.target.value }))}
                  required
                >
                  <option value="">Select User...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Customer *</label>
                <select
                  className="form-control"
                  value={editForm.customer_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, customer_id: e.target.value }))}
                  required
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.customer_details && c.customer_details.split('\n')[0]) || c.name || 'Customer #' + c.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Expired Date</label>
              <input
                type="date"
                className="form-control"
                value={editForm.expired_date}
                onChange={(e) => setEditForm((f) => ({ ...f, expired_date: e.target.value }))}
              />
            </div>
            <div className="form-group mb-0">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Updating...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </FormModal>

      {/* View Card Details Modal */}
      <FormModal
        moduleName="Card Details"
        modalState={showViewModal}
        toggleFormModal={() => { setShowViewModal(false); setViewDetails(null); }}
        width="400px"
      >
        <div className="modal-body">
          {viewDetails && (
            <div>
              <p><strong>Card No:</strong> {viewDetails.card_no}</p>
              <p><strong>Client:</strong> {viewDetails.client}</p>
              <p><strong>Balance:</strong> {viewDetails.balance != null ? Number(viewDetails.balance).toFixed(DECIMAL) : '-'}</p>
              <p><strong>Valid Thru:</strong> {viewDetails.expired_date || 'N/A'}</p>
            </div>
          )}
        </div>
      </FormModal>

      {/* Recharge Modal */}
      <FormModal
        moduleName={`Recharge - ${rechargeCard?.card_no || 'Card'}`}
        modalState={showRechargeModal}
        toggleFormModal={closeRecharge}
        width="420px"
      >
        <div className="modal-body">
          <p className="italic small text-muted">The field labels marked with * are required.</p>
          <form onSubmit={handleRechargeSubmit}>
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                className="form-control"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-0">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </FormModal>

      {/* Delete confirm */}
      <FormModal
        moduleName="Confirm delete"
        modalState={deleteDialog}
        toggleFormModal={() => { setDeleteDialog(false); setItemToDelete(null); }}
        width="420px"
      >
        <div className="modal-body">
          <p>
            Are you sure you want to delete gift card <strong>"{itemToDelete?.card_no}"</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => { setDeleteDialog(false); setItemToDelete(null); }}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" /> Delete
          </button>
        </div>
      </FormModal>
    </div>
  );
};

export default GiftCardList;
