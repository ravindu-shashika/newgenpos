<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { useRoute, useRouter } from 'vue-router';
import { computed, onMounted, reactive, ref, watch } from 'vue';

const toast = useToast();
const router = useRouter();
const route = useRoute();

const isEdit = computed(() => Boolean(route.params.id));
const stockCountId = computed(() => (route.query.stockCountId ? String(route.query.stockCountId) : null));

const loading = ref(false);
const saving = ref(false);
const skipWarehouseWatcher = ref(false);

const warehouses = ref([]);
const products = ref([]);
const productSuggestions = ref([]);
const selectedProduct = ref(null);

const existingDocument = ref(null);

const form = reactive({
    warehouse_id: null,
    note: '',
    items: [],
    document: null
});

const actionOptions = [
    { label: 'Add to stock (+)', value: '+' },
    { label: 'Subtract from stock (-)', value: '-' }
];

const totalQty = computed(() =>
    form.items.reduce((sum, item) => sum + Number(item.qty || 0), 0)
);

const submitLabel = computed(() =>
    isEdit.value ? 'Update Adjustment' : 'Create Adjustment'
);

onMounted(async () => {
    await fetchFormData();

    if (isEdit.value) {
        await loadAdjustment();
    } else if (stockCountId.value) {
        await prefillFromStockCount(stockCountId.value);
    }
});

watch(
    () => form.warehouse_id,
    async (newVal, oldVal) => {
        if (!newVal) {
            products.value = [];
            form.items = [];
            return;
        }

        if (skipWarehouseWatcher.value) {
            skipWarehouseWatcher.value = false;
            await fetchWarehouseProducts(newVal);
            return;
        }

        await fetchWarehouseProducts(newVal);
        form.items = [];
    }
);

async function fetchFormData() {
    try {
        const response = await api.get('adjustments/form-data');
        if (response.data?.warehouses) {
            warehouses.value = response.data.warehouses.map((warehouse) => ({
                label: warehouse.name,
                value: String(warehouse.id)
            }));
        }
    } catch (error) {
        console.error('Failed to load adjustment form data', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load warehouses.',
            life: 3000
        });
    }
}

async function fetchWarehouseProducts(warehouseId) {
    if (!warehouseId) return;

    loading.value = true;
    try {
        const response = await api.get(`adjustments/warehouses/${warehouseId}/products`);
        if (response.data?.products) {
            products.value = response.data.products.map((product) => ({
                ...product,
                label: `${product.code} (${product.name})`
            }));
        } else {
            products.value = [];
        }
    } catch (error) {
        console.error('Failed to load warehouse products', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load products for the selected warehouse.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

async function loadAdjustment() {
    loading.value = true;
    try {
        const response = await api.get(`adjustments/${route.params.id}`);
        if (!response.data?.data) {
            throw new Error('Adjustment not found');
        }

        const data = response.data.data;
        skipWarehouseWatcher.value = true;
        form.warehouse_id = String(data.warehouse?.id || '');
        form.note = data.note || '';
        existingDocument.value = data.document;

        await fetchWarehouseProducts(form.warehouse_id);

        form.items = (data.items || []).map((item) => ({
            id: item.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_code: item.product_code,
            name: item.product_name,
            code: item.product_code,
            qty: Number(item.qty || 0),
            unit_cost: Number(item.unit_cost || 0),
            available_qty: Number(item.available_qty || 0),
            action: item.action || '+'
        }));
    } catch (error) {
        console.error('Failed to load adjustment', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load adjustment details.',
            life: 3000
        });
        router.push('/inventory/adjustments');
    } finally {
        loading.value = false;
    }
}

async function prefillFromStockCount(id) {
    try {
        const response = await api.get(`stock-counts/${id}/adjustment-data`);
        const data = response.data;

        if (!data || !data.items || !data.items.length) {
            toast.add({
                severity: 'info',
                summary: 'No Differences',
                detail: 'No stock differences detected for this stock count.',
                life: 2500
            });
            return;
        }

        skipWarehouseWatcher.value = true;
        form.warehouse_id = String(data.warehouse_id);

        form.items = data.items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_code: item.code,
            name: item.name,
            code: item.code,
            qty: Number(item.qty || 0),
            unit_cost: Number(item.unit_cost || 0),
            available_qty: Number(item.available_qty || 0),
            action: item.action || '+'
        }));

        toast.add({
            severity: 'success',
            summary: 'Prefilled',
            detail: 'Adjustment lines loaded from stock count differences.',
            life: 3000
        });
    } catch (error) {
        console.error('Failed to prefill adjustment from stock count', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Unable to prefill adjustment from stock count.',
            life: 3000
        });
    }
}

function searchProducts(event) {
    const query = (event.query || '').toLowerCase();
    if (!products.value.length) {
        productSuggestions.value = [];
        return;
    }

    productSuggestions.value = products.value.filter((product) =>
        product.label.toLowerCase().includes(query)
    );
}

function onProductSelect(event) {
    const product = event.value;
    if (!product) return;

    const existing = form.items.find(
        (item) =>
            item.product_id === product.product_id &&
            item.variant_id === product.variant_id
    );

    if (existing) {
        existing.qty = Number(existing.qty || 0) + 1;
    } else {
        form.items.push({
            product_id: product.product_id,
            variant_id: product.variant_id,
            product_code: product.code,
            name: product.name,
            code: product.code,
            qty: 1,
            unit_cost: Number(product.unit_cost || 0),
            available_qty: Number(product.qty || 0),
            action: '+'
        });
    }

    selectedProduct.value = null;
}

function removeItem(index) {
    form.items.splice(index, 1);
}

function handleDocumentChange(event) {
    const [file] = event.target.files || [];
    form.document = file || null;
}

function updateItemQty(item, value) {
    item.qty = Number(value || 0);
}

function updateItemCost(item, value) {
    item.unit_cost = Number(value || 0);
}

function updateItemAction(item, value) {
    item.action = value || '+';
}

async function submitForm() {
    if (!form.warehouse_id) {
        toast.add({
            severity: 'warn',
            summary: 'Validation',
            detail: 'Please select a warehouse.',
            life: 2500
        });
        return;
    }

    if (!form.items.length) {
        toast.add({
            severity: 'warn',
            summary: 'Validation',
            detail: 'Add at least one product to adjust.',
            life: 2500
        });
        return;
    }

    const hasInvalidQty = form.items.some((item) => Number(item.qty) <= 0);
    if (hasInvalidQty) {
        toast.add({
            severity: 'warn',
            summary: 'Validation',
            detail: 'Quantities must be greater than zero.',
            life: 2500
        });
        return;
    }

    saving.value = true;
    try {
        const formData = new FormData();
        formData.append('warehouse_id', form.warehouse_id);
        if (form.note) {
            formData.append('note', form.note);
        }
        if (form.document) {
            formData.append('document', form.document);
        }

        form.items.forEach((item, index) => {
            formData.append(`items[${index}][product_id]`, item.product_id);
            formData.append(`items[${index}][variant_id]`, item.variant_id ?? '');
            formData.append(`items[${index}][product_code]`, item.product_code || '');
            formData.append(`items[${index}][qty]`, item.qty);
            formData.append(`items[${index}][unit_cost]`, item.unit_cost ?? 0);
            formData.append(`items[${index}][action]`, item.action || '+');
        });

        if (isEdit.value) {
            await api.post(`adjustments/${route.params.id}`, formData);
            toast.add({
                severity: 'success',
                summary: 'Updated',
                detail: 'Adjustment updated successfully.',
                life: 2500
            });
        } else {
            await api.post('adjustments', formData);
            toast.add({
                severity: 'success',
                summary: 'Created',
                detail: 'Adjustment created successfully.',
                life: 2500
            });
        }

        router.push('/inventory/adjustments');
    } catch (error) {
        const message = error.response?.data?.message || 'Unable to save adjustment.';
        console.error('Failed to save adjustment', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
            life: 3000
        });
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-4 md:p-6 lg:p-8">
        <div class="card shadow-sm max-w-5xl mx-auto">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                    <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 flex items-center gap-3">
                        <i class="pi pi-sync text-primary-500 text-2xl"></i>
                        {{ isEdit ? 'Edit Adjustment' : 'New Adjustment' }}
                    </h2>
                    <p class="text-surface-500 dark:text-surface-400">
                        {{ isEdit ? 'Update the stock adjustment details.' : 'Create a new stock adjustment entry.' }}
                    </p>
                </div>
                <Button label="Back to Adjustments" icon="pi pi-arrow-left" severity="secondary" outlined @click="router.back" />
            </div>

            <div v-if="loading" class="py-10 text-center">
                <ProgressSpinner />
            </div>

            <form v-else @submit.prevent="submitForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="label">Warehouse *</label>
                        <Dropdown
                            v-model="form.warehouse_id"
                            :options="warehouses"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select warehouse"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label class="label">Attach Document</label>
                        <input type="file" class="p-inputtext w-full" accept=".jpg,.jpeg,.png,.gif,.pdf,.csv,.docx,.xlsx,.txt" @change="handleDocumentChange" />
                        <small v-if="existingDocument && !form.document" class="text-surface-500">
                            Current: {{ existingDocument }}
                        </small>
                    </div>
                </div>

                <div>
                    <label class="label">Select Product</label>
                    <AutoComplete
                        v-model="selectedProduct"
                        :suggestions="productSuggestions"
                        :disabled="!form.warehouse_id || loading"
                        optionLabel="label"
                        placeholder="Type product code or name"
                        class="w-full"
                        @complete="searchProducts"
                        @item-select="onProductSelect"
                    />
                    <small class="text-surface-500">Products are filtered by the selected warehouse.</small>
                </div>

                <div class="table-wrapper">
                    <table class="w-full border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                        <thead class="bg-surface-100 dark:bg-surface-800">
                            <tr>
                                <th class="py-3 px-4 text-left text-sm font-semibold text-surface-600 dark:text-surface-200">Product</th>
                                <th class="py-3 px-4 text-left text-sm font-semibold text-surface-600 dark:text-surface-200">Unit Cost</th>
                                <th class="py-3 px-4 text-left text-sm font-semibold text-surface-600 dark:text-surface-200">Quantity</th>
                                <th class="py-3 px-4 text-left text-sm font-semibold text-surface-600 dark:text-surface-200">Action</th>
                                <th class="py-3 px-4 text-left text-sm font-semibold text-surface-600 dark:text-surface-200">Available</th>
                                <th class="py-3 px-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in form.items" :key="`${item.product_id}-${item.variant_id ?? 'default'}`" class="border-t border-surface-200 dark:border-surface-700">
                                <td class="py-3 px-4">
                                    <div class="flex flex-col">
                                        <span class="font-semibold text-surface-800 dark:text-surface-100">{{ item.name }}</span>
                                        <small class="text-surface-500">{{ item.code }}</small>
                                    </div>
                                </td>
                                <td class="py-3 px-4">
                                    <InputNumber
                                        v-model="item.unit_cost"
                                        :min="0"
                                        mode="decimal"
                                        :useGrouping="false"
                                        :step="0.1"
                                        @input="updateItemCost(item, $event.value)"
                                    />
                                </td>
                                <td class="py-3 px-4">
                                    <InputNumber
                                        v-model="item.qty"
                                        mode="decimal"
                                        :min="0"
                                        :useGrouping="false"
                                        :step="1"
                                        @input="updateItemQty(item, $event.value)"
                                    />
                                </td>
                                <td class="py-3 px-4">
                                    <Dropdown
                                        v-model="item.action"
                                        :options="actionOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        class="w-full"
                                        @change="updateItemAction(item, $event.value)"
                                    />
                                </td>
                                <td class="py-3 px-4 text-sm text-surface-500">
                                    {{ Number(item.available_qty || 0).toFixed(2) }}
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <Button icon="pi pi-times" severity="danger" outlined rounded size="small" @click="removeItem(index)" />
                                </td>
                            </tr>
                            <tr v-if="!form.items.length">
                                <td colspan="6" class="py-6 text-center text-surface-500">
                                    No products added yet. Use the search above to add products.
                                </td>
                            </tr>
                        </tbody>
                        <tfoot v-if="form.items.length" class="bg-surface-100 dark:bg-surface-800">
                            <tr>
                                <td class="py-3 px-4 text-sm font-semibold">Totals</td>
                                <td></td>
                                <td class="py-3 px-4 text-sm font-semibold">{{ Number(totalQty).toFixed(2) }}</td>
                                <td colspan="3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div>
                    <label class="label">Note</label>
                    <Textarea v-model="form.note" rows="4" class="w-full" autoResize placeholder="Additional information..." />
                </div>

                <div class="flex justify-end gap-2">
                    <Button label="Cancel" type="button" severity="secondary" outlined @click="router.back" />
                    <Button :label="submitLabel" type="submit" :loading="saving" />
                </div>
            </form>
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

.label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    color: var(--surface-500);
}

.table-wrapper {
    overflow-x: auto;
}
</style>
