<script setup>
import api, { ASSET_BASE_URL } from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';

const toast = useToast();
const dt = ref();
const employees = ref([]);
const employeeDialog = ref(false);
const deleteEmployeeDialog = ref(false);
const employee = ref({
    name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    country: '',
    department_id: null,
    designation_id: null,
    shift_id: null,
    staff_id: '',
    basic_salary: null,
    image: null
});
const selectedEmployees = ref();
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const submitted = ref(false);
const isEdit = ref(false);
const loading = ref(false);
const departments = ref([]);
const designations = ref([]);
const shifts = ref([]);
const imageFile = ref(null);

onMounted(() => {
    fetchEmployees();
    fetchFormData();
});

const departmentOptions = computed(() => [{ label: '—', value: null }, ...departments.value.map((d) => ({ label: d.name, value: d.id }))]);
const designationOptions = computed(() => [{ label: '—', value: null }, ...designations.value.map((d) => ({ label: d.name, value: d.id }))]);
const shiftOptions = computed(() => [{ label: '—', value: null }, ...shifts.value.map((s) => ({ label: s.name, value: s.id }))]);

async function fetchEmployees() {
    loading.value = true;
    try {
        const response = await api.get('employees');
        if (response.data?.status === 200) employees.value = response.data.data || [];
        else if (response.error) toast.add({ severity: 'error', summary: 'Error', detail: response.error.response?.data?.message || 'Failed to load employees', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Failed to load employees', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function fetchFormData() {
    try {
        const response = await api.get('employees/form-data');
        if (response.data?.status === 200) {
            departments.value = response.data.departments || [];
            designations.value = response.data.designations || [];
            shifts.value = response.data.shifts || [];
        }
    } catch (_) {}
}

function openNew() {
    employee.value = {
        name: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
        country: '',
        department_id: null,
        designation_id: null,
        shift_id: null,
        staff_id: '',
        basic_salary: null,
        image: null
    };
    imageFile.value = null;
    submitted.value = false;
    isEdit.value = false;
    employeeDialog.value = true;
}

function editEmployee(row) {
    employee.value = {
        id: row.id,
        name: row.name,
        email: row.email || '',
        phone_number: row.phone_number || '',
        address: row.address || '',
        city: row.city || '',
        country: row.country || '',
        department_id: row.department_id ?? null,
        designation_id: row.designation_id ?? null,
        shift_id: row.shift_id ?? null,
        staff_id: row.staff_id || '',
        basic_salary: row.basic_salary ?? null,
        image: null
    };
    imageFile.value = null;
    isEdit.value = true;
    employeeDialog.value = true;
}

function hideDialog() {
    employeeDialog.value = false;
    employee.value = { name: '', email: '', phone_number: '', address: '', city: '', country: '', department_id: null, designation_id: null, shift_id: null, staff_id: '', basic_salary: null, image: null };
    imageFile.value = null;
}

function onImageChange(event) {
    imageFile.value = event.target?.files?.[0] ?? null;
}

async function saveEmployee() {
    submitted.value = true;
    if (!employee.value.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation', detail: 'Name is required', life: 3000 });
        return;
    }
    try {
        const formData = new FormData();
        if (isEdit.value && employee.value.id) {
            formData.append('id', employee.value.id);
            formData.append('name', employee.value.name.trim());
            formData.append('email', employee.value.email?.trim() || '');
            formData.append('phone_number', employee.value.phone_number?.trim() || '');
            formData.append('address', employee.value.address?.trim() || '');
            formData.append('city', employee.value.city?.trim() || '');
            formData.append('country', employee.value.country?.trim() || '');
            if (employee.value.department_id != null) formData.append('department_id', employee.value.department_id);
            if (employee.value.designation_id != null) formData.append('designation_id', employee.value.designation_id);
            if (employee.value.shift_id != null) formData.append('shift_id', employee.value.shift_id);
            formData.append('staff_id', employee.value.staff_id?.trim() ?? '');
            if (employee.value.basic_salary != null && employee.value.basic_salary !== '') formData.append('basic_salary', employee.value.basic_salary);
            if (imageFile.value) formData.append('image', imageFile.value);
            const response = await api.post('employees/update', formData);
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchEmployees();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Update failed', life: 3000 });
        } else {
            formData.append('name', employee.value.name.trim());
            formData.append('email', employee.value.email?.trim() || '');
            formData.append('phone_number', employee.value.phone_number?.trim() || '');
            formData.append('address', employee.value.address?.trim() || '');
            formData.append('city', employee.value.city?.trim() || '');
            formData.append('country', employee.value.country?.trim() || '');
            if (employee.value.department_id != null) formData.append('department_id', employee.value.department_id);
            if (employee.value.designation_id != null) formData.append('designation_id', employee.value.designation_id);
            if (employee.value.shift_id != null) formData.append('shift_id', employee.value.shift_id);
            formData.append('staff_id', employee.value.staff_id?.trim() ?? '');
            if (employee.value.basic_salary != null && employee.value.basic_salary !== '') formData.append('basic_salary', employee.value.basic_salary);
            if (imageFile.value) formData.append('image', imageFile.value);
            const response = await api.post('employees', formData);
            if (response.data?.status === 200) {
                toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                await fetchEmployees();
                hideDialog();
            } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Create failed', life: 3000 });
        }
    } catch (e) {
        const msg = e.response?.data?.message || e.response?.data?.errors?.email?.[0] || 'Save failed';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    }
}

function confirmDelete(row) {
    employee.value = row;
    deleteEmployeeDialog.value = true;
}

async function handleDeleteEmployee() {
    try {
        const response = await api.delete(`employees/${employee.value.id}`);
        if (response.data?.status === 200) {
            employees.value = employees.value.filter((e) => e.id !== employee.value.id);
            toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
        } else toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Delete failed', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Delete failed', life: 3000 });
    }
    deleteEmployeeDialog.value = false;
    employee.value = {};
}

function exportCSV() {
    dt.value?.exportCSV();
}

function departmentName(row) {
    return row.department?.name ?? '—';
}

function designationName(row) {
    return row.designation?.name ?? '—';
}

function imageUrl(row) {
    if (!row?.image) return null;
    return `${ASSET_BASE_URL || ''}/images/employee/${row.image}`;
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <i class="pi pi-user-plus text-primary"></i>
                    Employees
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage employees</p>
            </div>
            <Button label="Add Employee" icon="pi pi-plus" @click="openNew" />
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
                v-model:selection="selectedEmployees"
                :value="employees"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                :globalFilterFields="['name', 'email', 'phone_number', 'staff_id']"
                class="p-datatable-sm"
                stripedRows
            >
                <template #empty>
                    <div class="text-center py-12">
                        <p class="text-gray-500 dark:text-gray-400">No employees found.</p>
                        <Button label="Add Employee" icon="pi pi-plus" class="mt-4" @click="openNew" />
                    </div>
                </template>
                <Column header="Image" headerClass="font-semibold" style="width: 80px">
                    <template #body="{ data }">
                        <img v-if="imageUrl(data)" :src="imageUrl(data)" alt="" class="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                        <div v-else class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                            <i class="pi pi-user text-xl"></i>
                        </div>
                    </template>
                </Column>
                <Column field="name" header="Name" sortable headerClass="font-semibold" />
                <Column field="email" header="Email" headerClass="font-semibold" />
                <Column field="phone_number" header="Phone" headerClass="font-semibold" />
                <Column header="Department" headerClass="font-semibold">
                    <template #body="{ data }">{{ departmentName(data) }}</template>
                </Column>
                <Column header="Designation" headerClass="font-semibold">
                    <template #body="{ data }">{{ designationName(data) }}</template>
                </Column>
                <Column field="staff_id" header="Staff ID" headerClass="font-semibold" />
                <Column :exportable="false" header="Actions" headerClass="font-semibold" style="width: 120px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" outlined rounded severity="info" v-tooltip.top="'Edit'" class="h-9 w-9" @click="editEmployee(data)" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger" v-tooltip.top="'Delete'" class="h-9 w-9" @click="confirmDelete(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="employeeDialog" :style="{ width: '640px' }" :modal="true" :header="isEdit ? 'Update Employee' : 'Add Employee'" @hide="hideDialog">
            <div class="py-4 space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Image</label>
                    <input type="file" accept="image/*" class="w-full text-sm" @change="onImageChange" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name <span class="text-red-500">*</span></label>
                        <InputText v-model.trim="employee.name" placeholder="Full name" class="w-full" :invalid="submitted && !employee.name" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Staff ID</label>
                        <InputText v-model.trim="employee.staff_id" placeholder="Staff ID" class="w-full" />
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                        <InputText v-model.trim="employee.email" type="email" placeholder="email@example.com" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                        <InputText v-model.trim="employee.phone_number" placeholder="Phone" class="w-full" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                    <InputText v-model.trim="employee.address" placeholder="Address" class="w-full" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City</label>
                        <InputText v-model.trim="employee.city" placeholder="City" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Country</label>
                        <InputText v-model.trim="employee.country" placeholder="Country" class="w-full" />
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Department</label>
                        <Select v-model="employee.department_id" :options="departmentOptions" optionLabel="label" optionValue="value" placeholder="Select" class="w-full" showClear />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Designation</label>
                        <Select v-model="employee.designation_id" :options="designationOptions" optionLabel="label" optionValue="value" placeholder="Select" class="w-full" showClear />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Shift</label>
                        <Select v-model="employee.shift_id" :options="shiftOptions" optionLabel="label" optionValue="value" placeholder="Select" class="w-full" showClear />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Basic Salary</label>
                    <InputNumber v-model="employee.basic_salary" placeholder="0" class="w-full" :minFractionDigits="0" :maxFractionDigits="2" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="hideDialog" />
                <Button :label="isEdit ? 'Update' : 'Save'" icon="pi pi-check" @click="saveEmployee" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteEmployeeDialog" :style="{ width: '450px' }" :modal="true" header="Confirm Delete">
            <p class="text-gray-700 dark:text-gray-300">Delete employee <strong>{{ employee.name }}</strong>?</p>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteEmployeeDialog = false" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="handleDeleteEmployee" />
            </template>
        </Dialog>
    </div>
</template>
