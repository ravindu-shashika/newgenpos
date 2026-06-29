<?php

namespace App\Http\Controllers;

use App\Models\GeneralSetting;
use App\Models\Role;
use App\Models\Table;
use App\Support\Permissions;
use App\Traits\CacheForget;
use App\Traits\SpaResponse;
use Auth;
use DB;
use Illuminate\Http\Request;

class TableController extends Controller
{
    use CacheForget, SpaResponse;

    protected function userCanAccess(): bool
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

        return $role && (
            $role->hasPermissionTo('table')
            || $role->hasPermissionTo('role_permission')
        );
    }

    protected function restaurantEnabled(): bool
    {
        $generalSetting = GeneralSetting::latest()->first();

        return $generalSetting
            && in_array('restaurant', explode(',', $generalSetting->modules ?? ''), true);
    }

    protected function getFloors()
    {
        return $this->restaurantEnabled()
            ? DB::table('floors')->orderBy('name')->get()
            : collect();
    }

    protected function formatTable(Table $table, $floors = null): array
    {
        $floors = $floors ?? $this->getFloors()->keyBy('id');
        $floor = $table->floor_id && isset($floors[$table->floor_id])
            ? $floors[$table->floor_id]
            : null;

        return [
            'id' => $table->id,
            'name' => $table->name,
            'number_of_person' => $table->number_of_person,
            'description' => $table->description,
            'floor_id' => $table->floor_id,
            'floor_name' => $floor->name ?? null,
        ];
    }

    protected function metadataPayload(): array
    {
        $floors = $this->getFloors();

        return [
            'restaurant_enabled' => $this->restaurantEnabled(),
            'floors' => $floors->map(fn ($floor) => [
                'id' => $floor->id,
                'name' => $floor->name,
            ])->values(),
        ];
    }

    protected function syncFloorPlanOnCreate(Table $table, ?int $floorId): void
    {
        if (!$this->restaurantEnabled() || !$floorId) {
            return;
        }

        $floor = DB::table('floors')->where('id', $floorId)->first();
        if (!$floor) {
            return;
        }

        $newTable = [
            'id' => $table->id,
            'x' => 0,
            'y' => 0,
            'width' => 100,
            'height' => 100,
            'name' => $table->name . '(' . $table->number_of_person . ')',
        ];

        $floorplan = json_decode($floor->floorplan, true) ?? [];
        $floorplan[] = $newTable;

        DB::table('floors')
            ->where('id', $floor->id)
            ->update(['floorplan' => json_encode($floorplan)]);
    }

    protected function syncFloorPlanOnUpdate(Table $table, Request $request, int $floorPrevId): void
    {
        if (!$this->restaurantEnabled()) {
            return;
        }

        $tableId = (int) $request->input('table_id', $table->id);
        $floorId = (int) $request->input('floor_id');

        if ($floorPrevId != $floorId) {
            $floorPrev = DB::table('floors')->where('id', $floorPrevId)->first();
            if ($floorPrev) {
                $floorplanPrev = json_decode($floorPrev->floorplan, true) ?? [];
                $updatedFloorplan = array_values(array_filter(
                    $floorplanPrev,
                    fn ($item) => ($item['id'] ?? null) != $tableId
                ));
                DB::table('floors')
                    ->where('id', $floorPrevId)
                    ->update(['floorplan' => json_encode($updatedFloorplan)]);
            }

            $newTable = [
                'id' => $tableId,
                'x' => 0,
                'y' => 0,
                'width' => 100,
                'height' => 100,
                'name' => $request->name . '(' . $request->number_of_person . ')',
            ];

            $floor = DB::table('floors')->where('id', $floorId)->first();
            if ($floor) {
                $floorplan = json_decode($floor->floorplan, true) ?? [];
                $floorplan[] = $newTable;
                DB::table('floors')
                    ->where('id', $floor->id)
                    ->update(['floorplan' => json_encode($floorplan)]);
            }

            return;
        }

        $floor = DB::table('floors')->where('id', $floorId)->first();
        if (!$floor) {
            return;
        }

        $floorplan = json_decode($floor->floorplan, true);
        if (isset($floorplan)) {
            foreach ($floorplan as &$item) {
                if (($item['id'] ?? null) == $tableId) {
                    $item['name'] = $request->name . '(' . $request->number_of_person . ')';
                    break;
                }
            }
            unset($item);
        } else {
            $floorplan = [[
                'id' => $tableId,
                'x' => 0,
                'y' => 0,
                'width' => 100,
                'height' => 100,
                'name' => $request->name . '(' . $request->number_of_person . ')',
            ]];
        }

        DB::table('floors')
            ->where('id', $floor->id)
            ->update(['floorplan' => json_encode($floorplan)]);
    }

    protected function syncFloorPlanOnDelete(Table $table): void
    {
        if (!$this->restaurantEnabled() || !$table->floor_id) {
            return;
        }

        $floor = DB::table('floors')->where('id', $table->floor_id)->first();
        if (!$floor) {
            return;
        }

        $floorplan = json_decode($floor->floorplan, true) ?? [];
        $tableId = $table->id;
        $updatedFloorplan = array_values(array_filter(
            $floorplan,
            fn ($item) => ($item['id'] ?? null) != $tableId
        ));

        DB::table('floors')
            ->where('id', $table->floor_id)
            ->update(['floorplan' => json_encode($updatedFloorplan)]);
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

        $lims_table_all = Table::where('is_active', true)->orderBy('id')->get();
        $floors = $this->getFloors()->keyBy('id');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_table_all->map(fn ($table) => $this->formatTable($table, $floors)),
                'metadata' => $this->metadataPayload(),
            ]);
        }

        if ($this->restaurantEnabled()) {
            $floors = DB::table('floors')->get();

            return view('backend.table.index', compact('lims_table_all', 'floors'));
        }

        return view('backend.table.index', compact('lims_table_all'));
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

        $rules = [
            'name' => 'required|string|max:255',
            'number_of_person' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ];
        if ($this->restaurantEnabled()) {
            $rules['floor_id'] = 'required|integer|exists:floors,id';
        }

        $request->validate($rules);

        $data = $request->only(['name', 'number_of_person', 'description', 'floor_id']);
        $data['is_active'] = true;
        $table = Table::create($data);

        $this->syncFloorPlanOnCreate($table, $request->input('floor_id'));
        $this->cacheForget('table_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Table created successfully'),
                'data' => $this->formatTable($table),
            ], 201);
        }

        return redirect()->back()->with('message', __('db.Table created successfully'));
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

        $tableId = $request->input('table_id', $id);
        $rules = [
            'name' => 'required|string|max:255',
            'number_of_person' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ];
        if ($this->restaurantEnabled()) {
            $rules['floor_id'] = 'required|integer|exists:floors,id';
        }

        $request->validate($rules);

        $table = Table::findOrFail($tableId);
        $floorPrevId = (int) $table->floor_id;
        $table->update($request->only(['name', 'number_of_person', 'description', 'floor_id']));

        $this->syncFloorPlanOnUpdate($table, $request, $floorPrevId);
        $this->cacheForget('table_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Table updated successfully'),
                'data' => $this->formatTable($table->fresh()),
            ]);
        }

        return redirect()->back()->with('message', __('db.Table updated successfully'));
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $table = Table::findOrFail($id);
        $table->update(['is_active' => false]);

        $this->syncFloorPlanOnDelete($table);
        $this->cacheForget('table_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Table deleted successfully'),
            ]);
        }

        return redirect()->back()->with('message', __('db.Table deleted successfully'));
    }
}
