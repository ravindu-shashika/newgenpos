<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const roles = ref([]);
const roleDialog = ref(false);
const deleteDialog = ref(false);
const role = ref({});
const deleteTarget = ref(null);
const submitted = ref(false);
const loading = ref(false);
const isEdit = ref(false);

onMounted(() => fetchRoles());

async function fetchRoles() {
    try {
        const res = await api.get('roles');
        if (res.data?.status === 200) {
            roles.value = res.data.data || [];
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load roles', life: 3000 });
    }
}

function openNew() {
    role.value = { name: '', description: '' };
    submitted.value = false;
    isEdit.value = false;
    roleDialog.value = true;
}

function editRole(r) {
    role.value = { id: r.id, name: r.name, description: r.description || '' };
    isEdit.value = true;
    roleDialog.value = true;
}

function hideDialog() {
    roleDialog.value = false;
    role.value = {};
}

function goToPermissions(r) {
    router.push({ name: 'role-permission-assign', params: { id: r.id } });
}

function confirmDelete(r) {
    deleteTarget.value = r;
    deleteDialog.value = true;
}

async function save() {
    submitted.value = true;
    if (!role.value?.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Name is required', life: 3000 });
        return;
    }
    loading.value = true;
    try {
        if (isEdit.value && role.value.id) {
            const res = await api.post(`roles/${role.value.id}`, { name: role.value.name.trim(), description: role.value.description?.trim() || null });
            if (res.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
                await fetchRoles();
                hideDialog();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to update', life: 3000 });
            }
        } else {
            const res = await api.post('roles', { name: role.value.name.trim(), description: role.value.description?.trim() || null });
            if (res.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: res.data.message, life: 3000 });
                await fetchRoles();
                hideDialog();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to create', life: 3000 });
            }
        }
    } catch (e) {
        const msg = e.response?.data?.message || 'Failed to save role';
        toast.add({ severity: 'error', summary: 'Error', detail: typeof msg === 'object' ? JSON.stringify(msg) : msg, life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function handleDelete() {
    if (!deleteTarget.value) return;
    try {
        const res = await api.delete(`roles/${deleteTarget.value.id}`);
        if (res.data?.status === 200 || (res.status === 200 && !res.error)) {
            roles.value = roles.value.filter((r) => r.id !== deleteTarget.value.id);
            toast.add({ severity: 'success', summary: 'Success', detail: res.data?.message || 'Role deleted', life: 3000 });
        } else if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to delete';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to delete', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete role', life: 3000 });
    }
    deleteDialog.value = false;
    deleteTarget.value = null;
}

function canDelete(r) {
    return r.id > 2 && r.id !== 5;
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-shield text-primary"></i>
                    Role Permission
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage roles and their permissions</p>
            </div>
            <Button label="Add Role" icon="pi pi-plus" @click="openNew" />
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <DataTable :value="roles" stripedRows class="p-datatable-sm">
                <template #empty>
                    <div class="text-center py-12 text-gray-500">No roles found</div>
                </template>
                <Column field="id" header="#" style="width: 60px">
                    <template #body="slot">{{ slot.index + 1 }}</template>
                </Column>
                <Column field="name" header="Name" sortable />
                <Column field="description" header="Description">
                    <template #body="slot">{{ slot.data.description || '—' }}</template>
                </Column>
                <Column header="Action" style="width: 220px">
                    <template #body="slot">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" size="small" outlined severity="info" v-tooltip="'Edit'" @click="editRole(slot.data)" />
                            <Button icon="pi pi-lock-open" size="small" outlined severity="secondary" label="Change Permission" @click="goToPermissions(slot.data)" />
                            <Button v-if="canDelete(slot.data)" icon="pi pi-trash" size="small" outlined severity="danger" v-tooltip="'Delete'" @click="confirmDelete(slot.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="roleDialog" :style="{ width: '450px' }" :header="isEdit ? 'Update Role' : 'Add Role'" :modal="true" :dismissableMask="true">
            <p class="text-sm italic text-gray-500 mb-4">The field labels marked with <span class="text-red-500">*</span> are required input fields.</p>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold mb-2">Name <span class="text-red-500">*</span></label>
                    <InputText v-model="role.name" placeholder="Role name" class="w-full" :invalid="submitted && !role.name" />
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Description</label>
                    <Textarea v-model="role.description" rows="3" class="w-full" placeholder="Optional description" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" />
                <Button :label="isEdit ? 'Update' : 'Submit'" icon="pi pi-check" :loading="loading" @click="save" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Confirm Delete" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-5xl text-amber-500"></i>
                <span v-if="deleteTarget">Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="handleDelete" />
            </template>
        </Dialog>
    </div>
</template>
