import React, { useState, useEffect, useRef } from 'react';
import { api, msg } from '../../../services';
import { CustomerSearchTable, FormModal, ListView, SystemButton } from '../../../components';

const storageBaseUrl =
  (process.env.REACT_APP_DEFAULT_PATH || 'http://127.0.0.1:8000').replace(/\/$/, '') + '/storage/';

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/64';
  return imagePath.startsWith('http') ? imagePath : `${storageBaseUrl}${imagePath}`;
};

const ItemCategories = () => {
  const moduleName = 'Categories Management';

  const [entities, setEntities] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [newData, setNewData] = useState({
    name: '',
    parent_id: null,
    is_active: true,
    imagePreview: null,
    image: null,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showModalState, setShowModalState] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const fileInputRef = useRef(null);

  const dataColumns = [
    { title: 'ID', name: 'id', searchable: false },
    { title: 'Category', name: 'name', searchable: true },
    { title: 'Parent', name: 'parent_name', searchable: false },
    { title: 'Status', name: 'status_label', searchable: false },
  ];

  useEffect(() => {
    fetchCategories();
    fetchParentCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('categories');
      const data = response?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(
          data.data.map((cat) => ({
            id: cat.id,
            name: cat.name,
            parent_id: cat.parent_id ?? cat.parent?.id,
            parent_name: cat.parent?.name ?? 'Root Category',
            parent: cat.parent,
            is_active: cat.is_active,
            status_label: cat.is_active ? 'Active' : 'Inactive',
            image: cat.image,
          }))
        );
      } else if (response?.error) {
        const errMsg = response.error?.response?.data?.message || 'Failed to load categories';
        msg.error(errMsg);
      }
    } catch (error) {
      msg.error(error?.response?.data?.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParentCategories = async () => {
    try {
      const response = await api.get('categories/parent');
      const data = response?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setParentCategories([
          { label: 'No parent', value: null, id: null },
          ...data.data.map((cat) => ({ label: cat.name, value: cat.id, id: cat.id })),
        ]);
      } else if (response?.error) {
        const errMsg = response.error?.response?.data?.message || 'Failed to load parent categories';
        msg.error(errMsg);
      }
    } catch (error) {
      msg.error(error?.response?.data?.message || 'Failed to load parent categories');
    }
  };

  const openNew = () => {
    setNewData({
      name: '',
      parent_id: null,
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
    setNewData({ name: '', parent_id: null, is_active: true, imagePreview: null, image: null });
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
      [name]: type === 'checkbox' ? checked : value === '' ? null : value,
    }));
  };

  const onParentChange = (e) => {
    const val = e.target.value;
    setNewData((prev) => ({ ...prev, parent_id: val === '' ? null : Number(val) }));
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
      name: row.name ?? '',
      parent_id: row.parent_id ?? null,
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

  const toggleFormModal = () => {
    if (!showModalState && !isEdit) openNew();
    else hideDialog();
  };

  const saveCategory = async (e) => {
    if (e) e.preventDefault();
    setSubmitted(true);
    if (!newData.name?.trim()) {
      msg.error('Name is required');
      return;
    }

    const formData = new FormData();
    formData.append('name', newData.name.trim());
    if (newData.parent_id != null && newData.parent_id !== '') {
      formData.append('parent_id', newData.parent_id);
    }
    if (selectedFile) {
      formData.append('image', selectedFile);
    }
    formData.append('is_active', newData.is_active ? 1 : 0);
    if (isEdit && selectedId) {
      formData.append('id', selectedId);
    }

    try {
      const response = await api.postFormData('save-category').values(formData);
      const data = response?.data ?? response;

      if (response?.status === 200 && data?.status === 200) {
        msg.success(data?.message ?? 'Category saved successfully');
        await fetchCategories();
        await fetchParentCategories();
        hideDialog();
        return;
      }

      if (response?.status === 200 && data?.status === 500) {
        msg.error(data?.error || 'Failed to save category');
        return;
      }

      if (response?.status === 200 && data?.status === 400) {
        if (data?.message && typeof data.message === 'object') {
          Object.values(data.message).forEach((err) => {
            msg.error(Array.isArray(err) ? err[0] : err);
          });
        } else {
          msg.error(data?.message || 'Failed to save category');
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
          msg.error(err?.message || 'Failed to save category');
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
        msg.error(error?.response?.data?.message || 'Failed to save category');
      }
    }
  };

  const confirmDeleteCategory = (cat) => {
    setCategoryToDelete(cat);
    setDeleteDialog(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete?.id) {
      setDeleteDialog(false);
      setCategoryToDelete(null);
      return;
    }
    try {
      const response = await api.get(`delete-category/${categoryToDelete.id}`);
      const data = response?.data ?? response;
      if (response?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
        msg.success(data?.message ?? 'Category deleted');
        fetchParentCategories();
      } else {
        msg.error(data?.message || 'Failed to delete category');
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        msg.error(error.response?.data?.message || 'Cannot delete this category');
      } else if (error?.response?.status === 403) {
        msg.error(error.response?.data?.message || 'Permission denied');
      } else if (error?.response?.status === 404) {
        msg.error('Category not found');
      } else {
        msg.error(error?.response?.data?.message || 'Failed to delete category');
      }
    }
    setDeleteDialog(false);
    setCategoryToDelete(null);
  };

  const resetSearch = () => {
    fetchCategories();
  };

  const searchAndFetch = async () => {
    fetchCategories();
  };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton
            type="add-new"
            method={openNew}
            showText
            btnText="New Category"
          />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Edit Category' : 'Add New Category'}
        modalState={showModalState}
        toggleFormModal={hideDialog}
        width="600px"
      >
        <form onSubmit={saveCategory}>
          <div className="modal-body text-left">
          

            <div className="form-group">
              <label htmlFor="name">Category Name <span className="text-danger">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                className={`form-control ${submitted && !newData.name?.trim() ? 'is-invalid' : ''}`}
                placeholder="Enter category name"
                value={newData.name ?? ''}
                onChange={handleValueChange}
              />
              {submitted && !newData.name?.trim() && (
                <small className="text-danger">Category name is required</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="parent_id">Parent Category</label>
              <select
                id="parent_id"
                name="parent_id"
                className="form-control"
                value={newData.parent_id ?? ''}
                onChange={onParentChange}
              >
                {parentCategories.map((opt) => (
                  <option key={opt.id ?? 'none'} value={opt.value ?? ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <small className="text-muted">Leave empty to create a root category</small>
            </div>

            <div className="form-group">
              <label>Category Image</label>
              <div className="border rounded p-3 bg-light">
                <label htmlFor="image" className="mb-0 cursor-pointer">
                  <span className="text-primary font-weight-bold">Click to upload</span>
                  <span className="text-muted"> or drag and drop (PNG, JPG, GIF up to 2MB)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  accept="image/*"
                  className="d-block mt-2"
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
                    className="rounded border"
                    style={{ maxHeight: 200 }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute"
                    style={{ top: -8, right: -8 }}
                    onClick={clearImagePreview}
                    aria-label="Remove image"
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}

            <div className="form-group form-check">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                className="form-check-input"
                checked={newData.is_active}
                onChange={handleValueChange}
              />
              <label className="form-check-label" htmlFor="is_active">
                Category Status: {newData.is_active ? 'Active' : 'Inactive'}
              </label>
            </div>
          </div>
          <div className="modal-footer">
          {/* <button type="button" className="btn btn-secondary" onClick={hideDialog}>
             
              Cancel  
            </button> */}
             <SystemButton type="close" showText method={hideDialog} />
            {/* <button type="submit" className="btn btn-primary">
              {isEdit ? 'Update Category' : 'Create Category'}
            </button> */}   
              <SystemButton
                  type="no-form-save"
                  showText
                  method={saveCategory}
                />
          </div>
        </form>
      </FormModal>

      {/* Delete confirmation dialog */}
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
                  Are you sure you want to delete the category <strong>"{categoryToDelete?.name}"</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <SystemButton type="cancel" showText method={() => setDeleteDialog(false)} />
                <SystemButton type="delete" showText method={handleDeleteCategory} />
              </div>
            </div>
          </div>
        </div>
      )}

      <br />
      {/* <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        onDelete={confirmDeleteCategory}
        loadingState={isLoading}
        searchAndFetch={searchAndFetch}
        actionsColumn
        showEditButton
        showDeleteButton
        resetSearch={resetSearch}
        rowKey="id"
      /> */}
      <CustomerSearchTable
       showEditButton
       showDeleteButton 
       loadingState={isLoading}
       columns={dataColumns}    
       dataList={entities} 
       edit={editRow}
       deleteRow={confirmDeleteCategory}
        rowKey="id"
       />
    </div>
  );
};

export default ItemCategories;
