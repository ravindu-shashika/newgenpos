<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const currencies = ref([]);
const currencyDialog = ref(false);
const deleteCurrencyDialog = ref(false);
const currency = ref({ name: '', code: '', symbol: '', exchange_rate: 1 });
const selectedCurrencies = ref();
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const submitted = ref(false);
const isEdit = ref(false);
const loading = ref(false);

onMounted(() => fetchCurrencies());

async function fetchCurrencies() {
    loading.value = true;
    try {
        const response = await api.get('currencies');
        if (response.data?.status === 200) currencies.value = response.data.data || [];
        else if (response.error) toast.add({ severity: 'error', summary: 'Error', detail: response.error.response?.data?.message || 'Failed to load currencies', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Failed to load currencies', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function openNew() {
    currency.value = { name: '', code: '', symbol: '', exchange_rate: 1 };
    submitted.value = false;
    isEdit.value = false;
    currencyDialog.value = true;
}

function editCurrency(row) {
    currency.value = {
        currency_id: row.id,
        id: row.id,
        name: row.name,
        code: row.code,
        symbol: row.symbol || '',
        exchange_rate: row.exchange_rate ?? 1
    };
    isEdit.value = true;
    currencyDialog.value = true;
}

function hideDialog() {
    currencyDialog.value = false;
    currency.value = { name: '', code: '', symbol: '', exchange_rate: 1 };
}

async function saveCurrency() {
    submitted.value = true;
    if (!currency.value.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Name is required', life: 3000 });
        return;
    }
    if (!currency.value.code?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Code is required', life: 3000 });
        return;
    }
    const rate = Number(currency.value.exchange_rate);
    if (isNaN(rate) || rate < 0.0000001) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Exchange rate must be a positive number', life: 3000 });
        return;
    }
    try {
        if (isEdit.value && currency.value.currency_id) {
            const response = await api.post('currencies/update', {
                currency_id: currency.value.currency_id,
                name: currency.value.name.trim(),
                code: currency.value.code.trim(),
                symbol: (currency.value.symbol || '').trim(),
                exchange_rate: rate
            });
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchCurrencies();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Update failed', life: 3000 });
        } else {
            const response = await api.post('currencies', {
                name: currency.value.name.trim(),
                code: currency.value.code.trim(),
                symbol: (currency.value.symbol || '').trim(),
                exchange_rate: rate
            });
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchCurrencies();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Create failed', life: 3000 });
        }
    } catch (e) {
        const msg = e.response?.data?.message || 'Save failed';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    }
}

function confirmDelete(row) {
    currency.value = row;
    deleteCurrencyDialog.value = true;
}

async function deleteCurrency() {
    try {
        const response = await api.delete(`currencies/${currency.value.id}`);
        if (response.data?.status === 200) {
            currencies.value = currencies.value.filter((c) => c.id !== currency.value.id);
            toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
        } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Delete failed', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Delete failed', life: 3000 });
    }
    deleteCurrencyDialog.value = false;
    currency.value = {};
}

function exportCSV() {
    dt.value?.exportCSV();
}

const canDelete = (row) => row && Number(row.exchange_rate) !== 1;
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-dollar text-primary"></i>
                    Currencies
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage currencies and exchange rates</p>
            </div>
            <Button label="Add Currency" icon="pi pi-plus" @click="openNew" />
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div class="p-4 md:p-6 border-b border-gray-200 dark:border-gray-600 flex flex-wrap gap-4">
                <IconField class="flex-1 max-w-md">
                    <InputIcon><i class="pi pi-search text-gray-400" /></InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search..." class="w-full" />
                </IconField>
                <Button label="Export" icon="pi pi-download" severity="success" outlined @click="exportCSV" />
            </div>
            <DataTable
                ref="dt"
                v-model:selection="selectedCurrencies"
                :value="currencies"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                :globalFilterFields="['name', 'code', 'symbol']"
                class="p-datatable-sm"
                stripedRows
            >
                <template #empty>
                    <div class="text-center py-12">
                        <p class="text-gray-500 dark:text-gray-400">No currencies found.</p>
                        <Button label="Add Currency" icon="pi pi-plus" class="mt-4" @click="openNew" />
                    </div>
                </template>
                <Column field="name" header="Currency Name" sortable headerClass="font-semibold" />
                <Column field="code" header="Code" sortable headerClass="font-semibold" />
                <Column field="symbol" header="Symbol" headerClass="font-semibold" />
                <Column field="exchange_rate" header="Exchange Rate" sortable headerClass="font-semibold" />
                <Column :exportable="false" header="Actions" headerClass="font-semibold" style="width: 120px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" outlined rounded severity="info" v-tooltip.top="'Edit'" class="h-9 w-9" @click="editCurrency(data)" />
                            <Button v-if="canDelete(data)" icon="pi pi-trash" outlined rounded severity="danger" v-tooltip.top="'Delete'" class="h-9 w-9" @click="confirmDelete(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="currencyDialog" :style="{ width: '500px' }" :modal="true" :header="isEdit ? 'Update Currency' : 'Add Currency'" @hide="hideDialog">
            <div class="py-4 space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="currency.name" placeholder="Currency name" class="w-full" :invalid="submitted && !currency.name" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Code <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="currency.code" placeholder="e.g. USD, NGN" class="w-full uppercase" :invalid="submitted && !currency.code" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Symbol</label>
                    <InputText v-model.trim="currency.symbol" placeholder="e.g. $, ₹" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Exchange Rate <span class="text-red-500">*</span></label>
                    <InputNumber v-model="currency.exchange_rate" placeholder="1" :min="0.0000001" :minFractionDigits="0" :maxFractionDigits="8" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="hideDialog" />
                <Button :label="isEdit ? 'Update' : 'Save'" icon="pi pi-check" @click="saveCurrency" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCurrencyDialog" :style="{ width: '450px' }" :modal="true" header="Confirm Delete">
            <p class="text-gray-700 dark:text-gray-300">Delete currency <strong>{{ currency.name }}</strong> ({{ currency.code }})?</p>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteCurrencyDialog = false" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteCurrency" />
            </template>
        </Dialog>
    </div>
</template>
