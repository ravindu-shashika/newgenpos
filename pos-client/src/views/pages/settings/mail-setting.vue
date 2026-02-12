<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const setting = ref({});
const submitted = ref(false);
const loading = ref(false);

onMounted(() => fetchSetting());

async function fetchSetting() {
    try {
        const res = await api.get('settings/mail');
        if (res.data?.status === 200) {
            setting.value = res.data.data || {};
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load mail setting', life: 3000 });
    }
}

async function save() {
    submitted.value = true;
    if (!setting.value?.driver || !setting.value?.host || !setting.value?.port || !setting.value?.from_address ||
        !setting.value?.from_name || !setting.value?.username || !setting.value?.password || !setting.value?.encryption) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'All fields are required', life: 3000 });
        return;
    }
    loading.value = true;
    try {
        const res = await api.post('settings/mail', setting.value);
        if (res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to save', life: 3000 });
        }
    } catch (e) {
        const msg = e.response?.data?.message || 'Failed to save mail setting';
        toast.add({ severity: 'error', summary: 'Error', detail: typeof msg === 'object' ? JSON.stringify(msg) : msg, life: 3000 });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <i class="pi pi-envelope text-primary"></i>
                Mail Setting
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">Configure SMTP settings for sending emails</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <p class="text-sm italic text-gray-500 dark:text-gray-400 mb-4">The field labels marked with <span class="text-red-500">*</span> are required input fields.</p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-semibold mb-2">Mail Driver <span class="text-red-500">*</span></label>
                    <InputText v-model="setting.driver" placeholder="smtp" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Mail Host <span class="text-red-500">*</span></label>
                    <InputText v-model="setting.host" placeholder="smtp.example.com" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Mail Port <span class="text-red-500">*</span></label>
                    <InputText v-model="setting.port" placeholder="587" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Mail Address <span class="text-red-500">*</span></label>
                    <InputText v-model="setting.from_address" type="email" placeholder="noreply@example.com" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Mail From Name <span class="text-red-500">*</span></label>
                    <InputText v-model="setting.from_name" placeholder="Your Company" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Username <span class="text-red-500">*</span></label>
                    <InputText v-model="setting.username" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Password <span class="text-red-500">*</span></label>
                    <Password v-model="setting.password" :feedback="false" toggleMask class="w-full" inputClass="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Encryption <span class="text-red-500">*</span></label>
                    <InputText v-model="setting.encryption" placeholder="tls or ssl" class="w-full" />
                </div>
            </div>

            <div class="mt-6">
                <Button label="Submit" icon="pi pi-check" :loading="loading" @click="save" />
            </div>
        </div>
    </div>
</template>
