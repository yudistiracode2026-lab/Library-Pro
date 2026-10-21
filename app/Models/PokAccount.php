<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** An expenditure account under a POK activity, e.g. 521213 Belanja Honor Output Kegiatan. */
class PokAccount extends Model
{
    protected $fillable = ['pok_activity_id', 'code', 'name'];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(PokActivity::class, 'pok_activity_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PokItem::class)->orderBy('code');
    }
}
