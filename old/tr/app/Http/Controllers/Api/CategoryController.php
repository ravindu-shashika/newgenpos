<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Product;
use DB;
use Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Validation\Rule;
use App\Traits\TenantInfo;
use App\Traits\CacheForget;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;


class CategoryController extends Controller
{
    // public function index(Request $request)
    // {
    //     try {
    //         $user = Auth::user();
    //         $role = Role::find($user->role_id);
    
    //         // Check if the user has permission to access the category module
    //         if (!$role->hasPermissionTo('category')) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Sorry! You are not allowed to access this module.',
    //             ], 403);
    //         }
    
    //         $categories = Category::where('is_active', true)
    //                                 ->with('parent')
    //                                 ->orderBy('id', 'desc')
    //                                 ->get();
                        
            
    
    //       return response()->json($categories);
    
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'An error occurred while retrieving category data.',
    //             'error' => $e->getMessage(),
    //         ], 500);
    //     }
    // }
    
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $role = Role::find($user->role_id);
    
            // Check if the user has permission to access the category module
            if (!$role->hasPermissionTo('category')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sorry! You are not allowed to access this module.',
                ], 403);
            }
    
            // Pagination parameters// Default limit is 10   // Default page is 1
            $search = $request->input('search', '');
    
            // Retrieve categories
            $query = Category::where('is_active', true)->with('parent');
            if (!empty($search)) {
                $query->where('name', 'LIKE', "%{$search}%");
            }
    
            $totalData = $query->count();
            $categories = $query->orderBy('id', 'desc')->get();
    
            // Format categories
            $data = $categories->map(function ($category) {
                $parentName = $category->parent_id
                    ? Category::find($category->parent_id)->name
                    : "N/A";
    
                $totalProducts = $category->product()->where('is_active', true);
                $totalPrice = $totalProducts->sum(DB::raw('price * qty'));
                $totalCost = $totalProducts->sum(DB::raw('cost * qty'));
    
                $stockWorth = config('currency_position') == 'prefix'
                    ? config('currency') . " $totalPrice / " . config('currency') . " $totalCost"
                    : "$totalPrice " . config('currency') . " / $totalCost " . config('currency');
    
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'image_url' => $category->image
                        ? url('images/category', $category->image)
                        : url('images/zummXD2dvAtI.png'),
                    'parent_name' => $parentName,
                    'number_of_products' => $totalProducts->count(),
                    'stock_quantity' => $totalProducts->sum('qty'),
                    'stock_worth' => $stockWorth,
                ];
            });
    
            return response()->json($data, 200);
    
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving category data.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
      
            // Validate the request
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:categories,name',
                'parent_id' => 'nullable|exists:categories,id',
                'is_active' => 'required|boolean',
                'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:2048',
            ]);
    
            // Prepare category data
            $category = new Category();
            $category->name = $validated['name'];
            $category->parent_id = $validated['parent_id'];
            $category->is_active = $validated['is_active'];
    
            // Handle image upload (if provided)
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('categories', 'public');
                $category->image = $imagePath;
            } else {
                $category->image = null; // No image provided
            }
    
            // Save the category
            $category->save();
    
            return response()->json([
                'success' => true,
                'message' => 'Category created successfully.',
                'data' => $category,
            ], 201);
    
       
    }
    
    public function update(Request $request, $id)
    {
        // Fetch the existing category
        $lims_category_data = Category::find($id);
        if (!$lims_category_data) {
            return redirect()->back()->with('error', 'Category not found.');
        }
        
        // Prepare the input data
        $input = $request->except(['image', 'icon', '_method', '_token', 'category_id']);
        $image = $request->file('image');
        $icon = $request->file('icon');
    
        // Handle image upload
        if ($image) {
            // Delete old image if it exists
            if ($lims_category_data->image) {
                $this->fileDelete(public_path('images/category/'), $lims_category_data->image);
            }
    
            // Save new image
            $imageName = date('YmdHis') . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images/category'), $imageName);
    
            // Resize and save large and thumbnail versions
            $manager = new ImageManager();
            $manager->make(public_path('images/category/') . $imageName)
                ->fit(600, 750)
                ->save(public_path('images/category/large/') . $imageName, 100);
            $manager->make(public_path('images/category/') . $imageName)
                ->fit(300, 300)
                ->save();
    
            $input['image'] = $imageName;
        }
    
        // Handle icon upload
        if ($icon) {
            // Delete old icon if it exists
            if ($lims_category_data->icon) {
                $this->fileDelete(public_path('images/category/icons/'), $lims_category_data->icon);
            }
    
            // Save new icon
            $iconName = date('YmdHis') . '.' . $icon->getClientOriginalExtension();
            $icon->move(public_path('images/category/icons'), $iconName);
    
            // Resize and save
            $manager = new ImageManager();
            $manager->make(public_path('images/category/icons/') . $iconName)
                ->fit(100, 100)
                ->save();
    
            $input['icon'] = $iconName;
        }
    
        // Set default values for optional fields
        if (!isset($request->featured) && \Schema::hasColumn('categories', 'featured')) {
            $input['featured'] = 0;
        }
    
        if (!isset($input['is_sync_disable']) && \Schema::hasColumn('categories', 'is_sync_disable')) {
            $input['is_sync_disable'] = null;
        }
    
        if (\Schema::hasColumn('categories', 'page_title')) {
            $input['page_title'] = $request->page_title ?? $lims_category_data->page_title;
        }
    
        if (\Schema::hasColumn('categories', 'short_description')) {
            $input['short_description'] = $request->short_description ?? $lims_category_data->short_description;
        }
    
        // Update the category in the database
       $category =  DB::table('categories')->where('id', $request->category_id)->update($input);
    
        // return redirect('category')->with('message', 'Category updated successfully');
        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully.',
            'data' => $category,
        ], 200);
    }

    
    public function destroy($id)
    {
        try {
            $lims_category_data = Category::findOrFail($id);
    
            // Soft delete the category by setting `is_active` to false
            $lims_category_data->is_active = false;
            $lims_category_data->save();
    
            // Soft delete all products under this category
            $lims_product_data = Product::where('category_id', $id)->get();
            foreach ($lims_product_data as $product_data) {
                $product_data->is_active = false;
                $product_data->save();
            }
    
            // Delete category image and icon if they exist
            $this->fileDelete(public_path('images/category/'), $lims_category_data->image);
            $this->fileDelete(public_path('images/category/icons/'), $lims_category_data->icon);
    
            
    
            // Return JSON response
            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category',
                'error' => $e->getMessage(),
            ], 500);
        }
    }



}