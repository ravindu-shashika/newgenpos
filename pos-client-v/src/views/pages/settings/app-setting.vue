<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const installUrl = ref('');
const appKey = ref('');
const qrUrl = ref('');
const devices = ref([]);
const loading = ref(false);

onMounted(() => fetchSetting());

async function fetchSetting() {
    try {
        const res = await api.get('settings/app');
        if (res.data?.status === 200) {
            installUrl.value = res.data.install_url || '';
            appKey.value = res.data.app_key || '';
            qrUrl.value = res.data.qr_url || '';
            devices.value = res.data.devices || [];
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load app setting', life: 3000 });
    }
}

async function deleteDevice(id) {
    if (!confirm('Are you sure you want to remove this device?')) return;
    try {
        const res = await api.get('settings/app-token-delete/' + id);
        if (res.data?.status === 200) {
            devices.value = devices.value.filter((d) => d.id !== id);
            toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to remove', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove device', life: 3000 });
    }
}

function formatDate(d) {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString() + ', ' + dt.toLocaleTimeString();
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <i class="pi pi-mobile text-primary"></i>
                App Setting
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">Connect mobile app using server URL and app key</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h5 class="font-semibold mb-4">Manual Process for connecting the Mobile App</h5>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold mb-2">Server URL</label>
                            <InputText v-model="installUrl" readonly class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2">App Key</label>
                            <InputText v-model="appKey" readonly class="w-full" />
                        </div>
                    </div>
                </div>
                <div>
                    <h5 class="font-semibold mb-4">QR Code for Connecting the Mobile App</h5>
                    <div v-if="qrUrl" class="flex justify-center p-4 bg-white rounded-lg border">
                        <img :src="'https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=' + encodeURIComponent(qrUrl)" alt="QR Code" class="w-64 h-64" />
                    </div>
                    <p v-else class="text-gray-500">No app key available</p>
                </div>
            </div>

            <hr class="my-8 border-gray-200 dark:border-gray-600" />

            <h4 class="font-semibold mb-4">Active Devices</h4>
            <DataTable :value="devices" stripedRows class="p-datatable-sm" :loading="loading">
                <template #empty>
                    <p class="text-center text-gray-500 py-4">No active devices</p>
                </template>
                <Column field="id" header="#" style="width: 50px">
                    <template #body="slot">{{ slot.index + 1 }}</template>
                </Column>
                <Column field="name" header="Name">
                    <template #body="slot">{{ slot.data.name || 'Device ' + (slot.index + 1) }}</template>
                </Column>
                <Column field="ip" header="IP">
                    <template #body="slot">{{ slot.data.ip || '-' }}</template>
                </Column>
                <Column header="Last Active">
                    <template #body="slot">{{ formatDate(slot.data.last_active) }}</template>
                </Column>
                <Column header="Action" style="width: 120px">
                    <template #body="slot">
                        <Button icon="pi pi-trash" severity="danger" size="small" outlined @click="deleteDevice(slot.data.id)" v-tooltip="'Delete'" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
