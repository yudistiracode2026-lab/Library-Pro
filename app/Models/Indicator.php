<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One of the 56 key indicators (IK). Options hold the instrument's four
 * answers a–d (scores 4–1). Indicators without a calculator, or whose data
 * the system does not hold yet, are scored manually with a note.
 */
class Indicator extends Model
{
    public const MODES = ['Otomatis', 'Semi', 'Manual'];

    protected $fillable = [
        'number', 'component', 'name', 'mode', 'options', 'source', 'recommendation',
        'manual_score', 'manual_value', 'manual_note', 'assessed_by', 'assessed_at',
        'pic_employee_id', 'due_date', 'position',
    ];

    protected function casts(): array
    {
        return [
            'component' => 'integer',
            'options' => 'array',
            'manual_score' => 'integer',
            'assessed_at' => 'datetime',
            'due_date' => 'date',
        ];
    }

    /**
     * @return HasMany<Evidence, $this>
     */
    public function evidence(): HasMany
    {
        return $this->hasMany(Evidence::class);
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function pic(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'pic_employee_id');
    }
}
