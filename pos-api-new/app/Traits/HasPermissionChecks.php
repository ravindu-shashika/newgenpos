<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait HasPermissionChecks
{
    /**
     * Check if the authenticated user has the specified permission.
     * Returns JSON error response if unauthorized.
     *
     * @param string $permission
     * @return JsonResponse|null Returns response if unauthorized, null if authorized
     */
    protected function checkPermission(string $permission): ?JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthorized - Please login'], 401);
        }

        if (!auth()->user()->can($permission)) {
            return response()->json([
                'message' => 'You do not have permission to perform this action',
                'required_permission' => $permission
            ], 403);
        }

        return null;
    }

    /**
     * Check if the authenticated user has any of the specified permissions.
     *
     * @param array $permissions
     * @return JsonResponse|null
     */
    protected function checkAnyPermission(array $permissions): ?JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthorized - Please login'], 401);
        }

        if (!auth()->user()->hasAnyPermission($permissions)) {
            return response()->json([
                'message' => 'You do not have permission to perform this action',
                'required_permissions' => $permissions
            ], 403);
        }

        return null;
    }

    /**
     * Check if the authenticated user has all of the specified permissions.
     *
     * @param array $permissions
     * @return JsonResponse|null
     */
    protected function checkAllPermissions(array $permissions): ?JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthorized - Please login'], 401);
        }

        if (!auth()->user()->hasAllPermissions($permissions)) {
            return response()->json([
                'message' => 'You do not have all required permissions',
                'required_permissions' => $permissions
            ], 403);
        }

        return null;
    }

    /**
     * Check if the authenticated user has the specified role.
     *
     * @param string $role
     * @return JsonResponse|null
     */
    protected function checkRole(string $role): ?JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthorized - Please login'], 401);
        }

        if (!auth()->user()->hasRole($role)) {
            return response()->json([
                'message' => 'You do not have the required role',
                'required_role' => $role
            ], 403);
        }

        return null;
    }

    /**
     * Check if the authenticated user has any of the specified roles.
     *
     * @param array $roles
     * @return JsonResponse|null
     */
    protected function checkAnyRole(array $roles): ?JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthorized - Please login'], 401);
        }

        if (!auth()->user()->hasAnyRole($roles)) {
            return response()->json([
                'message' => 'You do not have any of the required roles',
                'required_roles' => $roles
            ], 403);
        }

        return null;
    }

    /**
     * Check if the authenticated user is a super admin.
     *
     * @return JsonResponse|null
     */
    protected function checkSuperAdmin(): ?JsonResponse
    {
        return $this->checkRole('super-admin');
    }
}
