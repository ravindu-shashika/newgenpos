<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const departments = ref([]);
const departmentDialog = ref(false);
const deleteDepartmentDialog = ref(false);
const department = ref({ name: '' });
const selectedDepartments = ref();
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const submitted = ref(false);
const isEdit = ref(false);
const loading = ref(false);

onMounted(() => fetchDepartments());

async function fetchDepartments() {
    loading.value = true;
    try {
        const response = await api.get('departments');
        if (response.data?.status === 200) departments.value = response.data.data || [];
        else if (response.error) toast.add({ severity: 'error', summary: 'Error', detail: response.error.response?.data?.message || 'Failed to load departments', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Failed to load departments', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function openNew() {
    department.value = { name: '' };
    submitted.value = false;
    isEdit.value = false;
    departmentDialog.value = true;
}

function editDepartment(row) {
    department.value = { id: row.id, department_id: row.id, name: row.name };
    isEdit.value = true;
    departmentDialog.value = true;
}

function hideDialog() {
    departmentDialog.value = false;
    department.value = { name: '' };
}

async function saveDepartment() {
    submitted.value = true;
    if (!department.value.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Name is required', life: 3000 });
        return;
    }
    try {
        if (isEdit.value && department.value.department_id) {
            const response = await api.post('departments/update', { department_id: department.value.department_id, name: department.value.name.trim() });
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchDepartments();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Update failed', life: 3000 });
        } else {
            const response = await api.post('departments', { name: department.value.name.trim() });
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchDepartments();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Create failed', life: 3000 });
        }
    } catch (e) {
        const msg = e.response?.data?.message || e.response?.data?.errors?.name?.[0] || 'Save failed';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    }
}

function confirmDelete(row) {
    department.value = row;
    deleteDepartmentDialog.value = true;
}

async function deleteDepartment() {
    try {
        const response = await api.delete(`departments/${department.value.id}`);
        if (response.data?.status === 200) {
            departments.value = departments.value.filter((d) => d.id !== department.value.id);
            toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
        } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Delete failed', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Delete failed', life: 3000 });
    }
    deleteDepartmentDialog.value = false;
    department.value = {};
}

function exportCSV() {
    dt.value?.exportCSV();
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-sitemap text-primary"></i>
                    Departments
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage departments</p>
            </div>
            <Button label="Add Department" icon="pi pi-plus" @click="openNew" />
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div class="p-4 md:p-6 border-b border-gray-200 dark:border-gray-600 flex flex-wrap gap-4">
                <IconField class="flex-1 max-w-md">
                    <InputIcon><i class="pi pi-search text-gray-400" /></InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search..." class="w-full" />
                </IconField>
                <Button label="Export" icon="pi pi-download" severity="success" outlined @click="exportCSV" />
            </div>
            <DataTable
                ref="dt"
                v-model:selection="selectedDepartments"
                :value="departments"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                :globalFilterFields="['name']"
                class="p-datatable-sm"
                stripedRows
            >
                <template #empty>
                    <div class="text-center py-12">
                        <p class="text-gray-500 dark:text-gray-400">No departments found.</p>
                        <Button label="Add Department" icon="pi pi-plus" class="mt-4" @click="openNew" />
                    </div>
                </template>
                <Column field="name" header="Department" sortable headerClass="font-semibold" />
                <Column :exportable="false" header="Actions" headerClass="font-semibold" style="width: 120px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" outlined rounded severity="info" v-tooltip.top="'Edit'" class="h-9 w-9" @click="editDepartment(data)" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger" v-tooltip.top="'Delete'" class="h-9 w-9" @click="confirmDelete(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="departmentDialog" :style="{ width: '450px' }" :modal="true" :header="isEdit ? 'Update Department' : 'Add Department'" @hide="hideDialog">
            <div class="py-4">
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name <span class="text-red-500">*</span></label>
                <InputText v-model.trim="department.name" placeholder="Department name" class="w-full" :invalid="submitted && !department.name" />
                <small v-if="submitted && !department.name" class="text-red-500 mt-1">Name is required</small>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="hideDialog" />
                <Button :label="isEdit ? 'Update' : 'Save'" icon="pi pi-check" @click="saveDepartment" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDepartmentDialog" :style="{ width: '450px' }" :modal="true" header="Confirm Delete">
            <p class="text-gray-700 dark:text-gray-300">Delete department <strong>{{ department.name }}</strong>?</p>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteDepartmentDialog = false" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteDepartment" />
            </template>
        </Dialog>
    </div>
</template>
