<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function getRoles()
    {
        $roles = Role::with('permissions')->get();
        return response()->json([
            'status' => 200,
            'data' => $roles,
        ]);
    }

    public function getRole($id)
    {
        $role = Role::with('permissions')->findOrFail($id);
        return response()->json([
            'status' => 200,
            'data' => $role,
        ]);
    }

    public function createRole(Request $request)
    {
        $user = auth()->user();
        if (!$user->can('role.create') && !$user->can('role-permissions.edit')) {
            return response()->json([
                'status' => 403,
                'message' => "You don't have permission to create roles",
            ]);
        }

        $request->validate([
            'name' => 'required|string|max:125|unique:roles,name',
            'description' => 'nullable|string|max:255',
        ]);

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => 'sanctum',
            'description' => $request->description ?? null,
        ]);

        return response()->json([
                'status' => 200,
                'message' => 'Role created successfully',
                'role' => $role,
            ]);
    }

    public function updateRole(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user->can('role.edit') && !$user->can('role-permissions.edit')) {
            return response()->json([
                'status' => 403,
                'message' => "You don't have permission to update roles",
            ]);
        }

        $request->validate([
            'name' => 'required|string|max:125|unique:roles,name,' . $id,
            'description' => 'nullable|string|max:255',
        ]);

        $role = Role::findOrFail($id);
        $role->name = $request->name;
        $role->description = $request->description;
        $role->save();

        return response()->json([
            'status' => 200,
            'message' => 'Role updated successfully',
        ]);
    }

    public function deleteRole($id)
    {
        $user = auth()->user();
        if ($user->can('role.delete')) {
            $role = Role::findOrFail($id);
            $role->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Role deleted successfully',
            ]);
        } else {
            return response()->json([
                'status' => 403,
                'message' => "You don't have permission to delete roles",
            ]);
        }
    }

    public function users()
    {
        $users = User::select('id', 'name', 'email')->get();

        return response()->json([
            'status' => 200,
            'data' => $users,
        ]);
    }

    public function assignRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|exists:roles,name',
        ]);

        $user->syncRoles([$request->role]);

        return response()->json([
            'status' => 200,
            'message' => 'Role assigned successfully',
        ]);
    }
}
