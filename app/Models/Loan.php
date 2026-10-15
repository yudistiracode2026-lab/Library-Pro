<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Loan extends Model
{
    protected $fillable = [
        'book_copy_id', 'member_id', 'loaned_at', 'due_at', 'extensions', 'returned_at',
        'fine_amount', 'damaged', 'loaned_by', 'returned_by',
    ];

    protected function casts(): array
    {
        return [
            'loaned_at' => 'datetime',
            'due_at' => 'date',
            'returned_at' => 'datetime',
            'extensions' => 'integer',
            'fine_amount' => 'integer',
            'damaged' => 'boolean',
        ];
    }

    /**
     * @param  Builder<Loan>  $query
     */
    public function scopeOpen(Builder $query): void
    {
        $query->whereNull('returned_at');
    }

    /**
     * @param  Builder<Loan>  $query
     */
    public function scopeOverdue(Builder $query): void
    {
        $query->whereNull('returned_at')->whereDate('due_at', '<', today());
    }

    /**
     * Whole days past the due date as of $on (0 when not late).
     */
    public function daysLate(?Carbon $on = null): int
    {
        $on = ($on ?? today())->copy()->startOfDay();

        return max(0, (int) $this->due_at->copy()->startOfDay()->diffInDays($on, false));
    }

    /**
     * @return BelongsTo<BookCopy, $this>
     */
    public function copy(): BelongsTo
    {
        return $this->belongsTo(BookCopy::class, 'book_copy_id');
    }

    /**
     * @return BelongsTo<Member, $this>
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
