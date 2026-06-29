<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Full database schema from newgenpos_Structure.sql (127 application tables).
     * Laravel's `migrations` table is managed by the framework and is excluded.
     */
    public function up(): void
    {
        if (Schema::hasTable('accounts') && Schema::hasTable('users') && Schema::hasTable('products')) {
            return;
        }

        $path = database_path('schema/newgenpos_structure.sql');

        if (! is_file($path)) {
            throw new RuntimeException("Schema file not found: {$path}");
        }

        $sql = file_get_contents($path);

        foreach ($this->splitSqlStatements($sql) as $statement) {
            DB::unprepared($statement);
        }
    }

    public function down(): void
    {
        // Destructive rollback is not supported for the full schema dump.
    }

    /**
     * @return list<string>
     */
    private function splitSqlStatements(string $sql): array
    {
        $statements = [];
        $buffer = '';

        foreach (preg_split('/\R/', $sql) as $line) {
            $trimmed = trim($line);

            if ($trimmed === '' || str_starts_with($trimmed, '/*') || str_starts_with($trimmed, '--')) {
                continue;
            }

            $buffer .= $line."\n";

            if (str_ends_with(rtrim($line), ';')) {
                $statement = trim($buffer);
                $buffer = '';

                if ($statement !== '') {
                    $statements[] = $statement;
                }
            }
        }

        if (trim($buffer) !== '') {
            $statements[] = trim($buffer);
        }

        return $statements;
    }
};
