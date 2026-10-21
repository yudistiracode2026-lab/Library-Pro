<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** An activity/output of the POK for one budget year, e.g. 051.0A Digitalisasi koleksi lama. */
class PokActivity extends Model
{
    protected $fillable = ['year', 'code', 'name'];

    protected function casts(): array
    {
        return ['year' => 'integer'];
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(PokAccount::class)->orderBy('code');
    }
}
