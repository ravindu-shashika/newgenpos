<script setup>
import api from '@/service/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';

const toast = useToast();
const dt = ref();
const attendances = ref([]);
const attendanceDialog = ref(false);
const deleteAttendanceDialog = ref(false);
const deleteAttendancesDialog = ref(false);
const importCsvDialog = ref(false);
const filterSectionOpen = ref(false);
const importSectionOpen = ref(false);

const attendance = ref({
    employee_id: [],
    date: '',
    checkin: '',
    checkout: '',
    note: ''
});
const selectedAttendances = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const filterForm = ref({
    date: null,
    employee_id: null,
    status: null,
    warehouse_id: null
});
const submitted = ref(false);
const loading = ref(false);
const employees = ref([]);
const warehouses = ref([]);
const hrmSetting = ref(null);
const dateFormat = ref('Y-m-d');
const employeeOptions = computed(() =>
    employees.value.map((e) => ({ label: e.name, value: e.id }))
);
const warehouseOptions = computed(() => [
    { label: 'All', value: null },
    ...warehouses.value.map((w) => ({ label: w.name, value: w.id }))
]);
const statusOptions = [
    { label: 'All', value: null },
    { label: 'Present', value: 'Present' },
    { label: 'Absent', value: 'Absent' },
    { label: 'Leave', value: 'Leave' }
];
const csvDateFormats = [
    { label: 'dd/mm/yyyy (23/05/2022)', value: 'd/m/Y' },
    { label: 'mm/dd/yyyy (05/23/2022)', value: 'm/d/Y' },
    { label: 'yyyy/mm/dd (2022/05/23)', value: 'Y/m/d' }
];
const importForm = ref({
    Attendance_Device_date_format: null,
    file: null
});
const importSubmitting = ref(false);

// Add unique id for DataTable selection (date_employee_id)
const attendancesWithId = computed(() =>
    attendances.value.map((row) => ({
        ...row,
        _id: `${row.date}_${row.employee_id}`
    }))
);

// Client-side filter
const filteredAttendances = computed(() => {
    let list = attendancesWithId.value;
    if (filterForm.value.date) {
        const d = filterForm.value.date;
        const dateStr = typeof d === 'string' ? d : (d && typeof d.toISOString === 'function' ? d.toISOString().slice(0, 10) : '');
        if (dateStr) list = list.filter((r) => r.date === dateStr);
    }
    if (filterForm.value.employee_id != null && filterForm.value.employee_id !== '') {
        list = list.filter((r) => r.employee_id === filterForm.value.employee_id);
    }
    if (filterForm.value.status) {
        const statusLabel = filterForm.value.status;
        list = list.filter((r) => {
            const rowStatus = r.status ? 'Present' : 'Late';
            return (statusLabel === 'Present' && rowStatus === 'Present') ||
                (statusLabel === 'Absent' && rowStatus === 'Absent') ||
                (statusLabel === 'Leave' && rowStatus === 'Leave');
        });
    }
    if (filterForm.value.warehouse_id != null && filterForm.value.warehouse_id !== '') {
        const wh = String(filterForm.value.warehouse_id);
        list = list.filter((r) => String(r.warehouse_id || '') === wh);
    }
    return list;
});

onMounted(() => {
    fetchAttendances();
    fetchFormData();
});

async function fetchAttendances() {
    loading.value = true;
    try {
        const response = await api.get('attendances');
        if (response.data && response.data.status === 200) {
            attendances.value = response.data.data || [];
            if (response.data.date_format) dateFormat.value = response.data.date_format;
        } else if (response.error) {
            const errorMsg = response.error.response?.data?.message || 'Failed to load attendance';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to load attendance';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function fetchFormData() {
    try {
        const response = await api.get('attendances/form-data');
        if (response.data && response.data.status === 200) {
            employees.value = response.data.employees || [];
            warehouses.value = response.data.warehouses || [];
            hrmSetting.value = response.data.hrm_setting || null;
            if (response.data.date_format) dateFormat.value = response.data.date_format;
        }
    } catch (error) {
        console.error('Error fetching form data:', error);
    }
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        if (dateFormat.value === 'd-m-Y' || dateFormat.value === 'd/m/Y') return `${day}-${month}-${year}`;
        if (dateFormat.value === 'm-d-Y' || dateFormat.value === 'm/d/Y') return `${month}-${day}-${year}`;
        return `${year}-${month}-${day}`;
    } catch {
        return dateStr;
    }
}

function openNew() {
    attendance.value = {
        employee_id: [],
        date: new Date().toISOString().slice(0, 10),
        checkin: hrmSetting.value?.checkin || '09:00',
        checkout: hrmSetting.value?.checkout || '17:00',
        note: ''
    };
    submitted.value = false;
    attendanceDialog.value = true;
}

function hideDialog() {
    attendanceDialog.value = false;
    attendance.value = { employee_id: [], date: '', checkin: '', checkout: '', note: '' };
    submitted.value = false;
}

async function saveAttendance() {
    submitted.value = true;
    if (!attendance.value.employee_id?.length) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Select at least one employee', life: 3000 });
        return;
    }
    if (!attendance.value.date) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Date is required', life: 3000 });
        return;
    }
    if (!attendance.value.checkin?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Check-in time is required', life: 3000 });
        return;
    }
    if (!attendance.value.checkout?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Check-out time is required', life: 3000 });
        return;
    }

    try {
        const payload = {
            employee_id: attendance.value.employee_id,
            date: attendance.value.date,
            checkin: attendance.value.checkin.trim(),
            checkout: attendance.value.checkout.trim(),
            note: attendance.value.note || ''
        };
        const response = await api.post('attendances', payload);
        if (response.data && response.data.status === 200) {
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
            await fetchAttendances();
            hideDialog();
        } else if (response.data && response.data.status === 500) {
            toast.add({ severity: 'error', summary: 'Error', detail: response.data.error || 'Failed to save attendance', life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to save attendance';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
}

function confirmDeleteAttendance(row) {
    attendance.value = { ...row };
    deleteAttendanceDialog.value = true;
}

async function handleDeleteAttendance() {
    try {
        const response = await api.delete(`attendances/${attendance.value.date}/${attendance.value.employee_id}`);
        if (response.data && response.data.status === 200) {
            attendances.value = attendances.value.filter(
                (r) => !(r.date === attendance.value.date && r.employee_id === attendance.value.employee_id)
            );
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Failed to delete', life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to delete attendance';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
    deleteAttendanceDialog.value = false;
    attendance.value = {};
}

function confirmDeleteSelected() {
    deleteAttendancesDialog.value = true;
}

async function deleteSelectedAttendances() {
    if (!selectedAttendances.value?.length) return;
    const payload = {
        attendanceSelectedArray: selectedAttendances.value.map((r) => [r.date, r.employee_id])
    };
    try {
        const response = await api.post('attendances/delete-by-selection', payload);
        if (response.data && response.data.status === 200) {
            const set = new Set(selectedAttendances.value.map((r) => `${r.date}_${r.employee_id}`));
            attendances.value = attendances.value.filter((r) => !set.has(`${r.date}_${r.employee_id}`));
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Failed to delete', life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to delete selected';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    }
    deleteAttendancesDialog.value = false;
    selectedAttendances.value = null;
}

function exportCSV() {
    dt.value?.exportCSV();
}

function openImportCsv() {
    importForm.value = { Attendance_Device_date_format: null, file: null };
    importCsvDialog.value = true;
}

function onImportFileChange(event) {
    const file = event.target?.files?.[0];
    importForm.value.file = file || null;
}

async function submitImportCsv() {
    if (!importForm.value.Attendance_Device_date_format) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Select date format', life: 3000 });
        return;
    }
    if (!importForm.value.file) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Select a CSV file', life: 3000 });
        return;
    }
    importSubmitting.value = true;
    try {
        const formData = new FormData();
        formData.append('Attendance_Device_date_format', importForm.value.Attendance_Device_date_format);
        formData.append('file', importForm.value.file);
        const response = await api.post('attendances/import-csv', formData);
        if (response.data && response.data.status === 200) {
            toast.add({ severity: 'success', summary: 'Successful', detail: response.data.message, life: 3000 });
            importCsvDialog.value = false;
            await fetchAttendances();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'Import failed', life: 3000 });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Import failed';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
    } finally {
        importSubmitting.value = false;
    }
}

function getStatusLabel(row) {
    return row.status ? 'Present' : 'Late';
}

function getStatusSeverity(row) {
    return row.status ? 'success' : 'danger';
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <i class="pi pi-check-circle text-primary"></i>
                        Attendance
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">Manage employee attendance and check-in/check-out records</p>
                </div>
                <div class="flex gap-2 flex-wrap">
                    <Button label="Add Attendance" icon="pi pi-plus" class="transition-all" @click="openNew" />
                    <Button label="Import CSV" icon="pi pi-upload" severity="secondary" outlined @click="openImportCsv" />
                    <Button
                        :label="filterSectionOpen ? 'Hide Filter' : 'Filter'"
                        icon="pi pi-filter"
                        severity="secondary"
                        outlined
                        @click="filterSectionOpen = !filterSectionOpen"
                    />
                </div>
            </div>
        </div>

        <!-- Filter -->
        <div v-show="filterSectionOpen" class="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                    <InputText v-model="filterForm.date" type="date" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Employee</label>
                    <Select
                        v-model="filterForm.employee_id"
                        :options="employeeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All"
                        class="w-full"
                        showClear
                    />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                    <Select
                        v-model="filterForm.status"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All"
                        class="w-full"
                        showClear
                    />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Warehouse</label>
                    <Select
                        v-model="filterForm.warehouse_id"
                        :options="warehouseOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All"
                        class="w-full"
                        showClear
                    />
                </div>
            </div>
        </div>

        <!-- Main Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 p-4 md:p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex-1 max-w-md">
                        <IconField>
                            <InputIcon><i class="pi pi-search text-gray-400 dark:text-gray-500" /></InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Search..." class="w-full" />
                        </IconField>
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <Button
                            label="Delete Selected"
                            icon="pi pi-trash"
                            severity="danger"
                            outlined
                            :disabled="!selectedAttendances || !selectedAttendances.length"
                            @click="confirmDeleteSelected"
                        />
                        <Button label="Export" icon="pi pi-download" severity="success" outlined @click="exportCSV" />
                    </div>
                </div>
            </div>

            <DataTable
                ref="dt"
                v-model:selection="selectedAttendances"
                :value="filteredAttendances"
                dataKey="_id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                :globalFilterFields="['date', 'employee_name', 'user_name']"
                class="p-datatable-sm"
                stripedRows
            >
                <template #empty>
                    <div class="text-center py-12">
                        <i class="pi pi-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                        <p class="text-gray-500 dark:text-gray-400 text-lg">No attendance records found</p>
                        <Button label="Add Attendance" icon="pi pi-plus" class="mt-4" @click="openNew" />
                    </div>
                </template>

                <Column selectionMode="multiple" headerStyle="width: 3rem" :exportable="false" />
                <Column field="date" header="Date" sortable headerClass="font-semibold" style="min-width: 120px">
                    <template #body="{ data }">
                        {{ formatDisplayDate(data.date) }}
                    </template>
                </Column>
                <Column field="employee_name" header="Employee" sortable headerClass="font-semibold" style="min-width: 140px" />
                <Column header="Check In - Check Out" headerClass="font-semibold" style="min-width: 160px">
                    <template #body="{ data }">
                        <span v-html="data.checkin_checkout"></span>
                    </template>
                </Column>
                <Column header="Status" headerClass="font-semibold" style="min-width: 100px">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data)" :severity="getStatusSeverity(data)" class="font-semibold" />
                    </template>
                </Column>
                <Column field="user_name" header="Created By" sortable headerClass="font-semibold" class="hidden md:table-cell" />
                <Column :exportable="false" header="Actions" headerClass="font-semibold" style="width: 100px">
                    <template #body="{ data }">
                        <Button
                            icon="pi pi-trash"
                            outlined
                            rounded
                            severity="danger"
                            v-tooltip.top="'Delete'"
                            class="h-10 w-10"
                            @click="confirmDeleteAttendance(data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Add Attendance Dialog -->
        <Dialog v-model:visible="attendanceDialog" :style="{ width: '600px' }" :modal="true" :dismissableMask="true" class="attendance-dialog">
            <template #header>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <i class="pi pi-plus text-primary text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Attendance</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Record check-in and check-out for employees</p>
                    </div>
                </div>
            </template>

            <div class="py-4">
                <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
                    <i class="pi pi-info-circle text-blue-500 dark:text-blue-400 mt-0.5"></i>
                    <div class="text-sm text-blue-700 dark:text-blue-300">
                        <p class="font-medium">Fields marked with <span class="text-red-500 dark:text-red-400">*</span> are required</p>
                    </div>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Employee(s) <span class="text-red-500">*</span></label>
                        <MultiSelect
                            v-model="attendance.employee_id"
                            :options="employeeOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select employees"
                            class="w-full"
                            :invalid="submitted && !attendance.employee_id?.length"
                        />
                        <small v-if="submitted && !attendance.employee_id?.length" class="text-red-500 flex items-center gap-1 mt-1">
                            <i class="pi pi-times-circle text-xs"></i>
                            Select at least one employee
                        </small>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date <span class="text-red-500">*</span></label>
                        <InputText v-model="attendance.date" type="date" class="w-full" :invalid="submitted && !attendance.date" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Check In <span class="text-red-500">*</span></label>
                            <InputText v-model="attendance.checkin" type="time" class="w-full" :invalid="submitted && !attendance.checkin" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Check Out <span class="text-red-500">*</span></label>
                            <InputText v-model="attendance.checkout" type="time" class="w-full" :invalid="submitted && !attendance.checkout" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Note</label>
                        <Textarea v-model="attendance.note" rows="3" class="w-full" />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="hideDialog" />
                    <Button label="Save" icon="pi pi-check" @click="saveAttendance" :loading="submitted" />
                </div>
            </template>
        </Dialog>

        <!-- Delete Single Dialog -->
        <Dialog v-model:visible="deleteAttendanceDialog" :style="{ width: '500px' }" :modal="true" :dismissableMask="true">
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
                <p class="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete attendance for
                    <span class="font-bold text-gray-900 dark:text-gray-100">{{ attendance.employee_name }}</span>
                    on {{ formatDisplayDate(attendance.date) }}?
                </p>
            </div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteAttendanceDialog = false" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="handleDeleteAttendance" />
                </div>
            </template>
        </Dialog>

        <!-- Delete Multiple Dialog -->
        <Dialog v-model:visible="deleteAttendancesDialog" :style="{ width: '500px' }" :modal="true" :dismissableMask="true">
            <template #header>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Selected</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ selectedAttendances?.length }} record(s) selected</p>
                    </div>
                </div>
            </template>
            <div class="py-4">
                <p class="text-gray-700 dark:text-gray-300">Are you sure you want to delete the selected attendance records?</p>
            </div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteAttendancesDialog = false" />
                    <Button label="Delete All" icon="pi pi-trash" severity="danger" @click="deleteSelectedAttendances" />
                </div>
            </template>
        </Dialog>

        <!-- Import CSV Dialog -->
        <Dialog v-model:visible="importCsvDialog" :style="{ width: '520px' }" :modal="true" :dismissableMask="true">
            <template #header>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <i class="pi pi-upload text-green-600 dark:text-green-400 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Import from CSV</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload device export (CSV)</p>
                    </div>
                </div>
            </template>
            <div class="py-4 space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Attendance device date format <span class="text-red-500">*</span></label>
                    <Select
                        v-model="importForm.Attendance_Device_date_format"
                        :options="csvDateFormats"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select format"
                        class="w-full"
                    />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">File <span class="text-red-500">*</span></label>
                    <input type="file" accept=".csv,.txt" class="w-full text-sm" @change="onImportFileChange" />
                </div>
                <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                    <p class="font-medium mb-1">Notes:</p>
                    <ul class="list-disc list-inside space-y-0.5">
                        <li>CSV date format must match selected format.</li>
                        <li>Do not change first line or column order.</li>
                        <li>Max file size 2MB.</li>
                    </ul>
                </div>
            </div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="importCsvDialog = false" />
                    <Button label="Import" icon="pi pi-check" :loading="importSubmitting" @click="submitImportCsv" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.attendance-dialog :deep(.p-dialog-header) {
    padding: 1.5rem;
    border-bottom: 1px solid rgb(229 231 235);
}
:deep(.dark) .attendance-dialog :deep(.p-dialog-header) {
    border-bottom: 1px solid rgb(55 65 81);
}
.attendance-dialog :deep(.p-dialog-content) {
    padding: 1.5rem;
}
.attendance-dialog :deep(.p-dialog-footer) {
    padding: 1.5rem;
    border-top: 1px solid rgb(229 231 235);
}
:deep(.dark) .attendance-dialog :deep(.p-dialog-footer) {
    border-top: 1px solid rgb(55 65 81);
}
</style>
