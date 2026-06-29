<?php

namespace App\Services\Concerns;

use Illuminate\Support\Facades\DB;
use Throwable;

trait RunsPosSyncTransaction
{
    /**
     * Run POS sync work inside a DB transaction (commit / rollback on failure).
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    protected function runPosSyncTransaction(callable $callback): mixed
    {
        DB::beginTransaction();

        try {
            $result = $callback();
            DB::commit();

            return $result;
        } catch (Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
