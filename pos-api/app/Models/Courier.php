<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Courier extends Model
{
    protected $fillable = ["name", "api_key", "secret_key", "phone_number", "address", "is_active"];
}
