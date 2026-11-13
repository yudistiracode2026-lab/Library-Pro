<?php

namespace App\Services;

use App\Models\Member;
use App\Support\AuthorName;
use App\Support\MasterOptions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use OpenSpout\Reader\CSV\Options as CsvOptions;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

/**
 * Adds members from an Excel or CSV file, such as a new intake or the staff
 * list, and gives each a portal account with the NIM/NIP as the password.
 * Numbers already registered are left alone, so the same file can be
 * uploaded again after fixing the rows it reported.
 */
class MemberImport
{
    public const MAX_ROWS = 5000;

    /** Header words, lower-cased, for each field. */
    private const HEADERS = [
        'member_number' => ['nim/nip', 'nim / nip', 'nim', 'nip', 'nit', 'nomor anggota', 'no anggota', 'nomor induk', 'nomor'],
        'name' => ['nama lengkap', 'nama'],
        'type' => ['jenis anggota', 'jenis', 'tipe', 'kategori'],
        'study_program' => ['program studi', 'prodi', 'jurusan'],
        'email' => ['email', 'e-mail', 'surel'],
        'status' => ['status'],
    ];

    /** Other words people use for each member type. */
    private const TYPE_WORDS = [
        'mahasiswa' => 'Mahasiswa', 'taruna' => 'Mahasiswa', 'taruni' => 'Mahasiswa',
        'dosen' => 'Dosen',
        'tendik' => 'Tendik', 'tenaga kependidikan' => 'Tendik', 'pustakawan' => 'Tendik', 'pegawai' => 'Tendik', 'staf' => 'Tendik',
        'umum' => 'Umum',
    ];

    public function __construct(private MemberAccounts $accounts) {}

    /**
     * @param  string  $defaultType  for rows with no type
     * @param  string  $defaultProgram  for students with no study programme
     * @return array{added: int, existing: int, problems: list<string>}
     */
    public function run(string $path, string $extension, string $defaultType, string $defaultProgram): array
    {
        $rows = $this->rows($path, $extension);
        $columns = $this->columns(array_shift($rows) ?? []);

        if (! isset($columns['member_number'], $columns['name'])) {
            return ['added' => 0, 'existing' => 0, 'problems' => ['Baris pertama harus berisi judul kolom, minimal "NIM/NIP" dan "Nama". Unduh templatnya untuk contoh.']];
        }
        if (count($rows) > self::MAX_ROWS) {
            return ['added' => 0, 'existing' => 0, 'problems' => ['Paling banyak '.number_format(self::MAX_ROWS, 0, ',', '.').' baris sekali unggah. Bagi filenya menjadi beberapa bagian.']];
        }

        $problems = [];
        $new = [];
        $seen = [];
        foreach ($rows as $i => $cells) {
            $line = $i + 2;
            $get = fn (string $field) => isset($columns[$field]) ? ($cells[$columns[$field]] ?? null) : null;

            if (collect($cells)->every(fn ($c) => trim((string) $c) === '')) {
                continue;
            }

            [$number, $problem] = $this->number($get('member_number'));
            $name = trim((string) $get('name'));
            if ($problem || $number === '' || $name === '') {
                $problems[] = "Baris {$line}: ".($problem ?? ($number === '' ? 'NIM/NIP kosong.' : 'nama kosong.'));

                continue;
            }
            if (isset($seen[$number])) {
                $problems[] = "Baris {$line}: NIM/NIP {$number} sudah ada di baris {$seen[$number]}.";

                continue;
            }
            $seen[$number] = $line;

            $typeText = trim((string) $get('type'));
            $type = $typeText === '' ? $defaultType : (self::TYPE_WORDS[Str::lower($typeText)] ?? null);
            if ($type === null) {
                $problems[] = "Baris {$line}: jenis \"{$typeText}\" tidak dikenal. Pakai Mahasiswa, Dosen, Tendik, atau Umum.";

                continue;
            }

            $program = $type;
            if ($type === 'Mahasiswa') {
                $programText = trim((string) $get('study_program'));
                $program = $programText === '' ? $defaultProgram : $this->program($programText);
                if ($program === null) {
                    $problems[] = "Baris {$line}: program studi \"{$programText}\" tidak dikenal. Pakai ".implode(', ', MasterOptions::STUDENT_PROGRAMS).'.';

                    continue;
                }
            }

            $status = collect(MasterOptions::MEMBER_STATUSES)->first(fn ($s) => Str::lower($s) === Str::lower(trim((string) $get('status')))) ?? 'Aktif';
            $email = Str::lower(trim((string) $get('email')));
            if ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $problems[] = "Baris {$line}: email \"{$email}\" tidak sah, jadi dikosongkan. Anggota tetap ditambahkan.";
                $email = '';
            }

            $new[$number] = [
                'member_number' => $number,
                'name' => AuthorName::person($name),
                'type' => $type,
                'study_program' => $program,
                'email' => $email === '' ? null : $email,
                'status' => $status,
            ];
        }

        $existing = Member::whereIn('member_number', array_map('strval', array_keys($new)))->pluck('member_number')->all();
        $new = array_diff_key($new, array_flip($existing));

        // An address another member already has is left out rather than refused.
        $takenEmails = Member::whereIn('email', array_filter(array_column($new, 'email')))->pluck('email')->flip();
        $usedEmails = [];
        foreach ($new as $number => $row) {
            if ($row['email'] && ($takenEmails->has($row['email']) || isset($usedEmails[$row['email']]))) {
                $problems[] = "NIM/NIP {$number}: email {$row['email']} sudah dipakai anggota lain, jadi dikosongkan.";
                $new[$number]['email'] = null;
            }
            $usedEmails[$row['email'] ?? ''] = true;
        }

        DB::transaction(function () use ($new) {
            $now = now();
            foreach (array_chunk(array_values($new), 500) as $chunk) {
                Member::insert(array_map(fn ($row) => $row + ['created_at' => $now, 'updated_at' => $now], $chunk));
            }
        });
        $this->accounts->activateAll();

        return ['added' => count($new), 'existing' => count($existing), 'problems' => $problems];
    }

    /**
     * @return list<list<mixed>>
     */
    private function rows(string $path, string $extension): array
    {
        if ($extension === 'xlsx') {
            $reader = new XlsxReader;
        } else {
            $options = new CsvOptions;
            // Excel in Indonesian saves CSV with semicolons.
            $first = (string) fgets(fopen($path, 'r'));
            $options->FIELD_DELIMITER = substr_count($first, ';') > substr_count($first, ',') ? ';' : ',';
            $reader = new CsvReader($options);
        }

        $rows = [];
        $reader->open($path);
        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $rows[] = $row->toArray();
                if (count($rows) > self::MAX_ROWS + 1) {
                    break;
                }
            }
            break;
        }
        $reader->close();

        return $rows;
    }

    /**
     * Which column holds each field, from the header row.
     *
     * @param  list<mixed>  $header
     * @return array<string, int>
     */
    private function columns(array $header): array
    {
        $columns = [];
        foreach ($header as $index => $title) {
            $title = Str::of((string) $title)->lower()->squish()->replace(['.', ':'], '')->toString();
            foreach (self::HEADERS as $field => $words) {
                if (! isset($columns[$field]) && in_array($title, $words, true)) {
                    $columns[$field] = $index;
                }
            }
        }

        return $columns;
    }

    /**
     * The NIM/NIP as text. Excel keeps a long number typed into a number
     * cell only to 15 digits, so an 18-digit NIP there is already wrong.
     *
     * @return array{0: string, 1: string|null}
     */
    private function number(mixed $value): array
    {
        // A number cell, whichever way the reader returns it.
        if (is_int($value) || is_float($value)) {
            if ($value >= 1e15 || floor($value) != $value) {
                return ['', 'NIM/NIP tersimpan sebagai angka di Excel sehingga digitnya berubah. Ubah format kolom menjadi Teks, ketik ulang, lalu unggah lagi.'];
            }
            $value = (int) $value;
        }
        $number = preg_replace('/\s+/', '', ltrim(trim((string) $value), "'"));

        if (mb_strlen($number) > 30) {
            return ['', 'NIM/NIP lebih dari 30 karakter.'];
        }

        return [$number, null];
    }

    private function program(string $text): ?string
    {
        $text = Str::lower($text);

        return match (true) {
            str_contains($text, 'kmpt') => 'Sarjana Terapan KMPT',
            str_contains($text, 'mprp') => 'Sarjana Terapan MPRP',
            str_contains($text, 'spip') => 'Sarjana Terapan SPIP',
            in_array($text, ['d4', 'd-iv', 'd iv', 'div'], true), str_contains($text, 'd4 pertanahan'), str_contains($text, 'diploma iv') => 'D4 Pertanahan',
            in_array($text, ['d1', 'd-i', 'd i'], true), str_contains($text, 'd1 pengukuran'), str_contains($text, 'diploma i '), str_contains($text, 'pengukuran') => 'D1 Pengukuran dan Pemetaan Kadastral',
            default => collect(MasterOptions::STUDENT_PROGRAMS)->first(fn ($p) => Str::lower($p) === $text),
        };
    }
}
