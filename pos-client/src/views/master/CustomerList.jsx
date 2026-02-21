import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';
import Pagination from '../../components/Pagination';

const moduleName = 'Customer List';

const defaultForm = {
  customer_group_id: '',
  customer_name: '',
  company_name: '',
  email: '',
  phone_number: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  opening_balance: '0',
  deposit: '0',
  credit_limit: '0',
  type: '',
};

const CustomerList = () => {
  const [entities, setEntities] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);

  useEffect(() => {
    fetchData();
    fetchFormData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const url = search ? `customers/list?search=${encodeURIComponent(search)}` : 'customers/list';
      const res = await api.get(url);
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const res = await api.get('customers/form-data');
      const data = res?.data;
      if (data?.status === 200 && data?.customer_groups) {
        setCustomerGroups(data.customer_groups);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load form data');
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

  const openEdit = async (row) => {
    try {
      const res = await api.get('customers/' + row.id);
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        const c = data.data;
        setForm({
          customer_group_id: c.customer_group_id ?? '',
          customer_name: c.name ?? c.customer_name ?? '',
          company_name: c.company_name ?? '',
          email: c.email ?? '',
          phone_number: c.phone_number ?? '',
          address: c.address ?? '',
          city: c.city ?? '',
          state: c.state ?? '',
          postal_code: c.postal_code ?? '',
          country: c.country ?? '',
          opening_balance: c.opening_balance != null ? String(c.opening_balance) : '0',
          deposit: c.deposit != null ? String(c.deposit) : '0',
          credit_limit: c.credit_limit != null ? String(c.credit_limit) : '0',
          type: c.type ?? '',
        });
        setSelectedId(row.id);
        setShowEditModal(true);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load customer');
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

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!form.customer_name?.trim()) {
      msg.error('Name is required');
      return;
    }
    if (!form.phone_number?.trim()) {
      msg.error('Phone number is required');
      return;
    }
    if (!form.customer_group_id) {
      msg.error('Customer group is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer_group_id: Number(form.customer_group_id),
        customer_name: form.customer_name.trim(),
        company_name: form.company_name?.trim() || '',
        email: form.email?.trim() || '',
        phone_number: form.phone_number.trim(),
        address: form.address?.trim() || '',
        city: form.city?.trim() || '',
        state: form.state?.trim() || '',
        postal_code: form.postal_code?.trim() || '',
        country: form.country?.trim() || '',
        opening_balance: form.opening_balance !== '' ? parseFloat(form.opening_balance) : 0,
        deposit: form.deposit !== '' ? parseFloat(form.deposit) : 0,
        credit_limit: form.credit_limit !== '' ? parseFloat(form.credit_limit) : 0,
      };
      const res = await api.post('customers/store').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Customer created');
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
    if (!form.customer_name?.trim()) {
      msg.error('Name is required');
      return;
    }
    if (!form.phone_number?.trim()) {
      msg.error('Phone number is required');
      return;
    }
    if (!form.customer_group_id) {
      msg.error('Customer group is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer_group_id: Number(form.customer_group_id),
        customer_name: form.customer_name.trim(),
        company_name: form.company_name?.trim() || '',
        email: form.email?.trim() || '',
        phone_number: form.phone_number.trim(),
        address: form.address?.trim() || '',
        city: form.city?.trim() || '',
        state: form.state?.trim() || '',
        postal_code: form.postal_code?.trim() || '',
        country: form.country?.trim() || '',
        opening_balance: form.opening_balance !== '' ? parseFloat(form.opening_balance) : 0,
        deposit: form.deposit !== '' ? parseFloat(form.deposit) : 0,
        credit_limit: form.credit_limit !== '' ? parseFloat(form.credit_limit) : 0,
        type: form.type || undefined,
      };
      const res = await api.put('customers', selectedId).values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Customer updated');
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
      const res = await api.delete('customers/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Customer deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
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
        <button type="button" className="btn btn-info mr-2" onClick={openAdd}>
          <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Customer
        </button>
        <div className="d-inline-block">
          <input
            type="text"
            className="form-control form-control-sm d-inline-block"
            style={{ width: '200px' }}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button type="button" className="btn btn-sm btn-secondary ml-1" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      <FormModal
        moduleName="Add Customer"
        modalState={showAddModal}
        toggleFormModal={hideAddModal}
        width="640px"
      >
        <form onSubmit={handleSubmitAdd}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Customer Group <span className="text-danger">*</span></label>
                <select
                  name="customer_group_id"
                  className="form-control"
                  value={form.customer_group_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select...</option>
                  {customerGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Name <span className="text-danger">*</span></label>
                <input type="text" name="customer_name" className="form-control" value={form.customer_name} onChange={handleChange} required />
              </div>
              <div className="col-md-6 form-group">
                <label>Company Name</label>
                <input type="text" name="company_name" className="form-control" value={form.company_name} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Email</label>
                <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Phone Number <span className="text-danger">*</span></label>
                <input type="text" name="phone_number" className="form-control" value={form.phone_number} onChange={handleChange} required />
              </div>
              <div className="col-md-6 form-group">
                <label>Address</label>
                <input type="text" name="address" className="form-control" value={form.address} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>City</label>
                <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>State</label>
                <input type="text" name="state" className="form-control" value={form.state} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Postal Code</label>
                <input type="text" name="postal_code" className="form-control" value={form.postal_code} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Country</label>
                <input type="text" name="country" className="form-control" value={form.country} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Opening Balance (Due)</label>
                <input type="number" name="opening_balance" step="any" min="0" className="form-control" value={form.opening_balance} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Initial Deposit</label>
                <input type="number" name="deposit" step="0.01" className="form-control" value={form.deposit} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Credit Limit</label>
                <input type="number" name="credit_limit" step="any" min="0" className="form-control" value={form.credit_limit} onChange={handleChange} />
              </div>
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

      <FormModal
        moduleName="Update Customer"
        modalState={showEditModal}
        toggleFormModal={hideEditModal}
        width="640px"
      >
        <form onSubmit={handleSubmitEdit}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required.</p>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Customer Group <span className="text-danger">*</span></label>
                <select
                  name="customer_group_id"
                  className="form-control"
                  value={form.customer_group_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select...</option>
                  {customerGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Name <span className="text-danger">*</span></label>
                <input type="text" name="customer_name" className="form-control" value={form.customer_name} onChange={handleChange} required />
              </div>
              <div className="col-md-6 form-group">
                <label>Company Name</label>
                <input type="text" name="company_name" className="form-control" value={form.company_name} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Email</label>
                <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Phone Number <span className="text-danger">*</span></label>
                <input type="text" name="phone_number" className="form-control" value={form.phone_number} onChange={handleChange} required />
              </div>
              <div className="col-md-6 form-group">
                <label>Address</label>
                <input type="text" name="address" className="form-control" value={form.address} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>City</label>
                <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>State</label>
                <input type="text" name="state" className="form-control" value={form.state} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Postal Code</label>
                <input type="text" name="postal_code" className="form-control" value={form.postal_code} onChange={handleChange} />
              </div>
              <div className="col-md-6 form-group">
                <label>Country</label>
                <input type="text" name="country" className="form-control" value={form.country} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Opening Balance (Due)</label>
                <input type="number" name="opening_balance" step="any" min="0" className="form-control" value={form.opening_balance} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Initial Deposit</label>
                <input type="number" name="deposit" step="0.01" className="form-control" value={form.deposit} onChange={handleChange} />
              </div>
              <div className="col-md-4 form-group">
                <label>Credit Limit</label>
                <input type="number" name="credit_limit" step="any" min="0" className="form-control" value={form.credit_limit} onChange={handleChange} />
              </div>
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
                <p>Are you sure you want to delete customer <strong>"{itemToDelete?.customer_details?.split('\n')[0]}"</strong>?</p>
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
                  <th>Customer Group</th>
                  <th>Customer Details</th>
                  <th>Discount Plan</th>
                  <th>Reward Points</th>
                  <th>Deposited Balance</th>
                  <th>Total Due</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.customer_group ?? '—'}</td>
                    <td style={{ whiteSpace: 'pre-line' }}>{row.customer_details ?? '—'}</td>
                    <td>{row.discount_plan ?? '—'}</td>
                    <td>{row.reward_point ?? 0}</td>
                    <td>{row.deposited_balance_formatted ?? row.deposited_balance ?? '0'}</td>
                    <td>{row.total_due_formatted ?? row.total_due ?? '0'}</td>
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

export default CustomerList;
