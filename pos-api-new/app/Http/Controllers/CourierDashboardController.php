<?php

namespace App\Http\Controllers;

use App\Models\Courier;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class CourierDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(): bool
    {
        return $this->userHasAny(['courier', 'couriers.view', 'couriers-index']);
    }

    protected function userCanMutate(): bool
    {
        return $this->userHasAny(['courier', 'couriers.create', 'couriers.edit', 'couriers-index']);
    }

    protected function userHasAny(array $names): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);
        foreach ($names as $permission) {
            try {
                if ($role && $role->hasPermissionTo($permission)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
            }
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $search = trim((string) $request->input('search', ''));

            $query = Courier::query()->where('is_active', true);

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('type', 'LIKE', "%{$search}%")
                        ->orWhere('phone_number', 'LIKE', "%{$search}%")
                        ->orWhere('address', 'LIKE', "%{$search}%");
                });
            }

            $couriers = $query->orderBy('id', 'desc')->get();

            return $this->spaJson($request, [
                'data' => $couriers->map(fn ($c) => $this->formatRow($c)),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load couriers'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $courier = Courier::where('is_active', true)->find($id);
        if (!$courier) {
            return response()->json(['message' => __('db.Courier not found')], 404);
        }

        return $this->spaJson($request, [
            'courier' => $this->formatDetail($courier),
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->userCanMutate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'phone_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
        ]);

        $data = array_merge($validated, $this->credentialPayload($request), [
            'is_active' => true,
        ]);

        Courier::create($data);

        return $this->spaJson($request, ['message' => __('db.Courier created successfully')]);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanMutate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $courier = Courier::where('is_active', true)->find($id);
        if (!$courier) {
            return response()->json(['message' => __('db.Courier not found')], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'phone_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
        ]);

        $courier->update(array_merge($validated, $this->credentialPayload($request)));

        return $this->spaJson($request, ['message' => __('db.Courier updated successfully')]);
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanMutate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $ids = $request->input('courierIdArray', []);
        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['message' => 'No courier is selected!'], 422);
        }

        Courier::whereIn('id', $ids)->update(['is_active' => false]);

        return $this->spaJson($request, ['message' => 'Courier deleted successfully!']);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanMutate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $courier = Courier::where('is_active', true)->find($id);
        if (!$courier) {
            return response()->json(['message' => __('db.Courier not found')], 404);
        }

        $courier->is_active = false;
        $courier->save();

        return $this->spaJson($request, ['message' => __('db.Courier deleted successfully')]);
    }

    protected function credentialPayload(Request $request): array
    {
        $type = $request->input('type');
        $username = null;
        $password = null;

        if ($type === 'pathao') {
            $username = $request->input('pathao_username');
            $password = $request->input('pathao_password');
        } elseif ($type === 'paperfly') {
            $username = $request->input('paperfly_username');
            $password = $request->input('paperfly_password');
        }

        $payload = [
            'api_key' => $request->input('api_key'),
            'secret_key' => $request->input('secret_key'),
            'client_id' => $request->input('client_id'),
            'client_secret' => $request->input('client_secret'),
            'base_url' => $request->input('base_url'),
            'username' => $username,
            'password' => $password,
        ];

        if (Schema::hasColumn('couriers', 'api_token')) {
            $payload['api_token'] = $request->input('api_token');
        }

        return $payload;
    }

    protected function formatDetail(Courier $courier): array
    {
        $data = [
            'id' => $courier->id,
            'name' => $courier->name,
            'type' => $courier->type,
            'phone_number' => $courier->phone_number,
            'address' => $courier->address,
            'api_key' => $courier->api_key,
            'secret_key' => $courier->secret_key,
            'client_id' => $courier->client_id,
            'client_secret' => $courier->client_secret,
            'base_url' => $courier->base_url,
            'pathao_username' => $courier->type === 'pathao' ? $courier->username : '',
            'pathao_password' => $courier->type === 'pathao' ? $courier->password : '',
            'paperfly_username' => $courier->type === 'paperfly' ? $courier->username : '',
            'paperfly_password' => $courier->type === 'paperfly' ? $courier->password : '',
        ];

        if (Schema::hasColumn('couriers', 'api_token')) {
            $data['api_token'] = $courier->api_token;
        }

        return $data;
    }

    private function formatRow(Courier $courier): array
    {
        $type = $courier->type ? ucfirst($courier->type) : 'N/A';

        return [
            'id' => $courier->id,
            'name' => $courier->name,
            'type' => $type,
            'type_raw' => $courier->type,
            'phone_number' => $courier->phone_number ?: '—',
            'address' => $courier->address ?: '—',
        ];
    }
}
