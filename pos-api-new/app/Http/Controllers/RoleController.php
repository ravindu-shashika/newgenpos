<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Roles;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use App\Traits\TenantInfo;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    use SpaResponse, TenantInfo;

    protected function userCanAccess(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();

        return $user && $user->role_id <= 2;
    }

    protected function permissionGuard(): string
    {
        return 'sanctum';
    }

    protected function formatRole(Roles $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'description' => $role->description,
            'is_system' => $role->id <= 2 || $role->id == 5,
        ];
    }

    protected function resolveSpatieRole(Roles $role): Role
    {
        $guard = $this->permissionGuard();

        $spatieRole = Role::find($role->id)
            ?? Role::where('name', $role->name)->where('guard_name', $guard)->first();

        if (!$spatieRole) {
            $spatieRole = Role::create([
                'name' => $role->name,
                'guard_name' => $guard,
            ]);
        }

        if ($spatieRole->guard_name !== $guard) {
            $spatieRole->guard_name = $guard;
            $spatieRole->save();
        }

        if (($role->guard_name ?? null) !== $guard) {
            $role->guard_name = $guard;
            $role->save();
        }

        return $spatieRole;
    }

    protected function resolvePermission(string $name): Permission
    {
        return Permission::firstOrCreate(
            ['name' => $name, 'guard_name' => $this->permissionGuard()]
        );
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

        $lims_role_all = Roles::where('is_active', true)->orderBy('id')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_role_all->map(fn ($role) => $this->formatRole($role)),
            ]);
        }

        return view('backend.role.create', compact('lims_role_all'));
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

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('roles')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);

        $data = $request->only(['name', 'description']);
        $data['guard_name'] = $this->permissionGuard();
        $data['is_active'] = true;

        $role = Roles::create($data);

        Role::firstOrCreate(
            ['name' => $role->name, 'guard_name' => $data['guard_name']]
        );

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data inserted successfully'),
                'data' => $this->formatRole($role),
            ], 201);
        }

        return redirect('role')->with('message', __('db.Data inserted successfully'));
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_role_data = Roles::findOrFail($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatRole($lims_role_data),
            ]);
        }

        return $lims_role_data;
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $roleId = $request->input('role_id', $id);

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('roles')->ignore($roleId)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);

        $lims_role_data = Roles::findOrFail($roleId);
        $lims_role_data->update($request->only(['name', 'description']));

        $spatieRole = $this->resolveSpatieRole($lims_role_data);
        if ($spatieRole->name !== $lims_role_data->name) {
            $spatieRole->name = $lims_role_data->name;
            $spatieRole->save();
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatRole($lims_role_data->fresh()),
            ]);
        }

        return redirect('role')->with('message', __('db.Data updated successfully'));
    }

    public function permission(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_role_data = Roles::findOrFail($id);
        $spatieRole = $this->resolveSpatieRole($lims_role_data);
        $granted = $spatieRole->permissions->pluck('name')->all();

        if ($this->wantsSpaResponse($request)) {
            $guard = $this->permissionGuard();
            $permissions = Permission::where('guard_name', $guard)
                ->orderBy('name')
                ->pluck('name')
                ->map(function ($name) use ($granted) {
                return [
                    'name' => $name,
                    'granted' => in_array($name, $granted, true),
                ];
            })->values();

            return $this->spaJson($request, [
                'role' => $this->formatRole($lims_role_data),
                'permissions' => $permissions,
            ]);
        }

        $all_features = $this->features();
        $all_permission = $granted ?: ['dummy text'];

        return view('backend.role.permission', compact('lims_role_data', 'all_permission', 'all_features'));
    }

    public function setPermission(Request $request)
    {
        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        if ($request->has('granted') && is_array($request->granted)) {
            $roleRecord = Roles::findOrFail($request->role_id);
            $role = $this->resolveSpatieRole($roleRecord);
            $granted = array_values(array_unique(array_filter($request->granted)));
            $permissionModels = array_map(
                fn (string $name) => $this->resolvePermission($name),
                $granted
            );
            $role->syncPermissions($permissionModels);
            cache()->forget('permissions');

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Permission updated successfully'),
                ]);
            }

            return redirect('role')->with('message', __('db.Permission updated successfully'));
        }

        $guard = $this->permissionGuard();
        $lims_permissions = Permission::where('guard_name', $guard)->pluck('name')->toArray();

        $lims_new_request_permissions = array_diff(
            array_keys($request->except('_token', 'role_id', 'granted')),
            $lims_permissions
        );

        $lims_permissions = array_merge($lims_permissions, $lims_new_request_permissions);
        $lims_permissions = array_unique($lims_permissions);

        $roleRecord = Roles::findOrFail($request->role_id);
        $role = $this->resolveSpatieRole($roleRecord);

        foreach ($lims_permissions as $permission_name) {
            $permission = $this->resolvePermission($permission_name);

            if ($request->has($permission_name)) {
                if (!$role->hasPermissionTo($permission)) {
                    $role->givePermissionTo($permission);
                }
            } elseif ($role->hasPermissionTo($permission)) {
                $role->revokePermissionTo($permission);
            }
        }

        cache()->forget('permissions');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Permission updated successfully'),
            ]);
        }

        return redirect('role')->with('message', __('db.Permission updated successfully'));
    }

    public function destroy(Request $request, $id)
    {
        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_role_data = Roles::findOrFail($id);

        if ($lims_role_data->id <= 2 || $lims_role_data->id == 5) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.System roles cannot be deleted'),
                ], 422);
            }

            return redirect('role')->with('not_permitted', __('db.Data deleted successfully'));
        }

        $lims_role_data->is_active = false;
        $lims_role_data->save();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data deleted successfully'),
            ]);
        }

        return redirect('role')->with('not_permitted', __('db.Data deleted successfully'));
    }
}
