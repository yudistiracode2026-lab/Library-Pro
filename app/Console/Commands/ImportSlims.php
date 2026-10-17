<?php

namespace App\Console\Commands;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Member;
use App\Models\Visit;
use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * One-off migration from the old SLiMS database (connection "slims") into an
 * empty Library-Pro database: authors, publishers, titles, copies, members,
 * loan history, visits, and the thesis repository (metadata only — the PDFs
 * were not in the backup). Fines and staff accounts are not carried over.
 *
 * Book and copy ids keep SLiMS biblio_id / item_id so records can be traced
 * back to the old system.
 */
class ImportSlims extends Command
{
    protected $signature = 'import:slims {--force : Jalankan tanpa konfirmasi}';

    protected $description = 'Impor katalog, anggota, sirkulasi, dan kunjungan dari database SLiMS lama';

    private const CHUNK = 1000;

    /** SLiMS GMD name (lowercase) => Library-Pro collection type. */
    private const COLLECTIONS = [
        'skripsi' => 'Skripsi', 'tesis' => 'Skripsi', 'disertasi' => 'Skripsi',
        'laporan ta prodiksus' => 'Tugas akhir & laporan PKL', 'laporan penelitian' => 'Tugas akhir & laporan PKL',
        'karya tulis' => 'Tugas akhir & laporan PKL', 'paper' => 'Tugas akhir & laporan PKL',
        'prosiding' => 'Prosiding',
        'jurnal' => 'Jurnal & majalah', 'majalah' => 'Jurnal & majalah', 'buletin' => 'Jurnal & majalah', 'kliping' => 'Jurnal & majalah',
        'peta' => 'Peta & atlas', 'atlas' => 'Peta & atlas',
        'kamus' => 'Referensi', 'ensiklopedi' => 'Referensi', 'bibliografi' => 'Referensi', 'handbook' => 'Referensi', 'pedoman' => 'Referensi',
    ];

    /** SLiMS GMD name (lowercase) => thesis repository type. */
    private const THESES = ['skripsi' => 'Skripsi', 'tesis' => 'Tesis', 'disertasi' => 'Disertasi'];

    /** SLiMS member_type_id => [type, study programme]. */
    private const MEMBER_TYPES = [
        1 => ['Mahasiswa', 'D1 Pengukuran dan Pemetaan Kadastral'],
        2 => ['Mahasiswa', 'D4 Pertanahan'],
        3 => ['Mahasiswa', 'D4 Pertanahan'],
        4 => ['Dosen', 'Dosen'],
        5 => ['Tendik', 'Tendik'],
    ];

    private Connection $slims;

    private string $now;

    public function handle(): int
    {
        $this->slims = DB::connection('slims');
        $this->now = now()->toDateTimeString();

        try {
            $this->slims->getPdo();
        } catch (\Throwable $e) {
            $this->error('Database SLiMS tidak bisa dibuka: '.$e->getMessage());

            return self::FAILURE;
        }

        if (Book::exists() || Member::exists()) {
            $this->error('Database Library-Pro sudah berisi buku atau anggota. Kosongkan dulu: php artisan migrate:fresh lalu db:seed --class=ProductionSeeder.');

            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm('Impor data dari database "'.$this->slims->getDatabaseName().'"?', true)) {
            return self::FAILURE;
        }

        DB::connection()->disableQueryLog();
        $this->slims->disableQueryLog();

        DB::transaction(function () {
            [$authors, $bookAuthor] = $this->authors();
            $publishers = $this->publishers();
            $gmd = $this->slims->table('mst_gmd')->pluck('gmd_name', 'gmd_id')->map(fn ($n) => Str::lower(trim($n)));
            $loanedCodes = $this->slims->table('loan')->where('is_lent', 1)->where('is_return', 0)->pluck('item_code')->map(fn ($c) => Str::lower(trim((string) $c)))->flip();

            $this->books($gmd, $authors, $bookAuthor, $publishers);
            $copies = $this->copies($loanedCodes);
            $this->theses($gmd, $authors, $bookAuthor);
            $members = $this->members();
            $this->loans($copies, $members);
            $this->visits($members);
        });

        $this->newLine();
        $this->info('Impor selesai.');

        return self::SUCCESS;
    }

    /**
     * @return array{0: Collection<int, int>, 1: Collection<int, int>} SLiMS author id => new id, biblio id => main SLiMS author id
     */
    private function authors(): array
    {
        $map = collect();
        $byKey = [];
        $rows = [];

        foreach ($this->slims->table('mst_author')->orderBy('author_id')->get() as $a) {
            $name = $this->clean($a->author_name, 255);

            if ($name === '') {
                continue;
            }

            $key = $this->key($name);

            if (! isset($byKey[$key])) {
                $byKey[$key] = count($rows) + 1;
                $rows[] = ['id' => $byKey[$key], 'name' => $name, 'type' => $a->authority_type === 'p' ? 'Perorangan' : 'Lembaga', 'created_at' => $this->now, 'updated_at' => $this->now];
            }

            $map[$a->author_id] = $byKey[$key];
        }

        $anon = count($rows) + 1;
        $rows[] = ['id' => $anon, 'name' => 'Anonim', 'type' => 'Perorangan', 'created_at' => $this->now, 'updated_at' => $this->now];
        $map[0] = $anon;

        $this->insert('authors', $rows, 'Pengarang');

        // The main author: lowest level, then lowest author id.
        $bookAuthor = $this->slims->table('biblio_author')
            ->orderBy('biblio_id')->orderByRaw('level = 0, level')->orderBy('author_id')
            ->get(['biblio_id', 'author_id'])
            ->filter(fn ($r) => isset($map[$r->author_id]))
            ->unique('biblio_id')
            ->pluck('author_id', 'biblio_id');

        return [$map, $bookAuthor];
    }

    /**
     * @return Collection<int, int> SLiMS publisher id => new id (0 = "Tanpa penerbit")
     */
    private function publishers(): Collection
    {
        $map = collect();
        $byKey = [];
        $rows = [];

        foreach ($this->slims->table('mst_publisher')->orderBy('publisher_id')->get() as $p) {
            $name = $this->clean($p->publisher_name, 255);

            if ($name === '' || $name === '-') {
                continue;
            }

            $key = $this->key($name);

            if (! isset($byKey[$key])) {
                $byKey[$key] = count($rows) + 1;
                $rows[] = ['id' => $byKey[$key], 'name' => $name, 'status' => 'Aktif', 'created_at' => $this->now, 'updated_at' => $this->now];
            }

            $map[$p->publisher_id] = $byKey[$key];
        }

        $none = count($rows) + 1;
        $rows[] = ['id' => $none, 'name' => 'Tanpa penerbit', 'status' => 'Aktif', 'created_at' => $this->now, 'updated_at' => $this->now];
        $map[0] = $none;

        $this->insert('publishers', $rows, 'Penerbit');

        return $map;
    }

    /**
     * @param  Collection<int, string>  $gmd
     * @param  Collection<int, int>  $authors
     * @param  Collection<int, int>  $bookAuthor
     * @param  Collection<int, int>  $publishers
     */
    private function books(Collection $gmd, Collection $authors, Collection $bookAuthor, Collection $publishers): void
    {
        // Titles whose copies are mostly in the reference collection.
        $reference = $this->slims->table('item')
            ->selectRaw('biblio_id, SUM(coll_type_id = 1) * 2 > COUNT(*) AS ref')
            ->groupBy('biblio_id')->pluck('ref', 'biblio_id');

        $rows = [];

        foreach ($this->slims->table('biblio')->orderBy('biblio_id')->cursor() as $b) {
            $collection = self::COLLECTIONS[$gmd[$b->gmd_id] ?? ''] ?? (($reference[$b->biblio_id] ?? 0) ? 'Referensi' : 'Buku teks');

            $rows[] = [
                'id' => $b->biblio_id,
                'type' => Book::PRINTED,
                'title' => $this->clean($b->title, 255) ?: '(tanpa judul)',
                'author_id' => $authors[$bookAuthor[$b->biblio_id] ?? 0],
                'publisher_id' => $publishers[$b->publisher_id] ?? $publishers[0],
                'year' => $this->year($b->publish_year),
                'isbn' => $this->clean($b->isbn_issn, 20) ?: null,
                'ddc_class' => $this->ddc($b->classification, $b->call_number, $collection),
                'collection_type' => $collection,
                'call_number' => $this->clean($b->call_number, 40) ?: null,
                'created_at' => $this->date($b->input_date) ?? $this->now,
                'updated_at' => $this->date($b->last_update) ?? $this->now,
            ];
        }

        $this->insert('books', $rows, 'Judul');
    }

    /**
     * @param  Collection<string, int>  $loanedCodes
     * @return Collection<string, int> item code (lowercase) => copy id
     */
    private function copies(Collection $loanedCodes): Collection
    {
        $rows = [];
        $seen = [];

        foreach ($this->slims->table('item')->whereIn('biblio_id', $this->slims->table('biblio')->select('biblio_id'))->orderBy('item_id')->cursor() as $i) {
            $code = $this->clean($i->item_code, 20);
            $key = Str::lower($code);

            if ($code === '' || isset($seen[$key])) {
                continue;
            }

            $seen[$key] = $i->item_id;
            $rows[] = [
                'id' => $i->item_id,
                'book_id' => $i->biblio_id,
                'code' => $code,
                'status' => isset($loanedCodes[$key]) ? BookCopy::LOANED : ($i->item_status_id === 'R' ? BookCopy::REPAIR : BookCopy::AVAILABLE),
                'created_at' => $this->date($i->input_date) ?? $this->now,
                'updated_at' => $this->date($i->last_update) ?? $this->now,
            ];
        }

        $this->insert('book_copies', $rows, 'Eksemplar');

        return collect($seen);
    }

    /**
     * @param  Collection<int, string>  $gmd
     * @param  Collection<int, int>  $authors
     * @param  Collection<int, int>  $bookAuthor
     */
    private function theses(Collection $gmd, Collection $authors, Collection $bookAuthor): void
    {
        $ids = $gmd->filter(fn ($n) => isset(self::THESES[$n]))->keys();
        $names = DB::table('authors')->pluck('name', 'id');
        $topics = $this->slims->table('biblio_topic')
            ->join('mst_topic', 'mst_topic.topic_id', '=', 'biblio_topic.topic_id')
            ->whereIn('biblio_topic.biblio_id', $this->slims->table('biblio')->whereIn('gmd_id', $ids)->select('biblio_id'))
            ->orderBy('biblio_topic.level')
            ->get(['biblio_topic.biblio_id', 'mst_topic.topic'])
            ->groupBy('biblio_id');

        $rows = [];

        foreach ($this->slims->table('biblio')->whereIn('gmd_id', $ids)->orderBy('biblio_id')->cursor() as $b) {
            $keywords = $topics->get($b->biblio_id)?->map(fn ($t) => $this->clean($t->topic, 60))->filter()->unique()->implode('; ');

            $rows[] = [
                'type' => self::THESES[$gmd[$b->gmd_id]],
                'title' => $this->clean($b->title, 255) ?: '(tanpa judul)',
                'author' => $names[$authors[$bookAuthor[$b->biblio_id] ?? 0]],
                'year' => $this->year($b->publish_year) ?? (int) substr($this->date($b->input_date) ?? $this->now, 0, 4),
                'keywords' => Str::limit($keywords ?? '', 252, '...') ?: null,
                'abstract' => $this->clean($b->notes, 65000) ?: null,
                'call_number' => $this->clean($b->call_number, 40) ?: null,
                'created_at' => $this->date($b->input_date) ?? $this->now,
                'updated_at' => $this->date($b->last_update) ?? $this->now,
            ];
        }

        // Abstracts are long; small batches stay under max_allowed_packet (1 MB on XAMPP).
        $this->insert('theses', $rows, 'Skripsi/tesis/disertasi', chunk: 50);
    }

    /**
     * @return Collection<string, int> member number (lowercase) => new id
     */
    private function members(): Collection
    {
        $today = today()->toDateString();
        $map = [];
        $rows = [];
        $members = $this->slims->table('member')->orderBy('member_id')->get();

        // A shared e-mail goes to the member whose card expires last.
        $emailOwner = $members
            ->map(fn ($m) => ['email' => Str::lower(trim((string) $m->member_email)), 'id' => $m->member_id, 'expires' => (string) $m->expire_date])
            ->filter(fn ($m) => filter_var($m['email'], FILTER_VALIDATE_EMAIL))
            ->sortByDesc('expires')
            ->unique('email')
            ->pluck('email', 'id');

        foreach ($members as $m) {
            $number = $this->clean($m->member_id, 30);
            $key = Str::lower($number);

            if ($number === '' || isset($map[$key])) {
                continue;
            }

            $email = $emailOwner[$m->member_id] ?? null;

            [$type, $programme] = self::MEMBER_TYPES[$m->member_type_id] ?? ['Umum', 'Umum'];
            $expires = $this->date($m->expire_date);

            $map[$key] = count($rows) + 1;
            $rows[] = [
                'id' => $map[$key],
                'member_number' => $number,
                'name' => $this->clean($m->member_name, 255) ?: $number,
                'type' => $type,
                'study_program' => $programme,
                'email' => $email,
                'status' => $expires !== null && $expires >= $today ? 'Aktif' : 'Nonaktif',
                'created_at' => $this->date($m->register_date) ?? $this->date($m->input_date) ?? $this->now,
                'updated_at' => $this->date($m->last_update) ?? $this->now,
            ];
        }

        $this->insert('members', $rows, 'Anggota');

        return collect($map);
    }

    /**
     * @param  Collection<string, int>  $copies
     * @param  Collection<string, int>  $members
     */
    private function loans(Collection $copies, Collection $members): void
    {
        $rows = [];
        $skipped = 0;

        foreach ($this->slims->table('loan')->where('is_lent', 1)->orderBy('loan_id')->cursor() as $l) {
            $copy = $copies[Str::lower(trim((string) $l->item_code))] ?? null;
            $member = $members[Str::lower(trim((string) $l->member_id))] ?? null;
            $loaned = $this->date($l->loan_date);

            if (! $copy || ! $member || ! $loaned) {
                $skipped++;

                continue;
            }

            $due = $this->date($l->due_date) ?? $loaned;
            $returned = $l->is_return ? ($this->date($l->return_date) ?? $due) : null;

            $rows[] = [
                'book_copy_id' => $copy,
                'member_id' => $member,
                'loaned_at' => $loaned.' 00:00:00',
                'due_at' => $due,
                'extensions' => min(255, (int) $l->renewed),
                'returned_at' => $returned ? $returned.' 00:00:00' : null,
                'created_at' => $loaned.' 00:00:00',
                'updated_at' => ($returned ?? $loaned).' 00:00:00',
            ];
        }

        $this->insert('loans', $rows, 'Peminjaman', $skipped ? "{$skipped} dilewati: eksemplar/anggota tidak ditemukan" : null);
    }

    /**
     * @param  Collection<string, int>  $members
     */
    private function visits(Collection $members): void
    {
        $rows = [];

        foreach ($this->slims->table('vs')->orderBy('id')->cursor() as $v) {
            $at = $this->dateTime($v->checkin_date);

            if (! $at) {
                continue;
            }

            $member = $members[Str::lower(trim((string) $v->member_id))] ?? null;

            $rows[] = [
                'member_id' => $member,
                'guest_name' => $member ? null : ($this->clean($v->member_id, 255) ?: 'Tamu'),
                'purpose' => 'Membaca',
                'method' => $member ? Visit::METHOD_MANUAL : Visit::METHOD_GUEST,
                'checked_in_at' => $at,
                'created_at' => $at,
                'updated_at' => $at,
            ];
        }

        $this->insert('visits', $rows, 'Kunjungan');
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function insert(string $table, array $rows, string $label, ?string $note = null, int $chunk = self::CHUNK): void
    {
        foreach (array_chunk($rows, $chunk) as $chunk) {
            DB::table($table)->insert($chunk);
        }

        $this->line(sprintf('  %-26s %s%s', $label, number_format(count($rows), 0, ',', '.'), $note ? "  ({$note})" : ''));
    }

    /** Collapses whitespace (SLiMS titles carry \n and \t) and trims to length. */
    private function clean(?string $value, int $max): string
    {
        $value = trim(preg_replace('/\s+/u', ' ', (string) $value));

        return mb_substr($value, 0, $max);
    }

    /** Key matching the case- and accent-insensitive unique index. */
    private function key(string $name): string
    {
        return Str::lower(Str::ascii($name));
    }

    private function date(?string $value): ?string
    {
        return $value && ! str_starts_with($value, '0000') ? substr($value, 0, 10) : null;
    }

    private function dateTime(?string $value): ?string
    {
        return $value && ! str_starts_with($value, '0000') ? substr($value, 0, 19) : null;
    }

    private function year(mixed $value): ?int
    {
        $year = (int) $value;

        return $year >= 1800 && $year <= (int) date('Y') ? $year : null;
    }

    /**
     * Main DDC class from the classification, else from the call number
     * ("2X4" is the Indonesian extension for Islam, i.e. class 200).
     */
    private function ddc(?string $classification, ?string $callNumber, string $collection): string
    {
        foreach ([$classification, $callNumber] as $value) {
            if (preg_match('/(?<![0-9])([0-9])[0-9xX]{2}(?![0-9])/', (string) $value, $m)) {
                return $m[1].'00';
            }
        }

        return match ($collection) {
            'Skripsi', 'Tugas akhir & laporan PKL' => '300',
            'Peta & atlas' => '900',
            default => '000',
        };
    }
}
