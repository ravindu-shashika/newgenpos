<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const setting = ref({});
const submitted = ref(false);
const loading = ref(false);

const typeOptions = [
    { label: 'Days', value: 'days' },
    { label: 'Months', value: 'months' },
    { label: 'Years', value: 'years' }
];

onMounted(() => fetchSetting());

async function fetchSetting() {
    try {
        const res = await api.get('settings/reward-point');
        if (res.data?.status === 200) {
            setting.value = { ...(res.data.data || {}), is_active: !!res.data.data?.is_active };
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load reward point setting', life: 3000 });
    }
}

async function save() {
    submitted.value = true;
    if (!setting.value?.per_point_amount && setting.value?.per_point_amount !== 0) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Sold amount per point is required', life: 3000 });
        return;
    }
    if (!setting.value?.minimum_amount && setting.value?.minimum_amount !== 0) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Minimum sold amount is required', life: 3000 });
        return;
    }
    loading.value = true;
    try {
        const payload = {
            is_active: !!setting.value.is_active,
            per_point_amount: Number(setting.value.per_point_amount) || 0,
            minimum_amount: Number(setting.value.minimum_amount) || 0,
            duration: setting.value.duration ? Number(setting.value.duration) : null,
            type: setting.value.type || 'days',
            redeem_amount_per_unit_rp: setting.value.redeem_amount_per_unit_rp ? Number(setting.value.redeem_amount_per_unit_rp) : null,
            min_order_total_for_redeem: setting.value.min_order_total_for_redeem ? Number(setting.value.min_order_total_for_redeem) : null,
            min_redeem_point: setting.value.min_redeem_point ? Number(setting.value.min_redeem_point) : null,
            max_redeem_point: setting.value.max_redeem_point ? Number(setting.value.max_redeem_point) : null
        };
        const res = await api.post('settings/reward-point', payload);
        if (res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to save', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save reward point setting', life: 3000 });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <i class="pi pi-star text-primary"></i>
                Reward Point Setting
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">Configure reward points for customer purchases</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <p class="text-sm italic text-gray-500 dark:text-gray-400 mb-6">The field labels marked with <span class="text-red-500">*</span> are required input fields.</p>

            <div class="space-y-6">
                <div class="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Checkbox v-model="setting.is_active" :binary="true" inputId="is_active" />
                    <label for="is_active" class="font-medium cursor-pointer">Active reward point</label>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-semibold mb-2">Sold amount per point <span class="text-red-500">*</span></label>
                        <InputNumber v-model="setting.per_point_amount" :min="0" class="w-full" />
                        <small class="text-gray-500">e.g. 100 = 1 point per 100 spent</small>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Minimum sold amount to get point <span class="text-red-500">*</span></label>
                        <InputNumber v-model="setting.minimum_amount" :min="0" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Point Expiry Duration</label>
                        <InputNumber v-model="setting.duration" :min="0" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Duration Type</label>
                        <Select v-model="setting.type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                </div>

                <hr class="border-gray-200 dark:border-gray-600" />

                <h4 class="font-semibold">Redeem Points Settings</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-semibold mb-2">Redeem amount per unit point</label>
                        <InputNumber v-model="setting.redeem_amount_per_unit_rp" :min="0" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Minimum order total to redeem points</label>
                        <InputNumber v-model="setting.min_order_total_for_redeem" :min="0" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Minimum redeem point</label>
                        <InputNumber v-model="setting.min_redeem_point" :min="0" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Maximum redeem point per order</label>
                        <InputNumber v-model="setting.max_redeem_point" :min="0" class="w-full" />
                    </div>
                </div>
            </div>

            <div class="mt-6">
                <Button label="Submit" icon="pi pi-check" :loading="loading" @click="save" />
            </div>
        </div>
    </div>
</template>
