<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Camera extends Model
{
    public const AREAS = ['Sirkulasi', 'Referensi', 'Ruang baca', 'Koleksi', 'Lainnya'];

    protected $fillable = ['code', 'name', 'floor', 'area', 'stream_url', 'online', 'recording'];

    protected function casts(): array
    {
        return ['floor' => 'integer', 'online' => 'boolean', 'recording' => 'boolean'];
    }

    /**
     * @return HasMany<CameraEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(CameraEvent::class);
    }
}
