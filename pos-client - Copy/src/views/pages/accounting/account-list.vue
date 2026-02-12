<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();

const accounts = ref([]);
const loading = ref(true);
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEdit = ref(false);
const form = ref({
    id: null,
    account_no: '',
    name: '',
    initial_balance: 0,
    note: ''
});
const submitted = ref(false);
const saving = ref(false);
const deleteTarget = ref(null);
const defaultLoadingId = ref(null);

onMounted(() => {
    loadAccounts();
});

const totals = computed(() => {
    const initial = accounts.value.reduce((sum, acc) => sum + (acc.initial_balance || 0), 0);
    const balance = accounts.value.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    return {
        initial,
        balance
    };
});

function formatCurrency(value) {
    const number = Number(value || 0);
    return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadAccounts() {
    loading.value = true;
    try {
        const res = await api.get('accounts');
        if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to load accounts';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            accounts.value = [];
            return;
        }
        if (res.data?.status === 200) {
            accounts.value = res.data.data || [];
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load accounts', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function openNew() {
    dialogVisible.value = true;
    isEdit.value = false;
    submitted.value = false;
    form.value = {
        id: null,
        account_no: '',
        name: '',
        initial_balance: 0,
        note: ''
    };
}

function editAccount(account) {
    dialogVisible.value = true;
    isEdit.value = true;
    submitted.value = false;
    form.value = {
        id: account.id,
        account_no: account.account_no || '',
        name: account.name || '',
        initial_balance: account.initial_balance || 0,
        note: account.note || ''
    };
}

function confirmDelete(account) {
    deleteTarget.value = account;
    deleteDialogVisible.value = true;
}

async function saveAccount() {
    submitted.value = true;
    if (!form.value.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Name is required', life: 3000 });
        return;
    }

    saving.value = true;
    try {
        const payload = {
            account_no: form.value.account_no?.trim() || null,
            name: form.value.name.trim(),
            initial_balance: Number(form.value.initial_balance || 0),
            note: form.value.note?.trim() || null
        };

        let res;
        if (isEdit.value && form.value.id) {
            res = await api.post(`accounts/${form.value.id}`, payload);
        } else {
            res = await api.post('accounts', payload);
        }

        if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to save account';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            return;
        }

        if (res.data?.status === 200) {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: res.data.message || 'Account saved',
                life: 3000
            });
            dialogVisible.value = false;
            await loadAccounts();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to save account', life: 3000 });
        }
    } catch (error) {
        const msg = error.response?.data?.message || 'Failed to save account';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    } finally {
        saving.value = false;
    }
}

async function deleteAccount() {
    if (!deleteTarget.value) return;
    try {
        const res = await api.delete(`accounts/${deleteTarget.value.id}`);
        if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to delete account';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            return;
        }
        if (res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Deleted', detail: res.data.message || 'Account deleted', life: 3000 });
            await loadAccounts();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to delete account', life: 3000 });
        }
    } catch (error) {
        const msg = error.response?.data?.message || 'Failed to delete account';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    } finally {
        deleteDialogVisible.value = false;
        deleteTarget.value = null;
    }
}

async function setDefault(account) {
    defaultLoadingId.value = account.id;
    try {
        const res = await api.post(`accounts/${account.id}/make-default`, {});
        if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to update default account';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            return false;
        }
        if (res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Updated', detail: res.data.message || 'Default account updated', life: 3000 });
            await loadAccounts();
            return true;
        }
        toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to update default account', life: 3000 });
        return false;
    } catch (error) {
        const msg = error.response?.data?.message || 'Failed to update default account';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
        return false;
    } finally {
        defaultLoadingId.value = null;
    }
}

async function handleDefaultToggle(account, value) {
    if (value) {
        await setDefault(account);
    } else {
        // Prevent turning off directly
        await loadAccounts();
        toast.add({ severity: 'warn', summary: 'Action cancelled', detail: 'Select another account as default instead.', life: 3000 });
    }
}

function openStatement(account) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    router.push({
        name: 'account-statement',
        query: {
            accountId: account.id,
            startDate: start.toISOString().slice(0, 10),
            endDate: today.toISOString().slice(0, 10),
            type: '0'
        }
    });
}

function openBalanceSheet() {
    router.push({ name: 'account-balance-sheet' });
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-wallet text-primary"></i>
                    Accounts
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage financial accounts and balances</p>
            </div>
            <div class="flex gap-2">
                <Button label="Balance Sheet" icon="pi pi-chart-bar" outlined @click="openBalanceSheet" />
                <Button label="Add Account" icon="pi pi-plus" @click="openNew" />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4">
                <div class="text-sm text-gray-500 dark:text-gray-400">Total Initial Balance</div>
                <div class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(totals.initial) }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4">
                <div class="text-sm text-gray-500 dark:text-gray-400">Total Available Balance</div>
                <div class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(totals.balance) }}</div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <DataTable :value="accounts" :loading="loading" stripedRows tableStyle="min-width: 60rem">
                <template #empty>
                    <div class="text-center py-12 text-gray-500">No accounts found</div>
                </template>
                <Column field="account_no" header="Account No" style="min-width: 140px" />
                <Column field="name" header="Name" style="min-width: 200px" />
                <Column header="Initial Balance" style="min-width: 140px">
                    <template #body="{ data }">
                        {{ formatCurrency(data.initial_balance) }}
                    </template>
                </Column>
                <Column header="Balance" style="min-width: 140px">
                    <template #body="{ data }">
                        {{ formatCurrency(data.balance) }}
                    </template>
                </Column>
                <Column header="Default" style="width: 120px">
                    <template #body="{ data }">
                        <InputSwitch
                            :modelValue="data.is_default"
                            :disabled="defaultLoadingId === data.id"
                            @update:modelValue="(val) => handleDefaultToggle(data, val)"
                        />
                    </template>
                </Column>
                <Column field="note" header="Note" style="min-width: 200px">
                    <template #body="{ data }">
                        {{ data.note || '—' }}
                    </template>
                </Column>
                <Column header="Actions" style="width: 220px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" severity="info" outlined size="small" v-tooltip="'Edit'" @click="editAccount(data)" />
                            <Button icon="pi pi-book" severity="help" outlined size="small" v-tooltip="'Statement'" @click="openStatement(data)" />
                            <Button icon="pi pi-trash" severity="danger" outlined size="small" v-tooltip="'Delete'" @click="confirmDelete(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog
            v-model:visible="dialogVisible"
            :header="isEdit ? 'Update Account' : 'Add Account'"
            :style="{ width: '450px' }"
            modal
            dismissableMask
        >
            <p class="text-sm italic text-gray-500 mb-4">
                The field labels marked with <span class="text-red-500">*</span> are required input fields.
            </p>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold mb-2">Account No</label>
                    <InputText v-model="form.account_no" class="w-full" autocomplete="off" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Name <span class="text-red-500">*</span></label>
                    <InputText v-model="form.name" class="w-full" :invalid="submitted && !form.name" autocomplete="off" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Initial Balance</label>
                    <InputNumber v-model="form.initial_balance" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" mode="decimal" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Note</label>
                    <Textarea v-model="form.note" rows="3" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined @click="dialogVisible = false" />
                <Button :label="isEdit ? 'Update' : 'Submit'" icon="pi pi-check" :loading="saving" @click="saveAccount" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialogVisible" header="Confirm Delete" :style="{ width: '420px' }" modal>
            <div class="flex items-start gap-4">
                <i class="pi pi-exclamation-triangle text-4xl text-amber-500"></i>
                <p v-if="deleteTarget">
                    Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>?
                </p>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteDialogVisible = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteAccount" />
            </template>
        </Dialog>
    </div>
</template>
