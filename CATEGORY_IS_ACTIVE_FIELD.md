# Category is_active Field Implementation ✅

**Date:** Sunday, February 8, 2026  
**Feature:** Active/Inactive status toggle for categories

---

## Overview

Added `is_active` field to category management with:
- ✅ Default value of 1 (Active)
- ✅ Toggle switch in form
- ✅ Visual status indicator
- ✅ Pass 1 for active, 0 for inactive

---

## Frontend Changes (category.vue)

### 1. Default Value in Form ✅

**openNew() function:**
```javascript
function openNew() {
    category.value = {
        is_active: true  // Default to active
    };
    // ... rest of code
}
```

**closeAndResetForm() function:**
```javascript
function closeAndResetForm() {
    category.value = {
        is_active: true  // Reset to active by default
    };
    // ... rest of code
}
```

### 2. Form Data Submission ✅

**saveCategory() function:**
```javascript
// Convert boolean to 1 or 0
formData.append('is_active', category.value.is_active ? 1 : 0);
```

**Result:**
- Active (true) → sends **1**
- Inactive (false) → sends **0**

### 3. Edit Mode Handling ✅

**editCategory() function:**
```javascript
function editCategory(cat) {
    category.value = { 
        ...cat,
        is_active: cat.is_active ? true : false  // Convert to boolean for toggle
    };
    isEdit.value = true;
    categoryDialog.value = true;
}
```

**Result:**
- Database value 1 → **true** (toggle ON)
- Database value 0 → **false** (toggle OFF)

### 4. UI Component Added ✅

**Modal Template:**
```vue
<!-- Status Toggle -->
<div class="flex items-center gap-3">
    <label for="is_active" class="block font-bold">Status</label>
    <InputSwitch 
        id="is_active" 
        v-model="category.is_active" 
        :trueValue="true"
        :falseValue="false"
    />
    <span class="text-sm">
        <Tag :value="category.is_active ? 'Active' : 'Inactive'" :severity="category.is_active ? 'success' : 'danger'" />
    </span>
</div>
```

**Features:**
- Toggle switch (InputSwitch component)
- Live status badge showing "Active" (green) or "Inactive" (red)
- User-friendly interface

### 5. DataTable Column ✅

**Already implemented:**
```vue
<Column field="is_active" header="Status" sortable style="min-width: 10rem">
    <template #body="slotProps">
        <Tag :value="slotProps.data.is_active ? 'Active' : 'Inactive'" :severity="slotProps.data.is_active ? 'success' : 'danger'" />
    </template>
</Column>
```

---

## Backend Changes (CategoryController.php)

### 1. Validation Updated ✅

**Before:**
```php
'is_active' => 'nullable|boolean',
```

**After:**
```php
'is_active' => 'nullable|in:0,1',
```

**Reason:** More explicit validation for 0 or 1 values

### 2. Default Value Handling ✅

**Added:**
```php
// Convert is_active to integer (0 or 1)
if (isset($validated['is_active'])) {
    $validated['is_active'] = (int) $validated['is_active'];
} else {
    $validated['is_active'] = 1; // Default to active
}
```

**Result:**
- If provided → converts to integer (0 or 1)
- If not provided → defaults to **1 (active)**

---

## Database Structure

### Categories Table (Already Exists)

```sql
is_active BOOLEAN DEFAULT NULL
```

**Values:**
- `1` or `TRUE` = Active
- `0` or `FALSE` = Inactive
- `NULL` = Treated as inactive (handled by backend)

---

## User Flow

### Creating New Category:

1. Click "New" button
2. Form opens with toggle **ON** (Active)
3. Fill in category name
4. Toggle can be switched **OFF** for inactive
5. Click "Submit"
6. Backend receives `is_active: 1` or `is_active: 0`
7. Category saved with correct status
8. List shows status badge (Green "Active" or Red "Inactive")

### Editing Existing Category:

1. Click edit icon on category
2. Form opens with current status
   - If `is_active = 1` → Toggle **ON**
   - If `is_active = 0` → Toggle **OFF**
3. User can change toggle
4. Click "Submit"
5. Backend receives updated `is_active: 1` or `is_active: 0`
6. Category updated with new status

---

## Visual Indicators

### In Form:
```
Status: [Toggle Switch] ● Active   ← Green badge
Status: [Toggle Switch] ○ Inactive ← Red badge
```

### In DataTable:
```
| Name      | Status   |
|-----------|----------|
| Food      | Active   | ← Green tag
| Clothing  | Inactive | ← Red tag
```

---

## Testing Checklist

### ✅ Create New Category - Default Active
1. Click "New"
2. **Expected:** Toggle is ON (Active)
3. **Expected:** Green "Active" badge shown
4. Fill name and save
5. **Expected:** Backend receives `is_active: 1`
6. **Expected:** Category created with is_active = 1

### ✅ Create New Category - Set Inactive
1. Click "New"
2. Toggle OFF (Inactive)
3. **Expected:** Red "Inactive" badge shown
4. Fill name and save
5. **Expected:** Backend receives `is_active: 0`
6. **Expected:** Category created with is_active = 0

### ✅ Edit Category - Keep Status
1. Click edit on Active category
2. **Expected:** Toggle is ON
3. Don't change toggle
4. Save
5. **Expected:** Backend receives `is_active: 1`
6. **Expected:** Category remains active

### ✅ Edit Category - Change Status
1. Click edit on Active category
2. **Expected:** Toggle is ON
3. Toggle OFF
4. **Expected:** Badge changes to "Inactive" (Red)
5. Save
6. **Expected:** Backend receives `is_active: 0`
7. **Expected:** Category status changes to inactive

### ✅ Edit Category - Inactive to Active
1. Click edit on Inactive category
2. **Expected:** Toggle is OFF
3. Toggle ON
4. **Expected:** Badge changes to "Active" (Green)
5. Save
6. **Expected:** Backend receives `is_active: 1`
7. **Expected:** Category status changes to active

---

## Data Flow

### Creating Category (Active):

```
Frontend                      Backend                   Database
--------                      -------                   --------
is_active: true    →    is_active: "1"    →    CAST to int    →    is_active = 1
(boolean)               (string)                                    (integer/boolean)
```

### Creating Category (Inactive):

```
Frontend                      Backend                   Database
--------                      -------                   --------
is_active: false   →    is_active: "0"    →    CAST to int    →    is_active = 0
(boolean)               (string)                                    (integer/boolean)
```

### Editing Category:

```
Database                Frontend                Backend               Database
--------                --------                -------               --------
is_active = 1    →    is_active: true    →    is_active: "1"    →    is_active = 1
                      (converted)             (validated)            (updated)
```

---

## API Request/Response Examples

### Create Active Category:

**Request:**
```http
POST /api/save-category
Content-Type: multipart/form-data

name: "Electronics"
parent_id: null
is_active: 1          ← Active
image: [file]
```

**Response:**
```json
{
    "status": 200,
    "message": "Category created successfully!",
    "data": {
        "id": 1,
        "name": "Electronics",
        "parent_id": null,
        "is_active": 1,
        "image": "categories/123456_electronics.jpg",
        "created_at": "2026-02-08T14:00:00Z",
        "updated_at": "2026-02-08T14:00:00Z"
    }
}
```

### Create Inactive Category:

**Request:**
```http
POST /api/save-category
Content-Type: multipart/form-data

name: "Old Products"
parent_id: null
is_active: 0          ← Inactive
```

**Response:**
```json
{
    "status": 200,
    "message": "Category created successfully!",
    "data": {
        "id": 2,
        "name": "Old Products",
        "parent_id": null,
        "is_active": 0,
        "image": null,
        "created_at": "2026-02-08T14:00:00Z",
        "updated_at": "2026-02-08T14:00:00Z"
    }
}
```

---

## Validation

### Valid Values:
- ✅ `1` = Active
- ✅ `0` = Inactive
- ✅ `null` or not provided = Defaults to 1 (Active)

### Invalid Values (Rejected):
- ❌ `2`, `3`, etc.
- ❌ `"yes"`, `"no"`
- ❌ Any value other than 0 or 1

**Error Response:**
```json
{
    "status": 400,
    "message": {
        "is_active": ["The selected is active is invalid."]
    }
}
```

---

## Benefits

### For Users:
✅ Clear visual indication of category status  
✅ Easy toggle switch (no typing required)  
✅ Instant visual feedback  
✅ Can't accidentally set invalid values  

### For Developers:
✅ Consistent data type (0 or 1)  
✅ Proper validation  
✅ Clear default behavior  
✅ Easy to query (WHERE is_active = 1)  

### For Business:
✅ Can deactivate categories without deleting  
✅ Keep historical data  
✅ Easy to reactivate later  
✅ Better data management  

---

## Future Enhancements

### Possible Additions:
1. **Bulk Status Update**
   - Select multiple categories
   - Activate/Deactivate all at once

2. **Filter by Status**
   - Show only active categories
   - Show only inactive categories

3. **Status History**
   - Track when status changed
   - Track who changed it

4. **Automatic Deactivation**
   - Deactivate categories with no products
   - Scheduled deactivation

---

## Summary

The `is_active` field has been successfully implemented with:

✅ **Default Value:** 1 (Active) for new categories  
✅ **Form Control:** Toggle switch with visual badge  
✅ **Data Type:** Integer (0 or 1)  
✅ **Validation:** Strict validation on backend  
✅ **UI Indicators:** Color-coded status badges  
✅ **Edit Support:** Proper conversion when editing  
✅ **Database:** Properly stored as boolean/integer  

**The category status management is now complete and ready to use!** 🎉
