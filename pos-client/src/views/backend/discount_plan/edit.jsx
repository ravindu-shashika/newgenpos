import React, { useState, useEffect } from 'react';
import { api } from '../../../services';

const UpdateDiscountPlan = ({
    discountPlan = {},
    customers = [],
    selectedCustomerIds = [],
    allCustomerIds = [],
    translations = {}
}) => {
    const [formData, setFormData] = useState({
        name: discountPlan.name || '',
        customer_id: selectedCustomerIds || [],
        type: discountPlan.type || 'limited',
        is_active: discountPlan.is_active ? 1 : 0,
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Initialize customer selection based on type
    useEffect(() => {
        if (discountPlan.type === 'generic') {
            setFormData(prev => ({
                ...prev,
                customer_id: allCustomerIds,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                customer_id: selectedCustomerIds,
            }));
        }
    }, [discountPlan.type, selectedCustomerIds, allCustomerIds]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked ? 1 : 0,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // Handle customer selection
    const handleCustomerChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({
            ...prev,
            customer_id: selectedOptions,
        }));
    };

    // Handle type change - auto-select customers based on type
    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setFormData(prev => ({
            ...prev,
            type: newType,
            customer_id: newType === 'generic'
                ? allCustomerIds
                : selectedCustomerIds,
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const response = await api.putapi(`discount-plans/${discountPlan.id}`, formData);
            setSuccessMessage(response.data.message || 'Discount plan updated successfully');

            // Optionally redirect after success
            // setTimeout(() => window.location.href = '/discount-plans', 2000);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || 'Failed to update discount plan'
            );
        } finally {
            setLoading(false);
        }
    };

    const t = (key) => translations[key] || key;

    return (
        <section className="forms">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header d-flex align-items-center">
                                <h4>{t('db.Update Discount Plan')}</h4>
                            </div>
                            <div className="card-body">
                                {successMessage && (
                                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                                        {successMessage}
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setSuccessMessage('')}
                                        />
                                    </div>
                                )}

                                {errorMessage && (
                                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                        {errorMessage}
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setErrorMessage('')}
                                        />
                                    </div>
                                )}

                                <p className="italic">
                                    <small>
                                        {t('db.The field labels marked with * are required input fields')}.
                                    </small>
                                </p>

                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        {/* Name Field */}
                                        <div className="col-md-4">
                                            <label htmlFor="name">
                                                {t('db.name')} <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                className="form-control"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter discount plan name"
                                            />
                                        </div>

                                        {/* Customer Selection */}
                                        <div className="col-md-4">
                                            <label htmlFor="customer-select">
                                                {t('db.customer')} <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                id="customer-select"
                                                name="customer_id"
                                                required
                                                multiple
                                                className="form-control selectpicker customer-ids"
                                                value={formData.customer_id}
                                                onChange={handleCustomerChange}
                                                data-live-search="true"
                                                title="Select customer..."
                                            >
                                                {customers.map(customer => (
                                                    <option key={customer.id} value={customer.id}>
                                                        {customer.name} ({customer.phone_number})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Type Selection */}
                                        <div className="col-md-4">
                                            <label htmlFor="type-select">
                                                {t('db.Type')} <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                id="type-select"
                                                name="type"
                                                required
                                                className="form-control selectpicker"
                                                value={formData.type}
                                                onChange={handleTypeChange}
                                            >
                                                <option value="limited">Limited</option>
                                                <option value="generic">Generic</option>
                                            </select>
                                        </div>

                                        {/* Active Checkbox */}
                                        <div className="col-md-3 mt-4">
                                            <div className="form-group">
                                                <input
                                                    type="checkbox"
                                                    id="is_active"
                                                    name="is_active"
                                                    value="1"
                                                    checked={formData.is_active === 1}
                                                    onChange={handleInputChange}
                                                />
                                                <label htmlFor="is_active" className="ms-2">
                                                    {t('db.Active')}
                                                </label>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="col-md-12 mt-3">
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={loading}
                                            >
                                                {loading ? 'Updating...' : t('db.submit')}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UpdateDiscountPlan;
