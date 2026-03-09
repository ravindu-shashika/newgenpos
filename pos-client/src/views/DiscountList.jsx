import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon, FormModal } from '../components';
import { faPlus, faEdit, faTrash, faEllipsisV, faSearch, faCalendarAlt, faPercentage, faMoneyBillWave, faBoxOpen, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import authStore from '../stores/authStore';

const DiscountList = () => {
    const navigate = useNavigate();
    const can = (p) => authStore.can(p);
    const [loading, setLoading] = useState(false);
    const [discounts, setDiscounts] = useState([]);
    const [discountPlans, setDiscountPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [productSearchInput, setProductSearchInput] = useState('');

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        discount_plan_id: [],
        applicable_for: 'All',
        is_active: true,
        valid_from: '',
        valid_till: '',
        type: 'percentage',
        value: '',
        minimum_qty: 1,
        maximum_qty: 999999,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    });

    const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    useEffect(() => {
        fetchDiscounts();
        fetchMetadata();
    }, []);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const response = await api.get('discounts');
            if (response.status === 200) {
                setDiscounts(response.data.data || []);
            }
        } catch (error) {
            msg.error('Failed to fetch discounts');
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const response = await api.get('discounts/create');
            if (response.status === 200) {
                setDiscountPlans(response.data.lims_discount_plan_list || []);
            }
        } catch (error) {
            console.error('Failed to fetch metadata', error);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setSelectedProducts([]);
        setFormData({
            id: '',
            name: '',
            discount_plan_id: [],
            applicable_for: 'All',
            is_active: true,
            valid_from: new Date().toISOString().split('T')[0],
            valid_till: '',
            type: 'percentage',
            value: '',
            minimum_qty: 1,
            maximum_qty: 999999,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        });
        setShowModal(true);
    };

    const handleOpenEditModal = async (discount) => {
        setLoading(true);
        try {
            const response = await api.get(`discounts/${discount.id}/edit`);
            if (response.status === 200) {
                const data = response.data.lims_discount_data;
                setIsEditing(true);
                setFormData({
                    id: data.id,
                    name: data.name,
                    discount_plan_id: response.data.discount_plan_ids || [],
                    applicable_for: data.applicable_for,
                    is_active: !!data.is_active,
                    valid_from: data.valid_from,
                    valid_till: data.valid_till,
                    type: data.type,
                    value: data.value,
                    minimum_qty: data.minimum_qty,
                    maximum_qty: data.maximum_qty,
                    days: data.days ? data.days.split(',') : []
                });
                setSelectedProducts(response.data.selected_products || []);
                setShowModal(true);
            }
        } catch (error) {
            msg.error('Failed to fetch discount details');
        } finally {
            setLoading(false);
        }
    };

    const handleProductSearch = async (e) => {
        const val = e.target.value;
        setProductSearchInput(val);

        if (val.endsWith(',')) {
            const code = val.slice(0, -1).trim();
            if (!code) return;

            if (selectedProducts.find(p => p.code === code)) {
                msg.warn('Product already added');
                setProductSearchInput('');
                return;
            }

            try {
                const response = await api.get(`discounts/product-search/${code}`);
                if (response.status === 200) {
                    setSelectedProducts([...selectedProducts, response.data]);
                }
            } catch (error) {
                msg.error('Product not found');
            }
            setProductSearchInput('');
        }
    };

    const removeProduct = (id) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== id));
    };

    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    const handleMultiSelectChange = (e) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(parseInt(options[i].value));
            }
        }
        setFormData({ ...formData, discount_plan_id: selected });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.applicable_for === 'Specific' && selectedProducts.length === 0) {
            msg.error('Please select at least one product');
            return;
        }

        const payload = {
            ...formData,
            product_list: formData.applicable_for === 'Specific' ? selectedProducts.map(p => p.id) : []
        };

        setLoading(true);
        try {
            let response;
            if (isEditing) {
                response = await api.put(`discounts/${formData.id}`, payload);
            } else {
                response = await api.post('discounts', payload);
            }

            if (response.data.status === 200) {
                msg.success(response.data.message);
                setShowModal(false);
                fetchDiscounts();
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
        if (!window.confirm('Are you sure you want to delete this discount?')) return;
        setLoading(true);
        try {
            const response = await api.delete(`discounts/${id}`);
            if (response.data.status === 200) {
                msg.success(response.data.message);
                fetchDiscounts();
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
                    <h3 className="font-weight-bold text-dark mb-0">Discounts</h3>
                    <p className="text-muted small">Manage promotional pricing and discount plans</p>
                </div>
                <div>
                    {can('discounts.create') && (
                        <button className="btn btn-info shadow-sm d-flex align-items-center px-4" onClick={handleOpenAddModal}>
                            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Create Discount
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
                                    <th className="px-4 py-3">Value</th>
                                    <th className="px-4 py-3">Discount Plan</th>
                                    <th className="px-4 py-3">Validity</th>
                                    <th className="px-4 py-3">Days</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discounts.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-5 text-muted font-italic">No discounts found.</td></tr>
                                ) : (
                                    discounts.map(discount => (
                                        <tr key={discount.id} className="align-middle">
                                            <td className="px-4 py-3 font-weight-bold text-dark">{discount.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`badge ${discount.type === 'percentage' ? 'badge-soft-primary' : 'badge-soft-success'} px-2 py-1`}>
                                                    {discount.type === 'percentage' ? <SafeFontAwesomeIcon icon={faPercentage} className="mr-1" /> : <SafeFontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />}
                                                    {parseFloat(discount.value)}{discount.type === 'percentage' ? '%' : ''}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 small text-muted">
                                                {discount.discount_plans ? discount.discount_plans.map(dp => dp.name).join(', ') : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 small text-nowrap">
                                                <div className="d-flex align-items-center">
                                                    <SafeFontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-muted" />
                                                    {discount.valid_from} to {discount.valid_till}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 small text-muted font-italic" style={{ maxWidth: '150px' }} title={discount.days}>
                                                {discount.days}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {discount.is_active ?
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
                                                        {can('discount.edit') && (
                                                            <button className="dropdown-item py-2" onClick={() => handleOpenEditModal(discount)}>
                                                                <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-primary" /> Edit
                                                            </button>
                                                        )}
                                                        {can('discount.delete') && (
                                                            <>
                                                                <div className="dropdown-divider"></div>
                                                                <button className="dropdown-item py-2 text-danger" onClick={() => handleDelete(discount.id)}>
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
                moduleName={isEditing ? 'Update Discount' : 'Create Discount'}
                modalState={showModal}
                toggleFormModal={() => setShowModal(false)}
                width="800px"
            >
                <form onSubmit={handleSubmit} className="p-3">
                    <p className="font-italic text-sm text-muted mb-4 small">The field labels marked with * are required input fields.</p>

                    <div className="row">
                        <div className="col-md-4 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Name *</label>
                            <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="col-md-4 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Discount Plan *</label>
                            <select multiple required className="form-control" value={formData.discount_plan_id} onChange={handleMultiSelectChange} style={{ height: '80px' }}>
                                {discountPlans.map(plan => (
                                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                                ))}
                            </select>
                            <small className="text-muted">Hold Ctrl to select multiple</small>
                        </div>
                        <div className="col-md-4 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Applicable For *</label>
                            <select className="form-control" required value={formData.applicable_for} onChange={e => setFormData({ ...formData, applicable_for: e.target.value })}>
                                <option value="All">All Products</option>
                                <option value="Specific">Specific Products</option>
                            </select>
                        </div>

                        <div className="col-md-4 form-group mb-3 d-flex align-items-center">
                            <div className="custom-control custom-switch mt-4">
                                <input type="checkbox" className="custom-control-input" id="isActive" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                <label className="custom-control-label font-weight-bold small" htmlFor="isActive">Active Status</label>
                            </div>
                        </div>

                        {formData.applicable_for === 'Specific' && (
                            <div className="col-12 mb-4">
                                <div className="card bg-light border-0">
                                    <div className="card-body">
                                        <label className="font-weight-bold small text-dark"><SafeFontAwesomeIcon icon={faSearch} className="mr-1" /> Select Products *</label>
                                        <input
                                            type="text"
                                            className="form-control mb-3"
                                            placeholder="Type product code followed by a comma (e.g. 1234,)"
                                            value={productSearchInput}
                                            onChange={handleProductSearch}
                                        />
                                        <div className="table-responsive bg-white rounded border">
                                            <table className="table table-sm mb-0">
                                                <thead className="small bg-white text-muted">
                                                    <tr>
                                                        <th className="px-3 py-2">#</th>
                                                        <th className="px-3 py-2">Name</th>
                                                        <th className="px-3 py-2">Code</th>
                                                        <th className="px-3 py-2 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedProducts.length === 0 ? (
                                                        <tr><td colSpan="4" className="text-center py-3 text-muted font-italic small">No products selected. Type code + comma to add.</td></tr>
                                                    ) : (
                                                        selectedProducts.map((p, idx) => (
                                                            <tr key={p.id} className="small">
                                                                <td className="px-3 py-2">{idx + 1}</td>
                                                                <td className="px-3 py-2">{p.name}</td>
                                                                <td className="px-3 py-2"><code className="text-primary font-weight-bold">{p.code}</code></td>
                                                                <td className="px-3 py-2 text-right">
                                                                    <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => removeProduct(p.id)}><SafeFontAwesomeIcon icon={faTrash} /></button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="col-md-4 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Valid From *</label>
                            <input type="date" className="form-control" required value={formData.valid_from} onChange={e => setFormData({ ...formData, valid_from: e.target.value })} />
                        </div>
                        <div className="col-md-4 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Valid Till *</label>
                            <input type="date" className="form-control" required value={formData.valid_till} onChange={e => setFormData({ ...formData, valid_till: e.target.value })} />
                        </div>
                        <div className="col-md-4 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Discount Type *</label>
                            <select className="form-control" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat</option>
                            </select>
                        </div>
                        <div className="col-md-4 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Value *</label>
                            <input type="number" className="form-control" required value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                        </div>
                        <div className="col-md-4 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Min Qty *</label>
                            <input type="number" className="form-control" required value={formData.minimum_qty} onChange={e => setFormData({ ...formData, minimum_qty: e.target.value })} />
                        </div>
                        <div className="col-md-4 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Max Qty *</label>
                            <input type="number" className="form-control" required value={formData.maximum_qty} onChange={e => setFormData({ ...formData, maximum_qty: e.target.value })} />
                        </div>

                        <div className="col-12 mt-3">
                            <label className="font-weight-bold small text-dark">Valid on the following days</label>
                            <div className="d-flex flex-wrap gap-3 mt-2">
                                {dayOptions.map(day => (
                                    <div key={day} className="custom-control custom-checkbox mr-3">
                                        <input
                                            type="checkbox"
                                            className="custom-control-input"
                                            id={`day-${day}`}
                                            checked={formData.days.includes(day)}
                                            onChange={() => toggleDay(day)}
                                        />
                                        <label className="custom-control-label small" htmlFor={`day-${day}`}>{day}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 d-flex gap-2">
                        <button type="submit" className="btn btn-primary px-5 py-2 shadow-sm text-white">Submit</button>
                        <button type="button" className="btn btn-light border px-5 py-2" onClick={() => setShowModal(false)}>Cancel</button>
                    </div>
                </form>
            </FormModal>

            <style>{`
                .badge-soft-primary { background-color: rgba(124, 92, 196, 0.1); color: #7c5cc4; }
                .badge-soft-success { background-color: rgba(40, 167, 69, 0.1); color: #28a745; }
                .form-control:focus { border-color: #7c5cc4; box-shadow: 0 0 0 0.2rem rgba(124, 92, 196, 0.1); }
                .custom-switch .custom-control-input:checked ~ .custom-control-label::before { background-color: #7c5cc4; border-color: #7c5cc4; }
                .gap-2 { gap: 0.5rem; }
                .gap-3 { gap: 1rem; }
            `}</style>
        </div>
    );
};

export default DiscountList;
