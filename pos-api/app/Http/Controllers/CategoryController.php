<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index()
    {
        try {
            $user = auth()->user();
            if (!$user->can('categories.view')) {
                return response()->json([
                    'status' => 403,
                    'message' => "You don't have permission to view categories",
                ], 403);
            }

            $categories = Category::with('parent', 'children')->get();

            return response()->json([
                'data' => $categories,
                'status' => 200,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch categories',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->can('categories.create')) {
                return response()->json([
                    'status' => 403,
                    'message' => "You don't have permission to create categories",
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'parent_id' => 'nullable|exists:categories,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'is_active' => 'nullable|boolean',
            ]);

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $imagePath = $image->storeAs('categories', $imageName, 'public');
                $validated['image'] = $imagePath;
            }

            $category = Category::create($validated);

            return response()->json([
                'message' => 'Category created successfully!',
                'data' => $category->load('parent'),
                'status' => 200,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create category',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified category.
     */
    public function show($id)
    {
        try {
            $user = auth()->user();
            if (!$user->can('categories.view')) {
                return response()->json([
                    'status' => 403,
                    'message' => "You don't have permission to view categories",
                ], 403);
            }

            $category = Category::with('parent', 'children')->findOrFail($id);

            return response()->json([
                'data' => $category,
                'status' => 200,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Category not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch category',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id)
    {
        try {
            $user = auth()->user();
            if (!$user->can('categories.edit')) {
                return response()->json([
                    'status' => 403,
                    'message' => "You don't have permission to update categories",
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'parent_id' => 'nullable|exists:categories,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'is_active' => 'nullable|boolean',
            ]);

            $category = Category::findOrFail($id);

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($category->image && Storage::disk('public')->exists($category->image)) {
                    Storage::disk('public')->delete($category->image);
                }

                $image = $request->file('image');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $imagePath = $image->storeAs('categories', $imageName, 'public');
                $validated['image'] = $imagePath;
            }

            $category->update($validated);

            return response()->json([
                'message' => 'Category updated successfully!',
                'data' => $category->load('parent'),
                'status' => 200,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Category not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update category',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified category.
     */
    public function destroy($id)
    {
        try {
            $user = auth()->user();
            if (!$user->can('categories.delete')) {
                return response()->json([
                    'status' => 403,
                    'message' => "You don't have permission to delete categories",
                ], 403);
            }

            $category = Category::findOrFail($id);

            // Check if category has children
            if ($category->children()->count() > 0) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cannot delete category with subcategories. Please delete or reassign subcategories first.',
                ], 400);
            }

            // Delete image if exists
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }

            $category->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Category deleted successfully!',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Category not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete category',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all parent categories (categories without parent_id).
     */
    public function getParentCategories()
    {
        try {
            $user = auth()->user();
            if (!$user->can('categories.view')) {
                return response()->json([
                    'status' => 403,
                    'message' => "You don't have permission to view categories",
                ], 403);
            }

            $categories = Category::whereNull('parent_id')->get();

            return response()->json([
                'data' => $categories,
                'status' => 200,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch parent categories',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Unified save method for both create and update.
     */
    public function saveCategory(Request $request)
    {
        try {
            $user = auth()->user();
            $isEdit = $request->has('id') && !empty($request->id);
            
            // Check permission
            if ($isEdit && !$user->can('category.edit')) {
                return response()->json([
                    'status' => 403,
                    'message' => "You don't have permission to update categories",
                ], 200);
            }
            
            if (!$isEdit && !$user->can('category.save')) {
                return response()->json([
                    'status' => 403,
                    'message' => "You don't have permission to create categories",
                ], 200);
            }

            // Validation rules
            $rules = [
                'name' => 'required|string|max:255',
                'parent_id' => 'nullable|exists:categories,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'is_active' => 'nullable|in:0,1',
            ];

            if ($isEdit) {
                $rules['id'] = 'required|exists:categories,id';
            }

            $validated = $request->validate($rules);
            
            // Convert is_active to boolean (0 or 1)
            if (isset($validated['is_active'])) {
                $validated['is_active'] = (int) $validated['is_active'];
            } else {
                $validated['is_active'] = 1; // Default to active
            }

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $imagePath = $image->storeAs('categories', $imageName, 'public');
                $validated['image'] = $imagePath;
            }

            if ($isEdit) {
                // Update existing category
                $category = Category::findOrFail($request->id);
                
                // Delete old image if new one is uploaded
                if ($request->hasFile('image') && $category->image && Storage::disk('public')->exists($category->image)) {
                    Storage::disk('public')->delete($category->image);
                }
                
                $category->update($validated);
                $message = 'Category updated successfully!';
            } else {
                // Create new category
                $category = Category::create($validated);
                $message = 'Category created successfully!';
            }

            return response()->json([
                'message' => $message,
                'data' => $category->load('parent'),
                'status' => 200,
            ], 200);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 400,
                'message' => $e->errors(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'error' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Delete category via GET request (for compatibility).
     */
    public function deleteCategory($id)
    {
        try {
            $user = auth()->user();
            if (!$user->can('category.delete')) {
                return response()->json([
                    'status' => 403,
                    'message' => "You don't have permission to delete categories",
                ], 200);
            }

            $category = Category::findOrFail($id);

            // Check if category has children
            if ($category->children()->count() > 0) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cannot delete category with subcategories. Please delete or reassign subcategories first.',
                ], 200);
            }

            // Delete image if exists
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }

            $category->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Category deleted successfully!',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Category not found',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'error' => $e->getMessage(),
            ], 200);
        }
    }
}
