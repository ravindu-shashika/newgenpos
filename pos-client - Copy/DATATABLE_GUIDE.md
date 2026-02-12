# DataTable Component Guide

## Overview

A reusable, feature-rich DataTable component built with PrimeVue that can be used across all pages in your POS application.

## Features

✅ **Built-in Search** - Global search across all columns  
✅ **Sorting** - Click column headers to sort  
✅ **Filtering** - Per-column filtering  
✅ **Pagination** - Configurable page sizes  
✅ **Actions** - Edit, Delete, View buttons  
✅ **Permissions** - Integrated with auth store  
✅ **Export** - Export to CSV  
✅ **Selection** - Single or multiple row selection  
✅ **Responsive** - Mobile-friendly  
✅ **Customizable** - Slots for custom content  

## Basic Usage

### 1. Simple Example

```vue
<script setup>
import { ref, onMounted } from 'vue';
import DataTable from '@/components/DataTable.vue';
import api from '@/service/api';

const data = ref([]);
const loading = ref(false);

const columns = [
    { field: 'code', header: 'Code', sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'email', header: 'Email' }
];

const fetchData = async () => {
    loading.value = true;
    const response = await api.get('your-endpoint');
    data.value = response.data;
    loading.value = false;
};

const handleEdit = (rowData) => {
    console.log('Edit:', rowData);
};

const handleDelete = (rowData) => {
    console.log('Delete:', rowData);
};

onMounted(() => {
    fetchData();
});
</script>

<template>
    <DataTable
        :data="data"
        :columns="columns"
        :loading="loading"
        @edit="handleEdit"
        @delete="handleDelete"
    />
</template>
```

## Props

### Data Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | Array | `[]` | Array of data objects to display |
| `columns` | Array | **Required** | Column configuration (see below) |
| `loading` | Boolean | `false` | Show loading spinner |
| `dataKey` | String | `'id'` | Unique identifier field |

### Display Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `paginator` | Boolean | `true` | Enable pagination |
| `rows` | Number | `10` | Rows per page |
| `rowsPerPageOptions` | Array | `[5,10,20,50]` | Page size options |

### Action Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showActions` | Boolean | `true` | Show action buttons column |
| `showEdit` | Boolean | `true` | Show edit button |
| `showDelete` | Boolean | `true` | Show delete button |
| `showView` | Boolean | `false` | Show view button |
| `controller` | String | `null` | Controller name for permission checks |

### Feature Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showExport` | Boolean | `true` | Show export CSV button |
| `exportFilename` | String | `'data'` | Export filename |
| `selectionMode` | String | `null` | `'single'`, `'multiple'`, or `null` |
| `globalFilterFields` | Array | `[]` | Fields to search (auto-detected if empty) |

## Column Configuration

```javascript
const columns = [
    {
        field: 'code',              // Data field name
        header: 'Code',             // Column header text
        sortable: true,             // Enable sorting (default: true)
        headerStyle: 'width:20%',   // Custom header style
        bodyStyle: 'text-align:center', // Custom body style
        frozen: false,              // Freeze column (default: false)
        template: false,            // Enable custom template slot
        filterMatchMode: 'contains' // Filter mode
    }
];
```

## Events

### @edit
Emitted when edit button is clicked.
```javascript
const handleEdit = (rowData) => {
    // rowData contains the entire row object
    selectedItem.value = { ...rowData };
    showDialog.value = true;
};
```

### @delete
Emitted when delete button is clicked.
```javascript
const handleDelete = (rowData) => {
    selectedItem.value = rowData;
    confirmDialog.value = true;
};
```

### @view
Emitted when view button is clicked (if enabled).
```javascript
const handleView = (rowData) => {
    router.push(`/details/${rowData.id}`);
};
```

### @selection-change
Emitted when row selection changes.
```javascript
const handleSelection = (selectedRows) => {
    console.log('Selected:', selectedRows);
};
```

## Slots

### Custom Columns

Use slots to customize column content:

```vue
<DataTable :data="data" :columns="columns">
    <!-- Custom status column -->
    <template #cell-status="{ data }">
        <Tag :value="data.status" :severity="getSeverity(data.status)" />
    </template>
    
    <!-- Custom price column -->
    <template #cell-price="{ data }">
        <span class="font-bold">${{ data.price.toFixed(2) }}</span>
    </template>
</DataTable>
```

**Important:** Set `template: true` in column config to enable slots:
```javascript
const columns = [
    { field: 'status', header: 'Status', template: true }
];
```

### Header Customization

```vue
<DataTable :data="data" :columns="columns">
    <!-- Custom title -->
    <template #title>
        <i class="pi pi-users mr-2"></i>
        User Management
    </template>
    
    <!-- Add custom buttons in header -->
    <template #header-actions>
        <Button label="Add New" icon="pi pi-plus" @click="openNew" />
        <Button label="Import" icon="pi pi-upload" @click="importData" />
    </template>
</DataTable>
```

### Custom Action Buttons

```vue
<DataTable :data="data" :columns="columns">
    <template #custom-actions="{ data }">
        <Button 
            icon="pi pi-download" 
            outlined 
            rounded
            @click="downloadReport(data)"
            v-tooltip.top="'Download'"
        />
    </template>
</DataTable>
```

### Footer Customization

```vue
<DataTable :data="data" :columns="columns">
    <template #footer-right>
        <Button label="Bulk Delete" icon="pi pi-trash" severity="danger" />
    </template>
</DataTable>
```

## Complete Example with CRUD

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from '@/components/DataTable.vue';
import api from '@/service/api';

const toast = useToast();
const data = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const deleteDialog = ref(false);
const selectedItem = ref({});

const columns = [
    { field: 'code', header: 'Code', sortable: true, headerStyle: 'width:20%' },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'status', header: 'Status', template: true, headerStyle: 'width:15%' }
];

// Fetch data
const fetchData = async () => {
    loading.value = true;
    try {
        const response = await api.get('categories');
        data.value = response.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
    } finally {
        loading.value = false;
    }
};

// Add new
const openNew = () => {
    selectedItem.value = {};
    showDialog.value = true;
};

// Edit
const handleEdit = (rowData) => {
    selectedItem.value = { ...rowData };
    showDialog.value = true;
};

// Delete confirmation
const handleDelete = (rowData) => {
    selectedItem.value = rowData;
    deleteDialog.value = true;
};

// Save (create or update)
const save = async () => {
    try {
        const response = await api.post('save-category', selectedItem.value);
        if (response.status === 200) {
            toast.add({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
            showDialog.value = false;
            fetchData();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save', life: 3000 });
    }
};

// Delete
const confirmDeleteItem = async () => {
    try {
        const response = await api.delete(`categories/${selectedItem.value.id}`);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Item deleted', life: 3000 });
        deleteDialog.value = false;
        fetchData();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
    }
};

onMounted(() => {
    fetchData();
});
</script>

<template>
    <div>
        <!-- DataTable -->
        <DataTable
            :data="data"
            :columns="columns"
            :loading="loading"
            controller="categories"
            @edit="handleEdit"
            @delete="handleDelete"
        >
            <template #title>
                <i class="pi pi-tags mr-2"></i>
                Category Management
            </template>
            
            <template #header-actions>
                <Button label="Add New" icon="pi pi-plus" @click="openNew" />
            </template>
            
            <!-- Custom status column -->
            <template #cell-status="{ data }">
                <Tag :value="data.status" :severity="data.status === 'Active' ? 'success' : 'danger'" />
            </template>
        </DataTable>

        <!-- Edit Dialog -->
        <Dialog v-model:visible="showDialog" header="Category Details" :modal="true" class="p-fluid" style="width: 450px">
            <div class="field">
                <label for="code">Code</label>
                <InputText id="code" v-model="selectedItem.code" required />
            </div>
            <div class="field">
                <label for="name">Name</label>
                <InputText id="name" v-model="selectedItem.name" required />
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="showDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="save" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteDialog" header="Confirm" :modal="true" style="width: 350px">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Are you sure you want to delete <b>{{ selectedItem.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="confirmDeleteItem" />
            </template>
        </Dialog>
    </div>
</template>
```

## Permissions Integration

The DataTable automatically checks permissions using the `controller` prop:

```vue
<DataTable
    :data="data"
    :columns="columns"
    controller="categories"
    @edit="handleEdit"
    @delete="handleDelete"
/>
```

This will:
- Hide edit button if user doesn't have `categories-edit` or `categories.edit` permission
- Hide delete button if user doesn't have `categories-delete` or `categories.delete` permission

## Selection Mode

### Single Selection
```vue
<DataTable
    :data="data"
    :columns="columns"
    selectionMode="single"
    @selection-change="handleSelection"
/>
```

### Multiple Selection
```vue
<DataTable
    :data="data"
    :columns="columns"
    selectionMode="multiple"
    @selection-change="handleSelection"
/>
```

## Styling

The component uses PrimeVue's default styling. You can override with scoped styles:

```vue
<style scoped>
:deep(.p-datatable .p-datatable-header) {
    background: var(--primary-color);
    color: white;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    background: var(--surface-100);
}
</style>
```

## Tips & Best Practices

1. **Always provide a dataKey** - Helps with performance and selection
2. **Use controller prop** - Enable permission-based action buttons
3. **Loading state** - Always show loading state during API calls
4. **Error handling** - Handle errors gracefully with toast messages
5. **Custom slots** - Use for complex column content (badges, images, etc.)
6. **Global filter fields** - Specify which columns to search if not all
7. **Export filename** - Set meaningful filename for exports

## Common Patterns

### With Status Badge
```vue
<template #cell-status="{ data }">
    <Tag 
        :value="data.status" 
        :severity="getStatusSeverity(data.status)" 
    />
</template>
```

### With Image
```vue
<template #cell-image="{ data }">
    <img :src="data.imageUrl" :alt="data.name" style="width: 64px" />
</template>
```

### With Currency
```vue
<template #cell-price="{ data }">
    <span class="font-bold">${{ data.price.toFixed(2) }}</span>
</template>
```

### With Date Formatting
```vue
<template #cell-date="{ data }">
    {{ new Date(data.createdAt).toLocaleDateString() }}
</template>
```

## Troubleshooting

### Actions not showing
- Check `showActions` prop is `true`
- Verify permissions if using `controller` prop

### Search not working
- Ensure `globalFilterFields` includes searchable columns
- Check data field names match column field names

### Custom slots not rendering
- Set `template: true` in column configuration
- Use correct slot name format: `#cell-{fieldName}`

### Export not working
- Ensure `showExport` prop is `true`
- Check browser's download settings
