<?php

namespace App\Console\Commands;

use App\Models\Menu;
use Illuminate\Console\Command;

class VerifyMenus extends Command
{
    protected $signature = 'menu:verify';
    protected $description = 'Verify menu data in database';

    public function handle()
    {
        $totalMenus = Menu::count();
        $this->info("Total Menus: {$totalMenus}");
        $this->newLine();

        // Group by sub_menu to show structure
        $subMenus = Menu::select('sub_menu', 'sub_menu_order', 'sub_menu_icon')
            ->distinct()
            ->orderBy('sub_menu_order')
            ->get();

        foreach ($subMenus as $subMenu) {
            $count = Menu::where('sub_menu', $subMenu->sub_menu)->count();
            $this->line("📁 {$subMenu->sub_menu} ({$count} items)");
            
            // Show first 3 items as sample
            Menu::where('sub_menu', $subMenu->sub_menu)
                ->orderBy('child_menu_order')
                ->take(3)
                ->get()
                ->each(function ($menu) {
                    $this->line("   └─ {$menu->second_sub_menu} → {$menu->route}");
                });
            
            if ($count > 3) {
                $this->line("   └─ ... and " . ($count - 3) . " more");
            }
            $this->newLine();
        }

        return Command::SUCCESS;
    }
}
