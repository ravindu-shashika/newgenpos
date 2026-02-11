<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Brand;
use Illuminate\Validation\Rule;
use App\Traits\TenantInfo;
use App\Traits\CacheForget;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    use CacheForget;
    use TenantInfo;

    public function index()
    {
        $lims_brand_all = Brand::where('is_active',true)->get();
        return view('backend.brand.create', compact('lims_brand_all'));
    }

    // API Methods for Vue Frontend
    public function getAllBrands()
    {
        try {
            $brands = Brand::where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $brands,
                'message' => 'Brands fetched successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch brands',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function saveBrand(Request $request)
    {
        try {
            // Validation
            $validated = $request->validate([
                'title' => [
                    'required',
                    'max:255',
                    Rule::unique('brands')->ignore($request->id)->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
                'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:2048',
                'is_active' => 'boolean'
            ]);

            // Check if it's an update or create
            if ($request->id) {
                // Update existing brand
                $brand = Brand::findOrFail($request->id);
                $brand->title = $request->title;
                $brand->is_active = $request->is_active ?? true;

                // Handle image upload
                if ($request->hasFile('image')) {
                    // Delete old image if exists
                    if ($brand->image && file_exists(public_path('storage/brands/' . $brand->image))) {
                        unlink(public_path('storage/brands/' . $brand->image));
                    }

                    $image = $request->file('image');
                    $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                    $image->storeAs('brands', $imageName, 'public');
                    $brand->image = 'brands/' . $imageName;
                }

                $brand->save();
                $message = 'Brand updated successfully';
            } else {
                // Create new brand
                $input = [
                    'title' => $request->title,
                    'is_active' => $request->is_active ?? true
                ];

                if (in_array('ecommerce', explode(',', config('addons', ''))))
                    $input['slug'] = Str::slug($request->title, '-');

                // Handle image upload
                if ($request->hasFile('image')) {
                    $image = $request->file('image');
                    $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                    $image->storeAs('brands', $imageName, 'public');
                    $input['image'] = 'brands/' . $imageName;
                }

                $brand = Brand::create($input);
                $message = 'Brand created successfully';
            }

            $this->cacheForget('brand_list');

            return response()->json([
                'status' => 200,
                'data' => $brand,
                'message' => $message
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 400,
                'message' => $e->errors()
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to save brand',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteBrand($id)
    {
        try {
            $brand = Brand::findOrFail($id);
            
            // Soft delete by setting is_active to false
            $brand->is_active = false;
            $brand->save();

            $this->cacheForget('brand_list');

            return response()->json([
                'status' => 200,
                'message' => 'Brand deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete brand',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {

        $request->title = preg_replace('/\s+/', ' ', $request->title);
        $this->validate($request, [
            'title' => [
                'max:255',
                    Rule::unique('brands')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],

            'image' => 'image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);

        $input = $request->except('image');
        $input['is_active'] = true;
        if(in_array('ecommerce', explode(',',config('addons'))))
            $input['slug'] = Str::slug($request->title, '-');
        $image = $request->image;
        if ($image) {
            $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
            $imageName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $imageName = $imageName . '.' . $ext;
                $image->move(public_path('images/brand'),$imageName);
            }
            else {
                $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
                $image->move(public_path('images/brand'),$imageName);
            }
            $input['image'] = $imageName;
        }
        $brand = Brand::create($input);
        $this->cacheForget('brand_list');

        if(isset($input['ajax']))
            return $brand;
        else 
            return redirect('brand');
    }

    public function edit($id)
    {
        $lims_brand_data = Brand::findOrFail($id);
        return $lims_brand_data;
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'title' => [
                'max:255',
                    Rule::unique('brands')->ignore($request->brand_id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],

            'image' => 'image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);
        $lims_brand_data = Brand::findOrFail($request->brand_id);
        $lims_brand_data->title = $request->title;
        if(in_array('ecommerce', explode(',',config('addons')))) {
            $lims_brand_data->page_title = $request->page_title;
            $lims_brand_data->short_description = $request->short_description;
        }
        $image = $request->image;
        if ($image) {
            $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
            $imageName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $imageName = $imageName . '.' . $ext;
                $image->move(public_path('images/brand'),$imageName);
            }
            else {
                $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
                $image->move(public_path('images/brand'),$imageName);
            }
            $lims_brand_data->image = $imageName;
        }
        $lims_brand_data->save();
        $this->cacheForget('brand_list');
        return redirect('brand');
    }

    public function importBrand(Request $request)
    {
        //get file
        $upload=$request->file('file');
        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if($ext != 'csv')
            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        $filename =  $upload->getClientOriginalName();
        $filePath=$upload->getRealPath();
        //open and read
        $file=fopen($filePath, 'r');
        $header= fgetcsv($file);
        $escapedHeader=[];
        //validate
        foreach ($header as $key => $value) {
            $lheader=strtolower($value);
            $escapedItem=preg_replace('/[^a-z]/', '', $lheader);
            array_push($escapedHeader, $escapedItem);
        }
        //looping through othe columns
        while($columns=fgetcsv($file))
        {
            if($columns[0]=="")
                continue;
            foreach ($columns as $key => $value) {
                $value=preg_replace('/\D/','',$value);
            }
           $data= array_combine($escapedHeader, $columns);

           $brand = Brand::firstOrNew([ 'title'=>$data['title'], 'is_active'=>true ]);
           $brand->title = $data['title'];
           $brand->image = $data['image'];
           $brand->is_active = true;
           $brand->save();
        }
        $this->cacheForget('brand_list');
        return redirect('brand')->with('message', __('db.Brand imported successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        $brand_id = $request['brandIdArray'];
        foreach ($brand_id as $id) {
            $lims_brand_data = Brand::findOrFail($id);
            if($lims_brand_data->image && !config('database.connections.saleprosaas_landlord') && file_exists('images/brand/'.$lims_brand_data->image)) {
                unlink('images/brand/'.$lims_brand_data->image);
            }
            elseif($lims_brand_data->image && file_exists('images/brand/'.$lims_brand_data->image)) {
                unlink('images/brand/'.$lims_brand_data->image);
            }
            $lims_brand_data->is_active = false;
            $lims_brand_data->save();
        }
        $this->cacheForget('brand_list');
        return 'Brand deleted successfully!';
    }

    public function destroy($id)
    {
        $lims_brand_data = Brand::findOrFail($id);
        $lims_brand_data->is_active = false;
        if($lims_brand_data->image && !config('database.connections.saleprosaas_landlord') && file_exists('images/brand/'.$lims_brand_data->image)) {
            unlink('images/brand/'.$lims_brand_data->image);
        }
        elseif($lims_brand_data->image && file_exists('images/brand/'.$lims_brand_data->image)) {
            unlink('images/brand/'.$lims_brand_data->image);
        }
        $lims_brand_data->save();
        $this->cacheForget('brand_list');
        return redirect('brand')->with('not_permitted', __('db.Brand deleted successfully!'));
    }

    public function exportBrand(Request $request)
    {
        $lims_brand_data = $request['brandArray'];
        $csvData=array('Brand Title, Image');
        foreach ($lims_brand_data as $brand) {
            if($brand > 0) {
                $data = Brand::where('id', $brand)->first();
                $csvData[]=$data->title.','.$data->image;
            }
        }
        $filename=date('Y-m-d').".csv";
        $file_path=public_path().'/downloads/'.$filename;
        $file_url=url('/').'/downloads/'.$filename;
        $file = fopen($file_path,"w+");
        foreach ($csvData as $exp_data){
          fputcsv($file,explode(',',$exp_data));
        }
        fclose($file);
        return $file_url;
    }
}
