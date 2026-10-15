<?php

namespace App\Models;

use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    use HasFactory;

    public const KINDS = ['pustakawan', 'tendik'];

    protected $fillable = ['kind', 'nip', 'name', 'golongan', 'position', 'status', 'is_head', 'user_id'];

    protected function casts(): array
    {
        return ['is_head' => 'boolean'];
    }

    public function pangkat(): ?string
    {
        return MasterOptions::GOLONGAN[$this->golongan] ?? null;
    }

    /**
     * @param  Builder<Employee>  $query
     */
    public function scopeOfKind(Builder $query, string $kind): void
    {
        $query->where('kind', $kind);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
