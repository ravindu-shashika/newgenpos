<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\VariantMaster;
use App\Models\VariantMasterValue;
use App\Services\VariantMasterResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VariantMasterImportService
{
    /**
     * Import names from legacy `variants` table (+ product option values) into variant_masters.
     *
     * @return array{masters: array<int, array>, added_values: int, masters_created: int}
     */
    public function importFromLegacy(): array
    {
        if (!Schema::hasTable('variant_masters') || !Schema::hasTable('variants')) {
            return ['masters' => [], 'added_values' => 0, 'masters_created' => 0];
        }

        $grouped = [];

        foreach (DB::table('variants')->orderBy('id')->pluck('name') as $name) {
            $name = trim((string) $name);
            if ($name === '') {
                continue;
            }
            $masterName = $this->resolveMasterName($name);
            $grouped[$masterName][$name] = true;
        }

        Product::query()
            ->where('is_variant', true)
            ->whereNotNull('variant_option')
            ->select(['variant_option', 'variant_value'])
            ->chunk(200, function ($products) use (&$grouped) {
                foreach ($products as $product) {
                    $options = json_decode($product->variant_option, true) ?: [];
                    $values = json_decode($product->variant_value, true) ?: [];
                    foreach ($options as $idx => $optionName) {
                        $optionName = trim((string) $optionName);
                        if ($optionName === '') {
                            continue;
                        }
                        $masterName = $optionName;
                        $raw = $values[$idx] ?? '';
                        foreach (preg_split('/\s*,\s*/', (string) $raw) as $piece) {
                            $piece = trim($piece);
                            if ($piece !== '') {
                                $grouped[$masterName][$piece] = true;
                            }
                        }
                    }
                }
            });

        $mastersCreated = 0;
        $addedValues = 0;

        DB::transaction(function () use ($grouped, &$mastersCreated, &$addedValues) {
            $position = (int) VariantMaster::where('is_active', true)->max('position');

            foreach ($grouped as $masterName => $valueMap) {
                $master = VariantMaster::firstOrCreate(
                    ['name' => $masterName],
                    ['position' => ++$position, 'is_active' => true]
                );

                if ($master->wasRecentlyCreated) {
                    $mastersCreated++;
                } elseif (!$master->is_active) {
                    $master->update(['is_active' => true, 'position' => ++$position]);
                }

                $valueNames = array_keys($valueMap);
                usort($valueNames, [$this, 'sortVariantValues']);

                foreach ($valueNames as $index => $valueName) {
                    $row = VariantMasterValue::firstOrNew([
                        'variant_master_id' => $master->id,
                        'value' => $valueName,
                    ]);
                    if (!$row->exists || !$row->is_active) {
                        $addedValues++;
                    }
                    $row->position = $index + 1;
                    $row->is_active = true;
                    $row->save();
                }
            }
        });

        return [
            'masters' => VariantMaster::with(['values' => fn ($q) => $q->where('is_active', true)->orderBy('position')])
                ->where('is_active', true)
                ->orderBy('position')
                ->get()
                ->map(fn (VariantMaster $m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'values' => $m->values->pluck('value')->all(),
                ])
                ->values()
                ->all(),
            'added_values' => $addedValues,
            'masters_created' => $mastersCreated,
        ];
    }

    protected function resolveMasterName(string $valueName): string
    {
        if (preg_match('/^\d+(\.\d+)?$/', $valueName)) {
            return 'Numeric Size';
        }

        return 'Size';
    }

    protected function sortVariantValues(string $a, string $b): int
    {
        $order = ['XXS' => 1, 'XS' => 2, 'S' => 3, 'M' => 4, 'L' => 5, 'XL' => 6, 'XXL' => 7, '3XL' => 8, '4XL' => 9];
        $au = strtoupper($a);
        $bu = strtoupper($b);
        $ao = $order[$au] ?? null;
        $bo = $order[$bu] ?? null;

        if ($ao !== null && $bo !== null) {
            return $ao <=> $bo;
        }
        if ($ao !== null) {
            return -1;
        }
        if ($bo !== null) {
            return 1;
        }
        if (is_numeric($a) && is_numeric($b)) {
            return (float) $a <=> (float) $b;
        }

        return strnatcasecmp($a, $b);
    }

    /**
     * Values actually used on a product (from product_variants + variant_option JSON).
     *
     * @return array<string, list<string>> master name => values
     */
    public function productVariantSelections(int $productId): array
    {
        $product = Product::find($productId);
        if (!$product || !$product->is_variant) {
            return [];
        }

        $selections = [];
        $options = json_decode($product->variant_option, true) ?: [];
        $values = json_decode($product->variant_value, true) ?: [];

        foreach ($options as $idx => $optionName) {
            $optionName = trim((string) $optionName);
            if ($optionName === '') {
                continue;
            }
            $selected = [];
            $raw = $values[$idx] ?? '';
            foreach (preg_split('/\s*,\s*/', (string) $raw) as $piece) {
                $piece = trim($piece);
                if ($piece !== '') {
                    $selected[] = $piece;
                }
            }
            $selections[$optionName] = array_values(array_unique($selected));
        }

        $resolver = app(VariantMasterResolver::class);

        $valueRows = VariantMasterValue::query()
            ->whereIn(
                'id',
                ProductVariant::where('product_id', $productId)->pluck('variant_id')
            )
            ->with('master')
            ->get();

        foreach ($valueRows as $valueRow) {
            $masterName = trim((string) ($valueRow->master?->name ?? ''));
            if ($masterName === '') {
                $masterName = $resolver->masterNameForValue((string) $valueRow->value);
            }
            $value = trim((string) $valueRow->value);
            if ($value === '') {
                continue;
            }
            $selections[$masterName] = array_values(array_unique(array_merge(
                $selections[$masterName] ?? [],
                [$value]
            )));
        }

        $comboNames = ProductVariant::where('product_id', $productId)
            ->orderBy('position')
            ->get()
            ->map(fn ($pv) => $resolver->valueName((int) $pv->variant_id))
            ->filter()
            ->values()
            ->all();

        if (count($selections) === 1) {
            $key = array_key_first($selections);
            $selections[$key] = array_values(array_unique(array_merge($selections[$key], $comboNames)));
        } elseif (empty($selections) && !empty($comboNames)) {
            $selections['Size'] = $comboNames;
        }

        return $selections;
    }
}
