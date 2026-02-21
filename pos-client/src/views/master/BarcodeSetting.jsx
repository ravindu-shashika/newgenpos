import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, ListView, SystemButton, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Barcode Sticker Setting';

const defaultForm = {
  name: '',
  description: '',
  is_continuous: false,
  top_margin: '0',
  left_margin: '0',
  width: '',
  height: '',
  paper_width: '',
  paper_height: '',
  stickers_in_one_row: '',
  row_distance: '0',
  col_distance: '0',
  stickers_in_one_sheet: '',
  is_default: false,
};

const BarcodeSetting = () => {
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
    { title: 'Sticker Sheet setting Name', name: 'name', searchable: true },
    { title: 'Description', name: 'description', searchable: false },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('barcodes');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(
          data.data.map((row) => ({
            id: row.id,
            name: row.name ?? '—',
            description: row.description ? (String(row.description).length > 50 ? String(row.description).slice(0, 50) + '…' : row.description) : '—',
          }))
        );
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load barcode settings');
    } finally {
      setIsLoading(false);
    }
  };

  const openNew = () => {
    setForm({
      ...defaultForm,
      top_margin: '0',
      left_margin: '0',
      row_distance: '0',
      col_distance: '0',
    });
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

  const editRow = async (row) => {
    try {
      const res = await api.get('barcodes/' + row.id);
      const d = res?.data?.data;
      if (!d) {
        msg.error('Barcode setting not found');
        return;
      }
      setForm({
        name: d.name || '',
        description: d.description ?? '',
        is_continuous: !!d.is_continuous,
        top_margin: d.top_margin != null ? String(d.top_margin) : '0',
        left_margin: d.left_margin != null ? String(d.left_margin) : '0',
        width: d.width != null ? String(d.width) : '',
        height: d.height != null ? String(d.height) : '',
        paper_width: d.paper_width != null ? String(d.paper_width) : '',
        paper_height: d.paper_height != null ? String(d.paper_height) : '',
        stickers_in_one_row: d.stickers_in_one_row != null ? String(d.stickers_in_one_row) : '',
        row_distance: d.row_distance != null ? String(d.row_distance) : '0',
        col_distance: d.col_distance != null ? String(d.col_distance) : '0',
        stickers_in_one_sheet: d.stickers_in_one_sheet != null ? String(d.stickers_in_one_sheet) : '',
        is_default: !!d.is_default,
      });
      setSelectedId(row.id);
      setIsEdit(true);
      setSubmitted(false);
      setShowModal(true);
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load barcode setting');
    }
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || '',
      top_margin: parseFloat(form.top_margin) ?? 0,
      left_margin: parseFloat(form.left_margin) ?? 0,
      width: parseFloat(form.width) ?? 0,
      height: parseFloat(form.height) ?? 0,
      paper_width: parseFloat(form.paper_width) ?? 0,
      stickers_in_one_row: parseInt(form.stickers_in_one_row, 10) || 1,
      row_distance: parseFloat(form.row_distance) ?? 0,
      col_distance: parseFloat(form.col_distance) ?? 0,
    };
    if (form.is_default) payload.is_default = true;
    if (form.is_continuous) {
      payload.is_continuous = true;
      payload.stickers_in_one_sheet = 28;
      payload.paper_height = 0;
    } else {
      payload.is_continuous = false;
      payload.paper_height = parseFloat(form.paper_height) ?? 0;
      payload.stickers_in_one_sheet = parseInt(form.stickers_in_one_sheet, 10) || 1;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.name?.trim()) {
      msg.error('Sticker Sheet setting Name is required');
      return;
    }
    if (!form.is_continuous) {
      if (form.paper_height === '' || parseFloat(form.paper_height) < 0.1) {
        msg.error('Paper height is required (min 0.1) when not continuous');
        return;
      }
      if (!form.stickers_in_one_sheet || parseInt(form.stickers_in_one_sheet, 10) < 1) {
        msg.error('No of Stickers per sheet is required');
        return;
      }
    }
    if (form.width === '' || parseFloat(form.width) < 0.1) {
      msg.error('Width of sticker is required (min 0.1)');
      return;
    }
    if (form.height === '' || parseFloat(form.height) < 0.1) {
      msg.error('Height of sticker is required (min 0.1)');
      return;
    }
    if (form.paper_width === '' || parseFloat(form.paper_width) < 0.1) {
      msg.error('Paper width is required (min 0.1)');
      return;
    }
    if (!form.stickers_in_one_row || parseInt(form.stickers_in_one_row, 10) < 1) {
      msg.error('Stickers in one row is required');
      return;
    }

    const payload = buildPayload();
    try {
      if (isEdit && selectedId) {
        const res = await api.put('barcodes', selectedId).values(payload);
        const data = res?.data;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message || 'Updated');
          hideDialog();
          fetchData();
        } else {
          msg.error(data?.message || 'Update failed');
        }
      } else {
        const res = await api.post('barcodes').values(payload);
        const data = res?.data;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message || 'Saved');
          hideDialog();
          fetchData();
        } else {
          msg.error(data?.message || 'Save failed');
        }
      }
    } catch (err) {
      const d = err?.response?.data;
      msg.error(d?.message || 'Save failed');
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
      const res = await api.delete('barcodes/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const isContinuous = form.is_continuous;

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton type="add-new" method={openNew} showText btnText="Add New Setting" />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Edit Barcode Sticker Setting' : 'Add barcode sticker setting'}
        modalState={showModal}
        toggleFormModal={hideDialog}
        width="95%"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body text-left" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <p className="small text-muted">Fields marked with * are required. All dimensions in inches.</p>
            <div className="row">
              <div className="col-sm-12">
                <div className="form-group">
                  <label>Sticker Sheet setting Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Sticker Sheet setting Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-sm-12">
                <div className="form-group">
                  <label>Sticker Sheet setting Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    placeholder="Sticker Sheet setting Description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-sm-12">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_continuous"
                      checked={form.is_continuous}
                      onChange={handleChange}
                    /> Continuous feed or rolls
                  </label>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label>Additional top margin (In Inches) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="top_margin"
                    className="form-control"
                    min={0}
                    step="0.00001"
                    value={form.top_margin}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label>Additional left margin (In Inches) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="left_margin"
                    className="form-control"
                    min={0}
                    step="0.00001"
                    value={form.left_margin}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label>Width of sticker (In Inches) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="width"
                    className="form-control"
                    min={0.1}
                    step="0.00001"
                    value={form.width}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label>Height of sticker (In Inches) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="height"
                    className="form-control"
                    min={0.1}
                    step="0.00001"
                    value={form.height}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label>Paper width (In Inches) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="paper_width"
                    className="form-control"
                    min={0.1}
                    step="0.00001"
                    value={form.paper_width}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              {!isContinuous && (
                <div className="col-sm-6">
                  <div className="form-group">
                    <label>Paper height (In Inches) <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      name="paper_height"
                      className="form-control"
                      min={0.1}
                      step="0.00001"
                      value={form.paper_height}
                      onChange={handleChange}
                      required={!isContinuous}
                      disabled={isContinuous}
                    />
                  </div>
                </div>
              )}
              <div className="col-sm-6">
                <div className="form-group">
                  <label>Stickers in one row <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="stickers_in_one_row"
                    className="form-control"
                    min={1}
                    value={form.stickers_in_one_row}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label>Distance between two rows (In Inches) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="row_distance"
                    className="form-control"
                    min={0}
                    step="0.00001"
                    value={form.row_distance}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label>Distance between two columns (In Inches) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="col_distance"
                    className="form-control"
                    min={0}
                    step="0.00001"
                    value={form.col_distance}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              {!isContinuous && (
                <div className="col-sm-6">
                  <div className="form-group">
                    <label>No of Stickers per sheet <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      name="stickers_in_one_sheet"
                      className="form-control"
                      min={1}
                      value={form.stickers_in_one_sheet}
                      onChange={handleChange}
                      required={!isContinuous}
                      disabled={isContinuous}
                    />
                  </div>
                </div>
              )}
              <div className="col-sm-6">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={form.is_default}
                      onChange={handleChange}
                    /> Set as default
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideDialog}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <SafeFontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-2" size="sm" /> {isEdit ? 'Update' : 'Save'}
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
                <p>Delete barcode setting <strong>"{itemToDelete?.name}"</strong>?</p>
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

export default BarcodeSetting;
