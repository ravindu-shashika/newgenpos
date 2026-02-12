<script setup>
import { ref, onMounted } from 'vue';
import DataTable from '@/components/DataTable.vue';
import { useToast } from 'primevue/usetoast';
import api from '@/service/api';

const toast = useToast();
const data = ref([]);
const loading = ref(false);
const showModal = ref(false);
const deleteDialog = ref(false);
const selectedItem = ref({});
const submitted = ref(false);

// Column configuration
const columns = [
    {
        field: 'code',
        header: 'Code',
        sortable: true,
        headerStyle: 'width:20%; min-width:10rem;'
    },
    {
        field: 'name',
        header: 'Name',
        sortable: true,
        headerStyle: 'width:40%; min-width:15rem;'
    },
    {
        field: 'description',
        header: 'Description',
        sortable: true,
        headerStyle: 'width:40%; min-width:15rem;'
    }
];

// Fetch data from API
const fetchData = async () => {
    loading.value = true;
    try {
        const response = await api.get('categories');
        data.value = response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to fetch categories', 
            life: 3000 
        });
    } finally {
        loading.value = false;
    }
};

// Generate new category code
const generateCode = async () => {
    try {
        const response = await api.get('categories/new-code');
        return response.data.code;
    } catch (error) {
        console.error('Error generating code:', error);
        return '';
    }
};

// Open dialog for new category
const openNew = async () => {
    const code = await generateCode();
    selectedItem.value = { code: code };
    submitted.value = false;
    showModal.value = true;
};

// Handle edit button click
const handleEdit = (rowData) => {
    selectedItem.value = { ...rowData };
    showModal.value = true;
};

// Handle delete button click
const handleDelete = (rowData) => {
    selectedItem.value = rowData;
    deleteDialog.value = true;
};

// Hide dialog
const hideDialog = () => {
    showModal.value = false;
    submitted.value = false;
    selectedItem.value = {};
};

// Save category (create or update)
const save = async () => {
    submitted.value = true;

    // Validation
    if (!selectedItem.value.code || !selectedItem.value.name) {
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Please fill all required fields', 
            life: 3000 
        });
        return;
    }

    try {
        const response = await api.post('save-categories', selectedItem.value);

        if (response.status === 200 && response.data.status === 200) {
            toast.add({ 
                severity: 'success', 
                summary: 'Successful', 
                detail: response.data.message, 
                life: 3000 
            });
            hideDialog();
            fetchData();
        } else if (response.status === 200 && response.data.status === 400) {
            // Handle validation errors
            Object.values(response.data.message).forEach((error) => {
                toast.add({ 
                    severity: 'error', 
                    summary: 'Validation Error', 
                    detail: error[0], 
                    life: 3000 
                });
            });
        } else {
            toast.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Failed to save category', 
                life: 3000 
            });
        }
    } catch (error) {
        console.error('Error saving:', error);
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to save category', 
            life: 3000 
        });
    }
};

// Delete category
const confirmDelete = async () => {
    try {
        const response = await api.delete(`categories/${selectedItem.value.id}`);
        
        if (response.status === 200) {
            toast.add({ 
                severity: 'success', 
                summary: 'Successful', 
                detail: 'Category deleted successfully', 
                life: 3000 
            });
            deleteDialog.value = false;
            selectedItem.value = {};
            fetchData();
        }
    } catch (error) {
        console.error('Error deleting:', error);
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to delete category', 
            life: 3000 
        });
    }
};

// Load data on mount
onMounted(() => {
    fetchData();
});
</script>

<template>
    <div>
        <!-- DataTable Component -->
        <DataTable
            :data="data"
            :columns="columns"
            :loading="loading"
            controller="categories"
            exportFilename="categories"
            @edit="handleEdit"
            @delete="handleDelete"
        >
            <!-- Custom Title -->
            <template #title>
                <i class="pi pi-tags mr-2"></i>
                Category Management
            </template>
            
            <!-- Add New Button in Header -->
            <template #header-actions>
                <Button 
                    label="Add Category" 
                    icon="pi pi-plus" 
                    @click="openNew" 
                    severity="success"
                />
            </template>
        </DataTable>

        <!-- Add/Edit Dialog -->
        <Dialog 
            v-model:visible="showModal" 
            :header="selectedItem.id ? 'Edit Category' : 'Add New Category'" 
            :modal="true" 
            class="p-fluid" 
            style="width: 450px"
        >
            <div class="field mt-4">
                <label for="code" class="font-semibold">Code <span class="text-red-500">*</span></label>
                <InputText 
                    id="code" 
                    v-model="selectedItem.code" 
                    required 
                    :class="{ 'p-invalid': submitted && !selectedItem.code }"
                    placeholder="Enter category code"
                />
                <small v-if="submitted && !selectedItem.code" class="p-error">Code is required.</small>
            </div>

            <div class="field">
                <label for="name" class="font-semibold">Name <span class="text-red-500">*</span></label>
                <InputText 
                    id="name" 
                    v-model="selectedItem.name" 
                    required 
                    :class="{ 'p-invalid': submitted && !selectedItem.name }"
                    placeholder="Enter category name"
                />
                <small v-if="submitted && !selectedItem.name" class="p-error">Name is required.</small>
            </div>

            <div class="field">
                <label for="description" class="font-semibold">Description</label>
                <Textarea 
                    id="description" 
                    v-model="selectedItem.description" 
                    rows="4" 
                    placeholder="Enter description (optional)"
                />
            </div>

            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    text 
                    @click="hideDialog" 
                />
                <Button 
                    label="Save" 
                    icon="pi pi-check" 
                    @click="save" 
                />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog 
            v-model:visible="deleteDialog" 
            header="Confirm Delete" 
            :modal="true" 
            style="width: 450px"
        >
            <div class="confirmation-content flex align-items-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem; color: var(--red-500)" />
                <span>
                    Are you sure you want to delete 
                    <strong>{{ selectedItem.name }}</strong>?
                    <br/>
                    <small class="text-surface-500">This action cannot be undone.</small>
                </span>
            </div>
            <template #footer>
                <Button 
                    label="No" 
                    icon="pi pi-times" 
                    text 
                    @click="deleteDialog = false" 
                />
                <Button 
                    label="Yes, Delete" 
                    icon="pi pi-check" 
                    severity="danger" 
                    @click="confirmDelete" 
                />
            </template>
        </Dialog>

        <!-- Toast for notifications -->
        <Toast />
    </div>
</template>

<style scoped>
.p-invalid {
    border-color: var(--red-500);
}

.confirmation-content {
    padding: 1rem 0;
}
</style>
