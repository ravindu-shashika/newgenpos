<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';

const toast = useToast();
const dt = ref();
const customers = ref([]);
const customerDialog = ref(false);
const deleteCustomerDialog = ref(false);
const customer = ref({
    customer_group_id: null,
    name: '',
    company_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    tax_no: '',
    opening_balance: null
});
const selectedCustomers = ref();
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const submitted = ref(false);
const isEdit = ref(false);
const loading = ref(false);
const customerGroups = ref([]);

onMounted(() => {
    fetchCustomers();
    fetchFormData();
});

const customerGroupOptions = computed(() =>
    customerGroups.value.map((g) => ({ label: g.name, value: g.id }))
);

async function fetchCustomers() {
    loading.value = true;
    try {
        const response = await api.get('customers');
        if (response.data?.status === 200) customers.value = response.data.data || [];
        else if (response.error) toast.add({ severity: 'error', summary: 'Error', detail: response.error.response?.data?.message || 'Failed to load customers', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Failed to load customers', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function fetchFormData() {
    try {
        const response = await api.get('customers/form-data');
        if (response.data?.status === 200) customerGroups.value = response.data.customer_groups || [];
    } catch (_) {}
}

function openNew() {
    customer.value = {
        customer_group_id: customerGroups.value[0]?.id ?? null,
        name: '',
        company_name: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        tax_no: '',
        opening_balance: null
    };
    submitted.value = false;
    isEdit.value = false;
    customerDialog.value = true;
}

function editCustomer(row) {
    customer.value = {
        id: row.id,
        customer_group_id: row.customer_group_id,
        name: row.name,
        company_name: row.company_name || '',
        email: row.email || '',
        phone_number: row.phone_number || '',
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        postal_code: row.postal_code || '',
        country: row.country || '',
        tax_no: row.tax_no || ''
    };
    isEdit.value = true;
    customerDialog.value = true;
}

function hideDialog() {
    customerDialog.value = false;
    customer.value = { customer_group_id: null, name: '', company_name: '', email: '', phone_number: '', address: '', city: '', state: '', postal_code: '', country: '', tax_no: '', opening_balance: null };
}

async function saveCustomer() {
    submitted.value = true;
    if (!customer.value.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Name is required', life: 3000 });
        return;
    }
    if (!customer.value.phone_number?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Phone number is required', life: 3000 });
        return;
    }
    if (!customer.value.customer_group_id) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Customer group is required', life: 3000 });
        return;
    }
    try {
        if (isEdit.value && customer.value.id) {
            const payload = { id: customer.value.id, customer_group_id: customer.value.customer_group_id, name: customer.value.name.trim(), company_name: customer.value.company_name?.trim() || null, email: customer.value.email?.trim() || null, phone_number: customer.value.phone_number.trim(), address: customer.value.address?.trim() || null, city: customer.value.city?.trim() || null, state: customer.value.state?.trim() || null, postal_code: customer.value.postal_code?.trim() || null, country: customer.value.country?.trim() || null, tax_no: customer.value.tax_no?.trim() || null };
            const response = await api.post('customers/update', payload);
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchCustomers();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Update failed', life: 3000 });
        } else {
            const payload = { customer_group_id: customer.value.customer_group_id, name: customer.value.name.trim(), company_name: customer.value.company_name?.trim() || null, email: customer.value.email?.trim() || null, phone_number: customer.value.phone_number.trim(), address: customer.value.address?.trim() || null, city: customer.value.city?.trim() || null, state: customer.value.state?.trim() || null, postal_code: customer.value.postal_code?.trim() || null, country: customer.value.country?.trim() || null, tax_no: customer.value.tax_no?.trim() || null, opening_balance: customer.value.opening_balance };
            const response = await api.post('customers', payload);
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchCustomers();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Create failed', life: 3000 });
        }
    } catch (e) {
        const msg = e.response?.data?.message || e.response?.data?.errors?.phone_number?.[0] || 'Save failed';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    }
}

function confirmDelete(row) {
    customer.value = row;
    deleteCustomerDialog.value = true;
}

async function deleteCustomer() {
    try {
        const response = await api.delete(`customers/${customer.value.id}`);
        if (response.data?.status === 200) {
            customers.value = customers.value.filter((c) => c.id !== customer.value.id);
            toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
        } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Delete failed', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Delete failed', life: 3000 });
    }
    deleteCustomerDialog.value = false;
    customer.value = {};
}

function exportCSV() {
    dt.value?.exportCSV();
}

function customerGroupName(row) {
    return row.customer_group?.name ?? '—';
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-users text-primary"></i>
                    Customers
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage customers</p>
            </div>
            <Button label="Add Customer" icon="pi pi-plus" @click="openNew" />
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
                v-model:selection="selectedCustomers"
                :value="customers"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                :globalFilterFields="['name', 'company_name', 'email', 'phone_number', 'city']"
                class="p-datatable-sm"
                stripedRows
            >
                <template #empty>
                    <div class="text-center py-12">
                        <p class="text-gray-500 dark:text-gray-400">No customers found.</p>
                        <Button label="Add Customer" icon="pi pi-plus" class="mt-4" @click="openNew" />
                    </div>
                </template>
                <Column field="customer_group_id" header="Customer Group" sortable headerClass="font-semibold">
                    <template #body="{ data }">{{ customerGroupName(data) }}</template>
                </Column>
                <Column field="name" header="Name" sortable headerClass="font-semibold" />
                <Column field="company_name" header="Company" headerClass="font-semibold" />
                <Column field="email" header="Email" headerClass="font-semibold" />
                <Column field="phone_number" header="Phone" headerClass="font-semibold" />
                <Column field="city" header="City" headerClass="font-semibold" />
                <Column :exportable="false" header="Actions" headerClass="font-semibold" style="width: 120px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" outlined rounded severity="info" v-tooltip.top="'Edit'" class="h-9 w-9" @click="editCustomer(data)" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger" v-tooltip.top="'Delete'" class="h-9 w-9" @click="confirmDelete(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="customerDialog" :style="{ width: '600px' }" :modal="true" :header="isEdit ? 'Update Customer' : 'Add Customer'" @hide="hideDialog">
            <div class="py-4 space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Customer Group <span class="text-red-500">*</span></label>
                    <Select v-model="customer.customer_group_id" :options="customerGroupOptions" optionLabel="label" optionValue="value" placeholder="Select group" class="w-full" :invalid="submitted && !customer.customer_group_id" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name <span class="text-red-500">*</span></label>
                        <InputText v-model.trim="customer.name" placeholder="Customer name" class="w-full" :invalid="submitted && !customer.name" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                        <InputText v-model.trim="customer.company_name" placeholder="Company" class="w-full" />
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                        <InputText v-model.trim="customer.email" type="email" placeholder="email@example.com" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number <span class="text-red-500">*</span></label>
                        <InputText v-model.trim="customer.phone_number" placeholder="Phone" class="w-full" :invalid="submitted && !customer.phone_number" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                    <InputText v-model.trim="customer.address" placeholder="Address" class="w-full" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City</label>
                        <InputText v-model.trim="customer.city" placeholder="City" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State</label>
                        <InputText v-model.trim="customer.state" placeholder="State" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Postal Code</label>
                        <InputText v-model.trim="customer.postal_code" placeholder="Postal code" class="w-full" />
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Country</label>
                        <InputText v-model.trim="customer.country" placeholder="Country" class="w-full" />
                    </div>
                    <div v-if="!isEdit">
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Opening Balance</label>
                        <InputNumber v-model="customer.opening_balance" placeholder="0" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tax Number</label>
                        <InputText v-model.trim="customer.tax_no" placeholder="Tax no" class="w-full" />
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="hideDialog" />
                <Button :label="isEdit ? 'Update' : 'Save'" icon="pi pi-check" @click="saveCustomer" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCustomerDialog" :style="{ width: '450px' }" :modal="true" header="Confirm Delete">
            <p class="text-gray-700 dark:text-gray-300">Delete customer <strong>{{ customer.name }}</strong>?</p>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteCustomerDialog = false" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteCustomer" />
            </template>
        </Dialog>
    </div>
</template>
