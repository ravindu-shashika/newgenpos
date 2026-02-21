import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';
import Pagination from '../../components/Pagination';

const moduleName = 'Account List';

const defaultForm = {
  account_no: '',
  name: '',
  initial_balance: '',
  note: '',
};

const AccountList = () => {
  const [entities, setEntities] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('accounts');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setForm(defaultForm);
    setIsEdit(false);
    setSelectedId(null);
    setShowAddModal(true);
  };

  const hideAddModal = () => {
    setShowAddModal(false);
    setForm(defaultForm);
    setIsEdit(false);
    setSelectedId(null);
  };

  const openEdit = (row) => {
    setForm({
      account_no: row.account_no ?? '',
      name: row.name ?? '',
      initial_balance: row.initial_balance != null ? String(row.initial_balance) : '',
      note: row.note ?? '',
    });
    setSelectedId(row.id);
    setIsEdit(true);
    setShowModal(true);
  };

  const hideEditModal = () => {
    setShowModal(false);
    setForm(defaultForm);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSetDefault = async (row) => {
    if (row.is_default) {
      msg.warning('Please make another account default first!');
      return;
    }
    try {
      const res = await api.post('accounts/' + row.id + '/make-default').values({});
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Account set as default');
        fetchData();
      } else {
        msg.error(data?.message || 'Failed to set default');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to set default');
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      msg.error('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        account_no: form.account_no?.trim() || null,
        name: form.name.trim(),
        initial_balance: form.initial_balance !== '' ? parseFloat(form.initial_balance) : null,
        note: form.note?.trim() || null,
      };
      const res = await api.post('accounts').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Account created');
        hideAddModal();
        fetchData();
      } else {
        msg.error(data?.message || (data?.errors ? Object.values(data.errors).flat().join(' ') : 'Create failed'));
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
    if (!form.name?.trim()) {
      msg.error('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        account_no: form.account_no?.trim() || null,
        name: form.name.trim(),
        initial_balance: form.initial_balance !== '' ? parseFloat(form.initial_balance) : null,
        note: form.note?.trim() || null,
      };
      const res = await api.post('accounts/' + selectedId).values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Account updated');
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
      const res = await api.delete('accounts/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Account deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const currentRows = entities.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(entities.length / rowsPerPage);

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="container-fluid">
        <button type="button" className="btn btn-info" onClick={openAdd}>
          <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Account
        </button>
      </div>

      {/* Add Account Modal */}
      <FormModal
        moduleName="Add Account"
        modalState={showAddModal}
        toggleFormModal={hideAddModal}
        width="520px"
      >
        <form onSubmit={handleSubmitAdd}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="form-group">
              <label>Account No</label>
              <input
                type="text"
                name="account_no"
                className="form-control"
                value={form.account_no}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Name <span className="text-danger">*</span></label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Initial Balance</label>
              <input
                type="number"
                name="initial_balance"
                step="any"
                className="form-control"
                value={form.initial_balance}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Note</label>
              <textarea name="note" rows={3} className="form-control" value={form.note} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideAddModal}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Save
            </button>
          </div>
        </form>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        moduleName="Update Account"
        modalState={showModal}
        toggleFormModal={hideEditModal}
        width="520px"
      >
        <form onSubmit={handleSubmitEdit}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="form-group">
              <label>Account No</label>
              <input
                type="text"
                name="account_no"
                className="form-control"
                value={form.account_no}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Name <span className="text-danger">*</span></label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Initial Balance</label>
              <input
                type="number"
                name="initial_balance"
                step="any"
                className="form-control"
                value={form.initial_balance}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Note</label>
              <textarea name="note" rows={3} className="form-control" value={form.note} onChange={handleChange} />
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
                <p>Are you sure you want to delete account <strong>"{itemToDelete?.name}"</strong>?</p>
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
                  <th>Account No</th>
                  <th>Name</th>
                  <th>Initial Balance</th>
                  <th>Available Balance</th>
                  <th>Default</th>
                  <th>Note</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.account_no ?? '—'}</td>
                    <td>{row.name ?? '—'}</td>
                    <td>{row.initial_balance_formatted ?? '0'}</td>
                    <td>{row.balance_formatted ?? '0'}</td>
                    <td>
                      <label className="mb-0">
                        <input
                          type="checkbox"
                          checked={!!row.is_default}
                          onChange={() => handleSetDefault(row)}
                        />
                        {row.is_default ? ' Default' : ' Set default'}
                      </label>
                    </td>
                    <td>{row.note ? (String(row.note).length > 40 ? String(row.note).slice(0, 40) + '…' : row.note) : '—'}</td>
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
            </table>
            {totalPages > 1 && (
              <Pagination
                rowsPerPage={rowsPerPage}
                totalRows={entities.length}
                paginate={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AccountList;
