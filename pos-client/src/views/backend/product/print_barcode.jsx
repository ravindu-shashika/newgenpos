import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    PageLayout,
    FormField,
    FormRow,
    FormSection,
    TextInput,
    NumberInput,
    SelectInput,
    CheckboxInput,
    useToast
} from '../../../components/ui';
import { api } from '../../../services';
import { getToken } from '../../../services/tokenStorage';
import SafeFontAwesomeIcon from '../../../components/SafeFontAwesomeIcon';
import { faBarcode, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

function mapApiRowToProduct(row) {
    return {
        id: row[8],
        name: row[0],
        code: row[1],
        price: row[2],
        default_price: row[2],
        promo_price: row[4],
        currency: row[5],
        currency_position: row[6],
        brand: row[11],
        quantity: 1,
        variant_id: row[9],
        diff_price: row[14] === true,
        warehouse_prices: Array.isArray(row[15])
            ? row[15].map((wp) => ({
                warehouse_name: wp.warehouse_name,
                price: wp.price,
            }))
            : [],
        selected_price: row[14] === true ? '' : row[2],
    };
}

function formatSettingLabel(setting) {
    const base = setting.description ? `${setting.name}, ${setting.description}` : setting.name;
    return setting.is_continuous ? `${base} (Continuous roll)` : base;
}

function appendPrintParams(params, printOptions) {
    const toggles = [
        ['name', 'name_size'],
        ['price', 'price_size'],
        ['promo_price', 'promo_price_size'],
        ['business_name', 'business_name_size'],
        ['brand_name', 'brand_name_size'],
    ];

    toggles.forEach(([key, sizeKey]) => {
        if (printOptions[key]) {
            params.append(`print[${key}]`, '1');
            params.append(`print[${sizeKey}]`, String(printOptions[sizeKey]));
        }
    });

    params.append('print[variations]', '1');
    params.append('print[variations_size]', '17');
    params.append('print[packing_date]', '1');
    params.append('print[packing_date_size]', '12');
}

function buildPrintQuery(products, printOptions, barcodeSettingId) {
    const params = new URLSearchParams();
    params.append('barcode_setting', barcodeSettingId);
    appendPrintParams(params, printOptions);

    products.forEach((product, index) => {
        const price = product.diff_price ? product.selected_price : product.price;
        params.append(`products[${index}][quantity]`, String(product.quantity || 1));
        params.append(`products[${index}][product_id]`, String(product.id));
        params.append(`products[${index}][product_name]`, product.name);
        params.append(`products[${index}][sub_sku]`, product.code);
        params.append(`products[${index}][product_price]`, String(price));
        params.append(`products[${index}][default_price]`, String(product.default_price ?? product.price));
        params.append(`products[${index}][product_promo_price]`, product.promo_price ?? '');
        params.append(`products[${index}][currency]`, product.currency ?? '');
        params.append(`products[${index}][currency_position]`, product.currency_position ?? '');
        params.append(`products[${index}][brand_name]`, product.brand ?? 'N/A');
    });

    return params.toString();
}

export default function BackendProductPrintBarcode() {
    const { showToast } = useToast();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searching, setSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [barcodeSettings, setBarcodeSettings] = useState([]);
    const [selectedSettingId, setSelectedSettingId] = useState('');
    const [productCatalog, setProductCatalog] = useState([]);

    const [printOptions, setPrintOptions] = useState({
        name: true,
        name_size: 13,
        price: true,
        price_size: 13,
        promo_price: false,
        promo_price_size: 15,
        business_name: true,
        business_name_size: 14,
        brand_name: false,
        brand_name_size: 15,
    });

    useEffect(() => {
        fetchInitialData();
    }, [location.search]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(location.search);
            const preloadData = params.get('data');
            const url = preloadData
                ? `products/print_barcode?data=${encodeURIComponent(preloadData)}`
                : 'products/print_barcode';
            const res = await api.get(url);
            const data = res.data;

            const bSettings = data.barcode_settings || [];
            setBarcodeSettings(bSettings);

            if (data.default_barcode_setting_id) {
                setSelectedSettingId(String(data.default_barcode_setting_id));
            } else if (bSettings.length > 0) {
                const defaultSetting = bSettings.find((s) => s.is_default) || bSettings[0];
                setSelectedSettingId(String(defaultSetting.id));
            }

            setProductCatalog(Array.isArray(data.product_catalog) ? data.product_catalog : []);

            const preloaded = Array.isArray(data.pre_loaded_products) ? data.pre_loaded_products : [];
            setSelectedProducts(
                preloaded.length > 0 ? preloaded.map(mapApiRowToProduct) : []
            );
            if (preloadData && preloaded.length === 0) {
                showToast('Could not load product for barcode print', 'warning');
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
            showToast('Failed to load initial data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filterCatalog = (term) => {
        if (!term || term.length < 1) return [];
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matcher = new RegExp('.?' + escaped, 'i');
        return productCatalog.filter((item) => matcher.test(item)).slice(0, 25);
    };

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        setSearchResults(filterCatalog(val));
    };

    const addProduct = (row) => {
        const product = mapApiRowToProduct(row);

        if (selectedProducts.find((item) => item.code === product.code)) {
            showToast('Duplicate input is not allowed!', 'warning');
            return;
        }

        setSelectedProducts((prev) => [...prev, product]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const selectSearchResult = async (label) => {
        setSearchTerm('');
        setSearchResults([]);
        setSearching(true);
        try {
            const res = await api.get(
                `products/lims_product_search?data=${encodeURIComponent(label)}&barcode=1`
            );
            const rows = Array.isArray(res.data) ? res.data : [];
            if (rows[0]) {
                addProduct(rows[0]);
            } else {
                showToast('Product not found', 'error');
            }
        } catch (error) {
            console.error('Search failed:', error);
            showToast('Failed to load product', 'error');
        } finally {
            setSearching(false);
        }
    };

    const removeProduct = (index) => {
        setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
    };

    const updateProduct = (index, field, value) => {
        setSelectedProducts((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleSubmit = async () => {
        if (selectedProducts.length === 0) {
            showToast('Please add products first', 'warning');
            return;
        }

        if (!selectedSettingId) {
            showToast('Please select a paper size', 'warning');
            return;
        }

        const missingPrice = selectedProducts.find(
            (product) => product.diff_price && !product.selected_price
        );
        if (missingPrice) {
            showToast('Please choose warehouse / price for all products', 'warning');
            return;
        }

        const query = buildPrintQuery(selectedProducts, printOptions, selectedSettingId);
        const token = getToken();
        const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
        const printUrl = `${api.defaultPath}/labels/print?${query}${tokenParam}`;

        setSubmitting(true);
        try {
            const printWindow = window.open(printUrl, 'printBarcode');
            if (!printWindow) {
                showToast('Please allow pop-ups to open the print preview', 'warning');
            }
        } catch (error) {
            console.error('Label preview failed:', error);
            showToast(error?.message || 'Failed to generate labels', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageLayout eyebrow="Products" title="Print Barcode">
                <div className="p-5 text-center">Loading settings...</div>
            </PageLayout>
        );
    }

    const selectedSetting = barcodeSettings.find((s) => String(s.id) === String(selectedSettingId));

    return (
        <PageLayout eyebrow="Products" title="Print Barcode">
            <style>{`
                .search-container { position: relative; width: 100%; }
                .search-results { position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: #fff; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .search-item { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
                .search-item:hover { background: #f8f9fa; }
                .print-barcode-search { display: flex; gap: 0; width: 100%; }
                .print-barcode-search-icon { display: inline-flex; align-items: center; justify-content: center; padding: 0 14px; background: var(--ui-surface2); border: 1px solid var(--ui-border); border-right: none; border-radius: var(--ui-radius) 0 0 var(--ui-radius); }
                .print-barcode-search .ui-input-wrap { flex: 1; }
                .print-barcode-search .ui-input { border-radius: 0 var(--ui-radius) var(--ui-radius) 0; }
            `}</style>

            <FormSection>
                <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                    The field labels marked with * are required input fields.
                </p>

                <div className="mb-4">
                    <label className="ui-label">Add Product *</label>
                    <div className="search-container">
                        <div className="print-barcode-search">
                            <span className="print-barcode-search-icon">
                                <SafeFontAwesomeIcon icon={faBarcode} />
                            </span>
                            <TextInput
                                placeholder="Please type product code and select..."
                                value={searchTerm}
                                onChange={handleSearch}
                                autoComplete="off"
                            />
                        </div>
                        {searching && <div className="p-2 text-center text-muted"><small>Loading product...</small></div>}
                        {searchResults.length > 0 && (
                            <div className="search-results">
                                {searchResults.map((label, i) => (
                                    <div key={i} className="search-item" onClick={() => selectSearchResult(label)}>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="ui-table-wrap mb-5">
                    <table className="ui-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Quantity</th>
                                <th>Warehouse / Price</th>
                                <th style={{ width: '50px' }} aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {selectedProducts.map((p, i) => (
                                <tr key={`${p.code}-${i}`}>
                                    <td>{p.name}</td>
                                    <td>{p.code}</td>
                                    <td style={{ width: '120px' }}>
                                        <NumberInput
                                            value={p.quantity}
                                            onChange={(e) => updateProduct(i, 'quantity', parseInt(e.target.value, 10) || 1)}
                                            min="1"
                                        />
                                    </td>
                                    <td>
                                        {p.diff_price ? (
                                            <SelectInput
                                                value={p.selected_price}
                                                onChange={(e) => updateProduct(i, 'selected_price', e.target.value)}
                                                required
                                            >
                                                <option value="">Choose Warehouse</option>
                                                {p.warehouse_prices.map((wp, j) => (
                                                    <option key={j} value={wp.price}>
                                                        {wp.warehouse_name} | Price: {wp.price}
                                                    </option>
                                                ))}
                                            </SelectInput>
                                        ) : (
                                            <TextInput value={p.price} readOnly disabled />
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <button
                                            type="button"
                                            className="ui-btn danger sm"
                                            onClick={() => removeProduct(i)}
                                            aria-label="Remove product"
                                        >
                                            <SafeFontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {selectedProducts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center p-4 text-muted">
                                        No products selected. Use the search bar above to add products.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <hr className="my-4" />

                <h6 className="ui-section-divider mb-4">Information on Label *</h6>
                <FormRow cols={3}>
                    <FormField label="Product Name">
                        <div className="d-flex align-items-center gap-2">
                            <CheckboxInput
                                checked={printOptions.name}
                                onChange={(e) => setPrintOptions({ ...printOptions, name: e.target.checked })}
                            />
                            <TextInput
                                type="number"
                                value={printOptions.name_size}
                                onChange={(e) => setPrintOptions({ ...printOptions, name_size: parseInt(e.target.value, 10) || 15 })}
                                placeholder="Size"
                                style={{ width: '80px' }}
                                disabled={!printOptions.name}
                            />
                        </div>
                    </FormField>
                    <FormField label="Price">
                        <div className="d-flex align-items-center gap-2">
                            <CheckboxInput
                                checked={printOptions.price}
                                onChange={(e) => setPrintOptions({ ...printOptions, price: e.target.checked })}
                            />
                            <TextInput
                                type="number"
                                value={printOptions.price_size}
                                onChange={(e) => setPrintOptions({ ...printOptions, price_size: parseInt(e.target.value, 10) || 15 })}
                                placeholder="Size"
                                style={{ width: '80px' }}
                                disabled={!printOptions.price}
                            />
                        </div>
                    </FormField>
                    <FormField label="Promotional Price">
                        <div className="d-flex align-items-center gap-2">
                            <CheckboxInput
                                checked={printOptions.promo_price}
                                onChange={(e) => setPrintOptions({ ...printOptions, promo_price: e.target.checked })}
                            />
                            <TextInput
                                type="number"
                                value={printOptions.promo_price_size}
                                onChange={(e) => setPrintOptions({ ...printOptions, promo_price_size: parseInt(e.target.value, 10) || 15 })}
                                placeholder="Size"
                                style={{ width: '80px' }}
                                disabled={!printOptions.promo_price}
                            />
                        </div>
                    </FormField>
                </FormRow>

                <FormRow cols={3} className="mt-3">
                    <FormField label="Business Name">
                        <div className="d-flex align-items-center gap-2">
                            <CheckboxInput
                                checked={printOptions.business_name}
                                onChange={(e) => setPrintOptions({ ...printOptions, business_name: e.target.checked })}
                            />
                            <TextInput
                                type="number"
                                value={printOptions.business_name_size}
                                onChange={(e) => setPrintOptions({ ...printOptions, business_name_size: parseInt(e.target.value, 10) || 15 })}
                                placeholder="Size"
                                style={{ width: '80px' }}
                                disabled={!printOptions.business_name}
                            />
                        </div>
                    </FormField>
                    <FormField label="Brand">
                        <div className="d-flex align-items-center gap-2">
                            <CheckboxInput
                                checked={printOptions.brand_name}
                                onChange={(e) => setPrintOptions({ ...printOptions, brand_name: e.target.checked })}
                            />
                            <TextInput
                                type="number"
                                value={printOptions.brand_name_size}
                                onChange={(e) => setPrintOptions({ ...printOptions, brand_name_size: parseInt(e.target.value, 10) || 15 })}
                                placeholder="Size"
                                style={{ width: '80px' }}
                                disabled={!printOptions.brand_name}
                            />
                        </div>
                    </FormField>
                </FormRow>

                <hr className="my-4" />

                <FormRow cols={2}>
                    <FormField label="Paper Size *">
                        <SelectInput
                            value={selectedSettingId}
                            onChange={(e) => setSelectedSettingId(e.target.value)}
                        >
                            <option value="">Select Paper Size</option>
                            {barcodeSettings.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {formatSettingLabel(s)}
                                </option>
                            ))}
                        </SelectInput>
                        {selectedSetting && (
                            <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.85rem' }}>
                                {selectedSetting.is_continuous ? (
                                    <>
                                        Continuous roll {selectedSetting.paper_width}&quot; wide — {selectedSetting.stickers_in_one_row} label(s) per row, each{' '}
                                        {selectedSetting.width}&quot; × {selectedSetting.height}&quot;
                                        {(selectedSetting.top_margin > 0 || selectedSetting.left_margin > 0) && (
                                            <>, margins top {selectedSetting.top_margin}&quot; / left {selectedSetting.left_margin}&quot;</>
                                        )}
                                        {(selectedSetting.top_margin > 0.2 || selectedSetting.left_margin > 0.2) && (
                                            <span style={{ color: '#b45309' }}> — large margins may clip content on small labels</span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        Sheet layout — {selectedSetting.stickers_in_one_row} per row,{' '}
                                        {selectedSetting.stickers_in_one_sheet} per sheet, paper{' '}
                                        {selectedSetting.paper_width}&quot; × {selectedSetting.paper_height}&quot;
                                    </>
                                )}
                            </p>
                        )}
                    </FormField>
                </FormRow>

                <div className="d-flex flex-wrap gap-3 mt-5">
                    <button
                        type="button"
                        className="ui-btn primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ minWidth: '160px' }}
                    >
                        {submitting ? 'Generating...' : 'Submit'}
                    </button>
                    <Link to="/barcodes" className="ui-btn info">
                        <SafeFontAwesomeIcon icon={faPlus} className="me-2" />
                        Add New Setting
                    </Link>
                </div>
            </FormSection>
        </PageLayout>
    );
}
