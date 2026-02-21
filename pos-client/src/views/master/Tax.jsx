import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, ListView, SystemButton, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Tax';

const defaultForm = {
  name: '',
  rate: '',
};

const Tax = () => {
  const [entities, setEntities] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importSubmitting, setImportSubmitting] = useState(false);

  const dataColumns = [
    { title: 'Name', name: 'name', searchable: true },
    { title: 'Rate (%)', name: 'rate', searchable: false },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('taxes');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(
          data.data.map((row) => ({
            id: row.id,
            name: row.name ?? '—',
            rate: row.rate != null ? row.rate : '—',
          }))
        );
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load taxes');
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

  const hideImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const editRow = async (row) => {
    try {
      const res = await api.get('taxes/' + row.id);
      const d = res?.data?.data;
      if (!d) {
        msg.error('Tax not found');
        return;
      }
      setForm({
        name: d.name || '',
        rate: d.rate != null ? String(d.rate) : '',
      });
      setSelectedId(row.id);
      setIsEdit(true);
      setSubmitted(false);
      setShowModal(true);
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load tax');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.name?.trim()) {
      msg.error('Tax name is required');
      return;
    }
    const rateNum = parseFloat(form.rate);
    if (form.rate === '' || form.rate === null || form.rate === undefined || isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      msg.error('Rate is required and must be between 0 and 100');
      return;
    }

    const payload = {
      name: form.name.trim(),
      rate: rateNum,
    };
    if (isEdit && selectedId) payload.id = selectedId;

    try {
      const res = await api.post('save-tax').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Tax saved');
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
      const res = await api.get('delete-tax/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Tax deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile || !importFile.name) {
      msg.error('Please select a CSV file');
      return;
    }
    const ext = importFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv') {
      msg.error('Please upload a CSV file');
      return;
    }
    setImportSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await api.postFormData('taxes/import').values(formData);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Tax imported successfully');
        hideImportModal();
        fetchData();
      } else {
        msg.error(data?.message || 'Import failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Import failed');
    } finally {
      setImportSubmitting(false);
    }
  };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton type="add-new" method={openNew} showText btnText="Add Tax" />
        </div>
        <div className="col-sm-2">
          <button type="button" className="btn btn-primary" onClick={() => setShowImportModal(true)}>
            <SafeFontAwesomeIcon icon={faFileImport} className="mr-2" size="sm" /> Import Tax
          </button>
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Update Tax' : 'Add Tax'}
        modalState={showModal}
        toggleFormModal={hideDialog}
        width="520px"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body text-left">
            <p className="small text-muted">Fields marked with * are required. Rate must be 0–100 (%).</p>
            <div className="form-group">
              <label>Tax Name <span className="text-danger">*</span></label>
              <input
                type="text"
                name="name"
                className={`form-control ${submitted && !form.name?.trim() ? 'is-invalid' : ''}`}
                placeholder="e.g. VAT"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Rate (%) <span className="text-danger">*</span></label>
              <input
                type="number"
                name="rate"
                step="any"
                min={0}
                max={100}
                className={`form-control ${submitted && (form.rate === '' || isNaN(parseFloat(form.rate)) || parseFloat(form.rate) < 0 || parseFloat(form.rate) > 100) ? 'is-invalid' : ''}`}
                placeholder="0–100"
                value={form.rate}
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

      <FormModal
        moduleName="Import Tax"
        modalState={showImportModal}
        toggleFormModal={hideImportModal}
        width="520px"
      >
        <form onSubmit={handleImportSubmit}>
          <div className="modal-body text-left">
            <p className="small text-muted">Upload a CSV file. Column order: name*, rate*.</p>
            <div className="form-group">
              <label>CSV File <span className="text-danger">*</span></label>
              <input
                type="file"
                accept=".csv"
                className="form-control"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideImportModal}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={importSubmitting}>
              <SafeFontAwesomeIcon icon={faFileImport} className="mr-2" size="sm" /> Submit
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
                <p>Delete tax <strong>"{itemToDelete?.name}"</strong>?</p>
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

export default Tax;
