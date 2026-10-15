<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccreditationSnapshot extends Model
{
    protected $fillable = ['taken_at', 'final_score', 'predicate', 'scores', 'taken_by'];

    protected function casts(): array
    {
        return ['taken_at' => 'datetime', 'final_score' => 'float', 'scores' => 'array'];
    }
}
