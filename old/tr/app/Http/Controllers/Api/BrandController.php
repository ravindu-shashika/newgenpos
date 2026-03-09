<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Brand;
use Illuminate\Validation\Rule;
use App\Traits\TenantInfo;
use App\Traits\CacheForget;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    use CacheForget;
    use TenantInfo;
    
    public function test()
    {
        return 'test success!';
    }
    
    public function index()
    {
        try {
            // Fetch all active brands
            // $brands = Brand::where('is_active', true)->get();
            $brands = Brand::where('is_active', true)->get()->map(function ($brand) {
                $brand->image = $brand->image ? asset('images/brand/' . $brand->image) : null;
                return $brand;
            });
    
            // Return success response with the list of brands
            return response()->json($brands, 200);
        } catch (\Exception $e) {
            // Handle unexpected errors
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve brands.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function store(Request $request)
    {
        try {
            // Trim and sanitize the title
            $request->merge(['title' => preg_replace('/\s+/', ' ', $request->title)]);
    
            // Validation
            $validator = Validator::make($request->all(), [
                'title' => [
                    'required',
                    'max:255',
                    Rule::unique('brands')->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
                'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:10240', // 10MB max size
            ]);
    
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors(),
                ], 422);
            }
    
            // Prepare input data
            $input = $request->except('image');
            $input['is_active'] = true;
    
            // Generate slug if the ecommerce addon is enabled
            if (in_array('ecommerce', explode(',', config('addons')))) {
                $input['slug'] = Str::slug($request->title, '-');
            }
    
            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $ext = $image->getClientOriginalExtension();
                $timestamp = date("Ymdhis");
                $imageName = $timestamp . '.' . $ext;
    
                // Handle tenant-specific naming
                if (config('database.connections.saleprosaas_landlord')) {
                    $imageName = $this->getTenantId() . '_' . $imageName;
                }
    
                $image->move(public_path('images/brand'), $imageName);
                $input['image'] = $imageName;
            }
    
            // Create the brand
            $brand = Brand::create($input);
    
            // Clear cache if necessary
            $this->cacheForget('brand_list');
    
            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Brand created successfully.',
                'data' => $brand,
            ], 201);
        } catch (\Exception $e) {
            // Handle unexpected errors
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating the brand.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    public function update(Request $request, $id)
    {
        try {
            // Validate the request data
            $this->validate($request, [
                'title' => [
                    'max:255',
                    Rule::unique('brands')->ignore($id)->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
                'image' => 'image|mimes:jpg,jpeg,png,gif|max:100000',
            ]);
    
            // Find the brand by ID
            $brand = Brand::findOrFail($id);
    
            // Update the title
            $brand->title = $request->title;
    
            // Check for additional fields if 'ecommerce' addon is enabled
            if (in_array('ecommerce', explode(',', config('addons')))) {
                $brand->page_title = $request->page_title;
                $brand->short_description = $request->short_description;
            }
    
            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $ext = $image->getClientOriginalExtension();
                $imageName = date("Ymdhis");
    
                if (!config('database.connections.saleprosaas_landlord')) {
                    $imageName = $imageName . '.' . $ext;
                    $image->move(public_path('images/brand'), $imageName);
                } else {
                    $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
                    $image->move(public_path('images/brand'), $imageName);
                }
                $brand->image = $imageName;
            }
    
            // Save the updated brand
            $brand->save();
    
            // Clear brand cache
            $this->cacheForget('brand_list');
    
            // Return a success response
            return response()->json([
                'success' => true,
                'message' => 'Brand updated successfully.',
                'data' => $brand,
            ], 200);
        } catch (ModelNotFoundException $e) {
            // Handle the case where the brand is not found
            return response()->json([
                'success' => false,
                'message' => 'Brand not found.',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Exception $e) {
            // Handle unexpected errors
            return response()->json([
                'success' => false,
                'message' => 'Failed to update brand.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function destroy($id)
    {
        try {
            // Find the brand by ID or fail
            $brand = Brand::findOrFail($id);
    
            // Set brand as inactive (soft delete)
            $brand->is_active = false;
    
            // Check if an image exists and delete it if necessary
            if ($brand->image) {
                $imagePath = public_path('images/brand/' . $brand->image);
    
                if (file_exists($imagePath)) {
                    unlink($imagePath); // Delete the image
                }
            }
    
            // Save the updated brand
            $brand->save();
    
            // Clear the brand list cache
            $this->cacheForget('brand_list');
    
            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Brand deleted successfully.',
            ], 200);
    
        } catch (ModelNotFoundException $e) {
            // Handle the case where the brand is not found
            return response()->json([
                'success' => false,
                'message' => 'Brand not found.',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Exception $e) {
            // Handle unexpected errors
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete brand.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

}
