<?php

namespace App\Http\Controllers;

use App\Models\Barcode;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use DB;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class BarcodeController extends Controller
{
    use SpaResponse;

    protected function userCanAccessBarcodeSetting(): bool
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

        return $role && $role->hasPermissionTo('barcode_setting');
    }

    protected function denyBarcodeSettingAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect('/dashboard')
            ->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function formatBarcodeForSpa(Barcode $barcode): array
    {
        return [
            'id' => $barcode->id,
            'name' => $barcode->name,
            'description' => $barcode->description ?? '',
            'width' => $barcode->width,
            'height' => $barcode->height,
            'top_margin' => $barcode->top_margin,
            'left_margin' => $barcode->left_margin,
            'row_distance' => $barcode->row_distance,
            'col_distance' => $barcode->col_distance,
            'stickers_in_one_row' => $barcode->stickers_in_one_row,
            'stickers_in_one_sheet' => $barcode->stickers_in_one_sheet,
            'paper_width' => $barcode->paper_width,
            'paper_height' => $barcode->paper_height,
            'is_default' => (bool) $barcode->is_default,
            'is_continuous' => (bool) $barcode->is_continuous,
            'is_custom' => (bool) $barcode->is_custom,
        ];
    }

    protected function prepareBarcodeInput(Request $request): array
    {
        $input = $request->only([
            'name', 'description', 'width', 'height', 'top_margin',
            'left_margin', 'row_distance', 'col_distance',
            'stickers_in_one_row', 'paper_width', 'is_custom',
        ]);

        $input['is_custom'] = 1;
        $input['description'] = $input['description'] ?? '';

        if ($request->boolean('is_default')) {
            Barcode::where('is_default', 1)->update(['is_default' => 0]);
            $input['is_default'] = 1;
        } else {
            $input['is_default'] = 0;
        }

        if ($request->boolean('is_continuous')) {
            $input['is_continuous'] = 1;
            $input['stickers_in_one_sheet'] = 28;
            $input['paper_height'] = 0;
        } else {
            $input['is_continuous'] = 0;
            $input['stickers_in_one_sheet'] = $request->input('stickers_in_one_sheet');
            $input['paper_height'] = $request->input('paper_height');
        }

        return $input;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessBarcodeSetting()) {
            return $this->denyBarcodeSettingAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            $search = trim((string) $request->input('search', ''));
            $query = Barcode::where('is_custom', true);

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            $barcodes = $query->orderBy('name')->get()
                ->map(fn (Barcode $barcode) => $this->formatBarcodeForSpa($barcode));

            return $this->spaJson($request, ['data' => $barcodes]);
        }

        return view('backend.barcode.index');
    }

    public function barcodeData(Request $request)
    {
        if (!$this->userCanAccessBarcodeSetting()) {
            return $this->denyBarcodeSettingAccess($request);
        }

        $columns = [
            0 => 'id',
            2 => 'name',
            3 => 'description',
        ];

        $totalData = DB::table('barcodes')->where('is_custom', true)->count();
        $totalFiltered = $totalData;

        if ($request->input('length') != -1) {
            $limit = $request->input('length');
        } else {
            $limit = $totalData;
        }
        $start = $request->input('start');
        $order = $columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        if (empty($request->input('search.value'))) {
            $barcodes = Barcode::offset($start)
                ->where('is_custom', true)
                ->limit($limit)
                ->orderBy($order, $dir)
                ->get();
        } else {
            $search = $request->input('search.value');
            $barcodes = Barcode::where([
                ['name', 'LIKE', "%{$search}%"],
                ['is_custom', true],
            ])->offset($start)
                ->limit($limit)
                ->orderBy($order, $dir)->get();

            $totalFiltered = Barcode::where([
                ['name', 'LIKE', "%{$search}%"],
                ['is_custom', true],
            ])->count();
        }
        $data = [];
        if (!empty($barcodes)) {
            foreach ($barcodes as $key => $barcode) {
                $nestedData['id'] = $barcode->id;
                $nestedData['key'] = $key;
                $nestedData['name'] = $barcode->name;
                $nestedData['description'] = $barcode->description;

                $nestedData['options'] = '<div class="btn-group">
                            <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'. __('db.action') .'
                            <span class="caret"></span>
                            <span class="sr-only">Toggle Dropdown</span>
                            </button>
                            <ul class="dropdown-menu edit-options dropdown-menu-right dropdown-default" user="menu">
                                <li>
                                    <a  href="'.route('barcodes.edit', $barcode->id).'" class="btn btn-link"><i class="dripicons-document-edit"></i> '. __('db.edit') .'</a>
                                </li>
                                <li class="divider"></li>
                                <form action="' . route('barcodes.destroy', $barcode->id) . '" method="POST">'.csrf_field().'' . method_field('DELETE') . '
                                <li>
                                <button type="submit" class="btn btn-link" onclick="return confirmDelete()"><i class="dripicons-trash"></i> '. __('db.delete') .'</button>
                                </li></form>
                            </ul>
                        </div>';
                $data[] = $nestedData;
            }
        }
        $json_data = [
            'draw' => intval($request->input('draw')),
            'recordsTotal' => intval($totalData),
            'recordsFiltered' => intval($totalFiltered),
            'data' => $data,
        ];

        echo json_encode($json_data);
    }

    public function create(Request $request)
    {
        if (!$this->userCanAccessBarcodeSetting()) {
            return $this->denyBarcodeSettingAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['data' => null]);
        }

        return view('backend.barcode.create');
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessBarcodeSetting()) {
            return $this->denyBarcodeSettingAccess($request);
        }

        $this->validate($request, [
            'name' => 'required|max:255',
            'width' => 'required|numeric|min:0.1',
            'height' => 'required|numeric|min:0.1',
            'top_margin' => 'required|numeric|min:0',
            'left_margin' => 'required|numeric|min:0',
            'paper_width' => 'required|numeric|min:0.1',
            'stickers_in_one_row' => 'required|integer|min:1',
            'row_distance' => 'required|numeric|min:0',
            'col_distance' => 'required|numeric|min:0',
        ]);

        try {
            $barcode = Barcode::create($this->prepareBarcodeInput($request));
            $message = __('barcode.added_success');

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => $message,
                    'data' => $this->formatBarcodeForSpa($barcode->fresh()),
                ], 201);
            }

            return redirect('barcodes')->with('status', [
                'success' => 1,
                'msg' => $message,
            ]);
        } catch (\Exception $e) {
            \Log::emergency('File:'.$e->getFile().'Line:'.$e->getLine().'Message:'.$e->getMessage());

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('messages.something_went_wrong'),
                ], 500);
            }

            return redirect('barcodes')->with('status', [
                'success' => 0,
                'msg' => __('messages.something_went_wrong'),
            ]);
        }
    }

    public function show(string $id)
    {
        //
    }

    public function edit(Request $request, string $id)
    {
        if (!$this->userCanAccessBarcodeSetting()) {
            return $this->denyBarcodeSettingAccess($request);
        }

        $barcode = Barcode::where('is_custom', true)->findOrFail($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatBarcodeForSpa($barcode),
            ]);
        }

        return view('backend.barcode.edit', compact('barcode'));
    }

    public function update(Request $request, string $id)
    {
        if (!$this->userCanAccessBarcodeSetting()) {
            return $this->denyBarcodeSettingAccess($request);
        }

        $this->validate($request, [
            'name' => 'required|max:255',
            'width' => 'required|numeric|min:0.1',
            'height' => 'required|numeric|min:0.1',
            'top_margin' => 'required|numeric|min:0',
            'left_margin' => 'required|numeric|min:0',
            'paper_width' => 'required|numeric|min:0.1',
            'stickers_in_one_row' => 'required|integer|min:1',
            'row_distance' => 'required|numeric|min:0',
            'col_distance' => 'required|numeric|min:0',
        ]);

        try {
            $barcode = Barcode::where('is_custom', true)->findOrFail($id);
            $input = $this->prepareBarcodeInput($request);

            if ($request->boolean('is_default')) {
                Barcode::where('is_default', 1)->where('id', '!=', $id)->update(['is_default' => 0]);
            }

            $barcode->update($input);
            $message = __('barcode.updated_success');

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => $message,
                    'data' => $this->formatBarcodeForSpa($barcode->fresh()),
                ]);
            }

            return redirect('barcodes')->with('status', [
                'success' => 1,
                'msg' => $message,
            ]);
        } catch (\Exception $e) {
            \Log::emergency('File:'.$e->getFile().'Line:'.$e->getLine().'Message:'.$e->getMessage());

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('messages.something_went_wrong'),
                ], 500);
            }

            return redirect('barcodes')->with('status', [
                'success' => 0,
                'msg' => __('messages.something_went_wrong'),
            ]);
        }
    }

    public function destroy(Request $request, string $id)
    {
        if (!$this->userCanAccessBarcodeSetting()) {
            return $this->denyBarcodeSettingAccess($request);
        }

        $barcode = Barcode::where('is_custom', true)->find($id);

        if (!$barcode) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.something_went_wrong'),
                ], 404);
            }

            return redirect('barcodes')->with('status', [
                'success' => 0,
                'msg' => __('db.something_went_wrong'),
            ]);
        }

        if ($barcode->is_default) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => 'Cannot delete the default barcode setting.',
                ], 422);
            }

            return redirect('barcodes')->with('status', [
                'success' => 0,
                'msg' => 'Cannot delete the default barcode setting.',
            ]);
        }

        $barcode->delete();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.deleted_success'),
            ]);
        }

        return redirect('barcodes')->with('status', [
            'success' => 1,
            'msg' => __('db.deleted_success'),
        ]);
    }

    public function setDefault(Request $request, $id)
    {
        if (!$this->userCanAccessBarcodeSetting()) {
            return $this->denyBarcodeSettingAccess($request);
        }

        Barcode::where('is_default', 1)->update(['is_default' => 0]);

        $barcode = Barcode::where('is_custom', true)->findOrFail($id);
        $barcode->update(['is_default' => 1]);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => 'Barcode setting set as default successfully.',
                'data' => $this->formatBarcodeForSpa($barcode->fresh()),
            ]);
        }

        return redirect('barcodes')->with('message', __('db.Data updated successfully'));
    }
}
