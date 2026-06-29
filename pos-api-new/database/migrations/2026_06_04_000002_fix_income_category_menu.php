<?php

use App\Models\Menu;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $rows = Menu::query()
            ->where('main_menu', 'Income')
            ->where('sub_menu', 'Income Category')
            ->orderBy('id')
            ->get();

        if ($rows->isEmpty()) {
            $reference = Menu::query()
                ->where('main_menu', 'Income')
                ->orderBy('id')
                ->first();

            Menu::create([
                'main_menu' => 'Income',
                'main_menu_icon' => $reference?->main_menu_icon,
                'sub_menu' => 'Income Category',
                'sub_menu_icon' => 'dripicons-tag',
                'route' => '/income_categories',
                'controller' => 'income_categories',
                'main_menu_order' => $reference?->main_menu_order ?? 1,
                'sub_menu_order' => $reference?->sub_menu_order ?? 7,
                'child_menu_order' => 0,
                'is_active' => true,
            ]);

            return;
        }

        $primary = $rows->first();
        $primary->update([
            'route' => '/income_categories',
            'controller' => 'income_categories',
            'child_menu_order' => 0,
            'is_active' => true,
        ]);

        foreach ($rows->skip(1) as $duplicate) {
            $duplicate->delete();
        }
    }

    public function down(): void
    {
        Menu::query()
            ->where('main_menu', 'Income')
            ->where('sub_menu', 'Income Category')
            ->where('route', '/income_categories')
            ->update([
                'route' => '/income-category',
                'controller' => 'income-category',
                'child_menu_order' => 2,
            ]);
    }
};
