import React, { useState, useEffect } from 'react';
import { Trash2, Grid, X, Info, Calendar, Percent, Hash, Save } from 'lucide-react';

const UpdateDiscount = ({ existingData, discountPlanList }) => {
    // --- Initial State Hydration ---
    // In a real app, 'existingData' would come from your Laravel backend API
    const [formData, setFormData] = useState({
        name: '',
        discount_plan_ids: [],
        applicable_for: 'All',
        is_active: true,
        valid_from: '',
        valid_till: '',
        type: 'percentage',
        value: 0,
        minimum_qty: 0,
        maximum_qty: 0,
        days: []
    });

    const [productCodeInput, setProductCodeInput] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);

    // Simulate Laravel's PHP logic for filling the form on mount
    useEffect(() => {
        if (existingData) {
            setFormData({
                ...existingData,
                // Convert comma-separated string from DB to array for React state
                days: existingData.days ? existingData.days.split(',') : []
            });

            // If the discount is for specific products, populate the table
            if (existingData.applicable_for === 'Specific' && existingData.products) {
                setSelectedProducts(existingData.products);
            }
        }
    }, [existingData]);

    // --- Handlers ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDayToggle = (day) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    const handleProductInput = (e) => {
        const value = e.target.value;
        if (value.endsWith(',')) {
            const code = value.slice(0, -1).trim();
            if (code) {
                // Simulating the $.get('../product-search/' + code)
                const mockNewProduct = { id: Math.random(), name: `New Product ${code}`, code: code };
                setSelectedProducts(prev => [...prev, mockNewProduct]);
            }
            setProductCodeInput('');
        } else {
            setProductCodeInput(value);
        }
    };

    const removeProduct = (id) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-gray-800 font-sans">
            <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">

                {/* Header */}
                <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide">Update Discount</h2>
                </div>

                <form className="p-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <p className="text-sm italic text-gray-500 border-l-4 border-blue-500 pl-3">
                        The field labels marked with * are required input fields.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Name */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
                                required
                            />
                        </div>

                        {/* Discount Plan */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1">Discount Plan *</label>
                            <select
                                multiple
                                name="discount_plan_ids"
                                value={formData.discount_plan_ids}
                                onChange={(e) => {
                                    const values = Array.from(e.target.selectedOptions, option => option.value);
                                    setFormData(prev => ({ ...prev, discount_plan_ids: values }));
                                }}
                                className="border rounded-lg px-3 py-2 h-10 focus:ring-2 focus:ring-blue-400"
                            >
                                {discountPlanList?.map(plan => (
                                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Applicable For */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1">Applicable For *</label>
                            <select
                                name="applicable_for"
                                value={formData.applicable_for}
                                onChange={handleInputChange}
                                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="All">All Products</option>
                                <option value="Specific">Specific Products</option>
                            </select>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center mt-6">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium">Active</span>
                            </label>
                        </div>
                    </div>

                    {/* Product Selection Table (Dynamic) */}
                    {formData.applicable_for === 'Specific' && (
                        <div className="bg-blue-50 p-4 rounded-xl space-y-4 border border-blue-100">
                            <div className="max-w-md">
                                <label className="text-sm font-bold block mb-1">Select Product *</label>
                                <input
                                    type="text"
                                    value={productCodeInput}
                                    onChange={handleProductInput}
                                    placeholder="Type product code separated by comma"
                                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="bg-white rounded-lg shadow-inner overflow-hidden border">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                                        <tr>
                                            <th className="p-3 w-12"><Grid size={14} /></th>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Code</th>
                                            <th className="p-3 w-12 text-center"><Trash2 size={14} /></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedProducts.map((product, index) => (
                                            <tr key={product.id} className="text-sm hover:bg-gray-50">
                                                <td className="p-3 text-gray-400">{index + 1}</td>
                                                <td className="p-3 font-medium">{product.name}</td>
                                                <td className="p-3 font-mono text-blue-600">{product.code}</td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProduct(product.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Dates and Config */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1 flex items-center"><Calendar size={14} className="mr-2 text-blue-500" /> Valid From *</label>
                            <input type="date" name="valid_from" value={formData.valid_from} onChange={handleInputChange} className="border rounded-lg px-3 py-2" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1 flex items-center"><Calendar size={14} className="mr-2 text-red-500" /> Valid Till *</label>
                            <input type="date" name="valid_till" value={formData.valid_till} onChange={handleInputChange} className="border rounded-lg px-3 py-2" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1 flex items-center"><Percent size={14} className="mr-2 text-green-500" /> Discount Type *</label>
                            <select name="type" value={formData.type} onChange={handleInputChange} className="border rounded-lg px-3 py-2">
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1 flex items-center"><Hash size={14} className="mr-2" /> Value *</label>
                            <input type="number" name="value" value={formData.value} onChange={handleInputChange} className="border rounded-lg px-3 py-2" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1">Minimum Qty *</label>
                            <input type="number" name="minimum_qty" value={formData.minimum_qty} onChange={handleInputChange} className="border rounded-lg px-3 py-2" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1">Maximum Qty *</label>
                            <input type="number" name="maximum_qty" value={formData.maximum_qty} onChange={handleInputChange} className="border rounded-lg px-3 py-2" />
                        </div>
                    </div>

                    {/* Day Checkboxes */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold">Valid on the following days</label>
                        <div className="flex flex-wrap gap-4 bg-gray-50 p-4 rounded-lg border">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <label key={day} className="flex items-center space-x-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.days.includes(day)}
                                        onChange={() => handleDayToggle(day)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm group-hover:text-blue-600 transition-colors">{day}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t">
                        <button
                            type="submit"
                            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition active:scale-95"
                        >
                            <Save size={18} className="mr-2" /> Submit Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateDiscount;