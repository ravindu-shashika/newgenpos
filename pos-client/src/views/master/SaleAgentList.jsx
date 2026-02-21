import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';
import Pagination from '../../components/Pagination';

const moduleName = 'Sale Agent List';

const defaultSalesTargetRow = () => ({ sales_from: '', sales_to: '', percent: '' });

const defaultForm = {
  name: '',
  email: '',
  phone_number: '',
  address: '',
  city: '',
  country: '',
  department_id: '0',
  sales_target: [defaultSalesTargetRow()],
  addUser: false,
  username: '',
  password: '',
  role_id: '',
  warehouse_id: '',
  biller_id: '',
};

function validateSalesTargets(rows) {
  let prevTo = null;
  for (let i = 0; i < rows.length; i++) {
    const from = parseFloat(rows[i].sales_from) || 0;
    const to = parseFloat(rows[i].sales_to) || 0;
    if (to !== 0 && from >= to) return false;
    if (prevTo !== null && from !== 0 && from <= prevTo) return false;
    prevTo = to;
  }
  return true;
}

const SaleAgentList = () => {
  const [entities, setEntities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [billers, setBillers] = useState([]);
  const [form, setForm] = useState({ ...defaultForm });
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
      const res = await api.get('sale-agents/list');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load sale agents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const res = await api.get('sale-agents/form-data');
      const data = res?.data;
      if (data?.status === 200) {
        setDepartments(data.departments || []);
        setRoles(data.roles || []);
        setWarehouses(data.warehouses || []);
        setBillers(data.billers || []);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load form data');
    }
  };

  const openAdd = () => {
    setForm({
      ...defaultForm,
      sales_target: [defaultSalesTargetRow()],
    });
    setSelectedId(null);
    setShowAddModal(true);
  };

  const hideAddModal = () => {
    setShowAddModal(false);
    setForm({ ...defaultForm });
  };

  const openEdit = async (row) => {
    try {
      const res = await api.get('sale-agents/get/' + row.id);
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        const c = data.data;
        const targets = Array.isArray(c.sales_target) && c.sales_target.length
          ? c.sales_target.map((t) => ({
              sales_from: t.sales_from != null ? String(t.sales_from) : '',
              sales_to: t.sales_to != null ? String(t.sales_to) : '',
              percent: t.percent != null ? String(t.percent) : '',
            }))
          : [defaultSalesTargetRow()];
        setForm({
          name: c.name ?? '',
          email: c.email ?? '',
          phone_number: c.phone_number ?? '',
          address: c.address ?? '',
          city: c.city ?? '',
          country: c.country ?? '',
          department_id: c.department_id != null ? String(c.department_id) : '0',
          sales_target: targets,
          addUser: false,
          username: '',
          password: '',
          role_id: '',
          warehouse_id: '',
          biller_id: '',
        });
        setSelectedId(row.id);
        setShowEditModal(true);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load sale agent');
    }
  };

  const hideEditModal = () => {
    setShowEditModal(false);
    setForm({ ...defaultForm });
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const checked = e.target.type === 'checkbox' ? e.target.checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: checked !== undefined ? checked : value,
    }));
  };

  const updateSalesTargetRow = (index, field, value) => {
    setForm((prev) => {
      const next = [...(prev.sales_target || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, sales_target: next };
    });
  };

  const addSalesTargetRow = () => {
    setForm((prev) => ({
      ...prev,
      sales_target: [...(prev.sales_target || []), defaultSalesTargetRow()],
    }));
  };

  const removeSalesTargetRow = (index) => {
    setForm((prev) => {
      const next = (prev.sales_target || []).filter((_, i) => i !== index);
      if (next.length === 0) next.push(defaultSalesTargetRow());
      return { ...prev, sales_target: next };
    });
  };

  const buildPayload = (isEdit) => {
    const targets = (form.sales_target || [])
      .map((r) => ({
        sales_from: r.sales_from ? parseFloat(r.sales_from) : null,
        sales_to: r.sales_to ? parseFloat(r.sales_to) : null,
        percent: r.percent ? parseFloat(r.percent) : null,
      }))
      .filter((r) => r.sales_from != null || r.sales_to != null || r.percent != null);
    const payload = {
      name: form.name.trim(),
      email: form.email?.trim() || '',
      phone_number: form.phone_number.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      country: form.country?.trim() || '',
      department_id: form.department_id ? parseInt(form.department_id, 10) : 0,
      sales_target: targets,
    };
    if (!isEdit && form.addUser) {
      payload.user = 1;
      payload.username = form.username?.trim() || '';
      payload.password = form.password || '';
      payload.role_id = form.role_id ? parseInt(form.role_id, 10) : null;
      if (form.warehouse_id) payload.warehouse_id = parseInt(form.warehouse_id, 10);
      if (form.biller_id) payload.biller_id = parseInt(form.biller_id, 10);
    }
    return payload;
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      msg.error('Name is required');
      return;
    }
    if (!form.phone_number?.trim()) {
      msg.error('Phone number is required');
      return;
    }
    if (!form.address?.trim()) {
      msg.error('Address is required');
      return;
    }
    if (!form.city?.trim()) {
      msg.error('City is required');
      return;
    }
    if (!validateSalesTargets(form.sales_target || [])) {
      msg.error('Sales target: From must be less than To, and each From must be greater than previous To.');
      return;
    }
    if (form.addUser && (!form.username?.trim() || !form.password || !form.role_id)) {
      msg.error('Username, password and role are required when adding user.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload(false);
      const res = await api.post('sale-agents/store').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Sale agent created');
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
    if (!form.name?.trim()) {
      msg.error('Name is required');
      return;
    }
    if (!form.phone_number?.trim()) {
      msg.error('Phone number is required');
      return;
    }
    if (!form.address?.trim()) {
      msg.error('Address is required');
      return;
    }
    if (!form.city?.trim()) {
      msg.error('City is required');
      return;
    }
    if (!validateSalesTargets(form.sales_target || [])) {
      msg.error('Sales target: From must be less than To, and each From must be greater than previous To.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload(true);
      const res = await api.put('sale-agents/update', selectedId).values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Sale agent updated');
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
      const res = await api.delete('sale-agents/delete/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Sale agent deleted');
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

  const renderSalesTargetSection = () => (
    <div className="col-md-12 mt-3 border rounded p-3">
      <h6>Sales Target</h6>
      {(form.sales_target || []).map((row, idx) => (
        <div key={idx} className="row mb-2 align-items-center">
          <div className="col-md-3">
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="Sales From"
              value={row.sales_from}
              onChange={(e) => updateSalesTargetRow(idx, 'sales_from', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="Sales To"
              value={row.sales_to}
              onChange={(e) => updateSalesTargetRow(idx, 'sales_to', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              type="number"
              step="0.01"
              className="form-control form-control-sm"
              placeholder="Commission %"
              value={row.percent}
              onChange={(e) => updateSalesTargetRow(idx, 'percent', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <button type="button" className="btn btn-sm btn-danger" onClick={() => removeSalesTargetRow(idx)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-success mt-2" onClick={addSalesTargetRow}>
        <SafeFontAwesomeIcon icon={faPlus} className="mr-1" size="sm" /> Add More
      </button>
    </div>
  );

  const renderUserSection = () => (
    <>
      <div className="col-md-12 mt-3">
        <div className="form-check">
          <input
            type="checkbox"
            name="addUser"
            id="addUser"
            className="form-check-input"
            checked={form.addUser || false}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="addUser">
            Add User (sale agent can login with username/password)
          </label>
        </div>
      </div>
      {form.addUser && (
        <>
          <div className="col-md-4 form-group">
            <label>Username <span className="text-danger">*</span></label>
            <input type="text" name="username" className="form-control" value={form.username} onChange={handleChange} />
          </div>
          <div className="col-md-4 form-group">
            <label>Password <span className="text-danger">*</span></label>
            <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} />
          </div>
          <div className="col-md-4 form-group">
            <label>Role <span className="text-danger">*</span></label>
            <select name="role_id" className="form-control" value={form.role_id} onChange={handleChange} required={form.addUser}>
              <option value="">Select...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 form-group">
            <label>Warehouse</label>
            <select name="warehouse_id" className="form-control" value={form.warehouse_id} onChange={handleChange}>
              <option value="">Select...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 form-group">
            <label>Biller</label>
            <select name="biller_id" className="form-control" value={form.biller_id} onChange={handleChange}>
              <option value="">Select...</option>
              {billers.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.company_name || ''})</option>
              ))}
            </select>
          </div>
        </>
      )}
    </>
  );

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="container-fluid">
        <button type="button" className="btn btn-info mr-2" onClick={openAdd}>
          <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Sale Agent
        </button>
      </div>

      <FormModal moduleName="Add Sale Agent" modalState={showAddModal} toggleFormModal={hideAddModal} width="800px">
        <form onSubmit={handleSubmitAdd}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="row">
              <div className="col-md-4 form-group">
                <label>Name <span className="text-danger">*</span></label>
                <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Email</label>
                <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Phone Number <span className="text-danger">*</span></label>
                <input type="text" name="phone_number" className="form-control" value={form.phone_number} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Address <span className="text-danger">*</span></label>
                <input type="text" name="address" className="form-control" value={form.address} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>City <span className="text-danger">*</span></label>
                <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Country</label>
                <input type="text" name="country" className="form-control" value={form.country} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Department</label>
                <select name="department_id" className="form-control" value={form.department_id} onChange={handleChange}>
                  <option value="0">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {renderSalesTargetSection()}
              {renderUserSection()}
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

      <FormModal moduleName="Update Sale Agent" modalState={showEditModal} toggleFormModal={hideEditModal} width="800px">
        <form onSubmit={handleSubmitEdit}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="row">
              <div className="col-md-4 form-group">
                <label>Name <span className="text-danger">*</span></label>
                <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Email</label>
                <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Phone Number <span className="text-danger">*</span></label>
                <input type="text" name="phone_number" className="form-control" value={form.phone_number} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Address <span className="text-danger">*</span></label>
                <input type="text" name="address" className="form-control" value={form.address} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>City <span className="text-danger">*</span></label>
                <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Country</label>
                <input type="text" name="country" className="form-control" value={form.country} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Department</label>
                <select name="department_id" className="form-control" value={form.department_id} onChange={handleChange}>
                  <option value="0">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {renderSalesTargetSection()}
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
                <p>Are you sure you want to delete sale agent <strong>"{itemToDelete?.name}"</strong>?</p>
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
                  <th>Image</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Address</th>
                  <th>Staff Id</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.image_url ? (
                        <img src={row.image_url} alt="" height="50" width="50" style={{ objectFit: 'cover' }} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{row.name ?? '—'}</td>
                    <td>{row.email ?? '—'}</td>
                    <td>{row.phone_number ?? '—'}</td>
                    <td>{row.department_name ?? '—'}</td>
                    <td>{row.address ?? '—'}</td>
                    <td>{row.staff_id ?? '—'}</td>
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

export default SaleAgentList;
