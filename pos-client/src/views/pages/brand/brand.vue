<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const brands = ref([]);
const brandDialog = ref(false);
const deleteBrandDialog = ref(false);
const deleteBrandsDialog = ref(false);
const brand = ref({});
const selectedBrands = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const selectedFile = ref(null);
const isEdit = ref(false);

onMounted(() => {
    fetchBrands();
});

async function fetchBrands() {
    try {
        const response = await api.get('brands');
        if (response.data && response.data.status === 200) {
            brands.value = response.data.data;
        } else if (response.error) {
            const errorMsg = response.error.response?.data?.message || 'Failed to load brands';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to load brands';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
}

function openNew() {
    // Reset all form fields
    brand.value = {
        is_active: true  // Default to active
    };
    selectedFile.value = null;
    submitted.value = false;
    isEdit.value = false;
    
    // Reset file input
    const fileInput = document.getElementById('image');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Open dialog
    brandDialog.value = true;
}

function hideDialog() {
    closeAndResetForm();
}

async function saveBrand() {
    submitted.value = true;

    // Validate title field
    if (!brand?.value.title?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Brand title is required', life: 3000 });
        return;
    }

    try {
        // Prepare form data
        const formData = new FormData();
        formData.append('title', brand.value.title.trim());
        
        if (selectedFile.value) {
            formData.append('image', selectedFile.value);
        }

        // Add is_active (convert boolean to 1 or 0)
        formData.append('is_active', brand.value.is_active ? 1 : 0);

        // Add ID for edit mode
        if (isEdit.value && brand.value.id) {
            formData.append('id', brand.value.id);
        }

        // Single save endpoint for both create and edit
        const response = await api.post('save-brand', formData);

        // Handle success response
        if (response.status === 200 && response.data.status === 200) {
            toast.add({ 
                severity: 'success', 
                summary: 'Successful', 
                detail: response.data.message, 
                life: 3000 
            });
            
            // Refresh data
            await fetchBrands();
            
            // Close dialog and reset form
            closeAndResetForm();
        } else if (response.status === 200 && response.data.status === 500) {
            toast.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: response.data.error || 'Failed to save brand', 
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
                    detail: response.data.message || 'Failed to save brand', 
                    life: 3000 
                });
            }
        }
    } catch (error) {
        console.error('Error saving brand:', error);
        
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
            const errorMsg = error.response?.data?.message || 'Failed to save brand';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    }
}

function closeAndResetForm() {
    // Close dialog
    brandDialog.value = false;
    
    // Reset form
    brand.value = {
        is_active: true  // Reset to active by default
    };
    selectedFile.value = null;
    submitted.value = false;
    isEdit.value = false;
    
    // Reset file input if exists
    const fileInput = document.getElementById('image');
    if (fileInput) {
        fileInput.value = '';
    }
}

function editBrand(brnd) {
    brand.value = { 
        ...brnd,
        is_active: brnd.is_active ? true : false  // Convert to boolean for toggle
    };
    isEdit.value = true;
    brandDialog.value = true;
}

function confirmDeleteBrand(brnd) {
    brand.value = brnd;
    deleteBrandDialog.value = true;
}

async function handleDeleteBrand() {
    try {
        const response = await api.get(`delete-brand/${brand.value.id}`);
        if (response.status === 200 && response.data.status === 200) {
            brands.value = brands.value.filter((val) => val.id !== brand.value.id);
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
        } else {
            const errorMsg = response.data?.message || 'Failed to delete brand';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        console.error('Error deleting brand:', error);
        
        // Handle specific error cases
        if (error.response && error.response.status === 400) {
            toast.add({ severity: 'warn', summary: 'Cannot Delete', detail: error.response.data.message, life: 5000 });
        } else if (error.response && error.response.status === 403) {
            toast.add({ severity: 'error', summary: 'Permission Denied', detail: error.response.data.message, life: 3000 });
        } else if (error.response && error.response.status === 404) {
            toast.add({ severity: 'error', summary: 'Not Found', detail: 'Brand not found', life: 3000 });
        } else {
            const errorMsg = error.response?.data?.message || 'Failed to delete brand';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    }
    deleteBrandDialog.value = false;
    brand.value = {};
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteBrandsDialog.value = true;
}

function deleteSelectedBrands() {
    // In a real implementation, you would call the API for each selected brand
    brands.value = brands.value.filter((val) => !selectedBrands.value.includes(val));
    deleteBrandsDialog.value = false;
    selectedBrands.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Brands Deleted', life: 3000 });
}

function onFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
        // Create a preview URL for the image
        const reader = new FileReader();
        reader.onload = (e) => {
            brand.value.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function getImageUrl(imagePath) {
    if (!imagePath) return 'https://via.placeholder.com/64';
    // Adjust this based on your Laravel storage configuration
    return `http://127.0.0.1:8000/storage/${imagePath}`;
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <!-- Page Header -->
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <i class="pi pi-tags text-primary"></i>
                        Brands Management
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">Organize and manage your product brands</p>
                </div>
                <div class="flex gap-2">
                    <Button 
                        label="New Brand" 
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
                                placeholder="Search brands..." 
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
                            :disabled="!selectedBrands || !selectedBrands.length"
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
                v-model:selection="selectedBrands"
                :value="brands"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} brands"
                :globalFilterFields="['title']"
                class="p-datatable-sm"
                stripedRows
                :loading="false"
            >
                <template #empty>
                    <div class="text-center py-12">
                        <i class="pi pi-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                        <p class="text-gray-500 dark:text-gray-400 text-lg">No brands found</p>
                        <Button label="Create First Brand" icon="pi pi-plus" class="mt-4" @click="openNew" />
                    </div>
                </template>

                <!-- Columns -->
                <Column selectionMode="multiple" headerStyle="width: 3rem" :exportable="false" class="bg-gray-50"></Column>
                
                <Column field="id" header="ID" sortable headerClass="font-semibold" class="hidden md:table-cell">
                    <template #body="slotProps">
                        <span class="text-gray-600 dark:text-gray-400 font-mono">#{{ slotProps.data.id }}</span>
                    </template>
                </Column>
                
                <Column field="title" header="Brand" sortable headerClass="font-semibold" style="min-width: 250px">
                    <template #body="slotProps">
                        <div class="flex items-center gap-3">
                            <img 
                                :src="getImageUrl(slotProps.data.image)" 
                                :alt="slotProps.data.title" 
                                class="w-12 h-12 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                                @error="$event.target.src=''"
                            />
                            <div>
                                <div class="font-semibold text-gray-900 dark:text-gray-100">{{ slotProps.data.title }}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Created {{ new Date(slotProps.data.created_at).toLocaleDateString() }}
                                </div>
                            </div>
                        </div>
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
                                @click="editBrand(slotProps.data)" 
                            />
                            <Button 
                                icon="pi pi-trash" 
                                outlined 
                                rounded 
                                severity="danger"
                                v-tooltip.top="'Delete'"
                                class="h-10 w-10" 
                                @click="confirmDeleteBrand(slotProps.data)" 
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Add/Edit Brand Modal -->
        <Dialog 
            v-model:visible="brandDialog" 
            :style="{ width: '600px' }" 
            :modal="true"
            class="brand-dialog"
            :dismissableMask="true"
        >
            <template #header>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <i :class="isEdit ? 'pi pi-pencil' : 'pi pi-plus'" class="text-primary text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isEdit ? 'Edit Brand' : 'Add New Brand' }}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ isEdit ? 'Update brand information' : 'Create a new brand for your products' }}</p>
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
                    <!-- Brand Title -->
                    <div>
                        <label for="title" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Brand Title <span class="text-red-500 dark:text-red-400">*</span>
                        </label>
                        <InputText 
                            id="title" 
                            v-model.trim="brand.title" 
                            placeholder="Enter brand name (e.g., Nike, Samsung, Apple)"
                            autofocus 
                            :invalid="submitted && !brand.title" 
                            class="w-full"
                        />
                        <small v-if="submitted && !brand.title" class="text-red-500 dark:text-red-400 flex items-center gap-1 mt-1">
                            <i class="pi pi-times-circle text-xs"></i>
                            Brand title is required
                        </small>
                    </div>

                    <!-- Brand Image -->
                    <div>
                        <label for="image" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Brand Logo
                        </label>
                        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-primary dark:hover:border-primary transition-colors bg-gray-50 dark:bg-gray-700/30">
                            <div class="flex flex-col items-center gap-3">
                                <i class="pi pi-cloud-upload text-4xl text-gray-400 dark:text-gray-500"></i>
                                <div class="text-center">
                                    <label for="image" class="cursor-pointer">
                                        <span class="text-primary font-semibold hover:underline">Click to upload</span>
                                        <span class="text-gray-500 dark:text-gray-400"> or drag and drop</span>
                                    </label>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF up to 2MB</p>
                                </div>
                                <input 
                                    type="file" 
                                    id="image" 
                                    @change="onFileChange"
                                    accept="image/*"
                                    class="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Image Preview -->
                    <div v-if="brand.imagePreview || brand.image" class="relative">
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview</label>
                        <div class="relative inline-block">
                            <img 
                                :src="brand.imagePreview || getImageUrl(brand.image)" 
                                alt="Preview" 
                                class="rounded-lg shadow-lg max-w-full h-auto border-2 border-gray-200 dark:border-gray-600" 
                                style="max-height: 200px;"
                            />
                            <button 
                                type="button"
                                @click="brand.imagePreview = null; brand.image = null; document.getElementById('image').value = ''"
                                class="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors flex items-center justify-center"
                            >
                                <i class="pi pi-times text-sm"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Status Toggle -->
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                <i class="pi pi-check-circle text-primary"></i>
                            </div>
                            <div>
                                <label for="is_active" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Brand Status</label>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Enable or disable this brand</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <InputSwitch 
                                id="is_active" 
                                v-model="brand.is_active" 
                                :trueValue="true"
                                :falseValue="false"
                            />
                            <Tag 
                                :value="brand.is_active ? 'Active' : 'Inactive'" 
                                :severity="brand.is_active ? 'success' : 'danger'"
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
                        :label="isEdit ? 'Update Brand' : 'Create Brand'" 
                        :icon="isEdit ? 'pi pi-check' : 'pi pi-plus'"
                        @click="saveBrand"
                        class="px-6 bg-primary hover:bg-primary-600"
                        :loading="submitted"
                    />
                </div>
            </template>
        </Dialog>

        <!-- Delete Single Brand Dialog -->
        <Dialog 
            v-model:visible="deleteBrandDialog" 
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
                            <p>Deleting this brand will remove it permanently from your system.</p>
                        </div>
                    </div>
                </div>
                
                <p class="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the brand 
                    <span class="font-bold text-gray-900 dark:text-gray-100">"{{ brand.title }}"</span>?
                </p>
            </div>

            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times" 
                        outlined
                        severity="secondary"
                        @click="deleteBrandDialog = false"
                        class="px-6"
                    />
                    <Button 
                        label="Delete Brand" 
                        icon="pi pi-trash"
                        severity="danger"
                        @click="handleDeleteBrand"
                        class="px-6"
                    />
                </div>
            </template>
        </Dialog>

        <!-- Delete Multiple Brands Dialog -->
        <Dialog 
            v-model:visible="deleteBrandsDialog" 
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
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Multiple Brands</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ selectedBrands?.length }} brands selected</p>
                    </div>
                </div>
            </template>

            <div class="py-4">
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-info-circle text-red-500 dark:text-red-400 mt-1"></i>
                        <div class="text-sm text-red-700 dark:text-red-300">
                            <p class="font-medium mb-1">Warning</p>
                            <p>This will permanently delete all selected brands. This action cannot be undone.</p>
                        </div>
                    </div>
                </div>
                
                <p class="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the selected brands?
                </p>
            </div>

            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times" 
                        outlined
                        severity="secondary"
                        @click="deleteBrandsDialog = false"
                        class="px-6"
                    />
                    <Button 
                        label="Delete All" 
                        icon="pi pi-trash"
                        severity="danger"
                        @click="deleteSelectedBrands"
                        class="px-6"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* Custom styling for brand management - Light & Dark Mode Support */

/* Dialog styling */
.brand-dialog :deep(.p-dialog-header) {
    padding: 1.5rem;
    background: linear-gradient(to right, rgb(249 250 251), rgb(243 244 246));
    border-bottom: 1px solid rgb(229 231 235);
}

:deep(.dark) .brand-dialog :deep(.p-dialog-header) {
    background: linear-gradient(to right, rgb(31 41 55), rgb(17 24 39));
    border-bottom: 1px solid rgb(55 65 81);
}

.brand-dialog :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.brand-dialog :deep(.p-dialog-footer) {
    padding: 1.5rem;
    background-color: rgb(249 250 251);
    border-top: 1px solid rgb(229 231 235);
}

:deep(.dark) .brand-dialog :deep(.p-dialog-footer) {
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
    .brand-dialog {
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

/* File upload hover effect - Theme aware */
.border-dashed:hover {
    border-color: var(--primary-color);
}

/* Light mode hover */
.border-dashed:hover {
    background-color: rgb(249 250 251);
}

/* Dark mode hover */
:deep(.dark) .border-dashed:hover {
    background-color: rgb(31 41 55);
}

/* Smooth transitions */
* {
    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

/* Image border enhancement for dark mode */
:deep(.dark) img.rounded-lg {
    border-color: rgb(75 85 99);
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
</style>
