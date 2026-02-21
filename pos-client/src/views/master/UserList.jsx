import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';
import Pagination from '../../components/Pagination';

const moduleName = 'User List';

const defaultForm = {
  name: '',
  email: '',
  password: '',
  phone_number: '',
  company_name: '',
  role_id: '',
  is_active: true,
};

const UserList = () => {
  const [entities, setEntities] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);

  useEffect(() => {
    fetchData();
    fetchFormData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('users/list');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const res = await api.get('users/form-data');
      const data = res?.data;
      if (data?.status === 200 && data?.roles) {
        setRoles(data.roles);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load form data');
    }
  };

  const handleToggleStatus = async (row) => {
    const newActive = !row.is_active;
    try {
      const res = await api.post('user/toggle-status').values({ id: row.id, is_active: newActive ? 1 : 0 });
      const data = res?.data;
      if (data?.success) {
        msg.success(data?.message || 'Status updated');
        setEntities((prev) =>
          prev.map((e) => (e.id === row.id ? { ...e, is_active: newActive } : e))
        );
      } else {
        msg.error(data?.message || 'Failed to update status');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const openAdd = () => {
    setForm({ ...defaultForm, password: '' });
    setSelectedId(null);
    setShowAddModal(true);
  };

  const hideAddModal = () => {
    setShowAddModal(false);
    setForm(defaultForm);
  };

  const openEdit = async (row) => {
    try {
      const res = await api.get('users/edit/' + row.id);
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        const u = data.data;
        setForm({
          name: u.name ?? '',
          email: u.email ?? '',
          password: '',
          phone_number: u.phone ?? '',
          company_name: u.company_name ?? '',
          role_id: u.role_id ?? '',
          is_active: !!u.is_active,
        });
        setSelectedId(row.id);
        setShowEditModal(true);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load user');
    }
  };

  const hideEditModal = () => {
    setShowEditModal(false);
    setForm(defaultForm);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isCheck = e.target.type === 'checkbox';
    setForm((prev) => ({ ...prev, [name]: isCheck ? e.target.checked : value }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.email?.trim() || !form.password || !form.phone_number?.trim() || !form.role_id) {
      msg.error('Name, Email, Password, Phone and Role are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone_number: form.phone_number.trim(),
        company_name: form.company_name?.trim() || '',
        role_id: Number(form.role_id),
        is_active: form.is_active,
      };
      const res = await api.post('users/store').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'User created');
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
    if (!selectedId || !form.name?.trim() || !form.email?.trim() || !form.phone_number?.trim() || !form.role_id) {
      msg.error('Name, Email, Phone and Role are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone_number.trim(),
        company_name: form.company_name?.trim() || '',
        role_id: Number(form.role_id),
        is_active: form.is_active,
      };
      if (form.password) payload.password = form.password;
      const res = await api.put('users', selectedId).values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'User updated');
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
      const res = await api.delete('users/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'User deleted');
        if (data.logout) {
          window.location.href = '/login';
        }
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
          <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add User
        </button>
      </div>

      <FormModal moduleName="Add User" modalState={showAddModal} toggleFormModal={hideAddModal} width="520px">
        <form onSubmit={handleSubmitAdd}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="form-group">
              <label>Username <span className="text-danger">*</span></label>
              <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password <span className="text-danger">*</span></label>
              <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Email <span className="text-danger">*</span></label>
              <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number <span className="text-danger">*</span></label>
              <input type="text" name="phone_number" className="form-control" value={form.phone_number} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" name="company_name" className="form-control" value={form.company_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Role <span className="text-danger">*</span></label>
              <select name="role_id" className="form-control" value={form.role_id} onChange={handleChange} required>
                <option value="">Select role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideAddModal}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>Submit</button>
          </div>
        </form>
      </FormModal>

      <FormModal moduleName="Update User" modalState={showEditModal} toggleFormModal={hideEditModal} width="520px">
        <form onSubmit={handleSubmitEdit}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required. Leave password blank to keep current.</p>
            <div className="form-group">
              <label>Username <span className="text-danger">*</span></label>
              <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Change Password</label>
              <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} minLength={6} placeholder="Leave blank to keep" />
            </div>
            <div className="form-group">
              <label>Email <span className="text-danger">*</span></label>
              <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number <span className="text-danger">*</span></label>
              <input type="text" name="phone_number" className="form-control" value={form.phone_number} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" name="company_name" className="form-control" value={form.company_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Role <span className="text-danger">*</span></label>
              <select name="role_id" className="form-control" value={form.role_id} onChange={handleChange} required>
                <option value="">Select role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active
              </label>
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
                <p>Are you sure you want to delete user <strong>"{itemToDelete?.name}"</strong>?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteDialog(false)}>Cancel</button>
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
                  <th>Username</th>
                  <th>Email</th>
                  <th>Company Name</th>
                  <th>Phone Number</th>
                  <th>Role</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name ?? '—'}</td>
                    <td>{row.email ?? '—'}</td>
                    <td>{row.company_name ?? '—'}</td>
                    <td>{row.phone ?? '—'}</td>
                    <td>{row.role_name ?? '—'}</td>
                    <td className="text-center">
                      <div className="custom-control custom-switch d-inline-block">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id={`switch_${row.id}`}
                          checked={!!row.is_active}
                          onChange={() => handleToggleStatus(row)}
                        />
                        <label className="custom-control-label" htmlFor={`switch_${row.id}`} />
                      </div>
                    </td>
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
            </table>
            {totalPages > 1 && (
              <Pagination rowsPerPage={rowsPerPage} totalRows={entities.length} paginate={setCurrentPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserList;
