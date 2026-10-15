<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visit extends Model
{
    public const PURPOSES = ['Membaca', 'Pinjam / kembali', 'Mengerjakan tugas', 'Diskusi kelompok', 'Layanan referensi'];

    public const METHOD_QR = 'QR';

    public const METHOD_MANUAL = 'Manual';

    public const METHOD_GUEST = 'Tamu';

    protected $fillable = ['member_id', 'guest_name', 'guest_org', 'purpose', 'method', 'checked_in_at', 'checked_out_at', 'recorded_by'];

    protected function casts(): array
    {
        return ['checked_in_at' => 'datetime', 'checked_out_at' => 'datetime'];
    }

    /**
     * @param  Builder<Visit>  $query
     */
    public function scopeToday(Builder $query): void
    {
        $query->whereDate('checked_in_at', today());
    }

    /**
     * @param  Builder<Visit>  $query
     */
    public function scopeInside(Builder $query): void
    {
        $query->whereNull('checked_out_at');
    }

    /**
     * Check a member out if they are inside today, otherwise check them in.
     *
     * @return array{0: Visit, 1: 'masuk'|'keluar'}
     */
    public static function toggle(Member $member, string $purpose, string $method, ?int $recordedBy): array
    {
        $open = $member->visits()->today()->inside()->latest('checked_in_at')->first();

        if ($open) {
            $open->update(['checked_out_at' => now()]);

            return [$open, 'keluar'];
        }

        return [self::create([
            'member_id' => $member->id,
            'purpose' => $purpose,
            'method' => $method,
            'checked_in_at' => now(),
            'recorded_by' => $recordedBy,
        ]), 'masuk'];
    }

    /**
     * @return BelongsTo<Member, $this>
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
