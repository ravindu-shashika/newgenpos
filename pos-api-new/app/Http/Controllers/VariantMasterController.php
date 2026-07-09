<?php

namespace App\Http\Controllers;

use App\Models\VariantMaster;
use App\Models\VariantMasterValue;
use App\Services\VariantMasterImportService;
use App\Services\VariantMasterResolver;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class VariantMasterController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id <= 2) {
            return true;
        }

        return $user->can('products-index')
            || $user->can('products-add')
            || $user->can('products-edit');
    }

    protected function formatMaster(VariantMaster $master): array
    {
        $master->loadMissing(['values' => fn ($q) => $q->where('is_active', true)->orderBy('position')]);

        return [
            'id' => $master->id,
            'name' => $master->name,
            'position' => (int) $master->position,
            'values' => $master->values->map(fn (VariantMasterValue $v) => [
                'id' => $v->id,
                'value' => $v->value,
                'position' => (int) $v->position,
            ])->values()->all(),
        ];
    }

    public static function listForProductForm(): array
    {
        if (!\Schema::hasTable('variant_masters')) {
            return [];
        }

        return VariantMaster::with(['values' => fn ($q) => $q->where('is_active', true)->orderBy('position')])
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get()
            ->map(fn (VariantMaster $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'values' => $m->values->map(fn (VariantMasterValue $v) => [
                    'id' => $v->id,
                    'value' => $v->value,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $masters = VariantMaster::with(['values' => fn ($q) => $q->where('is_active', true)->orderBy('position')])
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get()
            ->map(fn (VariantMaster $m) => $this->formatMaster($m));

        return $this->spaJson($request, ['data' => $masters]);
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('variant_masters', 'name')->where(fn ($q) => $q->where('is_active', true))],
            'values' => ['required', 'array', 'min:1'],
            'values.*' => ['required', 'string', 'max:100'],
        ]);

        $master = DB::transaction(function () use ($data) {
            $position = (int) VariantMaster::where('is_active', true)->max('position') + 1;
            $master = VariantMaster::create([
                'name' => trim($data['name']),
                'position' => $position,
                'is_active' => true,
            ]);

            $this->syncValues($master, $data['values']);

            return $master;
        });

        return $this->spaJson($request, [
            'message' => __('db.Data inserted successfully'),
            'data' => $this->formatMaster($master->fresh()),
        ], 201);
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $master = VariantMaster::where('is_active', true)->findOrFail($id);

        return $this->spaJson($request, ['data' => $this->formatMaster($master)]);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $master = VariantMaster::where('is_active', true)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('variant_masters', 'name')->ignore($master->id)->where(fn ($q) => $q->where('is_active', true))],
            'values' => ['required', 'array', 'min:1'],
            'values.*' => ['required', 'string', 'max:100'],
        ]);

        DB::transaction(function () use ($master, $data) {
            $master->update(['name' => trim($data['name'])]);
            $this->syncValues($master, $data['values']);
        });

        return $this->spaJson($request, [
            'message' => __('db.Data updated successfully'),
            'data' => $this->formatMaster($master->fresh()),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $master = VariantMaster::where('is_active', true)->findOrFail($id);
        $master->update(['is_active' => false]);
        $master->allValues()->update(['is_active' => false]);

        return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
    }

    public function importLegacy(Request $request, VariantMasterImportService $importService)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $import = $importService->importFromLegacy();
        $links = app(VariantMasterResolver::class)->migrateProductVariantForeignKeys();

        return $this->spaJson($request, [
            'message' => 'Legacy variants imported and product links updated to variant_master_values.',
            'data' => array_merge($import, ['link_migration' => $links]),
        ]);
    }

    public function migrateLinks(Request $request, VariantMasterResolver $resolver)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $result = $resolver->migrateProductVariantForeignKeys();

        return $this->spaJson($request, [
            'message' => 'Product variant links now use variant_master_values.',
            'data' => $result,
        ]);
    }

    protected function syncValues(VariantMaster $master, array $values): void
    {
        $normalized = [];
        foreach ($values as $value) {
            $trimmed = trim((string) $value);
            if ($trimmed !== '' && !in_array($trimmed, $normalized, true)) {
                $normalized[] = $trimmed;
            }
        }

        $keepIds = [];
        foreach ($normalized as $index => $value) {
            $row = VariantMasterValue::firstOrNew([
                'variant_master_id' => $master->id,
                'value' => $value,
            ]);
            $row->position = $index + 1;
            $row->is_active = true;
            $row->save();
            $keepIds[] = $row->id;
        }

        VariantMasterValue::where('variant_master_id', $master->id)
            ->whereNotIn('id', $keepIds)
            ->update(['is_active' => false]);
    }
}
