<?php

namespace App\Http\Middleware;

use App\Models\Terminal;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Optional POS device auth — attaches active terminal when Bearer pos_* token is sent.
 */
class AuthenticatePosDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if ($token && str_starts_with($token, 'pos_')) {
            $terminal = Terminal::withoutGlobalScopes()
                ->where('pos_token', $token)
                ->where('is_delete', false)
                ->first();

            if (!$terminal) {
                return response()->json(['message' => 'Invalid POS token.'], 401);
            }

            if (!$terminal->is_active) {
                return response()->json([
                    'message' => 'This terminal is not activated. Contact your administrator.',
                ], 403);
            }

            $request->attributes->set('pos_terminal', $terminal);

            $terminal->forceFill([
                'last_active' => now(),
                'ip' => $request->ip(),
            ])->save();
        }

        return $next($request);
    }
}
