<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OvertimeAssignment extends Model
{
    /** Minutes after the scheduled start before a check-in counts as late. */
    public const LATE_AFTER_MINUTES = 10;

    protected $fillable = ['overtime_session_id', 'employee_id', 'checked_in_at', 'checked_out_at'];

    protected function casts(): array
    {
        return ['checked_in_at' => 'datetime', 'checked_out_at' => 'datetime'];
    }

    public function isLate(): bool
    {
        return $this->checked_in_at !== null
            && $this->checked_in_at->gt($this->session->startsAt()->addMinutes(self::LATE_AFTER_MINUTES));
    }

    /** Worked minutes from check-in to check-out. */
    public function minutes(): int
    {
        if ($this->checked_in_at === null || $this->checked_out_at === null) {
            return 0;
        }

        return max(0, (int) $this->checked_in_at->diffInMinutes($this->checked_out_at));
    }

    /**
     * @return BelongsTo<OvertimeSession, $this>
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(OvertimeSession::class, 'overtime_session_id');
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
