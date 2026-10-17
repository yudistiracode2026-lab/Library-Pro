<?php

namespace App\Console\Commands;

use App\Support\TitleText;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Writes every collection and thesis title in Title Case (see TitleText)
 * and, given word lists, corrects typos: a word used once or twice in the
 * catalogue, found in no dictionary, one edit (a missing, extra, swapped
 * or wrong letter) away from a dictionary word the catalogue uses often.
 * Words that are names elsewhere in the catalogue (authors, publishers,
 * subjects) are never corrected. A CSV of every change is written.
 *
 *   php artisan koleksi:rapikan-judul --kamus=id.txt --kamus=en.txt --coba
 */
class CleanTitles extends Command
{
    protected $signature = 'koleksi:rapikan-judul
        {--kamus=* : Daftar kata (satu kata per baris) untuk memeriksa salah ketik}
        {--coba : Hanya buat laporan, tanpa menyimpan}';

    protected $description = 'Ubah judul koleksi menjadi Title Case dan perbaiki salah ketik';

    /** Words before a place name: what follows is a name, not a typo ("Kabupaten Balangan"). */
    private const PLACE = '/\b(kabupaten|kab|kecamatan|kec|desa|kelurahan|kel|kota|kotamadya|provinsi|propinsi|prov|pulau|sungai|gunung|danau|kampung|dusun|nagari|distrik|teluk|selat|tanjung|kepulauan|wilayah|daerah|das|lintas|jalan|jl)\.?\s+(\p{L}+\s+)?$/iu';

    /** Prefixes that form real words with a known stem. */
    private const PREFIXES = ['ber', 'be', 'ter', 'me', 'mem', 'men', 'meng', 'meny', 'di', 'pe', 'pem', 'pen', 'peng', 'peny', 'per', 'ke',
        'se', 'pasca', 'antar', 'post', 'non', 'pra', 'geo', 'inter', 'multi', 'sub', 'super', 'trans', 're', 'un', 'pre', 'anti', 'tata'];

    /** Affixes are not words of their own when splitting glued words. */
    private const AFFIXES = ['nya', 'lah', 'kah', 'pun', 'ber', 'pen', 'pem', 'per', 'ter', 'pasca', 'antar', 'post', 'non', 'pra', 'geo', 'tata', 'an', 'kan'];

    /** Second halves of compound place names: "Tambaksari", "Gajahmungkur", "Sukamaju". */
    private const PLACE_PARTS = ['sari', 'rejo', 'harjo', 'mulyo', 'mulya', 'jaya', 'agung', 'asri', 'makmur', 'indah', 'baru', 'lor', 'kidul',
        'wetan', 'kulon', 'mungkur', 'tengah', 'utara', 'selatan', 'timur', 'barat', 'maju', 'raya', 'wangi', 'jati', 'karta', 'kerto',
        'harja', 'manik', 'sentosa', 'santosa', 'rahayu', 'subur', 'luhur', 'arum', 'mukti'];

    /** Real words the word lists miss. */
    private const KNOWN = ['kultum', 'macromedia', 'semigrafis', 'novell', 'simpleks'];

    /** OCR and keyboard slips that are too short for the general rule. */
    private const FIXED = ['dl' => 'di', 'dlm' => 'dalam', 'dgn' => 'dengan', 'yg' => 'yang', 'utk' => 'untuk', 'tdk' => 'tidak'];

    /** @var array<string, true> */
    private array $dictionary = [];

    /** @var array<string, int> */
    private array $frequency = [];

    /** @var array<string, true> */
    private array $names = [];

    public function handle(): int
    {
        foreach ($this->option('kamus') as $file) {
            if (! is_file($file)) {
                $this->error("Kamus tidak ditemukan: {$file}");

                return self::FAILURE;
            }
            foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $word) {
                $this->dictionary[mb_strtolower(trim($word))] = true;
            }
        }

        $books = DB::table('books')->get(['id', 'title', 'abstract', 'series_title']);
        $theses = DB::table('theses')->get(['id', 'title', 'abstract']);
        $acronyms = TitleText::learnAcronyms($books->pluck('title')->concat($theses->pluck('title')), $this->dictionary);

        if ($this->dictionary !== []) {
            $this->countWords($books, $theses);
        }

        $report = [];
        $typos = [];
        $updates = ['books' => [], 'theses' => []];
        foreach (['books' => $books, 'theses' => $theses] as $table => $rows) {
            foreach ($rows as $row) {
                $title = $this->dictionary !== [] ? $this->fixTypos($row->title, $typos) : $row->title;
                // Titles were cut at 255 characters on import; added spaces must not overflow.
                $title = rtrim(mb_substr(TitleText::title($title, $acronyms), 0, 255));
                if ($title !== $row->title) {
                    $updates[$table][$row->id] = $title;
                    $report[] = [$table === 'books' ? 'buku' : 'skripsi', $row->title, $title];
                }
            }
        }

        $path = 'laporan/rapikan-judul-'.now()->format('Ymd-His').'.csv';
        $csv = "\xEF\xBB\xBFjenis;sebelum;sesudah\n".implode("\n", array_map(
            fn ($r) => implode(';', array_map(fn ($v) => '"'.str_replace('"', '""', $v).'"', $r)), $report));
        $csv .= "\n\n\"salah ketik\";\"diperbaiki menjadi\";\"jumlah\"\n".implode("\n", array_map(
            fn ($w, $f) => "\"{$w}\";\"{$f[0]}\";{$f[1]}", array_keys($typos), $typos));
        Storage::disk('local')->put($path, $csv);

        $this->table(['Perubahan', 'Jumlah'], [
            ['Judul buku diubah', number_format(count($updates['books']), 0, ',', '.')],
            ['Judul skripsi/tesis/disertasi diubah', number_format(count($updates['theses']), 0, ',', '.')],
            ['Kata salah ketik diperbaiki', number_format(count($typos), 0, ',', '.')],
        ]);
        $this->line('Laporan: '.Storage::disk('local')->path($path));

        if ($this->option('coba')) {
            return self::SUCCESS;
        }

        DB::transaction(function () use ($updates) {
            foreach ($updates as $table => $titles) {
                foreach ($titles as $id => $title) {
                    DB::table($table)->where('id', $id)->update(['title' => $title]);
                }
            }
        });

        $this->info('Selesai.');

        return self::SUCCESS;
    }

    private function countWords($books, $theses): void
    {
        $count = function (?string $text) {
            preg_match_all('/\p{L}+/u', mb_strtolower((string) $text), $m);
            foreach ($m[0] as $word) {
                $this->frequency[$word] = ($this->frequency[$word] ?? 0) + 1;
            }
        };
        foreach ($books as $b) {
            $count($b->title);
            $count($b->abstract);
            $count($b->series_title);
        }

        // Names used elsewhere in the catalogue are never typos.
        foreach ([DB::table('authors')->pluck('name'), DB::table('publishers')->pluck('name'), DB::table('subjects')->pluck('name'),
            DB::table('books')->whereNotNull('publish_place')->distinct()->pluck('publish_place')] as $names) {
            foreach ($names as $name) {
                preg_match_all('/\p{L}+/u', mb_strtolower($name), $m);
                foreach ($m[0] as $word) {
                    $this->names[$word] = true;
                }
            }
        }
    }

    /**
     * @param  array<string, array{0: string, 1: int}>  $typos  found so far, for the report
     */
    private function fixTypos(string $title, array &$typos): string
    {
        return preg_replace_callback('/\p{L}+/u', function ($m) use (&$typos, $title) {
            [$word, $offset] = $m[0];
            $lower = mb_strtolower($word);
            $place = (bool) preg_match(self::PLACE, substr($title, 0, $offset));

            // The last word of a title cut at 255 characters is cut too ("Perseb[aran]").
            if (mb_strlen($title) >= 250 && trim(substr($title, $offset + strlen($word))) === '') {
                return $word;
            }
            // After a place word only very common words count as corrections ("Kotamadya Daeraha").
            $correction = $this->correction($lower);
            if ($place && $correction !== null && ($this->frequency[$correction] ?? 0) < 1000) {
                $correction = null;
            }
            $fix = self::FIXED[$lower] ?? $correction ?? $this->split($lower);

            if ($fix === null) {
                return $word;
            }

            $typos[$lower] = [$fix, ($typos[$lower][1] ?? 0) + 1];

            // Keep the case pattern of the original word.
            return match (true) {
                $word === mb_strtoupper($word) => mb_strtoupper($fix),
                $word === mb_strtolower($word) => $fix,
                default => mb_strtoupper(mb_substr($fix, 0, 1)).mb_substr($fix, 1),
            };
        }, $title, flags: PREG_OFFSET_CAPTURE);
    }

    private function correction(string $word): ?string
    {
        if (mb_strlen($word) < 6 || ! preg_match('/^[a-z]+$/', $word) || $this->isWord($word)) {
            return null;
        }

        $best = null;
        $bestCount = 0;
        $bestScore = 0;
        $tie = false;
        foreach ($this->edits($word) as $candidate => $weight) {
            $count = $this->frequency[$candidate] ?? 0;
            if ($count < 8 || ! isset($this->dictionary[$candidate])) {
                continue;
            }
            $score = $count * $weight;
            if ($score > $bestScore) {
                [$best, $bestCount, $bestScore, $tie] = [$candidate, $count, $score, false];
            } elseif ($score === $bestScore) {
                $tie = true;
            }
        }

        $seen = $this->frequency[$word] ?? 0;

        // A typo is rare; one repeated across a series of titles still loses to a far more common word.
        return ! $tie && $best !== null && ($seen <= 3 || $bestCount >= 20 * $seen) ? $best : null;
    }

    /** In a word list, a name in the catalogue, or a known word with affixes. */
    private function isWord(string $word): bool
    {
        return isset($this->dictionary[$word]) || isset($this->names[$word]) || in_array($word, self::KNOWN, true)
            || $this->isInflected($word);
    }

    /** Two common words typed together: "pertanahandengan" -> "pertanahan dengan". */
    private function split(string $word): ?string
    {
        if (mb_strlen($word) < 10 || ! preg_match('/^[a-z]+$/', $word) || ($this->frequency[$word] ?? 0) > 3 || $this->isWord($word)) {
            return null;
        }

        $function = ['di', 'ke', 'dan', 'yang', 'dari', 'untuk', 'pada', 'dalam', 'atau', 'dengan', 'bagi', 'oleh', 'of', 'and', 'the', 'in'];
        $best = null;
        $bestScore = 0;
        for ($i = 4; $i <= strlen($word) - 2; $i++) {
            [$left, $right] = [substr($word, 0, $i), substr($word, $i)];
            $known = fn ($w) => (isset($this->dictionary[$w]) || isset($this->names[$w])) && ($this->frequency[$w] ?? 0) >= 20
                && ! in_array($w, self::AFFIXES, true);
            if (in_array($right, self::PLACE_PARTS, true)) {
                continue;
            }
            if ($left === $right && $known($left)) {
                return "{$left}-{$right}";
            }
            if ($known($left) && $known($right) && (strlen($right) >= 4 || in_array($right, $function, true))) {
                $score = min($this->frequency[$left], $this->frequency[$right]);
                if ($score > $bestScore) {
                    [$best, $bestScore] = ["{$left} {$right}", $score];
                }
            }
        }

        return $best;
    }

    /** "amankah" = "aman" + "kah", "berperspektif" = "ber" + "perspektif", "pascabencana". */
    private function isInflected(string $word): bool
    {
        foreach (self::PREFIXES as $prefix) {
            $stem = substr($word, strlen($prefix));
            if (str_starts_with($word, $prefix) && strlen($stem) >= 4 && (isset($this->dictionary[$stem]) || isset($this->names[$stem]))) {
                return true;
            }
        }

        foreach (['kah', 'lah', 'nya', 'pun', 'ku', 'mu', 'annya', 'kannya', 'inya', 'kan', 'an', 's', 'es', 'ed', 'ing', 'ly'] as $suffix) {
            $stem = substr($word, 0, -strlen($suffix));
            if (str_ends_with($word, $suffix) && strlen($stem) >= 4 && (isset($this->dictionary[$stem]) || isset($this->names[$stem]))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Every string one edit away, weighted by how often people make that
     * slip: a letter left out (3), two letters swapped (3), an extra letter
     * (2), a wrong letter (1).
     *
     * @return array<string, int>
     */
    private function edits(string $word): array
    {
        $letters = range('a', 'z');
        $out = [];
        $add = function (string $candidate, int $weight) use (&$out) {
            $out[$candidate] = max($out[$candidate] ?? 0, $weight);
        };
        for ($i = 0; $i <= strlen($word); $i++) {
            [$left, $right] = [substr($word, 0, $i), substr($word, $i)];
            if ($right !== '') {
                $add($left.substr($right, 1), 2);
            }
            if (strlen($right) > 1) {
                $add($left.$right[1].$right[0].substr($right, 2), 3);
            }
            foreach ($letters as $c) {
                if ($right !== '') {
                    $add($left.$c.substr($right, 1), 1);
                }
                $add($left.$c.$right, 3);
            }
        }
        unset($out[$word]);

        return $out;
    }
}
