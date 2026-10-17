<?php

namespace App\Models;

use App\Models\Concerns\HasUniqueName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Author extends Model
{
    use HasFactory, HasUniqueName;

    protected $fillable = ['name', 'type'];

    /**
     * @return HasMany<Book, $this>
     */
    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }

    /**
     * Titles where this is the main or an additional author.
     *
     * @return BelongsToMany<Book, $this>
     */
    public function credits(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'book_author');
    }
}
