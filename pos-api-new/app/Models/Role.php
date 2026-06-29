<?php

namespace App\Models;

use App\Support\Permissions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use HasFactory;

    /**
     * The guard name for this role
     *
     * @var string
     */
    protected $guard_name = 'sanctum';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'guard_name',
        'description',
    ];

    public function hasPermissionTo($permission, $guardName = null): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        return parent::hasPermissionTo($permission, $guardName);
    }

    /**
     * Get menus associated with this role
     * Many-to-many relationship with Menu model
     */
    public function menus()
    {
        return $this->belongsToMany(Menu::class, 'menu_role', 'role_id', 'menu_id');
    }
}
