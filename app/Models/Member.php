<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Member extends Model
{
    use HasFactory;

    protected $fillable = ['member_number', 'name', 'type', 'study_program', 'email', 'status', 'user_id'];

    public function isActive(): bool
    {
        return $this->status === 'Aktif';
    }

    /**
     * @return HasOne<MemberDevice, $this>
     */
    public function device(): HasOne
    {
        return $this->hasOne(MemberDevice::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Loan, $this>
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /**
     * @return HasMany<Visit, $this>
     */
    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class);
    }

    /**
     * @return HasMany<ClearanceRequest, $this>
     */
    /**
     * @return HasMany<EbookLoan, $this>
     */
    public function ebookLoans(): HasMany
    {
        return $this->hasMany(EbookLoan::class);
    }

    /**
     * @return HasMany<ReadingSession, $this>
     */
    public function readingSessions(): HasMany
    {
        return $this->hasMany(ReadingSession::class);
    }

    public function clearanceRequests(): HasMany
    {
        return $this->hasMany(ClearanceRequest::class);
    }
}
