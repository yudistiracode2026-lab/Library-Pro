<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A physical-evidence item required by an indicator ("SK kebijakan",
 * "berita acara tinjauan", ...), with its uploaded file and approval.
 */
class Evidence extends Model
{
    public const MISSING = 'Belum ada';

    public const DRAFT = 'Draf';

    public const APPROVED = 'Disahkan';

    public const EXPIRED = 'Kedaluwarsa';

    public const STATUSES = [self::MISSING, self::DRAFT, self::APPROVED, self::EXPIRED];

    /** Accepted upload types and size, per the PRD. */
    public const MIMES = 'pdf,jpg,jpeg,png,docx,xlsx,mp4';

    public const MAX_KB = 25600;

    protected $table = 'evidence';

    protected $fillable = [
        'indicator_id', 'label', 'file_path', 'original_name', 'size', 'status',
        'uploaded_by', 'uploaded_at', 'approved_by', 'approved_at', 'valid_until',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'uploaded_at' => 'datetime',
            'approved_at' => 'datetime',
            'valid_until' => 'date',
        ];
    }

    /**
     * Approved evidence past its validity date counts as expired.
     */
    public function effectiveStatus(): string
    {
        return $this->status === self::APPROVED && $this->valid_until?->isPast() ? self::EXPIRED : $this->status;
    }

    /**
     * @return BelongsTo<Indicator, $this>
     */
    public function indicator(): BelongsTo
    {
        return $this->belongsTo(Indicator::class);
    }
}
