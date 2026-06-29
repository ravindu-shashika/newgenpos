<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait SpaResponse
{
    protected function wantsSpaResponse(Request $request): bool
    {
        return $request->expectsJson() || $request->is('api/*');
    }

    protected function spaJson(Request $request, array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status);
    }
}
