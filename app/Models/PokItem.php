<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A detail line of a POK account, e.g. 001264 Ketua: the only level that carries amounts. */
class PokItem extends Model
{
    protected $fillable = ['pok_account_id', 'code', 'name', 'pagu', 'lock_pagu', 'previous', 'current'];

    protected function casts(): array
    {
        return ['pagu' => 'integer', 'lock_pagu' => 'integer', 'previous' => 'integer', 'current' => 'integer'];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(PokAccount::class, 'pok_account_id');
    }
}
