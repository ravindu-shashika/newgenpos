<?php

namespace Database\Seeders\Tenant;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ThemeSettingSeeder extends Seeder
{
    public function run(): void
    {
        if (!DB::table('theme_settings')->count()) {
            $defaults = [
                [
                    'name' => 'Indigo',
                    'theme_color' => '#6366F1', // 500 shade only
                    'font_family' => 'Jost',
                    'icon_pack' => 'solar',
                    'item_size' => 16,
                    'input_design' => 'outlined',
                    'button_style' => 'gradient',
                    'button_colors' => json_encode(['#6366F1', '#8B5CF6']),
                    'border_radius' => 'rounded-lg',
                    'sidebar_style' => 'normal',
                    'sidebar_corner' => 'rounded',
                    'auth_background_type' => 'themed',
                    'is_active' => true,
                    'active_for' => json_encode(['app']),
                    'is_deleted' => false,
                ],
                [
                    'name' => 'Green',
                    'theme_color' => '#10B981', // 500 shade only
                    'font_family' => 'Poppins',
                    'icon_pack' => 'fontawesome',
                    'item_size' => 16,
                    'input_design' => 'filled',
                    'button_style' => 'filled',
                    'button_colors' => null,
                    'border_radius' => 'rounded-none',
                    'sidebar_style' => 'normal',
                    'sidebar_corner' => 'rounded',
                    'auth_background_type' => 'themed',
                    'is_active' => true,
                    'active_for' => json_encode(['app']),
                    'is_deleted' => false,
                ],
                [
                    'name' => 'Blue',
                    'theme_color' => '#3B82F6', // 500 shade only
                    'font_family' => 'Roboto',
                    'icon_pack' => 'material',
                    'item_size' => 16,
                    'input_design' => 'outlined',
                    'button_style' => 'outlined',
                    'button_colors' => null,
                    'border_radius' => 'rounded',
                    'sidebar_style' => 'normal',
                    'sidebar_corner' => 'rounded',
                    'auth_background_type' => 'themed',
                    'is_active' => true,
                    'active_for' => json_encode(['app']),
                    'is_deleted' => false,
                ],
                [
                    'name' => 'Violet',
                    'theme_color' => '#8b5cf6', // 500 shade only
                    'font_family' => 'Roboto',
                    'icon_pack' => 'cupertino',
                    'item_size' => 16,
                    'input_design' => 'outlined',
                    'button_style' => 'gradient',
                    'button_colors' => json_encode(['#a78bfa', '#7c3aed']),
                    'border_radius' => 'rounded-lg',
                    'sidebar_style' => 'normal',
                    'sidebar_corner' => 'rounded',
                    'auth_background_type' => 'themed',
                    'is_active' => true,
                    'active_for' => json_encode(['app']),
                    'is_deleted' => false,
                ],
                [
                    'name' => 'Red',
                    'theme_color' => '#F43F5E', // 500 shade only
                    'font_family' => 'Nunito',
                    'icon_pack' => 'heroicons',
                    'item_size' => 16,
                    'input_design' => 'filled',
                    'button_style' => 'filled',
                    'button_colors' => null,
                    'border_radius' => 'rounded-full',
                    'sidebar_style' => 'normal',
                    'sidebar_corner' => 'rounded',
                    'auth_background_type' => 'themed',
                    'is_active' => true,
                    'active_for' => json_encode(['app']),
                    'is_deleted' => false,
                ],
                [
                    'name' => 'Orange',
                    'theme_color' => '#F97316', // 500 shade only
                    'font_family' => 'Raleway',
                    'icon_pack' => 'bootstrap',
                    'item_size' => 16,
                    'input_design' => 'filled',
                    'button_style' => 'outlined',
                    'button_colors' => null,
                    'border_radius' => 'rounded-full',
                    'sidebar_style' => 'normal',
                    'sidebar_corner' => 'rounded',
                    'auth_background_type' => 'themed',
                    'is_active' => true,
                    'active_for' => json_encode(['app']),
                    'is_deleted' => false,
                ],
            ];
            DB::table('theme_settings')->insert($defaults);
        }
    }
}
