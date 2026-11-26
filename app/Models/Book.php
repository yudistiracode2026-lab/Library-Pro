<?php

namespace App\Models;

use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class Book extends Model
{
    use HasFactory;

    public const PRINTED = 'fisik';

    public const EBOOK = 'ebook';

    protected $fillable = [
        'type', 'title', 'author_id', 'publisher_id', 'year', 'isbn', 'ddc_class', 'collection_type', 'material_type',
        'acquisition', 'donor', 'call_number', 'rack_id', 'format', 'file_size_mb', 'license_count', 'status', 'file_path',
        'classification', 'edition', 'publish_place', 'collation', 'language', 'series_title', 'abstract', 'cover_path', 'featured',
    ];

    protected static function booted(): void
    {
        static::saving(function (Book $book) {
            $book->material_type ??= self::materialTypeOf($book->type, $book->collection_type);
        });
    }

    /**
     * The usual material type (jenis bahan) of a title: e-books are electronic
     * resources, journals serials, maps cartographic, the rest monographs.
     */
    public static function materialTypeOf(?string $type, ?string $collectionType): string
    {
        return match (true) {
            $type === self::EBOOK => 'Sumber elektronik',
            $collectionType === 'Jurnal & majalah' => 'Terbitan berkala',
            $collectionType === 'Peta & atlas' => 'Bahan kartografis',
            default => 'Monograf',
        };
    }

    /** The SNP collection type (Koleksi umum, Referensi, Terbitan berkala, Muatan lokal). */
    public function collectionCategory(): ?string
    {
        return MasterOptions::categoryOf($this->collection_type);
    }

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

    /** Stores a new cover image and removes the old one. */
    public function replaceCover(UploadedFile $file): void
    {
        $old = $this->cover_path;
        $this->update(['cover_path' => $file->storeAs('sampul', "sampul-{$this->id}-".now()->format('YmdHis').'.'.$file->extension(), 'local')]);

        if ($old && $old !== $this->cover_path) {
            Storage::disk('local')->delete($old);
        }
    }

    /** Removes the cover image, back to the coloured placeholder. */
    public function removeCover(): void
    {
        if ($this->cover_path) {
            Storage::disk('local')->delete($this->cover_path);
            $this->update(['cover_path' => null]);
        }
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

    /** A copy code: year of acquisition, acquisition code, inventory number ("26SM22610"). */
    public const COPY_CODE = '/^(\d{2})([A-Z]{1,3})(\d+)$/';

    /**
     * Grow or shrink the copy list to $target. New copies get consecutive
     * inventory numbers, from $firstInventory or after the highest number in
     * use, coded with the year of acquisition and the acquisition code:
     * "26SM22917", "26SM22918". Only copies on the shelf can be removed, so a
     * loaned copy is never deleted.
     *
     * @throws ValidationException when the inventory numbers are taken, or too few copies are available to remove
     */
    public function syncCopyCount(int $target, ?int $firstInventory = null, ?int $year = null): void
    {
        $current = $this->copies()->count();

        if ($target > $current) {
            $count = $target - $current;
            $first = $firstInventory ?? self::nextInventoryNumber();
            $taken = self::inventoryNumbersInUse()->intersect(range($first, $first + $count - 1));

            if ($taken->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'inventory_start' => 'No. inventaris '.$taken->sort()->implode(', ').' sudah dipakai eksemplar lain. Kosongkan untuk melanjutkan dari nomor '.self::nextInventoryNumber().'.',
                ]);
            }

            $prefix = sprintf('%02d', ($year ?? now()->year) % 100).$this->acquisitionCode();
            for ($i = 0; $i < $count; $i++) {
                $this->copies()->create(['code' => $prefix.($first + $i)]);
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

    /** The acquisition's label code ("SM", "P"). */
    public function acquisitionCode(): string
    {
        return MasterOptions::ACQUISITION_CODES[$this->acquisition] ?? 'P';
    }

    /** The number after the highest inventory number in use. */
    public static function nextInventoryNumber(): int
    {
        return (self::inventoryNumbersInUse()->max() ?? 0) + 1;
    }

    /**
     * Inventory numbers of every copy coded with one ("26SM22610" -> 22610).
     * Older generated codes (B0001-1) carry none.
     *
     * @return Collection<int, int>
     */
    public static function inventoryNumbersInUse()
    {
        return BookCopy::query()->where('code', 'not like', 'B%')->pluck('code')
            ->map(fn (string $code) => preg_match(self::COPY_CODE, $code, $m) ? (int) $m[3] : null)
            ->filter()
            ->values();
    }
}
