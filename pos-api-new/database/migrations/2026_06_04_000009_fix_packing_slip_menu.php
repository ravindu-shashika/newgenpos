<?php

use App\Models\Menu;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $rows = Menu::query()
            ->where('main_menu', 'Sale')
            ->where('sub_menu', 'Packing Slip List')
            ->orderBy('id')
            ->get();

        if ($rows->isEmpty()) {
            $reference = Menu::query()
                ->where('main_menu', 'Sale')
                ->orderBy('id')
                ->first();

            Menu::create([
                'main_menu' => 'Sale',
                'main_menu_icon' => $reference?->main_menu_icon,
                'sub_menu' => 'Packing Slip List',
                'sub_menu_icon' => 'dripicons-box',
                'route' => '/packing-slips',
                'controller' => 'packing_slip',
                'main_menu_order' => $reference?->main_menu_order ?? 3,
                'sub_menu_order' => $reference?->sub_menu_order ?? 3,
                'child_menu_order' => 5,
                'is_active' => true,
            ]);

            return;
        }

        $primary = $rows->first();
        $primary->update([
            'route' => '/packing-slips',
            'controller' => 'packing_slip',
            'child_menu_order' => 5,
            'is_active' => true,
        ]);

        foreach ($rows->skip(1) as $duplicate) {
            $duplicate->delete();
        }
    }

    public function down(): void
    {
        // No-op: row predates migration in most environments.
    }
};
