<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const setting = ref({});
const customers = ref([]);
const billers = ref([]);
const warehouses = ref([]);
const options = ref([]);
const customOption = ref('');
const loading = ref(false);

const paymentOptions = ['cash', 'card', 'credit', 'cheque', 'gift_card', 'deposit', 'points', 'razorpay', 'pesapal', 'installment'];

onMounted(() => fetchSetting());

async function fetchSetting() {
    try {
        const res = await api.get('settings/pos');
        if (res.data?.status === 200) {
            setting.value = res.data.data || {};
            customers.value = res.data.customers || [];
            billers.value = res.data.billers || [];
            warehouses.value = res.data.warehouses || [];
            const opts = res.data.options || ['cash', 'card', 'credit'];
            options.value = Array.isArray(opts) ? [...opts] : (opts ? opts.split(',').filter(Boolean) : ['cash', 'card']);
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load POS setting', life: 3000 });
    }
}

function isSelected(val) {
    return options.value.includes(val);
}

function toggleOption(val) {
    const i = options.value.indexOf(val);
    if (i >= 0) options.value.splice(i, 1);
    else options.value.push(val);
}

function addCustomOption() {
    const v = customOption.value?.trim();
    if (v && !options.value.includes(v)) {
        options.value.push(v);
        customOption.value = '';
    }
}

function removeCustomOption(val) {
    if (paymentOptions.includes(val)) return;
    options.value = options.value.filter((o) => o !== val);
}

async function save() {
    if (!setting.value?.customer_id || !setting.value?.biller_id || !setting.value?.warehouse_id) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Default Customer, Biller and Warehouse are required', life: 3000 });
        return;
    }
    if (!setting.value?.product_number || setting.value.product_number < 1) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Product rows must be at least 1', life: 3000 });
        return;
    }
    loading.value = true;
    try {
        const payload = {
            customer_id: setting.value.customer_id,
            biller_id: setting.value.biller_id,
            warehouse_id: setting.value.warehouse_id,
            product_number: setting.value.product_number,
            keybord_active: !!setting.value.keybord_active,
            is_table: !!setting.value.is_table,
            send_sms: !!setting.value.send_sms,
            cash_register: !!setting.value.cash_register,
            show_print_invoice: !!setting.value.show_print_invoice,
            options: options.value
        };
        const res = await api.post('settings/pos', payload);
        if (res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to save', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save POS setting', life: 3000 });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <i class="pi pi-desktop text-primary"></i>
                POS Setting
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">Configure default options for the POS page</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <p class="text-sm italic text-gray-500 dark:text-gray-400 mb-6">The field labels marked with <span class="text-red-500">*</span> are required input fields.</p>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-semibold mb-2">Default Customer <span class="text-red-500">*</span></label>
                    <Select
                        v-model="setting.customer_id"
                        :options="customers"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select customer"
                        class="w-full"
                    >
                        <template #option="{ option }">
                            {{ option.name }} ({{ option.phone_number || '-' }})
                        </template>
                    </Select>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Default Biller <span class="text-red-500">*</span></label>
                    <Select
                        v-model="setting.biller_id"
                        :options="billers"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select biller"
                        class="w-full"
                    >
                        <template #option="{ option }">
                            {{ option.name }} ({{ option.company_name || '-' }})
                        </template>
                    </Select>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Default Warehouse <span class="text-red-500">*</span></label>
                    <Select
                        v-model="setting.warehouse_id"
                        :options="warehouses"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select warehouse"
                        class="w-full"
                    />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Displayed Number of Product Row <span class="text-red-500">*</span></label>
                    <InputNumber v-model="setting.product_number" :min="1" :max="50" class="w-full" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.keybord_active" :binary="true" inputId="keybord" />
                    <label for="keybord" class="cursor-pointer">Touchscreen keyboard</label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.is_table" :binary="true" inputId="table" />
                    <label for="table" class="cursor-pointer">Table Management</label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.send_sms" :binary="true" inputId="sms" />
                    <label for="sms" class="cursor-pointer">Send SMS After Sale</label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.cash_register" :binary="true" inputId="cash" />
                    <label for="cash" class="cursor-pointer">Cash Register</label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.show_print_invoice" :binary="true" inputId="print" />
                    <label for="print" class="cursor-pointer">Print Invoice</label>
                </div>
            </div>

            <hr class="my-6 border-gray-200 dark:border-gray-600" />

            <h4 class="font-semibold mb-4">Payment Options</h4>
            <div class="flex flex-wrap gap-4 mb-4">
                <div v-for="opt in paymentOptions" :key="opt" class="flex items-center gap-2">
                    <Checkbox :modelValue="isSelected(opt)" @update:modelValue="toggleOption(opt)" :binary="true" :inputId="'opt-' + opt" />
                    <label :for="'opt-' + opt" class="cursor-pointer capitalize">{{ opt.replace('_', ' ') }}</label>
                </div>
            </div>
            <div class="flex gap-2 flex-wrap items-center">
                <span class="text-sm font-medium">Add custom:</span>
                <InputText v-model="customOption" placeholder="Payment option name" class="w-48" @keyup.enter="addCustomOption" />
                <Button label="Add" size="small" @click="addCustomOption" />
            </div>
            <div v-if="options.filter(o => !paymentOptions.includes(o)).length" class="mt-2 flex flex-wrap gap-2">
                <Tag v-for="o in options.filter(o => !paymentOptions.includes(o))" :key="o" :value="o" :removable="true" @remove="removeCustomOption(o)" />
            </div>

            <div class="mt-6">
                <Button label="Submit" icon="pi pi-check" :loading="loading" @click="save" />
            </div>
        </div>
    </div>
</template>
