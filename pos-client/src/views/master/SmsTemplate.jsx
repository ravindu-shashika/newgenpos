import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, ListView, SystemButton, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'SMS Template List';

const CONTENT_PLACEHOLDER = `You can set following dynamic tags for a template:
[reference], [customer], [sale_status], [payment_status], [sale_total]
Example:
Hi [customer],
Thanks for the order. Order reference: [reference]. Order status: [sale_status]. Sale Total: [sale_total]. Payment status: [payment_status].`;

const defaultForm = {
  name: '',
  content: '',
  is_default: false,
  is_default_ecommerce: false,
};

const SmsTemplate = () => {
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
    { title: 'Name', name: 'name', searchable: true },
    { title: 'Content', name: 'content_short', searchable: false },
    { title: 'Default', name: 'default_badge', searchable: false },
    { title: 'Default Online', name: 'default_online_badge', searchable: false },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('sms-templates');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(
          data.data.map((row) => ({
            id: row.id,
            name: row.name,
            content: row.content,
            content_short: (row.content || '').length > 60 ? (row.content || '').slice(0, 60) + '…' : (row.content || '—'),
            is_default: !!row.is_default,
            is_default_ecommerce: !!row.is_default_ecommerce,
            default_badge: row.is_default ? 'Default' : '—',
            default_online_badge: row.is_default_ecommerce ? 'Default' : '—',
          }))
        );
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load SMS templates');
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
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const editRow = (row) => {
    setForm({
      name: row.name || '',
      content: row.content || '',
      is_default: !!row.is_default,
      is_default_ecommerce: !!row.is_default_ecommerce,
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
    if (!form.content?.trim()) {
      msg.error('Content is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      content: form.content.trim(),
      is_default: form.is_default,
      is_default_ecommerce: form.is_default_ecommerce,
    };

    try {
      if (isEdit && selectedId) {
        const res = await api.put('sms-templates', selectedId).values(payload);
        const data = res?.data ?? res?.error;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message || 'Template updated');
          hideDialog();
          fetchData();
        } else {
          msg.error(data?.message || 'Update failed');
        }
      } else {
        const res = await api.post('sms-templates').values(payload);
        const data = res?.data ?? res?.error;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message || 'Template added');
          hideDialog();
          fetchData();
        } else {
          msg.error(data?.message || 'Add failed');
        }
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to save template');
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
      const res = await api.delete('sms-templates/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Template deleted');
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
          <SystemButton type="add-new" method={openNew} showText btnText="Add Template" />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Update Template' : 'Add Template'}
        modalState={showModal}
        toggleFormModal={hideDialog}
        width="560px"
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
                placeholder="Template Name"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Content <span className="text-danger">*</span></label>
              <textarea
                name="content"
                rows={7}
                className={`form-control ${submitted && !form.content?.trim() ? 'is-invalid' : ''}`}
                placeholder={CONTENT_PLACEHOLDER}
                value={form.content}
                onChange={handleChange}
              />
            </div>
            <div className="form-group form-check">
              <input
                type="checkbox"
                name="is_default"
                id="is_default"
                className="form-check-input"
                checked={form.is_default}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="is_default">
                <strong>Default SMS Sale</strong>
              </label>
            </div>
            <div className="form-group form-check">
              <input
                type="checkbox"
                name="is_default_ecommerce"
                id="is_default_ecommerce"
                className="form-check-input"
                checked={form.is_default_ecommerce}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="is_default_ecommerce">
                <strong>Default SMS E-Commerce</strong>
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideDialog}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" />
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <SafeFontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-2" size="sm" />
              Submit
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
                <p>Delete template <strong>"{itemToDelete?.name}"</strong>?</p>
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

export default SmsTemplate;
