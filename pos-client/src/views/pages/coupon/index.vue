<script setup>
import api from '@/service/api';
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';

const toast = useToast();
const dt = ref();
const coupons = ref([]);
const createDialog = ref(false);
const editDialog = ref(false);
const selectedCoupons = ref(null);
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });

const form = ref({
    id: null,
    code: '',
    type: 'percentage',
    amount: null,
    minimum_amount: null,
    quantity: 1,
    expired_date: ''
});

const submitted = ref(false);
const userVerified = ref(true);

onMounted(async () => {
    await fetchCoupons();
});

async function fetchCoupons() {
    try {
        const res = await api.get('coupons');
        if (res.status === 200 && res.data.status === 200) coupons.value = res.data.data;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Failed to load coupons', life: 3000 });
    }
}

function openCreate() {
    form.value = { id: null, code: '', type: 'percentage', amount: null, minimum_amount: null, quantity: 1, expired_date: '' };
    submitted.value = false;
    createDialog.value = true;
}

function openEdit(c) {
    form.value = { ...c };
    editDialog.value = true;
}

async function generateCode() {
    try {
        const res = await api.get('coupons/gencode');
        if (res.status === 200) form.value.code = res.data;
    } catch (err) { toast.add({ severity:'error', summary:'Error', detail:'Failed to generate code', life:3000 }); }
}

async function saveCoupon() {
    submitted.value = true;
    if (!form.value.code || !form.value.amount || !form.value.quantity) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill required fields', life: 3000 });
        return;
    }
    try {
        const res = await api.post('save-coupon', { ...form.value });
        if (res.status === 200 && res.data.status === 200) {
            toast.add({ severity:'success', summary:'Saved', detail: res.data.message || 'Saved', life:3000 });
            createDialog.value = false; editDialog.value = false; await fetchCoupons();
        } else {
            toast.add({ severity:'error', summary:'Error', detail: res.data.message || 'Save failed', life:3000 });
        }
    } catch (err) { toast.add({ severity:'error', summary:'Error', detail: err.response?.data?.message || 'Failed to save', life:3000 }); }
}

async function deleteCoupon(id) {
    if (!confirm('Are you sure want to delete?')) return;
    try {
        const res = await api.delete(`coupons/${id}`);
        if (res.status === 200 && res.data.status === 200) { toast.add({ severity:'success', summary:'Deleted', detail:res.data.message||'Deleted', life:3000 }); await fetchCoupons(); }
    } catch (err) { toast.add({ severity:'error', summary:'Error', detail: err.response?.data?.message || 'Failed to delete', life:3000 }); }
}

async function deleteSelected() {
    if (!selectedCoupons.value || !selectedCoupons.value.length) { toast.add({ severity:'warn', summary:'No selection', detail:'No coupon selected', life:3000 }); return; }
    if (!confirm('Are you sure want to delete?')) return;
    try {
        const ids = selectedCoupons.value.map(c => c.id);
        const res = await api.post('coupons/deletebyselection', { couponIdArray: ids });
        if (res.status === 200) { toast.add({ severity:'success', summary:'Deleted', detail: res.data.message || 'Deleted selected', life:3000 }); await fetchCoupons(); selectedCoupons.value = null; }
    } catch (err) { toast.add({ severity:'error', summary:'Error', detail:'Failed to delete selected', life:3000 }); }
}

function typeIsFixed() { return form.value.type === 'fixed'; }
function exportCSV() { dt.value && dt.value.exportCSV(); }

</script>

<template>
    <div class="min-h-screen p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold">Coupons</h1>
                <p class="text-gray-600 text-sm">Manage promotional coupons</p>
            </div>
            <div class="flex gap-2">
                <Button icon="pi pi-plus" label="Add Coupon" @click="openCreate" />
                <Button icon="pi pi-download" rounded severity="info" @click="exportCSV" />
                <Button icon="pi pi-trash" rounded severity="danger" v-if="selectedCoupons && selectedCoupons.length" @click="deleteSelected" />
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 p-4">
            <DataTable ref="dt" :value="coupons" v-model:selection="selectedCoupons" dataKey="id" paginator :rows="10" :filters="filters" :globalFilterFields="['code','type']" responsiveLayout="scroll">
                <Column selectionMode="multiple" headerStyle="width:3rem" />
                <Column field="code" header="Coupon Code" sortable />
                <Column field="type" header="Type">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.type" :severity="slotProps.data.type==='percentage'? 'info':'success'" />
                    </template>
                </Column>
                <Column field="amount" header="Amount" />
                <Column field="minimum_amount" header="Minimum Amount">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.minimum_amount">{{ slotProps.data.minimum_amount }}</span>
                        <span v-else>N/A</span>
                    </template>
                </Column>
                <Column field="quantity" header="Qty" />
                <Column header="Available">
                    <template #body="slotProps">
                        <Tag :value="(slotProps.data.quantity - (slotProps.data.used||0))" :severity="(slotProps.data.quantity - (slotProps.data.used||0))>0 ? 'success' : 'danger'" />
                    </template>
                </Column>
                <Column field="expired_date" header="Expired Date" />
                <Column field="created_by_name" header="Created By" />
                <Column header="Actions">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" size="small" @click="openEdit(slotProps.data)" />
                            <Button icon="pi pi-trash" size="small" severity="danger" @click="deleteCoupon(slotProps.data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="createDialog" header="Add Coupon" :modal="true" :style="{width:'600px'}">
            <form @submit.prevent="saveCoupon" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm">Coupon Code *</label>
                        <div class="flex gap-2">
                            <InputText v-model="form.code" class="w-full" />
                            <Button label="Gen" @click.prevent="generateCode" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm">Type *</label>
                        <Dropdown v-model="form.type" :options="[{label:'Percentage', value:'percentage'},{label:'Fixed', value:'fixed'}]" />
                    </div>

                    <div v-show="typeIsFixed()">
                        <label class="block text-sm">Minimum Amount *</label>
                        <InputNumber v-model="form.minimum_amount" mode="decimal" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm">Amount *</label>
                        <InputNumber v-model="form.amount" mode="decimal" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm">Qty *</label>
                        <InputNumber v-model="form.quantity" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm">Expired Date</label>
                        <Calendar v-model="form.expired_date" dateFormat="yy-mm-dd" showIcon />
                    </div>
                </div>

                <div class="flex justify-end gap-2">
                    <Button label="Cancel" severity="secondary" @click="createDialog=false" />
                    <Button label="Create" type="submit" />
                </div>
            </form>
        </Dialog>

        <Dialog v-model:visible="editDialog" header="Update Coupon" :modal="true" :style="{width:'600px'}">
            <form @submit.prevent="saveCoupon" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm">Coupon Code *</label>
                        <div class="flex gap-2">
                            <InputText v-model="form.code" class="w-full" />
                            <Button label="Gen" @click.prevent="generateCode" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm">Type *</label>
                        <Dropdown v-model="form.type" :options="[{label:'Percentage', value:'percentage'},{label:'Fixed', value:'fixed'}]" />
                    </div>

                    <div v-show="typeIsFixed()">
                        <label class="block text-sm">Minimum Amount *</label>
                        <InputNumber v-model="form.minimum_amount" mode="decimal" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm">Amount *</label>
                        <InputNumber v-model="form.amount" mode="decimal" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm">Qty *</label>
                        <InputNumber v-model="form.quantity" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm">Expired Date</label>
                        <Calendar v-model="form.expired_date" dateFormat="yy-mm-dd" showIcon />
                    </div>
                </div>

                <div class="flex justify-end gap-2">
                    <Button label="Cancel" severity="secondary" @click="editDialog=false" />
                    <Button label="Update" type="submit" />
                </div>
            </form>
        </Dialog>
    </div>
</template>

<style scoped>
/* minimal styling to match project theme */
</style>
