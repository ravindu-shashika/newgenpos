<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Printer extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'warehouse_id',
        'connection_type',
        'capability_profile',
        'char_per_line',
        'ip_address',
        'port',
        'path',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the warehouse this printer is assigned to.
     */
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the user who created the printer.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Connection type options for receipt printers.
     *
     * @return array<string, string>
     */
    public static function connection_types(): array
    {
        return [
            'network' => __('db.Network'),
            'windows' => __('db.Windows'),
            'linux' => __('db.Linux'),
        ];
    }

    /**
     * Capability profile options (printer command set).
     *
     * @return array<string, string>
     */
    public static function capability_profiles(): array
    {
        return [
            'default' => __('db.Default'),
            'simple' => __('db.Simple Capability Profile'),
            'SP2000' => 'Star TSP2000',
            'TSP143' => 'Star TSP143',
            'TSP650' => 'Star TSP650',
            'TM-T88II' => 'Epson TM-T88II',
            'TM-T88III' => 'Epson TM-T88III',
            'TM-T88IV' => 'Epson TM-T88IV',
        ];
    }

    /**
     * Human-readable connection type label.
     */
    public function getConnectionTypeStrAttribute(): string
    {
        $types = self::connection_types();
        return $types[$this->connection_type] ?? $this->connection_type;
    }

    /**
     * Human-readable capability profile label.
     */
    public function getCapabilityProfileStrAttribute(): string
    {
        $profiles = self::capability_profiles();
        return $profiles[$this->capability_profile] ?? $this->capability_profile;
    }
}
