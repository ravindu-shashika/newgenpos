<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { onMounted, reactive, ref, watch } from 'vue';
import { format, subMonths } from 'date-fns';

const toast = useToast();
const router = useRouter();

const loading = ref(false);
const detailLoading = ref(false);

const adjustments = ref([]);
const selection = ref([]);

const warehouses = ref([{ label: 'All Warehouses', value: 'all' }]);

const filters = reactive({
    search: '',
    warehouseId: 'all',
    dateRange: [subMonths(new Date(), 1), new Date()]
});

const meta = reactive({
    page: 1,
    perPage: 15,
    total: 0,
    lastPage: 1
});

const detailDialog = ref(false);
const detailData = ref(null);

let searchDebounceHandle = null;

onMounted(async () => {
    await fetchFormData();
    await fetchAdjustments();
});

watch(
    () => filters.warehouseId,
    async () => {
        await fetchAdjustments(1);
    }
);

watch(
    () => [...filters.dateRange],
    async () => {
        await fetchAdjustments(1);
    }
);

watch(
    () => filters.search,
    (value) => {
        if (searchDebounceHandle) {
            clearTimeout(searchDebounceHandle);
        }
        searchDebounceHandle = setTimeout(() => {
            fetchAdjustments(1);
        }, 400);
    }
);

async function fetchFormData() {
    try {
        const response = await api.get('adjustments/form-data');
        if (response.data?.warehouses) {
            warehouses.value = [
                { label: 'All Warehouses', value: 'all' },
                ...response.data.warehouses.map((warehouse) => ({
                    label: warehouse.name,
                    value: String(warehouse.id)
                }))
            ];
        }
    } catch (error) {
        console.error('Failed to load adjustment form data', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load adjustment metadata.',
            life: 3000
        });
    }
}

async function fetchAdjustments(page = 1) {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(meta.perPage));

        if (filters.search) {
            params.set('search', filters.search);
        }

        if (filters.warehouseId !== 'all') {
            params.set('warehouse_id', filters.warehouseId);
        }

        if (filters.dateRange?.[0]) {
            params.set('date_from', format(filters.dateRange[0], 'yyyy-MM-dd'));
        }
        if (filters.dateRange?.[1]) {
            params.set('date_to', format(filters.dateRange[1], 'yyyy-MM-dd'));
        }

        const response = await api.get(`adjustments?${params.toString()}`);
        if (response.data) {
            adjustments.value = response.data.data || [];
            meta.page = response.data.meta?.current_page || page;
            meta.perPage = response.data.meta?.per_page || meta.perPage;
            meta.total = response.data.meta?.total || 0;
            meta.lastPage = response.data.meta?.last_page || 1;
        }
    } catch (error) {
        console.error('Failed to load adjustments', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load adjustments. Please try again.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

function formatDate(value) {
    if (!value) return '';
    return format(new Date(value), 'yyyy-MM-dd HH:mm');
}

function onPage(event) {
    meta.perPage = event.rows;
    fetchAdjustments(event.page + 1);
}

async function viewDetails(adjustment) {
    detailDialog.value = true;
    detailLoading.value = true;
    try {
        const response = await api.get(`adjustments/${adjustment.id}`);
        if (response.data?.data) {
            detailData.value = response.data.data;
        }
    } catch (error) {
        console.error('Failed to load adjustment details', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load adjustment details.',
            life: 3000
        });
        detailDialog.value = false;
    } finally {
        detailLoading.value = false;
    }
}

async function deleteAdjustment(adjustment) {
    const confirmed = window.confirm('Are you sure you want to delete this adjustment?');
    if (!confirmed) {
        return;
    }

    try {
        await api.delete(`adjustments/${adjustment.id}`);
        toast.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Adjustment deleted successfully.',
            life: 2500
        });
        await fetchAdjustments(meta.page);
    } catch (error) {
        console.error('Failed to delete adjustment', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to delete adjustment.',
            life: 3000
        });
    }
}

async function deleteSelected() {
    if (!selection.value.length) {
        toast.add({
            severity: 'warn',
            summary: 'No selection',
            detail: 'Select at least one adjustment to delete.',
            life: 2500
        });
        return;
    }

    const confirmed = window.confirm('Are you sure you want to delete the selected adjustments?');
    if (!confirmed) {
        return;
    }

    try {
        const payload = {
            ids: selection.value.map((item) => item.id)
        };
        await api.post('adjustments/bulk-delete', payload);
        toast.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Selected adjustments deleted successfully.',
            life: 2500
        });
        selection.value = [];
        await fetchAdjustments(meta.page);
    } catch (error) {
        console.error('Failed to delete adjustments', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to delete selected adjustments.',
            life: 3000
        });
    }
}

function navigateToCreate() {
    router.push('/inventory/adjustments/create');
}

function navigateToEdit(adjustment) {
    router.push(`/inventory/adjustments/${adjustment.id}`);
}
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-4 md:p-6 lg:p-8">
        <div class="card shadow-sm mb-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                <div>
                    <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 flex items-center gap-3">
                        <i class="pi pi-sync text-primary-500 text-2xl"></i>
                        Stock Adjustments
                    </h2>
                    <p class="text-surface-500 dark:text-surface-400">
                        Review and manage inventory adjustments across warehouses.
                    </p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <Button label="Delete Selected" icon="pi pi-trash" severity="danger" outlined @click="deleteSelected" />
                    <Button label="Add Adjustment" icon="pi pi-plus" @click="navigateToCreate" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div>
                    <label class="block text-xs font-semibold uppercase text-surface-500 mb-2">Search</label>
                    <span class="p-input-icon-left w-full">
                        <i class="pi pi-search" />
                        <InputText v-model="filters.search" class="w-full" placeholder="Search reference or note" />
                    </span>
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase text-surface-500 mb-2">Warehouse</label>
                    <Dropdown
                        v-model="filters.warehouseId"
                        :options="warehouses"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                </div>
                <div class="md:col-span-2">
                    <label class="block text-xs font-semibold uppercase text-surface-500 mb-2">Date Range</label>
                    <Calendar
                        v-model="filters.dateRange"
                        selectionMode="range"
                        :manualInput="false"
                        dateFormat="yy-mm-dd"
                        showIcon
                        class="w-full"
                    />
                </div>
            </div>

            <DataTable
                :value="adjustments"
                dataKey="id"
                :loading="loading"
                paginator
                lazy
                :rows="meta.perPage"
                :totalRecords="meta.total"
                @page="onPage"
                v-model:selection="selection"
                selectionMode="multiple"
                :rowsPerPageOptions="[10, 15, 25, 50]"
                responsiveLayout="scroll"
            >
                <Column selectionMode="multiple" headerStyle="width: 3rem" />
                <Column field="created_at" header="Date">
                    <template #body="{ data }">
                        <span>{{ formatDate(data.created_at) }}</span>
                    </template>
                </Column>
                <Column field="reference_no" header="Reference" />
                <Column header="Warehouse">
                    <template #body="{ data }">
                        {{ data.warehouse?.name || '—' }}
                    </template>
                </Column>
                <Column header="Summary">
                    <template #body="{ data }">
                        <span class="text-sm text-surface-600 dark:text-surface-300">{{ data.product_summary }}</span>
                    </template>
                </Column>
                <Column field="note" header="Note" />
                <Column header="Actions" style="width: 160px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-eye" rounded outlined size="small" @click="viewDetails(data)" />
                            <Button icon="pi pi-pencil" rounded outlined size="small" severity="info" @click="navigateToEdit(data)" />
                            <Button icon="pi pi-trash" rounded outlined size="small" severity="danger" @click="deleteAdjustment(data)" />
                        </div>
                    </template>
                </Column>
                <template #empty>
                    <div class="py-6 text-center text-surface-500">No adjustments found for the selected criteria.</div>
                </template>
            </DataTable>
        </div>

        <Dialog v-model:visible="detailDialog" header="Adjustment Details" :style="{ width: '55vw' }" modal>
            <div v-if="detailLoading" class="py-6 text-center">
                <ProgressSpinner />
            </div>
            <div v-else-if="detailData">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div>
                        <span class="font-semibold text-surface-600 dark:text-surface-200 block text-sm">Reference</span>
                        <span>{{ detailData.reference_no }}</span>
                    </div>
                    <div>
                        <span class="font-semibold text-surface-600 dark:text-surface-200 block text-sm">Date</span>
                        <span>{{ formatDate(detailData.created_at) }}</span>
                    </div>
                    <div>
                        <span class="font-semibold text-surface-600 dark:text-surface-200 block text-sm">Warehouse</span>
                        <span>{{ detailData.warehouse?.name || '—' }}</span>
                    </div>
                    <div>
                        <span class="font-semibold text-surface-600 dark:text-surface-200 block text-sm">Total Qty</span>
                        <span>{{ detailData.total_qty }}</span>
                    </div>
                    <div class="md:col-span-2">
                        <span class="font-semibold text-surface-600 dark:text-surface-200 block text-sm">Note</span>
                        <span>{{ detailData.note || '—' }}</span>
                    </div>
                </div>

            <DataTable :value="detailData.items" responsiveLayout="scroll">
                <Column header="Product">
                    <template #body="{ data }">
                        <div class="flex flex-col">
                            <span class="font-semibold">{{ data.product_name }}</span>
                            <small class="text-surface-500">{{ data.product_code }}</small>
                        </div>
                    </template>
                </Column>
                <Column field="qty" header="Qty" />
                <Column header="Action">
                    <template #body="{ data }">
                        <Tag :value="data.action === '+' ? 'Add' : 'Subtract'" :severity="data.action === '+' ? 'success' : 'danger'" />
                    </template>
                </Column>
                <Column field="unit_cost" header="Unit Cost">
                    <template #body="{ data }">
                        {{ Number(data.unit_cost || 0).toFixed(2) }}
                    </template>
                </Column>
                <Column field="available_qty" header="Available Qty">
                    <template #body="{ data }">
                        {{ Number(data.available_qty || 0).toFixed(2) }}
                    </template>
                </Column>
            </DataTable>
            </div>
            <div v-else class="py-4 text-center text-surface-500">
                Adjustment details not available.
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
</style>
