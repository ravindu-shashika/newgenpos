<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const warehouses = ref([]);
const warehouseDialog = ref(false);
const deleteWarehouseDialog = ref(false);
const deleteWarehousesDialog = ref(false);
const warehouse = ref({});
const selectedWarehouses = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const isEdit = ref(false);

onMounted(() => {
    fetchWarehouses();
});

async function fetchWarehouses() {
    try {
        const response = await api.get('warehouses');
        if (response.data && response.data.status === 200) {
            warehouses.value = response.data.data;
        } else if (response.error) {
            const errorMsg = response.error.response?.data?.message || 'Failed to load warehouses';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to load warehouses';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
}

function openNew() {
    warehouse.value = {
        is_active: true
    };
    submitted.value = false;
    isEdit.value = false;
    warehouseDialog.value = true;
}

function hideDialog() {
    closeAndResetForm();
}

async function saveWarehouse() {
    submitted.value = true;

    if (!warehouse?.value.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Name is required', life: 3000 });
        return;
    }

    if (!warehouse?.value.phone?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Phone Number is required', life: 3000 });
        return;
    }

    if (!warehouse?.value.address?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Address is required', life: 3000 });
        return;
    }

    try {
        const data = {
            name: warehouse.value.name.trim(),
            phone: warehouse.value.phone.trim(),
            email: warehouse.value.email?.trim() || null,
            address: warehouse.value.address.trim(),
            is_active: warehouse.value.is_active ?? true
        };

        if (isEdit.value && warehouse.value.id) {
            data.id = warehouse.value.id;
        }

        const response = await api.post('save-warehouse', data);

        if (response.status === 200 && response.data.status === 200) {
            toast.add({
                severity: 'success',
                summary: 'Successful',
                detail: response.data.message,
                life: 3000
            });

            await fetchWarehouses();
            closeAndResetForm();
        } else if (response.status === 200 && response.data.status === 500) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: response.data.error || 'Failed to save warehouse',
                life: 3000
            });
        } else if (response.status === 200 && response.data.status === 400) {
            if (response.data.message && typeof response.data.message === 'object') {
                Object.values(response.data.message).forEach((error) => {
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: Array.isArray(error) ? error[0] : error,
                        life: 3000
                    });
                });
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: response.data.message || 'Failed to save warehouse',
                    life: 3000
                });
            }
        }
    } catch (error) {
        console.error('Error saving warehouse:', error);

        if (error.response && error.response.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
                Object.values(errors).forEach((errorArray) => {
                    if (Array.isArray(errorArray)) {
                        errorArray.forEach((msg) => {
                            toast.add({ severity: 'error', summary: 'Validation Error', detail: msg, life: 5000 });
                        });
                    } else {
                        toast.add({ severity: 'error', summary: 'Validation Error', detail: errorArray, life: 5000 });
                    }
                });
            } else {
                toast.add({ severity: 'error', summary: 'Validation Error', detail: error.response.data.message, life: 3000 });
            }
        } else if (error.response && error.response.status === 403) {
            toast.add({ severity: 'error', summary: 'Permission Denied', detail: error.response.data.message, life: 3000 });
        } else {
            const errorMsg = error.response?.data?.message || 'Failed to save warehouse';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    }
}

function closeAndResetForm() {
    warehouseDialog.value = false;
    warehouse.value = { is_active: true };
    submitted.value = false;
    isEdit.value = false;
}

function editWarehouse(wh) {
    warehouse.value = {
        ...wh,
        is_active: wh.is_active ? true : false
    };
    isEdit.value = true;
    warehouseDialog.value = true;
}

function confirmDeleteWarehouse(wh) {
    warehouse.value = wh;
    deleteWarehouseDialog.value = true;
}

async function handleDeleteWarehouse() {
    try {
        const response = await api.get(`delete-warehouse/${warehouse.value.id}`);
        if (response.status === 200 && response.data.status === 200) {
            warehouses.value = warehouses.value.filter((val) => val.id !== warehouse.value.id);
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
        } else {
            const errorMsg = response.data?.message || 'Failed to delete warehouse';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        console.error('Error deleting warehouse:', error);

        if (error.response && error.response.status === 400) {
            toast.add({ severity: 'warn', summary: 'Cannot Delete', detail: error.response.data.message, life: 5000 });
        } else if (error.response && error.response.status === 403) {
            toast.add({ severity: 'error', summary: 'Permission Denied', detail: error.response.data.message, life: 3000 });
        } else if (error.response && error.response.status === 404) {
            toast.add({ severity: 'error', summary: 'Not Found', detail: 'Warehouse not found', life: 3000 });
        } else {
            const errorMsg = error.response?.data?.message || 'Failed to delete warehouse';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    }
    deleteWarehouseDialog.value = false;
    warehouse.value = {};
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteWarehousesDialog.value = true;
}

function deleteSelectedWarehouses() {
    warehouses.value = warehouses.value.filter((val) => !selectedWarehouses.value.includes(val));
    deleteWarehousesDialog.value = false;
    selectedWarehouses.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Warehouses Deleted', life: 3000 });
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <!-- Page Header -->
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <i class="pi pi-building text-primary"></i>
                        Warehouse Management
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">Manage your warehouse locations and contact information</p>
                </div>
                <div class="flex gap-2">
                    <Button
                        label="Add Warehouse"
                        icon="pi pi-plus"
                        class="transition-all"
                        @click="openNew"
                    />
                </div>
            </div>
        </div>

        <!-- Main Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <!-- Toolbar -->
            <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 p-4 md:p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex-1 max-w-md">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search text-gray-400 dark:text-gray-500" />
                            </InputIcon>
                            <InputText
                                v-model="filters['global'].value"
                                placeholder="Search warehouses..."
                                class="w-full"
                            />
                        </IconField>
                    </div>

                    <div class="flex gap-2 flex-wrap">
                        <Button
                            label="Delete Selected"
                            icon="pi pi-trash"
                            severity="danger"
                            outlined
                            @click="confirmDeleteSelected"
                            :disabled="!selectedWarehouses || !selectedWarehouses.length"
                            class="transition-all"
                        />
                        <Button
                            label="Export"
                            icon="pi pi-download"
                            severity="success"
                            outlined
                            @click="exportCSV($event)"
                            class="transition-all"
                        />
                    </div>
                </div>
            </div>

            <!-- DataTable -->
            <DataTable
                ref="dt"
                v-model:selection="selectedWarehouses"
                :value="warehouses"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} warehouses"
                :globalFilterFields="['name', 'phone', 'email', 'address']"
                class="p-datatable-sm"
                stripedRows
                :loading="false"
            >
                <template #empty>
                    <div class="text-center py-12">
                        <i class="pi pi-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                        <p class="text-gray-500 dark:text-gray-400 text-lg">No warehouses found</p>
                        <Button label="Add Warehouse" icon="pi pi-plus" class="mt-4" @click="openNew" />
                    </div>
                </template>

                <Column selectionMode="multiple" headerStyle="width: 3rem" :exportable="false" class="bg-gray-50"></Column>

                <Column field="name" header="Name" sortable headerClass="font-semibold" style="min-width: 180px">
                    <template #body="slotProps">
                        <span class="font-semibold text-gray-900 dark:text-gray-100">{{ slotProps.data.name }}</span>
                    </template>
                </Column>

                <Column field="phone" header="Phone Number" sortable headerClass="font-semibold" style="min-width: 140px">
                    <template #body="slotProps">
                        <span class="text-gray-700 dark:text-gray-300">{{ slotProps.data.phone || '—' }}</span>
                    </template>
                </Column>

                <Column field="email" header="Email" sortable headerClass="font-semibold" class="hidden lg:table-cell" style="min-width: 200px">
                    <template #body="slotProps">
                        <span class="text-gray-600 dark:text-gray-400">{{ slotProps.data.email || '—' }}</span>
                    </template>
                </Column>

                <Column field="address" header="Address" sortable headerClass="font-semibold" class="hidden md:table-cell" style="min-width: 200px">
                    <template #body="slotProps">
                        <span class="text-gray-600 dark:text-gray-400 line-clamp-2">{{ slotProps.data.address || '—' }}</span>
                    </template>
                </Column>

                <Column :exportable="false" headerClass="font-semibold" header="Actions" style="width: 150px">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button
                                icon="pi pi-pencil"
                                outlined
                                rounded
                                severity="info"
                                v-tooltip.top="'Edit'"
                                class="h-10 w-10"
                                @click="editWarehouse(slotProps.data)"
                            />
                            <Button
                                icon="pi pi-trash"
                                outlined
                                rounded
                                severity="danger"
                                v-tooltip.top="'Delete'"
                                class="h-10 w-10"
                                @click="confirmDeleteWarehouse(slotProps.data)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Add/Edit Warehouse Modal -->
        <Dialog
            v-model:visible="warehouseDialog"
            :style="{ width: '550px' }"
            :modal="true"
            class="warehouse-dialog"
            :dismissableMask="true"
        >
            <template #header>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <i :class="isEdit ? 'pi pi-pencil' : 'pi pi-plus'" class="text-primary text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isEdit ? 'Edit Warehouse' : 'Add Warehouse' }}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ isEdit ? 'Update warehouse information' : 'Create a new warehouse' }}</p>
                    </div>
                </div>
            </template>

            <div class="py-4">
                <p class="text-sm italic text-gray-500 dark:text-gray-400 mb-4">The field labels marked with <span class="text-red-500">*</span> are required input fields.</p>

                <div class="space-y-5">
                    <!-- Name -->
                    <div>
                        <label for="name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Name <span class="text-red-500 dark:text-red-400">*</span>
                        </label>
                        <InputText
                            id="name"
                            v-model.trim="warehouse.name"
                            placeholder="Type WareHouse Name"
                            autofocus
                            :invalid="submitted && !warehouse.name"
                            class="w-full"
                        />
                        <small v-if="submitted && !warehouse.name" class="text-red-500 dark:text-red-400 flex items-center gap-1 mt-1">
                            <i class="pi pi-times-circle text-xs"></i>
                            Name is required
                        </small>
                    </div>

                    <!-- Phone Number -->
                    <div>
                        <label for="phone" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number <span class="text-red-500 dark:text-red-400">*</span>
                        </label>
                        <InputText
                            id="phone"
                            v-model.trim="warehouse.phone"
                            placeholder="Enter phone number"
                            :invalid="submitted && !warehouse.phone"
                            class="w-full"
                        />
                        <small v-if="submitted && !warehouse.phone" class="text-red-500 dark:text-red-400 flex items-center gap-1 mt-1">
                            <i class="pi pi-times-circle text-xs"></i>
                            Phone Number is required
                        </small>
                    </div>

                    <!-- Email -->
                    <div>
                        <label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <InputText
                            id="email"
                            v-model.trim="warehouse.email"
                            placeholder="example@example.com"
                            class="w-full"
                        />
                    </div>

                    <!-- Address -->
                    <div>
                        <label for="address" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Address <span class="text-red-500 dark:text-red-400">*</span>
                        </label>
                        <Textarea
                            id="address"
                            v-model.trim="warehouse.address"
                            placeholder="Enter warehouse address"
                            :invalid="submitted && !warehouse.address"
                            rows="3"
                            class="w-full"
                            autoResize
                        />
                        <small v-if="submitted && !warehouse.address" class="text-red-500 dark:text-red-400 flex items-center gap-1 mt-1">
                            <i class="pi pi-times-circle text-xs"></i>
                            Address is required
                        </small>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        outlined
                        severity="secondary"
                        @click="hideDialog"
                        class="px-6"
                    />
                    <Button
                        label="Submit"
                        icon="pi pi-check"
                        @click="saveWarehouse"
                        class="px-6"
                    />
                </div>
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteWarehouseDialog" :style="{ width: '450px' }" header="Confirm Delete" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-5xl text-amber-500"></i>
                <div>
                    <span v-if="warehouse">Are you sure you want to delete <strong>{{ warehouse.name }}</strong>?</span>
                </div>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteWarehouseDialog = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="handleDeleteWarehouse" />
            </template>
        </Dialog>

        <!-- Delete Selected Confirmation -->
        <Dialog v-model:visible="deleteWarehousesDialog" :style="{ width: '450px' }" header="Confirm Delete" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-5xl text-amber-500"></i>
                <div>
                    <span>Are you sure you want to delete the selected warehouses?</span>
                </div>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteWarehousesDialog = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedWarehouses" />
            </template>
        </Dialog>
    </div>
</template>
