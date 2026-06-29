import React, { useState, useEffect } from 'react';
import { api } from '../../../services';

const CreateDiscountPlan = ({ customers = [], translations = {} }) => {
    const [formData, setFormData] = useState({
        name: '',
        customer_id: [],
        type: 'limited',
        is_active: true,
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

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
    const handleCustomerChange = (selectedCustomers) => {
        setFormData(prev => ({
            ...prev,
            customer_id: selectedCustomers,
        }));
    };

    // Handle type change - auto-select all customers if generic
    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setFormData(prev => ({
            ...prev,
            type: newType,
            customer_id: newType === 'generic'
                ? customers.map(c => c.id)
                : prev.customer_id,
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const response = await api.postapi('discount-plans', formData);
            setSuccessMessage(response.data.message || 'Discount plan created successfully');

            // Reset form
            setFormData({
                name: '',
                customer_id: [],
                type: 'limited',
                is_active: true,
            });
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || 'Failed to create discount plan'
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
                                <h4>{t('db.Create Discount Plan')}</h4>
                            </div>
                            <div className="card-body">
                                {successMessage && (
                                    <div className="alert alert-success" role="alert">
                                        {successMessage}
                                    </div>
                                )}

                                {errorMessage && (
                                    <div className="alert alert-danger" role="alert">
                                        {errorMessage}
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
                                                className="form-control selectpicker"
                                                value={formData.customer_id}
                                                onChange={(e) => handleCustomerChange(
                                                    Array.from(e.target.selectedOptions, option => option.value)
                                                )}
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
                                                {loading ? 'Submitting...' : t('db.submit')}
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

export default CreateDiscountPlan;
