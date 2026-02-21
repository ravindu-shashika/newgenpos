import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, ListView, SystemButton, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Warehouse';

const defaultForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
};

const Warehouse = () => {
  const [entities, setEntities] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [showModal, setShowModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const dataColumns = [
    { title: 'Warehouse', name: 'name', searchable: true },
    { title: 'Phone Number', name: 'phone', searchable: false },
    { title: 'Email', name: 'email', searchable: false },
    { title: 'Address', name: 'address', searchable: false },
    { title: 'Number of Product', name: 'number_of_product', searchable: false },
    { title: 'Stock Quantity', name: 'stock_qty', searchable: false },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('warehouses?with_stats=1');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(
          data.data.map((row) => ({
            id: row.id,
            name: row.name,
            phone: row.phone ?? '—',
            email: row.email ?? '—',
            address: row.address ?? '—',
            number_of_product: row.number_of_product ?? '—',
            stock_qty: row.stock_qty != null ? row.stock_qty : '—',
          }))
        );
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load warehouses');
    } finally {
      setIsLoading(false);
    }
  };

  const openNew = () => {
    setForm(defaultForm);
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const editRow = (row) => {
    setForm({
      name: row.name || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
    });
    setSelectedId(row.id);
    setIsEdit(true);
    setSubmitted(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.name?.trim()) {
      msg.error('Name is required');
      return;
    }
    if (!form.phone?.trim()) {
      msg.error('Phone Number is required');
      return;
    }
    if (!form.address?.trim()) {
      msg.error('Address is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email?.trim() || null,
      address: form.address.trim(),
    };
    if (isEdit && selectedId) payload.id = selectedId;

    try {
      const res = await api.post('save-warehouse').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Warehouse saved');
        hideDialog();
        fetchData();
      } else {
        const errMsg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(' ') : 'Save failed');
        msg.error(errMsg);
      }
    } catch (err) {
      const d = err?.response?.data;
      const errMsg = d?.message || (d?.errors ? Object.values(d.errors).flat().join(' ') : 'Failed to save');
      msg.error(errMsg);
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
      const res = await api.get('delete-warehouse/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Warehouse deleted');
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
      <div className="row">
        <div className="col-sm-2">
          <SystemButton type="add-new" method={openNew} showText btnText="Add Warehouse" />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Update Warehouse' : 'Add Warehouse'}
        modalState={showModal}
        toggleFormModal={hideDialog}
        width="520px"
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
                placeholder="Type Warehouse Name"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Phone Number <span className="text-danger">*</span></label>
              <input
                type="text"
                name="phone"
                className={`form-control ${submitted && !form.phone?.trim() ? 'is-invalid' : ''}`}
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="example@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Address <span className="text-danger">*</span></label>
              <textarea
                name="address"
                className={`form-control ${submitted && !form.address?.trim() ? 'is-invalid' : ''}`}
                rows={3}
                value={form.address}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideDialog}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <SafeFontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-2" size="sm" /> Submit
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
                <p className="text-danger font-weight-bold">This action cannot be undone.</p>
                <p>Delete warehouse <strong>"{itemToDelete?.name}"</strong>?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteDialog(false)}>
                  <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <br />
      <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        onDelete={confirmDelete}
        loadingState={isLoading}
        searchAndFetch={() => fetchData()}
        actionsColumn
        showEditButton
        showDeleteButton
        resetSearch={() => fetchData()}
        rowKey="id"
      />
    </div>
  );
};

export default Warehouse;
