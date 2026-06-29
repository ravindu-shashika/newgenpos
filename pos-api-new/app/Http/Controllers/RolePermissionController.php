<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionController extends Controller
{

    // Get all roles
    public function getUserPermissions()
    {
        $user = auth()->user();

        return response()->json([
            'user' => $user,
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    // Get all permissions
    public function getPermissions()
    {
        $user = auth()->user();
        if ($user->can('role-permissions.view') || $user->can('role-permissions.edit')) {
            $permissions = Permission::all();

            return response()->json([
                'status' => 200,
                'data' => $permissions,
            ]);
        } else {
            return response()->json(["message" => "You Don't have Permission for this Please Contact Admin..!", 'status' => 403]);
        }
    }



    // Create a new permission
    public function createPermission(Request $request)
    {
        // Validate the incoming request
        $request->validate([
            'name' => 'required|string|unique:permissions,name', // Ensure the permission name is unique
        ]);
        $user = auth()->user();
        if ($user->can('role-permissions.edit') || $user->can('permissions.save')) {

            try {
                // Create the permission
                $permission = Permission::create(['name' => $request->name]);

                return response()->json([
                    'status' => 200,
                    'message' => 'Permission added successfully'
                ]);
            } catch (\Exception $e) {
                // Catch any errors and return internal server error
                return response()->json([
                    'status' => 500,
                    'message' => 'Internal Server Error'
                ], 500);
            }
        } else {
            return response()->json(["message" => "You Don't have Permission for this Please Contact Admin..!", 'status' => 403]);
        }
    }

    // Assign permissions to a role
    public function assignPermissions(Request $request, $id)
    {
        $user = auth()->user();
        if ($user->can('role-permissions.edit') || $user->can('permissions.edit')) {
            $request->validate(['permissions' => 'array']);
            $role = Role::findOrFail($id);
            $role->syncPermissions($request->permissions ?? []);

            $controllers = collect($request->permissions ?? [])
                ->map(function ($perm) {
                    return explode('.', $perm)[0] ?? $perm; // 'account.view' => 'account'
                })
                ->unique();

            $menuIds = DB::table('menus')
                ->whereIn('controller', $controllers)
                ->pluck('id');

            DB::table('menu_roles')->where('role_id', $role->id)->delete();


            $menuRoleData = $menuIds->map(function ($menuId) use ($role) {
                return [
                    'role_id' => $role->id,
                    'menu_id' => $menuId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            });

            DB::table('menu_roles')->insert($menuRoleData->toArray());

            // $permission = Permission::where('name', $request->permissions);
            // $role->givePermissionTo($permission);
            return response()->json(['message' => 'Permissions assigned successfully', 'status' => 200]);
        } else {
            return response()->json(["message" => "You Don't have Permission for this Please Contact Admin..!", 'status' => 403]);
        }
    }

    public function getRolePermissions($id)
    {
        $role = Role::findOrFail($id);
        //$permissions = $role->permissions();
        $permissions = $role->permissions()->pluck('name');
        return response()->json($permissions);
    }
}
