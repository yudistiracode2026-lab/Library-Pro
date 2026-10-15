<?php

namespace App\Services;

use App\Models\Book;
use App\Models\ClearanceRequest;
use App\Models\Loan;
use App\Models\OpnameCheck;
use App\Models\OpnameSession;
use App\Models\Rack;
use App\Models\Visit;
use App\Support\MasterOptions;
use Illuminate\Support\Carbon;

/**
 * The staff reports. Each returns a title, column headers, rows, and a
 * few summary figures, used for the on-screen preview, CSV, and PDF.
 */
class Reports
{
    public const REPORTS = [
        'kunjungan' => ['footprints', 'Rekap kunjungan', 'Jumlah pengunjung per hari dan keperluan.'],
        'sirkulasi' => ['repeat', 'Statistik sirkulasi', 'Peminjaman, pengembalian, keterlambatan, dan denda per klasifikasi.'],
        'populer' => ['trending-up', 'Buku paling sering dipinjam', 'Peringkat judul terpopuler.'],
        'opname' => ['clipboard-check', 'Hasil stock opname', 'Eksemplar ditemukan, rusak, dan hilang per rak.'],
        'bebas' => ['file-check-2', 'Rekap bebas pustaka', 'Surat bebas pustaka yang terbit.'],
    ];

    public const PERIODS = [
        'bulan-ini' => 'Bulan ini',
        'bulan-lalu' => 'Bulan lalu',
        'semester' => 'Semester berjalan',
        'tahun' => 'Tahun ini',
    ];

    /**
     * @return array{0: Carbon, 1: Carbon, 2: string}
     */
    public static function range(string $period): array
    {
        $now = now();

        if ($period === 'bulan-lalu') {
            $last = $now->copy()->subMonthNoOverflow();

            return [$last->copy()->startOfMonth(), $last->copy()->endOfMonth(), $last->translatedFormat('F Y')];
        }

        if ($period === 'semester') {
            return self::semester($now);
        }

        if ($period === 'tahun') {
            return [$now->copy()->startOfYear(), $now->copy()->endOfDay(), 'Tahun '.$now->year];
        }

        return [$now->copy()->startOfMonth(), $now->copy()->endOfDay(), $now->translatedFormat('F Y')];
    }

    /**
     * Odd semester runs 1 August – 31 January, even semester 1 February – 31 July.
     *
     * @return array{0: Carbon, 1: Carbon, 2: string}
     */
    private static function semester(Carbon $now): array
    {
        if ($now->month >= 2 && $now->month <= 7) {
            return [$now->copy()->setDate($now->year, 2, 1)->startOfDay(), $now->copy()->endOfDay(), 'Semester genap '.($now->year - 1).'/'.$now->year];
        }

        $startYear = $now->month === 1 ? $now->year - 1 : $now->year;

        return [$now->copy()->setDate($startYear, 8, 1)->startOfDay(), $now->copy()->endOfDay(), "Semester ganjil {$startYear}/".($startYear + 1)];
    }

    /**
     * @return array{title: string, period: string, columns: list<string>, rows: list<list<string|int|float|null>>, summary: list<array{label: string, value: string}>}
     */
    public function build(string $report, string $period): array
    {
        [$from, $to, $label] = self::range($period);

        return [
            'title' => self::REPORTS[$report][1],
            'period' => $label,
            ...match ($report) {
                'sirkulasi' => $this->circulation($from, $to),
                'populer' => $this->popular($from, $to),
                'opname' => $this->opname(),
                'bebas' => $this->clearance($from, $to),
                default => $this->visits($from, $to),
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function visits(Carbon $from, Carbon $to): array
    {
        $visits = Visit::whereBetween('checked_in_at', [$from, $to])->get();
        $byDay = $visits->groupBy(fn (Visit $v) => $v->checked_in_at->toDateString())->sortKeys();

        return [
            'columns' => ['Tanggal', 'Pengunjung', 'Anggota', 'Tamu', ...array_map(fn ($p) => $p, Visit::PURPOSES)],
            'rows' => $byDay->map(fn ($day, $date) => [
                Carbon::parse($date)->translatedFormat('D, j M Y'),
                $day->count(),
                $day->whereNotNull('member_id')->count(),
                $day->whereNull('member_id')->count(),
                ...array_map(fn ($p) => $day->where('purpose', $p)->count(), Visit::PURPOSES),
            ])->values()->all(),
            'summary' => [
                ['label' => 'Total kunjungan', 'value' => (string) $visits->count()],
                ['label' => 'Rata-rata per hari buka', 'value' => number_format($byDay->count() ? $visits->count() / $byDay->count() : 0, 1, ',', '.')],
                ['label' => 'Tamu dari luar', 'value' => (string) $visits->whereNull('member_id')->count()],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function circulation(Carbon $from, Carbon $to): array
    {
        $loans = Loan::with('copy.book')->whereBetween('loaned_at', [$from, $to])->get();
        $returns = Loan::whereBetween('returned_at', [$from, $to])->get();

        return [
            'columns' => ['Kelas DDC', 'Peminjaman', 'Judul berbeda'],
            'rows' => collect(MasterOptions::DDC_CLASSES)->map(function ($name, $class) use ($loans) {
                $own = $loans->filter(fn (Loan $l) => $l->copy->book->ddc_class === (string) $class);

                return ["{$class} {$name}", $own->count(), $own->pluck('copy.book_id')->unique()->count()];
            })->values()->all(),
            'summary' => [
                ['label' => 'Peminjaman', 'value' => (string) $loans->count()],
                ['label' => 'Pengembalian', 'value' => (string) $returns->count()],
                ['label' => 'Kembali terlambat', 'value' => (string) $returns->filter(fn (Loan $l) => $l->returned_at->startOfDay()->gt($l->due_at))->count()],
                ['label' => 'Perpanjangan', 'value' => (string) $loans->sum('extensions')],
                ['label' => 'Denda tercatat', 'value' => 'Rp '.number_format($returns->sum('fine_amount'), 0, ',', '.')],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function popular(Carbon $from, Carbon $to): array
    {
        $counts = Loan::whereBetween('loaned_at', [$from, $to])
            ->join('book_copies', 'book_copies.id', '=', 'loans.book_copy_id')
            ->selectRaw('book_copies.book_id, count(*) as total')
            ->groupBy('book_copies.book_id')
            ->orderByDesc('total')
            ->limit(20)
            ->pluck('total', 'book_id');
        $books = Book::with('author')->whereKey($counts->keys())->get()->keyBy('id');

        return [
            'columns' => ['Peringkat', 'Judul', 'Pengarang', 'No. panggil', 'Dipinjam'],
            'rows' => $counts->keys()->values()->map(fn ($id, $i) => [
                $i + 1, $books[$id]->title, $books[$id]->author->name, $books[$id]->call_number, $counts[$id],
            ])->all(),
            'summary' => [['label' => 'Judul dipinjam', 'value' => (string) $counts->count()]],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function opname(): array
    {
        $session = OpnameSession::whereNotNull('finished_at')->latest('finished_at')->first() ?? OpnameSession::active();

        if ($session === null) {
            return ['columns' => ['Rak'], 'rows' => [], 'summary' => [['label' => 'Sesi', 'value' => 'Belum ada']]];
        }

        $checks = $session->checks()->with('copy.book')->get();

        return [
            'columns' => ['Rak', 'Ada', 'Rusak', 'Hilang', 'Total dicek'],
            'rows' => Rack::orderBy('code')->get()->map(function (Rack $r) use ($checks) {
                $own = $checks->filter(fn (OpnameCheck $c) => $c->copy->book->rack_id === $r->id);

                return ["{$r->code} {$r->name}", $own->where('result', 'ada')->count(), $own->where('result', 'rusak')->count(), $own->where('result', 'hilang')->count(), $own->count()];
            })->all(),
            'summary' => [
                ['label' => 'Sesi', 'value' => $session->name.($session->finished_at ? '' : ' (berjalan)')],
                ['label' => 'Eksemplar dicek', 'value' => (string) $checks->count()],
                ['label' => 'Rusak / hilang', 'value' => $checks->where('result', 'rusak')->count().' / '.$checks->where('result', 'hilang')->count()],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function clearance(Carbon $from, Carbon $to): array
    {
        $approved = ClearanceRequest::with('member')->whereBetween('approved_at', [$from, $to])->orderBy('approved_at')->get();

        return [
            'columns' => ['No. surat', 'Tanggal', 'Nama', 'NIM', 'Judul skripsi'],
            'rows' => $approved->map(fn (ClearanceRequest $c) => [
                $c->letter_number, $c->approved_at->translatedFormat('j M Y'), $c->member->name, $c->member->member_number, $c->thesis_title,
            ])->all(),
            'summary' => [
                ['label' => 'Surat terbit', 'value' => (string) $approved->count()],
                ['label' => 'Masih menunggu', 'value' => (string) ClearanceRequest::where('status', ClearanceRequest::PENDING)->count()],
            ],
        ];
    }
}
