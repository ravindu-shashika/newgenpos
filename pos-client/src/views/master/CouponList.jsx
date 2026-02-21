import React, { useState, useEffect } from 'react';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Coupon List';

const defaultForm = {
  code: '',
  type: 'percentage',
  amount: '',
  minimum_amount: '',
  quantity: '',
  expired_date: '',
};

const CouponList = () => {
  const [entities, setEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [addForm, setAddForm] = useState({ ...defaultForm });
  const [editForm, setEditForm] = useState({ ...defaultForm, id: null });
  const [submitting, setSubmitting] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('coupons/list');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load coupons');
    } finally {
      setIsLoading(false);
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

  const openEdit = (row) => {
    setEditForm({
      id: row.id,
      code: row.code || '',
      type: row.type || 'percentage',
      amount: row.amount != null ? String(row.amount) : '',
      minimum_amount: row.minimum_amount != null ? String(row.minimum_amount) : '',
      quantity: row.quantity != null ? String(row.quantity) : '',
      expired_date: row.expired_date || '',
    });
    setShowEditModal(true);
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditForm({ ...defaultForm, id: null });
  };

  const generateCode = async (forEdit = false) => {
    setGenLoading(true);
    try {
      const res = await api.get('coupons/gencode');
      const code = typeof res?.data === 'string' ? res.data : res?.data?.code || '';
      if (forEdit) {
        setEditForm((prev) => ({ ...prev, code }));
      } else {
        setAddForm((prev) => ({ ...prev, code }));
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to generate code');
    } finally {
      setGenLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      code: addForm.code.trim(),
      type: addForm.type,
      amount: parseFloat(addForm.amount) || 0,
      minimum_amount: addForm.type === 'fixed' ? (parseFloat(addForm.minimum_amount) || 0) : 0,
      quantity: parseInt(addForm.quantity, 10) || 1,
      expired_date: addForm.expired_date || null,
    };
    if (!payload.code) {
      msg.error('Coupon code is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('coupons/store', payload);
      const data = res?.data;
      if (data?.status === 200) {
        msg.success(data?.message || 'Coupon created');
        closeAdd();
        fetchData();
      } else {
        msg.error(data?.message || 'Create failed');
      }
    } catch (err) {
      const m = err?.response?.data?.message || err?.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(' ')
        : 'Failed to create coupon';
      msg.error(m);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.id) return;
    const payload = {
      code: editForm.code.trim(),
      type: editForm.type,
      amount: parseFloat(editForm.amount) || 0,
      minimum_amount: editForm.type === 'fixed' ? (parseFloat(editForm.minimum_amount) || 0) : 0,
      quantity: parseInt(editForm.quantity, 10) || 0,
      expired_date: editForm.expired_date || null,
    };
    if (!payload.code) {
      msg.error('Coupon code is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.put('coupons/update/' + editForm.id, payload);
      const data = res?.data;
      if (data?.status === 200) {
        msg.success(data?.message || 'Coupon updated');
        closeEdit();
        fetchData();
      } else {
        msg.error(data?.message || 'Update failed');
      }
    } catch (err) {
      const m = err?.response?.data?.message || (err?.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(' ')
        : 'Failed to update coupon');
      msg.error(m);
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
      const res = await api.delete('coupons/delete/' + itemToDelete.id);
      const data = res?.data;
      if (data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Coupon deleted');
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
        <div className="mb-2">
          <button type="button" className="btn btn-info" onClick={openAdd}>
            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Coupon
          </button>
        </div>

        <div className="table-responsive">
          {isLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : (
            <table className="table table-bordered table-hover table-striped">
              <thead className="thead-light">
                <tr>
                  <th>Coupon Code</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Minimum Amount</th>
                  <th className="text-right">Qty</th>
                  <th className="text-center">Available</th>
                  <th>Expired Date</th>
                  <th>Created By</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-muted">
                      No coupons found.
                    </td>
                  </tr>
                ) : (
                  entities.map((row) => (
                    <tr key={row.id}>
                      <td>{row.code || '-'}</td>
                      <td>
                        <span className={`badge ${row.type === 'percentage' ? 'badge-primary' : 'badge-info'}`}>
                          {row.type === 'percentage' ? 'percentage' : 'fixed'}
                        </span>
                      </td>
                      <td className="text-right">{row.amount != null ? Number(row.amount) : '-'}</td>
                      <td className="text-right">
                        {row.minimum_amount != null && row.minimum_amount !== 0 ? Number(row.minimum_amount) : 'N/A'}
                      </td>
                      <td className="text-right">{row.quantity != null ? row.quantity : '-'}</td>
                      <td className="text-center">
                        <span className={`badge ${row.available > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {row.available != null ? row.available : '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${row.is_expired ? 'badge-danger' : 'badge-success'}`}>
                          {row.expired_date_formatted || row.expired_date || 'N/A'}
                        </span>
                      </td>
                      <td>{row.created_by || '-'}</td>
                      <td className="text-center">
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

      {/* Add Coupon Modal */}
      <FormModal moduleName="Add Coupon" modalState={showAddModal} toggleFormModal={closeAdd} width="560px">
        <div className="modal-body">
          <p className="italic small text-muted">The field labels marked with * are required.</p>
          <form onSubmit={handleAddSubmit}>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Coupon Code *</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={addForm.code}
                    onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value }))}
                    required
                  />
                  <div className="input-group-append">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => generateCode(false)} disabled={genLoading}>
                      {genLoading ? '...' : 'Generate'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-6 form-group">
                <label>Type *</label>
                <select
                  className="form-control"
                  value={addForm.type}
                  onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              {addForm.type === 'fixed' && (
                <div className="col-md-6 form-group">
                  <label>Minimum Amount *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    value={addForm.minimum_amount}
                    onChange={(e) => setAddForm((f) => ({ ...f, minimum_amount: e.target.value }))}
                  />
                </div>
              )}
              <div className="col-md-6 form-group">
                <label>Amount *</label>
                <div className="input-group">
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    value={addForm.amount}
                    onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                  <div className="input-group-append align-items-center pl-2">
                    <span>{addForm.type === 'percentage' ? '%' : '$'}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-6 form-group">
                <label>Qty *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="form-control"
                  value={addForm.quantity}
                  onChange={(e) => setAddForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Expired Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={addForm.expired_date}
                  onChange={(e) => setAddForm((f) => ({ ...f, expired_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group mb-0">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </FormModal>

      {/* Edit Coupon Modal */}
      <FormModal moduleName="Update Coupon" modalState={showEditModal} toggleFormModal={closeEdit} width="560px">
        <div className="modal-body">
          <p className="italic small text-muted">The field labels marked with * are required.</p>
          <form onSubmit={handleEditSubmit}>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Coupon Code *</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.code}
                    onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                    required
                  />
                  <div className="input-group-append">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => generateCode(true)} disabled={genLoading}>
                      {genLoading ? '...' : 'Generate'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-6 form-group">
                <label>Type *</label>
                <select
                  className="form-control"
                  value={editForm.type}
                  onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              {editForm.type === 'fixed' && (
                <div className="col-md-6 form-group">
                  <label>Minimum Amount *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    value={editForm.minimum_amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, minimum_amount: e.target.value }))}
                  />
                </div>
              )}
              <div className="col-md-6 form-group">
                <label>Amount *</label>
                <div className="input-group">
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                  <div className="input-group-append align-items-center pl-2">
                    <span>{editForm.type === 'percentage' ? '%' : '$'}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-6 form-group">
                <label>Qty *</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="form-control"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Expired Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editForm.expired_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, expired_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group mb-0">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Updating...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </FormModal>

      {/* Delete confirm */}
      <FormModal
        moduleName="Confirm delete"
        modalState={deleteDialog}
        toggleFormModal={() => {
          setDeleteDialog(false);
          setItemToDelete(null);
        }}
        width="420px"
      >
        <div className="modal-body">
          <p>
            Are you sure you want to delete coupon <strong>"{itemToDelete?.code}"</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setDeleteDialog(false);
              setItemToDelete(null);
            }}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" /> Delete
          </button>
        </div>
      </FormModal>
    </div>
  );
};

export default CouponList;
