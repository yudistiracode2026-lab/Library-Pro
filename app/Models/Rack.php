<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rack extends Model
{
    protected $fillable = ['code', 'name', 'floor'];

    /**
     * @return HasMany<Book, $this>
     */
    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }
}
