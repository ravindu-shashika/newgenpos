<?php

namespace App\Http\Controllers;

use Auth;
use App\Models\Printer;
use App\Models\Warehouse;
use App\Services\PrinterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PrinterApiController extends Controller
{
    /**
     * List printers and form options (warehouses, connection types, capability profiles).
     */
    public function index(): JsonResponse
    {
        $printers = Printer::with('warehouse:id,name')->orderBy('id')->get();
        $warehouses = Warehouse::where('is_active', true)->get(['id', 'name']);
        $connection_types = Printer::connection_types();
        $capability_profiles = Printer::capability_profiles();

        $list = $printers->map(function ($printer) {
            return [
                'id' => $printer->id,
                'name' => $printer->name,
                'warehouse_id' => $printer->warehouse_id,
                'warehouse' => $printer->warehouse ? ['id' => $printer->warehouse->id, 'name' => $printer->warehouse->name] : null,
                'connection_type' => $printer->connection_type,
                'connection_type_str' => $printer->connection_type_str,
                'capability_profile' => $printer->capability_profile,
                'capability_profile_str' => $printer->capability_profile_str,
                'char_per_line' => $printer->char_per_line,
                'ip_address' => $printer->ip_address,
                'port' => $printer->port,
                'path' => $printer->path,
            ];
        });

        return response()->json([
            'status' => 200,
            'data' => $list,
            'warehouses' => $warehouses,
            'connection_types' => $connection_types,
            'capability_profiles' => $capability_profiles,
        ]);
    }

    /**
     * Get single printer for edit.
     */
    public function edit(int $id): JsonResponse
    {
        $printer = Printer::findOrFail($id);
        return response()->json([
            'id' => $printer->id,
            'name' => $printer->name,
            'warehouse_id' => $printer->warehouse_id,
            'connection_type' => $printer->connection_type,
            'capability_profile' => $printer->capability_profile,
            'char_per_line' => $printer->char_per_line,
            'ip_address' => $printer->ip_address,
            'port' => $printer->port,
            'path' => $printer->path,
        ]);
    }

    /**
     * Store a new printer.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|max:255',
            'warehouse_id' => [
                'required',
                Rule::unique('printers', 'warehouse_id'),
            ],
        ], [
            'warehouse_id.unique' => __('db.This warehouse already has a printer assigned'),
        ]);

        $input = $request->only([
            'name', 'warehouse_id', 'connection_type', 'capability_profile',
            'char_per_line', 'ip_address', 'port', 'path',
        ]);
        $input['created_by'] = Auth::id();

        if (($input['connection_type'] ?? '') === 'network') {
            $input['path'] = '';
        } elseif (in_array($input['connection_type'] ?? '', ['windows', 'linux'])) {
            $input['ip_address'] = '';
            $input['port'] = '';
        }

        try {
            $printer = new Printer($input);
            app(PrinterService::class)->getConnector($printer);
            $printer->save();
            return response()->json(['status' => 200, 'message' => __('db.Data inserted successfully')]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 422, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Update a printer.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => 'required|max:255',
            'warehouse_id' => [
                'required',
                Rule::unique('printers', 'warehouse_id')->ignore($id),
            ],
        ], [
            'warehouse_id.unique' => __('db.This warehouse already has a printer assigned'),
        ]);

        $printer = Printer::findOrFail($id);
        $input = $request->only([
            'name', 'warehouse_id', 'connection_type', 'capability_profile',
            'char_per_line', 'ip_address', 'port', 'path',
        ]);

        if (($input['connection_type'] ?? '') === 'network') {
            $input['path'] = '';
        } elseif (in_array($input['connection_type'] ?? '', ['windows', 'linux'])) {
            $input['ip_address'] = '';
            $input['port'] = '';
        }

        try {
            $printer->fill($input);
            app(PrinterService::class)->getConnector($printer);
            $printer->save();
            return response()->json(['status' => 200, 'message' => __('db.Data updated successfully')]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 422, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Delete a printer.
     */
    public function destroy(int $id): JsonResponse
    {
        $printer = Printer::findOrFail($id);
        $printer->delete();
        return response()->json(['status' => 200, 'message' => __('db.Data deleted successfully')]);
    }
}
