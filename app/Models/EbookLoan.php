<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A member's licence on an e-book for a fixed period. A licence is free
 * again once returned or past its due date.
 */
class EbookLoan extends Model
{
    protected $fillable = ['book_id', 'member_id', 'borrowed_at', 'due_at', 'returned_at', 'last_page'];

    protected function casts(): array
    {
        return [
            'borrowed_at' => 'datetime',
            'due_at' => 'datetime',
            'returned_at' => 'datetime',
            'last_page' => 'integer',
        ];
    }

    /**
     * Loans still holding a licence.
     *
     * @param  Builder<EbookLoan>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('returned_at')->where('due_at', '>', now());
    }

    /**
     * @return BelongsTo<Book, $this>
     */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    /**
     * @return BelongsTo<Member, $this>
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
