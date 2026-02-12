<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const setting = ref({});
const currencies = ref([]);
const zones = ref([]);
const loading = ref(false);
const logoFile = ref(null);
const faviconFile = ref(null);

const staffAccessOptions = [
    { label: 'All Records', value: 'all' },
    { label: 'Own Records', value: 'own' },
    { label: 'Warehouse Wise', value: 'warehouse' }
];

const invoiceFormatOptions = [
    { label: 'Standard', value: 'standard' },
    { label: 'Indian GST', value: 'gst' }
];

const dateFormatOptions = [
    { label: 'dd-mm-yyyy', value: 'd-m-Y' },
    { label: 'dd/mm/yyyy', value: 'd/m/Y' },
    { label: 'dd.mm.yyyy', value: 'd.m.Y' },
    { label: 'mm-dd-yyyy', value: 'm-d-Y' },
    { label: 'mm/dd/yyyy', value: 'm/d/Y' },
    { label: 'yyyy-mm-dd', value: 'Y-m-d' }
];

const marginTypeOptions = [
    { label: 'Percentage', value: 0 },
    { label: 'Flat', value: 1 }
];

onMounted(() => fetchSetting());

async function fetchSetting() {
    try {
        const res = await api.get('settings/general');
        if (res.data?.status === 200) {
            setting.value = res.data.data ? { ...res.data.data } : {};
            currencies.value = res.data.currencies || [];
            zones.value = res.data.zones || [];
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load general setting', life: 3000 });
    }
}

function onLogoChange(e) {
    logoFile.value = e.target.files?.[0] || null;
}
function onFaviconChange(e) {
    faviconFile.value = e.target.files?.[0] || null;
}

async function save() {
    if (!setting.value?.site_title?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'System Title is required', life: 3000 });
        return;
    }
    loading.value = true;
    try {
        const formData = new FormData();
        const exclude = ['site_logo', 'dark_logo', 'favicon', 'is_rtl', 'is_zatca', 'disable_signup', 'disable_forgot_password', 'is_packing_slip', 'show_products_details_in_sales_table', 'show_products_details_in_purchase_table', 'without_stock'];
        Object.keys(setting.value).forEach((k) => {
            if (exclude.includes(k)) return;
            const v = setting.value[k];
            if (v !== null && v !== undefined && v !== '') formData.append(k, v);
        });
        formData.append('is_rtl', setting.value.is_rtl ? 1 : 0);
        formData.append('is_zatca', setting.value.is_zatca ? 1 : 0);
        formData.append('disable_signup', setting.value.disable_signup ? 1 : 0);
        formData.append('disable_forgot_password', setting.value.disable_forgot_password ? 1 : 0);
        formData.append('is_packing_slip', setting.value.is_packing_slip ? 1 : 0);
        formData.append('show_products_details_in_sales_table', setting.value.show_products_details_in_sales_table ? 1 : 0);
        formData.append('show_products_details_in_purchase_table', setting.value.show_products_details_in_purchase_table ? 1 : 0);
        formData.append('without_stock', setting.value.without_stock === 'yes' ? 'yes' : 'no');
        if (logoFile.value) formData.append('site_logo', logoFile.value);
        if (faviconFile.value) formData.append('favicon', faviconFile.value);

        const res = await api.post('settings/general', formData);
        if (res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
            logoFile.value = null;
            faviconFile.value = null;
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to save', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save general setting', life: 3000 });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <i class="pi pi-wrench text-primary"></i>
                General Setting
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">Configure system-wide settings</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <p class="text-sm italic text-gray-500 dark:text-gray-400 mb-6">The field labels marked with <span class="text-red-500">*</span> are required input fields.</p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-semibold mb-2">System Title <span class="text-red-500">*</span></label>
                    <InputText v-model="setting.site_title" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">System Logo</label>
                    <input type="file" accept="image/*" @change="onLogoChange" class="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Favicon</label>
                    <input type="file" accept="image/*" @change="onFaviconChange" class="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white" />
                </div>
                <div class="flex items-center gap-2 col-span-2">
                    <Checkbox v-model="setting.is_rtl" :binary="true" inputId="rtl" />
                    <label for="rtl" class="cursor-pointer">RTL Layout</label>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Company Name</label>
                    <InputText v-model="setting.company_name" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">VAT Registration Number</label>
                    <InputText v-model="setting.vat_registration_number" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Currency <span class="text-red-500">*</span></label>
                    <Select v-model="setting.currency" :options="currencies" optionLabel="name" optionValue="id" class="w-full" placeholder="Select currency" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Currency Position</label>
                    <div class="flex gap-4">
                        <div class="flex items-center gap-2">
                            <RadioButton v-model="setting.currency_position" inputId="prefix" value="prefix" />
                            <label for="prefix">Prefix</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <RadioButton v-model="setting.currency_position" inputId="suffix" value="suffix" />
                            <label for="suffix">Suffix</label>
                        </div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Digits after decimal point</label>
                    <InputNumber v-model="setting.decimal" :min="0" :max="6" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Staff Access</label>
                    <Select v-model="setting.staff_access" :options="staffAccessOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Invoice Format</label>
                    <Select v-model="setting.invoice_format" :options="invoiceFormatOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Date Format</label>
                    <Select v-model="setting.date_format" :options="dateFormatOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Timezone</label>
                    <Select v-model="setting.timezone" :options="zones" optionLabel="zone" optionValue="zone" class="w-full" placeholder="Select timezone" filter>
                        <template #option="{ option }">
                            {{ option.diff_from_GMT }} - {{ option.zone }}
                        </template>
                    </Select>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Expiry alert days</label>
                    <InputNumber v-model="setting.expiry_alert_days" :min="0" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Developed By</label>
                    <InputText v-model="setting.developed_by" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Profit margin type</label>
                    <Select v-model="setting.margin_type" :options="marginTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Default Profit Margin Value</label>
                    <InputNumber v-model="setting.default_margin_value" :min="0" class="w-full" />
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox :modelValue="setting.without_stock === 'yes'" @update:modelValue="(v) => setting.without_stock = v ? 'yes' : 'no'" :binary="true" inputId="ws" />
                    <label for="ws" class="cursor-pointer">Sale and Quotation without stock (Yes)</label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.is_packing_slip" :binary="true" inputId="ps" />
                    <label for="ps" class="cursor-pointer">Packing Slip to manage orders/sales</label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.show_products_details_in_purchase_table" :binary="true" inputId="pd1" />
                    <label for="pd1" class="cursor-pointer">Show Products Details in Purchase List</label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.show_products_details_in_sales_table" :binary="true" inputId="pd2" />
                    <label for="pd2" class="cursor-pointer">Show Products Details in Sales List</label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.disable_signup" :binary="true" inputId="ds" />
                    <label for="ds" class="cursor-pointer">Disable registration</label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox v-model="setting.disable_forgot_password" :binary="true" inputId="df" />
                    <label for="df" class="cursor-pointer">Disable password reset</label>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Maintenance allowed IPs</label>
                    <InputText v-model="setting.maintenance_allowed_ips" placeholder="127.0.0.1, 192.168.1.1" class="w-full" />
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-semibold mb-2">Font CSS</label>
                    <Textarea v-model="setting.font_css" rows="3" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Auth pages CSS</label>
                    <Textarea v-model="setting.auth_css" rows="3" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">POS page CSS</label>
                    <Textarea v-model="setting.pos_css" rows="3" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Custom CSS</label>
                    <Textarea v-model="setting.custom_css" rows="3" class="w-full" />
                </div>
            </div>

            <Button label="Submit" icon="pi pi-check" :loading="loading" @click="save" />
        </div>
    </div>
</template>
