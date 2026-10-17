<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\ClearanceRequest;
use App\Models\Loan;
use App\Models\Visit;
use App\Support\MasterOptions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $hour = now()->hour;
        $openLoans = Loan::open();
        $visitsPerDay = Visit::where('checked_in_at', '>=', today()->subDays(13))
            ->selectRaw('DATE(checked_in_at) AS day, COUNT(*) AS total')->groupBy('day')->pluck('total', 'day');
        $loansPerClass = Loan::where('loaned_at', '>=', now()->startOfMonth())
            ->join('book_copies', 'book_copies.id', '=', 'loans.book_copy_id')
            ->join('books', 'books.id', '=', 'book_copies.book_id')
            ->selectRaw('books.ddc_class, COUNT(*) AS total')->groupBy('books.ddc_class')->pluck('total', 'ddc_class');

        return Inertia::render('staf/dashboard', [
            'greeting' => match (true) {
                $hour < 11 => 'Selamat pagi',
                $hour < 15 => 'Selamat siang',
                $hour < 18 => 'Selamat sore',
                default => 'Selamat malam',
            },
            'todayLabel' => now()->translatedFormat('l, j F Y'),
            'kpis' => [
                'visitsToday' => Visit::today()->count(),
                'inside' => Visit::today()->inside()->count(),
                'openLoans' => (clone $openLoans)->count(),
                'overdue' => Loan::overdue()->count(),
                'clearancePending' => ClearanceRequest::where('status', ClearanceRequest::PENDING)->count(),
                'titles' => Book::count(),
                'copies' => BookCopy::count(),
            ],
            'collection' => $this->collection(),
            'growth' => $this->growth(),
            'visits' => collect(range(13, 0))->map(function ($ago) use ($visitsPerDay) {
                $day = today()->subDays($ago);

                return [
                    'day' => $day->day,
                    'label' => $day->translatedFormat('l, j M'),
                    'total' => (int) ($visitsPerDay[$day->toDateString()] ?? 0),
                    'weekend' => $day->isWeekend(),
                    'today' => $ago === 0,
                ];
            }),
            'loansByClass' => collect(MasterOptions::DDC_CLASSES)->map(fn ($name, $class) => [
                'class' => (string) $class,
                'name' => $name,
                'total' => (int) ($loansPerClass[$class] ?? 0),
            ])->sortByDesc('total')->take(8)->values(),
            'due' => Loan::open()->with(['copy.book', 'member'])->whereDate('due_at', '<=', today())->orderBy('due_at')->limit(5)->get()->map(fn (Loan $l) => [
                'id' => $l->id,
                'title' => $l->copy->book->title,
                'member' => $l->member->name,
                'code' => $l->copy->code,
                'daysLeft' => (int) today()->diffInDays($l->due_at, false),
            ]),
            'activity' => $this->activity(),
        ]);
    }

    /**
     * Titles and copies per collection type. E-books are their own slice
     * (their "copies" are licences); printed books use collection_type.
     *
     * @return list<array{label: string, titles: int, copies: int}>
     */
    private function collection(): array
    {
        $titles = Book::where('type', Book::PRINTED)->selectRaw('collection_type, COUNT(*) AS total')->groupBy('collection_type')->pluck('total', 'collection_type');
        $copies = BookCopy::join('books', 'books.id', '=', 'book_copies.book_id')->where('books.type', Book::PRINTED)
            ->selectRaw('books.collection_type, COUNT(*) AS total')->groupBy('books.collection_type')->pluck('total', 'collection_type');
        $rows = collect(MasterOptions::COLLECTION_TYPES)->map(fn ($type) => [
            'label' => $type,
            'titles' => (int) ($titles[$type] ?? 0),
            'copies' => (int) ($copies[$type] ?? 0),
        ]);
        $ebooks = ['label' => 'E-book', 'titles' => Book::where('type', Book::EBOOK)->count(), 'copies' => (int) Book::where('type', Book::EBOOK)->sum('license_count')];

        return $rows->splice(0, 1)->push($ebooks)->concat($rows)->values()->all();
    }

    /**
     * New titles per year (the last seven) by acquisition source, for every
     * collection type, so the page can switch types without a reload.
     *
     * @return array{years: list<int>, sources: list<string>, types: array<string, list<list<int>>>}
     */
    private function growth(): array
    {
        $years = range(now()->year - 6, now()->year);
        $types = array_merge(['Semua jenis', 'Buku teks', 'E-book'], array_slice(MasterOptions::COLLECTION_TYPES, 1));
        // One pass over plain rows; filtering models per cell was slow on
        // a real catalogue.
        $counts = [];
        $rows = Book::query()->where('created_at', '>=', now()->setDate($years[0], 1, 1)->startOfDay())
            ->toBase()->get(['type', 'collection_type', 'acquisition', 'created_at']);

        foreach ($rows as $b) {
            $year = (int) substr((string) $b->created_at, 0, 4);
            $kind = $b->type === Book::EBOOK ? 'E-book' : $b->collection_type;
            $counts[$kind][$year][$b->acquisition] = ($counts[$kind][$year][$b->acquisition] ?? 0) + 1;
            $counts['Semua jenis'][$year][$b->acquisition] = ($counts['Semua jenis'][$year][$b->acquisition] ?? 0) + 1;
        }

        $matrix = fn (string $kind) => array_map(fn ($year) => array_map(
            fn ($source) => $counts[$kind][$year][$source] ?? 0,
            MasterOptions::ACQUISITIONS,
        ), $years);

        return [
            'years' => $years,
            'sources' => MasterOptions::ACQUISITIONS,
            'types' => collect($types)->mapWithKeys(fn ($type) => [
                $type => $matrix($type),
            ])->all(),
        ];
    }

    /**
     * The latest loans, returns, visits, and clearances, newest first.
     *
     * @return list<array{icon: string, text: string, time: string, at: int}>
     */
    private function activity(): array
    {
        $since = now()->subDays(3);
        $items = collect();

        Loan::with(['copy.book', 'member'])->where('loaned_at', '>=', $since)->latest('loaned_at')->limit(6)->get()
            ->each(fn (Loan $l) => $items->push(['icon' => 'arrow-up-right', 'text' => "{$l->member->name} meminjam {$l->copy->book->title}", 'at' => $l->loaned_at]));
        Loan::with(['copy.book', 'member'])->where('returned_at', '>=', $since)->latest('returned_at')->limit(6)->get()
            ->each(fn (Loan $l) => $items->push(['icon' => 'arrow-down-left', 'text' => "{$l->member->name} mengembalikan {$l->copy->book->title}", 'at' => $l->returned_at]));
        Visit::with('member')->where('checked_in_at', '>=', $since)->latest('checked_in_at')->limit(6)->get()
            ->each(fn (Visit $v) => $items->push(['icon' => 'log-in', 'text' => ($v->member?->name ?? $v->guest_name).' berkunjung · '.$v->purpose, 'at' => $v->checked_in_at]));
        ClearanceRequest::with('member')->where('approved_at', '>=', $since)->get()
            ->each(fn (ClearanceRequest $c) => $items->push(['icon' => 'file-check-2', 'text' => "Bebas pustaka {$c->member->name} disetujui", 'at' => $c->approved_at]));

        return $items->sortByDesc('at')->take(8)->map(fn ($i) => [
            'icon' => $i['icon'],
            'text' => $i['text'],
            'time' => $i['at']->isToday() ? $i['at']->format('H.i') : $i['at']->translatedFormat('j M, H.i'),
            'at' => $i['at']->getTimestamp(),
        ])->values()->all();
    }
}
