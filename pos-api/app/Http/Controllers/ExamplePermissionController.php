<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * Example Controller demonstrating permission checks
 * This is a reference implementation - copy these patterns to your actual controllers
 */
class ExamplePermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     * Requires 'products-view' permission
     */
    public function index()
    {
        // Method 1: Check permission manually
        if (!auth()->user()->can('products-view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Method 2: Use authorize helper
        // $this->authorize('products-view');

        return response()->json(['message' => 'Products list']);
    }

    /**
     * Store a newly created resource in storage.
     * Requires 'products-create' permission
     */
    public function store(Request $request)
    {
        // Check permission
        if (!auth()->user()->can('products-create')) {
            return response()->json(['message' => 'You do not have permission to create products'], 403);
        }

        // Your logic here...
        return response()->json(['message' => 'Product created']);
    }

    /**
     * Update the specified resource in storage.
     * Requires 'products-edit' permission
     */
    public function update(Request $request, $id)
    {
        // Using authorize helper (throws 403 exception automatically)
        $this->authorize('products-edit');

        // Your logic here...
        return response()->json(['message' => 'Product updated']);
    }

    /**
     * Remove the specified resource from storage.
     * Requires 'products-delete' permission
     */
    public function destroy($id)
    {
        $this->authorize('products-delete');

        // Your logic here...
        return response()->json(['message' => 'Product deleted']);
    }

    /**
     * Example: Check multiple permissions
     */
    public function complexOperation()
    {
        // Check if user has any of these permissions
        if (!auth()->user()->hasAnyPermission(['products-edit', 'products-delete'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if user has all these permissions
        if (!auth()->user()->hasAllPermissions(['products-view', 'products-edit'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['message' => 'Complex operation completed']);
    }

    /**
     * Example: Check role
     */
    public function adminOnly()
    {
        if (!auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Admin access required'], 403);
        }

        return response()->json(['message' => 'Admin dashboard']);
    }

    /**
     * Example: Check any role
     */
    public function managerOrAdmin()
    {
        if (!auth()->user()->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Manager or Admin access required'], 403);
        }

        return response()->json(['message' => 'Management dashboard']);
    }
}
