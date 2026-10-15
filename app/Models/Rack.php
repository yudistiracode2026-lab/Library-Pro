<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rack extends Model
{
    /** Each rack has 3 rows of 2 shelves ("ambalan"), as in the prototype. */
    public const SHELVES = 6;

    protected $fillable = ['code', 'name', 'floor', 'map_x', 'map_y', 'map_w', 'map_h'];

    protected function casts(): array
    {
        return [
            'floor' => 'integer',
            'map_x' => 'float',
            'map_y' => 'float',
            'map_w' => 'float',
            'map_h' => 'float',
        ];
    }

    /**
     * @return HasMany<Book, $this>
     */
    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }
}
