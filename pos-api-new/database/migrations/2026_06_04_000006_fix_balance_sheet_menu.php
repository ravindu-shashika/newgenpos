<?php

use App\Models\Menu;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $rows = Menu::query()
            ->where('main_menu', 'Accounting')
            ->where('sub_menu', 'Balance Sheet')
            ->orderBy('id')
            ->get();

        if ($rows->isEmpty()) {
            $reference = Menu::query()
                ->where('main_menu', 'Accounting')
                ->orderBy('id')
                ->first();

            Menu::create([
                'main_menu' => 'Accounting',
                'main_menu_icon' => $reference?->main_menu_icon,
                'sub_menu' => 'Balance Sheet',
                'sub_menu_icon' => 'dripicons-graph-line',
                'route' => '/balancesheet',
                'controller' => 'balance-sheets',
                'main_menu_order' => $reference?->main_menu_order ?? 1,
                'sub_menu_order' => $reference?->sub_menu_order ?? 8,
                'child_menu_order' => 4,
                'is_active' => true,
            ]);

            return;
        }

        $primary = $rows->first();
        $primary->update([
            'route' => '/balancesheet',
            'controller' => 'balance-sheets',
            'child_menu_order' => 4,
            'is_active' => true,
        ]);

        foreach ($rows->skip(1) as $duplicate) {
            $duplicate->delete();
        }
    }

    public function down(): void
    {
        Menu::query()
            ->where('main_menu', 'Accounting')
            ->where('sub_menu', 'Balance Sheet')
            ->where('route', '/balancesheet')
            ->update([
                'route' => '/balance-sheet',
                'controller' => 'balance-sheets',
            ]);
    }
};
