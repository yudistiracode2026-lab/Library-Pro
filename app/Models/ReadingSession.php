<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One on-site reading of a repository work, kept for the member's history
 * and the repository usage statistics.
 */
class ReadingSession extends Model
{
    protected $fillable = ['thesis_id', 'member_id', 'started_at', 'ended_at', 'max_page'];

    protected function casts(): array
    {
        return ['started_at' => 'datetime', 'ended_at' => 'datetime', 'max_page' => 'integer'];
    }

    /**
     * @return BelongsTo<Thesis, $this>
     */
    public function thesis(): BelongsTo
    {
        return $this->belongsTo(Thesis::class);
    }

    /**
     * @return BelongsTo<Member, $this>
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
