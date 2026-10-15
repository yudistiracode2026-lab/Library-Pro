<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProcurementItem extends Model
{
    public const SOURCES = ['Terbaru', 'Favorit', 'Usulan'];

    protected $fillable = [
        'title', 'author', 'publisher', 'year', 'ddc_class', 'price', 'quantity', 'source',
        'book_id', 'new_publication_id', 'suggestion_id', 'submitted_at',
    ];

    protected function casts(): array
    {
        return ['price' => 'integer', 'quantity' => 'integer', 'year' => 'integer', 'submitted_at' => 'datetime'];
    }

    /**
     * Items on the list still being drafted.
     *
     * @param  Builder<ProcurementItem>  $query
     */
    public function scopeDraft(Builder $query): void
    {
        $query->whereNull('submitted_at');
    }

    public function subtotal(): int
    {
        return $this->price * $this->quantity;
    }

    /**
     * @return BelongsTo<CollectionSuggestion, $this>
     */
    public function suggestion(): BelongsTo
    {
        return $this->belongsTo(CollectionSuggestion::class);
    }
}
