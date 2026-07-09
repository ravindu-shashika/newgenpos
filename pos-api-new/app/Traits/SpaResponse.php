<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;

trait SpaResponse
{
    protected function wantsSpaResponse(Request $request): bool
    {
        return $request->expectsJson() || $request->is('api/*');
    }

    protected function spaJson(Request $request, array $payload, int $status = 200): JsonResponse
    {
        foreach (['message', 'msg'] as $field) {
            if (isset($payload[$field]) && is_string($payload[$field])) {
                $payload[$field] = humanize_db_message($payload[$field]);
            }
        }

        return response()->json($payload, $status);
    }

    /**
     * User-friendly message for UI; raw exception text in `error` for developers.
     */
    protected function respondTransactionError(
        Request $request,
        Throwable $e,
        string $userMessage,
        int $status = 422,
        ?string $redirectTo = null
    ): JsonResponse|RedirectResponse {
        report($e);

        $friendly = humanize_db_message($userMessage);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'success' => false,
                'message' => $friendly,
                'error' => $e->getMessage(),
            ], $status);
        }

        $redirect = $redirectTo ? redirect($redirectTo) : redirect()->back();

        return $redirect->with('not_permitted', $friendly);
    }

    /**
     * Load/list endpoints: friendly message + developer error; rethrow for non-SPA.
     */
    protected function respondLoadError(
        Request $request,
        Throwable $e,
        string $userMessage,
        int $status = 500
    ): JsonResponse {
        report($e);

        return $this->spaJson($request, [
            'message' => humanize_db_message($userMessage),
            'error' => $e->getMessage(),
        ], $status);
    }
}
