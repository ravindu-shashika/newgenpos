<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, reactive, computed } from 'vue';

const toast = useToast();

const initLoading = ref(false);
const suggestions = ref([]);
const searchTerm = ref('');
const selectedSuggestion = ref(null);
const selectedProducts = ref([]);

const barcodeSettings = ref([]);
const barcodeSettingId = ref(null);

const labelOptions = reactive({
    name: { enabled: true, size: 15 },
    price: { enabled: true, size: 15 },
    promo_price: { enabled: true, size: 15 },
    business_name: { enabled: true, size: 15 },
    brand_name: { enabled: true, size: 15 }
});

const currencyMeta = reactive({
    currency: '',
    position: ''
});

const previewLoading = ref(false);

onMounted(() => {
    fetchInitialData();
});

async function fetchInitialData() {
    initLoading.value = true;
    try {
        const res = await api.get('products/barcode/init');
        if (res.data) {
            suggestions.value = res.data.suggestions || [];
            barcodeSettings.value = (res.data.barcode_settings || []).map((setting) => ({
                label: setting.name,
                value: setting.id,
                raw: setting
            }));
            barcodeSettingId.value = res.data.default_barcode_setting_id || barcodeSettings.value[0]?.value || null;

            currencyMeta.currency = res.data.currency || '';
            currencyMeta.position = res.data.currency_position || 'left';
        }
    } catch (error) {
        console.error('Failed to load barcode init data', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Unable to load barcode settings', life: 3000 });
    } finally {
        initLoading.value = false;
    }
}

async function searchProducts(event) {
    const query = event.query?.trim();
    if (!query) {
        return;
    }

    try {
        const res = await api.get(`products/search?query=${encodeURIComponent(query)}`);
        suggestions.value = res.data?.results || [];
    } catch (error) {
        console.error('Product search failed', error);
    }
}

async function onProductSelect(event) {
    const suggestion = event.value;
    if (!suggestion?.code) {
        return;
    }

    try {
        const res = await api.get(`products/barcode/lookup?code=${encodeURIComponent(suggestion.code)}&barcode=1`);
        const products = res.data?.products || [];
        if (products.length === 0) {
            toast.add({ severity: 'warn', summary: 'Not Found', detail: 'No matching product found for barcode.', life: 3000 });
            return;
        }

        products.forEach((product) => addProduct(product));
    } catch (error) {
        console.error('Barcode lookup failed', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch product details', life: 3000 });
    } finally {
        searchTerm.value = '';
        selectedSuggestion.value = null;
    }
}

function addProduct(product) {
    const exists = selectedProducts.value.some((item) => item.product_id === product.product_id && item.code === product.code);
    if (exists) {
        toast.add({ severity: 'info', summary: 'Duplicate', detail: 'This product is already in the list.', life: 2000 });
        return;
    }

    selectedProducts.value.push({
        ...product,
        quantity: 1,
        selected_price: product.price,
        selected_warehouse_id: product.warehouse_prices?.[0]?.warehouse_id ?? null,
        notes: ''
    });
}

function removeProduct(index) {
    selectedProducts.value.splice(index, 1);
}

function formatCurrency(amount) {
    if (!currencyMeta.currency) {
        return Number(amount || 0).toFixed(2);
    }

    const formatted = Number(amount || 0).toFixed(2);
    if (currencyMeta.position === 'right') {
        return `${formatted} ${currencyMeta.currency}`;
    }
    return `${currencyMeta.currency} ${formatted}`;
}

const previewDisabled = computed(() => selectedProducts.value.length === 0 || !barcodeSettingId.value);

function buildPrintPayload() {
    const print = {
        name: labelOptions.name.enabled ? 1 : 0,
        name_size: labelOptions.name.size,
        price: labelOptions.price.enabled ? 1 : 0,
        price_size: labelOptions.price.size,
        promo_price: labelOptions.promo_price.enabled ? 1 : 0,
        promo_price_size: labelOptions.promo_price.size,
        business_name: labelOptions.business_name.enabled ? 1 : 0,
        business_name_size: labelOptions.business_name.size,
        brand_name: labelOptions.brand_name.enabled ? 1 : 0,
        brand_name_size: labelOptions.brand_name.size,
        variations: 1,
        variations_size: 17,
        packing_date: 1,
        packing_date_size: 12,
    };

    const products = selectedProducts.value.map((product) => ({
        product_id: product.product_id,
        product_name: product.name,
        sub_sku: product.code,
        quantity: Number(product.quantity || 1),
        product_price: Number(product.selected_price ?? product.price ?? 0),
        default_price: Number(product.price ?? 0),
        product_promo_price: product.promotion_price ?? null,
        currency: product.currency ?? currencyMeta.currency,
        currency_position: product.currency_position ?? currencyMeta.position,
        brand_name: product.brand_name ?? null,
        alt_code: product.alt_code ?? null,
    }));

    return {
        barcode_setting: barcodeSettingId.value,
        print,
        products,
    };
}

async function previewLabels() {
    const payload = buildPrintPayload();

    if (payload.products.length === 0) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Please add at least one product.', life: 3000 });
        return;
    }

    previewLoading.value = true;
    try {
        const res = await api.post('products/barcode/preview', payload);
        if (res.data?.success) {
            const previewWindow = window.open('', '_blank');
            if (previewWindow) {
                previewWindow.document.write(res.data.html);
                previewWindow.document.close();
            } else {
                toast.add({ severity: 'warn', summary: 'Popup blocked', detail: 'Allow popups to preview the labels.', life: 4000 });
            }
        } else {
            throw new Error(res.data?.message || 'Preview failed');
        }
    } catch (error) {
        console.error('Label preview failed', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || error.message || 'Unable to generate preview', life: 3000 });
    } finally {
        previewLoading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-4 md:p-6 lg:p-8">
        <div class="card shadow-sm mb-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 border-b border-surface-200 dark:border-surface-700 pb-3">
                <div>
                    <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 flex items-center gap-3">
                        <i class="pi pi-qrcode text-primary-500 text-2xl"></i>
                        Print Product Barcodes
                    </h2>
                    <p class="text-surface-500 dark:text-surface-400">
                        Search products, customize label fields, and generate printable barcode sheets.
                    </p>
                </div>
                <div class="flex gap-2">
                    <Button label="Preview & Print" icon="pi pi-print" :loading="previewLoading" :disabled="previewDisabled" @click="previewLabels" />
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div class="lg:col-span-2 space-y-4">
                    <div class="field">
                        <label class="block font-semibold mb-1 text-surface-600 dark:text-surface-200">Search & Add Products</label>
                        <AutoComplete
                            v-model="selectedSuggestion"
                            :suggestions="suggestions"
                            optionLabel="label"
                            placeholder="Type product code or name..."
                            forceSelection
                            class="w-full"
                            :loading="initLoading"
                            @completeMethod="searchProducts"
                            @itemSelect="onProductSelect"
                        />
                        <small class="text-surface-500 block mt-1">Start typing to search products by code or name. Select a result to add it to the label list.</small>
                    </div>

                    <div class="field">
                        <label class="block font-semibold mb-1 text-surface-600 dark:text-surface-200">Selected Barcode Layout</label>
                        <Dropdown
                            v-model="barcodeSettingId"
                            :options="barcodeSettings"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Choose barcode layout"
                            class="w-full"
                            :loading="initLoading"
                        />
                    </div>

                    <div v-if="selectedProducts.length" class="overflow-x-auto">
                        <DataTable :value="selectedProducts" responsiveLayout="scroll">
                            <Column header="#" style="width: 40px">
                                <template #body="{ index }">
                                    <span>{{ index + 1 }}</span>
                                </template>
                            </Column>

                            <Column field="name" header="Product">
                                <template #body="{ data }">
                                    <div class="font-semibold text-surface-800 dark:text-surface-100">{{ data.name }}</div>
                                    <div class="text-sm text-surface-500">{{ data.brand_name || '—' }}</div>
                                </template>
                            </Column>

                            <Column header="Code">
                                <template #body="{ data }">
                                    <div class="text-surface-700 dark:text-surface-200 font-medium">{{ data.code }}</div>
                                    <div class="text-xs text-surface-500">Alt: {{ data.alt_code || '—' }}</div>
                                </template>
                            </Column>

                            <Column header="Quantity">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.quantity" :min="1" :max="500" showButtons class="w-20" />
                                </template>
                            </Column>

                            <Column header="Price">
                                <template #body="{ data }">
                                    <div>
                                        <Dropdown
                                            v-if="data.has_different_price && data.warehouse_prices?.length"
                                            v-model="data.selected_price"
                                            :options="data.warehouse_prices"
                                            optionLabel="warehouse_name"
                                            optionValue="price"
                                            class="w-full"
                                            :placeholder="formatCurrency(data.price)"
                                        />
                                        <div v-else class="font-semibold text-surface-700 dark:text-surface-200">
                                            {{ formatCurrency(data.price) }}
                                        </div>
                                    </div>
                                </template>
                            </Column>

                            <Column header="Promo Price">
                                <template #body="{ data }">
                                    <div class="text-surface-700 dark:text-surface-200">
                                        {{ data.promotion_price ? formatCurrency(data.promotion_price) : '—' }}
                                    </div>
                                </template>
                            </Column>

                            <Column header="Actions" style="width: 120px">
                                <template #body="{ index }">
                                    <Button icon="pi pi-trash" severity="danger" text rounded @click="removeProduct(index)" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                    <div v-else class="p-6 text-center border border-dashed border-surface-300 dark:border-surface-700 rounded-lg text-surface-500">
                        No products selected yet. Use the search above to add products to your label list.
                    </div>
                </div>

                <div class="space-y-5">
                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                        <h4 class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-3">Label Fields</h4>

                        <div class="space-y-4">
                            <div v-for="(option, key) in labelOptions" :key="key" class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <Checkbox v-model="option.enabled" :binary="true" />
                                    <span class="font-medium text-surface-600 dark:text-surface-200 capitalize">{{ key.replace('_', ' ') }}</span>
                                </div>
                                <InputNumber v-model="option.size" :min="8" :max="32" class="w-16" />
                            </div>
                        </div>
                    </div>

                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4 bg-surface-100 dark:bg-surface-800">
                        <h4 class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-3">Tips</h4>
                        <ul class="list-disc list-inside text-sm text-surface-600 dark:text-surface-300 space-y-2">
                            <li>Adjust font sizes to fit longer product names.</li>
                            <li>Use "Promo Price" to highlight special offers on labels.</li>
                            <li>Choose a barcode layout that matches your sticker paper size.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.card {
    background: var(--surface-card);
    border-radius: 1.25rem;
    border: 1px solid var(--surface-border);
    padding: 1.5rem;
}
</style>
