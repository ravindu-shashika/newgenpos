import React, { useState, useEffect } from 'react';
import { api } from '../../../services';
import AsyncSelect from 'react-select/async'; // Recommended for the product search
import DatePicker from 'react-datepicker'; // Standard React date picker
import "react-datepicker/dist/react-datepicker.css";

const PrintBarcodePage = () => {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [paperSize, setPaperSize] = useState('');
    const [barcodeSettings, setBarcodeSettings] = useState([]);
    const [businessConfig, setBusinessConfig] = useState({
        enableLot: true,
        enableExpiry: true
    });

    // 1. Fetch Paper Sizes / Settings on load
    useEffect(() => {
        // Replace with your actual settings endpoint
        api.get('barcode-settings').then((res) => {
            if (res?.data) setBarcodeSettings(res.data);
        });
    }, []);

    // 2. Search Products (Replacing jQuery Autocomplete)
    const loadProductOptions = async (inputValue) => {
        if (inputValue.length < 2) return [];
        const response = await api.getapi(`purchases/get_products?check_enable_stock=false&term=${inputValue}`);
        const rows = response?.data || [];
        return rows.map(item => ({
            value: item.product_id,
            label: item.text,
            variation_id: item.variation_id
        }));
    };

    const handleSelectProduct = (option) => {
        if (!option) return;

        // Check if product already added
        const exists = selectedProducts.find(p => p.variation_id === option.variation_id);
        if (exists) return;

        // Add new row to table
        const newProduct = {
            product_id: option.value,
            variation_id: option.variation_id,
            name: option.label,
            label_count: 1,
            lot_number: '',
            exp_date: null,
            packing_date: new Date(),
            price_group: ''
        };
        setSelectedProducts([...selectedProducts, newProduct]);
    };

    // 3. Update Row Data
    const updateProductRow = (index, field, value) => {
        const updated = [...selectedProducts];
        updated[index][field] = value;
        setSelectedProducts(updated);
    };

    // 4. Submit for Preview
    const handlePreview = () => {
        if (selectedProducts.length === 0) {
            alert("Please select at least one product.");
            return;
        }

        // Construct the query parameters
        const params = new URLSearchParams({
            barcode_setting: paperSize,
            products: JSON.stringify(selectedProducts)
        });

        const url = `/labels/preview?${params.toString()}`;
        window.open(url, '_blank');
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-800">Print Barcode</h4>
                </div>

                <div className="p-6 space-y-6">
                    {/* Search Section */}
                    <div className="w-full md:w-2/3 mx-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter product name to print labels
                        </label>
                        <AsyncSelect
                            cacheOptions
                            loadOptions={loadProductOptions}
                            onChange={handleSelectProduct}
                            placeholder="Search products..."
                            className="react-select-container"
                        />
                    </div>

                    {/* Product Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. of Labels</th>
                                    {businessConfig.enableLot && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot Number</th>}
                                    {businessConfig.enableExpiry && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exp Date</th>}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Packing Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {selectedProducts.map((product, idx) => (
                                    <tr key={`${product.variation_id}-${idx}`}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                className="w-20 border border-gray-300 rounded px-2 py-1"
                                                value={product.label_count}
                                                onChange={(e) => updateProductRow(idx, 'label_count', e.target.value)}
                                            />
                                        </td>
                                        {businessConfig.enableLot && (
                                            <td className="px-4 py-2">
                                                <input
                                                    className="border border-gray-300 rounded px-2 py-1 w-full"
                                                    onChange={(e) => updateProductRow(idx, 'lot_number', e.target.value)}
                                                />
                                            </td>
                                        )}
                                        {businessConfig.enableExpiry && (
                                            <td className="px-4 py-2">
                                                <DatePicker
                                                    selected={product.exp_date}
                                                    onChange={(date) => updateProductRow(idx, 'exp_date', date)}
                                                    className="border border-gray-300 rounded px-2 py-1 w-full"
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-2">
                                            <DatePicker
                                                selected={product.packing_date}
                                                onChange={(date) => updateProductRow(idx, 'packing_date', date)}
                                                className="border border-gray-300 rounded px-2 py-1 w-full"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => setSelectedProducts(selectedProducts.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paper Size Setting */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size *</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={paperSize}
                                onChange={(e) => setPaperSize(e.target.value)}
                            >
                                <option value="">Select Paper Size</option>
                                {barcodeSettings.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="text-center pt-4">
                        <button
                            onClick={handlePreview}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                            Submit / Preview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintBarcodePage;