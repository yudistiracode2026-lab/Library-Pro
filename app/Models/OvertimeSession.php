<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class OvertimeSession extends Model
{
    protected $fillable = ['date', 'starts_at', 'ends_at', 'activity', 'created_by'];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    public function startsAt(): Carbon
    {
        return $this->date->copy()->setTimeFromTimeString($this->starts_at);
    }

    public function endsAt(): Carbon
    {
        return $this->date->copy()->setTimeFromTimeString($this->ends_at);
    }

    /**
     * @return HasMany<OvertimeAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(OvertimeAssignment::class);
    }
}
