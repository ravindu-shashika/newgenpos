<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';

const toast = useToast();
const dt = ref();
const cashRegisters = ref([]);
const detailsDialog = ref(false);
const closeConfirmDialog = ref(false);
const selectedRegisters = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const selectedRegister = ref(null);
const registerDetails = ref(null);

onMounted(() => {
    fetchCashRegisters();
});

async function fetchCashRegisters() {
    try {
        const response = await api.get('cash-registers');
        if (response.data && response.data.status === 200) {
            cashRegisters.value = response.data.data;
        } else if (response.error) {
            const errorMsg = response.error.response?.data?.message || 'Failed to load cash registers';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to load cash registers';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
}

async function viewDetails(register) {
    selectedRegister.value = register;
    try {
        const response = await api.get(`cash-register/details/${register.id}`);
        if (response.status === 200 && response.data.status === 200) {
            registerDetails.value = response.data.data;
            detailsDialog.value = true;
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load details', life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to load register details';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
}

function formatCurrency(value) {
    if (!value) return '0.00';
    return parseFloat(value).toFixed(2);
}

function confirmCloseRegister() {
    closeConfirmDialog.value = true;
}

async function handleCloseRegister() {
    try {
        const response = await api.post(`cash-register/close/${selectedRegister.value.id}`);
        
        if (response.status === 200 && response.data.status === 200) {
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Cash register closed successfully', life: 3000 });
            closeConfirmDialog.value = false;
            detailsDialog.value = false;
            await fetchCashRegisters();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: response.data.message, life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to close register';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
}

function exportCSV() {
    dt.value.exportCSV();
}

const statusBadgeClass = (status) => {
    return status ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
};

const statusLabel = (status) => {
    return status ? 'Active' : 'Closed';
};

const customPaymentMethods = computed(() => {
    if (!registerDetails.value) return [];
    const standardMethods = [
        'cash_payment',
        'credit_card_payment',
        'cheque_payment',
        'gift_card_payment',
        'paypal_payment'
    ];
    const custom = [];
    Object.keys(registerDetails.value).forEach(key => {
        if (key.endsWith('_payment') && !standardMethods.includes(key)) {
            const methodName = key.replace('_payment', '').replace(/_/g, ' ');
            custom.push({
                name: methodName.charAt(0).toUpperCase() + methodName.slice(1),
                value: registerDetails.value[key]
            });
        }
    });
    return custom;
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <!-- Page Header -->
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">Cash Registers</h1>
                    <p class="text-gray-600 dark:text-gray-400">Monitor and manage cash register transactions</p>
                </div>
            </div>
        </div>

        <!-- Main Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <!-- Toolbar -->
            <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 p-4 md:p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <InputGroup class="w-full md:w-80">
                        <InputGroupAddon>
                            <i class="pi pi-search"></i>
                        </InputGroupAddon>
                        <InputText 
                            v-model="filters['global'].value" 
                            placeholder="Search registers..." 
                            class="w-full"
                        />
                    </InputGroup>
                    <div class="flex gap-2">
                        <Button 
                            icon="pi pi-download" 
                            rounded 
                            severity="info"
                            @click="exportCSV"
                            v-tooltip="'Export CSV'"
                        />
                    </div>
                </div>
            </div>

            <!-- DataTable -->
            <DataTable
                ref="dt"
                :value="cashRegisters"
                v-model:selection="selectedRegisters"
                dataKey="id"
                paginator
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} registers"
                :loading="false"
                :globalFilterFields="['user.name', 'warehouse.name']"
                responsiveLayout="scroll"
            >
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                
                <Column field="user.name" header="User" :sortable="true" style="min-width: 120px"></Column>
                
                <Column field="warehouse.name" header="Warehouse" :sortable="true" style="min-width: 120px"></Column>
                
                <Column field="cash_in_hand" header="Cash in Hand" :sortable="true" style="min-width: 130px">
                    <template #body="slotProps">
                        <div class="text-right font-mono text-gray-700 dark:text-gray-300">
                            {{ formatCurrency(slotProps.data.cash_in_hand) }}
                        </div>
                    </template>
                </Column>

                <Column field="closing_balance" header="Closing Balance" :sortable="true" style="min-width: 130px">
                    <template #body="slotProps">
                        <div class="text-right font-mono text-gray-700 dark:text-gray-300">
                            {{ formatCurrency(slotProps.data.closing_balance) }}
                        </div>
                    </template>
                </Column>

                <Column field="actual_cash" header="Actual Cash" :sortable="true" style="min-width: 130px">
                    <template #body="slotProps">
                        <div class="text-right font-mono text-gray-700 dark:text-gray-300">
                            {{ formatCurrency(slotProps.data.actual_cash) }}
                        </div>
                    </template>
                </Column>

                <Column field="created_at" header="Opened at" :sortable="true" style="min-width: 150px">
                    <template #body="slotProps">
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            {{ formatDate(slotProps.data.created_at) }}
                        </div>
                    </template>
                </Column>

                <Column field="updated_at" header="Closed at" :sortable="true" style="min-width: 150px">
                    <template #body="slotProps">
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            {{ slotProps.data.status ? 'N/A' : formatDate(slotProps.data.updated_at) }}
                        </div>
                    </template>
                </Column>

                <Column field="status" header="Status" :sortable="true" style="min-width: 100px">
                    <template #body="slotProps">
                        <Tag 
                            :value="statusLabel(slotProps.data.status)"
                            :class="statusBadgeClass(slotProps.data.status)"
                            class="px-3 py-1 rounded-full text-xs font-semibold"
                        />
                    </template>
                </Column>

                <Column header="Actions" :sortable="false" style="min-width: 80px">
                    <template #body="slotProps">
                        <Button 
                            icon="pi pi-eye" 
                            rounded 
                            severity="info" 
                            size="small"
                            @click="viewDetails(slotProps.data)"
                            v-tooltip="'View Details'"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Details Modal -->
        <Dialog 
            v-model:visible="detailsDialog" 
            :style="{ width: '600px' }" 
            :modal="true"
            class="details-dialog"
            :dismissableMask="true"
        >
            <template #header>
                <div class="flex items-center gap-3">
                    <i class="pi pi-info-circle text-xl"></i>
                    <h2 class="text-xl font-semibold">Cash Register Details</h2>
                </div>
            </template>

            <div v-if="registerDetails" class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p class="text-sm text-blue-700 dark:text-blue-300">
                        Please review the transactions and payments
                    </p>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            <!-- Cash in Hand -->
                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">Cash in Hand:</td>
                                <td class="py-3 px-4 text-right font-mono font-semibold text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.cash_in_hand) }}
                                </td>
                            </tr>

                            <!-- Total Sale Amount -->
                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">Total Sale Amount:</td>
                                <td class="py-3 px-4 text-right font-mono font-semibold text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.total_sale_amount) }}
                                </td>
                            </tr>

                            <!-- Total Payment -->
                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">Total Payment:</td>
                                <td class="py-3 px-4 text-right font-mono font-semibold text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.total_payment) }}
                                </td>
                            </tr>

                            <!-- Payment Methods -->
                            <tr class="bg-gray-50 dark:bg-gray-700/50">
                                <td colspan="2" class="py-2 px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">
                                    Payment Methods
                                </td>
                            </tr>

                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">Cash Payment:</td>
                                <td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.cash_payment) }}
                                </td>
                            </tr>

                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">Credit Card Payment:</td>
                                <td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.credit_card_payment) }}
                                </td>
                            </tr>

                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">Cheque Payment:</td>
                                <td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.cheque_payment) }}
                                </td>
                            </tr>

                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">Gift Card Payment:</td>
                                <td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.gift_card_payment) }}
                                </td>
                            </tr>

                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">PayPal Payment:</td>
                                <td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.paypal_payment) }}
                                </td>
                            </tr>

                            <!-- Custom Payment Methods -->
                            <tr v-for="method in customPaymentMethods" :key="method.name">
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">{{ method.name }}:</td>
                                <td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                                    {{ formatCurrency(method.value) }}
                                </td>
                            </tr>

                            <!-- Summary Section -->
                            <tr class="bg-gray-50 dark:bg-gray-700/50">
                                <td colspan="2" class="py-2 px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">
                                    Summary
                                </td>
                            </tr>

                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">Total Sale Return:</td>
                                <td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.total_sale_return) }}
                                </td>
                            </tr>

                            <tr>
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">Total Expense:</td>
                                <td class="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                                    {{ formatCurrency(registerDetails.total_expense) }}
                                </td>
                            </tr>

                            <tr class="bg-primary-50 dark:bg-primary-900/20 font-bold">
                                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">Total Cash:</td>
                                <td class="py-3 px-4 text-right font-mono text-lg text-primary-600 dark:text-primary-400">
                                    {{ formatCurrency(registerDetails.total_cash) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Close" 
                    severity="secondary"
                    @click="detailsDialog = false"
                />
                <Button 
                    v-if="selectedRegister && selectedRegister.status"
                    label="Close Register" 
                    icon="pi pi-check"
                    severity="warning"
                    @click="confirmCloseRegister"
                />
            </template>
        </Dialog>

        <!-- Close Confirmation Dialog -->
        <Dialog 
            v-model:visible="closeConfirmDialog" 
            :style="{ width: '450px' }" 
            header="Confirm" 
            :modal="true"
            :dismissableMask="true"
        >
            <div class="flex align-items-center justify-content-center gap-4">
                <i class="pi pi-exclamation-triangle text-4xl text-yellow-500"></i>
                <span class="text-gray-700 dark:text-gray-300">
                    Are you sure you want to close this cash register?
                </span>
            </div>
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    text
                    @click="closeConfirmDialog = false"
                />
                <Button 
                    label="Close Register" 
                    icon="pi pi-check" 
                    severity="warning"
                    @click="handleCloseRegister"
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* Custom styling for cash register management - Light & Dark Mode Support */

/* Dialog styling */
.details-dialog :deep(.p-dialog-header) {
    padding: 1.5rem;
    background: linear-gradient(to right, rgb(249 250 251), rgb(243 244 246));
    border-bottom: 1px solid rgb(229 231 235);
}

:deep(.dark) .details-dialog :deep(.p-dialog-header) {
    background: linear-gradient(to right, rgb(31 41 55), rgb(17 24 39));
    border-bottom: 1px solid rgb(55 65 81);
}

.details-dialog :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.details-dialog :deep(.p-dialog-footer) {
    padding: 1.5rem;
    background-color: rgb(249 250 251);
    border-top: 1px solid rgb(229 231 235);
}

:deep(.dark) .details-dialog :deep(.p-dialog-footer) {
    background-color: rgb(31 41 55);
    border-top: 1px solid rgb(55 65 81);
}

/* DataTable enhancements - Theme aware */
:deep(.p-datatable-header) {
    background-color: transparent;
    border: none;
    padding: 0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    background-color: rgb(249 250 251);
    color: rgb(55 65 81);
    font-weight: 600;
    border-bottom: 2px solid rgb(229 231 235);
    padding: 1rem;
}

:deep(.dark .p-datatable .p-datatable-thead > tr > th) {
    background-color: rgb(31 41 55);
    color: rgb(209 213 219);
    border-bottom: 2px solid rgb(55 65 81);
}

:deep(.p-datatable .p-datatable-tbody > tr) {
    transition: all 0.2s;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background-color: rgb(249 250 251);
}

:deep(.dark .p-datatable .p-datatable-tbody > tr:hover) {
    background-color: rgb(31 41 55);
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 1rem;
    border-bottom: 1px solid rgb(243 244 246);
}

:deep(.dark .p-datatable .p-datatable-tbody > tr > td) {
    border-bottom: 1px solid rgb(55 65 81);
}

/* Striped rows enhancement - Theme aware */
:deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
    background-color: rgb(250 250 250);
}

:deep(.dark .p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
    background-color: rgb(31 41 55 / 0.5);
}

/* Button hover effects */
:deep(.p-button) {
    transition: all 0.2s ease-in-out;
}

:deep(.p-button:hover:not(:disabled)) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.dark .p-button:hover:not(:disabled)) {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

/* InputText styling - Dark mode support */
:deep(.p-inputtext) {
    background-color: rgb(249 250 251);
    border: 1px solid rgb(229 231 235);
}

:deep(.dark .p-inputtext) {
    background-color: rgb(55 65 81);
    border: 1px solid rgb(75 85 99);
    color: rgb(240 246 252);
}

/* Responsive dialog */
@media (max-width: 768px) {
    .details-dialog {
        width: 95vw !important;
        max-width: 95vw !important;
    }
}

/* Search input enhancement */
:deep(.p-iconfield .p-inputtext) {
    padding-left: 2.5rem;
}

/* Tag styling */
:deep(.p-tag) {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.025em;
}

/* Smooth transitions */
* {
    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

/* Card shadow enhancement for dark mode */
:deep(.dark) .rounded-2xl.shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

/* Focus ring for dark mode */
:deep(.dark) .focus\:ring-primary\/20:focus {
    --tw-ring-opacity: 0.3;
}

/* Tooltip dark mode support */
:deep(.dark .p-tooltip-text) {
    background-color: rgb(31 41 55);
    border-color: rgb(55 65 81);
}
</style>
