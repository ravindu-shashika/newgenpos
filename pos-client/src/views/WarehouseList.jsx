import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon, FormModal } from '../components';
import { faPlus, faEdit, faTrash, faEllipsisV, faCopy, faDownload, faPhone, faEnvelope, faMapMarkerAlt, faBoxes, faWarehouse } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import authStore from '../stores/authStore';

const WarehouseList = () => {
    const navigate = useNavigate();
    const can = (p) => authStore.can(p);
    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        warehouse_id: '',
        name: '',
        phone: '',
        email: '',
        address: ''
    });
    const [importFile, setImportFile] = useState(null);

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const response = await api.get('warehouse');
            if (response.status === 200 && response.data.status === 200) {
                setWarehouses(response.data.data || []);
            }
        } catch (error) {
            msg.error('Failed to fetch warehouses');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setFormData({
            warehouse_id: '',
            name: '',
            phone: '',
            email: '',
            address: ''
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (warehouse) => {
        setIsEditing(true);
        setFormData({
            warehouse_id: warehouse.id,
            name: warehouse.name,
            phone: warehouse.phone,
            email: warehouse.email || '',
            address: warehouse.address
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let response;
            if (isEditing) {
                response = await api.put(`warehouse/${formData.warehouse_id}`, formData);
            } else {
                response = await api.post('warehouse', formData);
            }

            if (response.data.status === 200) {
                msg.success(response.data.message);
                setShowModal(false);
                fetchWarehouses();
            } else {
                msg.error(response.data.message);
            }
        } catch (error) {
            msg.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this warehouse?')) return;
        setLoading(true);
        try {
            const response = await api.delete(`warehouse/${id}`);
            if (response.data.status === 200) {
                msg.success(response.data.message);
                fetchWarehouses();
            }
        } catch (error) {
            msg.error('Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm('Delete selected warehouses?')) return;
        setLoading(true);
        try {
            const response = await api.post('warehouse/deletebyselection', {
                warehouseIdArray: selectedIds
            });
            if (response.data.status === 200) {
                msg.success(response.data.message);
                setSelectedIds([]);
                fetchWarehouses();
            }
        } catch (error) {
            msg.error('Bulk deletion failed');
        } finally {
            setLoading(false);
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return msg.warn('Please select a CSV file');

        const data = new FormData();
        data.append('file', importFile);

        setLoading(true);
        try {
            const response = await api.post('warehouse/import', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.status === 200) {
                msg.success(response.data.message);
                setShowImportModal(false);
                setImportFile(null);
                fetchWarehouses();
            } else {
                msg.error(response.data.message);
            }
        } catch (error) {
            msg.error('Import failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === warehouses.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(warehouses.map(w => w.id));
        }
    };

    return (
        <div className="container-fluid py-4 p-4">
            {loading && <Loader />}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="font-weight-bold text-dark mb-0">Warehouse Management</h3>
                    <p className="text-muted small">Manage storage locations and monitor stock across warehouses</p>
                </div>
                <div className="d-flex gap-2">
                    {can('warehouses-create') && (
                        <button className="btn btn-info shadow-sm d-flex align-items-center px-4" onClick={handleOpenAddModal}>
                            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Warehouse
                        </button>
                    )}
                    {can('warehouse.import') && (
                        <button className="btn btn-primary shadow-sm d-flex align-items-center" onClick={() => setShowImportModal(true)}>
                            <SafeFontAwesomeIcon icon={faCopy} className="mr-2" /> Import Warehouse
                        </button>
                    )}
                    {selectedIds.length > 0 && can('warehouse.delete') && (
                        <button className="btn btn-danger shadow-sm d-flex align-items-center" onClick={handleBulkDelete}>
                            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete Selected
                        </button>
                    )}
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="bg-light text-muted text-uppercase small">
                                <tr>
                                    <th className="px-4 py-3" style={{ width: '50px' }}>
                                        <div className="custom-control custom-checkbox">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="selectAll"
                                                checked={warehouses.length > 0 && selectedIds.length === warehouses.length}
                                                onChange={toggleSelectAll}
                                            />
                                            <label className="custom-control-label" htmlFor="selectAll"></label>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3">Warehouse</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Address</th>
                                    <th className="px-4 py-3 text-center">Products</th>
                                    <th className="px-4 py-3 text-center">Stock Quantity</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouses.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-5 text-muted font-italic">No warehouses found.</td></tr>
                                ) : (
                                    warehouses.map(warehouse => (
                                        <tr key={warehouse.id} className="align-middle">
                                            <td className="px-4 py-3">
                                                <div className="custom-control custom-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        className="custom-control-input"
                                                        id={`select-${warehouse.id}`}
                                                        checked={selectedIds.includes(warehouse.id)}
                                                        onChange={() => toggleSelect(warehouse.id)}
                                                    />
                                                    <label className="custom-control-label" htmlFor={`select-${warehouse.id}`}></label>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-soft-primary p-2 rounded mr-3 text-primary">
                                                        <SafeFontAwesomeIcon icon={faWarehouse} />
                                                    </div>
                                                    <div>
                                                        <div className="font-weight-bold text-dark">{warehouse.name}</div>
                                                        <div className="small text-muted">ID: #{warehouse.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="small text-dark mb-1 d-flex align-items-center">
                                                    <SafeFontAwesomeIcon icon={faPhone} className="mr-2 text-muted" style={{ width: '12px' }} /> {warehouse.phone}
                                                </div>
                                                {warehouse.email && (
                                                    <div className="small text-muted d-flex align-items-center">
                                                        <SafeFontAwesomeIcon icon={faEnvelope} className="mr-2 text-muted" style={{ width: '12px' }} /> {warehouse.email}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="small text-muted" style={{ maxWidth: '200px' }}>
                                                    <SafeFontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" /> {warehouse.address}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="badge badge-soft-info px-2 py-1">
                                                    <SafeFontAwesomeIcon icon={faBoxes} className="mr-1" /> {warehouse.number_of_product}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-weight-bold text-dark">
                                                {parseFloat(warehouse.stock_qty).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="dropdown">
                                                    <button className="btn btn-light btn-sm dropdown-toggle border" type="button" data-toggle="dropdown">
                                                        <SafeFontAwesomeIcon icon={faEllipsisV} /> Action
                                                    </button>
                                                    <div className="dropdown-menu dropdown-menu-right shadow border-0">
                                                        {can('warehouse.edit') && (
                                                            <button className="dropdown-item py-2" onClick={() => handleOpenEditModal(warehouse)}>
                                                                <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-primary" /> Edit
                                                            </button>
                                                        )}
                                                        {can('warehouse.delete') && (
                                                            <>
                                                                <div className="dropdown-divider"></div>
                                                                <button className="dropdown-item py-2 text-danger" onClick={() => handleDelete(warehouse.id)}>
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
            <FormModal
                moduleName={isEditing ? 'Update Warehouse' : 'Add Warehouse'}
                modalState={showModal}
                toggleFormModal={() => setShowModal(false)}
            >
                <form onSubmit={handleSubmit} className="p-3">
                    <p className="font-italic text-sm text-muted mb-4">The field labels marked with * are required input fields.</p>

                    <div className="form-group mb-3">
                        <label className="font-weight-bold small text-dark">Name *</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Type Warehouse Name"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label className="font-weight-bold small text-dark">Phone Number *</label>
                        <input
                            type="text"
                            className="form-control"
                            required
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label className="font-weight-bold small text-dark">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="example@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label className="font-weight-bold small text-dark">Address *</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            required
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                        <button type="submit" className="btn btn-primary px-5 py-2 shadow-sm text-white">Submit</button>
                        <button type="button" className="btn btn-light border px-5 py-2" onClick={() => setShowModal(false)}>Cancel</button>
                    </div>
                </form>
            </FormModal>

            {/* Import Modal */}
            <FormModal
                moduleName="Import Warehouse"
                modalState={showImportModal}
                toggleFormModal={() => setShowImportModal(false)}
            >
                <form onSubmit={handleImportSubmit} className="p-3">
                    <p className="font-italic text-sm text-muted mb-3">The field labels marked with * are required input fields.</p>
                    <p className="mb-4 small">The correct column order is <strong>(name*, phone, email, address*)</strong> and you must follow this.</p>

                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="form-group mb-0">
                                <label className="font-weight-bold small text-dark">Upload CSV File *</label>
                                <input
                                    type="file"
                                    className="form-control-file border p-2 rounded w-100"
                                    required
                                    onChange={e => setImportFile(e.target.files[0])}
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group mb-0">
                                <label className="font-weight-bold small text-dark">Sample File</label>
                                <a href="/sample_file/sample_warehouse.csv" className="btn btn-info btn-block d-flex align-items-center justify-content-center py-2 shadow-sm text-white">
                                    <SafeFontAwesomeIcon icon={faDownload} className="mr-2" /> Download
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 d-flex gap-2">
                        <button type="submit" className="btn btn-primary px-5 py-2 shadow-sm text-white">Submit</button>
                        <button type="button" className="btn btn-light border px-5 py-2" onClick={() => setShowImportModal(false)}>Cancel</button>
                    </div>
                </form>
            </FormModal>

            <style>{`
                .bg-soft-primary { background-color: rgba(124, 92, 196, 0.1); }
                .badge-soft-info { background-color: rgba(23, 162, 184, 0.1); color: #17a2b8; border: 1px solid rgba(23, 162, 184, 0.2); }
                .form-control:focus { border-color: #7c5cc4; box-shadow: 0 0 0 0.2rem rgba(124, 92, 196, 0.1); }
                .dropdown-item:active { background-color: #7c5cc4; }
            `}</style>
        </div>
    );
};

export default WarehouseList;
