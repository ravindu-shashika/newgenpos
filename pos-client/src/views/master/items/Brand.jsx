import React, { useState, useEffect, useRef } from 'react';
import { faTimes, faPlus, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../../services';
import { CustomerSearchTable, FormModal, SystemButton, SafeFontAwesomeIcon } from '../../../components';

const storageBaseUrl =
  (process.env.REACT_APP_DEFAULT_PATH || 'http://127.0.0.1:8000').replace(/\/$/, '') + '/storage/';

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/64';
  return imagePath.startsWith('http') ? imagePath : `${storageBaseUrl}${imagePath}`;
};

const Brand = () => {
  const moduleName = 'Brands Management';

  const [entities, setEntities] = useState([]);
  const [newData, setNewData] = useState({
    title: '',
    is_active: true,
    imagePreview: null,
    image: null,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showModalState, setShowModalState] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const fileInputRef = useRef(null);

  const dataColumns = [
    { title: 'ID', name: 'id', searchable: false },
    { title: 'Brand', name: 'title', searchable: true },
    { title: 'Status', name: 'status_label', searchable: false },
  ];

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('brands');
      const data = response?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(
          data.data.map((b) => ({
            id: b.id,
            title: b.title,
            is_active: b.is_active,
            status_label: b.is_active ? 'Active' : 'Inactive',
            image: b.image,
            created_at: b.created_at,
          }))
        );
      } else if (response?.error) {
        const errMsg = response.error?.response?.data?.message || 'Failed to load brands';
        msg.error(errMsg);
      }
    } catch (error) {
      msg.error(error?.response?.data?.message || 'Failed to load brands');
    } finally {
      setIsLoading(false);
    }
  };

  const openNew = () => {
    setNewData({
      title: '',
      is_active: true,
      imagePreview: null,
      image: null,
    });
    setSelectedFile(null);
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowModalState(true);
  };

  const hideDialog = () => {
    setShowModalState(false);
    setNewData({ title: '', is_active: true, imagePreview: null, image: null });
    setSelectedFile(null);
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleValueChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewData((prev) => ({ ...prev, imagePreview: ev.target?.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImagePreview = () => {
    setNewData((prev) => ({ ...prev, imagePreview: null, image: null }));
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const editRow = (row) => {
    setNewData({
      title: row.title ?? '',
      is_active: row.is_active ? true : false,
      imagePreview: null,
      image: row.image ?? null,
    });
    setSelectedFile(null);
    setSubmitted(false);
    setIsEdit(true);
    setSelectedId(row.id);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowModalState(true);
  };

  const saveBrand = async (e) => {
    if (e) e.preventDefault();
    setSubmitted(true);
    if (!newData.title?.trim()) {
      msg.error('Brand title is required');
      return;
    }

    const formData = new FormData();
    formData.append('title', newData.title.trim());
    if (selectedFile) {
      formData.append('image', selectedFile);
    }
    formData.append('is_active', newData.is_active ? 1 : 0);
    if (isEdit && selectedId) {
      formData.append('id', selectedId);
    }

    try {
      const response = await api.postFormData('save-brand').values(formData);
      const data = response?.data ?? response;

      if (response?.status === 200 && data?.status === 200) {
        msg.success(data?.message ?? 'Brand saved successfully');
        await fetchBrands();
        hideDialog();
        return;
      }

      if (response?.status === 200 && data?.status === 500) {
        msg.error(data?.error || 'Failed to save brand');
        return;
      }

      if (response?.status === 200 && data?.status === 400) {
        if (data?.message && typeof data.message === 'object') {
          Object.values(data.message).forEach((err) => {
            msg.error(Array.isArray(err) ? err[0] : err);
          });
        } else {
          msg.error(data?.message || 'Failed to save brand');
        }
        return;
      }

      if (response?.error) {
        const err = response.error?.response?.data;
        if (err?.errors) {
          Object.values(err.errors).forEach((arr) => {
            (Array.isArray(arr) ? arr : [arr]).forEach((m) => msg.error(m));
          });
        } else {
          msg.error(err?.message || 'Failed to save brand');
        }
      }
    } catch (error) {
      if (error?.response?.status === 422) {
        const errors = error.response?.data?.errors;
        if (errors) {
          Object.values(errors).forEach((arr) => {
            (Array.isArray(arr) ? arr : [arr]).forEach((m) => msg.error(m));
          });
        } else {
          msg.error(error.response?.data?.message || 'Validation error');
        }
      } else if (error?.response?.status === 403) {
        msg.error(error.response?.data?.message || 'Permission denied');
      } else {
        msg.error(error?.response?.data?.message || 'Failed to save brand');
      }
    }
  };

  const confirmDeleteBrand = (row) => {
    setBrandToDelete(row);
    setDeleteDialog(true);
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete?.id) {
      setDeleteDialog(false);
      setBrandToDelete(null);
      return;
    }
    try {
      const response = await api.get(`delete-brand/${brandToDelete.id}`);
      const data = response?.data ?? response;
      if (response?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((b) => b.id !== brandToDelete.id));
        msg.success(data?.message ?? 'Brand deleted');
      } else {
        msg.error(data?.message || 'Failed to delete brand');
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        msg.error(error.response?.data?.message || 'Cannot delete this brand');
      } else if (error?.response?.status === 403) {
        msg.error(error.response?.data?.message || 'Permission denied');
      } else if (error?.response?.status === 404) {
        msg.error('Brand not found');
      } else {
        msg.error(error?.response?.data?.message || 'Failed to delete brand');
      }
    }
    setDeleteDialog(false);
    setBrandToDelete(null);
  };

  const resetSearch = () => {
    fetchBrands();
  };

  const searchAndFetch = async () => {
    fetchBrands();
  };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton type="add-new" method={openNew} showText btnText="New Brand" />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Edit Brand' : 'Add New Brand'}
        modalState={showModalState}
        toggleFormModal={hideDialog}
        width="520px"
      >
        <form onSubmit={saveBrand}>
          <div className="modal-body text-left">
          

            <div className="form-group">
              <label htmlFor="title">
                Brand Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className={`form-control ${submitted && !newData.title?.trim() ? 'is-invalid' : ''}`}
                placeholder="e.g. Nike, Samsung, Apple"
                value={newData.title ?? ''}
                onChange={handleValueChange}
              />
              {submitted && !newData.title?.trim() && (
                <small className="text-danger d-block mt-1">Brand title is required</small>
              )}
            </div>

            <div className="form-group">
              <label>Brand Logo</label>
              <div className="form-modal-upload">
                <label htmlFor="image" className="mb-0 cursor-pointer">
                  <span className="text-primary font-weight-bold">Click to upload</span>
                  <span className="text-muted"> or drag and drop</span>
                </label>
                <p className="small text-muted mb-0 mt-1">PNG, JPG or GIF, max 2MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  accept="image/*"
                  className="d-block mx-auto mt-2"
                  onChange={onFileChange}
                />
              </div>
            </div>

            {(newData.imagePreview || newData.image) && (
              <div className="form-group">
                <label>Preview</label>
                <div className="position-relative d-inline-block">
                  <img
                    src={newData.imagePreview || getImageUrl(newData.image)}
                    alt="Preview"
                    className="rounded"
                    style={{ maxHeight: 160, border: '1px solid #e2e8f0' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute rounded-circle shadow-sm"
                    style={{ top: -6, right: -6, width: 28, height: 28, padding: 0, lineHeight: 1 }}
                    onClick={clearImagePreview}
                    aria-label="Remove image"
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}

            <div className="form-group form-check mt-3">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                className="form-check-input"
                checked={newData.is_active}
                onChange={handleValueChange}
              />
              <label className="form-check-label" htmlFor="is_active">
                Active (show this brand in the catalog)
              </label>
            </div>
          </div>
          <div className="modal-footer">
            {/* <button type="button" className="btn btn-secondary" onClick={hideDialog}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" />
              Cancel
            </button> */}
            <SystemButton type="close" showText method={hideDialog} />
            {/* <button type="submit" className="btn btn-primary">
              <SafeFontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-2" size="sm" />
              {isEdit ? 'Update Brand' : 'Create Brand'}
            </button> */}
            <SystemButton
              type={isEdit ? 'update' : 'save'}
              showText
              btnText={isEdit ? 'Update Brand' : undefined}
              method={saveBrand}
            />
          </div>
        </form>
      </FormModal>

      {deleteDialog && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="close" onClick={() => setDeleteDialog(false)} aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p className="text-danger font-weight-bold">This action cannot be undone.</p>
                <p>
                  Are you sure you want to delete the brand <strong>"{brandToDelete?.title}"</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteDialog(false)}>
                  <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" />
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteBrand}>
                  <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" />
                  Delete Brand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <br />
      <CustomerSearchTable
        columns={dataColumns}
        dataList={entities}
        edit={editRow}
        deleteRow={confirmDeleteBrand}
        loadingState={isLoading}
        showEditButton
        showDeleteButton
        rowKey="id"
      />
    </div>
  );
};

export default Brand;
