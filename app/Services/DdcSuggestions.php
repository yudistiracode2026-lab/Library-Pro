<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * DDC numbers to suggest while cataloguing a title: the Library of Congress
 * record for its ISBN (reliable for foreign books), and the numbers this
 * library already gave to the same ISBN, the same subjects and titles with
 * the same words (what helps for Indonesian books).
 */
class DdcSuggestions
{
    private const LOC_SRU = 'http://lx2.loc.gov:210/LCDB';

    /** Words that say nothing about the subject of a title. */
    private const STOPWORDS = [
        'yang', 'dan', 'dari', 'untuk', 'dengan', 'dalam', 'pada', 'atau', 'oleh', 'tentang', 'terhadap', 'sebagai', 'antara',
        'akan', 'atas', 'bagi', 'melalui', 'menurut', 'serta', 'kepada', 'secara', 'buku', 'edisi', 'jilid', 'cetakan', 'revisi',
        'studi', 'kasus', 'kabupaten', 'kecamatan', 'kota', 'provinsi', 'desa', 'kelurahan', 'kantor', 'pertanahan', 'pelaksanaan',
        'analisis', 'tinjauan', 'pengantar', 'dasar', 'teori', 'praktik', 'panduan', 'pedoman', 'tahun', 'indonesia', 'daerah',
        'with', 'from', 'into', 'about', 'their', 'that', 'this', 'theory', 'practice', 'introduction', 'edition', 'volume',
    ];

    /**
     * @param  list<string>  $subjects
     * @return array{loc: array{number: string, title: string}|null, locError: bool, catalogue: list<array{number: string, reason: string, count: int, examples: list<string>}>}
     */
    public function for(?string $isbn, ?string $title, array $subjects = [], ?int $ignoreBookId = null): array
    {
        $isbn = $this->isbn($isbn);
        [$loc, $locError] = $isbn ? $this->fromLibraryOfCongress($isbn) : [null, false];

        return [
            'loc' => $loc,
            'locError' => $locError,
            'catalogue' => $this->fromCatalogue($isbn, (string) $title, $subjects, $ignoreBookId),
        ];
    }

    /**
     * The 082 field of the Library of Congress record, kept for a month.
     *
     * @return array{0: array{number: string, title: string}|null, 1: bool} the record, and whether the lookup failed
     */
    public function fromLibraryOfCongress(string $isbn): array
    {
        try {
            $record = Cache::remember("ddc.loc.{$isbn}", now()->addMonth(), function () use ($isbn) {
                $xml = Http::timeout(8)->get(self::LOC_SRU, [
                    'operation' => 'searchRetrieve', 'version' => '1.1', 'recordSchema' => 'marcxml', 'maximumRecords' => 1,
                    'query' => "bath.isbn={$isbn}",
                ])->throw()->body();

                if (! preg_match('/tag="082".*?code="a">([^<]+)</s', $xml, $ddc)) {
                    return ['none' => true];
                }
                preg_match('/tag="245".*?code="a">([^<]+)</s', $xml, $title);

                return [
                    // "371.2/07": the slash only marks where the number may be cut.
                    'number' => str_replace(['/', "'"], '', trim($ddc[1])),
                    'title' => rtrim(html_entity_decode(trim($title[1] ?? '')), ' /:;'),
                ];
            });
        } catch (Throwable) {
            return [null, true];
        }

        return [isset($record['none']) ? null : $record, false];
    }

    /**
     * @param  list<string>  $subjects
     * @return list<array{number: string, reason: string, count: int, examples: list<string>}>
     */
    private function fromCatalogue(?string $isbn, string $title, array $subjects, ?int $ignore): array
    {
        $classified = fn () => Book::query()->whereNotNull('classification')->where('classification', '!=', '')
            ->when($ignore, fn ($q) => $q->whereKeyNot($ignore));
        $suggestions = collect();

        if ($isbn) {
            $same = $classified()->whereRaw("REPLACE(REPLACE(isbn, '-', ''), ' ', '') = ?", [$isbn])->get(['title', 'classification']);
            $suggestions = $suggestions->concat($this->tally($same, 'ISBN sama di katalog', 1));
        }

        $subjects = array_values(array_filter(array_map('trim', $subjects)));
        if ($subjects) {
            $books = $classified()->whereHas('subjects', fn ($s) => $s->whereIn('name', $subjects))->limit(400)->get(['title', 'classification']);
            $suggestions = $suggestions->concat($this->tally($books, 'Subjek sama', 3));
        }

        $words = $this->keywords($title);
        if ($words) {
            // Titles sharing the most of these words; at least two when there are two to share.
            $score = collect($words)->map(fn ($w) => '(CASE WHEN title LIKE ? THEN 1 ELSE 0 END)')->implode(' + ');
            $bindings = collect($words)->map(fn ($w) => "%{$w}%")->all();
            $books = $classified()
                ->where(fn ($q) => collect($words)->each(fn ($w) => $q->orWhere('title', 'like', "%{$w}%")))
                ->select(['title', 'classification'])->selectRaw("{$score} AS hits", $bindings)
                ->orderByDesc('hits')->limit(60)->get()
                ->filter(fn ($b) => $b->hits >= min(2, count($words)));
            $suggestions = $suggestions->concat($this->tally($books, 'Judul mirip', 2));
        }

        // One entry per number, the strongest reason first.
        return $suggestions->unique('number')->take(6)->values()->all();
    }

    /**
     * @param  Collection<int, Book>  $books
     * @return Collection<int, array{number: string, reason: string, count: int, examples: list<string>}>
     */
    private function tally(Collection $books, string $reason, int $take): Collection
    {
        return $books->groupBy(fn (Book $b) => trim($b->classification))
            ->map(fn (Collection $group, string $number) => [
                'number' => $number,
                'reason' => $reason,
                'count' => $group->count(),
                'examples' => $group->pluck('title')->unique()->take(2)->map(fn ($t) => Str::limit($t, 70))->values()->all(),
            ])
            ->sortByDesc('count')->take($take)->values();
    }

    /**
     * Up to six telling words of a title, longest first.
     *
     * @return list<string>
     */
    private function keywords(string $title): array
    {
        return collect(preg_split('/[^\p{L}\p{N}]+/u', Str::lower($title)))
            ->filter(fn ($w) => mb_strlen($w) >= 4 && ! preg_match('/^\d+$/', $w) && ! in_array($w, self::STOPWORDS, true))
            ->unique()->sortByDesc(fn ($w) => mb_strlen($w))->take(6)->values()->all();
    }

    private function isbn(?string $isbn): ?string
    {
        $digits = strtoupper(preg_replace('/[^0-9Xx]/', '', (string) $isbn));

        return in_array(strlen($digits), [10, 13], true) ? $digits : null;
    }
}
