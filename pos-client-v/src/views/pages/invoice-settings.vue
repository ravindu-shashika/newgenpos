<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const settings = ref([]);
const settingDialog = ref(false);
const deleteSettingDialog = ref(false);
const setting = ref({});
const deleteTarget = ref(null);
const submitted = ref(false);
const isEdit = ref(false);
const logoFile = ref(null);

const invoiceTypeOptions = [
    { label: 'A4', value: 'a4' },
    { label: '58mm', value: '58mm' },
    { label: '80mm', value: '80mm' },
    { label: '88mm', value: '88mm' }
];

const numberingTypeOptions = [
    { label: 'Sequential', value: 'sequential' },
    { label: 'Random', value: 'random' }
];

const dateFormatOptions = [
    { label: 'd.m.y h:i A', value: 'd.m.y h:i A' },
    { label: 'd/m/Y H:i', value: 'd/m/Y H:i' },
    { label: 'Y-m-d H:i:s', value: 'Y-m-d H:i:s' },
    { label: 'd M Y, h:i A', value: 'd M Y, h:i A' }
];

const checkboxOptions = [
    { key: 'is_default', label: 'Default' },
    { key: 'show_barcode', label: 'Show Barcode' },
    { key: 'show_in_words', label: 'Show Amount In Words' },
    { key: 'show_bill_to_info', label: "Show 'Bill To' Info" },
    { key: 'show_footer_text', label: 'Show Footer Text' },
    { key: 'active_date_format', label: 'Active Date Format' },
    { key: 'hide_total_due', label: 'Hide Total Due' },
    { key: 'show_qr_code', label: 'Show QR Code' },
    { key: 'active_primary_color', label: 'Active Primary Color' },
    { key: 'show_biller_info', label: 'Served By' },
    { key: 'show_payment_note', label: 'Show Payment Note' },
    { key: 'active_generat_settings', label: 'Auto-Generate Invoice Number' },
    { key: 'show_vat_registration_number', label: 'Show Vat Registration Number' },
    { key: 'show_description', label: 'Show Description [58mm,80mm]' },
    { key: 'show_warehouse_info', label: 'Show Warehouse Info' },
    { key: 'show_paid_info', label: 'Show Payment Details' },
    { key: 'show_ref_number', label: 'Show Reference No' },
    { key: 'active_logo_height_width', label: 'Active Logo Height Width' },
    { key: 'show_sale_note', label: 'Show Sale Note' }
];

onMounted(() => {
    fetchSettings();
});

async function fetchSettings() {
    try {
        const response = await api.get('invoice-settings');
        if (response.data && response.data.status === 200) {
            settings.value = response.data.data;
        } else if (response.error) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load invoice settings', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load invoice settings', life: 3000 });
    }
}

function getDefaultShowColumn() {
    const obj = {};
    checkboxOptions.forEach((opt) => {
        if (opt.key === 'is_default') obj[opt.key] = false;
        else obj[opt.key] = false;
    });
    return obj;
}

function openNew() {
    setting.value = {
        template_name: '',
        prefix: '',
        numbering_type: 'sequential',
        start_number: 1,
        header_text: '',
        footer_text: '',
        size: 'a4',
        logo_height: 80,
        logo_width: 120,
        primary_color: '#1e3a5f',
        invoice_date_format: 'd.m.y h:i A',
        number_of_digit: 6,
        status: true,
        ...getDefaultShowColumn()
    };
    logoFile.value = null;
    submitted.value = false;
    isEdit.value = false;
    settingDialog.value = true;
}

function hideDialog() {
    settingDialog.value = false;
    setting.value = {};
}

function editSetting(s) {
    const showColumn = typeof s.show_column === 'string' ? JSON.parse(s.show_column || '{}') : (s.show_column || {});
    setting.value = {
        id: s.id,
        template_name: s.template_name,
        prefix: s.prefix || '',
        numbering_type: (s.numbering_type || 'sequential').toLowerCase(),
        start_number: s.start_number || 1,
        header_text: s.header_text || '',
        footer_text: s.footer_text || '',
        size: (s.size || 'a4').toLowerCase(),
        logo_height: parseInt(s.logo_height, 10) || 80,
        logo_width: parseInt(s.logo_width, 10) || 120,
        primary_color: s.primary_color || '#1e3a5f',
        invoice_date_format: s.invoice_date_format || 'd.m.y h:i A',
        number_of_digit: parseInt(s.number_of_digit, 10) || 6,
        status: s.status ? true : false,
        is_default: s.is_default ? true : false,
        show_barcode: !!showColumn.show_barcode,
        show_qr_code: !!showColumn.show_qr_code,
        show_description: !!showColumn.show_description,
        show_in_words: !!showColumn.show_in_words,
        active_primary_color: !!showColumn.active_primary_color,
        show_warehouse_info: !!showColumn.show_warehouse_info,
        show_bill_to_info: !!showColumn.show_bill_to_info,
        show_footer_text: !!showColumn.show_footer_text,
        show_biller_info: !!showColumn.show_biller_info,
        show_paid_info: !!showColumn.show_paid_info,
        show_payment_note: !!showColumn.show_payment_note,
        show_ref_number: !!showColumn.show_ref_number,
        active_date_format: !!showColumn.active_date_format,
        active_generat_settings: !!showColumn.active_generat_settings,
        active_logo_height_width: !!showColumn.active_logo_height_width,
        hide_total_due: !!showColumn.hide_total_due,
        show_vat_registration_number: !!showColumn.show_vat_registration_number,
        show_sale_note: !!showColumn.show_sale_note
    };
    logoFile.value = null;
    isEdit.value = true;
    settingDialog.value = true;
}

function onLogoChange(e) {
    const file = e.target.files?.[0];
    logoFile.value = file || null;
}

function toggleSelectAll() {
    const checked = setting.value.selectAll;
    checkboxOptions.forEach((opt) => {
        if (opt.key !== 'is_default') {
            setting.value[opt.key] = checked;
        }
    });
}

async function saveSetting() {
    submitted.value = true;

    if (!setting.value?.template_name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Template Name is required', life: 3000 });
        return;
    }
    if (!setting.value?.prefix?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Prefix is required', life: 3000 });
        return;
    }
    if (!setting.value?.numbering_type) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Numbering Type is required', life: 3000 });
        return;
    }
    if (!setting.value?.start_number || setting.value.start_number < 1) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Start Number is required', life: 3000 });
        return;
    }

    try {
        const formData = new FormData();
        formData.append('template_name', setting.value.template_name.trim());
        formData.append('prefix', setting.value.prefix.trim());
        formData.append('numbering_type', setting.value.numbering_type);
        formData.append('start_number', setting.value.start_number);
        formData.append('header_text', setting.value.header_text || '');
        formData.append('footer_text', setting.value.footer_text || '');
        formData.append('size', setting.value.size || 'a4');
        formData.append('logo_height', setting.value.logo_height ?? 80);
        formData.append('logo_width', setting.value.logo_width ?? 120);
        formData.append('primary_color', setting.value.primary_color || '');
        formData.append('invoice_date_format', setting.value.invoice_date_format || 'd.m.y h:i A');
        formData.append('number_of_digit', setting.value.number_of_digit ?? 6);
        formData.append('status', setting.value.status ? 1 : 0);
        formData.append('is_default', setting.value.is_default ? 1 : 0);

        if (isEdit.value && setting.value.id) {
            formData.append('id', setting.value.id);
        }

        if (logoFile.value) {
            formData.append('company_logo', logoFile.value);
        }

        const showColumnFields = [
            'show_barcode', 'show_qr_code', 'show_description', 'show_in_words',
            'active_primary_color', 'show_warehouse_info', 'show_bill_to_info', 'show_footer_text',
            'show_biller_info', 'show_paid_info', 'show_payment_note', 'show_ref_number',
            'active_date_format', 'active_generat_settings', 'active_logo_height_width',
            'hide_total_due', 'show_vat_registration_number', 'show_sale_note'
        ];
        showColumnFields.forEach((key) => {
            formData.append(`show_column[${key}]`, setting.value[key] ? 1 : 0);
        });

        const response = await api.post('save-invoice-setting', formData);

        if (response.status === 200 && response.data.status === 200) {
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
            await fetchSettings();
            hideDialog();
        } else if (response.status === 200 && response.data.status === 400) {
            const msg = response.data.message;
            if (typeof msg === 'object') {
                Object.values(msg).flat().forEach((m) => toast.add({ severity: 'error', summary: 'Error', detail: m, life: 3000 }));
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: msg || 'Validation failed', life: 3000 });
            }
        } else if (response.status === 200 && response.data.status === 500) {
            toast.add({ severity: 'error', summary: 'Error', detail: response.data.error || 'Failed to save', life: 3000 });
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || 'Failed to save invoice setting';
        toast.add({ severity: 'error', summary: 'Error', detail: errMsg, life: 3000 });
    }
}

function confirmDelete(s) {
    deleteTarget.value = s;
    deleteSettingDialog.value = true;
}

async function handleDelete() {
    if (!deleteTarget.value) return;
    try {
        const response = await api.get(`delete-invoice-setting/${deleteTarget.value.id}`);
        if (response.status === 200 && response.data.status === 200) {
            settings.value = settings.value.filter((x) => x.id !== deleteTarget.value.id);
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
        } else if (response.data?.status === 400) {
            toast.add({ severity: 'warn', summary: 'Cannot Delete', detail: response.data.message, life: 5000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Failed to delete', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete invoice setting', life: 3000 });
    }
    deleteSettingDialog.value = false;
    deleteTarget.value = null;
}

async function setDefault(s) {
    try {
        const response = await api.get(`set-default-invoice-setting/${s.id}`);
        if (response.status === 200 && response.data.status === 200) {
            await fetchSettings();
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Failed', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to set default', life: 3000 });
    }
}

function getSizeLabel(val) {
    const v = (val || 'a4').toLowerCase();
    if (v === 'a4') return 'a4';
    return v;
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Invoice Settings</h1>
                <Button label="Add New Invoice Setting" icon="pi pi-plus" class="transition-all" @click="openNew" />
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="text-left px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Template Name</th>
                            <th class="text-left px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Size</th>
                            <th class="text-left px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Default</th>
                            <th class="text-left px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!settings.length" class="border-b border-gray-200 dark:border-gray-600">
                            <td colspan="4" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                No invoice settings found. Click "Add New Invoice Setting" to create one.
                            </td>
                        </tr>
                        <tr
                            v-for="s in settings"
                            :key="s.id"
                            class="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                            <td class="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{{ s.template_name }}</td>
                            <td class="px-6 py-4 text-gray-600 dark:text-gray-300">{{ getSizeLabel(s.size) }}</td>
                            <td class="px-6 py-4">
                                <Button
                                    v-if="s.is_default"
                                    label="Default"
                                    size="small"
                                    severity="success"
                                    disabled
                                    class="px-4"
                                />
                                <Button
                                    v-else
                                    label="Set Default"
                                    size="small"
                                    outlined
                                    @click="setDefault(s)"
                                    class="px-4"
                                />
                            </td>
                            <td class="px-6 py-4 flex gap-2">
                                <Button label="Update" severity="warning" size="small" @click="editSetting(s)" />
                                <Button label="Delete" severity="danger" size="small" @click="confirmDelete(s)" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <Dialog v-model:visible="settingDialog" :style="{ width: '900px' }" :modal="true" :dismissableMask="true" class="invoice-setting-dialog">
            <template #header>
                <h3 class="text-xl font-bold">{{ isEdit ? 'Edit Invoice Setting' : 'Add Invoice Setting' }}</h3>
            </template>

            <div class="py-4">
                <p class="text-sm italic text-gray-500 dark:text-gray-400 mb-4">
                    The field labels marked with <span class="text-red-500">*</span> are required input fields.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-semibold mb-2">Invoice Type</label>
                        <Select v-model="setting.size" :options="invoiceTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Template Name <span class="text-red-500">*</span></label>
                        <InputText v-model.trim="setting.template_name" placeholder="Template name" :invalid="submitted && !setting.template_name" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Prefix <span class="text-red-500">*</span></label>
                        <InputText v-model.trim="setting.prefix" placeholder="e.g. INV-" :invalid="submitted && !setting.prefix" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold mb-2">Numbering Type <span class="text-red-500">*</span></label>
                        <Select v-model="setting.numbering_type" :options="numberingTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Start Number <span class="text-red-500">*</span></label>
                        <InputNumber v-model="setting.start_number" :min="1" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Header Text</label>
                        <InputText v-model.trim="setting.header_text" placeholder="Header text" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold mb-2">Footer Text</label>
                        <InputText v-model.trim="setting.footer_text" placeholder="Footer text" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Company Logo</label>
                        <input type="file" accept="image/*" @change="onLogoChange" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white file:cursor-pointer" />
                        <small class="text-gray-500 mt-1 block">Choose file (optional)</small>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Logo Height</label>
                        <InputNumber v-model="setting.logo_height" :min="1" :max="300" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold mb-2">Logo Width</label>
                        <InputNumber v-model="setting.logo_width" :min="1" :max="500" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Primary Color</label>
                        <div class="flex gap-2 items-center">
                            <input v-model="setting.primary_color" type="color" class="h-10 w-14 rounded border cursor-pointer" />
                            <InputText v-model="setting.primary_color" class="flex-1" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Invoice Date Format</label>
                        <Select v-model="setting.invoice_date_format" :options="dateFormatOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-semibold mb-2">Options</label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div v-for="opt in checkboxOptions" :key="opt.key" class="flex items-center gap-2">
                            <Checkbox v-model="setting[opt.key]" :binary="true" :inputId="opt.key" />
                            <label :for="opt.key" class="text-sm cursor-pointer">{{ opt.label }}</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="setting.selectAll" :binary="true" inputId="selectAll" @update:modelValue="toggleSelectAll" />
                            <label for="selectAll" class="text-sm cursor-pointer font-medium">Select All</label>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="hideDialog" />
                <Button label="Submit" icon="pi pi-check" @click="saveSetting" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteSettingDialog" :style="{ width: '450px' }" header="Confirm Delete" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-5xl text-amber-500"></i>
                <div>
                    <span v-if="deleteTarget">Are you sure you want to delete <strong>{{ deleteTarget.template_name }}</strong>?</span>
                </div>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteSettingDialog = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="handleDelete" />
            </template>
        </Dialog>
    </div>
</template>
