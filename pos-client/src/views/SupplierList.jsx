import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { FormModal, Loader, SafeFontAwesomeIcon } from '../components';
import { 
    faPlus, faCopy, faEdit, faTrash, faEye, 
    faEraser, faEllipsisV, faComments
} from '@fortawesome/free-solid-svg-icons';
// import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';

const SupplierList = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initData, setInitData] = useState({
        all_permission: [],
        general_setting: null
    });

    // Modal States
    const [showClearDueModal, setShowClearDueModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // Form Data States
    const [clearDueData, setClearDueData] = useState({ amount: 0, note: '' });

    useEffect(() => {
        fetchInitData();
        fetchSuppliers();
    }, []);

    const fetchInitData = async () => {
        try {
            const response = await api.get('supplier');
            if (response.status === 200 && response.data.status === 200) {
                setInitData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch init data', error);
        }
    };

    const fetchSuppliers = async (search = '') => {
        setLoading(true);
        try {
            const data = {
                draw: 1,
                start: 0,
                length: 10,
                search: { value: search },
                order: [{ column: 0, dir: 'desc' }]
            };
            const response = await api.post('supplier/supplier-data').values(data);
            if (response.status === 200 && response.data.status === 200) {
                setSuppliers(response.data.data);
            }
        } catch (error) {
            msg.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                const response = await api.delete(`supplier/${id}`);
                if (response.status === 200 && response.data.status === 200) {
                    msg.success(response.data.message);
                    fetchSuppliers();
                } else {
                    msg.error(response.data.message);
                }
            } catch (error) {
                msg.error('Action failed');
            }
        }
    };

    const handleClearDue = (supplier) => {
        setSelectedSupplier(supplier);
        setClearDueData({ amount: parseFloat(supplier.total_due.replace(/,/g, '')), note: '' });
        setShowClearDueModal(true);
    };

    const submitClearDue = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('suppliers/clear-due').values({
                ...clearDueData,
                supplier_id: selectedSupplier.id
            });
            
            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setShowClearDueModal(false);
                fetchSuppliers();
            } else {
                msg.error(response.data.message);
            }
        } catch (error) {
            msg.error('Failed to clear due');
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-primary font-weight-bold mb-0">Supplier List</h3>
                <div className="d-flex gap-2">
                    {initData.all_permission?.includes('suppliers-add') && (
                        <button className="btn btn-info shadow-sm d-flex align-items-center" onClick={() => navigate('/supplier/create')}>
                            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Supplier
                        </button>
                    )}
                    {initData.all_permission?.includes('suppliers-import') && (
                        <button className="btn btn-primary shadow-sm d-flex align-items-center">
                            <SafeFontAwesomeIcon icon={faCopy} className="mr-2" /> Import Supplier
                        </button>
                    )}
                </div>
            </div>

            <div className="card shadow-sm border-0 rounded-lg overflow-hidden">
                <div className="card-header bg-white py-3 border-0">
                    <div className="input-group" style={{ maxWidth: '300px' }}>
                        <input 
                            type="text" 
                            className="form-control border-right-0" 
                            placeholder="Search suppliers..." 
                            onChange={(e) => fetchSuppliers(e.target.value)}
                        />
                        <div className="input-group-append">
                            <span className="input-group-text bg-white border-left-0 text-muted">
                                <SafeFontAwesomeIcon icon={faEllipsisV} />
                            </span>
                        </div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>#</th>
                                <th>Image</th>
                                <th>Supplier Details</th>
                                <th>Total Due</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <Loader />
                                    </td>
                                </tr>
                            ) : suppliers.length > 0 ? (
                                suppliers.map((supplier, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                            {supplier.image ? (
                                                <img src={`/images/supplier/${supplier.image}`} alt={supplier.name} width="50" className="rounded shadow-sm" />
                                            ) : (
                                                <div className="bg-light border rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                    <small className="text-muted">No IMG</small>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="font-weight-bold">{supplier.name} ({supplier.company_name})</span>
                                                <small className="text-muted">{supplier.phone_number}</small>
                                                <small className="text-muted">{supplier.email}</small>
                                                {supplier.vat_number && <small className="text-info mt-1">VAT: {supplier.vat_number}</small>}
                                            </div>
                                        </td>
                                        <td className="text-danger font-weight-bold">{supplier.total_due}</td>
                                        <td className="text-center">
                                            <div className="dropdown">
                                                <button className="btn btn-outline-secondary btn-sm rounded-circle" type="button" data-toggle="dropdown">
                                                    <SafeFontAwesomeIcon icon={faEllipsisV} />
                                                </button>
                                                <div className="dropdown-menu dropdown-menu-right shadow-lg border-0">
                                                    <button className="dropdown-item py-2" onClick={() => navigate(`/supplier/show/${supplier.id}`)}>
                                                        <SafeFontAwesomeIcon icon={faEye} className="mr-2 text-primary" /> Details
                                                    </button>
                                                    <button className="dropdown-item py-2" onClick={() => navigate(`/supplier/edit/${supplier.id}`)}>
                                                        <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-info" /> Edit
                                                    </button>
                                                    {parseFloat(supplier.total_due.replace(/,/g, '')) > 0 && (
                                                        <button className="dropdown-item py-2" onClick={() => handleClearDue(supplier)}>
                                                            <SafeFontAwesomeIcon icon={faEraser} className="mr-2 text-warning" /> Clear Due
                                                        </button>
                                                    )}
                                                    {supplier.wa_number && (
                                                        <a href={`https://wa.me/${supplier.wa_number}`} target="_blank" rel="noreferrer" className="dropdown-item py-2">
                                                            <SafeFontAwesomeIcon icon={faComments} className="mr-2 text-success" /> WhatsApp
                                                        </a>
                                                    )}
                                                    <div className="dropdown-divider"></div>
                                                    <button className="dropdown-item py-2 text-danger" onClick={() => handleDelete(supplier.id)}>
                                                        <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-muted">No suppliers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Clear Due Modal */}
            <FormModal 
                moduleName={`Clear Due - ${selectedSupplier?.name}`} 
                modalState={showClearDueModal} 
                toggleFormModal={() => setShowClearDueModal(false)}
            >
                <form onSubmit={submitClearDue} className="p-3">
                    <div className="form-group mb-3">
                        <label className="small font-weight-bold">Amount *</label>
                        <input 
                            type="number" 
                            step="any" 
                            required 
                            className="form-control" 
                            value={clearDueData.amount} 
                            onChange={(e) => setClearDueData({...clearDueData, amount: e.target.value})}
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label className="small font-weight-bold">Note</label>
                        <textarea 
                            className="form-control" 
                            rows="3" 
                            value={clearDueData.note}
                            onChange={(e) => setClearDueData({...clearDueData, note: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="d-flex justify-content-end">
                        <button type="submit" className="btn btn-primary px-4">Clear Due Now</button>
                    </div>
                </form>
            </FormModal>

            <style>{`
                .rounded-lg { border-radius: 1rem !important; }
                .table thead th { border-top: 0; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; color: #6c757d; }
                .dropdown-menu { border-radius: 0.75rem; padding: 0.5rem; }
                .dropdown-item { border-radius: 0.5rem; transition: all 0.2s; }
                .dropdown-item:hover { background-color: #f8f9fa; transform: translateX(4px); }
            `}</style>
        </div>
    );
};

export default SupplierList;
