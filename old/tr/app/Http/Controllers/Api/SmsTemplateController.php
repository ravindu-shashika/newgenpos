<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SmsTemplate;
use App\Http\Resources\SmsTemplateResource;

class SmsTemplateController extends Controller
{
    public function index()
    {
        $templates = SmsTemplate::all();
        return response()->json(
            SmsTemplateResource::collection($templates)
        );
    }
 
    public function store(Request $request)
    {
        $data = $request->all();
        
        if (isset($data['is_default']) && $data['is_default'] == true) {
            SmsTemplate::where('is_default', true)->update(['is_default' => false]);
        }

        if (isset($data['is_default_ecommerce']) && $data['is_default_ecommerce'] == true) {
            SmsTemplate::where('is_default_ecommerce', true)->update(['is_default' => false]);
        }

        SmsTemplate::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Data created successfully.',
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $data = $request->all();

        $template = SmsTemplate::find($data['smstemplate_id']);

        if (isset($data['is_default']) && $data['is_default'] == true) {
            // Update existing default item to false, excluding the current item being updated
            SmsTemplate::where('id', '!=', $template->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }
        else {
            $data['is_default'] = false;
        }
        if (isset($data['is_default_ecommerce']) && $data['is_default_ecommerce'] == true) {
            // Update existing default item to false, excluding the current item being updated
            SmsTemplate::where('id', '!=', $template->id)
                ->where('is_default_ecommerce', true)
                ->update(['is_default_ecommerce' => false]);
        }
        else {
            $data['is_default_ecommerce'] = false;
        }

        $template->update($data);
        
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => new SmsTemplateResource($template),
        ], 200);

    }

    public function destroy(string $id)
    {
        $template = SmsTemplate::find($id);
        $template->delete();
        return response()->json([
            'success' => true,
            'message' => 'Data has been deleted successfully.'
        ], 200);
    }
}
