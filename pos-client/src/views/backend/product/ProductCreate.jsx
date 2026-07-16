import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    PageLayout,
    FormPanel,
    FormField,
    FormRow,
    FormShell,
    FormActions,
    FormHint,
    FormSubheading,
    InlineField,
    Button,
    TextInput,
    NumberInput,
    SelectInput,
    TextareaInput,
    FileInput,
    CheckboxInput,
    Toast,
    useToast,
    Modal,
} from '../../../components/ui';
import { api, generateUniqueCode, assertCodeAvailable, productImageUrl } from '../../../services';
import { masterValueList, mergeVariantSelectionsFromCombinations, normalizeProductVariantRow, normalizeProductVariantRows } from '../../../utils/productVariantHelpers';

function parseOptionalPrice(value) {
    if (value === '' || value == null) return null;
    const n = parseFloat(value);
    return Number.isNaN(n) ? null : n;
}

function priceExceedsMax(price, maxPrice) {
    const parsedPrice = parseOptionalPrice(price);
    const parsedMax = parseOptionalPrice(maxPrice);
    if (parsedPrice == null || parsedMax == null) return false;
    return parsedPrice > parsedMax;
}

/** Normalize checkbox values to 0 | 1 for consistent UI + submit. */
function normalizeCheckbox(value) {
    return value === true || value === 1 || value === '1' ? 1 : 0;
}

function isChecked(value) {
    return normalizeCheckbox(value) === 1;
}

// --- Sub-components (Modals) ---
const BrandModal = ({ isOpen, onClose, onRefresh, modules }) => {
    const [form, setForm] = useState({ title: '', image: null, page_title: '', short_description: '' });
    const { toast, showApiSuccess, showApiError } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('title', form.title);
        if (form.image) data.append('image', form.image);
        data.append('page_title', form.page_title);
        data.append('short_description', form.short_description);
        data.append('is_active', 1);
        data.append('ajax', 1);

        try {
            const res = await api.post('brand', data);
            showApiSuccess(res, 'Brand added successfully');
            onRefresh();
            onClose();
            setForm({ title: '', image: null, page_title: '', short_description: '' });
        } catch (error) { showApiError(error, 'Failed to add brand'); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Brand">
            <Toast toast={toast} />
            <form onSubmit={handleSubmit}>
                <FormField label="Brand Title *">
                    <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </FormField>
                <FormField label="Brand Image">
                    <FileInput onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
                </FormField>
                
                    {(modules.includes('ecommerce') || modules.includes('restaurant')) && (
                    <div style={{ marginTop: 12 }}>
                        <FormSubheading>SEO details</FormSubheading>
                        <FormField label="Meta Title">
                            <TextInput value={form.page_title} onChange={(e) => setForm({ ...form, page_title: e.target.value })} />
                        </FormField>
                        <FormField label="Meta Description">
                            <TextInput value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
                        </FormField>
                    </div>
                )}

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="ui-btn ghost" onClick={onClose}>Close</button>
                    <button type="submit" className="ui-btn primary">Submit</button>
                </div>
            </form>
        </Modal>
    );
};

const CategoryModal = ({ isOpen, onClose, onRefresh, categories }) => {
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');
    const { toast, showApiSuccess, showApiError } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', name);
        if (parentId) data.append('parent_id', parentId);
        data.append('is_active', true);
        try {
            const res = await api.post('category', data);
            showApiSuccess(res, 'Category added successfully');
            onRefresh();
            onClose();
            setName(''); setParentId('');
        } catch (error) { showApiError(error, 'Failed to add category'); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Category">
            <Toast toast={toast} />
            <form onSubmit={handleSubmit}>
                <FormField label="Category Name *">
                    <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
                </FormField>
                <FormField label="Parent Category">
                    <SelectInput value={parentId} onChange={(e) => setParentId(e.target.value)}>
                        <option value="">No Parent</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </SelectInput>
                </FormField>
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="ui-btn ghost" onClick={onClose}>Close</button>
                    <button type="submit" className="ui-btn primary">Submit</button>
                </div>
            </form>
        </Modal>
    );
};

const UnitModal = ({ isOpen, onClose, onRefresh, baseUnits = [] }) => {
    const [form, setForm] = useState({ unit_code: '', unit_name: '', base_unit: '', operator: '*', operation_value: 1 });
    const { toast, showApiSuccess, showApiError } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('unit', form);
            showApiSuccess(res, 'Unit added successfully');
            onRefresh();
            onClose();
            setForm({ unit_code: '', unit_name: '', base_unit: '', operator: '*', operation_value: 1 });
        } catch (error) { showApiError(error, 'Failed to add unit'); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Unit">
            <Toast toast={toast} />
            <form onSubmit={handleSubmit}>
                <FormField label="Unit Code *">
                    <TextInput value={form.unit_code} onChange={(e) => setForm({ ...form, unit_code: e.target.value })} required />
                </FormField>
                <FormField label="Unit Name *">
                    <TextInput value={form.unit_name} onChange={(e) => setForm({ ...form, unit_name: e.target.value })} required />
                </FormField>
                <FormField label="Base Unit">
                    <SelectInput value={form.base_unit} onChange={(e) => setForm({ ...form, base_unit: e.target.value })}>
                        <option value="">No Base Unit</option>
                        {baseUnits.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                    </SelectInput>
                </FormField>
                <FormField label="Operator">
                    <SelectInput value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })}>
                        <option value="">Select operator</option>
                        <option value="*">*</option>
                        <option value="/">/</option>
                    </SelectInput>
                </FormField>
                <FormField label="Operation Value">
                    <NumberInput value={form.operation_value} onChange={(e) => setForm({ ...form, operation_value: e.target.value })} step="any" />
                </FormField>
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="ui-btn ghost" onClick={onClose}>Close</button>
                    <button type="submit" className="ui-btn primary">Submit</button>
                </div>
            </form>
        </Modal>
    );
};

const TaxModal = ({ isOpen, onClose, onRefresh }) => {
    const [name, setName] = useState('');
    const [rate, setRate] = useState('');
    const { toast, showApiSuccess, showApiError } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('tax', { name, rate, is_active: true, ajax: 1 });
            showApiSuccess(res, 'Tax added successfully');
            onRefresh();
            onClose();
            setName(''); setRate('');
        } catch (error) { showApiError(error, 'Failed to add tax'); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Tax">
            <Toast toast={toast} />
            <form onSubmit={handleSubmit}>
                <FormField label="Tax Name *">
                    <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
                </FormField>
                <FormField label="Tax Rate (%) *">
                    <NumberInput value={rate} onChange={(e) => setRate(e.target.value)} required />
                </FormField>
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="ui-btn ghost" onClick={onClose}>Close</button>
                    <button type="submit" className="ui-btn primary">Submit</button>
                </div>
            </form>
        </Modal>
    );
};

function SearchDropdown({ items, onSelect, renderItem }) {
    if (!items?.length) return null;
    return (
        <div className="ui-search-dropdown">
            {items.map((item, i) => (
                <div
                    key={item.id ?? i}
                    className="ui-search-dropdown-item"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(item);
                    }}
                    {...(renderItem ? {} : {})}
                >
                    {renderItem ? renderItem(item) : item.name ?? item}
                </div>
            ))}
        </div>
    );
}

function TagChip({ label, onRemove, tone = 'default' }) {
    return (
        <span className="ui-tag-chip" style={tone === 'success' ? { borderColor: 'var(--ui-credit)', background: '#eef8f2' } : undefined}>
            {label}
            <button type="button" className="ui-tag-chip-remove" onClick={onRemove} aria-label="Remove">
                ×
            </button>
        </span>
    );
}

function formatDecimal(value, decimals = 2) {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toFixed(decimals);
}

export default function ProductCreate() {
    const navigate = useNavigate();
    const { id: productId } = useParams();
    const isEditMode = Boolean(productId);
    const { toast, showToast, showApiSuccess, showApiError } = useToast();

    // --- State ---
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState({
        brands: [],
        categories: [],
        units: [],
        all_units: [],
        taxes: [],
        warehouses: [],
        kitchens: [],
        menu_type_list: [],
        modules: [],
        custom_fields: [],
        combo_product_codes: [],
        has_woocommerce: false,
        variant_masters: [],
        decimal: 2,
        margin_type: 2,
    });
    const [roleId, setRoleId] = useState(null);
    const submitModeRef = useRef('add');
    const [recalcPriceFromMargin, setRecalcPriceFromMargin] = useState(false);

    const initialFormData = {
        type: 'standard',
        name: '',
        code: '',
        alt_code: '',
        barcode_symbology: 'C128',
        brand_id: '',
        category_id: '',
        unit_id: '',
        sale_unit_id: '',
        purchase_unit_id: '',
        cost: '',
        profit_margin_type: 'percentage',
        profit_margin: '0',
        price: '',
        max_price: '',
        wholesale_price: '',
        daily_sale_objective: '',
        alert_quantity: '',
        tax_id: '',
        tax_method: '1',
        warranty: '',
        warranty_type: 'months',
        guarantee: '',
        guarantee_type: 'months',
        featured: 0,
        is_embeded: 0,
        is_initial_stock: 0,
        is_variant: 0,
        is_diffPrice: 0,
        is_batch: 0,
        batch_number_mode: '',
        is_imei: 0,
        is_sync_disable: 0,
        promotion: 0,
        promotion_price: '',
        starting_date: '',
        last_date: '',
        product_details: '',
        // SEO/Ecommerce/Restaurant (if enabled)
        meta_title: '',
        meta_description: '',
        tags: '',
        is_online: 1,
        in_stock: 1,
        is_addon: 0,
        menu_type: [],
        is_recipe: 0,
        kitchen_id: '',
        qty: 0,
    };
    const [formData, setFormData] = useState(initialFormData);

    // Dynamic state for tables/lists
    const [comboProducts, setComboProducts] = useState([]);
    const [initialStock, setInitialStock] = useState({}); // {warehouse_id: qty}
    const [warehouseStock, setWarehouseStock] = useState({}); // current product_warehouse qty
    const [variantWarehouseStock, setVariantWarehouseStock] = useState([]);
    const [diffPrices, setDiffPrices] = useState({}); // {warehouse_id: price}
    const [diffMaxPrices, setDiffMaxPrices] = useState({}); // {warehouse_id: max_price}
    const [variants, setVariants] = useState([]);
    const [variantCombinations, setVariantCombinations] = useState([]);
    const [addVariantMasterId, setAddVariantMasterId] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [previousImages, setPreviousImages] = useState([]);
    const [digitalFile, setDigitalFile] = useState(null);
    const [existingDigitalFile, setExistingDigitalFile] = useState('');

    // Related products / Extras state
    const [relatedResults, setRelatedResults] = useState([]);
    const [selectedRelated, setSelectedRelated] = useState([]);
    const [extraResults, setExtraResults] = useState([]);
    const [selectedExtras, setSelectedExtras] = useState([]);
    const [batchNumberModeLocked, setBatchNumberModeLocked] = useState(false);
    const [comboSearch, setComboSearch] = useState('');
    const [comboSuggestions, setComboSuggestions] = useState([]);

    // Unit options (filtered)
    const [saleUnits, setSaleUnits] = useState([]);

    // Modals visibility
    const [brandModalOpen, setBrandModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [taxModalOpen, setTaxModalOpen] = useState(false);

    // --- Data Fetching ---
    const resetDynamicState = () => {
        setComboProducts([]);
        setInitialStock({});
        setWarehouseStock({});
        setVariantWarehouseStock([]);
        setDiffPrices({});
        setDiffMaxPrices({});
        setVariants([]);
        setVariantCombinations([]);
        setAddVariantMasterId('');
        setSelectedImages([]);
        setPreviousImages([]);
        setDigitalFile(null);
        setExistingDigitalFile('');
        setSelectedRelated([]);
        setSelectedExtras([]);
        setRelatedResults([]);
        setExtraResults([]);
        setComboSearch('');
        setComboSuggestions([]);
        setBatchNumberModeLocked(false);
    };

    const applyEditPayload = (data) => {
        const p = data.product || {};

        resetDynamicState();
        setBatchNumberModeLocked(Boolean(data.batch_number_mode_locked));

        setOptions({
            brands: data.brands || [],
            categories: data.categories || [],
            units: data.units || [],
            all_units: data.all_units || data.units || [],
            taxes: data.taxes || [],
            warehouses: data.warehouses || [],
            kitchens: data.kitchens || [],
            menu_type_list: data.menu_type_list || [],
            modules: data.modules || [],
            custom_fields: data.custom_fields || [],
            combo_product_codes: data.combo_product_codes || [],
            has_woocommerce: !!data.has_woocommerce,
            variant_masters: data.variant_masters || [],
            decimal: data.decimal ?? 2,
            margin_type: data.margin_type ?? 2,
        });
        setRoleId(data.role_id ?? null);

        const customValues = data.custom_field_values || {};
        const initialStockMap = data.initial_stock || {};
        const warehouseStockMap = data.warehouse_stock || {};
        const hasInitialStock = !!data.has_initial_stock || Object.values(initialStockMap).some((qty) => Number(qty) > 0);
        const isBatch = isChecked(p.is_batch);
        const isVariant = isChecked(p.is_variant) && !isBatch;
        const isImei = isChecked(p.is_imei);
        const isInitialStock = !isBatch && !isVariant && !isImei && hasInitialStock;

        const decimals = data.decimal ?? 2;

        setFormData({
            ...initialFormData,
            id: p.id,
            type: p.type || 'standard',
            name: p.name || '',
            code: p.code || '',
            alt_code: p.alt_code ?? '',
            barcode_symbology: p.barcode_symbology || 'C128',
            brand_id: p.brand_id ?? '',
            category_id: p.category_id ?? '',
            unit_id: p.unit_id ?? '',
            sale_unit_id: p.sale_unit_id ?? '',
            purchase_unit_id: p.purchase_unit_id ?? '',
            cost: formatDecimal(p.cost, decimals),
            profit_margin_type: p.profit_margin_type || (data.margin_type == 1 ? 'flat' : 'percentage'),
            profit_margin: formatDecimal(p.profit_margin, decimals),
            price: formatDecimal(p.price, decimals),
            max_price: formatDecimal(p.max_price, decimals),
            wholesale_price: formatDecimal(p.wholesale_price, decimals),
            daily_sale_objective: p.daily_sale_objective ?? '',
            alert_quantity: p.alert_quantity ?? '',
            tax_id: p.tax_id ?? '',
            tax_method: p.tax_method ?? '1',
            warranty: p.warranty ?? '',
            warranty_type: p.warranty_type || 'months',
            guarantee: p.guarantee ?? '',
            guarantee_type: p.guarantee_type || 'months',
            featured: normalizeCheckbox(p.featured),
            is_embeded: normalizeCheckbox(p.is_embeded),
            is_initial_stock: isInitialStock ? 1 : 0,
            is_variant: isVariant ? 1 : 0,
            is_diffPrice: normalizeCheckbox(p.is_diffPrice),
            is_batch: isBatch ? 1 : 0,
            batch_number_mode: isBatch
                ? (p.batch_number_mode === 'manual' ? 'manual' : 'auto')
                : '',
            is_imei: isImei ? 1 : 0,
            is_sync_disable: normalizeCheckbox(p.is_sync_disable),
            promotion: normalizeCheckbox(p.promotion),
            promotion_price: formatDecimal(p.promotion_price, decimals),
            starting_date: p.starting_date ? String(p.starting_date).slice(0, 10) : '',
            last_date: p.last_date ? String(p.last_date).slice(0, 10) : '',
            product_details: p.product_details ?? '',
            meta_title: p.meta_title ?? '',
            meta_description: p.meta_description ?? '',
            tags: p.tags ?? '',
            is_online: normalizeCheckbox(p.is_online),
            in_stock: normalizeCheckbox(p.in_stock),
            is_addon: normalizeCheckbox(p.is_addon),
            menu_type: p.menu_type ? String(p.menu_type).split(',').filter(Boolean) : [],
            is_recipe: normalizeCheckbox(p.is_recipe),
            kitchen_id: p.kitchen_id ?? '',
            qty: p.qty ?? 0,
            ...customValues,
        });

        setInitialStock(isInitialStock ? initialStockMap : {});
        setWarehouseStock(warehouseStockMap);
        setVariantWarehouseStock(Array.isArray(data.variant_warehouse_stock) ? data.variant_warehouse_stock : []);

        if (data.variants?.length) {
            const masters = data.variant_masters || [];
            const combos = data.variant_combinations || [];
            const normalized = normalizeProductVariantRows(data.variants, masters);
            const merged = mergeVariantSelectionsFromCombinations(normalized, combos);
            // Hide unused / empty variant types (no selected attributes).
            setVariants(merged.filter((row) =>
                (row.selectedValues || []).length > 0
                && (row.availableValues || []).length > 0
            ));
        }
        if (data.variant_combinations?.length) {
            setVariantCombinations(data.variant_combinations);
        }
        if (data.combo_products?.length) {
            setComboProducts(data.combo_products);
        }
        if (data.diff_prices) {
            const formattedDiffPrices = {};
            Object.entries(data.diff_prices).forEach(([warehouseId, value]) => {
                formattedDiffPrices[warehouseId] = formatDecimal(value, decimals);
            });
            setDiffPrices(formattedDiffPrices);
        }
        if (data.diff_max_prices) {
            const formattedDiffMaxPrices = {};
            Object.entries(data.diff_max_prices).forEach(([warehouseId, value]) => {
                formattedDiffMaxPrices[warehouseId] = formatDecimal(value, decimals);
            });
            setDiffMaxPrices(formattedDiffMaxPrices);
        }
        if (data.related_products_selected?.length) {
            setSelectedRelated(data.related_products_selected);
        }
        if (data.extras_selected?.length) {
            setSelectedExtras(data.extras_selected);
        }
        setPreviousImages(data.previous_images || []);
        setExistingDigitalFile(data.existing_file || '');
        setRecalcPriceFromMargin(false);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            if (isEditMode) {
                const res = await api.get(`products/${productId}/edit`);
                applyEditPayload(res.data || {});
            } else {
                resetDynamicState();
                const res = await api.get('products/initial-data');
                const data = res.data || {};
                setOptions({
                    brands: data.brands || [],
                    categories: data.categories || [],
                    units: data.units || [],
                    all_units: data.all_units || data.units || [],
                    taxes: data.taxes || [],
                    warehouses: data.warehouses || [],
                    kitchens: data.kitchens || [],
                    menu_type_list: data.menu_type_list || [],
                    modules: data.modules || [],
                    custom_fields: data.custom_fields || [],
                    combo_product_codes: data.combo_product_codes || [],
                    has_woocommerce: !!data.has_woocommerce,
                    variant_masters: data.variant_masters || [],
                    decimal: data.decimal ?? 2,
                    margin_type: data.margin_type ?? 2,
                });
                setRoleId(data.role_id ?? null);
                const customDefaults = {};
                (data.custom_fields || []).forEach((field) => {
                    const fieldName = field.name.toLowerCase().replace(/ /g, '_');
                    if (field.type === 'checkbox' || field.type === 'multi_select') {
                        customDefaults[fieldName] = field.default_value ? [field.default_value] : [];
                    } else {
                        customDefaults[fieldName] = field.default_value ?? '';
                    }
                });
                setFormData({
                    ...initialFormData,
                    ...customDefaults,
                    profit_margin_type: data.margin_type == 1 ? 'flat' : 'percentage',
                    qty: Number(0).toFixed(data.decimal ?? 2),
                });
            }
        } catch (err) {
            showToast(isEditMode ? 'Failed to load product.' : 'Failed to load initial data.', 'error');
            if (isEditMode) navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!productId) {
            resetDynamicState();
            setFormData(initialFormData);
        }
        fetchData();
        if (!productId) {
            handleGenerateCode();
        }
    }, [productId]);

    useEffect(() => {
        if (!formData.is_variant) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('variant-masters');
                const data = res.data?.data ?? res.data ?? [];
                if (cancelled || !Array.isArray(data)) return;
                setOptions((prev) => ({ ...prev, variant_masters: data }));
                setVariants((prev) => prev.map((row) => normalizeProductVariantRow(row, data)));
            } catch {
                // Keep initial-data payload if refresh fails.
            }
        })();

        return () => { cancelled = true; };
    }, [formData.is_variant]);

    const modules = options.modules || [];
    const hasEcom = modules.includes('ecommerce') || modules.includes('restaurant');
    const hasRestaurant = modules.includes('restaurant');
    const isStandard = formData.type === 'standard';
    const isCombo = formData.type === 'combo';
    const isDigital = formData.type === 'digital';
    const isService = formData.type === 'service';
    const visibleCustomFields = (options.custom_fields || []).filter(
        (f) => !f.is_admin || roleId === 1
    );

    // --- Handlers ---
    const applyProductOptionSideEffects = (name, checked) => {
        if (checked) {
            if (name === 'is_batch' || name === 'is_imei' || name === 'is_variant') {
                setInitialStock({});
            }
            if (name === 'is_batch') {
                setVariants([]);
                setVariantCombinations([]);
                setAddVariantMasterId('');
            }
            return;
        }
        if (name === 'is_initial_stock') {
            setInitialStock({});
        }
        if (name === 'is_variant') {
            setVariants([]);
            setVariantCombinations([]);
            setAddVariantMasterId('');
        }
    };

    const handleProductOptionChange = (e) => {
        const { name, checked } = e.target;
        const value = normalizeCheckbox(checked);

        setFormData((prev) => {
            const next = { ...prev, [name]: value };
            if (value === 1) {
                if (name === 'is_batch') {
                    next.is_initial_stock = 0;
                    next.is_variant = 0;
                    next.batch_number_mode = next.batch_number_mode === 'manual' ? 'manual' : 'auto';
                } else if (name === 'is_variant') {
                    next.is_initial_stock = 0;
                    next.is_batch = 0;
                    next.batch_number_mode = '';
                } else if (name === 'is_imei') {
                    next.is_initial_stock = 0;
                }
            } else if (name === 'is_batch') {
                next.batch_number_mode = '';
            }
            return next;
        });

        applyProductOptionSideEffects(name, checked);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            if (['is_batch', 'is_imei', 'is_variant', 'is_initial_stock', 'is_diffPrice'].includes(name)) {
                handleProductOptionChange(e);
                return;
            }
            setFormData((prev) => ({
                ...prev,
                [name]: normalizeCheckbox(checked),
            }));
            return;
        }
        if (['cost', 'profit_margin', 'profit_margin_type'].includes(name)) {
            setRecalcPriceFromMargin(true);
        }
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTypeChange = (e) => {
        const type = e.target.value;
        setFormData(prev => {
            const next = { ...prev, type };
            if (type !== 'standard') {
                next.is_variant = 0;
                next.is_diffPrice = 0;
                next.featured = 0;
            }
            if (type === 'combo' || type === 'digital' || type === 'service') {
                next.is_initial_stock = 0;
                next.is_batch = 0;
                next.is_imei = 0;
            }
            return next;
        });
        if (type === 'combo') setComboProducts([]);
    };

    const handleGenerateCode = async () => {
        try {
            const code = await generateUniqueCode('product', {
                exceptId: isEditMode ? productId : null,
            });
            setFormData(prev => ({ ...prev, code: String(code) }));
        } catch (err) {
            showToast(err?.message || 'Failed to generate code.', 'error');
        }
    };

    // Recalculate price only when cost or margin is edited — not on initial edit load.
    useEffect(() => {
        if (isCombo || isDigital || isService) return;
        if (!recalcPriceFromMargin) return;

        const cost = parseFloat(formData.cost) || 0;
        const margin = parseFloat(formData.profit_margin) || 0;
        let price = 0;
        if (formData.profit_margin_type === 'percentage') {
            price = cost + (cost * margin / 100);
        } else {
            price = cost + margin;
        }

        const maxPrice = parseOptionalPrice(formData.max_price);
        if (maxPrice != null && price > maxPrice) {
            showToast('Calculated price cannot be higher than max price.', 'error');
            setRecalcPriceFromMargin(false);
            return;
        }

        setFormData(prev => ({ ...prev, price: price.toFixed(options.decimal ?? 2) }));
        setRecalcPriceFromMargin(false);
    }, [formData.cost, formData.profit_margin, formData.profit_margin_type, formData.max_price, formData.type, recalcPriceFromMargin, isCombo, isDigital, isService, options.decimal, showToast]);

    // Handle price change -> margin (does not recalculate price back)
    const handlePriceChange = (e) => {
        const raw = e.target.value;
        if (raw !== '' && priceExceedsMax(raw, formData.max_price)) {
            showToast('Product price cannot be higher than max price.', 'error');
            return;
        }
        const newPrice = parseFloat(raw) || 0;
        const cost = parseFloat(formData.cost) || 0;
        const decimals = options.decimal ?? 2;
        let margin = 0;
        if (formData.profit_margin_type === 'percentage') {
            margin = cost > 0 ? ((newPrice - cost) / cost * 100) : 0;
        } else {
            margin = newPrice - cost;
        }
        setFormData(prev => ({
            ...prev,
            price: raw === '' ? '' : raw,
            profit_margin: margin.toFixed(decimals),
        }));
    };

    const handleMaxPriceChange = (e) => {
        const raw = e.target.value;
        if (raw !== '' && priceExceedsMax(formData.price, raw)) {
            showToast('Max price cannot be lower than product price.', 'error');
            return;
        }
        setFormData((prev) => ({ ...prev, max_price: raw }));
    };

    const handleDiffPriceChange = (warehouseId, value) => {
        const maxValue = diffMaxPrices[warehouseId] ?? formData.max_price;
        if (value !== '' && priceExceedsMax(value, maxValue)) {
            showToast('Warehouse price cannot be higher than max price.', 'error');
            return;
        }
        setDiffPrices((prev) => ({ ...prev, [warehouseId]: value }));
    };

    const handleDiffMaxPriceChange = (warehouseId, value) => {
        const priceValue = diffPrices[warehouseId] ?? formData.price;
        if (value !== '' && priceExceedsMax(priceValue, value)) {
            showToast('Warehouse max price cannot be lower than warehouse price.', 'error');
            return;
        }
        setDiffMaxPrices((prev) => ({ ...prev, [warehouseId]: value }));
    };

    // Unit change logic
    useEffect(() => {
        if (formData.unit_id) {
            const fetchUnits = async () => {
                const res = await api.get(`products/saleunit/${formData.unit_id}`);
                const raw = res.data?.data ?? res.data;
                const unitMap = typeof raw === 'string' ? JSON.parse(raw) : raw;
                const unitList = Object.entries(unitMap || {}).map(([id, name]) => ({ id, name }));
                setSaleUnits(unitList);
                if (unitList.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        sale_unit_id: prev.unit_id,
                        purchase_unit_id: prev.unit_id
                    }));
                }
            };
            fetchUnits();
        } else {
            setSaleUnits([]);
        }
    }, [formData.unit_id]);

    // --- Combo Search (Blade: local autocomplete then lims_product_search on select) ---
    useEffect(() => {
        if (!isCombo || comboSearch.trim().length < 1) {
            setComboSuggestions([]);
            return;
        }
        const term = comboSearch.toLowerCase();
        const matches = (options.combo_product_codes || [])
            .filter((c) => c.toLowerCase().includes(term))
            .slice(0, 25);
        setComboSuggestions(matches);
    }, [comboSearch, isCombo, options.combo_product_codes]);

    const selectComboSuggestion = async (label) => {
        try {
            const res = await api.get(`products/lims_product_search?data=${encodeURIComponent(label)}`);
            const rows = Array.isArray(res.data) ? res.data : [];
            if (rows[0]) addComboProduct(rows[0]);
        } catch {
            showToast('Could not load combo product.', 'error');
        }
        setComboSearch('');
        setComboSuggestions([]);
    };

    const searchCatalog = async (term, setter) => {
        if (term.length < 3) {
            setter([]);
            return;
        }
        try {
            const res = await api.get(`products/catalog-search/${encodeURIComponent(term)}`);
            setter(Array.isArray(res.data) ? res.data : []);
        } catch {
            setter([]);
        }
    };

    const addComboProduct = (item) => {
        // lims_product_search row: [0]=name, [1]=code, [2]=price, [8]=id, [9]=variant_id, [10]=cost
        const productId = item[8];
        const variantId = item[9] ?? '';
        const key = `${productId}-${variantId}`;
        if (comboProducts.some(p => `${p.id}-${p.variant_id}` === key)) {
            showToast('Duplicate product is not allowed.', 'warning');
            return;
        }
        const price = parseFloat(item[2]) || 0;
        const cost = parseFloat(item[10]) || 0;
        setComboProducts(prev => [...prev, {
            id: productId,
            variant_id: variantId,
            name: item[0],
            code: item[1],
            qty: 1,
            unit_price: price,
            subtotal: price,
            wastage_percent: 0,
            unit_cost: cost,
            combo_unit_id: item[17] || '',
        }]);
        setComboSearch('');
        setComboSuggestions([]);
    };

    const comboRowKey = (p) => `${p.id}-${p.variant_id}`;

    const updateCombo = (rowKey, field, value) => {
        setComboProducts(prev => prev.map(p => {
            if (comboRowKey(p) !== rowKey) return p;
            const newP = { ...p, [field]: value };
            newP.subtotal = (parseFloat(newP.qty) || 0) * (parseFloat(newP.unit_price) || 0);
            return newP;
        }));
    };

    const resetFormAfterSave = async () => {
        resetDynamicState();
        setFormData({
            ...initialFormData,
            profit_margin_type: options.margin_type == 1 ? 'flat' : 'percentage',
            qty: Number(0).toFixed(options.decimal ?? 2),
        });
        await fetchData();
        await handleGenerateCode();
    };

    const validateForm = () => {
        if (!formData.name?.trim()) {
            showToast('Product name is required.', 'error');
            return false;
        }
        if (!formData.code?.trim()) {
            showToast('Product code is required.', 'error');
            return false;
        }
        if (!formData.category_id) {
            showToast('Category is required.', 'error');
            return false;
        }
        if (isStandard && (!formData.unit_id || parseFloat(formData.cost) <= 0)) {
            showToast('Standard products require a unit and cost greater than 0.', 'error');
            return false;
        }
        if (isCombo && comboProducts.length === 0) {
            showToast('Please add at least one product to the combo.', 'error');
            return false;
        }
        if (isDigital && !digitalFile && !existingDigitalFile) {
            showToast('Please attach a file for digital products.', 'error');
            return false;
        }
        if (isChecked(formData.is_variant)) {
            const hasSelected = variants.some((v) => (v.selectedValues || []).length > 0);
            if (!hasSelected) {
                showToast('Select at least one attribute for your variant types.', 'error');
                return false;
            }
            const codes = variantCombinations.map((v) => String(v.item_code || '').trim()).filter(Boolean);
            const dup = codes.find((code, i) => codes.indexOf(code) !== i);
            if (dup) {
                showToast(`Duplicate variant item code "${dup}". Each size/variant needs a unique item code.`, 'error');
                return false;
            }
        }
        const maxPrice = parseFloat(formData.max_price);
        const salePrice = parseFloat(formData.price);
        if (formData.max_price !== '' && !Number.isNaN(maxPrice) && !Number.isNaN(salePrice) && maxPrice < salePrice) {
            showToast('Product price cannot be higher than max price.', 'error');
            return false;
        }
        if (isChecked(formData.is_diffPrice)) {
            for (const warehouse of options.warehouses || []) {
                const warehousePrice = diffPrices[warehouse.id] ?? formData.price;
                const warehouseMax = diffMaxPrices[warehouse.id] ?? formData.max_price;
                if (priceExceedsMax(warehousePrice, warehouseMax)) {
                    showToast(`Warehouse price for ${warehouse.name} cannot be higher than max price.`, 'error');
                    return false;
                }
            }
        }
        if (hasRestaurant && !formData.is_addon && (!formData.menu_type?.length)) {
            showToast('Please select at least one menu type.', 'error');
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (formData.type === 'combo') {
            const totalPrice = comboProducts.reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
            const totalCost = comboProducts.reduce(
                (sum, p) => sum + (parseFloat(p.qty) || 0) * (parseFloat(p.unit_cost) || 0),
                0
            );
            const nextPrice = totalPrice.toFixed(2);
            if (priceExceedsMax(nextPrice, formData.max_price)) {
                showToast('Combo price cannot be higher than max price.', 'error');
                return;
            }
            setFormData(prev => ({
                ...prev,
                price: nextPrice,
                cost: totalCost.toFixed(2),
            }));
        }
    }, [comboProducts, formData.type, formData.max_price, showToast]);

    const variantMasters = options.variant_masters || [];
    const availableVariantMasters = variantMasters.filter(
        (m) => !variants.some((v) => Number(v.master_id) === Number(m.id)),
    );

    const addVariantMaster = (masterId) => {
        const master = variantMasters.find((m) => String(m.id) === String(masterId));
        if (!master) return;
        if (variants.some((v) => Number(v.master_id) === Number(master.id))) {
            showToast('This variant type is already added.', 'warning');
            return;
        }
        setVariants((prev) => [
            ...prev,
            {
                master_id: master.id,
                name: master.name,
                selectedValues: [],
                availableValues: masterValueList(master),
            },
        ]);
        setAddVariantMasterId('');
    };

    const removeVariantRow = (index) => {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    };

    const toggleVariantValue = (variantIndex, value) => {
        setVariants((prev) => prev.map((row, i) => {
            if (i !== variantIndex) return row;
            const set = new Set(row.selectedValues || []);
            if (set.has(value)) set.delete(value);
            else set.add(value);
            return { ...row, selectedValues: Array.from(set) };
        }));
    };

    const selectAllVariantValues = (variantIndex) => {
        setVariants((prev) => prev.map((row, i) => (
            i === variantIndex
                ? { ...row, selectedValues: [...(row.availableValues || [])] }
                : row
        )));
    };

    const clearVariantValues = (variantIndex) => {
        setVariants((prev) => prev.map((row, i) => (
            i === variantIndex ? { ...row, selectedValues: [] } : row
        )));
    };

    useEffect(() => {
        if (!formData.is_variant) return;
        const activeVariants = variants.filter((v) => (v.selectedValues || []).length > 0);
        if (activeVariants.length === 0) {
            setVariantCombinations((prev) => (
                prev.some((row) => row.variant_id != null) ? prev : []
            ));
            return;
        }

        const arrays = activeVariants.map((v) => v.selectedValues);
        const combine = (arrs) => {
            if (arrs.length === 0) return [];
            if (arrs.length === 1) return arrs[0].map((v) => [v]);
            const res = [];
            const rest = combine(arrs.slice(1));
            for (const v of arrs[0]) {
                for (const r of rest) res.push([v, ...r]);
            }
            return res;
        };

        const combs = combine(arrays);
        setVariantCombinations((prev) => combs.map((c) => {
            const name = c.join('/');
            const existing = prev.find(
                (v) => String(v.name ?? '').toLowerCase() === name.toLowerCase(),
            );
            return existing || {
                name,
                item_code: `${name}-${formData.code}`,
                additional_cost: 0,
                additional_price: 0,
            };
        }));
    }, [variants, formData.is_variant, formData.code]);

    const updateVariantComb = (name, field, value) => {
        setVariantCombinations(prev => prev.map(v => v.name === name ? { ...v, [field]: value } : v));
    };

    // --- SEO / Relation Search ---
    // (Similar logic for related products/extras if module enabled)

    // --- Submit ---
    const CHECKBOX_FIELDS = new Set([
        'featured', 'is_embeded', 'is_initial_stock', 'is_variant', 'is_diffPrice',
        'is_batch', 'is_imei', 'is_sync_disable', 'promotion', 'is_online', 'in_stock',
        'is_addon', 'is_recipe',
    ]);

    /** Always append these keys (even when empty) so update/store never misses optional columns */
    const ALWAYS_SEND_FIELDS = new Set([
        'product_details', 'meta_title', 'meta_description', 'tags',
        'alt_code', 'wholesale_price', 'max_price', 'daily_sale_objective', 'alert_quantity',
        'promotion_price', 'starting_date', 'last_date',
        'warranty', 'guarantee',
    ]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await assertCodeAvailable('product', formData.code, isEditMode ? productId : null);
        } catch (err) {
            showApiError(err, 'Product code is not available.');
            return;
        }

        const data = new FormData();

        // Standard fields (match Blade: only send checkboxes when checked)
        Object.entries(formData).forEach(([key, val]) => {
            if (key === 'batch_number_mode') {
                // Only batch products send a mode.
                if (isChecked(formData.is_batch)) {
                    data.append('batch_number_mode', val === 'manual' ? 'manual' : 'auto');
                }
                return;
            }
            if (CHECKBOX_FIELDS.has(key)) {
                if (isChecked(val)) data.append(key, '1');
                return;
            }
            if (key === 'menu_type' && Array.isArray(val)) {
                val.forEach(v => data.append('menu_type[]', v));
            } else if (ALWAYS_SEND_FIELDS.has(key)) {
                data.append(key, val ?? '');
            } else if (val !== null && val !== undefined && val !== '') {
                data.append(key, val);
            }
        });

        // Dynamic lists
        if (formData.type === 'combo') {
            comboProducts.forEach(p => {
                data.append('product_id[]', p.id);
                data.append('product_qty[]', p.qty);
                data.append('unit_price[]', p.unit_price);
                data.append('wastage_percent[]', p.wastage_percent);
                data.append('variant_id[]', p.variant_id ?? '');
                data.append('combo_unit_id[]', p.combo_unit_id || formData.unit_id || '');
            });
        }

        if (isChecked(formData.is_variant)) {
            variants.forEach((v) => {
                if (v.name?.trim()) data.append('variant_option[]', v.name.trim());
                if (v.selectedValues?.length) data.append('variant_value[]', v.selectedValues.join(','));
            });
            variantCombinations.forEach(v => {
                data.append('variant_name[]', v.name);
                data.append('item_code[]', v.item_code);
                data.append('additional_cost[]', v.additional_cost);
                data.append('additional_price[]', v.additional_price);
            });
        }

        // Relations
        if (selectedRelated.length > 0) {
            data.append('products', selectedRelated.map(r => r.id).join(','));
        }
        if (selectedExtras.length > 0) {
            data.append('extras', selectedExtras.map(e => e.id).join(','));
        }

        // Custom Fields
        visibleCustomFields.forEach(field => {
            const fieldName = field.name.toLowerCase().replace(/ /g, '_');
            const val = formData[fieldName];
            if (val !== undefined && val !== null) {
                if (Array.isArray(val)) {
                    val.forEach(v => data.append(`${fieldName}[]`, v));
                } else {
                    data.append(fieldName, val);
                }
            }
        });

        // Files
        selectedImages.forEach(img => data.append('image[]', img));
        if (digitalFile) data.append('file', digitalFile);

        if (isEditMode) {
            data.append('id', productId);
            previousImages.forEach((img) => data.append('prev_img[]', img));
        }

        data.append('qty', formData.qty ?? '0');

        if (isChecked(formData.is_diffPrice)) {
            options.warehouses.forEach((w) => {
                data.append('warehouse_id[]', w.id);
                data.append('diff_price[]', diffPrices[w.id] ?? '');
                data.append('diff_max_price[]', diffMaxPrices[w.id] ?? '');
            });
        }

        if (isChecked(formData.is_initial_stock) && !isEditMode) {
            options.warehouses.forEach((w) => {
                data.append('stock_warehouse_id[]', w.id);
                data.append('stock[]', initialStock[w.id] ?? '');
            });
        }

        try {
            if (isEditMode) {
                const res = await api.post('products/update', data);
                showApiSuccess(res, 'Product updated successfully');
                navigate('/products');
            } else {
                const res = await api.post('product', data);
                showApiSuccess(res, 'Product created successfully');
                if (submitModeRef.current === 'another') {
                    await resetFormAfterSave();
                } else {
                    navigate('/products');
                }
            }
        } catch (error) {
            showApiError(
                error,
                isEditMode ? 'Failed to update product' : 'Failed to create product',
            );
        }
    };

    if (loading) {
        return (
            <PageLayout eyebrow="Products" title={isEditMode ? 'Update Product' : 'Add Product'}>
                <div className="ui-loading">Loading product form…</div>
            </PageLayout>
        );
    }

    const pageTitle = isEditMode ? 'Update Product' : 'Add Product';

    return (
        <PageLayout
            eyebrow="Products"
            title={pageTitle}
            actions={
                <button type="button" className="ui-btn ghost" onClick={() => navigate('/products')}>
                    ← Back to list
                </button>
            }
        >
            <Toast toast={toast} />

            <FormShell id="product-create-form" onSubmit={handleSubmit}>
                <FormHint>Fields marked with * are required.</FormHint>

                <FormPanel title="Basic information">
                    <FormRow cols={3}>
                        <FormField label="Product type" required>
                            <SelectInput name="type" value={formData.type} onChange={handleTypeChange} required>
                                <option value="standard">Standard</option>
                                <option value="combo">Combo</option>
                                <option value="digital">Digital</option>
                                <option value="service">Service</option>
                            </SelectInput>
                        </FormField>
                        <FormField label="Product name" required>
                            <TextInput name="name" value={formData.name} onChange={handleChange} required />
                        </FormField>
                        <FormField label="Product code" required>
                            <InlineField
                                action={
                                    <button type="button" className="ui-btn ghost" onClick={handleGenerateCode} title="Generate code">
                                        ↻
                                    </button>
                                }
                            >
                                <TextInput name="code" value={formData.code} onChange={handleChange} required />
                            </InlineField>
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="Alternate code" spanFull>
                            <TextInput
                                name="alt_code"
                                value={formData.alt_code}
                                onChange={handleChange}
                                placeholder="Optional secondary barcode or SKU"
                            />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="Barcode symbology" required>
                            <SelectInput name="barcode_symbology" value={formData.barcode_symbology} onChange={handleChange} required>
                                <option value="C128">Code 128</option>
                                <option value="C39">Code 39</option>
                                <option value="UPCA">UPC-A</option>
                                <option value="UPCE">UPC-E</option>
                                <option value="EAN8">EAN-8</option>
                                <option value="EAN13">EAN-13</option>
                            </SelectInput>
                        </FormField>
                        <FormField label="Brand">
                            <InlineField action={<button type="button" className="ui-btn ghost" onClick={() => setBrandModalOpen(true)}>+</button>}>
                                <SelectInput name="brand_id" value={formData.brand_id} onChange={handleChange}>
                                    <option value="">Select Brand</option>
                                    {options.brands.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                                </SelectInput>
                            </InlineField>
                        </FormField>
                        <FormField label="Category" required>
                            <InlineField action={<button type="button" className="ui-btn ghost" onClick={() => setCategoryModalOpen(true)}>+</button>}>
                                <SelectInput name="category_id" value={formData.category_id} onChange={handleChange} required>
                                    <option value="">Select Category</option>
                                    {options.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </SelectInput>
                            </InlineField>
                        </FormField>
                    </FormRow>

                    {(formData.type === 'standard' || formData.type === 'combo') && (
                        <FormRow cols={3}>
                            <FormField label="Product Unit" required={formData.type === 'standard'}>
                                <InlineField action={<button type="button" className="ui-btn ghost" onClick={() => setUnitModalOpen(true)}>+</button>}>
                                    <SelectInput name="unit_id" value={formData.unit_id} onChange={handleChange} required={formData.type === 'standard'}>
                                        <option value="">Select Unit</option>
                                        {options.units.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                                    </SelectInput>
                                </InlineField>
                            </FormField>
                            {formData.type === 'standard' && (
                                <>
                                    <FormField label="Sale Unit">
                                        <SelectInput name="sale_unit_id" value={formData.sale_unit_id} onChange={handleChange}>
                                            <option value="">Select Sale Unit</option>
                                            {saleUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </SelectInput>
                                    </FormField>
                                    <FormField label="Purchase Unit">
                                        <SelectInput name="purchase_unit_id" value={formData.purchase_unit_id} onChange={handleChange}>
                                            <option value="">Select Purchase Unit</option>
                                            {saleUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </SelectInput>
                                    </FormField>
                                </>
                            )}
                        </FormRow>
                    )}

                </FormPanel>

                <FormPanel title="Pricing & tax">
                    {(isStandard || isCombo) && (
                        <FormRow cols={3}>
                            <FormField label="Product Cost" required={isStandard}>
                                <NumberInput name="cost" value={formData.cost} onChange={handleChange} required={isStandard} />
                            </FormField>
                            <FormField label="Profit Margin Type">
                                <SelectInput name="profit_margin_type" value={formData.profit_margin_type} onChange={handleChange}>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="flat">Flat</option>
                                </SelectInput>
                            </FormField>
                            <FormField label="Profit Margin">
                                <TextInput name="profit_margin" value={formData.profit_margin} onChange={handleChange} />
                            </FormField>
                        </FormRow>
                    )}

                    <FormRow cols={isDigital || isService ? 2 : 3}>
                        <FormField label="Product Price" required>
                            <NumberInput
                                name="price"
                                value={formData.price}
                                onChange={handlePriceChange}
                                max={formData.max_price !== '' ? formData.max_price : undefined}
                                required
                            />
                        </FormField>
                        <FormField label="Max price">
                            <NumberInput
                                name="max_price"
                                value={formData.max_price}
                                onChange={handleMaxPriceChange}
                                min={formData.price !== '' ? formData.price : undefined}
                                placeholder="Optional ceiling price"
                            />
                        </FormField>
                    </FormRow>

                    {(isDigital || isService) && (
                        <FormRow cols={1}>
                            <FormField label="Attach File" required>
                                <FileInput onChange={(e) => setDigitalFile(e.target.files[0])} required />
                            </FormField>
                        </FormRow>
                    )}

                    {isCombo && (
                        <div style={{ marginTop: 20 }}>
                            <FormSubheading>Combo products</FormSubheading>
                            <div className="ui-search-wrap mb-3">
                                <TextInput
                                    placeholder="Type product code and select…"
                                    value={comboSearch}
                                    onChange={(e) => setComboSearch(e.target.value)}
                                />
                                {comboSuggestions.length > 0 && (
                                    <div className="ui-search-dropdown">
                                        {comboSuggestions.map((label, i) => (
                                            <div
                                                key={i}
                                                className="ui-search-dropdown-item"
                                                onMouseDown={() => selectComboSuggestion(label)}
                                                dangerouslySetInnerHTML={{ __html: label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="ui-table-wrap">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Wastage %</th>
                                            <th>Qty</th>
                                            <th>Unit cost</th>
                                            <th>Unit price</th>
                                            <th>Subtotal</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comboProducts.map(p => (
                                            <tr key={`${p.id}-${p.variant_id}`}>
                                                <td>{p.name} [{p.code}]</td>
                                                <td><input type="number" className="ui-input sm" value={p.wastage_percent} onChange={(e) => updateCombo(comboRowKey(p), 'wastage_percent', e.target.value)} /></td>
                                                <td><input type="number" className="ui-input sm" value={p.qty} onChange={(e) => updateCombo(comboRowKey(p), 'qty', e.target.value)} step="any" min="0" /></td>
                                                <td><input type="number" className="ui-input sm" value={p.unit_cost} onChange={(e) => updateCombo(comboRowKey(p), 'unit_cost', e.target.value)} /></td>
                                                <td><input type="number" className="ui-input sm" value={p.unit_price} onChange={(e) => updateCombo(comboRowKey(p), 'unit_price', e.target.value)} step="any" /></td>
                                                <td className="cell-num">{(p.subtotal || 0).toFixed(2)}</td>
                                                <td><button type="button" className="ui-btn danger sm" onClick={() => setComboProducts(prev => prev.filter(x => `${x.id}-${x.variant_id}` !== `${p.id}-${p.variant_id}`))}>×</button></td>
                                            </tr>
                                        ))}
                                        {comboProducts.length === 0 && (
                                            <tr><td colSpan="7" className="ui-empty">No combo products added.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!isDigital && !isService && (
                        <FormRow cols={isStandard ? 3 : 2}>
                            <FormField label="Wholesale Price">
                                <NumberInput name="wholesale_price" value={formData.wholesale_price} onChange={handleChange} />
                            </FormField>
                            <FormField label="Daily Sale Objective">
                                <NumberInput name="daily_sale_objective" value={formData.daily_sale_objective} onChange={handleChange} />
                            </FormField>
                            {isStandard && (
                                <FormField label="Alert Quantity">
                                    <NumberInput name="alert_quantity" value={formData.alert_quantity} onChange={handleChange} />
                                </FormField>
                            )}
                        </FormRow>
                    )}

                    <FormRow cols={2}>
                        <FormField label="Product Tax">
                            <InlineField action={<button type="button" className="ui-btn ghost" onClick={() => setTaxModalOpen(true)}>+</button>}>
                                <SelectInput name="tax_id" value={formData.tax_id} onChange={handleChange}>
                                    <option value="">No Tax</option>
                                    {options.taxes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </SelectInput>
                            </InlineField>
                        </FormField>
                        <FormField label="Tax Method">
                            <SelectInput name="tax_method" value={formData.tax_method} onChange={handleChange}>
                                <option value="1">Exclusive</option>
                                <option value="2">Inclusive</option>
                            </SelectInput>
                        </FormField>
                    </FormRow>

                    <FormRow cols={2}>
                        <FormField label="Warranty">
                            <InlineField
                                action={
                                    <SelectInput name="warranty_type" value={formData.warranty_type} onChange={handleChange}>
                                        <option value="days">Days</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </SelectInput>
                                }
                            >
                                <NumberInput name="warranty" value={formData.warranty} onChange={handleChange} placeholder="e.g. 1" />
                            </InlineField>
                        </FormField>
                        <FormField label="Guarantee">
                            <InlineField
                                action={
                                    <SelectInput name="guarantee_type" value={formData.guarantee_type} onChange={handleChange}>
                                        <option value="days">Days</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </SelectInput>
                                }
                            >
                                <NumberInput name="guarantee" value={formData.guarantee} onChange={handleChange} placeholder="e.g. 1" />
                            </InlineField>
                        </FormField>
                    </FormRow>
                </FormPanel>

                {visibleCustomFields.length > 0 && (
                    <FormPanel title="Custom fields">
                            <FormRow cols={3}>
                                {visibleCustomFields.map((field, idx) => {
                                    const fieldName = field.name.toLowerCase().replace(/ /g, '_');
                                    return (
                                        <FormField key={idx} label={`${field.name}${field.is_required ? ' *' : ''}`}>
                                            {field.type === 'text' && (
                                                <TextInput 
                                                    name={fieldName} 
                                                    value={formData[fieldName] || ''} 
                                                    onChange={handleChange} 
                                                    required={!!field.is_required} 
                                                />
                                            )}
                                            {field.type === 'number' && (
                                                <NumberInput 
                                                    name={fieldName} 
                                                    value={formData[fieldName] || ''} 
                                                    onChange={handleChange} 
                                                    required={!!field.is_required} 
                                                />
                                            )}
                                            {field.type === 'textarea' && (
                                                <TextareaInput 
                                                    name={fieldName} 
                                                    value={formData[fieldName] || ''} 
                                                    onChange={handleChange} 
                                                    required={!!field.is_required} 
                                                />
                                            )}
                                            {field.type === 'select' && (
                                                <SelectInput 
                                                    name={fieldName} 
                                                    value={formData[fieldName] || ''} 
                                                    onChange={handleChange} 
                                                    required={!!field.is_required}
                                                >
                                                    <option value="">Select Option</option>
                                                    {field.option_value.split(',').map((opt, i) => (
                                                        <option key={i} value={opt}>{opt}</option>
                                                    ))}
                                                </SelectInput>
                                            )}
                                            {field.type === 'date_picker' && (
                                                <TextInput 
                                                    type="date"
                                                    name={fieldName} 
                                                    value={formData[fieldName] || ''} 
                                                    onChange={handleChange} 
                                                    required={!!field.is_required} 
                                                />
                                            )}
                                            {field.type === 'radio_button' && (
                                                <div className="d-flex flex-wrap gap-3">
                                                    {field.option_value.split(',').map((opt, i) => (
                                                        <label key={i} className="d-flex align-items-center gap-1">
                                                            <input
                                                                type="radio"
                                                                name={fieldName}
                                                                value={opt}
                                                                checked={formData[fieldName] === opt}
                                                                onChange={handleChange}
                                                                required={!!field.is_required}
                                                            />
                                                            {opt}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            {(field.type === 'checkbox' || field.type === 'multi_select') && (
                                                <div className="d-flex flex-wrap gap-2">
                                                    {field.option_value.split(',').map((opt, i) => (
                                                        <CheckboxInput 
                                                            key={i}
                                                            label={opt}
                                                            checked={(formData[fieldName] || []).includes(opt)}
                                                            onChange={(e) => {
                                                                const current = formData[fieldName] || [];
                                                                const newVal = e.target.checked 
                                                                    ? [...current, opt]
                                                                    : current.filter(x => x !== opt);
                                                                setFormData(prev => ({ ...prev, [fieldName]: newVal }));
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </FormField>
                                    );
                                })}
                            </FormRow>
                    </FormPanel>
                )}

                {hasEcom && !formData.is_addon && (
                    <FormPanel title="E-commerce & marketing">
                        <FormRow cols={2}>
                            <FormField label="Tags (comma separated)">
                                <TextInput name="tags" value={formData.tags} onChange={handleChange} />
                            </FormField>
                            <FormField label="Meta title">
                                <TextInput name="meta_title" value={formData.meta_title} onChange={handleChange} />
                            </FormField>
                        </FormRow>
                        <FormRow cols={1}>
                            <FormField label="Meta description">
                                <TextareaInput name="meta_description" value={formData.meta_description} onChange={handleChange} rows={2} />
                            </FormField>
                        </FormRow>
                        <FormField label="Related products">
                            <div className="ui-search-wrap">
                                <TextInput
                                    placeholder="Search by name (min 3 characters)…"
                                    onChange={(e) => searchCatalog(e.target.value, setRelatedResults)}
                                />
                                <SearchDropdown
                                    items={relatedResults}
                                    onSelect={(r) => {
                                        if (!selectedRelated.find((x) => x.id === r.id)) {
                                            setSelectedRelated([...selectedRelated, { id: r.id, name: r.name, image: r.image }]);
                                        }
                                        setRelatedResults([]);
                                    }}
                                />
                            </div>
                            <div className="ui-tag-list">
                                {selectedRelated.map((r) => (
                                    <TagChip
                                        key={r.id}
                                        label={r.name}
                                        onRemove={() => setSelectedRelated(selectedRelated.filter((x) => x.id !== r.id))}
                                    />
                                ))}
                            </div>
                        </FormField>
                    </FormPanel>
                )}

                {hasRestaurant && (
                    <FormPanel title="Restaurant settings">
                        <FormRow cols={2}>
                            <FormField label="Kitchen">
                                <SelectInput name="kitchen_id" value={formData.kitchen_id} onChange={handleChange}>
                                    <option value="">Select kitchen</option>
                                    {options.kitchens.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                </SelectInput>
                            </FormField>
                            <FormField label="Menu type (Ctrl+click for multiple)">
                                <select
                                    name="menu_type"
                                    multiple
                                    className="ui-select-field"
                                    value={formData.menu_type}
                                    onChange={(e) => {
                                        const values = Array.from(e.target.selectedOptions, (option) => option.value);
                                        setFormData((prev) => ({ ...prev, menu_type: values }));
                                    }}
                                    style={{ minHeight: '100px' }}
                                >
                                    {options.menu_type_list.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </FormField>
                        </FormRow>
                        {!formData.is_addon && (
                            <FormField label="Extras">
                                <div className="ui-search-wrap">
                                    <TextInput
                                        placeholder="Search extras (min 3 characters)…"
                                        onChange={(e) => searchCatalog(e.target.value, setExtraResults)}
                                    />
                                    <SearchDropdown
                                        items={extraResults}
                                        onSelect={(r) => {
                                            if (!selectedExtras.find((x) => x.id === r.id)) {
                                                setSelectedExtras([...selectedExtras, { id: r.id, name: r.name }]);
                                            }
                                            setExtraResults([]);
                                        }}
                                    />
                                </div>
                                <div className="ui-tag-list">
                                    {selectedExtras.map((r) => (
                                        <TagChip
                                            key={r.id}
                                            label={r.name}
                                            tone="success"
                                            onRemove={() => setSelectedExtras(selectedExtras.filter((x) => x.id !== r.id))}
                                        />
                                    ))}
                                </div>
                            </FormField>
                        )}
                    </FormPanel>
                )}

                <FormPanel title="Product options">
                    <FormRow cols={4}>
                            {isStandard && (
                                <CheckboxInput label="Featured" name="featured" checked={isChecked(formData.featured)} onChange={handleChange} />
                            )}
                            <CheckboxInput label="Embedded Barcode" name="is_embeded" checked={isChecked(formData.is_embeded)} onChange={handleChange} />
                            {isStandard && (
                                <>
                                    {!isChecked(formData.is_variant) && (
                                        <CheckboxInput label="Has Batch/Expiry" name="is_batch" checked={isChecked(formData.is_batch)} onChange={handleChange} />
                                    )}
                                    <CheckboxInput label="IMEI/Serial Number" name="is_imei" checked={isChecked(formData.is_imei)} onChange={handleChange} />
                                    {!isChecked(formData.is_variant) && !isChecked(formData.is_batch) && !isChecked(formData.is_imei) && (
                                        <CheckboxInput
                                            label="Initial Stock"
                                            name="is_initial_stock"
                                            checked={isChecked(formData.is_initial_stock)}
                                            onChange={handleChange}
                                            disabled={isEditMode}
                                        />
                                    )}
                                    {!isChecked(formData.is_batch) && (
                                        <CheckboxInput label="Has Variant" name="is_variant" checked={isChecked(formData.is_variant)} onChange={handleChange} />
                                    )}
                                    <CheckboxInput label="Different Price for Warehouses" name="is_diffPrice" checked={isChecked(formData.is_diffPrice)} onChange={handleChange} />
                                </>
                            )}
                            <CheckboxInput label="Promotional Price" name="promotion" checked={isChecked(formData.promotion)} onChange={handleChange} />
                            {options.has_woocommerce && (
                                <CheckboxInput label="Disable Woocommerce Sync" name="is_sync_disable" checked={isChecked(formData.is_sync_disable)} onChange={handleChange} />
                            )}
                            {hasEcom && (
                                <CheckboxInput label="Sell Online" name="is_online" checked={isChecked(formData.is_online)} onChange={handleChange} />
                            )}
                            {modules.includes('ecommerce') && (
                                <CheckboxInput label="In Stock" name="in_stock" checked={isChecked(formData.in_stock)} onChange={handleChange} />
                            )}
                            {hasRestaurant && (
                                <CheckboxInput label="This is topping" name="is_addon" checked={isChecked(formData.is_addon)} onChange={handleChange} />
                            )}
                        </FormRow>

                    {isStandard && isChecked(formData.is_batch) && (
                        <div style={{ marginTop: 16 }}>
                            <FormRow cols={3}>
                                <FormField
                                    label="Batch number mode"
                                    hint={
                                        batchNumberModeLocked
                                            ? 'Locked because this product already has purchase or adjustment history.'
                                            : 'Auto generates on purchase and stock adjustment. Manual lets you type the batch number.'
                                    }
                                >
                                    <SelectInput
                                        name="batch_number_mode"
                                        value={formData.batch_number_mode === 'manual' ? 'manual' : 'auto'}
                                        onChange={handleChange}
                                        required
                                        disabled={batchNumberModeLocked}
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="manual">Manual</option>
                                    </SelectInput>
                                </FormField>
                            </FormRow>
                        </div>
                    )}

                    {isChecked(formData.promotion) && (
                        <div style={{ marginTop: 16 }}>
                            <FormSubheading>Promotion details</FormSubheading>
                            <FormRow cols={3}>
                                <FormField label="Promotional price">
                                    <NumberInput name="promotion_price" value={formData.promotion_price} onChange={handleChange} />
                                </FormField>
                                <FormField label="Starts">
                                    <TextInput type="date" name="starting_date" value={formData.starting_date} onChange={handleChange} />
                                </FormField>
                                <FormField label="Ends">
                                    <TextInput type="date" name="last_date" value={formData.last_date} onChange={handleChange} />
                                </FormField>
                            </FormRow>
                        </div>
                    )}
                </FormPanel>

                {isEditMode && isStandard && !isChecked(formData.is_variant) && !isChecked(formData.is_batch) && !isChecked(formData.is_imei) && (
                    <FormPanel title="Current warehouse stock">
                        <div className="ui-table-wrap">
                            <table className="ui-table">
                                <thead><tr><th>Warehouse</th><th>Current qty</th></tr></thead>
                                <tbody>
                                    {options.warehouses.map((w) => (
                                        <tr key={w.id}>
                                            <td>{w.name}</td>
                                            <td>{warehouseStock[w.id] ?? warehouseStock[String(w.id)] ?? 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FormPanel>
                )}

                {isStandard && isChecked(formData.is_initial_stock) && !isChecked(formData.is_variant) && !isChecked(formData.is_batch) && !isChecked(formData.is_imei) && (
                    <FormPanel title={`Initial stock${isEditMode ? ' (read-only)' : ''}`}>
                        <div className="ui-table-wrap">
                            <table className="ui-table">
                                <thead><tr><th>Warehouse</th><th>Qty</th></tr></thead>
                                <tbody>
                                    {options.warehouses.map(w => (
                                        <tr key={w.id}>
                                            <td>{w.name}</td>
                                            <td>
                                                <NumberInput
                                                    min="0"
                                                    value={initialStock[w.id] || ''}
                                                    onChange={(e) => setInitialStock({ ...initialStock, [w.id]: e.target.value })}
                                                    disabled={isEditMode}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FormPanel>
                )}

                {isStandard && isChecked(formData.is_diffPrice) && (
                    <FormPanel title="Warehouse prices">
                        <div className="ui-table-wrap">
                            <table className="ui-table">
                                <thead><tr><th>Warehouse</th><th>Price</th><th>Max Price</th></tr></thead>
                                <tbody>
                                    {options.warehouses.map(w => (
                                        <tr key={w.id}>
                                            <td>{w.name}</td>
                                            <td>
                                                <NumberInput
                                                    value={diffPrices[w.id] || ''}
                                                    onChange={(e) => handleDiffPriceChange(w.id, e.target.value)}
                                                    max={diffMaxPrices[w.id] || formData.max_price || undefined}
                                                    step="any"
                                                />
                                            </td>
                                            <td>
                                                <NumberInput
                                                    value={diffMaxPrices[w.id] || ''}
                                                    onChange={(e) => handleDiffMaxPriceChange(w.id, e.target.value)}
                                                    min={diffPrices[w.id] || formData.price || undefined}
                                                    step="any"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FormPanel>
                )}

                {isStandard && isChecked(formData.is_variant) && (
                    <FormPanel title="Variants">
                        <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>
                            Pick variant types (Size, Color, etc.) and tick the attributes to use on this product.
                            {' '}
                            <Link to="/variant-masters">Manage variant types</Link>
                        </p>

                        {variants.length > 0 && variants.map((v, i) => {
                            if (!(v.availableValues || []).length) return null;
                            return (
                            <div key={`${v.master_id || v.name}-${i}`} className="ui-variant-master-block mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <strong>{v.name}</strong>
                                    <div className="d-flex gap-2">
                                        <button type="button" className="ui-btn ghost sm" onClick={() => selectAllVariantValues(i)}>All</button>
                                        <button type="button" className="ui-btn ghost sm" onClick={() => clearVariantValues(i)}>Clear</button>
                                        <button type="button" className="ui-btn danger sm" onClick={() => removeVariantRow(i)} aria-label="Remove variant type">×</button>
                                    </div>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {(v.availableValues || []).map((value) => {
                                        const checked = (v.selectedValues || []).some(
                                            (s) => String(s).toLowerCase() === String(value).toLowerCase(),
                                        );
                                        return (
                                            <label
                                                key={value}
                                                className={`ui-variant-chip${checked ? ' is-active' : ''}`}
                                                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--ui-border)', borderRadius: 20, background: checked ? 'var(--ui-surface2)' : 'transparent' }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleVariantValue(i, value)}
                                                />
                                                {value}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            );
                        })}

                        {availableVariantMasters.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
                                <SelectInput
                                    value={addVariantMasterId}
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        setAddVariantMasterId(id);
                                        if (id) addVariantMaster(id);
                                    }}
                                    style={{ maxWidth: 280 }}
                                >
                                    <option value="">+ Add variant type...</option>
                                    {availableVariantMasters.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </SelectInput>
                            </div>
                        ) : (
                            variantMasters.length === 0 && (
                                <p className="text-muted mb-4">
                                    No master variant types yet. <Link to="/variant-masters">Create Size, Color, etc.</Link>
                                </p>
                            )
                        )}

                        <div className="ui-table-wrap">
                            <table className="ui-table">
                                <thead>
                                    <tr>
                                        <th>Variant</th>
                                        <th>Item code</th>
                                        <th>Addl. cost</th>
                                        <th>Addl. price</th>
                                        {isEditMode && <th>Total qty</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {variantCombinations.map((v) => (
                                        <tr key={v.variant_id ?? v.name}>
                                            <td>{v.name}</td>
                                            <td><input type="text" className="ui-input sm" value={v.item_code} onChange={(e) => updateVariantComb(v.name, 'item_code', e.target.value)} /></td>
                                            <td><input type="number" className="ui-input sm" value={v.additional_cost} onChange={(e) => updateVariantComb(v.name, 'additional_cost', e.target.value)} /></td>
                                            <td><input type="number" className="ui-input sm" value={v.additional_price} onChange={(e) => updateVariantComb(v.name, 'additional_price', e.target.value)} /></td>
                                            {isEditMode && <td>{v.qty ?? 0}</td>}
                                        </tr>
                                    ))}
                                    {variantCombinations.length === 0 && (
                                        <tr><td colSpan={isEditMode ? 5 : 4} className="ui-empty">Select attributes above to build variant combinations.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Hidden for now — re-enable when warehouse variant stock UI is ready */}
                        {false && isEditMode && variantWarehouseStock.length > 0 && (
                            <div className="ui-table-wrap mt-3">
                                <FormSubheading className="mb-2">Variant stock by warehouse</FormSubheading>
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Warehouse</th>
                                            <th>Variant</th>
                                            <th>Current qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variantWarehouseStock.map((row, index) => (
                                            <tr key={`${row.warehouse_id}-${row.variant_id}-${index}`}>
                                                <td>{row.warehouse_name || row.warehouse_id}</td>
                                                <td>{row.variant_name || row.variant_id}</td>
                                                <td>{row.qty ?? 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </FormPanel>
                )}

                <FormPanel title="Details & media">
                    <FormRow cols={1}>
                        <FormField label="Product details">
                            <TextareaInput name="product_details" value={formData.product_details} onChange={handleChange} rows={5} />
                        </FormField>
                    </FormRow>

                    <FormRow cols={1}>
                        <FormField label="Product images">
                            <input type="file" multiple className="d-none" id="image-upload" onChange={(e) => setSelectedImages([...selectedImages, ...Array.from(e.target.files)])} />
                            <label htmlFor="image-upload" className="ui-image-dropzone">
                                <div className="ui-image-dropzone-icon">↑</div>
                                <p style={{ marginBottom: 4 }}>Click to upload images</p>
                                <small className="cell-muted">Maximum 5 images</small>
                            </label>
                            {(previousImages.length > 0 || selectedImages.length > 0) && (
                                <div className="ui-image-preview-grid">
                                    {previousImages.map((img, idx) => (
                                        <div key={`prev-${img}`} className="ui-image-preview">
                                            <img
                                                src={productImageUrl(img, 'small')}
                                                alt={img}
                                                onError={(e) => { e.target.src = productImageUrl(img); }}
                                            />
                                            <button type="button" className="ui-btn danger sm" onClick={() => setPreviousImages(prev => prev.filter((_, i) => i !== idx))}>×</button>
                                        </div>
                                    ))}
                                    {selectedImages.map((file, idx) => (
                                        <div key={idx} className="ui-image-preview">
                                            <img src={URL.createObjectURL(file)} alt="preview" />
                                            <button type="button" className="ui-btn danger sm" onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </FormField>
                    </FormRow>
                </FormPanel>

                <FormActions>
                    <Button variant="ghost" type="button" onClick={() => navigate('/products')}>Cancel</Button>
                    <Button
                        variant="primary"
                        type="submit"
                        onClick={() => { submitModeRef.current = 'add'; }}
                    >
                        {isEditMode ? 'Update product' : 'Add product'}
                    </Button>
                    {!isEditMode && (
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                submitModeRef.current = 'another';
                                document.getElementById('product-create-form')?.requestSubmit();
                            }}
                        >
                            Save & add another
                        </Button>
                    )}
                </FormActions>
            </FormShell>

            {/* Modals */}
            <BrandModal
                isOpen={brandModalOpen}
                onClose={() => setBrandModalOpen(false)}
                onRefresh={fetchData}
                modules={options.modules || []}
            />
            <CategoryModal
                isOpen={categoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                onRefresh={fetchData}
                categories={options.categories}
            />
            <UnitModal
                isOpen={unitModalOpen}
                onClose={() => setUnitModalOpen(false)}
                onRefresh={fetchData}
                baseUnits={options.units}
            />
            <TaxModal
                isOpen={taxModalOpen}
                onClose={() => setTaxModalOpen(false)}
                onRefresh={fetchData}
            />
        </PageLayout>
    );
}
