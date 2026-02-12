<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

const toast = useToast();
const plans = ref([]);
const customers = ref([]);
const planDialog = ref(false);
const plan = ref({ name: '', type: 'limited', customer_id: [], is_active: true });
const submitted = ref(false);
const loading = ref(false);
const isEdit = ref(false);

onMounted(() => {
    fetchPlans();
    fetchFormData();
});

async function fetchPlans() {
    try {
        const res = await api.get('discount-plans');
        if (res.data?.status === 200) {
            plans.value = res.data.data || [];
        } else if (res.error) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load discount plans', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load discount plans', life: 3000 });
    }
}

async function fetchFormData() {
    try {
        const res = await api.get('discount-plans/form-data');
        if (res.data?.status === 200 && res.data.data?.customers) {
            customers.value = res.data.data.customers;
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load form data', life: 3000 });
    }
}

const customerOptions = () =>
    customers.value.map((c) => ({ label: `${c.name} (${c.phone_number || ''})`, value: c.id }));

function openNew() {
    plan.value = { name: '', type: 'limited', customer_id: [], is_active: true };
    submitted.value = false;
    isEdit.value = false;
    planDialog.value = true;
}

function editPlan(p) {
    plan.value = {
        id: p.id,
        name: p.name,
        type: p.type || 'limited',
        customer_id: (p.customers || []).map((c) => c.id),
        is_active: p.is_active !== false,
    };
    isEdit.value = true;
    planDialog.value = true;
}

watch(
    () => plan.value.type,
    (val) => {
        if (val === 'generic') {
            plan.value.customer_id = customers.value.map((c) => c.id);
        } else if (isEdit.value && plan.value.id) {
            // keep current selection for limited
        } else {
            plan.value.customer_id = [];
        }
    }
);

function hideDialog() {
    planDialog.value = false;
    plan.value = {};
}

async function save() {
    submitted.value = true;
    if (!plan.value?.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Name is required', life: 3000 });
        return;
    }
    if (!plan.value.customer_id?.length) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Select at least one customer', life: 3000 });
        return;
    }
    loading.value = true;
    try {
        const payload = {
            name: plan.value.name.trim(),
            type: plan.value.type,
            customer_id: plan.value.customer_id,
            is_active: plan.value.is_active,
        };
        if (isEdit.value && plan.value.id) {
            const res = await api.post(`discount-plans/${plan.value.id}`, payload);
            if (res.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
                await fetchPlans();
                hideDialog();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to update', life: 3000 });
            }
        } else {
            const res = await api.post('discount-plans', payload);
            if (res.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
                await fetchPlans();
                hideDialog();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to create', life: 3000 });
            }
        }
    } catch (e) {
        const msg = e.response?.data?.message || 'Failed to save discount plan';
        toast.add({ severity: 'error', summary: 'Error', detail: typeof msg === 'object' ? JSON.stringify(msg) : msg, life: 3000 });
    } finally {
        loading.value = false;
    }
}

function customerNames(planItem) {
    const custs = planItem.customers || [];
    return custs.length ? custs.map((c) => c.name).join(', ') : '—';
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-percentage text-primary"></i>
                    Discount Plan
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage discount plans and assigned customers</p>
            </div>
            <Button label="Create Discount Plan" icon="pi pi-plus" @click="openNew" />
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <DataTable :value="plans" stripedRows class="p-datatable-sm">
                <template #empty>
                    <div class="text-center py-12 text-gray-500">No discount plans found</div>
                </template>
                <Column field="id" header="#" style="width: 60px">
                    <template #body="slot">{{ slot.index + 1 }}</template>
                </Column>
                <Column field="name" header="Name" sortable />
                <Column header="Customer">
                    <template #body="slot">{{ customerNames(slot.data) }}</template>
                </Column>
                <Column field="type" header="Type">
                    <template #body="slot">{{ (slot.data.type || 'limited').charAt(0).toUpperCase() + (slot.data.type || 'limited').slice(1) }}</template>
                </Column>
                <Column header="Status">
                    <template #body="slot">
                        <Tag :value="slot.data.is_active ? 'Active' : 'Inactive'" :severity="slot.data.is_active ? 'success' : 'secondary'" />
                    </template>
                </Column>
                <Column header="Action" style="width: 120px">
                    <template #body="slot">
                        <Button icon="pi pi-pencil" size="small" outlined severity="info" v-tooltip="'Edit'" @click="editPlan(slot.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="planDialog" :style="{ width: '500px' }" :header="isEdit ? 'Update Discount Plan' : 'Create Discount Plan'" :modal="true" :dismissableMask="true">
            <p class="text-sm italic text-gray-500 mb-4">The field labels marked with <span class="text-red-500">*</span> are required input fields.</p>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold mb-2">Name <span class="text-red-500">*</span></label>
                    <InputText v-model="plan.name" placeholder="Plan name" class="w-full" :invalid="submitted && !plan.name" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Customer <span class="text-red-500">*</span></label>
                    <MultiSelect
                        v-model="plan.customer_id"
                        :options="customerOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select customers..."
                        filter
                        class="w-full"
                        :invalid="submitted && !plan.customer_id?.length"
                        :disabled="plan.type === 'generic'"
                    />
                    <small v-if="plan.type === 'generic'" class="text-gray-500">Generic type includes all customers</small>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Type <span class="text-red-500">*</span></label>
                    <Select v-model="plan.type" :options="[{ label: 'Limited', value: 'limited' }, { label: 'Generic', value: 'generic' }]" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="plan.is_active" :binary="true" inputId="plan-active" />
                    <label for="plan-active" class="cursor-pointer">Active</label>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" />
                <Button :label="isEdit ? 'Update' : 'Submit'" icon="pi pi-check" :loading="loading" @click="save" />
            </template>
        </Dialog>
    </div>
</template>
