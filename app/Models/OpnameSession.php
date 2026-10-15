<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OpnameSession extends Model
{
    protected $fillable = ['name', 'started_at', 'finished_at', 'started_by'];

    protected function casts(): array
    {
        return ['started_at' => 'datetime', 'finished_at' => 'datetime'];
    }

    public static function active(): ?self
    {
        return self::whereNull('finished_at')->latest('started_at')->first();
    }

    /**
     * @return HasMany<OpnameCheck, $this>
     */
    public function checks(): HasMany
    {
        return $this->hasMany(OpnameCheck::class);
    }
}
