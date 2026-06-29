<?php

namespace App\Http\Controllers;

use App\Models\Terminal;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\PosDownloadService;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

/**
 * Bulk download for Flutter POS — full or delta (changed rows since last sync).
 */
class PosDownloadController extends Controller
{
    use SpaResponse;

    public function manifest(Request $request, PosDownloadService $download)
    {
        if (!$this->canDownload($request)) {
            return response()->json([
                'message' => 'Unauthorized. Terminal must be active.',
            ], 401);
        }

        $request->validate([
            'mode' => 'nullable|in:full,delta',
            'since' => 'nullable|date',
        ]);

        $mode = $request->input('mode', PosDownloadService::MODE_FULL);
        $since = $request->input('since');

        if ($mode === PosDownloadService::MODE_DELTA && !$since) {
            return $this->spaJson($request, [
                'message' => 'since (ISO datetime) is required when mode=delta.',
            ], 422);
        }

        $warehouseId = $this->resolveWarehouseId($request);
        if (!$warehouseId) {
            return $this->spaJson($request, ['message' => 'warehouse_id is required.'], 422);
        }

        try {
            return $this->spaJson($request, $download->manifest($warehouseId, $mode, $since));
        } catch (\InvalidArgumentException $e) {
            return $this->spaJson($request, ['message' => $e->getMessage()], 422);
        }
    }

    public function download(Request $request, PosDownloadService $download)
    {
        if (!$this->canDownload($request)) {
            return response()->json([
                'message' => 'Unauthorized. Terminal must be active.',
            ], 401);
        }

        $request->validate([
            'resource' => 'required|string|in:' . implode(',', $download->resourceNames()),
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:5000',
            'warehouse_id' => 'nullable|integer',
            'mode' => 'nullable|in:full,delta',
            'since' => 'nullable|date',
        ]);

        $mode = $request->input('mode', PosDownloadService::MODE_FULL);
        $since = $request->input('since');

        if ($mode === PosDownloadService::MODE_DELTA && !$since) {
            return $this->spaJson($request, [
                'message' => 'since is required when mode=delta.',
            ], 422);
        }

        $warehouseId = $this->resolveWarehouseId($request);
        if (!$warehouseId) {
            return $this->spaJson($request, ['message' => 'warehouse_id is required.'], 422);
        }

        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', PosDownloadService::CHUNK_SIZE);

        try {
            $result = $download->download(
                $request->input('resource'),
                $page,
                $perPage,
                [
                    'warehouse_id' => $warehouseId,
                    'mode' => $mode,
                    'since' => $since,
                ]
            );
        } catch (\InvalidArgumentException $e) {
            return $this->spaJson($request, ['message' => $e->getMessage()], 422);
        }

        return $this->spaJson($request, [
            'resource' => $request->input('resource'),
            'page' => $page,
            'per_page' => $perPage,
            'warehouse_id' => $warehouseId,
            'mode' => $mode,
            'since' => $since,
            'count' => count($result['data'] ?? []),
            'data' => $result['data'] ?? [],
        ]);
    }

    public function downloadAll(Request $request, PosDownloadService $download)
    {
        $manifest = json_decode($this->manifest($request, $download)->getContent(), true);
        if (($manifest['message'] ?? null) && !isset($manifest['resources'])) {
            return response()->json($manifest, 401);
        }

        return $this->spaJson($request, [
            'message' => 'Download each resource page from POST /pos/setup/download',
            'manifest' => $manifest,
        ]);
    }

    private function canDownload(Request $request): bool
    {
        $terminal = $request->attributes->get('pos_terminal');
        if ($terminal instanceof Terminal && $terminal->is_active && !$terminal->is_delete) {
            return true;
        }

        return $this->authenticateWithCredentials($request) !== null;
    }

    private function resolveWarehouseId(Request $request): int
    {
        if ($request->filled('warehouse_id')) {
            return (int) $request->input('warehouse_id');
        }

        $terminal = $request->attributes->get('pos_terminal');
        if ($terminal instanceof Terminal && $terminal->warehouse_id) {
            return (int) $terminal->warehouse_id;
        }

        $user = $request->user() ?? $this->authenticateWithCredentials($request);
        if ($user?->warehouse_id) {
            return (int) $user->warehouse_id;
        }

        return (int) Warehouse::query()
            ->when(Schema::hasColumn('warehouses', 'is_active'), fn ($q) => $q->where('is_active', true))
            ->orderBy('id')
            ->value('id');
    }

    private function authenticateWithCredentials(Request $request): ?User
    {
        if ($request->user()) {
            return $request->user();
        }

        $login = $request->input('username') ?? $request->input('email') ?? $request->input('name');
        $password = $request->input('password');

        if (!$login || !$password) {
            return null;
        }

        $credentials = ['password' => $password];
        if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
            $credentials['email'] = $login;
        } elseif (User::where('username', $login)->exists()) {
            $credentials['username'] = $login;
        } else {
            $credentials['name'] = $login;
        }

        if (!Auth::attempt($credentials)) {
            return null;
        }

        $user = Auth::user();
        if (!$user || !$user->is_active) {
            Auth::logout();

            return null;
        }

        return $user;
    }
}
