<?php

namespace App\Http\Controllers;

use App\Traits\HasPermissionChecks;
use Illuminate\Http\Request;

/**
 * Example Controller using the HasPermissionChecks trait
 * This demonstrates clean permission checking in controllers
 */
class PermissionControllerExample extends Controller
{
    use HasPermissionChecks;

    /**
     * Example 1: Simple permission check
     */
    public function index()
    {
        // Check permission using trait method
        if ($error = $this->checkPermission('products-view')) {
            return $error;
        }

        // Your logic here...
        return response()->json(['message' => 'Products list']);
    }

    /**
     * Example 2: Create with permission check
     */
    public function store(Request $request)
    {
        if ($error = $this->checkPermission('products-create')) {
            return $error;
        }

        // Your logic here...
        return response()->json(['message' => 'Product created']);
    }

    /**
     * Example 3: Check any permission (user needs at least one)
     */
    public function edit($id)
    {
        if ($error = $this->checkAnyPermission(['products-edit', 'products-delete'])) {
            return $error;
        }

        // Your logic here...
        return response()->json(['message' => 'Product edit page']);
    }

    /**
     * Example 4: Check all permissions (user needs all of them)
     */
    public function complexOperation()
    {
        if ($error = $this->checkAllPermissions(['products-view', 'products-edit', 'inventory-edit'])) {
            return $error;
        }

        // Your logic here...
        return response()->json(['message' => 'Complex operation completed']);
    }

    /**
     * Example 5: Role-based check
     */
    public function adminOnly()
    {
        if ($error = $this->checkRole('admin')) {
            return $error;
        }

        // Your logic here...
        return response()->json(['message' => 'Admin dashboard']);
    }

    /**
     * Example 6: Check any role
     */
    public function managerOrAdmin()
    {
        if ($error = $this->checkAnyRole(['admin', 'manager'])) {
            return $error;
        }

        // Your logic here...
        return response()->json(['message' => 'Management area']);
    }

    /**
     * Example 7: Super admin only
     */
    public function superAdminOnly()
    {
        if ($error = $this->checkSuperAdmin()) {
            return $error;
        }

        // Your logic here...
        return response()->json(['message' => 'Super admin settings']);
    }

    /**
     * Example 8: Multiple checks in one method
     */
    public function multipleChecks(Request $request)
    {
        // First check if user can view
        if ($error = $this->checkPermission('products-view')) {
            return $error;
        }

        // Then check if they can edit (for update operations)
        if ($request->isMethod('put') || $request->isMethod('patch')) {
            if ($error = $this->checkPermission('products-edit')) {
                return $error;
            }
        }

        // Your logic here...
        return response()->json(['message' => 'Operation completed']);
    }
}
