<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\SmsTemplate;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;

class SmsTemplateController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('role_permission');
    }

    protected function formatTemplate(SmsTemplate $template): array
    {
        return [
            'id' => $template->id,
            'name' => $template->name,
            'content' => $template->content,
            'is_default' => (bool) $template->is_default,
            'is_default_ecommerce' => (bool) $template->is_default_ecommerce,
        ];
    }

    protected function normalizePayload(Request $request): array
    {
        return [
            'name' => $request->input('name'),
            'content' => $request->input('content'),
            'is_default' => filter_var($request->input('is_default', false), FILTER_VALIDATE_BOOLEAN),
            'is_default_ecommerce' => filter_var($request->input('is_default_ecommerce', false), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    protected function applyDefaultFlags(array $data, ?int $exceptId = null): array
    {
        if (!empty($data['is_default'])) {
            $query = SmsTemplate::where('is_default', true);
            if ($exceptId) {
                $query->where('id', '!=', $exceptId);
            }
            $query->update(['is_default' => false]);
            $data['is_default'] = true;
        } else {
            $data['is_default'] = false;
        }

        if (!empty($data['is_default_ecommerce'])) {
            $query = SmsTemplate::where('is_default_ecommerce', true);
            if ($exceptId) {
                $query->where('id', '!=', $exceptId);
            }
            $query->update(['is_default_ecommerce' => false]);
            $data['is_default_ecommerce'] = true;
        } else {
            $data['is_default_ecommerce'] = false;
        }

        return $data;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $templates = SmsTemplate::orderBy('id')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $templates->map(fn ($template) => $this->formatTemplate($template)),
            ]);
        }

        return view('backend.sms_templates.index', compact('templates'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $data = $this->applyDefaultFlags($this->normalizePayload($request));
        $template = SmsTemplate::create($data);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data inserted successfully'),
                'data' => $this->formatTemplate($template),
            ], 201);
        }

        return redirect('smstemplates')->with('message', __('db.Data inserted successfully'));
    }

    public function update(Request $request, string $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $templateId = $request->input('smstemplate_id', $id);
        $template = SmsTemplate::findOrFail($templateId);
        $data = $this->applyDefaultFlags($this->normalizePayload($request), (int) $template->id);
        $template->update($data);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatTemplate($template->fresh()),
            ]);
        }

        return redirect('smstemplates')->with('message', __('db.Data updated successfully'));
    }

    public function destroy(Request $request, string $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $template = SmsTemplate::findOrFail($id);
        $template->delete();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data deleted successfully'),
            ]);
        }

        return redirect()->back();
    }
}
