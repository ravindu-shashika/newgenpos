<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const billers = ref([]);
const billerDialog = ref(false);
const deleteBillerDialog = ref(false);
const deleteBillersDialog = ref(false);
const importDialog = ref(false);
const biller = ref({});
const selectedBillers = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const selectedFile = ref(null);
const isEdit = ref(false);

onMounted(() => {
    fetchBillers();
});

async function fetchBillers() {
    try {
        const response = await api.get('billers');
        if (response.data && response.data.status === 200) {
            billers.value = response.data.data;
        } else if (response.error) {
            const errorMsg = response.error.response?.data?.message || 'Failed to load billers';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to load billers';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
}

function openNew() {
    biller.value = {};
    selectedFile.value = null;
    submitted.value = false;
    isEdit.value = false;
    
    const fileInput = document.getElementById('image');
    if (fileInput) {
        fileInput.value = '';
    }
    
    billerDialog.value = true;
}

function hideDialog() {
    closeAndResetForm();
}

async function saveBiller() {
    submitted.value = true;

    // Validate required fields
    if (!biller?.value.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Name is required', life: 3000 });
        return;
    }
    if (!biller?.value.company_name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Company Name is required', life: 3000 });
        return;
    }
    if (!biller?.value.email?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Email is required', life: 3000 });
        return;
    }
    if (!biller?.value.phone_number?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Phone Number is required', life: 3000 });
        return;
    }
    if (!biller?.value.address?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Address is required', life: 3000 });
        return;
    }
    if (!biller?.value.city?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'City is required', life: 3000 });
        return;
    }

    try {
        const formData = new FormData();
        formData.append('name', biller.value.name.trim());
        formData.append('company_name', biller.value.company_name.trim());
        formData.append('email', biller.value.email.trim());
        formData.append('phone_number', biller.value.phone_number.trim());
        formData.append('address', biller.value.address.trim());
        formData.append('city', biller.value.city.trim());
        
        if (biller.value.vat_number) {
            formData.append('vat_number', biller.value.vat_number.trim());
        }
        if (biller.value.state) {
            formData.append('state', biller.value.state.trim());
        }
        if (biller.value.postal_code) {
            formData.append('postal_code', biller.value.postal_code.trim());
        }
        if (biller.value.country) {
            formData.append('country', biller.value.country.trim());
        }
        
        if (selectedFile.value) {
            formData.append('image', selectedFile.value);
        }

        if (isEdit.value && biller.value.id) {
            formData.append('id', biller.value.id);
        }

        const response = await api.post('save-biller', formData);

        if (response.status === 200 && response.data.status === 200) {
            toast.add({ 
                severity: 'success',
                summary: 'Successful',
                detail: response.data.message,
                life: 3000 
            });
            
            await fetchBillers();
            closeAndResetForm();
        } else if (response.status === 200 && response.data.status === 500) {
            toast.add({ 
                severity: 'error',
                summary: 'Error',
                detail: response.data.message,
                life: 3000 
            });
        } else if (response.status === 200 && response.data.status === 400) {
            if (response.data.message && typeof response.data.message === 'object') {
                Object.values(response.data.message).forEach(msg => {
                    toast.add({ severity: 'error', summary: 'Validation Error', detail: msg, life: 3000 });
                });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: response.data.message, life: 3000 });
            }
        }
    } catch (error) {
        console.error('Error saving biller:', error);
        
        if (error.response && error.response.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
                Object.values(errors).forEach(errorMsg => {
                    toast.add({ severity: 'error', summary: 'Validation Error', detail: errorMsg[0], life: 3000 });
                });
            }
        } else if (error.response && error.response.status === 403) {
            toast.add({ severity: 'error', summary: 'Permission Denied', detail: error.response.data.message, life: 3000 });
        } else {
            const errorMsg = error.response?.data?.message || 'Failed to save biller';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    }
}

function closeAndResetForm() {
    billerDialog.value = false;
    biller.value = {};
    selectedFile.value = null;
    submitted.value = false;
    isEdit.value = false;
    
    const fileInput = document.getElementById('image');
    if (fileInput) {
        fileInput.value = '';
    }
}

function editBiller(billerData) {
    biller.value = { ...billerData };
    isEdit.value = true;
    billerDialog.value = true;
}

function confirmDeleteBiller(billerData) {
    biller.value = billerData;
    deleteBillerDialog.value = true;
}

async function handleDeleteBiller() {
    try {
        const response = await api.get(`delete-biller/${biller.value.id}`);
        if (response.status === 200 && response.data.status === 200) {
            billers.value = billers.value.filter((val) => val.id !== biller.value.id);
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
        } else {
            const errorMsg = response.data?.message || 'Failed to delete biller';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        console.error('Error deleting biller:', error);
        
        if (error.response && error.response.status === 400) {
            toast.add({ severity: 'warn', summary: 'Cannot Delete', detail: error.response.data.message, life: 5000 });
        } else if (error.response && error.response.status === 403) {
            toast.add({ severity: 'error', summary: 'Permission Denied', detail: error.response.data.message, life: 3000 });
        } else if (error.response && error.response.status === 404) {
            toast.add({ severity: 'error', summary: 'Not Found', detail: 'Biller not found', life: 3000 });
        } else {
            const errorMsg = error.response?.data?.message || 'Failed to delete biller';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    }
    deleteBillerDialog.value = false;
    biller.value = {};
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteBillersDialog.value = true;
}

async function deleteSelectedBillers() {
    try {
        const billerIds = selectedBillers.value.map(b => b.id);
        const response = await api.post('delete-billers-batch', { ids: billerIds });
        
        if (response.status === 200 && response.data.status === 200) {
            billers.value = billers.value.filter((val) => !selectedBillers.value.includes(val));
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Billers deleted successfully', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete selected billers', life: 3000 });
    }
    deleteBillersDialog.value = false;
    selectedBillers.value = null;
}

function onFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            biller.value.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function getImageUrl(imagePath) {
    if (!imagePath) return 'https://via.placeholder.com/64';
    return `http://127.0.0.1:8000/storage/${imagePath}`;
}

async function handleImport() {
    if (!selectedFile.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please select a CSV file', life: 3000 });
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', selectedFile.value);

        const response = await api.post('import-billers', formData);
        
        if (response.status === 200 && response.data.status === 200) {
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
            selectedFile.value = null;
            importDialog.value = false;
            await fetchBillers();
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to import billers';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
}

function closeImportDialog() {
    importDialog.value = false;
    selectedFile.value = null;
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <!-- Page Header -->
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">Billers</h1>
                    <p class="text-gray-600 dark:text-gray-400">Manage and organize all your billers</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <Button 
                        icon="pi pi-plus" 
                        label="Add Biller" 
                        @click="openNew" 
                        class="p-button-rounded"
                    />
                    <Button 
                        icon="pi pi-upload" 
                        label="Import" 
                        severity="primary"
                        @click="importDialog = true"
                        class="p-button-rounded"
                    />
                </div>
            </div>
        </div>

        <!-- Main Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <!-- Toolbar -->
            <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 p-4 md:p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <InputGroup class="w-full md:w-80">
                        <InputGroupAddon>
                            <i class="pi pi-search"></i>
                        </InputGroupAddon>
                        <InputText 
                            v-model="filters['global'].value" 
                            placeholder="Search billers..." 
                            class="w-full"
                        />
                    </InputGroup>
                    <div class="flex gap-2">
                        <Button 
                            icon="pi pi-download" 
                            rounded 
                            severity="info"
                            @click="exportCSV"
                            v-tooltip="'Export CSV'"
                        />
                        <Button 
                            v-if="selectedBillers && selectedBillers.length > 0"
                            icon="pi pi-trash" 
                            rounded 
                            severity="danger"
                            @click="confirmDeleteSelected"
                            v-tooltip="'Delete Selected'"
                        />
                    </div>
                </div>
            </div>

            <!-- DataTable -->
            <DataTable
                ref="dt"
                :value="billers"
                v-model:selection="selectedBillers"
                dataKey="id"
                paginator
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} billers"
                :loading="false"
                :globalFilterFields="['name', 'company_name', 'email', 'phone_number']"
                responsiveLayout="scroll"
            >
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                
                <Column field="image" header="Image" :sortable="false">
                    <template #body="slotProps">
                        <img 
                            :src="getImageUrl(slotProps.data.image)" 
                            :alt="slotProps.data.name"
                            class="w-12 h-12 rounded-lg object-cover"
                        />
                    </template>
                </Column>

                <Column field="name" header="Name" :sortable="true" style="min-width: 150px"></Column>
                
                <Column field="company_name" header="Company Name" :sortable="true" style="min-width: 150px"></Column>
                
                <Column field="vat_number" header="VAT Number" :sortable="false" style="min-width: 120px"></Column>
                
                <Column field="email" header="Email" :sortable="true" style="min-width: 150px"></Column>
                
                <Column field="phone_number" header="Phone" :sortable="true" style="min-width: 120px"></Column>
                
                <Column field="address" header="Address" :sortable="false" style="min-width: 200px">
                    <template #body="slotProps">
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            {{ slotProps.data.address }}
                            <span v-if="slotProps.data.city">, {{ slotProps.data.city }}</span>
                            <span v-if="slotProps.data.state">, {{ slotProps.data.state }}</span>
                            <span v-if="slotProps.data.postal_code">, {{ slotProps.data.postal_code }}</span>
                            <span v-if="slotProps.data.country">, {{ slotProps.data.country }}</span>
                        </div>
                    </template>
                </Column>

                <Column header="Actions" :sortable="false" style="min-width: 120px">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button 
                                icon="pi pi-pencil" 
                                rounded 
                                severity="info" 
                                size="small"
                                @click="editBiller(slotProps.data)"
                                v-tooltip="'Edit'"
                            />
                            <Button 
                                icon="pi pi-trash" 
                                rounded 
                                severity="danger" 
                                size="small"
                                @click="confirmDeleteBiller(slotProps.data)"
                                v-tooltip="'Delete'"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Add/Edit Biller Modal -->
        <Dialog 
            v-model:visible="billerDialog" 
            :style="{ width: '600px' }" 
            :modal="true"
            class="biller-dialog"
            :dismissableMask="true"
        >
            <template #header>
                <div class="flex items-center gap-3">
                    <i :class="isEdit ? 'pi pi-pencil' : 'pi pi-plus'" class="text-xl"></i>
                    <h2 class="text-xl font-semibold">{{ isEdit ? 'Edit Biller' : 'Add New Biller' }}</h2>
                </div>
            </template>

            <form @submit.prevent="saveBiller" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <!-- Name -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Name *
                        </label>
                        <InputText 
                            v-model="biller.name" 
                            type="text"
                            class="w-full"
                            :class="{ 'ng-invalid ng-touched': submitted && !biller.name }"
                        />
                        <small v-if="submitted && !biller.name" class="text-red-600">Name is required</small>
                    </div>

                    <!-- Company Name -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Company Name *
                        </label>
                        <InputText 
                            v-model="biller.company_name" 
                            type="text"
                            class="w-full"
                            :class="{ 'ng-invalid ng-touched': submitted && !biller.company_name }"
                        />
                        <small v-if="submitted && !biller.company_name" class="text-red-600">Company name is required</small>
                    </div>

                    <!-- Email -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email *
                        </label>
                        <InputText 
                            v-model="biller.email" 
                            type="email"
                            class="w-full"
                            :class="{ 'ng-invalid ng-touched': submitted && !biller.email }"
                        />
                        <small v-if="submitted && !biller.email" class="text-red-600">Email is required</small>
                    </div>

                    <!-- VAT Number -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            VAT Number
                        </label>
                        <InputText 
                            v-model="biller.vat_number" 
                            type="text"
                            class="w-full"
                        />
                    </div>

                    <!-- Phone Number -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number *
                        </label>
                        <InputText 
                            v-model="biller.phone_number" 
                            type="text"
                            class="w-full"
                            :class="{ 'ng-invalid ng-touched': submitted && !biller.phone_number }"
                        />
                        <small v-if="submitted && !biller.phone_number" class="text-red-600">Phone number is required</small>
                    </div>

                    <!-- Address -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Address *
                        </label>
                        <InputText 
                            v-model="biller.address" 
                            type="text"
                            class="w-full"
                            :class="{ 'ng-invalid ng-touched': submitted && !biller.address }"
                        />
                        <small v-if="submitted && !biller.address" class="text-red-600">Address is required</small>
                    </div>

                    <!-- City -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            City *
                        </label>
                        <InputText 
                            v-model="biller.city" 
                            type="text"
                            class="w-full"
                            :class="{ 'ng-invalid ng-touched': submitted && !biller.city }"
                        />
                        <small v-if="submitted && !biller.city" class="text-red-600">City is required</small>
                    </div>

                    <!-- State -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            State
                        </label>
                        <InputText 
                            v-model="biller.state" 
                            type="text"
                            class="w-full"
                        />
                    </div>

                    <!-- Postal Code -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Postal Code
                        </label>
                        <InputText 
                            v-model="biller.postal_code" 
                            type="text"
                            class="w-full"
                        />
                    </div>

                    <!-- Country -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Country
                        </label>
                        <InputText 
                            v-model="biller.country" 
                            type="text"
                            class="w-full"
                        />
                    </div>

                    <!-- Image -->
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Image
                        </label>
                        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition">
                            <input 
                                id="image"
                                type="file" 
                                @change="onFileChange" 
                                accept="image/*"
                                class="hidden"
                            />
                            <label for="image" class="cursor-pointer block">
                                <div v-if="biller.imagePreview" class="mb-2">
                                    <img :src="biller.imagePreview" class="h-20 mx-auto rounded-lg" />
                                </div>
                                <i class="pi pi-cloud-upload text-2xl text-gray-600 dark:text-gray-400 mb-2" v-if="!biller.imagePreview"></i>
                                <p class="text-gray-600 dark:text-gray-400">Click to upload image</p>
                                <small class="text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 5MB</small>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="flex gap-3 justify-end pt-4">
                    <Button 
                        type="button"
                        label="Cancel" 
                        severity="secondary"
                        @click="hideDialog"
                    />
                    <Button 
                        type="submit"
                        :label="isEdit ? 'Update' : 'Create'"
                        icon="pi pi-check"
                    />
                </div>
            </form>
        </Dialog>

        <!-- Delete Single Biller Dialog -->
        <Dialog 
            v-model:visible="deleteBillerDialog" 
            :style="{ width: '450px' }" 
            header="Confirm" 
            :modal="true"
            :dismissableMask="true"
        >
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mx-3 text-4xl text-yellow-500"></i>
                <span class="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete <b>{{ biller.name }}</b>?
                </span>
            </div>
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    text
                    @click="deleteBillerDialog = false"
                />
                <Button 
                    label="Delete" 
                    icon="pi pi-check" 
                    severity="danger"
                    @click="handleDeleteBiller"
                />
            </template>
        </Dialog>

        <!-- Delete Multiple Billers Dialog -->
        <Dialog 
            v-model:visible="deleteBillersDialog" 
            :style="{ width: '450px' }" 
            header="Confirm" 
            :modal="true"
            :dismissableMask="true"
        >
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mx-3 text-4xl text-yellow-500"></i>
                <span class="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the selected billers?
                </span>
            </div>
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    text
                    @click="deleteBillersDialog = false"
                />
                <Button 
                    label="Delete" 
                    icon="pi pi-check" 
                    severity="danger"
                    @click="deleteSelectedBillers"
                />
            </template>
        </Dialog>

        <!-- Import Biller Dialog -->
        <Dialog 
            v-model:visible="importDialog" 
            :style="{ width: '500px' }" 
            header="Import Billers" 
            :modal="true"
            :dismissableMask="true"
        >
            <div class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p class="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Import Format:</strong> The correct column order is (name*, image, company_name*, vat_number, email*, phone_number*, address*, city*, state, postal_code, country)
                    </p>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Upload CSV File *
                    </label>
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition">
                        <input 
                            type="file" 
                            @change="event => {
                                if (event.target.files[0]) {
                                    selectedFile = event.target.files[0];
                                }
                            }" 
                            accept=".csv"
                            class="hidden"
                            id="importFile"
                        />
                        <label for="importFile" class="cursor-pointer block">
                            <i class="pi pi-cloud-upload text-3xl text-gray-600 dark:text-gray-400 mb-2"></i>
                            <p class="text-gray-600 dark:text-gray-400">Click to upload CSV file</p>
                            <small class="text-gray-500 dark:text-gray-500" v-if="selectedFile">
                                Selected: {{ selectedFile.name }}
                            </small>
                        </label>
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sample File
                    </label>
                    <a 
                        href="sample_file/sample_biller.csv" 
                        class="inline-block w-full text-center p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                    >
                        <i class="pi pi-download mr-2"></i>
                        Download Sample CSV
                    </a>
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Cancel" 
                    severity="secondary"
                    @click="closeImportDialog"
                />
                <Button 
                    label="Import" 
                    icon="pi pi-check"
                    @click="handleImport"
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* Custom styling for biller management - Light & Dark Mode Support */

/* Dialog styling */
.biller-dialog :deep(.p-dialog-header) {
    padding: 1.5rem;
    background: linear-gradient(to right, rgb(249 250 251), rgb(243 244 246));
    border-bottom: 1px solid rgb(229 231 235);
}

:deep(.dark) .biller-dialog :deep(.p-dialog-header) {
    background: linear-gradient(to right, rgb(31 41 55), rgb(17 24 39));
    border-bottom: 1px solid rgb(55 65 81);
}

.biller-dialog :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.biller-dialog :deep(.p-dialog-footer) {
    padding: 1.5rem;
    background-color: rgb(249 250 251);
    border-top: 1px solid rgb(229 231 235);
}

:deep(.dark) .biller-dialog :deep(.p-dialog-footer) {
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

/* InputText styling - Dark mode support */
:deep(.p-inputtext) {
    background-color: rgb(249 250 251);
    border: 1px solid rgb(229 231 235);
}

:deep(.dark .p-inputtext) {
    background-color: rgb(55 65 81);
    border: 1px solid rgb(75 85 99);
    color: rgb(240 246 252);
}

/* Responsive dialog */
@media (max-width: 768px) {
    .biller-dialog {
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

.border-dashed:hover {
    background-color: rgb(249 250 251);
}

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

/* Select dropdown dark mode */
:deep(.dark .p-select-overlay) {
    background-color: rgb(31 41 55);
    border-color: rgb(55 65 81);
}

:deep(.dark .p-select-option:hover) {
    background-color: rgb(55 65 81);
}
</style>
