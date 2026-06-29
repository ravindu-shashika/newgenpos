import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Info, Eye, FileText, Printer, Download } from 'lucide-react';

const CurrencyManager = ({ currencies: initialCurrencies, defaultCurrency }) => {
    // --- State ---
    const [currencies, setCurrencies] = useState(initialCurrencies || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        code: '',
        symbol: '',
        exchange_rate: ''
    });

    // --- Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Validation Logic: Check against default exchange rate (from your jQuery logic)
        if (name === 'exchange_rate' && parseFloat(value) === defaultCurrency.exchange_rate) {
            setErrors({ exchange_rate: `Only default currency can have ${defaultCurrency.exchange_rate} as exchange rate.` });
        } else {
            setErrors({});
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setEditMode(false);
        setFormData({ id: null, name: '', code: '', symbol: '', exchange_rate: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (currency) => {
        setEditMode(true);
        setFormData(currency);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure want to delete?")) {
            // Logic for API delete call would go here
            setCurrencies(currencies.filter(c => c.id !== id));
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header section */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md shadow-sm transition-all"
                >
                    <Plus size={18} /> Add Currency
                </button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 w-12"><input type="checkbox" className="rounded text-cyan-600" /></th>
                            <th className="p-4 font-semibold text-sm">Currency Name</th>
                            <th className="p-4 font-semibold text-sm">Currency Code</th>
                            <th className="p-4 font-semibold text-sm">Symbol</th>
                            <th className="p-4 font-semibold text-sm">Exchange Rate</th>
                            <th className="p-4 font-semibold text-sm text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currencies.map((currency) => (
                            <tr key={currency.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="p-4"><input type="checkbox" className="rounded" /></td>
                                <td className="p-4 text-sm">{currency.name}</td>
                                <td className="p-4 text-sm font-mono">{currency.code}</td>
                                <td className="p-4 text-sm">{currency.symbol}</td>
                                <td className="p-4 text-sm">{currency.exchange_rate}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openEditModal(currency)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {currency.exchange_rate !== 1 && (
                                            <button
                                                onClick={() => handleDelete(currency.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Shared Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b">
                            <h3 className="text-lg font-bold text-gray-700">
                                {editMode ? 'Update Currency' : 'Add Currency'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form className="p-6 space-y-4">
                            <p className="text-xs italic text-gray-500">Fields marked with * are required.</p>

                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text" name="name" value={formData.name} onChange={handleInputChange} required
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                                    placeholder="Type currency name"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-1 text-sm font-medium mb-1">
                                    Code * <Info size={14} className="text-blue-400" title="USD, NGN, INR..." />
                                </label>
                                <input
                                    type="text" name="code" value={formData.code} onChange={handleInputChange} required
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                                    placeholder="Type currency code"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Symbol</label>
                                <input
                                    type="text" name="symbol" value={formData.symbol} onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                                    placeholder="$, ₹, ₦..."
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-1 text-sm font-medium mb-1">
                                    Exchange Rate * <Info size={14} className="text-blue-400" title="Default currency must be 1" />
                                </label>
                                <input
                                    type="number" name="exchange_rate" value={formData.exchange_rate} onChange={handleInputChange}
                                    step="any" required
                                    className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 ${errors.exchange_rate ? 'border-red-500 ring-red-200' : 'focus:ring-cyan-500'}`}
                                    placeholder="Type exchange rate"
                                />
                                {errors.exchange_rate && (
                                    <p className="text-red-500 text-xs mt-1 bg-red-50 p-2 rounded">{errors.exchange_rate} - {defaultCurrency.name}</p>
                                )}
                            </div>

                            <div className="pt-4 border-t flex gap-3">
                                <button
                                    type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={Object.keys(errors).length > 0}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {editMode ? 'Update' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurrencyManager;