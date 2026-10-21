<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A detail line of a POK account, e.g. 001264 Ketua: the level that carries the pagu and the realisation. */
class PokItem extends Model
{
    protected $fillable = ['pok_account_id', 'code', 'name', 'pagu', 'lock_pagu'];

    protected function casts(): array
    {
        return ['pagu' => 'integer', 'lock_pagu' => 'integer'];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(PokAccount::class, 'pok_account_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(PokProgress::class)->orderBy('date')->orderBy('id');
    }
}
