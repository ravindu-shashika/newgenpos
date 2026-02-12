<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const toast = useToast();
const route = useRoute();
const router = useRouter();
const roleId = computed(() => route.params.id);
const role = ref(null);
const allPermissions = ref([]);
const selectedPermissions = ref([]);
const selectAll = ref(false);
const loading = ref(true);
const saving = ref(false);

onMounted(async () => {
    loading.value = true;
    await Promise.all([fetchRole(), fetchPermissions(), fetchRolePermissions()]);
    loading.value = false;
});

async function fetchRole() {
    try {
        const res = await api.get(`roles/${roleId.value}`);
        if (res.data?.status === 200) {
            role.value = res.data.data;
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load role', life: 3000 });
    }
}

async function fetchPermissions() {
    try {
        const res = await api.get('permissions');
        if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to load permissions';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            allPermissions.value = [];
            return;
        }
        if (res.data?.status === 200) {
            allPermissions.value = res.data.data || [];
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to load permissions', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load permissions', life: 3000 });
    }
}

async function fetchRolePermissions() {
    try {
        const res = await api.get(`roles/${roleId.value}/permissions`);
        if (res.error) {
            const msg = res.error?.response?.data?.message || 'Failed to load role permissions';
            toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            return;
        }
        if (Array.isArray(res.data)) {
            selectedPermissions.value = [...res.data];
        } else if (res.data?.data) {
            selectedPermissions.value = Array.isArray(res.data.data) ? [...res.data.data] : [];
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load role permissions', life: 3000 });
    }
}

function getModuleName(perm) {
    const name = typeof perm === 'string' ? perm : perm.name;
    const dot = name.indexOf('.');
    const hyphen = name.lastIndexOf('-');
    if (dot > 0) return name.substring(0, dot);
    if (hyphen > 0 && /^(view|create|edit|delete|add|save|export)$/.test(name.substring(hyphen + 1))) {
        return name.substring(0, hyphen);
    }
    return name;
}

function getAction(perm) {
    const name = typeof perm === 'string' ? perm : perm.name;
    const parts = name.split(/[.-]/);
    const last = (parts[parts.length - 1] || '').toLowerCase();
    if (['view', 'index'].includes(last)) return 'view';
    if (['create', 'add', 'save'].includes(last)) return 'add';
    if (last === 'edit') return 'edit';
    if (last === 'delete') return 'delete';
    if (last === 'import' || last === 'export') return 'import';
    return 'other';
}

function findPermission(group, action) {
    return group.permissions.find((p) => getAction(p) === action);
}

const groupedPermissions = computed(() => {
    const groups = {};
    for (const p of allPermissions.value) {
        const name = p.name || p;
        const module = getModuleName(name);
        if (!groups[module]) groups[module] = [];
        groups[module].push(name);
    }
    return Object.entries(groups).map(([module, perms]) => ({
        module: module.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        permissions: perms,
    }));
});

function isChecked(perm) {
    return selectedPermissions.value.includes(perm);
}

function toggle(perm) {
    const i = selectedPermissions.value.indexOf(perm);
    if (i >= 0) selectedPermissions.value.splice(i, 1);
    else selectedPermissions.value.push(perm);
}

function toggleModule(perms) {
    const allSelected = perms.every((p) => isChecked(p));
    if (allSelected) {
        perms.forEach((p) => {
            const i = selectedPermissions.value.indexOf(p);
            if (i >= 0) selectedPermissions.value.splice(i, 1);
        });
    } else {
        perms.forEach((p) => {
            if (!selectedPermissions.value.includes(p)) selectedPermissions.value.push(p);
        });
    }
}

function toggleSelectAll() {
    if (selectAll.value) {
        selectedPermissions.value = [...allPermissions.value.map((p) => p.name || p)];
    } else {
        selectedPermissions.value = [];
    }
}

async function save() {
    saving.value = true;
    try {
        const res = await api.post(`roles/${roleId.value}/assign-permissions`, {
            permissions: selectedPermissions.value,
        });
        if (res.data?.status === 200) {
            toast.add({ severity: 'success', summary: 'Success', detail: res.data.message || 'Permissions saved', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.data?.message || 'Failed to save', life: 3000 });
        }
    } catch (e) {
        const msg = e.response?.data?.message || 'Failed to save permissions';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    } finally {
        saving.value = false;
    }
}

function goBack() {
    router.push({ name: 'role-permission' });
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-4">
                <Button icon="pi pi-arrow-left" text rounded @click="goBack" v-tooltip="'Back'" />
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {{ role?.name || 'Role' }} - Group Permission
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">Assign permissions to this role</p>
                </div>
            </div>
            <Button label="Save Permissions" icon="pi pi-check" :loading="saving" @click="save" />
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <Checkbox v-model="selectAll" :binary="true" inputId="selectAll" @update:modelValue="toggleSelectAll" />
                    <label for="selectAll" class="font-semibold cursor-pointer">Select All Permissions</label>
                </div>
            </div>

            <div v-if="loading" class="p-8 text-center">
                <ProgressSpinner style="width: 50px; height: 50px" />
                <p class="mt-2 text-gray-500">Loading permissions...</p>
            </div>
            <div v-else class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="text-left px-6 py-3 font-semibold">Module Name</th>
                            <th class="text-center px-4 py-3 font-semibold">View</th>
                            <th class="text-center px-4 py-3 font-semibold">Add</th>
                            <th class="text-center px-4 py-3 font-semibold">Edit</th>
                            <th class="text-center px-4 py-3 font-semibold">Delete</th>
                            <th class="text-center px-4 py-3 font-semibold">Import</th>
                            <th class="text-center px-4 py-3 font-semibold">Other</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="group in groupedPermissions" :key="group.module" class="border-b border-gray-200 dark:border-gray-600">
                            <td class="px-6 py-3 font-medium">
                                <div class="flex items-center gap-2">
                                    <Checkbox
                                        :modelValue="group.permissions.every((p) => isChecked(p))"
                                        :binary="true"
                                        @update:modelValue="toggleModule(group.permissions)"
                                    />
                                    {{ group.module }}
                                </div>
                            </td>
                            <td class="px-4 py-3 text-center">
                                <Checkbox
                                    v-for="p in group.permissions.filter((x) => getAction(x) === 'view')"
                                    :key="p"
                                    :modelValue="isChecked(p)"
                                    :binary="true"
                                    @update:modelValue="toggle(p)"
                                />
                            </td>
                            <td class="px-4 py-3 text-center">
                                <Checkbox
                                    v-for="p in group.permissions.filter((x) => getAction(x) === 'add')"
                                    :key="p"
                                    :modelValue="isChecked(p)"
                                    :binary="true"
                                    @update:modelValue="toggle(p)"
                                />
                            </td>
                            <td class="px-4 py-3 text-center">
                                <Checkbox
                                    v-for="p in group.permissions.filter((x) => getAction(x) === 'edit')"
                                    :key="p"
                                    :modelValue="isChecked(p)"
                                    :binary="true"
                                    @update:modelValue="toggle(p)"
                                />
                            </td>
                            <td class="px-4 py-3 text-center">
                                <Checkbox
                                    v-for="p in group.permissions.filter((x) => getAction(x) === 'delete')"
                                    :key="p"
                                    :modelValue="isChecked(p)"
                                    :binary="true"
                                    @update:modelValue="toggle(p)"
                                />
                            </td>
                            <td class="px-4 py-3 text-center">
                                <Checkbox
                                    v-for="p in group.permissions.filter((x) => getAction(x) === 'import')"
                                    :key="p"
                                    :modelValue="isChecked(p)"
                                    :binary="true"
                                    @update:modelValue="toggle(p)"
                                />
                            </td>
                            <td class="px-4 py-3 text-center">
                                <Checkbox
                                    v-for="p in group.permissions.filter((x) => getAction(x) === 'other')"
                                    :key="p"
                                    :modelValue="isChecked(p)"
                                    :binary="true"
                                    @update:modelValue="toggle(p)"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="!loading && groupedPermissions.length === 0" class="p-8 text-center text-gray-500">
                No permissions found. You may not have access to view permissions, or no permissions exist in the system.
            </div>
        </div>
    </div>
</template>
