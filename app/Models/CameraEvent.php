<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CameraEvent extends Model
{
    public const KINDS = ['Info', 'Antrean', 'Gerakan', 'Alarm', 'Offline'];

    protected $fillable = ['camera_id', 'occurred_at', 'kind', 'description', 'recorded_by'];

    protected function casts(): array
    {
        return ['occurred_at' => 'datetime'];
    }

    /**
     * @return BelongsTo<Camera, $this>
     */
    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }
}
