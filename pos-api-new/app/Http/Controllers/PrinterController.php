<?php

namespace App\Http\Controllers;

use App\Models\Printer;
use App\Models\Warehouse;
use App\Services\PrinterService;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PrinterController extends Controller
{
    use SpaResponse;

    protected function formatPrinterForSpa(Printer $printer): array
    {
        $printer->loadMissing('warehouse');

        return [
            'id' => $printer->id,
            'name' => $printer->name,
            'warehouse_id' => $printer->warehouse_id,
            'warehouse' => $printer->warehouse ? [
                'id' => $printer->warehouse->id,
                'name' => $printer->warehouse->name,
            ] : null,
            'connection_type' => $printer->connection_type,
            'capability_profile' => $printer->capability_profile,
            'char_per_line' => $printer->char_per_line,
            'ip_address' => $printer->ip_address,
            'port' => $printer->port,
            'path' => $printer->path,
        ];
    }

    public function index(Request $request)
    {
        $lims_printer_all = Printer::with('warehouse')->orderBy('name')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_printer_all->map(fn ($printer) => $this->formatPrinterForSpa($printer)),
            ]);
        }

        $lims_warehouse_all = Warehouse::where('is_active', true)->get();
        $connection_types = Printer::connection_types();
        $capability_profiles = Printer::capability_profiles();

        return view('backend.printer.create', compact(
            'lims_warehouse_all',
            'lims_printer_all',
            'connection_types',
            'capability_profiles'
        ));
    }

    public function preLoad(Request $request)
    {
        return $this->spaJson($request, [
            'warehouses' => Warehouse::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'connection_types' => Printer::connection_types(),
            'capability_profiles' => Printer::capability_profiles(),
        ]);
    }

    public function store(Request $request)
    {
        $this->validate(
            $request,
            [
                'warehouse_id' => [
                    'required',
                    Rule::unique('printers', 'warehouse_id'),
                ],
                'name' => 'required|max:255',
            ],
            [
                'warehouse_id.unique' => __('db.This warehouse already has a printer assigned'),
            ]
        );

        $input = $request->only([
            'name', 'warehouse_id', 'connection_type', 'capability_profile',
            'char_per_line', 'ip_address', 'port', 'path',
        ]);

        $input['created_by'] = Auth::user()->id;

        if ($input['connection_type'] == 'network') {
            $input['path'] = '';
        } elseif (in_array($input['connection_type'], ['windows', 'linux'])) {
            $input['ip_address'] = '';
            $input['port'] = '';
        }

        try {
            $receipt_printer = new Printer($input);
            app(PrinterService::class)->getConnector($receipt_printer);
            $receipt_printer->save();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Data inserted successfully'),
                    'data' => $this->formatPrinterForSpa($receipt_printer->fresh('warehouse')),
                ], 201);
            }

            return redirect('printers')->with('message', __('db.Data inserted successfully'));
        } catch (\Throwable $e) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => $e->getMessage(),
                ], 422);
            }

            return redirect('printers')->with('not_permitted', $e->getMessage());
        }
    }

    public function edit(Request $request, $id)
    {
        $lims_printer_data = Printer::with('warehouse')->findOrFail($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatPrinterForSpa($lims_printer_data),
            ]);
        }

        return $lims_printer_data;
    }

    public function update(Request $request, $id)
    {
        $this->validate(
            $request,
            [
                'warehouse_id' => [
                    'required',
                    Rule::unique('printers', 'warehouse_id')->ignore($request->printer_id ?? $id),
                ],
                'name' => 'required|max:255',
            ],
            [
                'warehouse_id.unique' => __('db.This warehouse already has a printer assigned'),
            ]
        );

        $input = $request->only([
            'name', 'warehouse_id', 'connection_type', 'capability_profile',
            'char_per_line', 'ip_address', 'port', 'path',
        ]);

        $printer = Printer::findOrFail($request->printer_id ?? $id);

        if ($input['connection_type'] == 'network') {
            $input['path'] = '';
        } elseif (in_array($input['connection_type'], ['windows', 'linux'])) {
            $input['ip_address'] = '';
            $input['port'] = '';
        }

        try {
            $printer->fill($input);
            app(PrinterService::class)->getConnector($printer);
            $printer->save();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Data updated successfully'),
                    'data' => $this->formatPrinterForSpa($printer->fresh('warehouse')),
                ]);
            }

            return redirect('printers')->with('message', __('db.Data updated successfully'));
        } catch (\Throwable $e) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => $e->getMessage(),
                ], 422);
            }

            return redirect('printers')->with('not_permitted', $e->getMessage());
        }
    }

    public function deleteBySelection(Request $request)
    {
        $ids = $request->input('printerIdArray', []);
        Printer::whereIn('id', $ids)->delete();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data deleted successfully'),
            ]);
        }

        return __('db.Data deleted successfully');
    }

    public function destroy(Request $request, $id = null)
    {
        if ($request->has('printerIdArray')) {
            return $this->deleteBySelection($request);
        }

        $printerId = $id ?? $request->route('printer');
        $lims_printer_data = Printer::findOrFail($printerId);
        $lims_printer_data->delete();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data deleted successfully'),
            ]);
        }

        return redirect('printers')->with('not_permitted', __('db.Data deleted successfully'));
    }
}
