<script setup>
import api, { ASSET_BASE_URL } from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const actionLoading = ref(false);
const products = ref([]);
const filterVisible = ref(false);

const filterOptions = reactive({
    warehouses: [],
    categories: [],
    brands: [],
    units: [],
    taxes: []
});

const filters = reactive({
    search: '',
    warehouseId: '0',
    productType: 'all',
    brandId: '0',
    categoryId: '0',
    unitId: '0',
    taxId: '0',
    imeiOrVariant: '0',
    stockFilter: 'all'
});

const deleteDialog = ref(false);
const selectedProduct = ref(null);

const detailDialog = ref(false);
const detailLoading = ref(false);
const detailData = ref(null);

const importDialogVisible = ref(false);
const importFile = ref(null);
const importProcessing = ref(false);

onMounted(async () => {
    await Promise.all([fetchFilters(), fetchProducts()]);
});

async function fetchFilters() {
    try {
        const res = await api.get('products/form-data');
        if (res.data) {
            filterOptions.categories = res.data.categories?.map((c) => ({ label: c.name, value: String(c.id) })) || [];
            filterOptions.brands = res.data.brands?.map((b) => ({ label: b.title, value: String(b.id) })) || [];
            filterOptions.units = res.data.units?.map((u) => ({ label: `${u.unit_name} (${u.unit_code})`, value: String(u.id) })) || [];
            filterOptions.taxes = res.data.taxes?.map((t) => ({ label: `${t.name} (${t.rate}%)`, value: String(t.id) })) || [];
            filterOptions.warehouses = res.data.warehouses?.map((w) => ({ label: w.name, value: String(w.id) })) || [];
        }
    } catch (error) {
        console.error('Error loading filter options', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Unable to load filter options', life: 3000 });
    }
}

async function fetchProducts() {
    loading.value = true;
    try {
        const res = await api.get('products');
        if (res.data) {
            products.value = res.data;
        }
    } catch (error) {
        console.error('Error fetching products', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load products', life: 3000 });
    } finally {
        loading.value = false;
    }
}

const filteredProducts = computed(() => {
    return products.value.filter((product) => {
        if (filters.search) {
            const value = filters.search.toLowerCase();
            const matchesSearch =
                product.name?.toLowerCase().includes(value) ||
                product.code?.toLowerCase().includes(value) ||
                product.type?.toLowerCase().includes(value) ||
                product.brand?.title?.toLowerCase().includes(value) ||
                product.category?.name?.toLowerCase().includes(value);
            if (!matchesSearch) {
                return false;
            }
        }

        if (filters.productType !== 'all' && product.type !== filters.productType) return false;
        if (filters.brandId !== '0' && String(product.brand_id) !== filters.brandId) return false;
        if (filters.categoryId !== '0' && String(product.category_id) !== filters.categoryId) return false;
        if (filters.unitId !== '0' && String(product.unit_id) !== filters.unitId) return false;
        if (filters.taxId !== '0' && String(product.tax_id) !== filters.taxId) return false;
        if (filters.imeiOrVariant === 'imei' && !product.is_imei) return false;
        if (filters.imeiOrVariant === 'variant' && !product.is_variant) return false;
        if (filters.stockFilter === 'with' && Number(product.qty || 0) <= 0) return false;
        if (filters.stockFilter === 'without' && Number(product.qty || 0) > 0) return false;

        return true;
    });
});

const totals = computed(() => {
    const totalQty = filteredProducts.value.reduce((sum, product) => sum + Number(product.qty || 0), 0);
    const totalCost = filteredProducts.value.reduce((sum, product) => sum + Number(product.qty || 0) * Number(product.cost || 0), 0);
    const totalPrice = filteredProducts.value.reduce((sum, product) => sum + Number(product.qty || 0) * Number(product.price || 0), 0);
    return { totalQty, totalCost, totalPrice };
});

function toggleFilters() {
    filterVisible.value = !filterVisible.value;
}

function resetFilters() {
    filters.search = '';
    filters.warehouseId = '0';
    filters.productType = 'all';
    filters.brandId = '0';
    filters.categoryId = '0';
    filters.unitId = '0';
    filters.taxId = '0';
    filters.imeiOrVariant = '0';
    filters.stockFilter = 'all';
}

function addProduct() {
    router.push('/product/add');
}

function editProduct(product) {
    router.push(`/product/edit/${product.id}`);
}

function confirmDelete(product) {
    selectedProduct.value = product;
    deleteDialog.value = true;
}

async function deleteProduct() {
    if (!selectedProduct.value) return;
    try {
        const res = await api.get(`delete-product/${selectedProduct.value.id}`);
        if (res.data?.success) {
            toast.add({ severity: 'success', summary: 'Deleted', detail: res.data.message || 'Product deleted', life: 3000 });
            await fetchProducts();
        } else {
            throw new Error(res.data?.message || 'Failed to delete product');
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || error.message || 'Failed to delete product', life: 3000 });
    } finally {
        deleteDialog.value = false;
        selectedProduct.value = null;
    }
}

function getProductImage(product) {
    if (!product.image || product.image === 'zummXD2dvAtI.png') {
        return 'https://via.placeholder.com/60x60?text=No+Image';
    }
    const first = product.image.split(',')[0];
    return `${ASSET_BASE_URL}/images/product/${first}`;
}

function getProductTypeLabel(type) {
    const map = {
        standard: 'Standard',
        combo: 'Combo',
        digital: 'Digital',
        service: 'Service'
    };
    return map[type] || type;
}

function getProductTypeSeverity(type) {
    const map = {
        standard: 'success',
        combo: 'info',
        digital: 'warning',
        service: 'help'
    };
    return map[type] || 'secondary';
}

async function viewProduct(product) {
    detailDialog.value = true;
    detailLoading.value = true;
    detailData.value = null;

    try {
        const [productRes, warehouseRes] = await Promise.all([
            api.get(`product/${product.id}`),
            api.get(`products/${product.id}/warehouse-data`)
        ]);

        if (productRes.data?.success) {
            detailData.value = {
                product: productRes.data.product,
                warehouse: warehouseRes.data?.product_warehouse || [],
                variantWarehouse: warehouseRes.data?.product_variant_warehouse || []
            };
        } else {
            throw new Error(productRes.data?.message || 'Unable to load product details');
        }
    } catch (error) {
        console.error('Error loading product detail', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to load product detail', life: 3000 });
        detailDialog.value = false;
    } finally {
        detailLoading.value = false;
    }
}

function openImportDialog() {
    importFile.value = null;
    importDialogVisible.value = true;
}

async function handleImport() {
    if (!importFile.value) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Please select a CSV file', life: 3000 });
        return;
    }
    importProcessing.value = true;
    try {
        const formData = new FormData();
        formData.append('file', importFile.value);
        const res = await api.post('products/import', formData);
        if (res.data?.success || res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Import', detail: res.data.message || 'Products imported', life: 3000 });
            importDialogVisible.value = false;
            await fetchProducts();
        } else {
            throw new Error(res.data?.message || 'Import failed');
        }
    } catch (error) {
        console.error('Import error', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || error.message || 'Failed to import products', life: 3000 });
    } finally {
        importProcessing.value = false;
    }
}

async function handleAllInStock() {
    actionLoading.value = true;
    try {
        const res = await api.post('products/all-in-stock', {});
        if (res.data?.success || res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Success', detail: res.data.message || 'All products set to in stock', life: 3000 });
        } else {
            throw new Error(res.data?.message || 'Operation failed');
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || error.message || 'Failed to update in stock', life: 3000 });
    } finally {
        actionLoading.value = false;
    }
}

async function handleShowOnline() {
    actionLoading.value = true;
    try {
        const res = await api.post('products/show-online', {});
        if (res.data?.success || res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Success', detail: res.data.message || 'All products set to show online', life: 3000 });
        } else {
            throw new Error(res.data?.message || 'Operation failed');
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || error.message || 'Failed to update online status', life: 3000 });
    } finally {
        actionLoading.value = false;
    }
}

function openBarcodePage(product) {
    router.push({ name: 'product-barcode', query: { product: product.id } });
}

function openHistoryPage(product) {
    router.push({ name: 'product-history', query: { product: product.id } });
}
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div class="space-y-1">
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 flex items-center gap-3">
                    <i class="pi pi-box text-primary-500"></i>
                    Products
                </h1>
                <p class="text-surface-500 dark:text-surface-400">
                    Manage all products, stock levels, and pricing in one place.
                </p>
            </div>
            <div class="flex flex-wrap gap-2">
                <Button label="Print Barcode" icon="pi pi-qrcode" severity="secondary" outlined @click="router.push({ name: 'product-barcode' })" />
                <Button label="Import" icon="pi pi-upload" severity="secondary" outlined @click="openImportDialog" />
                <Button label="All In Stock" icon="pi pi-check-circle" severity="help" outlined :loading="actionLoading" @click="handleAllInStock" />
                <Button label="Show Online" icon="pi pi-globe" severity="success" outlined :loading="actionLoading" @click="handleShowOnline" />
                <Button label="Add Product" icon="pi pi-plus" @click="addProduct" />
            </div>
        </div>

        <div class="card mb-4 shadow-sm">
            <div class="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100 flex items-center gap-2">
                    <i class="pi pi-filter"></i>
                    Filters
                </h3>
                <div class="flex gap-2">
                    <Button label="Reset" text severity="secondary" @click="resetFilters" />
                    <Button :label="filterVisible ? 'Hide Filters' : 'Show Filters'" icon="pi pi-sliders-h" text @click="toggleFilters" />
                </div>
            </div>

            <Transition name="fade">
                <div v-if="filterVisible" class="px-4 py-4 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label class="filter-label">Search</label>
                            <span class="p-input-icon-left w-full">
                                <i class="pi pi-search" />
                                <InputText v-model="filters.search" class="w-full" placeholder="Search by name, code, category..." />
                            </span>
                        </div>
                        <div>
                            <label class="filter-label">Product Type</label>
                            <Dropdown
                                v-model="filters.productType"
                                class="w-full"
                                :options="[
                                    { label: 'All Types', value: 'all' },
                                    { label: 'Standard', value: 'standard' },
                                    { label: 'Combo', value: 'combo' },
                                    { label: 'Digital', value: 'digital' },
                                    { label: 'Service', value: 'service' }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select type"
                            />
                        </div>
                        <div>
                            <label class="filter-label">Brand</label>
                            <Dropdown
                                v-model="filters.brandId"
                                class="w-full"
                                :options="[{ label: 'All Brands', value: '0' }, ...filterOptions.brands]"
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div>
                            <label class="filter-label">Category</label>
                            <Dropdown
                                v-model="filters.categoryId"
                                class="w-full"
                                :options="[{ label: 'All Categories', value: '0' }, ...filterOptions.categories]"
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div>
                            <label class="filter-label">Unit</label>
                            <Dropdown
                                v-model="filters.unitId"
                                class="w-full"
                                :options="[{ label: 'All Units', value: '0' }, ...filterOptions.units]"
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div>
                            <label class="filter-label">Tax</label>
                            <Dropdown
                                v-model="filters.taxId"
                                class="w-full"
                                :options="[{ label: 'All Taxes', value: '0' }, ...filterOptions.taxes]"
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div>
                            <label class="filter-label">IMEI / Variant</label>
                            <Dropdown
                                v-model="filters.imeiOrVariant"
                                class="w-full"
                                :options="[
                                    { label: 'All Products', value: '0' },
                                    { label: 'IMEI Products', value: 'imei' },
                                    { label: 'Variant Products', value: 'variant' }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div>
                            <label class="filter-label">Stock</label>
                            <Dropdown
                                v-model="filters.stockFilter"
                                class="w-full"
                                :options="[
                                    { label: 'All', value: 'all' },
                                    { label: 'With Stock', value: 'with' },
                                    { label: 'Without Stock', value: 'without' }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                    </div>
                </div>
            </Transition>
        </div>

        <div class="card shadow-sm">
            <DataTable
                :value="filteredProducts"
                :rows="15"
                paginator
                :rowsPerPageOptions="[15, 30, 50, 100]"
                responsiveLayout="scroll"
                :loading="loading"
                stripedRows
                showGridlines
            >
                <template #empty>
                    <div class="text-center text-surface-500 dark:text-surface-400 py-6">No products match the selected filters.</div>
                </template>

                <Column header="Image" style="min-width: 100px">
                    <template #body="{ data }">
                        <img :src="getProductImage(data)" :alt="data.name" class="rounded-lg border border-surface-200 dark:border-surface-700" style="width: 60px; height: 60px; object-fit: cover;" />
                    </template>
                </Column>

                <Column field="code" header="Code" sortable style="min-width: 140px">
                    <template #body="{ data }">
                        <div class="font-semibold text-surface-800 dark:text-surface-100">{{ data.code }}</div>
                        <div v-if="data.alt_code" class="text-xs text-surface-500">Alt: {{ data.alt_code }}</div>
                    </template>
                </Column>

                <Column field="name" header="Name" sortable style="min-width: 220px">
                    <template #body="{ data }">
                        <div class="font-semibold">{{ data.name }}</div>
                        <div class="text-sm text-surface-500">
                            <span v-if="data.brand?.title">{{ data.brand.title }}</span>
                            <span v-if="data.category?.name">
                                <span v-if="data.brand?.title"> · </span>
                                {{ data.category.name }}
                            </span>
                        </div>
                    </template>
                </Column>

                <Column field="type" header="Type" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <Tag :value="getProductTypeLabel(data.type)" :severity="getProductTypeSeverity(data.type)" />
                    </template>
                </Column>

                <Column field="qty" header="Qty" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <div class="font-semibold">{{ Number(data.qty || 0).toFixed(2) }}</div>
                    </template>
                </Column>

                <Column field="price" header="Price" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <div class="font-semibold text-emerald-500">{{ Number(data.price || 0).toFixed(2) }}</div>
                    </template>
                </Column>

                <Column field="cost" header="Cost" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <div class="font-semibold text-surface-700 dark:text-surface-200">{{ Number(data.cost || 0).toFixed(2) }}</div>
                    </template>
                </Column>

                <Column header="Stock Worth (Price)" style="min-width: 150px">
                    <template #body="{ data }">
                        <div class="text-surface-700 dark:text-surface-200">
                            {{ (Number(data.qty || 0) * Number(data.price || 0)).toFixed(2) }}
                        </div>
                    </template>
                </Column>

                <Column header="Stock Worth (Cost)" style="min-width: 150px">
                    <template #body="{ data }">
                        <div class="text-surface-700 dark:text-surface-200">
                            {{ (Number(data.qty || 0) * Number(data.cost || 0)).toFixed(2) }}
                        </div>
                    </template>
                </Column>

                <Column header="Actions" style="min-width: 240px">
                    <template #body="{ data }">
                        <div class="flex flex-wrap gap-2">
                            <Button icon="pi pi-eye" size="small" severity="secondary" outlined v-tooltip="'View'" @click="viewProduct(data)" />
                            <Button icon="pi pi-pencil" size="small" outlined v-tooltip="'Edit'" @click="editProduct(data)" />
                            <Button icon="pi pi-qrcode" size="small" severity="help" outlined v-tooltip="'Print Barcode'" @click="openBarcodePage(data)" />
                            <Button icon="pi pi-history" size="small" severity="info" outlined v-tooltip="'History'" @click="openHistoryPage(data)" />
                            <Button icon="pi pi-trash" size="small" severity="danger" outlined v-tooltip="'Delete'" @click="confirmDelete(data)" />
                        </div>
                    </template>
                </Column>

                <template #footer>
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full text-sm text-surface-500 dark:text-surface-300 px-2">
                        <div>
                            Showing {{ filteredProducts.length }} of {{ products.length }} products
                        </div>
                        <div class="flex flex-wrap gap-4">
                            <div><strong>Total Qty:</strong> {{ totals.totalQty.toFixed(2) }}</div>
                            <div><strong>Stock Worth (Cost):</strong> {{ totals.totalCost.toFixed(2) }}</div>
                            <div><strong>Stock Worth (Price):</strong> {{ totals.totalPrice.toFixed(2) }}</div>
                        </div>
                    </div>
                </template>
            </DataTable>
        </div>

        <Dialog v-model:visible="deleteDialog" header="Confirm Delete" modal :style="{ width: '25rem' }">
            <div class="flex items-start gap-3">
                <i class="pi pi-exclamation-triangle text-3xl text-amber-500"></i>
                <div>
                    <p class="mb-3 text-surface-700 dark:text-surface-200">
                        Are you sure you want to delete
                        <span class="font-semibold">{{ selectedProduct?.name }}</span>?
                    </p>
                    <p class="text-sm text-surface-500">This action will deactivate the product.</p>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="detailDialog" :style="{ width: '70vw', maxWidth: '1100px' }" modal header="Product Details">
            <div v-if="detailLoading" class="py-10 text-center">
                <ProgressSpinner />
            </div>
            <div v-else-if="detailData" class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <h3 class="text-xl font-semibold text-surface-800 dark:text-surface-100">{{ detailData.product.name }}</h3>
                        <div class="grid grid-cols-2 gap-y-2 text-sm">
                            <div class="text-surface-500">Code:</div>
                            <div class="font-medium text-surface-700 dark:text-surface-100">{{ detailData.product.code }}</div>
                            <div class="text-surface-500">Type:</div>
                            <div>{{ getProductTypeLabel(detailData.product.type) }}</div>
                            <div class="text-surface-500">Brand:</div>
                            <div>{{ detailData.product.brand?.title || '—' }}</div>
                            <div class="text-surface-500">Category:</div>
                            <div>{{ detailData.product.category?.name || '—' }}</div>
                            <div class="text-surface-500">Unit:</div>
                            <div>{{ detailData.product.unit?.unit_name || '—' }}</div>
                            <div class="text-surface-500">Tax:</div>
                            <div>{{ detailData.product.tax?.name ? `${detailData.product.tax.name} (${detailData.product.tax.rate}%)` : '—' }}</div>
                            <div class="text-surface-500">Cost:</div>
                            <div>{{ Number(detailData.product.cost || 0).toFixed(2) }}</div>
                            <div class="text-surface-500">Price:</div>
                            <div>{{ Number(detailData.product.price || 0).toFixed(2) }}</div>
                            <div class="text-surface-500">Alert Qty:</div>
                            <div>{{ detailData.product.alert_quantity ?? '—' }}</div>
                            <div class="text-surface-500">Promotion:</div>
                            <div>{{ detailData.product.promotion ? 'Yes' : 'No' }}</div>
                        </div>
                    </div>
                    <div>
                        <div class="grid grid-cols-2 gap-3">
                            <div v-for="(img, idx) in (detailData.product.image ? detailData.product.image.split(',') : [])" :key="idx" class="rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
                                <img :src="`${ASSET_BASE_URL}/images/product/${img}`" :alt="detailData.product.name" class="w-full h-40 object-cover" />
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="detailData.product.product_variants?.length">
                    <h4 class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-3">Variants</h4>
                    <DataTable :value="detailData.product.product_variants" responsiveLayout="scroll" class="mb-4">
                        <Column field="variant.name" header="Variant" />
                        <Column field="item_code" header="Item Code" />
                        <Column field="additional_cost" header="Additional Cost">
                            <template #body="{ data }">{{ Number(data.additional_cost || 0).toFixed(2) }}</template>
                        </Column>
                        <Column field="additional_price" header="Additional Price">
                            <template #body="{ data }">{{ Number(data.additional_price || 0).toFixed(2) }}</template>
                        </Column>
                        <Column field="qty" header="Qty">
                            <template #body="{ data }">{{ Number(data.qty || 0).toFixed(2) }}</template>
                        </Column>
                    </DataTable>
                </div>

                <div>
                    <h4 class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-3">Warehouse Stock</h4>
                    <div v-if="detailData.warehouse && detailData.warehouse[0]?.length" class="overflow-x-auto bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                        <table class="w-full text-sm">
                            <thead class="bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-200">
                                <tr>
                                    <th class="py-2 px-3 text-left">Warehouse</th>
                                    <th class="py-2 px-3 text-left">Batch</th>
                                    <th class="py-2 px-3 text-left">Expires</th>
                                    <th class="py-2 px-3 text-left">IMEI</th>
                                    <th class="py-2 px-3 text-right">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(warehouseName, index) in detailData.warehouse[0]"
                                    :key="`warehouse-${index}`"
                                    class="border-t border-surface-200 dark:border-surface-700"
                                >
                                    <td class="px-3 py-2">{{ warehouseName }}</td>
                                    <td class="px-3 py-2">{{ detailData.warehouse[2][index] }}</td>
                                    <td class="px-3 py-2">{{ detailData.warehouse[3][index] }}</td>
                                    <td class="px-3 py-2 break-all text-xs">{{ detailData.warehouse[4][index] }}</td>
                                    <td class="px-3 py-2 text-right font-semibold">{{ Number(detailData.warehouse[1][index] || 0).toFixed(2) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-else class="text-sm text-surface-500">No warehouse stock information available.</div>
                </div>

                <div v-if="detailData.variantWarehouse && detailData.variantWarehouse[0]?.length">
                    <h4 class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-3">Variant Warehouse Stock</h4>
                    <div class="overflow-x-auto bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                        <table class="w-full text-sm">
                            <thead class="bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-200">
                                <tr>
                                    <th class="py-2 px-3 text-left">Warehouse</th>
                                    <th class="py-2 px-3 text-left">Variant</th>
                                    <th class="py-2 px-3 text-right">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(warehouseName, index) in detailData.variantWarehouse[0]"
                                    :key="`variant-warehouse-${index}`"
                                    class="border-t border-surface-200 dark:border-surface-700"
                                >
                                    <td class="px-3 py-2">{{ warehouseName }}</td>
                                    <td class="px-3 py-2">{{ detailData.variantWarehouse[1][index] }}</td>
                                    <td class="px-3 py-2 text-right font-semibold">{{ Number(detailData.variantWarehouse[2][index] || 0).toFixed(2) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div v-else class="py-6 text-center text-surface-500">No detail available.</div>
        </Dialog>

        <Dialog v-model:visible="importDialogVisible" header="Import Products" modal :style="{ width: '30rem' }">
            <div class="space-y-4">
                <p class="text-sm text-surface-500">
                    Upload a CSV file matching the required format. Ensure the column order matches the sample file used in the legacy system.
                </p>
                <div>
                    <label class="filter-label">CSV File</label>
                    <input
                        type="file"
                        accept=".csv"
                        class="p-inputtext w-full"
                        @change="(e) => (importFile.value = e.target.files?.[0] || null)"
                    />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="importDialogVisible = false" />
                <Button label="Import" icon="pi pi-upload" :loading="importProcessing" @click="handleImport" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.card {
    background: var(--surface-card);
    border-radius: 1.25rem;
    border: 1px solid var(--surface-border);
}

.filter-label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--surface-500);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
