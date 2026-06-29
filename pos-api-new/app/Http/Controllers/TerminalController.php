<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Terminal;
use App\Models\Warehouse;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Keygen;

class TerminalController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(string $action = 'index'): bool
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
        if (!$role) {
            return false;
        }

        $map = [
            'index' => 'terminals-index',
            'add' => 'terminals-add',
            'edit' => 'terminals-edit',
            'delete' => 'terminals-delete',
        ];

        return $role->hasPermissionTo($map[$action] ?? 'terminals-index');
    }

    protected function denyAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess('index')) {
            return $this->denyAccess($request);
        }

        $terminals = Terminal::with('warehouse:id,name')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Terminal $t) => $this->formatRow($t));

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['data' => $terminals]);
        }

        return view('backend.terminal.index', compact('terminals'));
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess('index')) {
            return $this->denyAccess($request);
        }

        $terminal = Terminal::with('warehouse:id,name')->find($id);
        if (!$terminal) {
            return $this->spaJson($request, ['message' => 'Terminal not found.'], 404);
        }

        $payload = $this->formatRow($terminal, includeToken: true);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['data' => $payload]);
        }

        return $payload;
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccess('add')) {
            return $this->denyAccess($request);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'notes' => 'nullable|string|max:2000',
        ]);

        $code = $this->generateUniqueCode();
        $token = Str::random(32);

        $terminal = Terminal::create([
            'name' => $validated['name'],
            'code' => $code,
            'activation_token' => $token,
            'warehouse_id' => $validated['warehouse_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'is_active' => false,
            'is_delete' => false,
        ]);

        $payload = $this->formatRow($terminal->load('warehouse:id,name'), includeToken: true);
        $payload['activation_token_plain'] = $token;

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data inserted successfully'),
                'data' => $payload,
            ], 201);
        }

        return redirect()->back()->with('message', __('db.Data inserted successfully'));
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccess('edit')) {
            return $this->denyAccess($request);
        }

        $terminal = Terminal::find($id);
        if (!$terminal) {
            return $this->spaJson($request, ['message' => 'Terminal not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'notes' => 'nullable|string|max:2000',
        ]);

        $terminal->update($validated);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatRow($terminal->fresh('warehouse:id,name')),
            ]);
        }

        return redirect()->back()->with('message', __('db.Data updated successfully'));
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess('delete')) {
            return $this->denyAccess($request);
        }

        $terminal = Terminal::find($id);
        if (!$terminal) {
            return $this->spaJson($request, ['message' => 'Terminal not found.'], 404);
        }

        $terminal->update([
            'is_delete' => true,
            'is_active' => false,
            'pos_token' => null,
            'pos_token_issued_at' => null,
        ]);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
        }

        return redirect()->back()->with('message', __('db.Data deleted successfully'));
    }

    public function activate(Request $request, $id)
    {
        if (!$this->userCanAccess('edit')) {
            return $this->denyAccess($request);
        }

        $terminal = Terminal::find($id);
        if (!$terminal) {
            return $this->spaJson($request, ['message' => 'Terminal not found.'], 404);
        }

        $terminal->update([
            'is_active' => true,
            'activated_at' => $terminal->activated_at ?? now(),
        ]);

        return $this->spaJson($request, [
            'message' => 'Terminal activated.',
            'data' => $this->formatRow($terminal->fresh('warehouse:id,name')),
        ]);
    }

    public function deactivate(Request $request, $id)
    {
        if (!$this->userCanAccess('edit')) {
            return $this->denyAccess($request);
        }

        $terminal = Terminal::find($id);
        if (!$terminal) {
            return $this->spaJson($request, ['message' => 'Terminal not found.'], 404);
        }

        $terminal->update(['is_active' => false]);

        return $this->spaJson($request, [
            'message' => 'Terminal deactivated.',
            'data' => $this->formatRow($terminal->fresh('warehouse:id,name')),
        ]);
    }

    public function regenerateToken(Request $request, $id)
    {
        if (!$this->userCanAccess('edit')) {
            return $this->denyAccess($request);
        }

        $terminal = Terminal::find($id);
        if (!$terminal) {
            return $this->spaJson($request, ['message' => 'Terminal not found.'], 404);
        }

        $token = Str::random(32);
        $terminal->update(['activation_token' => $token]);

        $payload = $this->formatRow($terminal->fresh('warehouse:id,name'), includeToken: true);
        $payload['activation_token_plain'] = $token;

        return $this->spaJson($request, [
            'message' => 'Activation token regenerated.',
            'data' => $payload,
        ]);
    }

    /** POS app registers device using terminal code + token (public). */
    public function registerDevice(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:64',
            'activation_token' => 'required|string|max:128',
            'device_id' => 'required|string|max:191',
            'name' => 'nullable|string|max:191',
        ]);

        $terminal = Terminal::where('code', $request->input('code'))
            ->where('activation_token', $request->input('activation_token'))
            ->first();

        if (!$terminal) {
            return response()->json(['message' => 'Invalid terminal code or activation token.'], 422);
        }

        if (!$terminal->is_active) {
            return response()->json(['message' => 'This terminal is not activated. Contact your administrator.'], 403);
        }

        if ($terminal->device_id && $terminal->device_id !== $request->input('device_id')) {
            return response()->json([
                'message' => 'This terminal is already registered to another device.',
            ], 409);
        }

        $terminal->update([
            'device_id' => $request->input('device_id'),
            'ip' => $request->ip(),
            'last_active' => now(),
            'name' => $request->input('name') ?: $terminal->name,
        ]);

        return response()->json([
            'message' => 'Terminal registered.',
            'terminal' => $this->formatRow($terminal->fresh('warehouse:id,name')),
        ]);
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = 'TERM-' . Keygen::numeric(8)->generate();
        } while (Terminal::withoutGlobalScopes()->where('code', $code)->where('is_delete', false)->exists());

        return $code;
    }

    private function formatRow(Terminal $terminal, bool $includeToken = false): array
    {
        $row = [
            'id' => $terminal->id,
            'name' => $terminal->name,
            'code' => $terminal->code,
            'warehouse_id' => $terminal->warehouse_id,
            'warehouse_name' => $terminal->warehouse?->name,
            'device_id' => $terminal->device_id,
            'ip' => $terminal->ip,
            'is_active' => (bool) $terminal->is_active,
            'status' => $terminal->is_active ? 'active' : 'inactive',
            'activated_at' => $terminal->activated_at?->toIso8601String(),
            'last_active' => $terminal->last_active?->toIso8601String(),
            'notes' => $terminal->notes,
            'created_at' => $terminal->created_at?->toIso8601String(),
        ];

        if ($includeToken) {
            $row['activation_token'] = $terminal->activation_token;
            $row['activation_token_plain'] = $terminal->activation_token;
        }

        return $row;
    }
}
