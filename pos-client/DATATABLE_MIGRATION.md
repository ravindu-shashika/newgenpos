# DataTable Component - Migration Guide

## What Changed?

You now have a **reusable DataTable component** that handles:
- ✅ Data display with sorting and filtering
- ✅ Built-in search functionality
- ✅ Action buttons (Edit, Delete, View)
- ✅ Permission-based button visibility
- ✅ Export to CSV
- ✅ Pagination
- ✅ Loading states
- ✅ Empty states

## Before vs After

### OLD APPROACH (Manual Implementation)

```vue
<template>
    <DataTable :value="data">
        <Column field="code" header="Code" sortable></Column>
        <Column field="name" header="Name" sortable></Column>
        <Column header="Actions">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" @click="edit(slotProps.data)" />
                <Button icon="pi pi-trash" @click="delete(slotProps.data)" />
            </template>
        </Column>
    </DataTable>
</template>

<script>
// Manual implementation of filters, search, actions, etc.
const filters = ref({});
const initFilters = () => { /* ... */ };
// Lots of boilerplate code...
</script>
```

### NEW APPROACH (Using Component)

```vue
<template>
    <DataTable
        :data="data"
        :columns="columns"
        :loading="loading"
        controller="categories"
        @edit="handleEdit"
        @delete="handleDelete"
    >
        <template #title>Category Management</template>
        <template #header-actions>
            <Button label="Add New" icon="pi pi-plus" @click="openNew" />
        </template>
    </DataTable>
</template>

<script setup>
import DataTable from '@/components/DataTable.vue';

const columns = [
    { field: 'code', header: 'Code', sortable: true },
    { field: 'name', header: 'Name', sortable: true }
];

const handleEdit = (rowData) => {
    // Handle edit
};

const handleDelete = (rowData) => {
    // Handle delete
};
</script>
```

## Migration Steps

### Step 1: Update Import

```javascript
// OLD
import Table from '@/components/DataTable.vue';

// NEW
import DataTable from '@/components/DataTable.vue';
```

### Step 2: Define Columns

```javascript
// Move your column definitions to a config array
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
        sortable: true
    }
];
```

### Step 3: Replace Template

```vue
<!-- OLD -->
<Table 
    :value="data"
    :columns="columns"
    @edit="edit"
    @delete="confirmDelete"
/>

<!-- NEW -->
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
</DataTable>
```

### Step 4: Update Event Handlers

```javascript
// OLD
const edit = (rowData) => { /* ... */ };
const confirmDelete = (rowData) => { /* ... */ };

// NEW (more descriptive names)
const handleEdit = (rowData) => { /* ... */ };
const handleDelete = (rowData) => { /* ... */ };
```

### Step 5: Remove Manual Filter Code

You can **remove** all of this:
```javascript
// DELETE - No longer needed!
const filters = ref({});
const initFilters = () => { /* ... */ };
const clearFilter = () => { /* ... */ };
```

The DataTable component handles this automatically!

## Example Migration: Category Page

### BEFORE (Old category.vue)

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import Table from '@/components/DataTable.vue';
import api from '@/service/api';

const data = ref(null);
const filters = ref({});

const columns = [
    { field: 'code', header: 'Code', sortable: true },
    { field: 'name', header: 'Name', sortable: true }
];

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        code: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        name: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const clearFilter = () => {
    initFilters();
};

const fetchData = async () => {
    const response = await api.get('categories');
    data.value = response.data;
};

onMounted(() => {
    initFilters();
    fetchData();
});
</script>

<template>
    <div class="card">
        <DataTable
            v-model:filters="filters"
            :value="data"
            :paginator="true"
            :rows="10"
            filterDisplay="row"
        >
            <template #header>
                <div class="flex justify-content-between">
                    <Button icon="pi pi-filter-slash" @click="clearFilter" />
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="filters['global'].value" placeholder="Search" />
                    </span>
                </div>
            </template>

            <Column field="code" header="Code" sortable>
                <template #filter="{ filterModel, filterCallback }">
                    <InputText v-model="filterModel.value" @input="filterCallback()" />
                </template>
            </Column>

            <Column field="name" header="Name" sortable>
                <template #filter="{ filterModel, filterCallback }">
                    <InputText v-model="filterModel.value" @input="filterCallback()" />
                </template>
            </Column>

            <Column header="Actions">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" @click="edit(slotProps.data)" />
                    <Button icon="pi pi-trash" @click="confirmDelete(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
```

### AFTER (New category.vue)

```vue
<script setup>
import { ref, onMounted } from 'vue';
import DataTable from '@/components/DataTable.vue';
import api from '@/service/api';

const data = ref([]);
const loading = ref(false);

const columns = [
    { field: 'code', header: 'Code', sortable: true },
    { field: 'name', header: 'Name', sortable: true }
];

const fetchData = async () => {
    loading.value = true;
    const response = await api.get('categories');
    data.value = response.data;
    loading.value = false;
};

const handleEdit = (rowData) => {
    // Edit logic
};

const handleDelete = (rowData) => {
    // Delete logic
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
        controller="categories"
        @edit="handleEdit"
        @delete="handleDelete"
    >
        <template #title>Category Management</template>
        <template #header-actions>
            <Button label="Add New" icon="pi pi-plus" @click="openNew" />
        </template>
    </DataTable>
</template>
```

## Benefits of New Approach

### 1. **Less Code**
- ~150 lines → ~50 lines
- No filter boilerplate
- No action button templates

### 2. **Consistent UI**
- Same look across all pages
- Standardized action buttons
- Uniform search/filter behavior

### 3. **Built-in Features**
- ✅ Global search
- ✅ Column sorting
- ✅ Pagination
- ✅ Export CSV
- ✅ Loading states
- ✅ Empty states
- ✅ Permission checks

### 4. **Easier Maintenance**
- Fix bugs in one place
- Add features to all tables at once
- Consistent behavior

### 5. **Better UX**
- Responsive design
- Loading indicators
- Empty state messages
- Hover effects
- Row striping

## Common Customizations

### Custom Column Content

```vue
<DataTable :data="data" :columns="columns">
    <template #cell-status="{ data }">
        <Tag :value="data.status" :severity="getSeverity(data.status)" />
    </template>
</DataTable>
```

Remember to set `template: true` in column config:
```javascript
{ field: 'status', header: 'Status', template: true }
```

### Custom Action Buttons

```vue
<DataTable :data="data" :columns="columns">
    <template #custom-actions="{ data }">
        <Button 
            icon="pi pi-eye" 
            @click="viewDetails(data)" 
            outlined 
            rounded
        />
    </template>
</DataTable>
```

### Disable Actions

```vue
<DataTable
    :data="data"
    :columns="columns"
    :showEdit="false"
    :showDelete="false"
    :showActions="false"
/>
```

## Checklist for Migration

For each page using DataTable:

- [ ] Update import statement
- [ ] Define columns array
- [ ] Replace old Table component with new DataTable
- [ ] Update event handler names
- [ ] Remove manual filter code
- [ ] Add loading state
- [ ] Add controller prop for permissions
- [ ] Test CRUD operations
- [ ] Test search/filter
- [ ] Test pagination
- [ ] Test export

## Files to Check

Update these files in your project:

```
src/views/pages/
  ├── category.vue          ✓ Update
  ├── brand.vue             ✓ Update
  ├── unit.vue              ✓ Update
  ├── product-list.vue      ✓ Update
  ├── [other pages...]      ✓ Update
```

## Need Help?

Refer to:
- `DATATABLE_GUIDE.md` - Complete documentation
- `CATEGORY_EXAMPLE.vue` - Full working example
- `DATATABLE_MIGRATION.md` - This file

## Quick Reference

### Minimal Setup
```vue
<DataTable
    :data="data"
    :columns="columns"
    @edit="handleEdit"
    @delete="handleDelete"
/>
```

### Full Featured
```vue
<DataTable
    :data="data"
    :columns="columns"
    :loading="loading"
    controller="categories"
    exportFilename="categories"
    selectionMode="multiple"
    :rows="20"
    @edit="handleEdit"
    @delete="handleDelete"
    @selection-change="handleSelection"
>
    <template #title>My Title</template>
    <template #header-actions>
        <Button label="Add" @click="add" />
    </template>
</DataTable>
```
