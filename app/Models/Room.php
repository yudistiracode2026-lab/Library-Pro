<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    /** Room type => [label, group]; group d = basic, p = supporting, f = public facility, n = non-service. */
    public const TYPES = [
        'koleksi' => ['Dasar · koleksi', 'd'],
        'baca' => ['Dasar · baca', 'd'],
        'kerja' => ['Dasar · kerja/pengolahan', 'd'],
        'layanan' => ['Dasar · layanan', 'd'],
        'pendukung' => ['Pendukung', 'p'],
        'fasum' => ['Fasilitas umum', 'f'],
        'non' => ['Non-layanan', 'n'],
    ];

    /** The four room types every library must have. */
    public const BASIC_TYPES = ['koleksi', 'baca', 'kerja', 'layanan'];

    protected $fillable = ['floor', 'name', 'type', 'area_m2', 'map_x', 'map_y', 'map_w', 'map_h', 'outside_library'];

    protected function casts(): array
    {
        return [
            'floor' => 'integer',
            'area_m2' => 'float',
            'map_x' => 'float',
            'map_y' => 'float',
            'map_w' => 'float',
            'map_h' => 'float',
            'outside_library' => 'boolean',
        ];
    }

    /** Voids and stairs are drawn on the plan but cannot be selected. */
    public function isFixed(): bool
    {
        return in_array($this->name, ['Void', 'Tangga'], true);
    }

    /**
     * @return HasMany<Asset, $this>
     */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }
}
