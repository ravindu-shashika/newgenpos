<script setup>
import api from '@/service/api';
import { customAlphabet } from 'nanoid';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const nanoidProductCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

const toast = useToast();
const router = useRouter();
const route = useRoute();

// Form refs
const product = ref({
    type: 'standard',
    barcode_symbology: 'C128',
    is_active: true,
    featured: false,
    is_embeded: false,
    is_variant: false,
    is_diffPrice: false,
    is_batch: false,
    is_imei: false,
    promotion: false,
    is_initial_stock: false,
    profit_margin_type: 'percentage',
    profit_margin: 25,
    tax_method: '1',
    warranty_type: 'months',
    guarantee_type: 'months'
});

const submitted = ref(false);
const validationErrors = ref({});
const formContainerRef = ref(null);
const fieldRefs = ref({ name: null, code: null, category_id: null, unit_id: null });
const selectedImages = ref([]);
const imagePreviewUrls = ref([]);
const productId = ref(route.params.id || null);
const editMode = computed(() => !!productId.value);
const pageTitle = computed(() => editMode.value ? 'Edit Product' : 'Add Product');

// Variant management
const variantOptions = ref([
    { option: '', values: [] }
]);
const variantCombinations = ref([]);

// Dropdown data
const brands = ref([]);
const categories = ref([]);
const units = ref([]);
const saleUnits = ref([]);
const purchaseUnits = ref([]);
const taxes = ref([]);
const warehouses = ref([]);

// Options
const productTypes = ref([
    { label: 'Standard', value: 'standard' },
    { label: 'Combo', value: 'combo' },
    { label: 'Digital', value: 'digital' },
    { label: 'Service', value: 'service' }
]);

const barcodeSymbologies = ref([
    { label: 'Code 128', value: 'C128' },
    { label: 'Code 39', value: 'C39' },
    { label: 'UPC-A', value: 'UPCA' },
    { label: 'UPC-E', value: 'UPCE' },
    { label: 'EAN-8', value: 'EAN8' },
    { label: 'EAN-13', value: 'EAN13' }
]);

const operators = ref([
    { label: 'Multiply (×)', value: '*' },
    { label: 'Divide (÷)', value: '/' }
]);

const taxMethods = ref([
    { label: 'Exclusive', value: '1' },
    { label: 'Inclusive', value: '2' }
]);

const periodTypes = ref([
    { label: 'Days', value: 'days' },
    { label: 'Months', value: 'months' },
    { label: 'Years', value: 'years' }
]);

onMounted(async () => {
    await fetchFormData();
    
    if (editMode.value) {
        await fetchProduct();
    } else {
        generateCode();
    }
});

async function fetchFormData() {
    try {
        const response = await api.get('products/form-data');
        if (response.data) {
            // Categories
            categories.value = response.data.categories.map(c => ({
                label: c.name,
                value: c.id
            }));

            // Brands
            brands.value = [
                { label: 'No Brand', value: null },
                ...response.data.brands.map(b => ({
                    label: b.title,
                    value: b.id
                }))
            ];

            // Units (base units only)
            units.value = response.data.units.map(u => ({
                label: `${u.unit_name} (${u.unit_code})`,
                value: u.id,
                unit_code: u.unit_code
            }));

            // Taxes
            taxes.value = [
                { label: 'No Tax', value: null },
                ...response.data.taxes.map(t => ({
                    label: `${t.name} (${t.rate}%)`,
                    value: t.id
                }))
            ];

            // Warehouses
            warehouses.value = response.data.warehouses.map(w => ({
                id: w.id,
                name: w.name,
                qty: 0,
                diff_price: 0
            }));
        }
    } catch (error) {
        console.error('Error fetching form data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load form data',
            life: 3000
        });
    }
}

async function fetchProduct() {
    try {
        const response = await api.get(`product/${productId.value}`);
        
        if (response.data && response.data.success) {
            const productData = response.data.product;
            
            // Map product data to form
            product.value = {
                ...product.value,
                ...productData,
                brand_id: productData.brand_id || null,
                category_id: productData.category_id,
                unit_id: productData.unit_id,
                sale_unit_id: productData.sale_unit_id,
                purchase_unit_id: productData.purchase_unit_id,
                tax_id: productData.tax_id || null,
                featured: !!productData.featured,
                is_embeded: !!productData.is_embeded,
                is_variant: !!productData.is_variant,
                is_diffPrice: !!productData.is_diffPrice,
                is_batch: !!productData.is_batch,
                is_imei: !!productData.is_imei,
                promotion: !!(productData.promotion_price && productData.promotion_price > 0),
                is_initial_stock: false // Don't show initial stock on edit
            };

            // Load variant data
            if (productData.is_variant && productData.product_variants) {
                // Parse variant options
                if (productData.variant_options_array && productData.variant_values_array) {
                    variantOptions.value = productData.variant_options_array.map((option, index) => ({
                        option: option,
                        values: productData.variant_values_array[index].split(',')
                    }));
                }

                // Load variant combinations
                variantCombinations.value = productData.product_variants.map(pv => ({
                    name: pv.variant.name,
                    item_code: pv.item_code,
                    additional_cost: pv.additional_cost || 0,
                    additional_price: pv.additional_price || 0
                }));
            }

            // Load warehouse pricing
            if (productData.warehouse_stock && productData.warehouse_stock.length > 0) {
                productData.warehouse_stock.forEach(ws => {
                    const warehouse = warehouses.value.find(w => w.id === ws.warehouse_id);
                    if (warehouse) {
                        warehouse.diff_price = ws.price;
                    }
                });
            }

            // Load existing images (display only, not for upload)
            if (productData.image && productData.image !== 'zummXD2dvAtI.png') {
                const images = productData.image.split(',');
                imagePreviewUrls.value = images.map(img => 
                    `http://localhost:8000/images/product/${img}`
                );
            }

            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Product loaded successfully',
                life: 2000
            });
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to load product',
            life: 3000
        });
        router.push('/product/list');
    }
}

async function fetchBrands() {
    try {
        const response = await api.get('brands');
        if (response.data && response.data.status === 200) {
            brands.value = response.data.data.map(b => ({
                label: b.title,
                value: b.id
            }));
        }
    } catch (error) {
        console.error('Error fetching brands:', error);
    }
}

async function fetchCategories() {
    try {
        const response = await api.get('categories');
        if (response.data && response.data.status === 200) {
            categories.value = response.data.data.map(c => ({
                label: c.name,
                value: c.id
            }));
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function fetchUnits() {
    try {
        const response = await api.get('units');
        if (response.data && response.data.status === 200) {
            units.value = response.data.data
                .filter(u => !u.base_unit)
                .map(u => ({
                    label: `${u.unit_name} (${u.unit_code})`,
                    value: u.id,
                    unit_code: u.unit_code
                }));
        }
    } catch (error) {
        console.error('Error fetching units:', error);
    }
}

async function fetchTaxes() {
    try {
        // Loaded via fetchFormData
    } catch (error) {
        console.error('Error fetching taxes:', error);
    }
}

async function fetchWarehouses() {
    try {
        // Loaded via fetchFormData
    } catch (error) {
        console.error('Error fetching warehouses:', error);
    }
}

// Clear validation errors when user fixes fields
watch(
    () => [product.value.name, product.value.code, product.value.category_id, product.value.unit_id],
    () => {
        if (Object.keys(validationErrors.value).length) {
            validationErrors.value = {};
        }
    }
);

// Watch product type changes
watch(() => product.value.type, (newType) => {
    if (newType === 'combo') {
        product.value.is_variant = false;
        product.value.is_diffPrice = false;
        product.value.is_initial_stock = false;
    } else if (newType === 'digital') {
        product.value.is_variant = false;
        product.value.is_diffPrice = false;
        product.value.is_batch = false;
    } else if (newType === 'service') {
        product.value.is_variant = false;
        product.value.is_diffPrice = false;
        product.value.is_batch = false;
        product.value.is_imei = false;
    }
});

// Watch variant and batch to disable initial stock
watch(() => product.value.is_variant, (newValue) => {
    if (newValue) {
        product.value.is_initial_stock = false;
        product.value.is_batch = false;
        product.value.featured = false;
    }
});

watch(() => product.value.is_batch, (newValue) => {
    if (newValue) {
        product.value.is_initial_stock = false;
        product.value.is_variant = false;
        product.value.featured = false;
    }
});

watch(() => product.value.is_imei, (newValue) => {
    if (newValue) {
        product.value.is_initial_stock = false;
        product.value.featured = false;
    }
});

// Watch unit selection to populate sale/purchase units
watch(() => product.value.unit_id, async (newUnitId) => {
    if (newUnitId) {
        try {
            const response = await api.get(`units`);
            if (response.data && response.data.status === 200) {
                const allUnits = response.data.data;
                const relatedUnits = allUnits.filter(u => 
                    u.id === newUnitId || u.base_unit === newUnitId
                );
                
                saleUnits.value = relatedUnits.map(u => ({
                    label: `${u.unit_name} (${u.unit_code})`,
                    value: u.id
                }));
                
                purchaseUnits.value = [...saleUnits.value];
            }
        } catch (error) {
            console.error('Error fetching related units:', error);
        }
    }
});

// Calculate price based on cost and profit margin
watch([() => product.value.cost, () => product.value.profit_margin, () => product.value.profit_margin_type], () => {
    calculatePrice();
});

function calculatePrice() {
    const cost = parseFloat(product.value.cost) || 0;
    const margin = parseFloat(product.value.profit_margin) || 0;
    
    if (cost > 0) {
        let price;
        if (product.value.profit_margin_type === 'percentage') {
            price = cost + (cost * margin / 100);
        } else {
            price = cost + margin;
        }
        product.value.price = price.toFixed(2);
    }
}

// Recalculate margin when price is manually changed
watch(() => product.value.price, (newPrice) => {
    if (newPrice && product.value.cost) {
        const price = parseFloat(newPrice);
        const cost = parseFloat(product.value.cost);
        
        if (product.value.profit_margin_type === 'percentage') {
            product.value.profit_margin = ((price - cost) / cost * 100).toFixed(2);
        } else {
            product.value.profit_margin = (price - cost).toFixed(2);
        }
    }
});

function generateCode() {
    product.value.code = nanoidProductCode();
}

function onImageSelect(event) {
    const files = event.target.files || event.dataTransfer.files;
    if (!files.length) return;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            selectedImages.value.push(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreviewUrls.value.push(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImage(index) {
    selectedImages.value.splice(index, 1);
    imagePreviewUrls.value.splice(index, 1);
}

async function saveProduct() {
    submitted.value = true;
    validationErrors.value = {};
    
    // Frontend validation
    if (!product.value.name || !product.value.code || !product.value.category_id) {
        submitted.value = false;
        const missing = [];
        if (!product.value.name) missing.push('Product Name');
        if (!product.value.code) missing.push('Product Code');
        if (!product.value.category_id) missing.push('Category');
        validationErrors.value = { name: !product.value.name, code: !product.value.code, category_id: !product.value.category_id };
        toast.add({ severity: 'error', summary: 'Validation Error', detail: `Required: ${missing.join(', ')}`, life: 4000 });
        await nextTick();
        scrollToFirstError();
        return;
    }
    
    if (product.value.type === 'standard' && !product.value.unit_id) {
        submitted.value = false;
        validationErrors.value = { unit_id: true };
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Unit is required for standard products', life: 4000 });
        await nextTick();
        scrollToFirstError();
        return;
    }
    
    try {
        const formData = new FormData();
        
        // Add product ID if editing
        if (editMode.value) {
            formData.append('id', productId.value);
        }
        
        // Append all product fields
        Object.keys(product.value).forEach(key => {
            if (product.value[key] !== null && product.value[key] !== undefined) {
                formData.append(key, product.value[key]);
            }
        });
        
        // Append warehouse pricing if enabled
        if (product.value.is_diffPrice) {
            warehouses.value.forEach((warehouse, index) => {
                formData.append(`warehouse_id[${index}]`, warehouse.id);
                formData.append(`diff_price[${index}]`, warehouse.diff_price || 0);
            });
        }
        
        // Append warehouse stock if initial stock is enabled
        if (product.value.is_initial_stock) {
            warehouses.value.forEach((warehouse, index) => {
                formData.append(`stock_warehouse_id[${index}]`, warehouse.id);
                formData.append(`stock[${index}]`, warehouse.qty || 0);
            });
        }
        
        // Append variant data if variants are enabled
        if (product.value.is_variant && variantCombinations.value.length > 0) {
            // Append variant options and values
            variantOptions.value.forEach((variant, index) => {
                if (variant.option && variant.values.length > 0) {
                    formData.append(`variant_option[${index}]`, variant.option);
                    formData.append(`variant_value[${index}]`, variant.values.join(','));
                }
            });
            
            // Append variant combinations
            variantCombinations.value.forEach((combo, index) => {
                formData.append(`variant_name[${index}]`, combo.name);
                formData.append(`item_code[${index}]`, combo.item_code);
                formData.append(`additional_cost[${index}]`, combo.additional_cost || 0);
                formData.append(`additional_price[${index}]`, combo.additional_price || 0);
            });
        }
        
        // Append images
        selectedImages.value.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
        });
        
        const response = await api.post('save-product', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        if (response.data && response.data.success) {
            const message = editMode.value 
                ? 'Product updated successfully' 
                : 'Product created successfully';
            
            toast.add({ 
                severity: 'success', 
                summary: 'Success', 
                detail: response.data.message || message, 
                life: 3000 
            });
            
            setTimeout(() => {
                router.push('/product/list');
            }, 1500);
        } else {
            toast.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: response.data?.message || 'Failed to save product', 
                life: 3000 
            });
        }
    } catch (error) {
        submitted.value = false;
        console.error('Error saving product:', error);
        
        if (error.response && error.response.status === 422) {
            const errors = error.response.data.errors || {};
            const errMap = {};
            if (typeof errors === 'object' && !Array.isArray(errors)) {
                Object.keys(errors).forEach((key) => {
                    const msg = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
                    errMap[key] = msg;
                });
            }
            validationErrors.value = errMap;
            const firstMsg = Object.values(errMap)[0] || error.response.data.message || 'Please fix the validation errors';
            toast.add({ severity: 'error', summary: 'Validation Error', detail: firstMsg, life: 5000 });
            await nextTick();
            scrollToFirstError();
        } else {
            validationErrors.value = {};
            const errorMsg = error.response?.data?.message || 'Failed to save product';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    }
}

function scrollToFirstError() {
    const order = ['name', 'code', 'category_id', 'unit_id'];
    for (const key of order) {
        if (validationErrors.value[key]) {
            const container = document.querySelector(`[data-field="${key}"]`);
            const input = document.getElementById(key) || document.getElementById(key.replace('_id', ''));
            const el = container || input;
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const target = container || el;
                target.classList.add('field-error-shake');
                setTimeout(() => target.classList.remove('field-error-shake'), 600);
                const focusEl = el.querySelector?.('input, [role="combobox"]') || input;
                focusEl?.focus?.();
                break;
            }
        }
    }
}

// Computed properties
const showCostWarning = computed(() => {
    return product.value.cost && parseFloat(product.value.cost) <= 0;
});

const showPriceWarning = computed(() => {
    return product.value.price && product.value.cost && 
           parseFloat(product.value.price) <= parseFloat(product.value.cost);
});

// Variant management functions
function addMoreVariant() {
    variantOptions.value.push({ option: '', values: [] });
}

function removeVariantOption(index) {
    if (variantOptions.value.length > 1) {
        variantOptions.value.splice(index, 1);
        generateVariantCombinations();
    }
}

function onVariantValueChange() {
    generateVariantCombinations();
}

function generateVariantCombinations() {
    // Filter out empty options
    const validOptions = variantOptions.value.filter(v => v.option && v.values.length > 0);
    
    if (validOptions.length === 0) {
        variantCombinations.value = [];
        return;
    }
    
    // Generate all combinations
    let combinations = validOptions[0].values.map(v => [v]);
    
    for (let i = 1; i < validOptions.length; i++) {
        const newCombinations = [];
        for (const combo of combinations) {
            for (const value of validOptions[i].values) {
                newCombinations.push([...combo, value]);
            }
        }
        combinations = newCombinations;
    }
    
    // Create combination objects with item codes
    const newCombinations = combinations.map(combo => {
        const name = combo.join('/');
        const itemCode = name + '-' + (product.value.code || '');
        
        // Check if this combination already exists to preserve cost/price
        const existing = variantCombinations.value.find(v => v.name === name);
        
        return {
            name: name,
            item_code: itemCode,
            additional_cost: existing?.additional_cost || 0,
            additional_price: existing?.additional_price || 0
        };
    });
    
    variantCombinations.value = newCombinations;
}

// Watch product code changes to update variant item codes
watch(() => product.value.code, (newCode) => {
    if (variantCombinations.value.length > 0) {
        variantCombinations.value.forEach(variant => {
            const name = variant.name;
            variant.item_code = name + '-' + (newCode || '');
        });
    }
});
</script>

<template>
    <Toast />
    
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <!-- Page Header -->
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <i class="pi pi-box text-primary"></i>
                        {{ pageTitle }}
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">
                        {{ editMode ? 'Update product information' : 'Create a new product in your inventory' }}
                    </p>
                </div>
                <div class="flex gap-2">
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times" 
                        outlined
                        @click="router.push('/product/list')"
                    />
                    <Button 
                        :label="editMode ? 'Update Product' : 'Save Product'" 
                        icon="pi pi-check" 
                        @click="saveProduct"
                        :loading="submitted"
                    />
                </div>
            </div>
        </div>

        <!-- Info Banner -->
        <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
            <i class="pi pi-info-circle text-blue-500 dark:text-blue-400 mt-0.5"></i>
            <div class="text-sm text-blue-700 dark:text-blue-300">
                <p class="font-medium">Fields marked with <span class="text-red-500 dark:text-red-400">*</span> are required</p>
            </div>
        </div>

        <!-- Main Form Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <form @submit.prevent="saveProduct">
                <!-- Basic Information Section -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-info-circle text-primary"></i>
                        Basic Information
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Product Type -->
                        <div class="form-group">
                            <label for="type" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Product Type <span class="text-red-500">*</span>
                            </label>
                            <Select 
                                id="type" 
                                v-model="product.type" 
                                :options="productTypes" 
                                optionLabel="label" 
                                optionValue="value"
                                class="w-full"
                            />
                        </div>

                        <!-- Product Name -->
                        <div class="form-group" :class="{ 'has-error': validationErrors.name }" data-field="name">
                            <label for="name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Product Name <span class="text-red-500">*</span>
                            </label>
                            <InputText 
                                id="name" 
                                v-model="product.name" 
                                placeholder="Enter product name"
                                class="w-full"
                                :invalid="!!validationErrors.name || (submitted && !product.name)"
                            />
                            <small v-if="validationErrors.name && typeof validationErrors.name === 'string'" class="text-red-500 block mt-1">{{ validationErrors.name }}</small>
                        </div>

                        <!-- Product Code -->
                        <div class="form-group" :class="{ 'has-error': validationErrors.code }" data-field="code">
                            <label for="code" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Product Code <span class="text-red-500">*</span>
                            </label>
                            <div class="flex gap-2">
                                <InputText 
                                    id="code" 
                                    v-model="product.code" 
                                    placeholder="Product code"
                                    class="flex-1"
                                    :invalid="!!validationErrors.code || (submitted && !product.code)"
                                />
                                <Button 
                                    icon="pi pi-refresh" 
                                    @click="generateCode"
                                    outlined
                                    v-tooltip.top="'Generate Code'"
                                />
                            </div>
                            <small v-if="validationErrors.code && typeof validationErrors.code === 'string'" class="text-red-500 block mt-1">{{ validationErrors.code }}</small>
                        </div>

                        <!-- Alt Product Code -->
                        <div class="form-group">
                            <label for="alt_code" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Alt Product Code
                            </label>
                            <div class="flex gap-2">
                                <InputText 
                                    id="alt_code" 
                                    v-model="product.alt_code" 
                                    placeholder="Alternative product code"
                                    class="flex-1"
                                />
                                <Button 
                                    icon="pi pi-refresh" 
                                    @click="product.alt_code = nanoidProductCode()"
                                    outlined
                                    v-tooltip.top="'Generate'"
                                />
                            </div>
                        </div>

                        <!-- Barcode Symbology -->
                        <div class="form-group">
                            <label for="barcode" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Barcode Symbology <span class="text-red-500">*</span>
                            </label>
                            <Select 
                                id="barcode" 
                                v-model="product.barcode_symbology" 
                                :options="barcodeSymbologies" 
                                optionLabel="label" 
                                optionValue="value"
                                class="w-full"
                            />
                        </div>

                        <!-- Brand -->
                        <div class="form-group">
                            <label for="brand" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Brand
                            </label>
                            <Select 
                                id="brand" 
                                v-model="product.brand_id" 
                                :options="brands" 
                                optionLabel="label" 
                                optionValue="value"
                                placeholder="Select Brand"
                                class="w-full"
                                showClear
                            />
                        </div>

                        <!-- Category -->
                        <div class="form-group" :class="{ 'has-error': validationErrors.category_id }" data-field="category_id">
                            <label for="category" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Category <span class="text-red-500">*</span>
                            </label>
                            <Select 
                                id="category_id" 
                                v-model="product.category_id" 
                                :options="categories" 
                                optionLabel="label" 
                                optionValue="value"
                                placeholder="Select Category"
                                class="w-full"
                                :invalid="!!validationErrors.category_id || (submitted && !product.category_id)"
                            />
                            <small v-if="validationErrors.category_id && typeof validationErrors.category_id === 'string'" class="text-red-500 block mt-1">{{ validationErrors.category_id }}</small>
                        </div>
                    </div>
                </div>

                <!-- Unit Information (Only for standard products) -->
                <div v-if="product.type === 'standard'" class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-calculator text-primary"></i>
                        Unit Information
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Product Unit -->
                        <div class="form-group" :class="{ 'has-error': validationErrors.unit_id }" data-field="unit_id">
                            <label for="unit" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Product Unit <span class="text-red-500">*</span>
                            </label>
                            <Select 
                                id="unit_id" 
                                v-model="product.unit_id" 
                                :options="units" 
                                optionLabel="label" 
                                optionValue="value"
                                placeholder="Select Unit"
                                class="w-full"
                                :invalid="!!validationErrors.unit_id || (submitted && !product.unit_id)"
                            />
                            <small v-if="validationErrors.unit_id && typeof validationErrors.unit_id === 'string'" class="text-red-500 block mt-1">{{ validationErrors.unit_id }}</small>
                        </div>

                        <!-- Sale Unit -->
                        <div class="form-group">
                            <label for="sale_unit" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Sale Unit
                            </label>
                            <Select 
                                id="sale_unit" 
                                v-model="product.sale_unit_id" 
                                :options="saleUnits" 
                                optionLabel="label" 
                                optionValue="value"
                                placeholder="Select Sale Unit"
                                class="w-full"
                                :disabled="!product.unit_id"
                            />
                        </div>

                        <!-- Purchase Unit -->
                        <div class="form-group">
                            <label for="purchase_unit" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Purchase Unit
                            </label>
                            <Select 
                                id="purchase_unit" 
                                v-model="product.purchase_unit_id" 
                                :options="purchaseUnits" 
                                optionLabel="label" 
                                optionValue="value"
                                placeholder="Select Purchase Unit"
                                class="w-full"
                                :disabled="!product.unit_id"
                            />
                        </div>
                    </div>
                </div>

                <!-- Pricing Information -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-dollar text-primary"></i>
                        Pricing Information
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <!-- Product Cost -->
                        <div class="form-group">
                            <label for="cost" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Product Cost <span class="text-red-500">*</span>
                            </label>
                            <InputNumber 
                                id="cost" 
                                v-model="product.cost" 
                                placeholder="0.00"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                class="w-full"
                            />
                            <small v-if="showCostWarning" class="text-red-500 flex items-center gap-1 mt-1">
                                <i class="pi pi-exclamation-triangle text-xs"></i>
                                Cost must be greater than 0
                            </small>
                        </div>

                        <!-- Profit Margin Type -->
                        <div class="form-group">
                            <label for="margin_type" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Profit Margin Type
                            </label>
                            <Select 
                                id="margin_type" 
                                v-model="product.profit_margin_type" 
                                :options="[{label: 'Percentage (%)', value: 'percentage'}, {label: 'Flat', value: 'flat'}]" 
                                optionLabel="label" 
                                optionValue="value"
                                class="w-full"
                            />
                        </div>

                        <!-- Profit Margin -->
                        <div class="form-group">
                            <label for="margin" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Profit Margin
                            </label>
                            <InputNumber 
                                id="margin" 
                                v-model="product.profit_margin" 
                                :placeholder="product.profit_margin_type === 'percentage' ? '25.00%' : '0.00'"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                class="w-full"
                            />
                        </div>

                        <!-- Product Price -->
                        <div class="form-group">
                            <label for="price" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Product Price <span class="text-red-500">*</span>
                            </label>
                            <InputNumber 
                                id="price" 
                                v-model="product.price" 
                                placeholder="0.00"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                class="w-full"
                            />
                            <small v-if="showPriceWarning" class="text-orange-500 flex items-center gap-1 mt-1">
                                <i class="pi pi-exclamation-triangle text-xs"></i>
                                Price should be higher than cost
                            </small>
                        </div>

                        <!-- Wholesale Price -->
                        <div class="form-group">
                            <label for="wholesale" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Wholesale Price
                            </label>
                            <InputNumber 
                                id="wholesale" 
                                v-model="product.wholesale_price" 
                                placeholder="0.00"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                class="w-full"
                            />
                        </div>

                        <!-- Daily Sale Objective -->
                        <div class="form-group">
                            <label for="daily_sale" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Daily Sale Objective
                            </label>
                            <InputNumber 
                                id="daily_sale" 
                                v-model="product.daily_sale_objective" 
                                placeholder="0"
                                class="w-full"
                            />
                        </div>

                        <!-- Alert Quantity -->
                        <div class="form-group">
                            <label for="alert" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Alert Quantity
                            </label>
                            <InputNumber 
                                id="alert" 
                                v-model="product.alert_quantity" 
                                placeholder="0"
                                class="w-full"
                            />
                        </div>
                    </div>
                </div>

                <!-- Tax Information -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-percentage text-primary"></i>
                        Tax Information
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Product Tax -->
                        <div class="form-group">
                            <label for="tax" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Product Tax
                            </label>
                            <Select 
                                id="tax" 
                                v-model="product.tax_id" 
                                :options="taxes" 
                                optionLabel="label" 
                                optionValue="value"
                                placeholder="Select Tax"
                                class="w-full"
                                showClear
                            />
                        </div>

                        <!-- Tax Method -->
                        <div class="form-group">
                            <label for="tax_method" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Tax Method
                            </label>
                            <Select 
                                id="tax_method" 
                                v-model="product.tax_method" 
                                :options="taxMethods" 
                                optionLabel="label" 
                                optionValue="value"
                                class="w-full"
                            />
                        </div>
                    </div>
                </div>

                <!-- Warranty & Guarantee -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-shield text-primary"></i>
                        Warranty & Guarantee
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Warranty -->
                        <div class="form-group">
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Warranty
                            </label>
                            <div class="flex gap-2">
                                <InputNumber 
                                    v-model="product.warranty" 
                                    placeholder="1"
                                    :min="1"
                                    class="flex-1"
                                />
                                <Select 
                                    v-model="product.warranty_type" 
                                    :options="periodTypes" 
                                    optionLabel="label" 
                                    optionValue="value"
                                    class="flex-1"
                                />
                            </div>
                        </div>

                        <!-- Guarantee -->
                        <div class="form-group">
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Guarantee
                            </label>
                            <div class="flex gap-2">
                                <InputNumber 
                                    v-model="product.guarantee" 
                                    placeholder="1"
                                    :min="1"
                                    class="flex-1"
                                />
                                <Select 
                                    v-model="product.guarantee_type" 
                                    :options="periodTypes" 
                                    optionLabel="label" 
                                    optionValue="value"
                                    class="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Product Images -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-images text-primary"></i>
                        Product Images
                    </h3>
                    
                    <!-- Drop Zone -->
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary transition-colors bg-gray-50 dark:bg-gray-700/30">
                        <input 
                            type="file" 
                            @change="onImageSelect"
                            accept="image/*"
                            multiple
                            class="hidden"
                            id="image-upload"
                        />
                        <label for="image-upload" class="cursor-pointer">
                            <i class="pi pi-cloud-upload text-6xl text-gray-400 dark:text-gray-500 mb-4"></i>
                            <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                Drop files here to upload
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                or <span class="text-primary hover:underline">browse</span> to choose files
                            </p>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Supported formats: JPG, PNG, GIF (max 2MB each)
                            </p>
                        </label>
                    </div>

                    <!-- Image Previews -->
                    <div v-if="imagePreviewUrls.length > 0" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                        <div 
                            v-for="(url, index) in imagePreviewUrls" 
                            :key="index"
                            class="relative group"
                        >
                            <img 
                                :src="url" 
                                alt="Preview" 
                                class="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                            />
                            <button 
                                type="button"
                                @click="removeImage(index)"
                                class="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                                <i class="pi pi-times text-sm"></i>
                            </button>
                            <span v-if="index === 0" class="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                                Primary
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Product Details -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-align-left text-primary"></i>
                        Product Details
                    </h3>
                    <Textarea 
                        v-model="product.product_details" 
                        rows="5" 
                        placeholder="Enter product details, description, specifications..."
                        class="w-full"
                    />
                </div>

                <!-- Additional Options -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-cog text-primary"></i>
                        Additional Options
                    </h3>
                    <div class="space-y-4">
                        <!-- Featured (hide when batch or imei is enabled) -->
                        <div v-if="!product.is_batch && !product.is_imei" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <Checkbox 
                                v-model="product.featured" 
                                :binary="true" 
                                inputId="featured"
                            />
                            <label for="featured" class="cursor-pointer flex-1">
                                <span class="font-semibold text-gray-700 dark:text-gray-300">Featured</span>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Featured product will be displayed in POS</p>
                            </label>
                        </div>

                        <!-- Embedded Barcode -->
                        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <Checkbox 
                                v-model="product.is_embeded" 
                                :binary="true" 
                                inputId="embeded"
                            />
                            <label for="embeded" class="cursor-pointer flex-1">
                                <span class="font-semibold text-gray-700 dark:text-gray-300">Embedded Barcode</span>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Check this if product will be used in weight scale machine</p>
                            </label>
                        </div>

                        <!-- Initial Stock (hide for combo/digital/service when no variants) -->
                        <div v-if="product.type !== 'combo'" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <Checkbox 
                                v-model="product.is_initial_stock" 
                                :binary="true" 
                                inputId="initial_stock"
                                :disabled="product.is_variant || product.is_batch || product.is_imei"
                            />
                            <label for="initial_stock" class="cursor-pointer flex-1">
                                <span class="font-semibold text-gray-700 dark:text-gray-300">Initial Stock</span>
                                <p class="text-sm text-gray-500 dark:text-gray-400">This feature will not work for product with variants and batches</p>
                            </label>
                        </div>

                        <!-- This product has variant (only for standard products) -->
                        <div v-if="product.type === 'standard'" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <Checkbox 
                                v-model="product.is_variant" 
                                :binary="true" 
                                inputId="is_variant"
                            />
                            <label for="is_variant" class="cursor-pointer flex-1">
                                <span class="font-semibold text-gray-700 dark:text-gray-300">This product has variant</span>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Enable product variants (size, color, etc.)</p>
                            </label>
                        </div>

                        <!-- Different price for different warehouse (only for standard products) -->
                        <div v-if="product.type === 'standard'" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <Checkbox 
                                v-model="product.is_diffPrice" 
                                :binary="true" 
                                inputId="is_diffPrice"
                            />
                            <label for="is_diffPrice" class="cursor-pointer flex-1">
                                <span class="font-semibold text-gray-700 dark:text-gray-300">This product has different price for different warehouse</span>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Set different prices for each warehouse</p>
                            </label>
                        </div>

                        <!-- Batch and expired date (only for standard products, hide for digital/service) -->
                        <div v-if="product.type === 'standard'" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <Checkbox 
                                v-model="product.is_batch" 
                                :binary="true" 
                                inputId="is_batch"
                            />
                            <label for="is_batch" class="cursor-pointer flex-1">
                                <span class="font-semibold text-gray-700 dark:text-gray-300">This product has batch and expired date</span>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Track product batches with expiration dates</p>
                            </label>
                        </div>

                        <!-- IMEI or Serial numbers (only for standard products, hide for service) -->
                        <div v-if="product.type === 'standard'" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <Checkbox 
                                v-model="product.is_imei" 
                                :binary="true" 
                                inputId="is_imei"
                            />
                            <label for="is_imei" class="cursor-pointer flex-1">
                                <span class="font-semibold text-gray-700 dark:text-gray-300">This product has IMEI or Serial numbers</span>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Track individual items by serial number or IMEI</p>
                            </label>
                        </div>

                        <!-- Add Promotional Price -->
                        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <Checkbox 
                                v-model="product.promotion" 
                                :binary="true" 
                                inputId="promotion"
                            />
                            <label for="promotion" class="cursor-pointer flex-1">
                                <span class="font-semibold text-gray-700 dark:text-gray-300">Add Promotional Price</span>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Set a special promotional price with start and end dates</p>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Variant Section (shown when variant is checked) -->
                <div v-if="product.is_variant" class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-list text-primary"></i>
                        Product Variants
                    </h3>

                    <!-- Variant Input Section -->
                    <div class="space-y-4 mb-6">
                        <div 
                            v-for="(variant, index) in variantOptions" 
                            :key="index"
                            class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
                        >
                            <!-- Option Field -->
                            <div class="md:col-span-3">
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Option <span class="text-red-500">*</span>
                                </label>
                                <InputText 
                                    v-model="variant.option" 
                                    placeholder="Size, Color etc..."
                                    class="w-full"
                                    @input="onVariantValueChange"
                                />
                            </div>

                            <!-- Value Field (Tag Input) -->
                            <div class="md:col-span-8">
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Value <span class="text-red-500">*</span>
                                </label>
                                <Chips 
                                    v-model="variant.values" 
                                    placeholder="Enter variant value separated by comma"
                                    separator=","
                                    class="w-full"
                                    @add="onVariantValueChange"
                                    @remove="onVariantValueChange"
                                />
                            </div>

                            <!-- Delete Button -->
                            <div class="md:col-span-1 flex items-end">
                                <Button 
                                    icon="pi pi-times" 
                                    severity="danger"
                                    @click="removeVariantOption(index)"
                                    :disabled="variantOptions.length === 1"
                                    class="w-full"
                                    v-tooltip.top="'Remove Option'"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Add More Variant Button -->
                    <div class="mb-6">
                        <Button 
                            label="Add More Variant" 
                            icon="pi pi-plus" 
                            @click="addMoreVariant"
                            severity="info"
                            outlined
                        />
                    </div>

                    <!-- Variant Combinations Table -->
                    <div v-if="variantCombinations.length > 0" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Name
                                        </th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Item Code
                                        </th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Additional Cost
                                        </th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Additional Price
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr 
                                        v-for="(combination, index) in variantCombinations" 
                                        :key="index"
                                        class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                                    >
                                        <td class="px-4 py-3">
                                            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {{ combination.name }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3">
                                            <span class="text-sm font-mono text-gray-600 dark:text-gray-400">
                                                {{ combination.item_code }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3">
                                            <InputNumber 
                                                v-model="combination.additional_cost" 
                                                :minFractionDigits="2"
                                                :maxFractionDigits="2"
                                                placeholder="0.00"
                                                class="w-full max-w-[150px]"
                                            />
                                        </td>
                                        <td class="px-4 py-3">
                                            <InputNumber 
                                                v-model="combination.additional_price" 
                                                :minFractionDigits="2"
                                                :maxFractionDigits="2"
                                                placeholder="0.00"
                                                class="w-full max-w-[150px]"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <i class="pi pi-inbox text-4xl text-gray-400 dark:text-gray-500 mb-2"></i>
                        <p class="text-gray-500 dark:text-gray-400">Add variant options to see combinations</p>
                    </div>
                </div>

                <!-- Different Warehouse Pricing Section -->
                <div v-if="product.is_diffPrice" class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-building text-primary"></i>
                        Warehouse Pricing
                    </h3>
                    
                    <!-- Warehouse Price Table -->
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-2xl">
                        <table class="w-full">
                            <thead class="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Warehouse
                                    </th>
                                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Price
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr 
                                    v-for="warehouse in warehouses" 
                                    :key="'price-' + warehouse.id"
                                    class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                                >
                                    <td class="px-4 py-3">
                                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {{ warehouse.name }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <InputNumber 
                                            v-model="warehouse.diff_price" 
                                            :minFractionDigits="2"
                                            :maxFractionDigits="2"
                                            placeholder="0.00"
                                            class="w-full max-w-xs"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Initial Stock Section (shown when initial stock is checked) -->
                <div v-if="product.is_initial_stock && !product.is_variant && !product.is_batch" class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-warehouse text-primary"></i>
                        Initial Stock
                    </h3>
                    
                    <!-- Warning Message -->
                    <div class="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-2">
                        <i class="pi pi-info-circle text-orange-500 dark:text-orange-400 mt-0.5"></i>
                        <p class="text-sm text-orange-700 dark:text-orange-300">
                            <strong>Note:</strong> This feature will not work for product with variants and batches
                        </p>
                    </div>

                    <!-- Warehouse Stock Table -->
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-2xl">
                        <table class="w-full">
                            <thead class="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Warehouse
                                    </th>
                                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Qty
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr 
                                    v-for="warehouse in warehouses" 
                                    :key="warehouse.id"
                                    class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                                >
                                    <td class="px-4 py-3">
                                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {{ warehouse.name }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <InputNumber 
                                            v-model="warehouse.qty" 
                                            :min="0"
                                            placeholder="0"
                                            class="w-full max-w-xs"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Promotional Price Section (shown when promotion is checked) -->
                <div v-if="product.promotion" class="mb-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i class="pi pi-tag text-primary"></i>
                        Promotional Pricing
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Promotional Price -->
                        <div class="form-group">
                            <label for="promo_price" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Promotional Price <span class="text-red-500">*</span>
                            </label>
                            <InputNumber 
                                id="promo_price" 
                                v-model="product.promotion_price" 
                                placeholder="0.00"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                class="w-full"
                            />
                        </div>

                        <!-- Start Date -->
                        <div class="form-group">
                            <label for="start_date" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Promotion Starts <span class="text-red-500">*</span>
                            </label>
                            <Calendar 
                                id="start_date" 
                                v-model="product.starting_date" 
                                dateFormat="dd-mm-yy"
                                :minDate="new Date()"
                                showIcon
                                class="w-full"
                            />
                        </div>

                        <!-- End Date -->
                        <div class="form-group">
                            <label for="end_date" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Promotion Ends <span class="text-red-500">*</span>
                            </label>
                            <Calendar 
                                id="end_date" 
                                v-model="product.last_date" 
                                dateFormat="dd-mm-yy"
                                :minDate="product.starting_date || new Date()"
                                showIcon
                                class="w-full"
                            />
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times" 
                        outlined
                        severity="secondary"
                        @click="router.push('/product/list')"
                    />
                    <Button 
                        type="submit"
                        :label="editMode ? 'Update Product' : 'Add Product'" 
                        :icon="editMode ? 'pi pi-check' : 'pi pi-plus'"
                        severity="help"
                        :loading="submitted"
                    />
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
/* Custom styling for product form */
.form-group {
    margin-bottom: 0;
}

.form-group.has-error :deep(.p-inputtext),
.form-group.has-error :deep(.p-dropdown) {
    border-color: var(--p-danger-500);
    box-shadow: 0 0 0 1px var(--p-danger-500);
}

/* Shake animation for error indication */
.field-error-shake {
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
}

:deep(.p-dropdown),
:deep(.p-inputnumber),
:deep(.p-inputtext),
:deep(.p-textarea) {
    width: 100%;
}

:deep(.p-checkbox) {
    width: 1.25rem;
    height: 1.25rem;
}
</style>
