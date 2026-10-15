<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\ValidationException;

class Book extends Model
{
    use HasFactory;

    public const PRINTED = 'fisik';

    public const EBOOK = 'ebook';

    protected $fillable = [
        'type', 'title', 'author_id', 'publisher_id', 'year', 'isbn', 'ddc_class', 'collection_type',
        'acquisition', 'donor', 'call_number', 'rack_id', 'format', 'file_size_mb', 'license_count', 'status',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'file_size_mb' => 'float',
            'license_count' => 'integer',
        ];
    }

    public function isPrinted(): bool
    {
        return $this->type === self::PRINTED;
    }

    /**
     * @return BelongsTo<Author, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    /**
     * @return BelongsTo<Publisher, $this>
     */
    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    /**
     * @return BelongsTo<Rack, $this>
     */
    public function rack(): BelongsTo
    {
        return $this->belongsTo(Rack::class);
    }

    /**
     * @return HasMany<BookCopy, $this>
     */
    public function copies(): HasMany
    {
        return $this->hasMany(BookCopy::class);
    }

    /**
     * Grow or shrink the copy list to $target. New copies get the next code
     * (B0001-3, B0001-4, ...). Only copies on the shelf can be removed, so a
     * loaned copy is never deleted.
     *
     * @throws ValidationException when too few copies are available to remove
     */
    public function syncCopyCount(int $target): void
    {
        $current = $this->copies()->count();

        if ($target > $current) {
            $next = $this->copies()->get()->map(fn (BookCopy $c) => (int) str($c->code)->afterLast('-')->toString())->max() ?? 0;

            for ($i = 1; $i <= $target - $current; $i++) {
                $this->copies()->create(['code' => $this->copyCode($next + $i)]);
            }

            return;
        }

        $remove = $current - $target;

        if ($remove === 0) {
            return;
        }

        $removable = $this->copies()->where('status', BookCopy::AVAILABLE)->orderByDesc('id')->limit($remove)->get();

        if ($removable->count() < $remove) {
            throw ValidationException::withMessages([
                'copies' => 'Hanya eksemplar yang sedang tersedia yang bisa dikurangi. Saat ini '.($current - $removable->count()).' eksemplar sedang tidak di rak.',
            ]);
        }

        $this->copies()->whereKey($removable->modelKeys())->delete();
    }

    private function copyCode(int $number): string
    {
        return sprintf('B%04d-%d', $this->id, $number);
    }
}
