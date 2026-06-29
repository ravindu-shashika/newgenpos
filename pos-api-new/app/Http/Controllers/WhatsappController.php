<?php

namespace App\Http\Controllers;

use App\Models\WhatsappSetting;
use App\Traits\SpaResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class WhatsappController extends Controller
{
    use SpaResponse;

    /** WhatsApp Settings */
    public function settings(Request $request)
    {
        $settings = WhatsappSetting::firstOrCreate([]);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'permanent_access_token' => $settings->permanent_access_token ?? '',
                'phone_number_id' => $settings->phone_number_id ?? '',
                'business_account_id' => $settings->business_account_id ?? '',
            ]);
        }

        return view('backend.whatsapp.settings', compact('settings'));
    }

    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'phone_number_id' => 'nullable|string',
            'business_account_id' => 'nullable|string',
            'permanent_access_token' => 'nullable|string',
            'message_types' => 'nullable|array',
        ]);

        $settings = WhatsappSetting::firstOrCreate([]);
        $settings->update([
            'phone_number_id' => $data['phone_number_id'],
            'business_account_id' => $data['business_account_id'],
            'permanent_access_token' => $data['permanent_access_token'],
            'message_types' => isset($data['message_types']) ? implode(',', $data['message_types']) : $settings->message_types,
        ]);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'permanent_access_token' => $settings->permanent_access_token ?? '',
                'phone_number_id' => $settings->phone_number_id ?? '',
                'business_account_id' => $settings->business_account_id ?? '',
            ]);
        }

        return redirect()->back()->with('message', __('db.Data updated successfully'));
    }

     // 🔹 Template list page
    public function templates(Request $request)
    {
        $settings = WhatsappSetting::first();
        $asset_id = null;
        $templates = [];
        $error = null;

        if (!$settings || empty($settings->business_account_id) || empty($settings->permanent_access_token)) {
            $error = __('db.whatsapp_credentials_missing');
        } else {
            $asset_id = $settings->business_account_id;
            $templates = $settings->getTemplates();

            if (isset($templates['error'])) {
                $error = $templates['error'];
                $templates = [];
            }
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'asset_id' => $asset_id,
                'templates' => array_values($templates),
                'error' => $error,
            ]);
        }

        if ($error) {
            session()->now('not_permitted', $error);
        }

        return view('backend.whatsapp.templates', compact('templates', 'asset_id'));
    }

    // 🔹 Delete template
    public function deleteTemplate(Request $request, $name)
    {
        $settings = WhatsappSetting::first();
        if (!$settings) {
            $message = __('db.whatsapp_credentials_missing');
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => $message, 'success' => false], 422);
            }
            return back()->with('not_permitted', $message);
        }

        $result = $settings->deleteTemplate($name);

        if ($this->wantsSpaResponse($request)) {
            return response()->json([
                'message' => $result['message'],
                'success' => (bool) ($result['success'] ?? false),
            ], ($result['success'] ?? false) ? 200 : 422);
        }

        return back()->with($result['success'] ? 'message' : 'not_permitted', $result['message']);
    }

    /** Send Message */
    public function sendPage(Request $request)
    {
        $receivers = [];

        $suppliers = DB::table('suppliers')->whereNotNull('wa_number')->select('name', 'wa_number as phone')->get();
        if ($suppliers->count()) {
            $receivers['Suppliers'] = $suppliers;
        }

        $customers = DB::table('customers')->whereNotNull('wa_number')->select('name', 'wa_number as phone')->get();
        if ($customers->count()) {
            $receivers['Customers'] = $customers;
        }

        $selectedGroup = $request->get('group');
        $selectedPhone = $request->get('phone');

        $templates = [];
        $error = null;

        $settings = WhatsappSetting::first();
        if (!$settings || empty($settings->business_account_id) || empty($settings->permanent_access_token)) {
            $error = __('db.whatsapp_credentials_missing');
        } else {
            $templates = $settings->getTemplates();
            if (isset($templates['error'])) {
                $error = $templates['error'];
                $templates = [];
            }
        }

        if ($this->wantsSpaResponse($request)) {
            $receiverPayload = [];
            foreach ($receivers as $group => $items) {
                $receiverPayload[$group] = collect($items)->map(fn ($row) => [
                    'name' => $row->name,
                    'phone' => $row->phone,
                ])->values();
            }

            return $this->spaJson($request, [
                'receivers' => $receiverPayload,
                'templates' => array_values($templates),
                'selected_group' => $selectedGroup,
                'selected_phone' => $selectedPhone,
                'error' => $error,
            ]);
        }

        if ($error) {
            session()->now('not_permitted', $error);
        }

        return view('backend.whatsapp.send', compact('templates', 'receivers', 'selectedGroup', 'selectedPhone'));
    }

    public function sendMessage(Request $request)
    {
        // 1️⃣ Validation
        $data = $request->validate([
            'receiver_phone' => 'required|array',
            'receiver_phone.*' => 'required|regex:/^[0-9]+$/',
            'template_info' => 'nullable',
            'message' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240',
            'attachment_type' => 'nullable|in:image,document',
            'html_content' => 'nullable|string'
        ]);

        $phoneNumbers = array_values(array_filter($data['receiver_phone']));
        $type = 'text';
        $messageContent = null;

        if (!empty($data['html_content'])) {
            $cleanHtml = str_replace('class="hidden-print"', 'style="display:none;"', $data['html_content']);
            $tempPath = storage_path("app/temp_file_" . Str::random(8) . ".pdf");
            PDF::setOptions([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
            ])->loadHTML($cleanHtml)->save($tempPath);

            $pdfFile = new UploadedFile(
                $tempPath,
                $data['message'].'.pdf',
                'application/pdf',
                null,
                true
            );

            $type = 'document';
            $messageContent = [
                'file' => $pdfFile,
                'caption' => $data['message'] ?? null,
            ];
        }
        else if (!empty($data['template_info'])) {
                $type = 'template';
                $messageContent = [];
                list($messageContent['name'], $messageContent['lang_code']) = explode('|', $data['template_info']);
        }
        else if ($request->hasFile('attachment')) {
            $type = $data['attachment_type'] === 'image' ? 'image' : 'document';
            $messageContent = [
                'file' => $request->file('attachment'),
                'caption' => $data['message'] ?? null,
            ];
        }
        else {
            $type = 'text';
            $messageContent = $data['message'] ?? null;
        }

        $settings = WhatsappSetting::first();
        if (!$settings || empty($settings->phone_number_id) || empty($settings->permanent_access_token)) {
            $message = __('db.whatsapp_credentials_missing');
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => $message, 'success' => false], 422);
            }
            return back()->with('not_permitted', $message);
        }

        $result = $settings->sendMessage($phoneNumbers, $type, $messageContent);

        if ($request->has('_from_form') || $this->wantsSpaResponse($request)) {
            if ($result['success'] ?? false) {
                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, [
                        'message' => $result['message'],
                        'success' => true,
                    ]);
                }
                return back()->with('message', $result['message']);
            }

            $failMessage = $result['message'] ?? __('db.fail_sent_message');
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => $failMessage, 'success' => false], 422);
            }
            return back()->with('not_permitted', $failMessage);
        }
        return $result;
    }
}
