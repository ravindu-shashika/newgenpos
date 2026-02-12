<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const toast = useToast();
const route = useRoute();

const accounts = ref([]);
const filters = ref({
    accountId: null,
    type: '0',
    startDate: null,
    endDate: null
});
const loading = ref(false);
const optionsLoading = ref(true);
const transactions = ref([]);
const totals = ref({ credit: 0, debit: 0, closing_balance: 0 });
const accountInfo = ref(null);

const typeOptions = [
    { label: 'All Transactions', value: '0' },
    { label: 'Debit Only', value: '1' },
    { label: 'Credit Only', value: '2' }
];

function defaultStartDate() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
}

function defaultEndDate() {
    return new Date();
}

function parseQueryDate(value, fallback) {
    if (!value) return fallback;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

onMounted(async () => {
    filters.value.startDate = parseQueryDate(route.query.startDate, defaultStartDate());
    filters.value.endDate = parseQueryDate(route.query.endDate, defaultEndDate());
    filters.value.accountId = route.query.accountId ? Number(route.query.accountId) : null;
    filters.value.type = route.query.type ? String(route.query.type) : '0';

    await loadOptions();
    if (filters.value.accountId) {
        await fetchStatement();
    }
});

function formatCurrency(value) {
    const number = Number(value || 0);
    return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateDisplay(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function formatDateForApi(date) {
    if (!(date instanceof Date)) return null;
    const iso = date.toISOString();
    return iso.slice(0, 10);
}

async function loadOptions() {
    optionsLoading.value = true;
    try {
        const res = await api.get('accounts/options');
        if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to load account options';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            accounts.value = [];
            return;
        }
        if (res.data?.status === 200) {
            accounts.value = res.data.data || [];
            if (!filters.value.accountId && accounts.value.length) {
                const defaultAccount = accounts.value.find((acc) => acc.is_default) || accounts.value[0];
                filters.value.accountId = defaultAccount.id;
            }
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load account options', life: 3000 });
    } finally {
        optionsLoading.value = false;
    }
}

async function fetchStatement() {
    if (!filters.value.accountId) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Select an account first', life: 3000 });
        return;
    }
    if (!filters.value.startDate || !filters.value.endDate) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Select a valid date range', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        const params = new URLSearchParams({
            account_id: String(filters.value.accountId),
            start_date: formatDateForApi(filters.value.startDate),
            end_date: formatDateForApi(filters.value.endDate),
            type: filters.value.type || '0'
        });

        const res = await api.get(`accounts/statement?${params.toString()}`);
        if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to load account statement';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            return;
        }

        if (res.data?.status === 200) {
            const data = res.data.data || {};
            accountInfo.value = data.account || null;
            totals.value = data.totals || { credit: 0, debit: 0, closing_balance: 0 };
            transactions.value = data.transactions || [];
        }
    } catch (error) {
        const msg = error.response?.data?.message || 'Failed to load account statement';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    } finally {
        loading.value = false;
    }
}

const selectedAccountLabel = computed(() => {
    const found = accounts.value.find((acc) => acc.id === filters.value.accountId);
    if (!found) return 'Select account';
    return found.label || `${found.name}${found.account_no ? ` (${found.account_no})` : ''}`;
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-book text-primary"></i>
                    Account Statement
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Review detailed transactions for a specific account</p>
            </div>
            <div v-if="accountInfo" class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
                <div class="text-sm text-gray-500 dark:text-gray-400">Account</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ accountInfo.name }}
                    <span v-if="accountInfo.account_no" class="text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({{ accountInfo.account_no }})
                    </span>
                </div>
                <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Initial Balance: <span class="font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(accountInfo.initial_balance) }}</span>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-semibold mb-2">Account</label>
                    <Dropdown
                        v-model="filters.accountId"
                        :options="accounts"
                        optionLabel="label"
                        optionValue="id"
                        class="w-full"
                        :loading="optionsLoading"
                        placeholder="Select account"
                    />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Type</label>
                    <Select v-model="filters.type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Start Date</label>
                    <Calendar v-model="filters.startDate" class="w-full" dateFormat="dd-mm-yy" showIcon />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">End Date</label>
                    <Calendar v-model="filters.endDate" class="w-full" dateFormat="dd-mm-yy" showIcon />
                </div>
            </div>
            <div class="mt-4 flex justify-end">
                <Button label="View Statement" icon="pi pi-search" @click="fetchStatement" />
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
                <div class="text-sm text-gray-500 dark:text-gray-400">Total Credit</div>
                <div class="text-2xl font-semibold text-emerald-500">{{ formatCurrency(totals.credit) }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
                <div class="text-sm text-gray-500 dark:text-gray-400">Total Debit</div>
                <div class="text-2xl font-semibold text-rose-500">{{ formatCurrency(totals.debit) }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
                <div class="text-sm text-gray-500 dark:text-gray-400">Closing Balance</div>
                <div
                    class="text-2xl font-semibold"
                    :class="totals.closing_balance >= 0 ? 'text-emerald-500' : 'text-rose-500'"
                >
                    {{ formatCurrency(totals.closing_balance) }}
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <DataTable :value="transactions" :loading="loading" stripedRows tableStyle="min-width: 70rem">
                <template #empty>
                    <div class="text-center py-12 text-gray-500">No transactions for the selected filters</div>
                </template>
                <Column field="date" header="Date" style="min-width: 170px">
                    <template #body="{ data }">
                        {{ formatDateDisplay(data.date) }}
                    </template>
                </Column>
                <Column field="reference" header="Reference" style="min-width: 160px">
                    <template #body="{ data }">{{ data.reference || '—' }}</template>
                </Column>
                <Column field="related_reference" header="Related Transaction" style="min-width: 160px">
                    <template #body="{ data }">{{ data.related_reference || '—' }}</template>
                </Column>
                <Column field="description" header="Description" style="min-width: 200px">
                    <template #body="{ data }">{{ data.description || '—' }}</template>
                </Column>
                <Column field="credit" header="Credit" style="min-width: 120px">
                    <template #body="{ data }">
                        <span class="text-emerald-500 font-semibold">{{ formatCurrency(data.credit) }}</span>
                    </template>
                </Column>
                <Column field="debit" header="Debit" style="min-width: 120px">
                    <template #body="{ data }">
                        <span class="text-rose-500 font-semibold">{{ formatCurrency(data.debit) }}</span>
                    </template>
                </Column>
                <Column field="balance" header="Running Balance" style="min-width: 140px">
                    <template #body="{ data }">
                        <span :class="data.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                            {{ formatCurrency(data.balance) }}
                        </span>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
