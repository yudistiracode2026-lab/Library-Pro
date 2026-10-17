<?php

namespace App\Models;

use App\Models\Concerns\HasUniqueName;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Subject heading (tajuk subjek) of a title.
 */
class Subject extends Model
{
    use HasUniqueName;

    protected $fillable = ['name'];

    /**
     * @return BelongsToMany<Book, $this>
     */
    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class);
    }
}
