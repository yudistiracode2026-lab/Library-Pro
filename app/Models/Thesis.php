<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A skripsi, tesis, or disertasi in the institutional repository. The
 * abstract is open; the full text can only be read inside the library.
 */
class Thesis extends Model
{
    protected $table = 'theses';

    public const TYPES = ['Skripsi', 'Tesis', 'Disertasi'];

    protected $fillable = [
        'type', 'title', 'author', 'member_number', 'study_program', 'year', 'advisor', 'keywords',
        'pages', 'abstract', 'call_number', 'file_path', 'clearance_request_id',
    ];

    protected function casts(): array
    {
        return ['year' => 'integer', 'pages' => 'integer'];
    }

    /**
     * @return BelongsTo<ClearanceRequest, $this>
     */
    public function clearanceRequest(): BelongsTo
    {
        return $this->belongsTo(ClearanceRequest::class);
    }

    /**
     * @return HasMany<ReadingSession, $this>
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(ReadingSession::class);
    }
}
