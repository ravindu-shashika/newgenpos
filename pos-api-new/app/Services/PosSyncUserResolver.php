<?php

namespace App\Services;

use App\Models\Terminal;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Resolve the Laravel user that should own a POS offline sale sync.
 */
class PosSyncUserResolver
{
    public function resolve(?Terminal $terminal, ?int $userId = null): ?User
    {
        if ($userId) {
            $user = User::where('id', $userId)
                ->where('is_active', true)
                ->where('is_deleted', false)
                ->first();
            if ($user) {
                Auth::setUser($user);

                return $user;
            }
        }

        if (Auth::check()) {
            return Auth::user();
        }

        if ($terminal?->warehouse_id) {
            $user = User::where('is_active', true)
                ->where('is_deleted', false)
                ->where('warehouse_id', $terminal->warehouse_id)
                ->orderBy('id')
                ->first();
            if ($user) {
                Auth::setUser($user);

                return $user;
            }
        }

        return null;
    }
}
