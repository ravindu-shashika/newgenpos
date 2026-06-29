import React, { useState, useEffect } from 'react';
import { Trash2, Grid, X, Info, Calendar, Percent, Hash } from 'lucide-react';

const CreateDiscount = () => {
    // --- Form State ---
    const [formData, setFormData] = useState({
        name: '',
        discount_plans: [],
        applicable_for: 'All', // All or Specific
        is_active: true,
        valid_from: '',
        valid_till: '',
        type: 'percentage',
        value: '',
        minimum_qty: '',
        maximum_qty: '',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    });

    const [productCodeInput, setProductCodeInput] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);

    // Mock Data for Select Plans
    const discountPlans = [
        { id: 1, name: 'Year End Sale' },
        { id: 2, name: 'Member Exclusive' },
        { id: 3, name: 'Flash Deal' }
    ];

    // --- Handlers ---

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDayChange = (day) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    const handleProductInput = (e) => {
        const value = e.target.value;

        // Logic: If comma is typed, trigger search/add (simulating the jQuery logic)
        if (value.endsWith(',')) {
            const code = value.slice(0, -1).trim();
            if (code) {
                addProductByCode(code);
            }
            setProductCodeInput('');
        } else {
            setProductCodeInput(value);
        }
    };

    const addProductByCode = (code) => {
        if (selectedProducts.find(p => p.code === code)) {
            alert("This product already exists in the list.");
            return;
        }

        // Simulating API call: $.get('product-search/' + code)
        const mockProduct = {
            id: Math.floor(Math.random() * 1000),
            name: `Product ${code}`,
            code: code
        };

        setSelectedProducts([...selectedProducts, mockProduct]);
    };

    const removeProduct = (id) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting Data:", { ...formData, products: selectedProducts });
        alert("Discount Created Successfully!");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-700">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h4 className="text-xl font-semibold text-gray-800">Create Discount</h4>
                    </div>

                    <div className="p-6">
                        <p className="text-sm italic text-gray-400 mb-6 flex items-center">
                            <Info size={14} className="mr-1" />
                            The field labels marked with * are required input fields.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                                {/* Name */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1">Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* Discount Plan (Multi-select simulation) */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1">Discount Plan *</label>
                                    <select
                                        multiple
                                        name="discount_plans"
                                        className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-10"
                                        onChange={(e) => {
                                            const values = Array.from(e.target.selectedOptions, option => option.value);
                                            setFormData(prev => ({ ...prev, discount_plans: values }));
                                        }}
                                    >
                                        {discountPlans.map(plan => (
                                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Applicable For */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1">Applicable For *</label>
                                    <select
                                        name="applicable_for"
                                        className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.applicable_for}
                                        onChange={handleInputChange}
                                    >
                                        <option value="All">All Products</option>
                                        <option value="Specific">Specific Products</option>
                                    </select>
                                </div>

                                {/* Active Checkbox */}
                                <div className="flex items-center mt-6">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        name="is_active"
                                        checked={formData.is_active}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        onChange={handleInputChange}
                                    />
                                    <label htmlFor="is_active" className="ml-2 text-sm font-medium">Active</label>
                                </div>
                            </div>

                            {/* Specific Product Selection (Conditional) */}
                            {formData.applicable_for === 'Specific' && (
                                <div className="grid grid-cols-1 gap-6 bg-blue-50 p-4 rounded-lg animate-in fade-in duration-300">
                                    <div className="flex flex-col max-w-2xl">
                                        <label className="text-sm font-medium mb-1">Select Product *</label>
                                        <input
                                            type="text"
                                            placeholder="Type product code separated by comma"
                                            className="border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                            value={productCodeInput}
                                            onChange={handleProductInput}
                                        />
                                    </div>

                                    <div className="overflow-x-auto bg-white rounded border border-gray-200">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                                                <tr>
                                                    <th className="px-4 py-3"><Grid size={14} /></th>
                                                    <th className="px-4 py-3">Name</th>
                                                    <th className="px-4 py-3">Code</th>
                                                    <th className="px-4 py-3 text-center"><Trash2 size={14} /></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedProducts.map((prod, index) => (
                                                    <tr key={prod.id} className="text-sm">
                                                        <td className="px-4 py-3">{index + 1}</td>
                                                        <td className="px-4 py-3">{prod.name}</td>
                                                        <td className="px-4 py-3 font-mono">{prod.code}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeProduct(prod.id)}
                                                                className="text-red-500 hover:bg-red-50 p-1 rounded transition"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {selectedProducts.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-400 italic">No products added yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Dates and Values */}
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1 flex items-center"><Calendar size={14} className="mr-1" /> Valid From *</label>
                                    <input type="date" name="valid_from" required className="border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" onChange={handleInputChange} />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1 flex items-center"><Calendar size={14} className="mr-1" /> Valid Till *</label>
                                    <input type="date" name="valid_till" required className="border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" onChange={handleInputChange} />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1 flex items-center"><Percent size={14} className="mr-1" /> Discount Type *</label>
                                    <select name="type" className="border border-gray-300 rounded px-3 py-2 outline-none" onChange={handleInputChange}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat</option>
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1 flex items-center"><Hash size={14} className="mr-1" /> Value *</label>
                                    <input type="number" name="value" required className="border border-gray-300 rounded px-3 py-2 outline-none" onChange={handleInputChange} />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1">Minimum Qty *</label>
                                    <input type="number" name="minimum_qty" required className="border border-gray-300 rounded px-3 py-2 outline-none" onChange={handleInputChange} />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1">Maximum Qty *</label>
                                    <input type="number" name="maximum_qty" required className="border border-gray-300 rounded px-3 py-2 outline-none" onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Days Selection */}
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">Valid on the following days</label>
                                <div className="flex flex-wrap gap-4 bg-gray-50 p-4 rounded border border-gray-200">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                        <div key={day} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`day-${day}`}
                                                checked={formData.days.includes(day)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                                onChange={() => handleDayChange(day)}
                                            />
                                            <label htmlFor={`day-${day}`} className="ml-2 text-sm">{day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : day === 'Sat' ? 'Saturday' : 'Sunday'}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded shadow-sm transition-all transform active:scale-95"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateDiscount;