<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Courier;
use Illuminate\Support\Str;

class CourierController extends Controller
{

    public function index()
    {
        $lims_courier_all = Courier::where('is_active', true)->orderBy('id', 'desc')->get();
        return view('backend.courier.index', compact('lims_courier_all'));
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $request->is_active = true;
        Courier::create($request->all());
        return redirect()->back()->with('message', __('db.Courier created successfully'));
    }

    public function show($id)
    {
        //
    }

    public function edit($id)
    {
        //
    }

    public function update(Request $request, $id)
    {
        Courier::find($request->id)->update($request->all());
        return redirect()->back()->with('message', __('db.Courier updated successfully'));
    }

    public function destroy($id)
    {
        Courier::find($id)->update(['is_active' => false]);
        return redirect()->back()->with('not_permitted', __('db.Courier deleted successfully'));
    }

    /**
     * API: List active couriers for React (api_key and secret_key masked).
     */
    public function listApi()
    {
        $couriers = Courier::where('is_active', true)->orderBy('id', 'desc')->get();
        $list = $couriers->map(function ($courier) {
            return [
                'id' => $courier->id,
                'name' => $courier->name,
                'phone_number' => $courier->phone_number,
                'address' => $courier->address,
                'api_key_display' => $courier->api_key ? Str::limit($courier->api_key, 3) : '',
                'secret_key_display' => $courier->secret_key ? Str::limit($courier->secret_key, 3) : '',
            ];
        });
        return response()->json(['status' => 200, 'data' => $list]);
    }

    /**
     * API: Get one courier for edit (includes full api_key and secret_key).
     */
    public function editApi($id)
    {
        $courier = Courier::where('is_active', true)->findOrFail($id);
        $courier->makeVisible(['api_key', 'secret_key']);
        return response()->json([
            'status' => 200,
            'data' => [
                'id' => $courier->id,
                'name' => $courier->name,
                'phone_number' => $courier->phone_number,
                'address' => $courier->address,
                'api_key' => $courier->api_key,
                'secret_key' => $courier->secret_key,
            ],
        ]);
    }

    /**
     * API: Store new courier.
     */
    public function storeApi(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:255',
            'address' => 'required|string',
            'api_key' => 'nullable|string|max:255',
            'secret_key' => 'nullable|string|max:255',
        ]);
        Courier::create([
            'name' => $request->name,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'api_key' => $request->api_key,
            'secret_key' => $request->secret_key,
            'is_active' => true,
        ]);
        return response()->json(['status' => 200, 'message' => __('db.Courier created successfully')]);
    }

    /**
     * API: Update courier.
     */
    public function updateApi(Request $request, $id)
    {
        $courier = Courier::where('is_active', true)->findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:255',
            'address' => 'required|string',
            'api_key' => 'nullable|string|max:255',
            'secret_key' => 'nullable|string|max:255',
        ]);
        // If name is SteadFast, do not allow changing name (match Blade behavior)
        $data = [
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'api_key' => $request->api_key,
            'secret_key' => $request->secret_key,
        ];
        if (strcasecmp($courier->name, 'SteadFast') !== 0) {
            $data['name'] = $request->name;
        }
        $courier->update($data);
        return response()->json(['status' => 200, 'message' => __('db.Courier updated successfully')]);
    }

    /**
     * API: Soft delete courier.
     */
    public function destroyApi($id)
    {
        $courier = Courier::where('is_active', true)->findOrFail($id);
        $courier->update(['is_active' => false]);
        return response()->json(['status' => 200, 'message' => __('db.Courier deleted successfully')]);
    }
}
