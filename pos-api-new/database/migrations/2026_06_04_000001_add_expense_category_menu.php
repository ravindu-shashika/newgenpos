<?php

use App\Models\Menu;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $exists = Menu::query()
            ->where('main_menu', 'Expense')
            ->where('sub_menu', 'Expense Category')
            ->exists();

        if ($exists) {
            return;
        }

        $reference = Menu::query()
            ->where('main_menu', 'Expense')
            ->orderBy('id')
            ->first();

        Menu::create([
            'main_menu' => 'Expense',
            'main_menu_icon' => $reference?->main_menu_icon,
            'sub_menu' => 'Expense Category',
            'sub_menu_icon' => 'dripicons-tag',
            'route' => '/expense/categories',
            'controller' => 'expense_categories',
            'main_menu_order' => $reference?->main_menu_order ?? 1,
            'sub_menu_order' => $reference?->sub_menu_order ?? 6,
            'child_menu_order' => 0,
            'is_active' => true,
        ]);
    }

    public function down(): void
    {
        Menu::query()
            ->where('main_menu', 'Expense')
            ->where('sub_menu', 'Expense Category')
            ->delete();
    }
};
