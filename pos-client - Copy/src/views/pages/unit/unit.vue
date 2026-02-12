<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';

const toast = useToast();
const dt = ref();
const units = ref([]);
const unitDialog = ref(false);
const deleteUnitDialog = ref(false);
const deleteUnitsDialog = ref(false);
const unit = ref({});
const selectedUnits = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const isEdit = ref(false);
const baseUnits = ref([]);

onMounted(() => {
    fetchUnits();
    fetchBaseUnits();
});

async function fetchUnits() {
    try {
        const response = await api.get('units');
        if (response.data && response.data.status === 200) {
            units.value = response.data.data;
        } else if (response.error) {
            const errorMsg = response.error.response?.data?.message || 'Failed to load units';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to load units';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
}

async function fetchBaseUnits() {
    try {
        const response = await api.get('units/base');
        if (response.data && response.data.status === 200) {
            baseUnits.value = [
                { label: 'No Base Unit', value: null, id: null },
                ...response.data.data.map(u => ({ 
                    label: `${u.unit_name} (${u.unit_code})`, 
                    value: u.id, 
                    id: u.id 
                }))
            ];
        }
    } catch (error) {
        console.error('Error fetching base units:', error);
    }
}

function openNew() {
    // Reset all form fields
    unit.value = {
        is_active: true,
        operator: '*',
        operation_value: 1
    };
    submitted.value = false;
    isEdit.value = false;
    
    // Open dialog
    unitDialog.value = true;
}

function hideDialog() {
    closeAndResetForm();
}

async function saveUnit() {
    submitted.value = true;

    // Validate required fields
    if (!unit?.value.unit_code?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Unit code is required', life: 3000 });
        return;
    }

    if (!unit?.value.unit_name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Unit name is required', life: 3000 });
        return;
    }

    // Validate base unit fields
    if (unit.value.base_unit) {
        if (!unit.value.operator) {
            toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Operator is required when base unit is selected', life: 3000 });
            return;
        }
        if (!unit.value.operation_value || unit.value.operation_value <= 0) {
            toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Operation value must be greater than 0', life: 3000 });
            return;
        }
    }

    try {
        // Prepare data
        const data = {
            unit_code: unit.value.unit_code.trim(),
            unit_name: unit.value.unit_name.trim(),
            base_unit: unit.value.base_unit || null,
            operator: unit.value.operator || '*',
            operation_value: unit.value.operation_value || 1,
            is_active: unit.value.is_active ?? true
        };

        // Add ID for edit mode
        if (isEdit.value && unit.value.id) {
            data.id = unit.value.id;
        }

        // Single save endpoint for both create and edit
        const response = await api.post('save-unit', data);

        // Handle success response
        if (response.status === 200 && response.data.status === 200) {
            toast.add({ 
                severity: 'success', 
                summary: 'Successful', 
                detail: response.data.message, 
                life: 3000 
            });
            
            // Refresh data
            await fetchUnits();
            await fetchBaseUnits();
            
            // Close dialog and reset form
            closeAndResetForm();
        } else if (response.status === 200 && response.data.status === 500) {
            toast.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: response.data.error || 'Failed to save unit', 
                life: 3000 
            });
        } else if (response.status === 200 && response.data.status === 400) {
            // Handle validation errors from backend
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
                    detail: response.data.message || 'Failed to save unit', 
                    life: 3000 
                });
            }
        }
    } catch (error) {
        console.error('Error saving unit:', error);
        
        // Handle validation errors (422)
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
        } 
        // Handle permission errors (403)
        else if (error.response && error.response.status === 403) {
            toast.add({ severity: 'error', summary: 'Permission Denied', detail: error.response.data.message, life: 3000 });
        } 
        // Handle other errors
        else {
            const errorMsg = error.response?.data?.message || 'Failed to save unit';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    }
}

function closeAndResetForm() {
    // Close dialog
    unitDialog.value = false;
    
    // Reset form
    unit.value = {
        is_active: true,
        operator: '*',
        operation_value: 1
    };
    submitted.value = false;
    isEdit.value = false;
}

function editUnit(unt) {
    unit.value = { 
        ...unt,
        is_active: unt.is_active ? true : false  // Convert to boolean for toggle
    };
    isEdit.value = true;
    unitDialog.value = true;
}

function confirmDeleteUnit(unt) {
    unit.value = unt;
    deleteUnitDialog.value = true;
}

async function handleDeleteUnit() {
    try {
        const response = await api.get(`delete-unit/${unit.value.id}`);
        if (response.status === 200 && response.data.status === 200) {
            units.value = units.value.filter((val) => val.id !== unit.value.id);
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
            fetchBaseUnits(); // Refresh base units list
        } else {
            const errorMsg = response.data?.message || 'Failed to delete unit';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        console.error('Error deleting unit:', error);
        
        // Handle specific error cases
        if (error.response && error.response.status === 400) {
            toast.add({ severity: 'warn', summary: 'Cannot Delete', detail: error.response.data.message, life: 5000 });
        } else if (error.response && error.response.status === 403) {
            toast.add({ severity: 'error', summary: 'Permission Denied', detail: error.response.data.message, life: 3000 });
        } else if (error.response && error.response.status === 404) {
            toast.add({ severity: 'error', summary: 'Not Found', detail: 'Unit not found', life: 3000 });
        } else {
            const errorMsg = error.response?.data?.message || 'Failed to delete unit';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    }
    deleteUnitDialog.value = false;
    unit.value = {};
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteUnitsDialog.value = true;
}

function deleteSelectedUnits() {
    // In a real implementation, you would call the API for each selected unit
    units.value = units.value.filter((val) => !selectedUnits.value.includes(val));
    deleteUnitsDialog.value = false;
    selectedUnits.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Units Deleted', life: 3000 });
}

function getConversionDisplay(unt) {
    if (!unt.base_unit || !unt.baseUnit) {
        return 'Base Unit';
    }
    
    const operator = unt.operator === '*' ? '×' : '÷';
    return `1 ${unt.unit_code} = 1 ${operator} ${unt.operation_value} ${unt.baseUnit.unit_code}`;
}

// Computed property for operators
const operators = ref([
    { label: 'Multiply (×)', value: '*' },
    { label: 'Divide (÷)', value: '/' }
]);
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <!-- Page Header -->
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <i class="pi pi-calculator text-primary"></i>
                        Units Management
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">Define and manage measurement units for your products</p>
                </div>
                <div class="flex gap-2">
                    <Button 
                        label="New Unit" 
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
                    <!-- Search -->
                    <div class="flex-1 max-w-md">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search text-gray-400 dark:text-gray-500" />
                            </InputIcon>
                            <InputText 
                                v-model="filters['global'].value" 
                                placeholder="Search units..." 
                                class="w-full"
                            />
                        </IconField>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex gap-2 flex-wrap">
                        <Button 
                            label="Delete Selected" 
                            icon="pi pi-trash" 
                            severity="danger"
                            outlined
                            @click="confirmDeleteSelected" 
                            :disabled="!selectedUnits || !selectedUnits.length"
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
                v-model:selection="selectedUnits"
                :value="units"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} units"
                :globalFilterFields="['unit_code', 'unit_name', 'baseUnit.unit_name']"
                class="p-datatable-sm"
                stripedRows
                :loading="false"
            >
                <template #empty>
                    <div class="text-center py-12">
                        <i class="pi pi-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                        <p class="text-gray-500 dark:text-gray-400 text-lg">No units found</p>
                        <Button label="Create First Unit" icon="pi pi-plus" class="mt-4" @click="openNew" />
                    </div>
                </template>

                <!-- Columns -->
                <Column selectionMode="multiple" headerStyle="width: 3rem" :exportable="false" class="bg-gray-50"></Column>
                
                <Column field="unit_code" header="Code" sortable headerClass="font-semibold" style="min-width: 120px">
                    <template #body="slotProps">
                        <span class="font-mono font-semibold text-gray-900 dark:text-gray-100">{{ slotProps.data.unit_code }}</span>
                    </template>
                </Column>
                
                <Column field="unit_name" header="Unit Name" sortable headerClass="font-semibold" style="min-width: 200px">
                    <template #body="slotProps">
                        <div>
                            <div class="font-semibold text-gray-900 dark:text-gray-100">{{ slotProps.data.unit_name }}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {{ getConversionDisplay(slotProps.data) }}
                            </div>
                        </div>
                    </template>
                </Column>
                
                <Column header="Base Unit" sortable headerClass="font-semibold" class="hidden lg:table-cell">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.baseUnit" class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                            <i class="pi pi-link text-xs"></i>
                            {{ slotProps.data.baseUnit.unit_name }}
                        </span>
                        <span v-else class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
                            <i class="pi pi-star text-xs"></i>
                            Base
                        </span>
                    </template>
                </Column>

                <Column header="Conversion" headerClass="font-semibold" class="hidden md:table-cell" style="min-width: 150px">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.base_unit" class="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono">
                            <span>{{ slotProps.data.operator === '*' ? '×' : '÷' }}</span>
                            <span>{{ slotProps.data.operation_value }}</span>
                        </span>
                        <span v-else class="text-gray-400 dark:text-gray-500 text-xs">—</span>
                    </template>
                </Column>
                
                <Column field="is_active" header="Status" sortable headerClass="font-semibold">
                    <template #body="slotProps">
                        <Tag 
                            :value="slotProps.data.is_active ? 'Active' : 'Inactive'" 
                            :severity="slotProps.data.is_active ? 'success' : 'danger'"
                            class="font-semibold"
                        />
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
                                @click="editUnit(slotProps.data)" 
                            />
                            <Button 
                                icon="pi pi-trash" 
                                outlined 
                                rounded 
                                severity="danger"
                                v-tooltip.top="'Delete'"
                                class="h-10 w-10" 
                                @click="confirmDeleteUnit(slotProps.data)" 
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Add/Edit Unit Modal -->
        <Dialog 
            v-model:visible="unitDialog" 
            :style="{ width: '650px' }" 
            :modal="true"
            class="unit-dialog"
            :dismissableMask="true"
        >
            <template #header>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <i :class="isEdit ? 'pi pi-pencil' : 'pi pi-plus'" class="text-primary text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isEdit ? 'Edit Unit' : 'Add New Unit' }}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ isEdit ? 'Update unit information' : 'Create a new measurement unit' }}</p>
                    </div>
                </div>
            </template>

            <div class="py-4">
                <!-- Info Banner -->
                <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
                    <i class="pi pi-info-circle text-blue-500 dark:text-blue-400 mt-0.5"></i>
                    <div class="text-sm text-blue-700 dark:text-blue-300">
                        <p class="font-medium">Fields marked with <span class="text-red-500 dark:text-red-400">*</span> are required</p>
                    </div>
                </div>

                <!-- Form -->
                <div class="space-y-6">
                    <!-- Unit Code -->
                    <div>
                        <label for="unit_code" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Code <span class="text-red-500 dark:text-red-400">*</span>
                        </label>
                        <InputText 
                            id="unit_code" 
                            v-model.trim="unit.unit_code" 
                            placeholder="e.g., PC, KG, DOZ"
                            autofocus 
                            :invalid="submitted && !unit.unit_code" 
                            class="w-full uppercase"
                        />
                        <small v-if="submitted && !unit.unit_code" class="text-red-500 dark:text-red-400 flex items-center gap-1 mt-1">
                            <i class="pi pi-times-circle text-xs"></i>
                            Unit code is required
                        </small>
                    </div>

                    <!-- Unit Name -->
                    <div>
                        <label for="unit_name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Name <span class="text-red-500 dark:text-red-400">*</span>
                        </label>
                        <InputText 
                            id="unit_name" 
                            v-model.trim="unit.unit_name" 
                            placeholder="e.g., Piece, Kilogram, Dozen"
                            :invalid="submitted && !unit.unit_name" 
                            class="w-full"
                        />
                        <small v-if="submitted && !unit.unit_name" class="text-red-500 dark:text-red-400 flex items-center gap-1 mt-1">
                            <i class="pi pi-times-circle text-xs"></i>
                            Unit name is required
                        </small>
                    </div>

                    <!-- Base Unit -->
                    <div>
                        <label for="base_unit" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Base Unit
                        </label>
                        <Select 
                            id="base_unit" 
                            v-model="unit.base_unit" 
                            :options="baseUnits" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="Select base unit (optional)"
                            class="w-full"
                            showClear
                        >
                            <template #option="slotProps">
                                <div class="flex items-center gap-2">
                                    <i :class="slotProps.option.value ? 'pi pi-link' : 'pi pi-star'" class="text-xs text-gray-400 dark:text-gray-500"></i>
                                    <span>{{ slotProps.option.label }}</span>
                                </div>
                            </template>
                        </Select>
                        <small class="text-gray-500 dark:text-gray-400 mt-1 block">Select if this unit is derived from another unit</small>
                    </div>

                    <!-- Operator and Value (shown only when base unit is selected) -->
                    <div v-if="unit.base_unit" class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="operator" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Operator <span class="text-red-500 dark:text-red-400">*</span>
                            </label>
                            <Select 
                                id="operator" 
                                v-model="unit.operator" 
                                :options="operators" 
                                optionLabel="label" 
                                optionValue="value"
                                placeholder="Select operator"
                                class="w-full"
                            />
                        </div>
                        <div>
                            <label for="operation_value" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Value <span class="text-red-500 dark:text-red-400">*</span>
                            </label>
                            <InputNumber 
                                id="operation_value" 
                                v-model="unit.operation_value" 
                                placeholder="e.g., 12, 1000"
                                :min="0"
                                :minFractionDigits="0"
                                :maxFractionDigits="4"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <!-- Conversion Example -->
                    <div v-if="unit.base_unit && unit.operation_value" class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div class="flex items-start gap-3">
                            <i class="pi pi-check-circle text-green-600 dark:text-green-400 mt-0.5"></i>
                            <div class="text-sm text-green-700 dark:text-green-300">
                                <p class="font-medium mb-1">Conversion Formula:</p>
                                <p class="font-mono">
                                    1 {{ unit.unit_code || 'THIS_UNIT' }} = 
                                    1 {{ unit.operator === '*' ? '×' : '÷' }} 
                                    {{ unit.operation_value }} 
                                    {{ baseUnits.find(b => b.value === unit.base_unit)?.label.split(' ')[0] || 'BASE_UNIT' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Example Conversions -->
                    <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Example conversions:</p>
                        <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• 1 Dozen = 1 × 12 Piece</li>
                            <li>• 1 Gram = 1 ÷ 1000 Kilogram</li>
                            <li>• 1 Centimeter = 1 ÷ 100 Meter</li>
                        </ul>
                    </div>

                    <!-- Status Toggle -->
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                <i class="pi pi-check-circle text-primary"></i>
                            </div>
                            <div>
                                <label for="is_active" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Unit Status</label>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Enable or disable this unit</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <InputSwitch 
                                id="is_active" 
                                v-model="unit.is_active" 
                                :trueValue="true"
                                :falseValue="false"
                            />
                            <Tag 
                                :value="unit.is_active ? 'Active' : 'Inactive'" 
                                :severity="unit.is_active ? 'success' : 'danger'"
                                class="font-semibold"
                            />
                        </div>
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
                        :label="isEdit ? 'Update Unit' : 'Create Unit'" 
                        :icon="isEdit ? 'pi pi-check' : 'pi pi-plus'"
                        @click="saveUnit"
                        class="px-6 bg-primary hover:bg-primary-600"
                        :loading="submitted"
                    />
                </div>
            </template>
        </Dialog>

        <!-- Delete Single Unit Dialog -->
        <Dialog 
            v-model:visible="deleteUnitDialog" 
            :style="{ width: '500px' }" 
            :modal="true"
            :dismissableMask="true"
        >
            <template #header>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Deletion</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone</p>
                    </div>
                </div>
            </template>

            <div class="py-4">
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-info-circle text-red-500 dark:text-red-400 mt-1"></i>
                        <div class="text-sm text-red-700 dark:text-red-300">
                            <p class="font-medium mb-1">Warning</p>
                            <p>Deleting this unit will remove it permanently from your system.</p>
                        </div>
                    </div>
                </div>
                
                <p class="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the unit 
                    <span class="font-bold text-gray-900 dark:text-gray-100">"{{ unit.unit_name }} ({{ unit.unit_code }})"</span>?
                </p>
            </div>

            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times" 
                        outlined
                        severity="secondary"
                        @click="deleteUnitDialog = false"
                        class="px-6"
                    />
                    <Button 
                        label="Delete Unit" 
                        icon="pi pi-trash"
                        severity="danger"
                        @click="handleDeleteUnit"
                        class="px-6"
                    />
                </div>
            </template>
        </Dialog>

        <!-- Delete Multiple Units Dialog -->
        <Dialog 
            v-model:visible="deleteUnitsDialog" 
            :style="{ width: '500px' }" 
            :modal="true"
            :dismissableMask="true"
        >
            <template #header>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Multiple Units</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ selectedUnits?.length }} units selected</p>
                    </div>
                </div>
            </template>

            <div class="py-4">
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-info-circle text-red-500 dark:text-red-400 mt-1"></i>
                        <div class="text-sm text-red-700 dark:text-red-300">
                            <p class="font-medium mb-1">Warning</p>
                            <p>This will permanently delete all selected units. This action cannot be undone.</p>
                        </div>
                    </div>
                </div>
                
                <p class="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the selected units?
                </p>
            </div>

            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times" 
                        outlined
                        severity="secondary"
                        @click="deleteUnitsDialog = false"
                        class="px-6"
                    />
                    <Button 
                        label="Delete All" 
                        icon="pi pi-trash"
                        severity="danger"
                        @click="deleteSelectedUnits"
                        class="px-6"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* Custom styling for unit management - Light & Dark Mode Support */

/* Dialog styling */
.unit-dialog :deep(.p-dialog-header) {
    padding: 1.5rem;
    background: linear-gradient(to right, rgb(249 250 251), rgb(243 244 246));
    border-bottom: 1px solid rgb(229 231 235);
}

:deep(.dark) .unit-dialog :deep(.p-dialog-header) {
    background: linear-gradient(to right, rgb(31 41 55), rgb(17 24 39));
    border-bottom: 1px solid rgb(55 65 81);
}

.unit-dialog :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.unit-dialog :deep(.p-dialog-footer) {
    padding: 1.5rem;
    background-color: rgb(249 250 251);
    border-top: 1px solid rgb(229 231 235);
}

:deep(.dark) .unit-dialog :deep(.p-dialog-footer) {
    background-color: rgb(31 41 55);
    border-top: 1px solid rgb(55 65 81);
}

/* DataTable enhancements - Theme aware */
:deep(.p-datatable-header) {
    background-color: transparent;
    border: none;
    padding: 0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    background-color: rgb(249 250 251);
    color: rgb(55 65 81);
    font-weight: 600;
    border-bottom: 2px solid rgb(229 231 235);
    padding: 1rem;
}

:deep(.dark .p-datatable .p-datatable-thead > tr > th) {
    background-color: rgb(31 41 55);
    color: rgb(209 213 219);
    border-bottom: 2px solid rgb(55 65 81);
}

:deep(.p-datatable .p-datatable-tbody > tr) {
    transition: all 0.2s;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background-color: rgb(249 250 251);
}

:deep(.dark .p-datatable .p-datatable-tbody > tr:hover) {
    background-color: rgb(31 41 55);
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 1rem;
    border-bottom: 1px solid rgb(243 244 246);
}

:deep(.dark .p-datatable .p-datatable-tbody > tr > td) {
    border-bottom: 1px solid rgb(55 65 81);
}

/* Striped rows enhancement - Theme aware */
:deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
    background-color: rgb(250 250 250);
}

:deep(.dark .p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
    background-color: rgb(31 41 55 / 0.5);
}

/* Button hover effects */
:deep(.p-button) {
    transition: all 0.2s ease-in-out;
}

:deep(.p-button:hover:not(:disabled)) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.dark .p-button:hover:not(:disabled)) {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

/* Tag styling */
:deep(.p-tag) {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.025em;
}

/* InputSwitch enhancement */
:deep(.p-inputswitch.p-highlight .p-inputswitch-slider) {
    background-color: rgb(16 185 129);
}

/* Responsive dialog */
@media (max-width: 768px) {
    .unit-dialog {
        width: 95vw !important;
        max-width: 95vw !important;
    }
}

/* Search input enhancement */
:deep(.p-iconfield .p-inputtext) {
    padding-left: 2.5rem;
}

/* Loading state - Theme aware */
:deep(.p-datatable-loading-overlay) {
    background: rgba(255, 255, 255, 0.9);
}

:deep(.dark .p-datatable-loading-overlay) {
    background: rgba(17, 24, 39, 0.9);
}

/* Empty state */
:deep(.p-datatable-emptymessage) {
    padding: 3rem 1rem;
}

/* Smooth transitions */
* {
    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

/* Card shadow enhancement for dark mode */
:deep(.dark) .rounded-2xl.shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

/* Focus ring for dark mode */
:deep(.dark) .focus\:ring-primary\/20:focus {
    --tw-ring-opacity: 0.3;
}

/* Tooltip dark mode support */
:deep(.dark .p-tooltip-text) {
    background-color: rgb(31 41 55);
    border-color: rgb(55 65 81);
}

/* Badge/Tag dark mode adjustments */
:deep(.dark .p-tag.p-tag-success) {
    background-color: rgb(16 185 129 / 0.2);
    color: rgb(110 231 183);
}

:deep(.dark .p-tag.p-tag-danger) {
    background-color: rgb(239 68 68 / 0.2);
    color: rgb(252 165 165);
}

/* Scrollbar styling for dark mode */
:deep(.dark) ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

:deep(.dark) ::-webkit-scrollbar-track {
    background: rgb(31 41 55);
}

:deep(.dark) ::-webkit-scrollbar-thumb {
    background: rgb(75 85 99);
    border-radius: 4px;
}

:deep(.dark) ::-webkit-scrollbar-thumb:hover {
    background: rgb(107 114 128);
}

/* Uppercase input */
.uppercase input {
    text-transform: uppercase;
}
</style>
