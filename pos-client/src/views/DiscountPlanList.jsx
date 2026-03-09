import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon, FormModal } from '../components';
import { faPlus, faEdit, faTrash, faEllipsisV, faCheckCircle, faTimesCircle, faUsers, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import authStore from '../stores/authStore';

const DiscountPlanList = () => {
    const navigate = useNavigate();
    const can = (p) => authStore.can(p);
    const [loading, setLoading] = useState(false);
    const [discountPlans, setDiscountPlans] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [allCustomerIds, setAllCustomerIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        customer_id: [],
        type: 'limited',
        is_active: true
    });

    useEffect(() => {
        fetchDiscountPlans();
        fetchMetadata();
    }, []);

    const fetchDiscountPlans = async () => {
        setLoading(true);
        try {
            const response = await api.get('discount-plans');
            if (response.status === 200) {
                setDiscountPlans(response.data.data || []);
            }
        } catch (error) {
            msg.error('Failed to fetch discount plans');
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const response = await api.get('discount-plans/create');
            if (response.status === 200) {
                setCustomers(response.data.lims_customer_list || []);
            }
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setFormData({
            id: '',
            name: '',
            customer_id: [],
            type: 'limited',
            is_active: true
        });
        setShowModal(true);
    };

    const handleOpenEditModal = async (plan) => {
        setLoading(true);
        try {
            const response = await api.get(`discount-plans/${plan.id}/edit`);
            if (response.status === 200) {
                const data = response.data.data;
                setIsEditing(true);
                setFormData({
                    id: data.id,
                    name: data.name,
                    customer_id: response.data.selected_customer_ids || [],
                    type: data.type,
                    is_active: !!data.is_active
                });
                setAllCustomerIds(response.data.all_customer_ids || []);
                setShowModal(true);
            }
        } catch (error) {
            msg.error('Failed to fetch discount plan details');
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = (e) => {
        const type = e.target.value;
        let selectedCustomers = formData.customer_id;
        
        if (type === 'generic') {
            // Select all active customers
            selectedCustomers = customers.map(c => c.id);
        }
        
        setFormData({ ...formData, type, customer_id: selectedCustomers });
    };

    const handleMultiSelectChange = (e) => {
        if (formData.type === 'generic') return; // Selection is fixed for generic
        
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(parseInt(options[i].value));
            }
        }
        setFormData({ ...formData, customer_id: selected });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.customer_id.length === 0) {
            msg.error('Please select at least one customer');
            return;
        }

        setLoading(true);
        try {
            let response;
            if (isEditing) {
                response = await api.put(`discount-plans/${formData.id}`, formData);
            } else {
                response = await api.post('discount-plans', formData);
            }

            if (response.data.status === 200) {
                msg.success(response.data.message);
                setShowModal(false);
                fetchDiscountPlans();
            } else {
                msg.error(response.data.message);
            }
        } catch (error) {
            msg.error('Request failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this discount plan?')) return;
        setLoading(true);
        try {
            const response = await api.delete(`discount-plans/${id}`);
            if (response.data.status === 200) {
                msg.success(response.data.message);
                fetchDiscountPlans();
            }
        } catch (error) {
            msg.error('Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid py-4 p-4">
            {loading && <Loader />}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="font-weight-bold text-dark mb-0">Discount Plans</h3>
                    <p className="text-muted small">Manage tiered discount structures for specific customer groups</p>
                </div>
                <div>
                    {can('discount_plan.create') && (
                        <button className="btn btn-info shadow-sm d-flex align-items-center px-4" onClick={handleOpenAddModal}>
                            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Create Plan
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
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Customers</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discountPlans.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-5 text-muted font-italic">No discount plans found.</td></tr>
                                ) : (
                                    discountPlans.map(plan => (
                                        <tr key={plan.id} className="align-middle">
                                            <td className="px-4 py-3 font-weight-bold text-dark">{plan.name}</td>
                                            <td className="px-4 py-3 small text-muted">
                                                <div className="d-flex align-items-center">
                                                    <SafeFontAwesomeIcon icon={faUsers} className="mr-2 text-primary-soft" />
                                                    <span className="text-truncate" style={{maxWidth: '300px'}} title={plan.customers.map(c => c.name).join(', ')}>
                                                        {plan.customers.length > 0 ? plan.customers.map(c => c.name).join(', ') : 'No customers'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`badge ${plan.type === 'generic' ? 'badge-soft-info' : 'badge-soft-primary'} px-3 py-1 rounded-pill`}>
                                                    <SafeFontAwesomeIcon icon={faLayerGroup} className="mr-1 small" />
                                                    {plan.type === 'generic' ? 'Generic' : 'Limited'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {plan.is_active ? 
                                                    <span className="badge badge-success px-3 py-1 rounded-pill"><SafeFontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Active</span> :
                                                    <span className="badge badge-light border px-3 py-1 rounded-pill text-muted"><SafeFontAwesomeIcon icon={faTimesCircle} className="mr-1" /> Inactive</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="dropdown">
                                                    <button className="btn btn-light btn-sm dropdown-toggle border" type="button" data-toggle="dropdown">
                                                        <SafeFontAwesomeIcon icon={faEllipsisV} /> Action
                                                    </button>
                                                    <div className="dropdown-menu dropdown-menu-right shadow border-0">
                                                        {can('discount_plan.edit') && (
                                                            <button className="dropdown-item py-2" onClick={() => handleOpenEditModal(plan)}>
                                                                <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-primary" /> Edit
                                                            </button>
                                                        )}
                                                        {can('discount_plan.delete') && (
                                                            <>
                                                                <div className="dropdown-divider"></div>
                                                                <button className="dropdown-item py-2 text-danger" onClick={() => handleDelete(plan.id)}>
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
                moduleName={isEditing ? 'Update Discount Plan' : 'Create Discount Plan'}
                modalState={showModal}
                toggleFormModal={() => setShowModal(false)}
                width="600px"
            >
                <form onSubmit={handleSubmit} className="p-4">
                    <p className="font-italic text-sm text-muted mb-4 small">The field labels marked with * are required input fields.</p>
                    
                    <div className="form-group mb-3">
                        <label className="font-weight-bold small text-dark">Name *</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            required 
                            placeholder="Enter Plan Name"
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label className="font-weight-bold small text-dark">Type *</label>
                        <select 
                            className="form-control" 
                            required 
                            value={formData.type} 
                            onChange={handleTypeChange}
                        >
                            <option value="limited">Limited (Select specific customers)</option>
                            <option value="generic">Generic (Applies to all customers)</option>
                        </select>
                    </div>

                    <div className="form-group mb-3">
                        <label className="font-weight-bold small text-dark">Customers *</label>
                        <div className="border rounded bg-white p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <select 
                                multiple 
                                required 
                                className="form-control border-0 shadow-none p-0" 
                                value={formData.customer_id} 
                                onChange={handleMultiSelectChange}
                                disabled={formData.type === 'generic'}
                                style={{ height: '150px' }}
                            >
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id} className="px-3 py-1">
                                        {customer.name} {customer.phone_number ? `(${customer.phone_number})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <small className="text-muted mt-1 d-block">
                            {formData.type === 'generic' ? 'All customers are selected automatically.' : 'Hold Ctrl (or Cmd) to select multiple customers.'}
                        </small>
                    </div>

                    <div className="form-group mb-4">
                        <div className="custom-control custom-switch mt-2">
                            <input 
                                type="checkbox" 
                                className="custom-control-input" 
                                id="is_active_plan" 
                                checked={formData.is_active} 
                                onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                            />
                            <label className="custom-control-label font-weight-bold small pt-1" htmlFor="is_active_plan">Active Status</label>
                        </div>
                    </div>

                    <div className="mt-5 d-flex gap-2 justify-content-end">
                        <button type="button" className="btn btn-light border px-4 py-2" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary px-5 py-2 shadow-sm text-white">Submit</button>
                    </div>
                </form>
            </FormModal>

            <style>{`
                .badge-soft-primary { background-color: rgba(124, 92, 196, 0.1); color: #7c5cc4; }
                .badge-soft-info { background-color: rgba(0, 123, 255, 0.1); color: #007bff; }
                .text-primary-soft { color: #7c5cc4; opacity: 0.6; }
                .form-control:focus { border-color: #7c5cc4; box-shadow: 0 0 0 0.2rem rgba(124, 92, 196, 0.1); }
                .custom-switch .custom-control-input:checked ~ .custom-control-label::before { background-color: #7c5cc4; border-color: #7c5cc4; }
                .gap-2 { gap: 0.5rem; }
            `}</style>
        </div>
    );
};

export default DiscountPlanList;
