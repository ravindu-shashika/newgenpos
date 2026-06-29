<?php

namespace App\Support;

class Permissions
{
    public static function enforced(): bool
    {
        return (bool) config('permissions.enforce', false);
    }

    public static function bypassed(): bool
    {
        return ! self::enforced();
    }
}
