<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const discounts = ref([]);
const discountPlans = ref([]);
const discountDialog = ref(false);
const discount = ref({
    name: '',
    discount_plan_id: [],
    applicable_for: 'All',
    is_active: true,
    product_list: [],
    productCodeInput: '',
    valid_from: null,
    valid_till: null,
    type: 'percentage',
    value: 0,
    minimum_qty: 1,
    maximum_qty: 999999,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
});
const productRows = ref([]);
const submitted = ref(false);
const loading = ref(false);
const isEdit = ref(false);

const DAY_OPTIONS = [
    { value: 'Mon', label: 'Monday' },
    { value: 'Tue', label: 'Tuesday' },
    { value: 'Wed', label: 'Wednesday' },
    { value: 'Thu', label: 'Thursday' },
    { value: 'Fri', label: 'Friday' },
    { value: 'Sat', label: 'Saturday' },
    { value: 'Sun', label: 'Sunday' },
];

onMounted(() => {
    fetchDiscounts();
    fetchFormData();
});

async function fetchDiscounts() {
    try {
        const res = await api.get('discounts');
        if (res.data?.status === 200) {
            discounts.value = res.data.data || [];
        } else if (res.error) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load discounts', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load discounts', life: 3000 });
    }
}

async function fetchFormData() {
    try {
        const res = await api.get('discounts/form-data');
        if (res.data?.status === 200 && res.data.data?.discount_plans) {
            discountPlans.value = res.data.data.discount_plans;
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load form data', life: 3000 });
    }
}

const discountPlanOptions = () =>
    discountPlans.value.map((p) => ({ label: p.name, value: p.id }));

function openNew() {
    discount.value = {
        name: '',
        discount_plan_id: [],
        applicable_for: 'All',
        is_active: true,
        product_list: [],
        productCodeInput: '',
        valid_from: new Date(),
        valid_till: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        type: 'percentage',
        value: 0,
        minimum_qty: 1,
        maximum_qty: 999999,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    };
    productRows.value = [];
    submitted.value = false;
    isEdit.value = false;
    discountDialog.value = true;
}

async function editDiscount(d) {
    try {
        const res = await api.get(`discounts/${d.id}`);
        if (res.data?.status === 200 && res.data.data) {
            const data = res.data.data;
            discount.value = {
                id: data.id,
                name: data.name,
                discount_plan_id: data.discount_plan_ids || data.discount_plan_id || [],
                applicable_for: data.applicable_for || 'All',
                is_active: data.is_active !== false,
                product_list: data.product_list ? data.product_list.toString().split(',').filter(Boolean) : [],
                productCodeInput: '',
                valid_from: data.valid_from ? new Date(data.valid_from) : new Date(),
                valid_till: data.valid_till ? new Date(data.valid_till) : new Date(),
                type: data.type || 'percentage',
                value: parseFloat(data.value) || 0,
                minimum_qty: data.minimum_qty ?? 1,
                maximum_qty: data.maximum_qty ?? 999999,
                days: data.days_array || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            };
            productRows.value = data.product_details || [];
            isEdit.value = true;
            discountDialog.value = true;
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load discount', life: 3000 });
    }
}

watch(
    () => discount.value.applicable_for,
    (val) => {
        if (val === 'All') {
            productRows.value = [];
            discount.value.product_list = [];
        }
    }
);

async function addProductByCode() {
    const input = (discount.value.productCodeInput || '').trim();
    if (!input) return;
    const codes = input.split(',').map((c) => c.trim()).filter(Boolean);
    for (const code of codes) {
        if (productRows.value.some((p) => p.code === code)) {
            toast.add({ severity: 'warn', summary: 'Duplicate', detail: `Product ${code} already in list`, life: 2000 });
            continue;
        }
        try {
            const res = await api.get(`discounts/product-search/${encodeURIComponent(code)}`);
            if (res.data?.status === 200 && res.data.data) {
                const p = res.data.data;
                productRows.value.push({ id: p.id, name: p.name, code: p.code });
                discount.value.product_list = productRows.value.map((r) => r.id);
            } else {
                toast.add({ severity: 'error', summary: 'Not found', detail: `Product with code "${code}" not found`, life: 2000 });
            }
        } catch (e) {
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to find product "${code}"`, life: 2000 });
        }
    }
    discount.value.productCodeInput = '';
}

function removeProduct(index) {
    productRows.value.splice(index, 1);
    discount.value.product_list = productRows.value.map((r) => r.id);
}

function toggleDay(day) {
    const arr = discount.value.days || [];
    const i = arr.indexOf(day);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(day);
    discount.value.days = [...arr];
}

function isDayChecked(day) {
    return (discount.value.days || []).includes(day);
}

function hideDialog() {
    discountDialog.value = false;
    discount.value = {};
    productRows.value = [];
}

function planNames(item) {
    const plans = item.discount_plans || [];
    return plans.length ? plans.map((p) => p.name).join(', ') : '—';
}

function validityDisplay(item) {
    const from = item.valid_from_formatted || (item.valid_from ? new Date(item.valid_from).toLocaleDateString() : '');
    const till = item.valid_till_formatted || (item.valid_till ? new Date(item.valid_till).toLocaleDateString() : '');
    return from && till ? `${from} - ${till}` : '—';
}

async function save() {
    submitted.value = true;
    if (!discount.value?.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Name is required', life: 3000 });
        return;
    }
    if (!discount.value.discount_plan_id?.length) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Select at least one discount plan', life: 3000 });
        return;
    }
    if (discount.value.applicable_for === 'Specific' && !productRows.value.length) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Add at least one product for Specific', life: 3000 });
        return;
    }
    if (!discount.value.days?.length) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Select at least one day', life: 3000 });
        return;
    }
    loading.value = true;
    try {
        const payload = {
            name: discount.value.name.trim(),
            discount_plan_id: discount.value.discount_plan_id,
            applicable_for: discount.value.applicable_for,
            is_active: discount.value.is_active,
            valid_from: discount.value.valid_from ? new Date(discount.value.valid_from).toISOString().slice(0, 10) : null,
            valid_till: discount.value.valid_till ? new Date(discount.value.valid_till).toISOString().slice(0, 10) : null,
            type: discount.value.type,
            value: parseFloat(discount.value.value) || 0,
            minimum_qty: parseInt(discount.value.minimum_qty, 10) || 1,
            maximum_qty: parseInt(discount.value.maximum_qty, 10) || 999999,
            days: discount.value.days,
            product_list: discount.value.applicable_for === 'Specific' ? productRows.value.map((r) => r.id) : [],
        };
        if (isEdit.value && discount.value.id) {
            const res = await api.post(`discounts/${discount.value.id}`, payload);
            if (res.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
                await fetchDiscounts();
                hideDialog();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to update', life: 3000 });
            }
        } else {
            const res = await api.post('discounts', payload);
            if (res.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
                await fetchDiscounts();
                hideDialog();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to create', life: 3000 });
            }
        }
    } catch (e) {
        const msg = e.response?.data?.message || 'Failed to save discount';
        toast.add({ severity: 'error', summary: 'Error', detail: typeof msg === 'object' ? JSON.stringify(msg) : msg, life: 3000 });
    } finally {
        loading.value = false;
    }
}

function goToDiscountPlan() {
    router.push({ name: 'discount-plan' });
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-tag text-primary"></i>
                    Discount
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage discounts and validity</p>
            </div>
            <div class="flex gap-2">
                <Button label="Discount Plan" icon="pi pi-percentage" severity="secondary" outlined @click="goToDiscountPlan" />
                <Button label="Create Discount" icon="pi pi-plus" @click="openNew" />
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <DataTable :value="discounts" stripedRows class="p-datatable-sm" scrollable>
                <template #empty>
                    <div class="text-center py-12 text-gray-500">No discounts found</div>
                </template>
                <Column field="id" header="#" style="width: 50px">
                    <template #body="slot">{{ slot.index + 1 }}</template>
                </Column>
                <Column field="name" header="Name" sortable style="min-width: 120px" />
                <Column field="value" header="Value" style="min-width: 90px">
                    <template #body="slot">{{ slot.data.value }} ({{ slot.data.type || 'percentage' }})</template>
                </Column>
                <Column header="Discount Plan" style="min-width: 140px">
                    <template #body="slot">{{ planNames(slot.data) }}</template>
                </Column>
                <Column header="Validity" style="min-width: 160px">
                    <template #body="slot">{{ validityDisplay(slot.data) }}</template>
                </Column>
                <Column field="days" header="Days" style="min-width: 80px">
                    <template #body="slot">{{ (slot.data.days || '').split(',').length }} days</template>
                </Column>
                <Column header="Products" style="min-width: 120px">
                    <template #body="slot">
                        {{ slot.data.applicable_for === 'Specific' ? (slot.data.product_list || '').toString().split(',').length + ' products' : 'All Products' }}
                    </template>
                </Column>
                <Column header="Status" style="min-width: 90px">
                    <template #body="slot">
                        <Tag :value="slot.data.is_active ? 'Active' : 'Inactive'" :severity="slot.data.is_active ? 'success' : 'secondary'" />
                    </template>
                </Column>
                <Column header="Action" style="width: 100px">
                    <template #body="slot">
                        <Button icon="pi pi-pencil" size="small" outlined severity="info" v-tooltip="'Edit'" @click="editDiscount(slot.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="discountDialog" :style="{ width: '700px' }" :header="isEdit ? 'Update Discount' : 'Create Discount'" :modal="true" :dismissableMask="true" class="max-h-[90vh] overflow-y-auto">
            <p class="text-sm italic text-gray-500 mb-4">The field labels marked with <span class="text-red-500">*</span> are required input fields.</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-semibold mb-2">Name <span class="text-red-500">*</span></label>
                    <InputText v-model="discount.name" placeholder="Discount name" class="w-full" :invalid="submitted && !discount.name" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Discount Plan <span class="text-red-500">*</span></label>
                    <MultiSelect
                        v-model="discount.discount_plan_id"
                        :options="discountPlanOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select discount plans..."
                        filter
                        class="w-full"
                        :invalid="submitted && !discount.discount_plan_id?.length"
                    />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Applicable For <span class="text-red-500">*</span></label>
                    <Select
                        v-model="discount.applicable_for"
                        :options="[{ label: 'All Products', value: 'All' }, { label: 'Specific Products', value: 'Specific' }]"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                </div>
                <div class="flex items-center gap-2 md:col-span-2">
                    <Checkbox v-model="discount.is_active" :binary="true" inputId="disc-active" />
                    <label for="disc-active" class="cursor-pointer">Active</label>
                </div>
            </div>

            <div v-show="discount.applicable_for === 'Specific'" class="mt-4 space-y-2">
                <label class="block text-sm font-semibold">Select Product</label>
                <div class="flex gap-2">
                    <InputText
                        v-model="discount.productCodeInput"
                        placeholder="Type product code, comma separated"
                        class="flex-1"
                        @keydown.enter.prevent="addProductByCode"
                    />
                    <Button label="Add" icon="pi pi-plus" @click="addProductByCode" />
                </div>
                <div v-if="productRows.length" class="border rounded p-2 max-h-32 overflow-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-1">#</th>
                                <th class="text-left py-1">Name</th>
                                <th class="text-left py-1">Code</th>
                                <th class="w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, idx) in productRows" :key="row.id" class="border-b">
                                <td class="py-1">{{ idx + 1 }}</td>
                                <td>{{ row.name }}</td>
                                <td>{{ row.code }}</td>
                                <td>
                                    <Button icon="pi pi-trash" text severity="danger" size="small" @click="removeProduct(idx)" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label class="block text-sm font-semibold mb-2">Valid From <span class="text-red-500">*</span></label>
                    <Calendar v-model="discount.valid_from" dateFormat="dd-mm-yy" class="w-full" showIcon />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Valid Till <span class="text-red-500">*</span></label>
                    <Calendar v-model="discount.valid_till" dateFormat="dd-mm-yy" class="w-full" showIcon :minDate="discount.valid_from" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Discount Type <span class="text-red-500">*</span></label>
                    <Select
                        v-model="discount.type"
                        :options="[{ label: 'Percentage (%)', value: 'percentage' }, { label: 'Flat', value: 'flat' }]"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Value <span class="text-red-500">*</span></label>
                    <InputNumber v-model="discount.value" :min="0" :maxFractionDigits="2" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Minimum Qty <span class="text-red-500">*</span></label>
                    <InputNumber v-model="discount.minimum_qty" :min="0" :minFractionDigits="0" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Maximum Qty <span class="text-red-500">*</span></label>
                    <InputNumber v-model="discount.maximum_qty" :min="0" :minFractionDigits="0" class="w-full" />
                </div>
            </div>

            <div class="mt-4">
                <label class="block text-sm font-semibold mb-2">Valid on the following days</label>
                <div class="flex flex-wrap gap-4">
                    <div v-for="opt in DAY_OPTIONS" :key="opt.value" class="flex items-center gap-2">
                        <Checkbox :modelValue="isDayChecked(opt.value)" :binary="true" :inputId="'day-' + opt.value" @update:modelValue="toggleDay(opt.value)" />
                        <label :for="'day-' + opt.value" class="cursor-pointer">{{ opt.label }}</label>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" />
                <Button :label="isEdit ? 'Update' : 'Submit'" icon="pi pi-check" :loading="loading" @click="save" />
            </template>
        </Dialog>
    </div>
</template>
