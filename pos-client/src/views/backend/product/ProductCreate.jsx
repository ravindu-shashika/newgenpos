import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    PageLayout,
    FormField,
    FormRow,
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
import { api, generateUniqueCode, assertCodeAvailable } from '../../../services';

// --- Sub-components (Modals) ---
const BrandModal = ({ isOpen, onClose, onRefresh, modules }) => {
    const [form, setForm] = useState({ title: '', image: null, page_title: '', short_description: '' });
    const { showToast } = useToast();

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
            await api.post('brand', data);
            showToast('Brand added successfully', 'success');
            onRefresh();
            onClose();
            setForm({ title: '', image: null, page_title: '', short_description: '' });
        } catch (error) { showToast('Failed to add brand', 'error'); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Brand">
            <form onSubmit={handleSubmit}>
                <FormField label="Brand Title *">
                    <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </FormField>
                <FormField label="Brand Image">
                    <FileInput onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
                </FormField>
                
                    {(modules.includes('ecommerce') || modules.includes('restaurant')) && (
                    <div style={{ marginTop: 12 }}>
                        <div className="ui-form-card-title">SEO details</div>
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
    const { showToast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', name);
        if (parentId) data.append('parent_id', parentId);
        data.append('is_active', true);
        try {
            await api.post('category', data);
            showToast('Category added successfully', 'success');
            onRefresh();
            onClose();
            setName(''); setParentId('');
        } catch (error) { showToast('Failed to add category', 'error'); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Category">
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
    const { showToast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('unit', form);
            showToast('Unit added successfully', 'success');
            onRefresh();
            onClose();
            setForm({ unit_code: '', unit_name: '', base_unit: '', operator: '*', operation_value: 1 });
        } catch (error) { showToast('Failed to add unit', 'error'); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Unit">
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
    const { showToast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('tax', { name, rate, is_active: true, ajax: 1 });
            showToast('Tax added successfully', 'success');
            onRefresh();
            onClose();
            setName(''); setRate('');
        } catch (error) { showToast('Failed to add tax', 'error'); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Tax">
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

function FormPanel({ title, children }) {
    return (
        <div className="ui-form-card">
            {title && <div className="ui-form-card-title">{title}</div>}
            {children}
        </div>
    );
}

function InlineField({ children, action }) {
    return (
        <div className="ui-inline-field">
            <div className="ui-inline-field-main">{children}</div>
            {action && <div className="ui-inline-field-action">{action}</div>}
        </div>
    );
}

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

export default function ProductCreate() {
    const navigate = useNavigate();
    const { id: productId } = useParams();
    const isEditMode = Boolean(productId);
    const { toast, showToast } = useToast();

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
        decimal: 2,
        margin_type: 2,
    });
    const [roleId, setRoleId] = useState(null);
    const submitModeRef = useRef('add');

    const initialFormData = {
        type: 'standard',
        name: '',
        code: '',
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
        wholesale_price: '',
        daily_sale_objective: '',
        alert_quantity: '',
        tax_id: '',
        tax_method: '1',
        warranty: '',
        warranty_type: 'months',
        guarantee: '',
        guarantee_type: 'months',
        featured: false,
        is_embeded: false,
        is_initial_stock: false,
        is_variant: false,
        is_diffPrice: false,
        is_batch: false,
        is_imei: false,
        is_sync_disable: false,
        promotion: false,
        promotion_price: '',
        starting_date: '',
        last_date: '',
        product_details: '',
        // SEO/Ecommerce/Restaurant (if enabled)
        meta_title: '',
        meta_description: '',
        tags: '',
        is_online: true,
        in_stock: true,
        is_addon: false,
        menu_type: [],
        is_recipe: false,
        kitchen_id: '',
        qty: 0,
    };
    const [formData, setFormData] = useState(initialFormData);

    // Dynamic state for tables/lists
    const [comboProducts, setComboProducts] = useState([]);
    const [initialStock, setInitialStock] = useState({}); // {warehouse_id: qty}
    const [diffPrices, setDiffPrices] = useState({}); // {warehouse_id: price}
    const [variants, setVariants] = useState([{ name: '', values: '' }]);
    const [variantCombinations, setVariantCombinations] = useState([]); // List of combinations with props
    const [selectedImages, setSelectedImages] = useState([]);
    const [previousImages, setPreviousImages] = useState([]);
    const [digitalFile, setDigitalFile] = useState(null);
    const [existingDigitalFile, setExistingDigitalFile] = useState('');

    // Related products / Extras state
    const [relatedResults, setRelatedResults] = useState([]);
    const [selectedRelated, setSelectedRelated] = useState([]);
    const [extraResults, setExtraResults] = useState([]);
    const [selectedExtras, setSelectedExtras] = useState([]);
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
        setDiffPrices({});
        setVariants([{ name: '', values: '' }]);
        setVariantCombinations([]);
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
    };

    const applyEditPayload = (data) => {
        const p = data.product || {};
        const bool = (v) => v == 1 || v === true;

        resetDynamicState();

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
            decimal: data.decimal ?? 2,
            margin_type: data.margin_type ?? 2,
        });
        setRoleId(data.role_id ?? null);

        const customValues = data.custom_field_values || {};
        const initialStockMap = data.initial_stock || {};
        const hasInitialStock = !!data.has_initial_stock || Object.values(initialStockMap).some((qty) => Number(qty) > 0);

        setFormData({
            ...initialFormData,
            id: p.id,
            type: p.type || 'standard',
            name: p.name || '',
            code: p.code || '',
            barcode_symbology: p.barcode_symbology || 'C128',
            brand_id: p.brand_id ?? '',
            category_id: p.category_id ?? '',
            unit_id: p.unit_id ?? '',
            sale_unit_id: p.sale_unit_id ?? '',
            purchase_unit_id: p.purchase_unit_id ?? '',
            cost: p.cost ?? '',
            profit_margin_type: p.profit_margin_type || (data.margin_type == 1 ? 'flat' : 'percentage'),
            profit_margin: p.profit_margin ?? '0',
            price: p.price ?? '',
            wholesale_price: p.wholesale_price ?? '',
            daily_sale_objective: p.daily_sale_objective ?? '',
            alert_quantity: p.alert_quantity ?? '',
            tax_id: p.tax_id ?? '',
            tax_method: p.tax_method ?? '1',
            warranty: p.warranty ?? '',
            warranty_type: p.warranty_type || 'months',
            guarantee: p.guarantee ?? '',
            guarantee_type: p.guarantee_type || 'months',
            featured: bool(p.featured),
            is_embeded: bool(p.is_embeded),
            is_initial_stock: hasInitialStock,
            is_variant: bool(p.is_variant),
            is_diffPrice: bool(p.is_diffPrice),
            is_batch: bool(p.is_batch),
            is_imei: bool(p.is_imei),
            is_sync_disable: bool(p.is_sync_disable),
            promotion: bool(p.promotion),
            promotion_price: p.promotion_price ?? '',
            starting_date: p.starting_date ? String(p.starting_date).slice(0, 10) : '',
            last_date: p.last_date ? String(p.last_date).slice(0, 10) : '',
            product_details: p.product_details ?? '',
            meta_title: p.meta_title ?? '',
            meta_description: p.meta_description ?? '',
            tags: p.tags ?? '',
            is_online: bool(p.is_online),
            in_stock: bool(p.in_stock),
            is_addon: bool(p.is_addon),
            menu_type: p.menu_type ? String(p.menu_type).split(',').filter(Boolean) : [],
            is_recipe: bool(p.is_recipe),
            kitchen_id: p.kitchen_id ?? '',
            qty: p.qty ?? 0,
            ...customValues,
        });

        setInitialStock(hasInitialStock ? initialStockMap : {});

        if (data.variants?.length) {
            setVariants(data.variants);
        }
        if (data.variant_combinations?.length) {
            setVariantCombinations(data.variant_combinations);
        }
        if (data.combo_products?.length) {
            setComboProducts(data.combo_products);
        }
        if (data.diff_prices) {
            setDiffPrices(data.diff_prices);
        }
        if (data.related_products_selected?.length) {
            setSelectedRelated(data.related_products_selected);
        }
        if (data.extras_selected?.length) {
            setSelectedExtras(data.extras_selected);
        }
        setPreviousImages(data.previous_images || []);
        setExistingDigitalFile(data.existing_file || '');
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
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
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

    // Calculate profit margin -> price
    useEffect(() => {
        if (isCombo || isDigital || isService) return;
        const cost = parseFloat(formData.cost) || 0;
        const margin = parseFloat(formData.profit_margin) || 0;
        let price = 0;
        if (formData.profit_margin_type === 'percentage') {
            price = cost + (cost * margin / 100);
        } else {
            price = cost + margin;
        }
        setFormData(prev => ({ ...prev, price: price.toFixed(2) }));
    }, [formData.cost, formData.profit_margin, formData.profit_margin_type, formData.type]);

    // Handle price change -> margin
    const handlePriceChange = (e) => {
        const newPrice = parseFloat(e.target.value) || 0;
        const cost = parseFloat(formData.cost) || 0;
        let margin = 0;
        if (formData.profit_margin_type === 'percentage') {
            margin = cost > 0 ? ((newPrice - cost) / cost * 100) : 0;
        } else {
            margin = newPrice - cost;
        }
        setFormData(prev => ({ ...prev, price: newPrice, profit_margin: margin.toFixed(2) }));
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
        if (formData.is_variant && variantCombinations.length === 0) {
            showToast('Please define at least one variant combination.', 'error');
            return false;
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
            setFormData(prev => ({
                ...prev,
                price: totalPrice.toFixed(2),
                cost: totalCost.toFixed(2),
            }));
        }
    }, [comboProducts, formData.type]);

    // --- Variant Logic ---
    const handleVariantInputChange = (index, field, value) => {
        const newV = [...variants];
        newV[index][field] = value;
        setVariants(newV);
    };

    useEffect(() => {
        if (!formData.is_variant) return;
        const activeVariants = variants.filter(v => v.values.trim() !== '');
        if (activeVariants.length === 0) {
            setVariantCombinations([]);
            return;
        }

        const arrays = activeVariants.map(v => v.values.split(',').map(s => s.trim()).filter(s => s));
        const combine = (arrs) => {
            if (arrs.length === 0) return [];
            if (arrs.length === 1) return arrs[0].map(v => [v]);
            const res = [];
            const rest = combine(arrs.slice(1));
            for (let v of arrs[0]) {
                for (let r of rest) res.push([v, ...r]);
            }
            return res;
        };

        const combs = combine(arrays);
        setVariantCombinations(combs.map(c => {
            const name = c.join('/');
            const existing = variantCombinations.find(v => v.name === name);
            return existing || {
                name,
                item_code: `${name}-${formData.code}`,
                additional_cost: 0,
                additional_price: 0
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
        'wholesale_price', 'daily_sale_objective', 'alert_quantity',
        'promotion_price', 'starting_date', 'last_date',
        'warranty', 'guarantee',
    ]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await assertCodeAvailable('product', formData.code, isEditMode ? productId : null);
        } catch (err) {
            showToast(err.message, 'error');
            return;
        }

        const data = new FormData();

        // Standard fields (match Blade: only send checkboxes when checked)
        Object.entries(formData).forEach(([key, val]) => {
            if (CHECKBOX_FIELDS.has(key)) {
                if (val) data.append(key, '1');
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

        if (formData.is_variant) {
            variants.forEach((v) => {
                if (v.name?.trim()) data.append('variant_option[]', v.name.trim());
                if (v.values?.trim()) data.append('variant_value[]', v.values.trim());
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

        if (formData.is_diffPrice) {
            options.warehouses.forEach((w) => {
                data.append('warehouse_id[]', w.id);
                data.append('diff_price[]', diffPrices[w.id] ?? '');
            });
        }

        if (formData.is_initial_stock && !isEditMode) {
            options.warehouses.forEach((w) => {
                data.append('stock_warehouse_id[]', w.id);
                data.append('stock[]', initialStock[w.id] ?? '');
            });
        }

        try {
            if (isEditMode) {
                await api.post('products/update', data);
                showToast('Product updated successfully', 'success');
                navigate('/products');
            } else {
                await api.post('product', data);
                showToast('Product created successfully', 'success');
                if (submitModeRef.current === 'another') {
                    await resetFormAfterSave();
                } else {
                    navigate('/products');
                }
            }
        } catch (error) {
            const msg = error?.message
                || Object.values(error?.errors || {}).flat().join(' ')
                || (isEditMode ? 'Failed to update product' : 'Failed to create product');
            showToast(msg, 'error');
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

            <form id="product-create-form" className="ui-form-shell" onSubmit={handleSubmit}>
                <p className="ui-form-hint">Fields marked with * are required.</p>

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
                                <InlineField action={<button type="button" className="ui-btn ghost sm" onClick={() => setUnitModalOpen(true)}>+</button>}>
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
                    <FormRow cols={3}>
                        {(isStandard || isCombo) && (
                            <FormField label="Product Cost" required={isStandard}>
                                <NumberInput name="cost" value={formData.cost} onChange={handleChange} required={isStandard} />
                            </FormField>
                        )}
                        {!isDigital && !isService && (
                            <>
                                <FormField label="Profit Margin Type">
                                    <SelectInput name="profit_margin_type" value={formData.profit_margin_type} onChange={handleChange}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat</option>
                                    </SelectInput>
                                </FormField>
                                <FormField label="Profit Margin">
                                    <TextInput name="profit_margin" value={formData.profit_margin} onChange={handleChange} />
                                </FormField>
                            </>
                        )}
                        <FormField label="Product Price" required>
                            <NumberInput name="price" value={formData.price} onChange={handlePriceChange} required />
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
                            <div className="ui-form-card-title">Combo products</div>
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

                    <FormRow cols={3}>
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
                                <CheckboxInput label="Featured" name="featured" checked={!!formData.featured} onChange={handleChange} />
                            )}
                            <CheckboxInput label="Embedded Barcode" name="is_embeded" checked={!!formData.is_embeded} onChange={handleChange} />
                            {isStandard && (
                                <>
                                    <CheckboxInput label="Has Batch/Expiry" name="is_batch" checked={!!formData.is_batch} onChange={handleChange} />
                                    <CheckboxInput label="IMEI/Serial Number" name="is_imei" checked={!!formData.is_imei} onChange={handleChange} />
                                    {!formData.is_variant && !formData.is_batch && !formData.is_imei && (
                                        <CheckboxInput
                                            label="Initial Stock"
                                            name="is_initial_stock"
                                            checked={!!formData.is_initial_stock}
                                            onChange={handleChange}
                                            disabled={isEditMode}
                                        />
                                    )}
                                    {!formData.is_batch && (
                                        <CheckboxInput label="Has Variant" name="is_variant" checked={!!formData.is_variant} onChange={handleChange} />
                                    )}
                                    <CheckboxInput label="Different Price for Warehouses" name="is_diffPrice" checked={!!formData.is_diffPrice} onChange={handleChange} />
                                </>
                            )}
                            <CheckboxInput label="Promotional Price" name="promotion" checked={!!formData.promotion} onChange={handleChange} />
                            {options.has_woocommerce && (
                                <CheckboxInput label="Disable Woocommerce Sync" name="is_sync_disable" checked={!!formData.is_sync_disable} onChange={handleChange} />
                            )}
                            {hasEcom && (
                                <CheckboxInput label="Sell Online" name="is_online" checked={!!formData.is_online} onChange={handleChange} />
                            )}
                            {modules.includes('ecommerce') && (
                                <CheckboxInput label="In Stock" name="in_stock" checked={!!formData.in_stock} onChange={handleChange} />
                            )}
                            {hasRestaurant && (
                                <CheckboxInput label="This is topping" name="is_addon" checked={!!formData.is_addon} onChange={handleChange} />
                            )}
                        </FormRow>

                    {formData.promotion && (
                        <div style={{ marginTop: 16 }}>
                            <div className="ui-form-card-title">Promotion details</div>
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

                {isStandard && formData.is_initial_stock && (
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

                {isStandard && formData.is_diffPrice && (
                    <FormPanel title="Warehouse prices">
                        <div className="ui-table-wrap">
                            <table className="ui-table">
                                <thead><tr><th>Warehouse</th><th>Price</th></tr></thead>
                                <tbody>
                                    {options.warehouses.map(w => (
                                        <tr key={w.id}>
                                            <td>{w.name}</td>
                                            <td>
                                                <NumberInput value={diffPrices[w.id] || ''} onChange={(e) => setDiffPrices({ ...diffPrices, [w.id]: e.target.value })} step="any" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FormPanel>
                )}

                {isStandard && formData.is_variant && (
                    <FormPanel title="Variants">
                        {variants.map((v, i) => (
                            <div key={i} className="ui-variant-row">
                                <TextInput placeholder="Option (e.g. Size)" value={v.name} onChange={(e) => handleVariantInputChange(i, 'name', e.target.value)} />
                                <TextInput placeholder="Values (e.g. S, M, L)" value={v.values} onChange={(e) => handleVariantInputChange(i, 'values', e.target.value)} />
                                <button type="button" className="ui-btn danger sm" onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                            </div>
                        ))}
                        <button type="button" className="ui-btn ghost sm" style={{ marginBottom: 16 }} onClick={() => setVariants([...variants, { name: '', values: '' }])}>
                            + Add option
                        </button>
                        <div className="ui-table-wrap">
                            <table className="ui-table">
                                <thead>
                                    <tr>
                                        <th>Variant</th>
                                        <th>Item code</th>
                                        <th>Addl. cost</th>
                                        <th>Addl. price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variantCombinations.map((v, i) => (
                                        <tr key={i}>
                                            <td>{v.name}</td>
                                            <td><input type="text" className="ui-input sm" value={v.item_code} onChange={(e) => updateVariantComb(v.name, 'item_code', e.target.value)} /></td>
                                            <td><input type="number" className="ui-input sm" value={v.additional_cost} onChange={(e) => updateVariantComb(v.name, 'additional_cost', e.target.value)} /></td>
                                            <td><input type="number" className="ui-input sm" value={v.additional_price} onChange={(e) => updateVariantComb(v.name, 'additional_price', e.target.value)} /></td>
                                        </tr>
                                    ))}
                                    {variantCombinations.length === 0 && (
                                        <tr><td colSpan="4" className="ui-empty">No variants defined.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                                                src={`${import.meta.env.VITE_APP_DEFAULT_PATH || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/images/product/small/${img}`}
                                                alt={img}
                                                onError={(e) => { e.target.src = `${import.meta.env.VITE_APP_DEFAULT_PATH || 'http://127.0.0.1:8000'}/images/product/${img}`; }}
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

                <div className="ui-form-footer">
                    <button type="button" className="ui-btn ghost" onClick={() => navigate('/products')}>Cancel</button>
                    <button type="submit" className="ui-btn primary" onClick={() => { submitModeRef.current = 'add'; }}>
                        {isEditMode ? 'Update product' : 'Add product'}
                    </button>
                    {!isEditMode && (
                        <button type="button" className="ui-btn secondary" onClick={(e) => { e.preventDefault(); submitModeRef.current = 'another'; document.getElementById('product-create-form')?.requestSubmit(); }}>
                            Save & add another
                        </button>
                    )}
                </div>
            </form>

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
