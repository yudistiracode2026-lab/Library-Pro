<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class License extends Model
{
    public const STATUSES = ['Berlisensi', 'Open source', 'Tidak berlisensi'];

    protected $fillable = ['name', 'usage', 'license_type', 'seats', 'status'];

    protected function casts(): array
    {
        return ['seats' => 'integer'];
    }
}
