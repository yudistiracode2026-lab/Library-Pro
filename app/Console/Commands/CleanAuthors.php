<?php

namespace App\Console\Commands;

use App\Support\AuthorName;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Tidies the author master: removes "dkk" markers, splits entries holding
 * several people, fixes spacing and case, and merges spellings of the same
 * person into one record carrying the most complete titles. Titles keep
 * their authors in order. A CSV of every change is written for review.
 *
 * Likely typos are merged only on strong evidence (a doubled letter, a cut
 * last letter, an h/y spelling variant, or identical titles); other close
 * pairs are only listed in the report.
 */
class CleanAuthors extends Command
{
    protected $signature = 'pengarang:rapikan {--coba : Hanya buat laporan, tanpa menyimpan}';

    protected $description = 'Rapikan dan gabungkan nama pengarang ganda';

    /** @var array<string, string> union-find parents over name keys */
    private array $parent = [];

    public function handle(): int
    {
        $authors = DB::table('authors')->get(['id', 'name', 'type'])->keyBy('id');
        $uses = DB::table('book_author')->selectRaw('author_id, COUNT(*) AS n')->groupBy('author_id')->pluck('n', 'author_id');

        // 1. Every entry becomes one or more cleaned names.
        $people = [];   // author id => list of cleaned names
        $variants = []; // key => list of [name, uses, author id]
        foreach ($authors as $a) {
            $people[$a->id] = AuthorName::people($a->name, $a->type) ?: ['Anonim'];
            foreach ($people[$a->id] as $name) {
                $key = AuthorName::key($name) ?: 'id'.$a->id;
                $this->parent[$key] ??= $key;
                $variants[$key][] = [$name, (int) ($uses[$a->id] ?? 0), $a->id];
            }
        }

        // 2. Inverted "Surname, Given" that matches a name in the usual order.
        foreach (array_keys($variants) as $key) {
            foreach ($variants[$key] as [$name]) {
                if (preg_match('/^([^\s,]+), ([^,.]+)$/u', $name, $m) && isset($variants[$other = AuthorName::key("{$m[2]} {$m[1]}")])) {
                    $this->union($other, $key);
                }
            }
        }

        // 3a. A missing middle initial, when only one set of initials is in use.
        $byFull = [];
        foreach ($variants as $key => $rows) {
            foreach ($rows as [$name]) {
                if (($full = AuthorName::keyWithoutInitials($name)) !== '') {
                    $byFull[$full][$key] = AuthorName::initials($name);
                }
            }
        }
        foreach ($byFull as $keys) {
            if (count($keys) > 1 && count(array_unique(array_filter($keys, fn ($i) => $i !== ''))) <= 1) {
                $first = array_key_first($keys);
                foreach (array_keys($keys) as $key) {
                    $this->union($key, $first);
                }
            }
        }

        // 3b. Typos, on strong evidence only.
        $review = [];
        $byStart = [];
        foreach (array_keys($variants) as $key) {
            if (strlen($key) >= 8) {
                $byStart[substr($key, 0, 3)][] = $key;
            }
        }
        foreach ($byStart as $keys) {
            for ($i = 0; $i < count($keys); $i++) {
                for ($j = $i + 1; $j < count($keys); $j++) {
                    [$x, $y] = [$keys[$i], $keys[$j]];
                    if (abs(strlen($x) - strlen($y)) > 1 || levenshtein($x, $y) !== 1) {
                        continue;
                    }
                    if ($this->typo($x, $y) || $this->sameTitles($variants[$x], $variants[$y])) {
                        $this->union($x, $y);
                    } else {
                        $review[] = [$variants[$x][0][0], $variants[$y][0][0]];
                    }
                }
            }
        }

        // 4. One record per group: titles from the most complete variant,
        //    the spelling used most often.
        $groups = [];
        foreach (array_keys($variants) as $key) {
            $groups[$this->find($key)] = array_merge($groups[$this->find($key)] ?? [], $variants[$key]);
        }

        $target = [];   // group root => author id kept
        $names = [];    // author id kept => final name
        $report = [];
        foreach ($groups as $root => $rows) {
            $name = $this->canonical($rows);
            // Keep the most used record of the group, so its id stays stable.
            usort($rows, fn ($a, $b) => $b[1] <=> $a[1] ?: $a[2] <=> $b[2]);
            $keep = null;
            foreach ($rows as [, , $id]) {
                if (! in_array($id, $target, true) && count($people[$id]) === 1) {
                    $keep = $id;
                    break;
                }
            }
            $target[$root] = $keep ?? 'new:'.$root;
            $names[$target[$root]] = $name;

            foreach (array_unique(array_column($rows, 2)) as $id) {
                $from = $authors[$id]->name;
                if (count($people[$id]) > 1) {
                    $report[] = ['pecah', $from, implode(' | ', $people[$id])];
                } elseif ($id !== $keep) {
                    $report[] = ['gabung', $from, $name];
                } elseif ($from !== $name) {
                    $report[] = ['ubah', $from, $name];
                }
            }
        }
        foreach ($review as [$x, $y]) {
            $report[] = ['periksa', $x, $y];
        }
        $report = array_values(array_unique($report, SORT_REGULAR));

        $counts = array_count_values(array_column($report, 0));
        $path = 'laporan/rapikan-pengarang-'.now()->format('Ymd-His').'.csv';
        $csv = "\xEF\xBB\xBFtindakan;sebelum;sesudah\n".implode("\n", array_map(
            fn ($r) => implode(';', array_map(fn ($v) => '"'.str_replace('"', '""', $v).'"', $r)),
            $report,
        ));
        Storage::disk('local')->put($path, $csv);

        $this->table(['Tindakan', 'Jumlah'], collect(['ubah' => 'Dirapikan', 'gabung' => 'Digabung ke nama lain', 'pecah' => 'Dipecah jadi beberapa orang', 'periksa' => 'Mirip, perlu diperiksa manual'])
            ->map(fn ($label, $k) => [$label, number_format($counts[$k] ?? 0, 0, ',', '.')])->values());
        $this->line('Laporan: '.Storage::disk('local')->path($path));

        if ($this->option('coba')) {
            return self::SUCCESS;
        }

        DB::transaction(function () use ($authors, $people, $target, $names) {
            $idFor = [];
            foreach ($names as $id => $name) {
                if (str_starts_with((string) $id, 'new:')) {
                    $idFor[$id] = DB::table('authors')->insertGetId(['name' => "\u{0}".uniqid(), 'type' => 'Perorangan', 'created_at' => now(), 'updated_at' => now()]);
                } else {
                    $idFor[$id] = $id;
                }
            }
            $resolve = fn (string $name, int $fallback) => $idFor[$target[$this->find(AuthorName::key($name) ?: 'id'.$fallback)]];

            // Free the unique names first, then write the final ones.
            foreach ($idFor as $id) {
                DB::table('authors')->where('id', $id)->update(['name' => "\u{0}{$id}"]);
            }

            // Rebuild every title's author list in order.
            $links = DB::table('book_author')->orderBy('book_id')->orderBy('position')->get()->groupBy('book_id');
            DB::table('book_author')->delete();
            $rows = [];
            $main = [];
            foreach ($links as $book => $bookLinks) {
                $ids = [];
                foreach ($bookLinks as $link) {
                    foreach ($people[$link->author_id] as $name) {
                        $ids[] = $resolve($name, $link->author_id);
                    }
                }
                foreach (array_values(array_unique($ids)) as $position => $id) {
                    $rows[] = ['book_id' => $book, 'author_id' => $id, 'position' => min(255, $position)];
                }
                $main[$book] = $ids[0];
            }
            foreach (array_chunk($rows, 1000) as $chunk) {
                DB::table('book_author')->insert($chunk);
            }
            foreach (DB::table('books')->get(['id', 'author_id']) as $book) {
                $id = $main[$book->id] ?? $resolve($people[$book->author_id][0] ?? 'Anonim', $book->author_id);
                if ($id !== $book->author_id) {
                    DB::table('books')->where('id', $book->id)->update(['author_id' => $id]);
                }
            }

            $keep = array_values($idFor);
            DB::table('authors')->whereNotIn('id', $keep)->delete();
            foreach ($idFor as $id => $realId) {
                $type = AuthorName::isOrganisation($names[$id], is_int($id) ? $authors[$id]->type : null) ? 'Lembaga' : 'Perorangan';
                DB::table('authors')->where('id', $realId)->update(['name' => $names[$id], 'type' => $type, 'updated_at' => now()]);
            }
        });

        $this->info('Selesai. Pengarang sekarang: '.number_format(DB::table('authors')->count(), 0, ',', '.'));

        return self::SUCCESS;
    }

    /**
     * @param  list<array{0: string, 1: int, 2: int}>  $rows
     */
    private function canonical(array $rows): string
    {
        $parts = array_map(fn ($r) => [...AuthorName::parts($r[0]), $r[1], $r[0]], $rows);

        // Prefix titles and degrees: the most complete, then the most used.
        usort($parts, fn ($a, $b) => count($b[0]) <=> count($a[0]) ?: $b[3] <=> $a[3]);
        $prefixes = $parts[0][0];
        usort($parts, fn ($a, $b) => AuthorName::degreeScore($b[2]) <=> AuthorName::degreeScore($a[2]) ?: $b[3] <=> $a[3]);
        $degrees = $parts[0][2];

        // The spelling of the name: most used, then not all caps, then longest.
        $spellings = [];
        foreach ($parts as [, $core, , $n]) {
            $spellings[$core] = ($spellings[$core] ?? 0) + $n + 1;
        }
        uksort($spellings, fn ($a, $b) => $spellings[$b] <=> $spellings[$a]
            ?: (int) ($a === mb_strtoupper($a)) <=> (int) ($b === mb_strtoupper($b))
            ?: mb_strlen($b) <=> mb_strlen($a));

        return AuthorName::join($prefixes, array_key_first($spellings), $degrees);
    }

    /**
     * A doubled letter, a cut last letter, an h/y spelling variant, any
     * missing letter in a long name, or the old j/y spelling.
     */
    private function typo(string $x, string $y): bool
    {
        if (strlen($x) === strlen($y)) {
            for ($i = 0; $i < strlen($x) && $x[$i] === $y[$i]; $i++);

            return $i < strlen($x) && in_array($x[$i].$y[$i], ['jy', 'yj'], true);
        }
        [$short, $long] = strlen($x) < strlen($y) ? [$x, $y] : [$y, $x];

        for ($i = 0; $i < strlen($long); $i++) {
            if (substr($long, 0, $i).substr($long, $i + 1) === $short) {
                $extra = $long[$i];

                return $i === strlen($long) - 1 || strlen($long) >= 12
                    || in_array($extra, ['h', 'y'], true)
                    || ($long[$i - 1] ?? '') === $extra || ($long[$i + 1] ?? '') === $extra;
            }
        }

        return false;
    }

    /**
     * Both spellings carry the same non-empty titles: "Prof. Ir. Eko
     * Budihadjo, M.Sc" and "Prof. Ir. Eko Budihardjo, MSc".
     *
     * @param  list<array{0: string}>  $a
     * @param  list<array{0: string}>  $b
     */
    private function sameTitles(array $a, array $b): bool
    {
        $titles = fn (array $rows) => collect($rows)->map(function ($r) {
            [$prefixes, , $degrees] = AuthorName::parts($r[0]);
            $t = implode(' ', array_map(fn ($p) => AuthorName::flat($p), $prefixes)).'|'.AuthorName::flat($degrees);

            return $t === '|' ? null : $t;
        })->filter()->unique();

        return $titles($a)->intersect($titles($b))->isNotEmpty();
    }

    private function find(string $key): string
    {
        while ($this->parent[$key] !== $key) {
            $key = $this->parent[$key] = $this->parent[$this->parent[$key]];
        }

        return $key;
    }

    private function union(string $a, string $b): void
    {
        $this->parent[$this->find($a)] = $this->find($b);
    }
}
