import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Download, Eye, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateUniqueCode } from '../../../services';

const CouponManager = () => {
    // --- State Management ---
    const [coupons, setCoupons] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        amount: '',
        minimum_amount: '',
        quantity: '',
        expired_date: new Date().toISOString().split('T')[0]
    });

    // --- Helpers ---
    const generateCode = async () => {
        try {
            const code = await generateUniqueCode('coupon', {
                exceptId: selectedCoupon?.id || null,
            });
            setFormData({ ...formData, code });
        } catch (err) {
            console.error('Failed to generate coupon code', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openEditModal = (coupon) => {
        setSelectedCoupon(coupon);
        setFormData(coupon);
        setIsEditModalOpen(true);
    };

    // --- Render Helpers ---
    const isExpired = (date) => new Date(date) < new Date().setHours(0, 0, 0, 0);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Notifications Area (Mocking <x-messages />) */}
            <div className="mb-4">
                <button
                    onClick={() => { setIsCreateModalOpen(true); setFormData({ type: 'percentage', expired_date: new Date().toISOString().split('T')[0] }); }}
                    className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded shadow hover:bg-cyan-700 transition"
                >
                    <Plus size={18} /> Add Coupon
                </button>
            </div>

            {/* --- Table Section --- */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-gray-600">Code</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Type</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Amount</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Min Amount</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Qty</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Available</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Expired Date</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Created By</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map((coupon) => (
                            <tr key={coupon.id} className="border-b hover:bg-gray-50 transition">
                                <td className="p-3">{coupon.code}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs text-white ${coupon.type === 'percentage' ? 'bg-blue-500' : 'bg-cyan-500'}`}>
                                        {coupon.type}
                                    </span>
                                </td>
                                <td className="p-3">{coupon.amount}</td>
                                <td className="p-3">{coupon.minimum_amount || 'N/A'}</td>
                                <td className="p-3">{coupon.quantity}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs text-white ${(coupon.quantity - coupon.used) > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {coupon.quantity - coupon.used}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs text-white ${isExpired(coupon.expired_date) ? 'bg-red-500' : 'bg-green-500'}`}>
                                        {coupon.expired_date}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-500">{coupon.creator_name}</td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(coupon)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                        <button className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Modal Component --- */}
            {(isCreateModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold">{isEditModalOpen ? 'Update Coupon' : 'Add Coupon'}</h2>
                            <button onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false) }}><X /></button>
                        </div>

                        <form className="p-6">
                            <p className="text-xs italic text-gray-500 mb-4">The field labels marked with * are required input fields.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Coupon Code */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Coupon Code *</label>
                                    <div className="flex">
                                        <input
                                            type="text" name="code" value={formData.code} onChange={handleInputChange}
                                            className="border rounded-l px-3 py-2 w-full focus:outline-cyan-500" required
                                        />
                                        <button type="button" onClick={generateCode} className="bg-gray-200 px-3 py-2 rounded-r border border-l-0 hover:bg-gray-300">Generate</button>
                                    </div>
                                </div>

                                {/* Type */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Type *</label>
                                    <select name="type" value={formData.type} onChange={handleInputChange} className="border rounded px-3 py-2 focus:outline-cyan-500">
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </select>
                                </div>

                                {/* Conditional Minimum Amount */}
                                {formData.type === 'fixed' && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">Minimum Amount *</label>
                                        <input type="number" name="minimum_amount" value={formData.minimum_amount} onChange={handleInputChange} className="border rounded px-3 py-2 focus:outline-cyan-500" />
                                    </div>
                                )}

                                {/* Amount */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Amount *</label>
                                    <div className="relative">
                                        <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="border rounded px-3 py-2 w-full focus:outline-cyan-500" required />
                                        <span className="absolute right-3 top-2 font-bold text-gray-400">
                                            {formData.type === 'percentage' ? '%' : '$'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Qty *</label>
                                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="border rounded px-3 py-2 focus:outline-cyan-500" required />
                                </div>

                                {/* Expiry Date */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Expired Date</label>
                                    <input type="date" name="expired_date" value={formData.expired_date} onChange={handleInputChange} className="border rounded px-3 py-2 focus:outline-cyan-500" />
                                </div>

                            </div>
                            <button type="submit" className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Submit</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponManager;