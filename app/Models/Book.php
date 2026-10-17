<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\ValidationException;

class Book extends Model
{
    use HasFactory;

    public const PRINTED = 'fisik';

    public const EBOOK = 'ebook';

    protected $fillable = [
        'type', 'title', 'author_id', 'publisher_id', 'year', 'isbn', 'ddc_class', 'collection_type',
        'acquisition', 'donor', 'call_number', 'rack_id', 'format', 'file_size_mb', 'license_count', 'status', 'file_path',
        'classification', 'edition', 'publish_place', 'collation', 'language', 'series_title', 'abstract', 'cover_path', 'featured',
    ];

    /**
     * Main DDC class from a classification or call number: "346.04" -> 300.
     * "2X4" is the Indonesian extension for Islam, so class 200.
     */
    public static function ddcClassOf(?string ...$values): ?string
    {
        foreach ($values as $value) {
            if (preg_match('/(?<![0-9])([0-9])[0-9xX]{2}(?![0-9])/', (string) $value, $m)) {
                return $m[1].'00';
            }
        }

        return null;
    }

    /**
     * @return HasMany<EbookLoan, $this>
     */
    public function ebookLoans(): HasMany
    {
        return $this->hasMany(EbookLoan::class);
    }

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'file_size_mb' => 'float',
            'license_count' => 'integer',
            'featured' => 'boolean',
        ];
    }

    /**
     * Every author in order; the first is also books.author_id.
     *
     * @return BelongsToMany<Author, $this>
     */
    public function authors(): BelongsToMany
    {
        return $this->belongsToMany(Author::class, 'book_author')->withPivot('position')->orderByPivot('position');
    }

    /**
     * @return BelongsToMany<Subject, $this>
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class)->withPivot('position')->orderByPivot('position');
    }

    /**
     * Author names in order, falling back to the main author for titles
     * saved before several authors were supported.
     *
     * @return list<string>
     */
    public function authorNames(): array
    {
        $names = $this->authors->pluck('name')->all();

        return $names !== [] ? $names : array_filter([$this->author?->name]);
    }

    /**
     * Saves the ordered author list and keeps author_id on the first one.
     *
     * @param  list<string>  $names
     */
    public function syncAuthors(array $names): void
    {
        $ids = collect($names)->map(fn ($n) => trim($n))->filter()->unique(fn ($n) => mb_strtolower($n))
            ->map(fn ($n) => Author::idForName($n))->unique()->values();

        $this->authors()->sync($ids->mapWithKeys(fn ($id, $i) => [$id => ['position' => $i]])->all());

        if ($ids->isNotEmpty() && $this->author_id !== $ids[0]) {
            $this->update(['author_id' => $ids[0]]);
        }
    }

    /**
     * @param  list<string>  $names
     */
    public function syncSubjects(array $names): void
    {
        $ids = collect($names)->map(fn ($n) => trim($n))->filter()->unique(fn ($n) => mb_strtolower($n))
            ->map(fn ($n) => Subject::idForName($n))->unique()->values();

        $this->subjects()->sync($ids->mapWithKeys(fn ($id, $i) => [$id => ['position' => $i]])->all());
    }

    /** Cover image URL, versioned so a replaced image is not served from cache. */
    public function coverUrl(): ?string
    {
        return $this->cover_path ? route('cover', ['book' => $this->id, 'v' => substr(md5($this->cover_path), 0, 8)]) : null;
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
