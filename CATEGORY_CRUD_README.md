# Category CRUD Implementation

## Overview
This document describes the complete Category CRUD (Create, Read, Update, Delete) implementation for the NewGenPOS system.

## Backend (Laravel API)

### 1. CategoryController
**Location:** `pos-api/app/Http/Controllers/CategoryController.php`

**Features:**
- Full CRUD operations with permission checks
- Image upload and storage handling
- Parent-child category relationship support
- Automatic image deletion when updating/deleting categories
- Prevention of deleting categories with subcategories

**Endpoints:**
- `GET /api/categories` - Get all categories with relationships
- `POST /api/category` - Create new category
- `GET /api/category/{id}` - Get single category
- `POST /api/category/{id}` - Update category
- `DELETE /api/category/{id}` - Delete category
- `GET /api/categories/parent` - Get parent categories only

**Permissions Required:**
- `category.view` - View categories
- `category.save` - Create categories
- `category.edit` - Update categories
- `category.delete` - Delete categories

### 2. API Routes
**Location:** `pos-api/routes/api.php`

All category routes are protected by Sanctum authentication middleware.

### 3. Category Model
**Location:** `pos-api/app/Models/Category.php`

**Fields:**
- `id` - Primary key
- `name` - Category name (required)
- `image` - Image path (nullable)
- `parent_id` - Parent category ID (nullable)
- `is_active` - Active status (boolean)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Relationships:**
- `parent()` - belongsTo Category
- `children()` - hasMany Category

### 4. Database Migration
**Location:** `pos-api/database/migrations/2026_02_08_000008_create_categories_table.php`

The categories table already exists with the proper structure.

## Frontend (Vue.js)

### 1. Category Service
**Location:** `pos-client/src/service/categoryService.js`

**Functions:**
- `getAllCategories()` - Fetch all categories
- `getCategory(id)` - Fetch single category
- `createCategory(formData)` - Create new category with image upload
- `updateCategory(id, formData)` - Update category with image upload
- `deleteCategory(id)` - Delete category
- `getParentCategories()` - Fetch parent categories for dropdown

### 2. Category View Component
**Location:** `pos-client/src/views/pages/category.vue`

**Features:**
- DataTable with sorting, pagination, and filtering
- Add/Edit modal dialog with form validation
- Image upload with preview
- Parent category selection dropdown
- Delete confirmation dialogs
- Bulk delete functionality
- Export to CSV
- Toast notifications for user feedback

**Modal Fields:**
- Name (required) - Text input
- Image - File upload
- Parent Category - Dropdown selector

## Setup Instructions

### Backend Setup

1. **Install dependencies** (if not already done):
```bash
cd pos-api
composer install
```

2. **Run migrations** (if not already done):
```bash
php artisan migrate
```

3. **Create storage link** (for image uploads):
```bash
php artisan storage:link
```

4. **Add permissions to database** (if using permissions system):
```sql
INSERT INTO permissions (name, guard_name) VALUES
('category.view', 'web'),
('category.save', 'web'),
('category.edit', 'web'),
('category.delete', 'web');
```

5. **Assign permissions to roles** (example for admin role):
```sql
INSERT INTO role_has_permissions (permission_id, role_id)
SELECT id, 1 FROM permissions WHERE name LIKE 'category.%';
```

### Frontend Setup

1. **Install dependencies** (if not already done):
```bash
cd pos-client
npm install
```

2. **Start development server**:
```bash
npm run dev
```

## Usage

### Creating a Category

1. Click the "New" button in the toolbar
2. Enter category name (required)
3. Optionally select a parent category
4. Optionally upload an image
5. Click "Submit"

### Editing a Category

1. Click the edit (pencil) icon on a category row
2. Modify the fields as needed
3. Click "Submit"

### Deleting a Category

1. Click the delete (trash) icon on a category row
2. Confirm the deletion
3. Note: Categories with subcategories cannot be deleted

### Image Storage

Images are stored in:
- **Backend:** `pos-api/storage/app/public/categories/`
- **Public URL:** `http://your-domain/storage/categories/{filename}`

## API Response Format

### Success Response:
```json
{
  "status": 200,
  "message": "Category created successfully!",
  "data": {
    "id": 1,
    "name": "Electronics",
    "image": "categories/1234567890_electronics.jpg",
    "parent_id": null,
    "is_active": true,
    "created_at": "2026-02-08T10:00:00.000000Z",
    "updated_at": "2026-02-08T10:00:00.000000Z"
  }
}
```

### Error Response:
```json
{
  "status": 403,
  "message": "You don't have permission to create categories"
}
```

## Security

1. **Authentication:** All routes require Sanctum authentication
2. **Authorization:** Permission-based access control
3. **Validation:** Server-side validation for all inputs
4. **File Upload:** Restricted to image files only (jpeg, png, jpg, gif, webp)
5. **File Size:** Maximum 2MB per image

## Testing

### Test the API with Postman/Insomnia:

1. **Login first** to get authentication token
2. **Create Category:**
   - POST to `http://127.0.0.1:8000/api/category`
   - Set Authorization header: `Bearer {token}`
   - Use form-data with fields: name, image (file), parent_id

3. **Get Categories:**
   - GET to `http://127.0.0.1:8000/api/categories`
   - Set Authorization header: `Bearer {token}`

## Troubleshooting

### Image upload not working:
- Ensure storage link is created: `php artisan storage:link`
- Check folder permissions: `storage/app/public/categories/`

### Permission denied errors:
- Verify user has required permissions
- Check role_has_permissions table

### CORS issues:
- Configure CORS settings in `config/cors.php`
- Ensure credentials are included in requests

## Future Enhancements

1. Category sorting/ordering
2. Category icons
3. SEO-friendly slugs
4. Category descriptions
5. Multi-level nested categories display
6. Category product count
7. Bulk import/export
8. Category status toggle (active/inactive)

## Notes

- The category system supports unlimited nested levels
- Parent categories can have multiple child categories
- Deleting a category will fail if it has child categories
- Images are automatically deleted when replacing or removing categories
- The system uses Laravel's storage system for secure file handling
