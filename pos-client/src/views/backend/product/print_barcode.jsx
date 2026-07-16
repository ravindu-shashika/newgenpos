import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    PageLayout,
    FormSection,
    TextInput,
    NumberInput,
    SelectInput,
    useToast
} from '../../../components/ui';
import { api } from '../../../services';
import generalSettingStore from '../../../stores/generalSettingStore';
import { expandProductsToLabels, createLabelPrintWindow } from '../../../utils/barcodeLabelPrinter';
import {
    render32InchLabelPrintWindow,
    INCH_32_DEFAULT_PRINT_OPTIONS,
    INCH_32_BARCODE_SPEC,
} from '../../../utils/3.2inch_barcode';
import { BARCODE_PRICE_DISPLAY } from '../../../utils/barcodeTemplateDefaults';
import SafeFontAwesomeIcon from '../../../components/SafeFontAwesomeIcon';
import { faBarcode, faTrash } from '@fortawesome/free-solid-svg-icons';

function hasValidMaxPrice(product) {
    const n = Number(product.max_price);
    return product.max_price !== '' && product.max_price != null && Number.isFinite(n) && n > 0;
}

/** Map lims_product_search row (barcode=1) to print form state. */
function mapApiRowToProduct(row) {
    // [16]=barcode_symbology [17]=alt_code [18]=max_price
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
                max_price: wp.max_price,
            }))
            : [],
        selected_price: row[14] === true ? '' : row[2],
        barcode_symbology: row[16] || 'C128',
        alt_code: row[17] ?? '',
        max_price: row[18] ?? '',
    };
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
    const [productCatalog, setProductCatalog] = useState([]);

    useEffect(() => {
        fetchInitialData();
        if (!generalSettingStore.getSetting()) {
            generalSettingStore.fetchSetting().catch(() => {});
        }
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
            const rows = Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data)
                    ? res.data
                    : [];
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

        const missingMaxPrice = selectedProducts.filter((p) => !hasValidMaxPrice(p));
        if (missingMaxPrice.length > 0) {
            const names = missingMaxPrice.map((p) => p.code || p.name).join(', ');
            showToast(`Cannot print — max price is not set for: ${names}`, 'error');
            return;
        }

        const missingPrice = selectedProducts.find(
            (product) => product.diff_price && !product.selected_price
        );
        if (missingPrice) {
            showToast('Please choose warehouse / price for all products', 'warning');
            return;
        }

        setSubmitting(true);

        const printWindow = createLabelPrintWindow();
        if (!printWindow) {
            showToast('Please allow pop-ups to open the print preview', 'warning');
            setSubmitting(false);
            return;
        }

        try {
            let businessName = generalSettingStore.getSetting()?.company_name;
            if (!businessName) {
                await generalSettingStore.fetchSetting();
                businessName = generalSettingStore.getSetting()?.company_name || '';
            }

            const printOptions = {
                ...INCH_32_DEFAULT_PRINT_OPTIONS,
                price_display: BARCODE_PRICE_DISPLAY.maxPrice,
            };
            const labels = expandProductsToLabels(selectedProducts, printOptions);

            render32InchLabelPrintWindow(printWindow, {
                labels,
                printOptions,
                businessName,
            });
        } catch (error) {
            if (printWindow && !printWindow.closed) {
                printWindow.close();
            }
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

    const spec = INCH_32_BARCODE_SPEC;

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
                    Labels use the fixed 3.2&quot; roll layout — 2 stickers per row. Each label prints the <strong>max price</strong> (required).
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
                                <th>Alt code</th>
                                <th>Quantity</th>
                                <th>Max price</th>
                                <th>Warehouse / Price</th>
                                <th style={{ width: '50px' }} aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {selectedProducts.map((p, i) => (
                                <tr key={`${p.code}-${i}`}>
                                    <td>{p.name}</td>
                                    <td>{p.code}</td>
                                    <td>{p.alt_code || '—'}</td>
                                    <td style={{ width: '120px' }}>
                                        <NumberInput
                                            value={p.quantity}
                                            onChange={(e) => updateProduct(i, 'quantity', parseInt(e.target.value, 10) || 1)}
                                            min="1"
                                        />
                                    </td>
                                    <td style={{ width: '140px' }}>
                                        <NumberInput
                                            value={p.max_price ?? ''}
                                            onChange={(e) => updateProduct(i, 'max_price', e.target.value)}
                                            min="0"
                                            step="any"
                                            placeholder="Required"
                                            className={!hasValidMaxPrice(p) ? 'is-invalid' : ''}
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
                                                        {wp.max_price ? ` | Max: ${wp.max_price}` : ''}
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
                                    <td colSpan="7" className="text-center p-4 text-muted">
                                        No products selected. Use the search bar above to add products.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <hr className="my-4" />

                <h6 className="ui-section-divider mb-4">Print layout</h6>
                <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                    3.2&quot; roll — 2 labels per row (1.5&quot; × 1&quot; each, 0.1&quot; gap between).
                    <br />
                    Business name, product name, barcode, code, and max price (centered).
                    <br />
                    On Zebra ZD230: set paper to <strong>80 mm × 24 mm</strong>, rotation <strong>0° Portrait</strong>, margins <strong>None</strong>.
                </p>

                <div className="d-flex flex-wrap gap-3 mt-2">
                    <button
                        type="button"
                        className="ui-btn primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ minWidth: '160px' }}
                    >
                        {submitting ? 'Generating...' : 'Print labels'}
                    </button>
                </div>
            </FormSection>
        </PageLayout>
    );
}
