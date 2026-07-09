<?php

namespace App\Console\Commands;

use App\Services\VariantMasterResolver;
use Illuminate\Console\Command;

class MigrateVariantMasterLinks extends Command
{
    protected $signature = 'variant-masters:migrate-links {--dry-run : Show mapping only, do not update rows}';

    protected $description = 'Point product variant_id columns to variant_master_values.id (replaces legacy variants table links)';

    public function handle(VariantMasterResolver $resolver): int
    {
        $map = $resolver->buildLegacyIdMap();

        if (empty($map)) {
            $this->warn('No legacy variants table rows found (or already migrated).');
            return self::SUCCESS;
        }

        $this->info('Legacy variants.id → variant_master_values.id');
        foreach ($map as $oldId => $newId) {
            $this->line("  {$oldId} → {$newId}");
        }

        if ($this->option('dry-run')) {
            $this->comment('Dry run — no rows updated.');
            return self::SUCCESS;
        }

        $result = $resolver->migrateProductVariantForeignKeys();

        $this->info('Updated rows: ' . $result['updated_rows']);
        foreach ($result['tables'] as $table => $count) {
            $this->line("  {$table}: {$count}");
        }

        $this->newLine();
        $this->comment('product_variants.variant_id now stores variant_master_values.id');
        $this->comment('Legacy variants table is no longer used for new saves.');

        return self::SUCCESS;
    }
}
