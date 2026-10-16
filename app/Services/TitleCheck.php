<?php

namespace App\Services;

use App\Models\Thesis;
use Illuminate\Support\Collection;

/**
 * Compares a planned thesis title with earlier works in the repository by
 * keyword overlap (title words, then the work's keywords). It is a guide
 * for choosing a topic, not a plagiarism check of the content.
 */
class TitleCheck
{
    private const STOPWORDS = [
        'di', 'ke', 'dari', 'dan', 'atau', 'yang', 'pada', 'dalam', 'untuk', 'dengan', 'terhadap', 'oleh', 'sebagai',
        'studi', 'kasus', 'analisis', 'kajian', 'tentang', 'serta', 'kabupaten', 'kota', 'provinsi', 'desa', 'berbasis',
    ];

    /**
     * @return list<string>
     */
    public function keywords(string $text): array
    {
        return array_values(array_unique($this->words($text)));
    }

    /**
     * @return array{keywords: list<string>, results: Collection<int, array<string, mixed>>, themes: array<string, int>}
     */
    public function run(string $query): array
    {
        $keywords = $this->keywords($query);

        if ($keywords === []) {
            return ['keywords' => [], 'results' => collect(), 'themes' => []];
        }

        $results = Thesis::query()->orderByDesc('year')->get()->map(function (Thesis $t) use ($keywords) {
            $titleWords = $this->words($t->title);
            $tags = array_values(array_filter(array_map('trim', explode(';', (string) $t->keywords))));
            $tagWords = $this->words(implode(' ', $tags));
            $hits = array_filter($keywords, fn ($k) => $this->matchesAny($k, $titleWords));
            $tagHits = array_filter($keywords, fn ($k) => $this->matchesAny($k, $tagWords));
            $pct = (int) min(98, round((count($hits) * 0.8 + count($tagHits) * 0.2) / count($keywords) * 100));

            return [
                'id' => $t->id,
                'type' => $t->type,
                'title' => $t->title,
                'author' => $t->author,
                'study_program' => $t->study_program,
                'year' => $t->year,
                'tags' => $tags,
                'pct' => $pct,
                // Title split into words, each flagged when it matched a keyword.
                'words' => collect(preg_split('/\s+/', $t->title))->map(function (string $word) use ($hits) {
                    $norm = $this->words($word)[0] ?? null;

                    return ['t' => $word, 'hit' => $norm !== null && $this->matchesAny($norm, $hits)];
                })->all(),
            ];
        })->filter(fn ($r) => $r['pct'] > 0)->sortBy([['pct', 'desc'], ['year', 'desc']])->values();

        $themes = $results->flatMap(fn ($r) => $r['tags'])->countBy()->sortDesc()->all();

        return ['keywords' => $keywords, 'results' => $results, 'themes' => $themes];
    }

    /**
     * @return list<string>
     */
    private function words(string $text): array
    {
        $plain = preg_replace('/[^a-z0-9\s]/', ' ', mb_strtolower($text)) ?? '';

        return array_values(array_filter(
            preg_split('/\s+/', $plain) ?: [],
            fn ($w) => strlen($w) > 2 && ! in_array($w, self::STOPWORDS, true),
        ));
    }

    /**
     * Two words match when one starts with the first five letters of the
     * other, so "pendaftaran" matches "pendaftar" and "PTSL" matches "PTSL".
     *
     * @param  array<string>  $words
     */
    private function matchesAny(string $word, array $words): bool
    {
        foreach ($words as $other) {
            if (str_starts_with($other, substr($word, 0, 5)) || str_starts_with($word, substr($other, 0, 5))) {
                return true;
            }
        }

        return false;
    }
}
