<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;

trait CacheForget
{
    /**
     * Forget cache by key
     *
     * @param string $key
     * @return void
     */
    public function cacheForget($key)
    {
        Cache::forget($key);
    }

    /**
     * Forget multiple cache keys
     *
     * @param array $keys
     * @return void
     */
    public function cacheForgetMultiple(array $keys)
    {
        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }
}
