<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A member's request for a title. Flow: Diusulkan -> Disetujui (added to
 * the procurement list) -> Dipesan (list submitted) -> Tersedia (arrived);
 * or Ditolak.
 */
class CollectionSuggestion extends Model
{
    public const PROPOSED = 'Diusulkan';

    public const APPROVED = 'Disetujui';

    public const ORDERED = 'Dipesan';

    public const AVAILABLE = 'Tersedia';

    public const REJECTED = 'Ditolak';

    /** Copies added to the procurement list when a suggestion is approved. */
    public const COPIES_ON_APPROVAL = 2;

    protected $fillable = ['title', 'author', 'member_id', 'votes', 'status', 'note', 'book_id'];

    protected function casts(): array
    {
        return ['votes' => 'integer'];
    }

    /**
     * @return BelongsTo<Member, $this>
     */
    /**
     * Members backing the suggestion (one vote each).
     *
     * @return BelongsToMany<Member, $this>
     */
    public function voters(): BelongsToMany
    {
        return $this->belongsToMany(Member::class, 'suggestion_votes');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    /**
     * @return HasOne<ProcurementItem, $this>
     */
    public function procurementItem(): HasOne
    {
        return $this->hasOne(ProcurementItem::class, 'suggestion_id');
    }
}
