<?php

use App\Models\Menu;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Menu::query()
            ->where('main_menu', 'Sale')
            ->where('sub_menu', 'POS')
            ->update([
                'route' => '/pos',
                'controller' => 'pos',
                'is_active' => true,
            ]);
    }

    public function down(): void
    {
        Menu::query()
            ->where('main_menu', 'Sale')
            ->where('sub_menu', 'POS')
            ->update([
                'route' => '/sale/pos',
                'controller' => 'pos',
            ]);
    }
};
