<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { format, subYears } from 'date-fns';

const toast = useToast();
const route = useRoute();

const productQueryId = route.query.product ? Number(route.query.product) : null;

const productSuggestion = ref(null);
const productInput = ref('');
const productSuggestions = ref([]);
const selectedProduct = ref(null);

const dateRange = ref([subYears(new Date(), 1), new Date()]);
const warehouseId = ref('0');
const warehouses = ref([{ label: 'All Warehouses', value: '0' }]);

const loading = ref(false);
const activeIndex = ref(0);

const historyData = reactive({
    sales: { rows: [], total: 0 },
    purchases: { rows: [], total: 0 },
    saleReturns: { rows: [], total: 0 },
    purchaseReturns: { rows: [], total: 0 },
    adjustments: { rows: [], total: 0 },
    transfers: { rows: [], total: 0 }
});

onMounted(async () => {
    await fetchWarehouses();
    if (productQueryId) {
        await preloadProduct(productQueryId);
    }
});

async function fetchWarehouses() {
    try {
        const res = await api.get('warehouses');
        if (res.data) {
            const mapped = res.data.map((warehouse) => ({
                label: warehouse.name,
                value: String(warehouse.id)
            }));
            warehouses.value = [{ label: 'All Warehouses', value: '0' }, ...mapped];
        }
    } catch (error) {
        console.error('Failed to load warehouses', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Unable to load warehouses', life: 3000 });
    }
}

async function preloadProduct(productId) {
    try {
        const res = await api.get(`product/${productId}`);
        if (res.data?.success) {
            const product = res.data.product;
            selectedProduct.value = {
                product_id: product.id,
                label: `${product.code} (${product.name})`
            };
            productInput.value = selectedProduct.value.label;
            await fetchHistory();
        }
    } catch (error) {
        console.error('Failed to preload product', error);
    }
}

async function searchProducts(event) {
    const query = event.query?.trim();
    if (!query) {
        productSuggestions.value = [];
        return;
    }

    try {
        const res = await api.get(`products/search?query=${encodeURIComponent(query)}&limit=20`);
        productSuggestions.value = res.data?.results || [];
    } catch (error) {
        console.error('Product search failed', error);
    }
}

async function onSelectProduct(event) {
    if (!event.value) return;
    selectedProduct.value = {
        product_id: event.value.product_id,
        label: event.value.label
    };
    productInput.value = event.value.label;
}

async function fetchHistory() {
    if (!selectedProduct.value?.product_id) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Select a product to view history.', life: 3000 });
        return;
    }

    loading.value = true;
    const [startDate, endDate] = dateRange.value || [];
    const payloadBase = {
        product_id: selectedProduct.value.product_id,
        starting_date: format(startDate ?? new Date(), 'yyyy-MM-dd'),
        ending_date: format(endDate ?? new Date(), 'yyyy-MM-dd'),
        warehouse_id: warehouseId.value === '0' ? null : Number(warehouseId.value),
        draw: 1,
        start: 0,
        length: 500,
        order: [{ column: 1, dir: 'desc' }],
        search: { value: '', regex: false }
    };

    try {
        const [
            salesRes,
            purchaseRes,
            saleReturnRes,
            purchaseReturnRes,
            adjustmentRes,
            transferRes
        ] = await Promise.all([
            api.post('products/history/sales', payloadBase),
            api.post('products/history/purchases', payloadBase),
            api.post('products/history/sale-returns', payloadBase),
            api.post('products/history/purchase-returns', payloadBase),
            api.post('products/history/adjustments', payloadBase),
            api.post('products/history/transfers', payloadBase)
        ]);

        historyData.sales.rows = salesRes.data?.data || [];
        historyData.sales.total = salesRes.data?.recordsTotal || 0;

        historyData.purchases.rows = purchaseRes.data?.data || [];
        historyData.purchases.total = purchaseRes.data?.recordsTotal || 0;

        historyData.saleReturns.rows = saleReturnRes.data?.data || [];
        historyData.saleReturns.total = saleReturnRes.data?.recordsTotal || 0;

        historyData.purchaseReturns.rows = purchaseReturnRes.data?.data || [];
        historyData.purchaseReturns.total = purchaseReturnRes.data?.recordsTotal || 0;

        historyData.adjustments.rows = adjustmentRes.data?.data || [];
        historyData.adjustments.total = adjustmentRes.data?.recordsTotal || 0;

        historyData.transfers.rows = transferRes.data?.data || [];
        historyData.transfers.total = transferRes.data?.recordsTotal || 0;
    } catch (error) {
        console.error('Failed to load product history', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Unable to load product history', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

watch(warehouseId, (value, oldValue) => {
    if (selectedProduct.value && value !== oldValue) {
        fetchHistory();
    }
});
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-4 md:p-6 lg:p-8">
        <div class="card shadow-sm mb-4">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div class="md:col-span-2">
                    <label class="label">Product</label>
                    <AutoComplete
                        v-model="productSuggestion"
                        :suggestions="productSuggestions"
                        optionLabel="label"
                        forceSelection
                        :autoHighlight="true"
                        :delay="300"
                        placeholder="Search product code or name"
                        class="w-full"
                        :value="productInput"
                        @completeMethod="searchProducts"
                        @itemSelect="onSelectProduct"
                    />
                    <small v-if="selectedProduct" class="text-surface-500 block mt-1">
                        Selected: {{ selectedProduct.label }}
                    </small>
                </div>

                <div>
                    <label class="label">Date Range</label>
                    <Calendar v-model="dateRange" selectionMode="range" :manualInput="false" class="w-full" dateFormat="yy-mm-dd" />
                </div>

                <div>
                    <label class="label">Warehouse</label>
                    <Dropdown v-model="warehouseId" :options="warehouses" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <div class="flex items-end">
                    <Button label="Load History" icon="pi pi-history" class="w-full" :loading="loading" @click="fetchHistory" />
                </div>
            </div>
        </div>

        <div class="card shadow-sm">
            <TabView v-model:activeIndex="activeIndex">
                <TabPanel header="Sales">
                    <DataTable :value="historyData.sales.rows" :loading="loading" responsiveLayout="scroll" class="history-table">
                        <Column field="date" header="Date" />
                        <Column field="reference_no" header="Reference" />
                        <Column field="warehouse" header="Warehouse" />
                        <Column field="customer" header="Customer" />
                        <Column field="qty" header="Quantity" />
                        <Column field="unit_price" header="Unit Price" />
                        <Column field="sub_total" header="Subtotal" />
                    </DataTable>
                </TabPanel>

                <TabPanel header="Purchases">
                    <DataTable :value="historyData.purchases.rows" :loading="loading" responsiveLayout="scroll">
                        <Column field="date" header="Date" />
                        <Column field="reference_no" header="Reference" />
                        <Column field="warehouse" header="Warehouse" />
                        <Column field="supplier" header="Supplier" />
                        <Column field="qty" header="Quantity" />
                        <Column field="unit_cost" header="Unit Cost" />
                        <Column field="sub_total" header="Subtotal" />
                    </DataTable>
                </TabPanel>

                <TabPanel header="Sale Returns">
                    <DataTable :value="historyData.saleReturns.rows" :loading="loading" responsiveLayout="scroll">
                        <Column field="date" header="Date" />
                        <Column field="reference_no" header="Reference" />
                        <Column field="warehouse" header="Warehouse" />
                        <Column field="customer" header="Customer" />
                        <Column field="qty" header="Quantity" />
                        <Column field="unit_price" header="Unit Price" />
                        <Column field="sub_total" header="Subtotal" />
                    </DataTable>
                </TabPanel>

                <TabPanel header="Purchase Returns">
                    <DataTable :value="historyData.purchaseReturns.rows" :loading="loading" responsiveLayout="scroll">
                        <Column field="date" header="Date" />
                        <Column field="reference_no" header="Reference" />
                        <Column field="warehouse" header="Warehouse" />
                        <Column field="supplier" header="Supplier" />
                        <Column field="qty" header="Quantity" />
                        <Column field="unit_cost" header="Unit Cost" />
                        <Column field="sub_total" header="Subtotal" />
                    </DataTable>
                </TabPanel>

                <TabPanel header="Adjustments">
                    <DataTable :value="historyData.adjustments.rows" :loading="loading" responsiveLayout="scroll">
                        <Column field="date" header="Date" />
                        <Column field="reference_no" header="Reference" />
                        <Column field="warehouse" header="Warehouse" />
                        <Column field="qty" header="Quantity" />
                        <Column field="note" header="Note" />
                    </DataTable>
                </TabPanel>

                <TabPanel header="Transfers">
                    <DataTable :value="historyData.transfers.rows" :loading="loading" responsiveLayout="scroll">
                        <Column field="date" header="Date" />
                        <Column field="reference_no" header="Reference" />
                        <Column field="from_warehouse" header="From" />
                        <Column field="to_warehouse" header="To" />
                        <Column field="qty" header="Quantity" />
                    </DataTable>
                </TabPanel>
            </TabView>
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
    font-weight: 600;
    margin-bottom: 0.4rem;
    color: var(--surface-600);
}

.history-table :deep(.p-datatable-thead > tr > th) {
    white-space: nowrap;
}
</style>
