<?php

namespace App\Models;

use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
    use HasRoles;

    protected $guard_name = 'sanctum';

    protected $fillable = [
       'name', 'username', 'email', 'password', 'access_pin', 'phone', 'company_name', 'role_id', 'biller_id', 'warehouse_id', 'account_id', 'is_active', 'is_deleted',
    ];

    protected $hidden = [
        'password', 'access_pin', 'remember_token',
    ];

    /**
     * Legacy code reads `name`; login/display value lives in `username`.
     */
    public function getNameAttribute($value = null)
    {
        if (!empty($this->attributes['name'])) {
            return $this->attributes['name'];
        }

        return $value ?? '';
    }

    public static function resolveDisplayName(?object $user): string
    {
        if (!$user) {
            return '';
        }

        return trim((string) ($user->username ?? $user->name ?? ''));
    }

    public function isActive()
    {
        return $this->is_active;
    }

    public function holiday() {
        return $this->hasMany('App\Models\Holiday');
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
