<?php

namespace App\Http\Controllers;

use App\Models\SmsTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsTemplateApiController extends Controller
{
    /**
     * List all SMS templates.
     */
    public function index(): JsonResponse
    {
        $templates = SmsTemplate::orderBy('id')->get();
        return response()->json([
            'status' => 200,
            'data' => $templates,
        ]);
    }

    /**
     * Store a new SMS template.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $data = [
            'name' => $request->name,
            'content' => $request->content,
            'is_default' => $request->boolean('is_default'),
            'is_default_ecommerce' => $request->boolean('is_default_ecommerce'),
        ];

        if ($data['is_default']) {
            SmsTemplate::where('is_default', true)->update(['is_default' => false]);
        }
        if ($data['is_default_ecommerce']) {
            SmsTemplate::where('is_default_ecommerce', true)->update(['is_default_ecommerce' => false]);
        }

        SmsTemplate::create($data);

        return response()->json([
            'status' => 200,
            'message' => __('db.Data inserted successfully'),
        ]);
    }

    /**
     * Update an SMS template.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $template = SmsTemplate::findOrFail($id);
        $data = [
            'name' => $request->name,
            'content' => $request->content,
            'is_default' => $request->boolean('is_default'),
            'is_default_ecommerce' => $request->boolean('is_default_ecommerce'),
        ];

        if ($data['is_default']) {
            SmsTemplate::where('id', '!=', $template->id)->where('is_default', true)->update(['is_default' => false]);
        } else {
            $data['is_default'] = false;
        }
        if ($data['is_default_ecommerce']) {
            SmsTemplate::where('id', '!=', $template->id)->where('is_default_ecommerce', true)->update(['is_default_ecommerce' => false]);
        } else {
            $data['is_default_ecommerce'] = false;
        }

        $template->update($data);

        return response()->json([
            'status' => 200,
            'message' => __('db.Data updated successfully'),
        ]);
    }

    /**
     * Delete an SMS template.
     */
    public function destroy(string $id): JsonResponse
    {
        $template = SmsTemplate::findOrFail($id);
        $template->delete();
        return response()->json([
            'status' => 200,
            'message' => __('db.Data deleted successfully'),
        ]);
    }
}
