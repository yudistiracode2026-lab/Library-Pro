<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A realisation amount spent on a POK detail line on a given date. */
class PokProgress extends Model
{
    protected $table = 'pok_progress';

    protected $fillable = ['pok_item_id', 'date', 'amount', 'user_id'];

    protected function casts(): array
    {
        return ['date' => 'date', 'amount' => 'integer'];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(PokItem::class, 'pok_item_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
