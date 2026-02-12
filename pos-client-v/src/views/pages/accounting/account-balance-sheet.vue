<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';

const toast = useToast();
const entries = ref([]);
const loading = ref(true);
const totals = ref({ credit: 0, debit: 0, balance: 0 });

onMounted(() => {
    loadData();
});

function formatCurrency(value) {
    const number = Number(value || 0);
    return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const summaryCards = computed(() => [
    { label: 'Total Credit', value: formatCurrency(totals.value.credit), icon: 'pi pi-arrow-down-right', tone: 'success' },
    { label: 'Total Debit', value: formatCurrency(totals.value.debit), icon: 'pi pi-arrow-up-right', tone: 'danger' },
    { label: 'Net Balance', value: formatCurrency(totals.value.balance), icon: 'pi pi-wallet', tone: 'primary' }
]);

async function loadData() {
    loading.value = true;
    try {
        const res = await api.get('accounts/balance-sheet');
        if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to load balance sheet';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            return;
        }
        if (res.data?.status === 200) {
            entries.value = res.data.data || [];
            totals.value = res.data.totals || { credit: 0, debit: 0, balance: 0 };
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load balance sheet', life: 3000 });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-chart-bar text-primary"></i>
                    Balance Sheet
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Overview of account credits, debits and balances</p>
            </div>
            <Button label="Refresh" icon="pi pi-refresh" outlined @click="loadData" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
                v-for="card in summaryCards"
                :key="card.label"
                class="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4"
            >
                <span class="text-2xl" :class="card.tone === 'success' ? 'text-emerald-500' : card.tone === 'danger' ? 'text-rose-500' : 'text-primary'">
                    <i :class="card.icon"></i>
                </span>
                <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</div>
                    <div class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ card.value }}</div>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <DataTable :value="entries" :loading="loading" stripedRows tableStyle="min-width: 60rem">
                <template #empty>
                    <div class="text-center py-12 text-gray-500">No data available</div>
                </template>
                <Column field="name" header="Account Name" style="min-width: 200px" />
                <Column field="account_no" header="Account No" style="min-width: 140px">
                    <template #body="{ data }">{{ data.account_no || '—' }}</template>
                </Column>
                <Column field="credit" header="Credit" style="min-width: 140px">
                    <template #body="{ data }">{{ formatCurrency(data.credit) }}</template>
                </Column>
                <Column field="debit" header="Debit" style="min-width: 140px">
                    <template #body="{ data }">{{ formatCurrency(data.debit) }}</template>
                </Column>
                <Column field="balance" header="Balance" style="min-width: 140px">
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
