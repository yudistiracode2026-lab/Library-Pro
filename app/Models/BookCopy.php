<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookCopy extends Model
{
    public const AVAILABLE = 'tersedia';

    protected $fillable = ['book_id', 'code', 'status'];

    /**
     * @return BelongsTo<Book, $this>
     */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}
