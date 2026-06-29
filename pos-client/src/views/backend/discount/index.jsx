import React, { useState } from 'react';
import {
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Search,
    FileText,
    Download,
    Printer,
    Eye
} from 'lucide-react';

const DiscountList = ({ initialDiscounts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);

    // --- Logic for Search ---
    const filteredDiscounts = initialDiscounts.filter(discount =>
        discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        discount.days.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Selection Logic ---
    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(filteredDiscounts.map(d => d.id));
        } else {
            setSelectedRows([]);
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto space-y-4">

                {/* Top Action Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <button className="flex items-center bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded shadow transition">
                        <Plus size={18} className="mr-2" /> Create Discount
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Export Buttons (Mock) */}
                        <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm">
                            <button className="p-2 hover:bg-gray-100 border-r" title="Export PDF"><FileText size={18} className="text-red-500" /></button>
                            <button className="p-2 hover:bg-gray-100 border-r" title="Export Excel"><Download size={18} className="text-green-600" /></button>
                            <button className="p-2 hover:bg-gray-100 border-r" title="Print"><Printer size={18} className="text-gray-600" /></button>
                            <button className="p-2 hover:bg-gray-100" title="Column Visibility"><Eye size={18} className="text-blue-500" /></button>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-4 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            onChange={toggleSelectAll}
                                            checked={selectedRows.length === filteredDiscounts.length && filteredDiscounts.length > 0}
                                            className="rounded text-cyan-600"
                                        />
                                    </th>
                                    <th className="px-4 py-4">Name</th>
                                    <th className="px-4 py-4">Value</th>
                                    <th className="px-4 py-4">Discount Plan</th>
                                    <th className="px-4 py-4">Validity</th>
                                    <th className="px-4 py-4">Days</th>
                                    <th className="px-4 py-4">Products</th>
                                    <th className="px-4 py-4 text-center">Status</th>
                                    <th className="px-4 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredDiscounts.map((discount, index) => (
                                    <tr key={discount.id} className={`hover:bg-cyan-50/30 transition ${selectedRows.includes(discount.id) ? 'bg-cyan-50' : ''}`}>
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(discount.id)}
                                                onChange={() => toggleSelectRow(discount.id)}
                                                className="rounded text-cyan-600"
                                            />
                                        </td>
                                        <td className="px-4 py-4 font-medium text-gray-900">{discount.name}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                {discount.value} ({discount.type})
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {discount.discountPlans?.map(p => p.name).join(', ')}
                                        </td>
                                        <td className="px-4 py-4 text-xs whitespace-nowrap text-gray-500 font-mono">
                                            {discount.valid_from} to {discount.valid_till}
                                        </td>
                                        <td className="px-4 py-4 text-xs text-gray-500">{discount.days}</td>
                                        <td className="px-4 py-4 max-w-xs">
                                            <div className="truncate text-xs text-gray-600" title={discount.productList}>
                                                {discount.productList || "All Products"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${discount.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {discount.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="relative group inline-block">
                                                <button className="p-2 hover:bg-gray-200 rounded-full transition">
                                                    <MoreVertical size={16} />
                                                </button>
                                                {/* Dropdown Menu (Simplified) */}
                                                <div className="absolute right-0 mt-1 w-32 bg-white border rounded-lg shadow-xl hidden group-hover:block z-20">
                                                    <button className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-50 text-blue-600">
                                                        <Edit size={14} className="mr-2" /> Edit
                                                    </button>
                                                    <button className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-50 text-red-600">
                                                        <Trash2 size={14} className="mr-2" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Info */}
                    <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center text-xs text-gray-500">
                        <span>Showing 1 to {filteredDiscounts.length} of {filteredDiscounts.length} records</span>
                        <div className="flex gap-1">
                            <button className="px-3 py-1 border rounded bg-white disabled:opacity-50">Previous</button>
                            <button className="px-3 py-1 border rounded bg-white">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscountList;