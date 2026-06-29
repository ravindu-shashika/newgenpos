<?php

namespace App\Http\Controllers;

use App\Models\Biller;
use App\Models\MailSetting;
use App\Support\Permissions;
use App\Traits\FileDelete;
use App\Traits\SpaResponse;
use App\Mail\BillerCreate;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Mail;
use Spatie\Permission\Models\Role;

class BillerController extends Controller
{
    use \App\Traits\CacheForget;
    use \App\Traits\TenantInfo;
    use \App\Traits\MailInfo;
    use FileDelete;
    use SpaResponse;

    protected function userCanAccessBillers(string $action = 'index'): bool
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
        if (!$role) {
            return false;
        }

        $permissionMap = [
            'index' => 'billers-index',
            'add' => 'billers-add',
            'edit' => 'billers-edit',
            'delete' => 'billers-delete',
            'import' => 'billers-import',
        ];

        return $role->hasPermissionTo($permissionMap[$action] ?? 'billers-index');
    }

    protected function denyBillerAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function spaSuccess(Request $request, string $message, array $extra = [], int $status = 200)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(['message' => strip_tags($message)], $extra), $status);
        }

        return null;
    }

    protected function formatBillerForSpa(Biller $biller): array
    {
        $placeholder = url('images/product/zummXD2dvAtI.png');
        $addressParts = array_filter([
            $biller->address,
            $biller->city,
            $biller->state,
            $biller->postal_code,
            $biller->country,
        ]);

        return [
            'id' => $biller->id,
            'name' => $biller->name,
            'company_name' => $biller->company_name,
            'vat_number' => $biller->vat_number,
            'email' => $biller->email,
            'phone_number' => $biller->phone_number,
            'address' => $biller->address,
            'city' => $biller->city,
            'state' => $biller->state,
            'postal_code' => $biller->postal_code,
            'country' => $biller->country,
            'address_display' => implode(', ', $addressParts),
            'image' => $biller->image,
            'image_url' => $biller->image ? url('images/biller/' . $biller->image) : $placeholder,
        ];
    }

    protected function billerPayload(Request $request): array
    {
        return $request->only([
            'name',
            'company_name',
            'vat_number',
            'email',
            'phone_number',
            'address',
            'city',
            'state',
            'postal_code',
            'country',
        ]);
    }

    protected function storeBillerImage(Request $request, ?string $existing = null): ?string
    {
        $image = $request->file('image');
        if (!$image) {
            return $existing;
        }

        if ($existing) {
            $this->fileDelete(public_path('images/biller/'), $existing);
        }

        $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
        $imageName = date('Ymdhis');
        if (!config('database.connections.saleprosaas_landlord')) {
            $imageName = $imageName . '.' . $ext;
        } else {
            $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
        }
        $image->move(public_path('images/biller'), $imageName);

        return $imageName;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessBillers('index')) {
            return $this->denyBillerAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            $billers = Biller::where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (Biller $biller) => $this->formatBillerForSpa($biller));

            return $this->spaJson($request, ['billers' => $billers]);
        }

        $role = Role::find(Auth::user()->role_id);
        if ($role->hasPermissionTo('billers-index')) {
            $permissions = Role::findByName($role->name)->permissions;
            $all_permission = [];
            foreach ($permissions as $permission) {
                $all_permission[] = $permission->name;
            }
            if (empty($all_permission)) {
                $all_permission[] = 'dummy text';
            }
            $lims_biller_all = Biller::where('is_active', true)->get();

            return view('backend.biller.index', compact('lims_biller_all', 'all_permission'));
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function create(Request $request)
    {
        if (!$this->userCanAccessBillers('add')) {
            return $this->denyBillerAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, []);
        }

        return view('backend.biller.create');
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessBillers('add')) {
            return $this->denyBillerAccess($request);
        }

        $this->validate($request, [
            'name' => 'required|max:255',
            'company_name' => [
                'required',
                'max:255',
                Rule::unique('billers')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('billers')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'phone_number' => 'required|max:255',
            'address' => 'required|max:255',
            'city' => 'required|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:10000',
        ]);

        $data = $this->billerPayload($request);
        $data['is_active'] = true;
        $data['image'] = $this->storeBillerImage($request);

        $biller = Biller::create($data);
        $this->cacheForget('biller_list');

        $mailSetting = MailSetting::latest()->first();
        $message = $this->mailAction($data, $mailSetting);

        if ($response = $this->spaSuccess($request, $message, ['data' => $this->formatBillerForSpa($biller)], 201)) {
            return $response;
        }

        return redirect('biller')->with('message', $message);
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccessBillers('edit')) {
            return $this->denyBillerAccess($request);
        }

        $lims_biller_data = Biller::find($id);
        if (!$lims_biller_data) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Biller not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Biller not found'));
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['biller' => $this->formatBillerForSpa($lims_biller_data)]);
        }

        return view('backend.biller.edit', compact('lims_biller_data'));
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessBillers('edit')) {
            return $this->denyBillerAccess($request);
        }

        $this->validate($request, [
            'name' => 'required|max:255',
            'company_name' => [
                'required',
                'max:255',
                Rule::unique('billers')->ignore($id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('billers')->ignore($id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'phone_number' => 'required|max:255',
            'address' => 'required|max:255',
            'city' => 'required|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);

        $lims_biller_data = Biller::findOrFail($id);
        $input = $this->billerPayload($request);
        $input['image'] = $this->storeBillerImage($request, $lims_biller_data->image);

        $lims_biller_data->update($input);
        $this->cacheForget('biller_list');

        if ($response = $this->spaSuccess($request, __('db.Data updated successfully'), [
            'data' => $this->formatBillerForSpa($lims_biller_data->fresh()),
        ])) {
            return $response;
        }

        return redirect('biller')->with('message', __('db.Data updated successfully'));
    }

    public function importBiller(Request $request)
    {
        if (!$this->userCanAccessBillers('import')) {
            return $this->denyBillerAccess($request);
        }

        $upload = $request->file('file');
        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if ($ext != 'csv') {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Please upload a CSV file')], 422);
            }

            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        }

        $filePath = $upload->getRealPath();
        $file = fopen($filePath, 'r');
        $header = fgetcsv($file);
        $escapedHeader = [];
        foreach ($header as $value) {
            $escapedHeader[] = preg_replace('/[^a-z]/', '', strtolower($value));
        }

        $mailSetting = MailSetting::latest()->first();
        $message = 'Data inserted successfully';

        while ($columns = fgetcsv($file)) {
            if ($columns[0] == '') {
                continue;
            }
            $data = array_combine($escapedHeader, $columns);

            $biller = Biller::firstOrNew(['company_name' => $data['companyname'] ?? '']);
            $biller->name = $data['name'] ?? '';
            $biller->image = $data['image'] ?? null;
            $biller->vat_number = $data['vatnumber'] ?? null;
            $biller->email = $data['email'] ?? null;
            $biller->phone_number = $data['phonenumber'] ?? null;
            $biller->address = $data['address'] ?? null;
            $biller->city = $data['city'] ?? null;
            $biller->state = $data['state'] ?? null;
            $biller->postal_code = $data['postalcode'] ?? null;
            $biller->country = $data['country'] ?? null;
            $biller->is_active = true;
            $biller->save();
            $message = $this->mailAction($data, $mailSetting);
        }

        fclose($file);
        $this->cacheForget('biller_list');

        if ($response = $this->spaSuccess($request, strip_tags($message))) {
            return $response;
        }

        return redirect('biller')->with('message', $message);
    }

    protected function mailAction($data, $mailSetting)
    {
        $message = 'Data inserted successfully';
        if (!$mailSetting) {
            $message = 'Data inserted successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
        } elseif (!empty($data['email']) && $mailSetting) {
            try {
                $this->setMailInfo($mailSetting);
                Mail::to($data['email'])->send(new BillerCreate($data));
            } catch (\Exception $e) {
                $message = $e->getMessage();
            }
        }

        return $message;
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessBillers('delete')) {
            return $this->denyBillerAccess($request);
        }

        $biller_id = $request->input('billerIdArray', []);

        foreach ($biller_id as $id) {
            $lims_biller_data = Biller::find($id);
            if (!$lims_biller_data) {
                continue;
            }
            $lims_biller_data->is_active = false;
            $lims_biller_data->save();
            $this->fileDelete(public_path('images/biller/'), $lims_biller_data->image);
        }

        $this->cacheForget('biller_list');

        if ($response = $this->spaSuccess($request, __('db.Biller deleted successfully!'))) {
            return $response;
        }

        return 'Biller deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessBillers('delete')) {
            return $this->denyBillerAccess($request);
        }

        $lims_biller_data = Biller::findOrFail($id);
        $this->fileDelete(public_path('images/biller/'), $lims_biller_data->image);
        $lims_biller_data->is_active = false;
        $lims_biller_data->save();
        $this->cacheForget('biller_list');

        if ($response = $this->spaSuccess($request, __('db.Data deleted successfully'))) {
            return $response;
        }

        return redirect('biller')->with('not_permitted', __('db.Data deleted successfully'));
    }
}
