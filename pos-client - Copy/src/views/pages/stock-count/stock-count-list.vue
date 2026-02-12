<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { format } from 'date-fns';
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();

const loading = ref(false);
const stockCounts = ref([]);

const meta = reactive({
    page: 1,
    perPage: 15,
    total: 0,
    lastPage: 1
});

const filters = reactive({
    warehouseId: 'all',
    search: ''
});

const selection = ref([]);

const warehouses = ref([]);
const categories = ref([]);
const brands = ref([]);

const createDialogVisible = ref(false);
const finalizeDialogVisible = ref(false);
const reportDialogVisible = ref(false);

const createForm = reactive({
    warehouse_id: null,
    category_ids: [],
    brand_ids: []
});

const finalizeForm = reactive({
    stock_count_id: null,
    note: '',
    final_file: null
});

const reportData = reactive({
    headers: null,
    rows: [],
    is_adjusted: false
});

const reportLoading = ref(false);
let searchDebounceHandle = null;

onMounted(async () => {
    await fetchOptions();
    await fetchStockCounts();
});

watch(
    () => filters.warehouseId,
    async () => {
        await fetchStockCounts(1);
    }
);

watch(
    () => filters.search,
    (value) => {
        if (searchDebounceHandle) clearTimeout(searchDebounceHandle);
        searchDebounceHandle = setTimeout(() => {
            fetchStockCounts(1);
        }, 400);
    }
);

async function fetchOptions() {
    try {
        const response = await api.get('stock-counts/options');
        if (response.data) {
            warehouses.value = [
                { label: 'All Warehouses', value: 'all' },
                ...(response.data.warehouses || []).map((warehouse) => ({
                    label: warehouse.name,
                    value: String(warehouse.id)
                }))
            ];
            categories.value = (response.data.categories || []).map((category) => ({
                label: category.name,
                value: category.id
            }));
            brands.value = (response.data.brands || []).map((brand) => ({
                label: brand.title,
                value: brand.id
            }));
        }
    } catch (error) {
        console.error('Failed to fetch stock count options', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load stock count options.',
            life: 3000
        });
    }
}

async function fetchStockCounts(page = 1) {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(meta.perPage));

        if (filters.search) params.set('search', filters.search);
        if (filters.warehouseId !== 'all') params.set('warehouse_id', filters.warehouseId);
        const response = await api.get(`stock-counts?${params.toString()}`);
        if (response.data) {
            stockCounts.value = response.data.data || [];
            meta.page = response.data.meta?.current_page || page;
            meta.perPage = response.data.meta?.per_page || meta.perPage;
            meta.total = response.data.meta?.total || 0;
            meta.lastPage = response.data.meta?.last_page || 1;
        }
    } catch (error) {
        console.error('Failed to load stock counts', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load stock counts.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

function onPage(event) {
    meta.perPage = event.rows;
    fetchStockCounts(event.page + 1);
}

function openCreateDialog() {
    createForm.warehouse_id = null;
    createForm.category_ids = [];
    createForm.brand_ids = [];
    createDialogVisible.value = true;
}

async function submitCreate() {
    if (!createForm.warehouse_id) {
        toast.add({
            severity: 'warn',
            summary: 'Validation',
            detail: 'Please select a warehouse.',
            life: 2500
        });
        return;
    }

    try {
        const payload = {
            warehouse_id: createForm.warehouse_id,
            category_ids: createForm.category_ids,
            brand_ids: createForm.brand_ids
        };
        const response = await api.post('stock-counts', payload);
        toast.add({
            severity: 'success',
            summary: 'Created',
            detail: response.data?.message || 'Stock count created successfully.',
            life: 3000
        });
        createDialogVisible.value = false;
        await fetchStockCounts(meta.page);
        if (response.data?.initial_file_url) {
            window.open(response.data.initial_file_url, '_blank');
        }
    } catch (error) {
        console.error('Failed to create stock count', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Unable to create stock count.',
            life: 3000
        });
    }
}

function openFinalizeDialog(stockCount) {
    finalizeForm.stock_count_id = stockCount.id;
    finalizeForm.note = '';
    finalizeForm.final_file = null;
    finalizeDialogVisible.value = true;
}

function handleFinalizeFileChange(event) {
    const [file] = event.target.files || [];
    finalizeForm.final_file = file || null;
}

async function submitFinalize() {
    if (!finalizeForm.final_file) {
        toast.add({
            severity: 'warn',
            summary: 'Validation',
            detail: 'Please select a CSV file to upload.',
            life: 2500
        });
        return;
    }

    try {
        const formData = new FormData();
        formData.append('final_file', finalizeForm.final_file);
        if (finalizeForm.note) {
            formData.append('note', finalizeForm.note);
        }

        await api.post(`stock-counts/${finalizeForm.stock_count_id}/finalize`, formData);
        toast.add({
            severity: 'success',
            summary: 'Finalized',
            detail: 'Stock count finalized successfully.',
            life: 3000
        });
        finalizeDialogVisible.value = false;
        await fetchStockCounts(meta.page);
    } catch (error) {
        console.error('Failed to finalize stock count', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Unable to finalize stock count.',
            life: 3000
        });
    }
}

async function openReport(stockCount) {
    reportDialogVisible.value = true;
    reportLoading.value = true;
    reportData.headers = null;
    reportData.rows = [];
    reportData.is_adjusted = false;

    try {
        const response = await api.get(`stock-counts/${stockCount.id}/difference`);
        if (response.data?.data) {
            reportData.headers = response.data.data.headers;
            reportData.rows = response.data.data.rows || [];
            reportData.is_adjusted = !!response.data.data.is_adjusted;
        }
    } catch (error) {
        console.error('Failed to load stock count difference', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Unable to load stock count report.',
            life: 3000
        });
        reportDialogVisible.value = false;
    } finally {
        reportLoading.value = false;
    }
}

function downloadFile(url) {
    if (!url) return;
    window.open(url, '_blank');
}

function categoriesLabel(stockCount) {
    const names = stockCount.categories || [];
    return names.length ? names.join(', ') : '—';
}

function brandsLabel(stockCount) {
    const names = stockCount.brands || [];
    return names.length ? names.join(', ') : '—';
}

function typeSeverity(type) {
    return type === 'full' ? 'primary' : 'info';
}

function formatDate(value) {
    if (!value) return '';
    return format(new Date(value), 'yyyy-MM-dd HH:mm');
}

async function deleteStockCount(stockCount) {
    const confirmed = window.confirm('Are you sure you want to delete this stock count?');
    if (!confirmed) return;

    try {
        await api.delete(`stock-counts/${stockCount.id}`);
        toast.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Stock count deleted successfully.',
            life: 2500
        });
        await fetchStockCounts(meta.page);
    } catch (error) {
        console.error('Failed to delete stock count', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to delete stock count.',
            life: 3000
        });
    }
}

function navigateToAdjustment() {
    if (!reportData.headers?.stock_count_id) return;
    router.push({
        path: '/inventory/adjustments/create',
        query: { stockCountId: reportData.headers.stock_count_id }
    });
    reportDialogVisible.value = false;
}
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-4 md:p-6 lg:p-8">
        <div class="card shadow-sm mb-4">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                    <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 flex items-center gap-3">
                        <i class="pi pi-clipboard text-primary-500 text-2xl"></i>
                        Stock Counts
                    </h2>
                    <p class="text-surface-500 dark:text-surface-400">
                        Manage stock count sessions, download templates, and review differences.
                    </p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <Button label="Count Stock" icon="pi pi-plus" @click="openCreateDialog" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="filter-label">Warehouse</label>
                    <Dropdown
                        v-model="filters.warehouseId"
                        :options="warehouses"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                </div>
                <div class="md:col-span-2">
                    <label class="filter-label">Search</label>
                    <span class="p-input-icon-left w-full">
                        <i class="pi pi-search" />
                        <InputText v-model="filters.search" class="w-full" placeholder="Search reference or note" />
                    </span>
                </div>
            </div>

            <DataTable
                :value="stockCounts"
                :loading="loading"
                dataKey="id"
                paginator
                lazy
                :rows="meta.perPage"
                :totalRecords="meta.total"
                :rowsPerPageOptions="[10, 15, 25, 50]"
                responsiveLayout="scroll"
                @page="onPage"
                v-model:selection="selection"
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle="width: 3rem" />
                <Column header="Date">
                    <template #body="{ data }">
                        {{ formatDate(data.created_at) }}
                    </template>
                </Column>
                <Column field="reference_no" header="Reference" />
                <Column header="Warehouse">
                    <template #body="{ data }">
                        {{ data.warehouse?.name || '—' }}
                    </template>
                </Column>
                <Column header="Categories">
                    <template #body="{ data }">
                        {{ categoriesLabel(data) }}
                    </template>
                </Column>
                <Column header="Brands">
                    <template #body="{ data }">
                        {{ brandsLabel(data) }}
                    </template>
                </Column>
                <Column header="Type">
                    <template #body="{ data }">
                        <Tag :value="data.type === 'full' ? 'Full' : 'Partial'" :severity="typeSeverity(data.type)" />
                    </template>
                </Column>
                <Column header="Initial File" style="width: 120px">
                    <template #body="{ data }">
                        <Button
                            v-if="data.initial_file_url"
                            icon="pi pi-download"
                            text
                            size="small"
                            @click="downloadFile(data.initial_file_url)"
                        />
                        <span v-else>—</span>
                    </template>
                </Column>
                <Column header="Final File" style="width: 120px">
                    <template #body="{ data }">
                        <Button
                            v-if="data.final_file_url"
                            icon="pi pi-download"
                            text
                            size="small"
                            severity="info"
                            @click="downloadFile(data.final_file_url)"
                        />
                        <span v-else>—</span>
                    </template>
                </Column>
                <Column header="Actions" style="width: 220px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button
                                v-if="data.final_file_url"
                                icon="pi pi-chart-bar"
                                label="Final Report"
                                size="small"
                                outlined
                                @click="openReport(data)"
                            />
                            <Button
                                v-else
                                icon="pi pi-upload"
                                label="Finalize"
                                size="small"
                                severity="success"
                                outlined
                                @click="openFinalizeDialog(data)"
                            />
                            <Button icon="pi pi-trash" size="small" severity="danger" outlined @click="deleteStockCount(data)" />
                        </div>
                    </template>
                </Column>
                <template #empty>
                    <div class="py-6 text-center text-surface-500">
                        No stock count sessions found. Start a new count to populate this list.
                    </div>
                </template>
            </DataTable>
        </div>

        <!-- Create Dialog -->
        <Dialog v-model:visible="createDialogVisible" header="Count Stock" :style="{ width: '35rem' }" modal>
            <div class="grid grid-cols-1 gap-4">
                <div>
                    <label class="field-label">Warehouse *</label>
                    <Dropdown
                        v-model="createForm.warehouse_id"
                        :options="warehouses.filter((option) => option.value !== 'all')"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select warehouse"
                        class="w-full"
                    />
                </div>
                <div>
                    <label class="field-label">Categories</label>
                    <MultiSelect
                        v-model="createForm.category_ids"
                        :options="categories"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select categories"
                        display="chip"
                        class="w-full"
                    />
                </div>
                <div>
                    <label class="field-label">Brands</label>
                    <MultiSelect
                        v-model="createForm.brand_ids"
                        :options="brands"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select brands"
                        display="chip"
                        class="w-full"
                    />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="createDialogVisible = false" />
                <Button label="Create" icon="pi pi-check" @click="submitCreate" />
            </template>
        </Dialog>

        <!-- Finalize Dialog -->
        <Dialog v-model:visible="finalizeDialogVisible" header="Finalize Stock Count" :style="{ width: '32rem' }" modal>
            <div class="space-y-4">
                <div>
                    <label class="field-label">Upload File (CSV) *</label>
                    <input
                        type="file"
                        accept=".csv"
                        class="p-inputtext w-full"
                        @change="handleFinalizeFileChange"
                    />
                </div>
                <div>
                    <label class="field-label">Note</label>
                    <Textarea v-model="finalizeForm.note" rows="3" autoResize class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="finalizeDialogVisible = false" />
                <Button label="Finalize" icon="pi pi-upload" @click="submitFinalize" />
            </template>
        </Dialog>

        <!-- Report Dialog -->
        <Dialog v-model:visible="reportDialogVisible" header="Stock Count Report" :style="{ width: '70vw' }" modal>
            <div v-if="reportLoading" class="py-10 text-center">
                <ProgressSpinner />
            </div>
            <div v-else-if="reportData.headers">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm text-surface-700 dark:text-surface-200">
                    <div><strong>Date:</strong> {{ formatDate(reportData.headers.date) }}</div>
                    <div><strong>Reference:</strong> {{ reportData.headers.reference_no }}</div>
                    <div><strong>Warehouse:</strong> {{ reportData.headers.warehouse_name }}</div>
                    <div><strong>Type:</strong> {{ reportData.headers.type === 'full' ? 'Full' : 'Partial' }}</div>
                    <div v-if="reportData.headers.categories?.length">
                        <strong>Categories:</strong> {{ reportData.headers.categories.join(', ') }}
                    </div>
                    <div v-if="reportData.headers.brands?.length">
                        <strong>Brands:</strong> {{ reportData.headers.brands.join(', ') }}
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <Button
                            v-if="reportData.headers.initial_file_url"
                            label="Initial File"
                            size="small"
                            icon="pi pi-download"
                            outlined
                            @click="downloadFile(reportData.headers.initial_file_url)"
                        />
                        <Button
                            v-if="reportData.headers.final_file_url"
                            label="Final File"
                            size="small"
                            icon="pi pi-download"
                            outlined
                            severity="info"
                            @click="downloadFile(reportData.headers.final_file_url)"
                        />
                    </div>
                </div>

                <DataTable :value="reportData.rows" responsiveLayout="scroll">
                    <Column header="#" style="width: 60px">
                        <template #body="{ index }">{{ index + 1 }}</template>
                    </Column>
                    <Column field="name" header="Product" />
                    <Column field="expected" header="Expected">
                        <template #body="{ data }">{{ Number(data.expected || 0).toFixed(2) }}</template>
                    </Column>
                    <Column field="counted" header="Counted">
                        <template #body="{ data }">{{ Number(data.counted || 0).toFixed(2) }}</template>
                    </Column>
                    <Column field="difference" header="Difference">
                        <template #body="{ data }">{{ Number(data.difference || 0).toFixed(2) }}</template>
                    </Column>
                    <Column field="cost" header="Cost Impact">
                        <template #body="{ data }">{{ Number(data.cost || 0).toFixed(2) }}</template>
                    </Column>
                </DataTable>

                <div class="flex justify-end gap-2 mt-4">
                    <Button
                        v-if="!reportData.is_adjusted && reportData.rows.some((row) => Math.abs(Number(row.difference || 0)) > 0)"
                        label="Add Adjustment"
                        icon="pi pi-plus"
                        severity="warning"
                        @click="navigateToAdjustment"
                    />
                    <Button label="Close" icon="pi pi-times" text @click="reportDialogVisible = false" />
                </div>
            </div>
            <div v-else class="py-6 text-center text-surface-500">
                Report data unavailable.
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.card {
    background: var(--surface-card);
    border-radius: 1.25rem;
    border: 1px solid var(--surface-border);
    padding: 1.5rem;
}

.filter-label,
.field-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.45rem;
    color: var(--surface-500);
}
</style>
