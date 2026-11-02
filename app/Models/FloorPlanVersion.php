<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A floor's layout as it was before a save. */
class FloorPlanVersion extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['floor_id', 'user_id', 'payload'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
