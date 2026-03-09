<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Courier;

class CourierController extends Controller
{

    public function index()
    {
        $lims_courier_all = Courier::where('is_active', true)->orderBy('id', 'desc')->get();
        return view('backend.courier.index', compact('lims_courier_all'));
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $data['is_active'] = true;

        Courier::create($data);
        
        return redirect()->back()->with('message', __('db.Courier created successfully'));
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
}
