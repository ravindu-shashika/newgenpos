import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, MoreVertical } from 'lucide-react';

const CourierManager = () => {
    // --- State ---
    const [couriers, setCouriers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        phone_number: '',
        address: '',
        api_key: '',
        secret_key: '',
        is_active: 1
    });

    // --- Handlers ---
    const handleEditClick = (courier) => {
        setFormData(courier);
        setShowEditModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const confirmDelete = () => {
        return window.confirm("Are you sure want to delete?");
    };

    // Helper to mask keys (similar to Laravel's Str::limit)
    const maskKey = (key) => (key ? `${key.substring(0, 3)}...` : 'N/A');

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header Action */}
            <div className="mb-4">
                <button
                    onClick={() => {
                        setFormData({ name: '', phone_number: '', address: '', api_key: '', secret_key: '', is_active: 1 });
                        setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded shadow hover:bg-cyan-700 transition"
                >
                    <Plus size={18} /> Add Courier
                </button>
            </div>

            {/* --- Table --- */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-gray-600 w-10">#</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Phone</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Address</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">API Key</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Secret Key</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {couriers.map((courier, index) => (
                            <tr key={courier.id} className="border-b hover:bg-gray-50 transition">
                                <td className="p-3 text-gray-500">{index + 1}</td>
                                <td className="p-3 font-medium">{courier.name}</td>
                                <td className="p-3">{courier.phone_number}</td>
                                <td className="p-3 text-sm">{courier.address}</td>
                                <td className="p-3 text-xs font-mono">{maskKey(courier.api_key)}</td>
                                <td className="p-3 text-xs font-mono">{maskKey(courier.secret_key)}</td>
                                <td className="p-3 text-center">
                                    <div className="flex justify-center gap-3">
                                        <button
                                            onClick={() => handleEditClick(courier)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => confirmDelete() && console.log('Delete', courier.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Shared Modal Component --- */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold">{showEditModal ? 'Update Courier' : 'Add Courier'}</h2>
                            <button onClick={() => { setShowCreateModal(false); setShowEditModal(false) }} className="text-gray-400 hover:text-gray-600">
                                <X />
                            </button>
                        </div>

                        <form className="p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <p className="text-xs italic text-gray-500">The field labels marked with * are required.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Name *</label>
                                    <input
                                        type="text" name="name" value={formData.name} onChange={handleChange}
                                        disabled={formData.name === 'SteadFast'}
                                        className="border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Phone Number *</label>
                                    <input
                                        type="text" name="phone_number" value={formData.phone_number} onChange={handleChange}
                                        className="border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Address *</label>
                                <input
                                    type="text" name="address" value={formData.address} onChange={handleChange}
                                    className="border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">API Key</label>
                                <input
                                    type="text" name="api_key" value={formData.api_key} onChange={handleChange}
                                    className="border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Secret Key</label>
                                <input
                                    type="text" name="secret_key" value={formData.secret_key} onChange={handleChange}
                                    className="border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition">
                                    {showEditModal ? 'Update' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourierManager;