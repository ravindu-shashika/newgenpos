<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const expenseCategories = ref([]);
const categoryDialog = ref(false);
const deleteCategoryDialog = ref(false);
const category = ref({ code: '', name: '' });
const selectedCategories = ref();
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const submitted = ref(false);
const isEdit = ref(false);
const loading = ref(false);

onMounted(() => fetchCategories());

async function fetchCategories() {
    loading.value = true;
    try {
        const response = await api.get('expense-categories');
        if (response.data?.status === 200) expenseCategories.value = response.data.data || [];
        else if (response.error) toast.add({ severity: 'error', summary: 'Error', detail: response.error.response?.data?.message || 'Failed to load expense categories', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Failed to load expense categories', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function generateCode() {
    try {
        const response = await api.get('expense-categories/generate-code');
        if (response.data?.status === 200 && response.data.code) category.value.code = response.data.code;
    } catch (_) {
        category.value.code = String(Math.floor(10000000 + Math.random() * 90000000));
    }
}

function openNew() {
    category.value = { code: '', name: '' };
    submitted.value = false;
    isEdit.value = false;
    categoryDialog.value = true;
}

function editCategory(row) {
    category.value = { expense_category_id: row.id, id: row.id, code: row.code, name: row.name };
    isEdit.value = true;
    categoryDialog.value = true;
}

function hideDialog() {
    categoryDialog.value = false;
    category.value = { code: '', name: '' };
}

async function saveCategory() {
    submitted.value = true;
    if (!category.value.code?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Code is required', life: 3000 });
        return;
    }
    if (!category.value.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Name is required', life: 3000 });
        return;
    }
    try {
        if (isEdit.value && category.value.expense_category_id) {
            const response = await api.post('expense-categories/update', {
                expense_category_id: category.value.expense_category_id,
                code: category.value.code.trim(),
                name: category.value.name.trim()
            });
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchCategories();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Update failed', life: 3000 });
        } else {
            const response = await api.post('expense-categories', {
                code: category.value.code.trim(),
                name: category.value.name.trim()
            });
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchCategories();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Create failed', life: 3000 });
        }
    } catch (e) {
        const msg = e.response?.data?.message || e.response?.data?.errors?.code?.[0] || 'Save failed';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    }
}

function confirmDelete(row) {
    category.value = row;
    deleteCategoryDialog.value = true;
}

async function deleteCategory() {
    try {
        const response = await api.delete(`expense-categories/${category.value.id}`);
        if (response.data?.status === 200) {
            expenseCategories.value = expenseCategories.value.filter((c) => c.id !== category.value.id);
            toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
        } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Delete failed', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Delete failed', life: 3000 });
    }
    deleteCategoryDialog.value = false;
    category.value = {};
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
                    <i class="pi pi-tag text-primary"></i>
                    Expense Categories
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage expense categories</p>
            </div>
            <Button label="Add Expense Category" icon="pi pi-plus" @click="openNew" />
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
                v-model:selection="selectedCategories"
                :value="expenseCategories"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                :globalFilterFields="['code', 'name']"
                class="p-datatable-sm"
                stripedRows
            >
                <template #empty>
                    <div class="text-center py-12">
                        <p class="text-gray-500 dark:text-gray-400">No expense categories found.</p>
                        <Button label="Add Expense Category" icon="pi pi-plus" class="mt-4" @click="openNew" />
                    </div>
                </template>
                <Column field="code" header="Code" sortable headerClass="font-semibold" />
                <Column field="name" header="Name" sortable headerClass="font-semibold" />
                <Column :exportable="false" header="Actions" headerClass="font-semibold" style="width: 120px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" outlined rounded severity="info" v-tooltip.top="'Edit'" class="h-9 w-9" @click="editCategory(data)" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger" v-tooltip.top="'Delete'" class="h-9 w-9" @click="confirmDelete(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="categoryDialog" :style="{ width: '500px' }" :modal="true" :header="isEdit ? 'Update Expense Category' : 'Add Expense Category'" @hide="hideDialog">
            <div class="py-4 space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Code <span class="text-red-500">*</span></label>
                    <div class="flex gap-2">
                        <InputText v-model.trim="category.code" placeholder="Code" class="flex-1" :invalid="submitted && !category.code" />
                        <Button label="Generate" icon="pi pi-refresh" outlined @click="generateCode" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="category.name" placeholder="Expense category name" class="w-full" :invalid="submitted && !category.name" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="hideDialog" />
                <Button :label="isEdit ? 'Update' : 'Save'" icon="pi pi-check" @click="saveCategory" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCategoryDialog" :style="{ width: '450px' }" :modal="true" header="Confirm Delete">
            <p class="text-gray-700 dark:text-gray-300">Delete expense category <strong>{{ category.name }}</strong> ({{ category.code }})?</p>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteCategoryDialog = false" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteCategory" />
            </template>
        </Dialog>
    </div>
</template>
