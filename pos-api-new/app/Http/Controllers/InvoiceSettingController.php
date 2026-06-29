<?php

namespace App\Http\Controllers;

use App\Models\InvoiceSetting;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\ImageManager;
use Spatie\Permission\Models\Role;

class InvoiceSettingController extends Controller
{
    use SpaResponse;

    protected function userCanView(): bool
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

        return $role && $role->hasPermissionTo('invoice_setting');
    }

    protected function userCanManage(): bool
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

        return $role && (
            $role->hasPermissionTo('invoice_create_edit_delete')
            || $role->hasPermissionTo('invoice_setting')
        );
    }

    protected function formatInvoiceForSpa(InvoiceSetting $invoice): array
    {
        return [
            'id' => $invoice->id,
            'template_name' => $invoice->template_name,
            'invoice_name' => $invoice->invoice_name,
            'size' => $invoice->size,
            'prefix' => $invoice->prefix,
            'numbering_type' => $invoice->numbering_type,
            'number_of_digit' => $invoice->number_of_digit,
            'start_number' => $invoice->start_number,
            'header_text' => $invoice->header_text,
            'footer_text' => $invoice->footer_text,
            'logo_height' => $invoice->logo_height,
            'logo_width' => $invoice->logo_width,
            'primary_color' => $invoice->primary_color,
            'invoice_date_format' => $invoice->invoice_date_format,
            'company_logo' => $invoice->company_logo,
            'preview_invoice' => $invoice->preview_invoice,
            'is_default' => (bool) $invoice->is_default,
            'status' => (bool) $invoice->status,
            'show_column' => $invoice->show_column,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanView()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $invoiceSettings = InvoiceSetting::orderBy('id', 'desc')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $invoiceSettings->map(fn ($invoice) => $this->formatInvoiceForSpa($invoice)),
            ]);
        }

        return view('backend.setting.invoice_setting.index', [
            'invoiceSettings' => $invoiceSettings,
        ]);
    }

    public function create(Request $request)
    {
        if (!$this->userCanManage()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['data' => []]);
        }

        return view('backend.setting.invoice_setting.create');
    }

    public function store(Request $request)
    {
        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        if (!$this->userCanManage()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $request->validate(['template_name' => 'required|string|max:255']);

        try {
            DB::beginTransaction();
            $data = $this->getRequestData($request);
            $invoice = InvoiceSetting::query()->create($data);
            DB::commit();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Invoice setting stored successfully.'),
                    'data' => $this->formatInvoiceForSpa($invoice),
                ], 201);
            }

            return redirect()->route('settings.invoice.index')->with('customMessage', 'Invoice setting stored successfully.');
        } catch (\Throwable $e) {
            DB::rollBack();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Failed to store invoice setting'),
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 422);
            }

            return redirect()->route('settings.invoice.index')->with('customMessage', 'Failed to store invoice setting');
        }
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanManage()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $invoice = InvoiceSetting::findOrFail($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatInvoiceForSpa($invoice),
            ]);
        }

        return view('backend.setting.invoice_setting.edit', compact('invoice'));
    }

    public function update(Request $request, $id)
    {
        if ($request->has('column') && ($request->ajax() || $this->wantsSpaResponse($request))) {
            if (!$this->userCanManage()) {
                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, [
                        'message' => __('db.Sorry! You are not allowed to access this module'),
                    ], 403);
                }

                return false;
            }

            $this->changeStatus($request, $id);

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Data updated successfully'),
                ]);
            }

            return true;
        }

        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        if (!$this->userCanManage()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $request->validate([
            'template_name' => 'required|string|max:255',
            'prefix' => 'nullable|string|max:10',
        ]);

        try {
            DB::beginTransaction();

            $data = $this->getRequestData($request);
            $invoice = InvoiceSetting::query()->findOrFail($id);
            $invoice->update($data);

            DB::commit();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Invoice setting stored successfully'),
                    'data' => $this->formatInvoiceForSpa($invoice->fresh()),
                ]);
            }

            return redirect()->back()->with('customMessage', 'Invoice setting stored successfully');
        } catch (\Throwable $e) {
            DB::rollBack();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Failed to store invoice setting'),
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 422);
            }

            return redirect()->back()->with('not_permitted', 'Failed to store invoice setting');
        }
    }

    public function destroy(Request $request, $id)
    {
        if (!env('USER_VERIFIED')) {
            return response()->json(['not_permitted' => __('db.This feature is disable for demo!')], 403);
        }

        if (!$this->userCanManage()) {
            return response()->json([
                'message' => __('db.Sorry! You are not allowed to access this module'),
                'success' => false,
            ], 403);
        }

        $invoice = InvoiceSetting::findOrFail($id);

        if ($invoice->is_default != 1) {
            $invoice->delete();

            return response()->json(['message' => 'Invoice deleted successfully', 'success' => true]);
        }

        return response()->json(['message' => 'Default invoice cannot be deleted', 'success' => false], 422);
    }

    public function getRequestData($request)
    {
        $data = $request->except(['company_logo', 'preview_invoice', 'show_column', '_method', 'column']);

        if ($request->hasFile('company_logo')) {
            $data['company_logo'] = $this->uploadInvoiceTemplate($request->company_logo);
        }
        if ($request->hasFile('preview_invoice')) {
            $data['preview_invoice'] = $this->uploadInvoiceTemplate($request->preview_invoice);
        }

        $data['status'] = $this->normalizeFlag($request->input('status'));
        $data['is_default'] = $this->normalizeFlag($request->input('is_default'));

        if ($data['status'] == 1) {
            InvoiceSetting::query()->where('status', 1)->update(['status' => 0]);
        }

        if ($data['is_default'] == 1) {
            InvoiceSetting::query()->where('is_default', 1)->update(['is_default' => 0]);
        }

        $checkboxFields = [
            'show_barcode',
            'show_qr_code',
            'show_description',
            'show_in_words',
            'active_primary_color',
            'show_warehouse_info',
            'show_bill_to_info',
            'show_footer_text',
            'show_biller_info',
            'show_paid_info',
            'show_payment_note',
            'show_ref_number',
            'active_date_format',
            'active_generat_settings',
            'active_logo_height_width',
            'hide_total_due',
            'show_vat_registration_number',
            'show_sale_note',
            'show_customer_name',
        ];

        $showColumnInput = $request->input('show_column');
        if (is_string($showColumnInput)) {
            $decoded = json_decode($showColumnInput, true);
            $showColumnInput = is_array($decoded) ? $decoded : [];
        } elseif (!is_array($showColumnInput)) {
            $showColumnInput = [];
        }

        $showColumn = [];
        foreach ($checkboxFields as $field) {
            $showColumn[$field] = !empty($showColumnInput[$field]) ? 1 : 0;
        }

        $data['show_column'] = json_encode($showColumn);

        return $data;
    }

    protected function normalizeFlag($value): int
    {
        return ($value === true || $value === 1 || $value === '1') ? 1 : 0;
    }

    private function uploadInvoiceTemplate($request_image)
    {
        if (isset($request_image)) {
            $logo = $request_image;
            if ($logo) {
                $ext = pathinfo($logo->getClientOriginalName(), PATHINFO_EXTENSION);
                $imageName = date('Ymdhis') . '.' . $ext;

                $logo->move(public_path('invoices/'), $imageName);

                $manager = new ImageManager(new GdDriver());
                $image = $manager->read(public_path('invoices/') . $imageName);
                $originalWidth = $image->width();
                $originalHeight = $image->height();

                if ($originalWidth > 300) {
                    $newWidth = 300;
                    $newHeight = intval(($originalHeight / $originalWidth) * $newWidth);
                    $image->resize($newWidth, $newHeight);
                }

                if (!file_exists(public_path('invoices/small')) && !is_dir(public_path('invoices/small'))) {
                    mkdir(public_path('invoices/small'), 0755, true);
                }
                $image->save(public_path('invoices/small/' . $imageName), quality: 100);

                return $imageName;
            }
        }

        return null;
    }

    public function changeStatus($request, $id)
    {
        if ($request->column == 'status') {
            InvoiceSetting::query()->where('status', 1)->update(['status' => 0]);
            InvoiceSetting::query()->findOrFail($id)->update(['status' => 1]);

            return true;
        }

        if ($request->column == 'is_default') {
            InvoiceSetting::query()->where('is_default', 1)->update(['is_default' => 0]);
            InvoiceSetting::query()->findOrFail($id)->update(['is_default' => 1]);

            return true;
        }

        return false;
    }
}
