import React, { useState, useEffect } from 'react';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Courier List';

const defaultForm = {
  name: '',
  phone_number: '',
  address: '',
  api_key: '',
  secret_key: '',
};

const CourierList = () => {
  const [entities, setEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [addForm, setAddForm] = useState({ ...defaultForm });
  const [editForm, setEditForm] = useState({ ...defaultForm, id: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('couriers/list');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load couriers');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setAddForm({ ...defaultForm });
    setShowAddModal(true);
  };

  const closeAdd = () => {
    setShowAddModal(false);
    setAddForm({ ...defaultForm });
  };

  const openEdit = async (row) => {
    try {
      const res = await api.get('couriers/edit/' + row.id);
      const d = res?.data?.data;
      if (!d) return;
      setEditForm({
        id: d.id,
        name: d.name || '',
        phone_number: d.phone_number || '',
        address: d.address || '',
        api_key: d.api_key || '',
        secret_key: d.secret_key || '',
      });
      setShowEditModal(true);
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load courier');
    }
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditForm({ ...defaultForm, id: null });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: addForm.name.trim(),
      phone_number: addForm.phone_number.trim(),
      address: addForm.address.trim(),
      api_key: addForm.api_key.trim() || null,
      secret_key: addForm.secret_key.trim() || null,
    };
    if (!payload.name || !payload.phone_number || !payload.address) {
      msg.error('Name, Phone Number and Address are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('couriers/store', payload);
      const data = res?.data;
      if (data?.status === 200) {
        msg.success(data?.message || 'Courier created');
        closeAdd();
        fetchData();
      } else {
        msg.error(data?.message || 'Create failed');
      }
    } catch (err) {
      const m = err?.response?.data?.message || (err?.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(' ')
        : 'Failed to create courier');
      msg.error(m);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.id) return;
    const payload = {
      name: editForm.name.trim(),
      phone_number: editForm.phone_number.trim(),
      address: editForm.address.trim(),
      api_key: editForm.api_key.trim() || null,
      secret_key: editForm.secret_key.trim() || null,
    };
    if (!payload.name || !payload.phone_number || !payload.address) {
      msg.error('Name, Phone Number and Address are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.put('couriers/update/' + editForm.id, payload);
      const data = res?.data;
      if (data?.status === 200) {
        msg.success(data?.message || 'Courier updated');
        closeEdit();
        fetchData();
      } else {
        msg.error(data?.message || 'Update failed');
      }
    } catch (err) {
      const m = err?.response?.data?.message || (err?.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(' ')
        : 'Failed to update courier');
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
      const res = await api.delete('couriers/delete/' + itemToDelete.id);
      const data = res?.data;
      if (data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Courier deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const isSteadFast = editForm.name && editForm.name.toLowerCase() === 'steadfast';

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="container-fluid">
        <div className="mb-2">
          <button type="button" className="btn btn-info" onClick={openAdd}>
            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Courier
          </button>
        </div>

        <div className="table-responsive">
          {isLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : (
            <table className="table table-bordered table-hover table-striped">
              <thead className="thead-light">
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th>API Key</th>
                  <th>Secret Key</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      No couriers found.
                    </td>
                  </tr>
                ) : (
                  entities.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || '-'}</td>
                      <td>{row.phone_number || '-'}</td>
                      <td>{row.address || '-'}</td>
                      <td>{row.api_key_display || '-'}</td>
                      <td>{row.secret_key_display || '-'}</td>
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

      {/* Add Courier Modal */}
      <FormModal moduleName="Add Courier" modalState={showAddModal} toggleFormModal={closeAdd} width="560px">
        <div className="modal-body">
          <p className="italic small text-muted">The field labels marked with * are required.</p>
          <form onSubmit={handleAddSubmit}>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Phone Number *</label>
                <input
                  type="text"
                  className="form-control"
                  value={addForm.phone_number}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone_number: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-12 form-group">
                <label>Address *</label>
                <input
                  type="text"
                  className="form-control"
                  value={addForm.address}
                  onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-12 form-group">
                <label>API Key</label>
                <input
                  type="text"
                  className="form-control"
                  value={addForm.api_key}
                  onChange={(e) => setAddForm((f) => ({ ...f, api_key: e.target.value }))}
                />
              </div>
              <div className="col-md-12 form-group">
                <label>Secret Key</label>
                <input
                  type="text"
                  className="form-control"
                  value={addForm.secret_key}
                  onChange={(e) => setAddForm((f) => ({ ...f, secret_key: e.target.value }))}
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

      {/* Edit Courier Modal */}
      <FormModal moduleName="Update Courier" modalState={showEditModal} toggleFormModal={closeEdit} width="560px">
        <div className="modal-body">
          <p className="italic small text-muted">The field labels marked with * are required.</p>
          <form onSubmit={handleEditSubmit}>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  readOnly={isSteadFast}
                  disabled={isSteadFast}
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Phone Number *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone_number: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-12 form-group">
                <label>Address *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-12 form-group">
                <label>API Key</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.api_key}
                  onChange={(e) => setEditForm((f) => ({ ...f, api_key: e.target.value }))}
                />
              </div>
              <div className="col-md-12 form-group">
                <label>Secret Key</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.secret_key}
                  onChange={(e) => setEditForm((f) => ({ ...f, secret_key: e.target.value }))}
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
        toggleFormModal={() => { setDeleteDialog(false); setItemToDelete(null); }}
        width="420px"
      >
        <div className="modal-body">
          <p>
            Are you sure you want to delete courier <strong>"{itemToDelete?.name}"</strong>?
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

export default CourierList;
