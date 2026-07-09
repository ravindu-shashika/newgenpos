<?php

namespace App\Console\Commands;

use App\Services\VariantMasterImportService;
use Illuminate\Console\Command;

class ImportLegacyVariantMasters extends Command
{
    protected $signature = 'variant-masters:import-legacy';

    protected $description = 'Import legacy variants table values into variant_masters / variant_master_values';

    public function handle(VariantMasterImportService $service): int
    {
        $result = $service->importFromLegacy();

        $this->info('Import complete.');
        $this->line('Masters created: ' . $result['masters_created']);
        $this->line('Values added/reactivated: ' . $result['added_values']);

        foreach ($result['masters'] as $master) {
            $this->line(sprintf(
                '  - %s: %s',
                $master['name'],
                implode(', ', $master['values'])
            ));
        }

        return self::SUCCESS;
    }
}
