import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon, FormModal } from '../components';
import { faPlus, faEdit, faTrash, faEllipsisV, faCopy, faDownload } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import authStore from '../stores/authStore';

const ExpenseCategoryList = () => {
    const navigate = useNavigate();
    const can = (p) => authStore.can(p);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [formData, setFormData] = useState({
        expense_category_id: '',
        code: '',
        name: ''
    });
    const [importFile, setImportFile] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('expense_categories');
            if (response.status === 200 && response.data.status === 200) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            msg.error('Failed to fetch expense categories');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        try {
            const response = await api.get('expense_categories/gencode');
            if (response.status === 200) {
                setFormData(prev => ({ ...prev, code: response.data }));
            }
        } catch (error) {
            msg.error('Failed to generate code');
        }
    };

    const handleOpenAddModal = () => {
        setFormData({
            expense_category_id: '',
            code: '',
            name: ''
        });
        setShowAddModal(true);
    };

    const handleOpenEditModal = (category) => {
        setFormData({
            expense_category_id: category.id,
            code: category.code,
            name: category.name
        });
        setShowEditModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let response;
            if (showEditModal) {
                response = await api.put(`expense_categories/${formData.expense_category_id}`, formData);
            } else {
                response = await api.post('expense_categories', formData);
            }

            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setShowAddModal(false);
                setShowEditModal(false);
                fetchCategories();
            } else {
                msg.error(response.data.message || 'Something went wrong');
            }
        } catch (error) {
            msg.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            setLoading(true);
            try {
                const response = await api.delete(`expense_categories/${id}`);
                if (response.status === 200 && response.data.status === 200) {
                    msg.success(response.data.message);
                    fetchCategories();
                } else {
                    msg.error(response.data.message || 'Failed to delete');
                }
            } catch (error) {
                msg.error('An error occurred during deletion');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            msg.warn('Please select at least one item');
            return;
        }

        if (window.confirm('Are you sure you want to delete selected categories?')) {
            setLoading(true);
            try {
                const response = await api.post('expense_categories/deletebyselection', {
                    expense_categoryIdArray: selectedIds
                });
                if (response.status === 200 && response.data.status === 200) {
                    msg.success(response.data.message);
                    setSelectedIds([]);
                    fetchCategories();
                } else {
                    msg.error(response.data.message || 'Bulk delete failed');
                }
            } catch (error) {
                msg.error('An error occurred during bulk deletion');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) {
            msg.warn('Please select a CSV file');
            return;
        }

        const formDataImport = new FormData();
        formDataImport.append('file', importFile);

        setLoading(true);
        try {
            const response = await api.post('expense_categories/import', formDataImport, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setShowImportModal(false);
                setImportFile(null);
                fetchCategories();
            } else {
                msg.error(response.data.message || 'Import failed');
            }
        } catch (error) {
            msg.error('An error occurred during import');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === categories.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(categories.map(c => c.id));
        }
    };

    return (
        <div className="container-fluid py-4 p-4">
            {loading && <Loader />}

            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0 font-weight-bold text-primary">Expense Category List</h5>
                        <p className="text-muted small mb-0">Manage categories for your expenditures</p>
                    </div>
                    <div className="d-flex gap-2 text-nowrap">
                        {can('expense_category.create' || 'expense_category.*') && (
                            <button className="btn btn-info shadow-sm d-flex align-items-center" onClick={handleOpenAddModal}>
                                <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Expense Category
                            </button>
                        )}
                        {can('expense_category.import') && (
                            <button className="btn btn-primary shadow-sm d-flex align-items-center" onClick={() => setShowImportModal(true)}>
                                <SafeFontAwesomeIcon icon={faCopy} className="mr-2" /> Import Category
                            </button>
                        )}
                        {selectedIds.length > 0 && can('expense_category.delete') && (
                            <button className="btn btn-danger shadow-sm d-flex align-items-center" onClick={handleBulkDelete}>
                                <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete Selected
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="bg-light text-muted text-uppercase small text-nowrap">
                                <tr>
                                    <th className="px-4 py-3" style={{ width: '50px' }}>
                                        <div className="custom-control custom-checkbox">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="selectAll"
                                                checked={categories.length > 0 && selectedIds.length === categories.length}
                                                onChange={toggleSelectAll}
                                            />
                                            <label className="custom-control-label" htmlFor="selectAll"></label>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-5 text-muted">No categories found</td>
                                    </tr>
                                ) : (
                                    categories.map((category) => (
                                        <tr key={category.id} className="align-middle">
                                            <td className="px-4 py-3">
                                                <div className="custom-control custom-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        className="custom-control-input"
                                                        id={`select-${category.id}`}
                                                        checked={selectedIds.includes(category.id)}
                                                        onChange={() => toggleSelect(category.id)}
                                                    />
                                                    <label className="custom-control-label" htmlFor={`select-${category.id}`}></label>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-weight-medium">{category.code}</td>
                                            <td className="px-4 py-3 text-dark">{category.name}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="dropdown">
                                                    <button className="btn btn-light btn-sm dropdown-toggle border shadow-sm" type="button" data-toggle="dropdown">
                                                        <SafeFontAwesomeIcon icon={faEllipsisV} /> Action
                                                    </button>
                                                    <div className="dropdown-menu dropdown-menu-right shadow border-0">
                                                        {can('expense_category.edit') && (
                                                            <button className="dropdown-item py-2" onClick={() => handleOpenEditModal(category)}>
                                                                <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-primary" /> Edit
                                                            </button>
                                                        )}
                                                        {can('expense_category.delete') && (
                                                            <>
                                                                <div className="dropdown-divider"></div>
                                                                <button className="dropdown-item py-2 text-danger" onClick={() => handleDelete(category.id)}>
                                                                    <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <FormModal
                    title={showEditModal ? 'Update Expense Category' : 'Add Expense Category'}
                    show={showAddModal || showEditModal}
                    onClose={() => { setShowAddModal(false); setShowEditModal(false); }}
                    onSubmit={handleSubmit}
                >
                    <div className="p-3">
                        <p className="font-italic text-sm text-muted mb-4">
                            The field labels marked with * are required input fields.
                        </p>

                        <div className="form-group mb-4">
                            <label className="font-weight-bold text-dark">Code *</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    name="code"
                                    className="form-control"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                    placeholder="Type expense category code"
                                />
                                {!showEditModal && (
                                    <div className="input-group-append">
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={handleGenerateCode}
                                        >
                                            Generate
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="font-weight-bold text-dark">Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="form-control"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Type expense category name"
                            />
                        </div>

                        <input type="hidden" name="is_active" value="1" />

                        <div className="mt-5 d-flex gap-2">
                            <button type="submit" className="btn btn-primary px-5 py-2 shadow-sm text-white">
                                Submit
                            </button>
                            <button
                                type="button"
                                className="btn btn-light px-5 py-2 border shadow-sm"
                                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </FormModal>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <FormModal
                    title="Import Expense Category"
                    show={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSubmit={handleImportSubmit}
                >
                    <div className="p-3">
                        <p className="font-italic text-sm text-muted mb-3">
                            The field labels marked with * are required input fields.
                        </p>
                        <p className="mb-4">The correct column order is (code*, name*) and you must follow this.</p>

                        <div className="row mb-4">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="font-weight-bold text-dark">Upload CSV File *</label>
                                    <input
                                        type="file"
                                        className="form-control-file border p-2 w-100 rounded"
                                        required
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group text-nowrap">
                                    <label className="d-block font-weight-bold text-dark">Sample File</label>
                                    <a href="/sample_file/sample_expense_category.csv" className="btn btn-info btn-block d-flex align-items-center justify-content-center py-2 shadow-sm text-white">
                                        <SafeFontAwesomeIcon icon={faDownload} className="mr-2" /> Download
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 d-flex gap-2">
                            <button type="submit" className="btn btn-primary px-5 py-2 shadow-sm text-white">
                                Submit
                            </button>
                            <button
                                type="button"
                                className="btn btn-light px-5 py-2 border shadow-sm"
                                onClick={() => setShowImportModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </FormModal>
            )}
        </div>
    );
};

export default ExpenseCategoryList;
