<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    use HasFactory;

    protected $fillable = [
        'main_menu_icon',
        'main_menu',
        'sub_menu_icon',
        'sub_menu',
        'sub_menu_route',
        'second_sub_menu_icon',
        'second_sub_menu',
        'route',
        'controller',
        'main_menu_order',
        'sub_menu_order',
        'child_menu_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'main_menu_order' => 'integer',
            'sub_menu_order' => 'integer',
            'child_menu_order' => 'integer',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get main menu items (items without parent)
     */
    public function scopeMainMenu($query)
    {
        return $query->whereNotNull('main_menu')
                     ->whereNull('sub_menu')
                     ->orderBy('main_menu_order');
    }

    /**
     * Get sub menu items
     */
    public function scopeSubMenu($query)
    {
        return $query->whereNotNull('sub_menu')
                     ->whereNull('second_sub_menu')
                     ->orderBy('sub_menu_order');
    }

    /**
     * Get active menu items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get roles associated with this menu
     * Many-to-many relationship with Role model
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'menu_role', 'menu_id', 'role_id');
    }
}
