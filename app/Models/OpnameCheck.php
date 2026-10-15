<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpnameCheck extends Model
{
    public const FOUND = 'ada';

    public const DAMAGED = 'rusak';

    public const MISSING = 'hilang';

    public const RESULTS = [self::FOUND, self::DAMAGED, self::MISSING];

    protected $fillable = ['opname_session_id', 'book_copy_id', 'result', 'checked_at', 'checked_by'];

    protected function casts(): array
    {
        return ['checked_at' => 'datetime'];
    }

    /**
     * @return BelongsTo<BookCopy, $this>
     */
    public function copy(): BelongsTo
    {
        return $this->belongsTo(BookCopy::class, 'book_copy_id');
    }
}
