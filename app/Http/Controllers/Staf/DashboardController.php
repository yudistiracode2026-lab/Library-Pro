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
                'dueToday' => (clone $openLoans)->whereDate('due_at', today())->count(),
                'loansToday' => Loan::whereDate('loaned_at', today())->count(),
                'clearancePending' => ClearanceRequest::where('status', ClearanceRequest::PENDING)->count(),
            ],
            'collection' => collect(MasterOptions::COLLECTION_TYPES)->map(fn ($type) => [
                'label' => $type,
                'titles' => Book::where('collection_type', $type)->count(),
                'copies' => BookCopy::whereRelation('book', 'collection_type', $type)->count(),
            ])->filter(fn ($row) => $row['titles'] > 0)->sortByDesc('titles')->values(),
            'visits' => collect(range(13, 0))->map(function ($ago) {
                $day = today()->subDays($ago);

                return ['label' => $day->translatedFormat('D j'), 'date' => $day->toDateString(), 'total' => Visit::whereDate('checked_in_at', $day)->count()];
            }),
            'loansByClass' => collect(MasterOptions::DDC_CLASSES)->map(fn ($name, $class) => [
                'class' => (string) $class,
                'name' => $name,
                'total' => Loan::where('loaned_at', '>=', now()->startOfMonth())->whereRelation('copy.book', 'ddc_class', (string) $class)->count(),
            ])->values(),
            'due' => Loan::open()->with(['copy.book', 'member'])->whereDate('due_at', '<=', today()->addDays(2))->orderBy('due_at')->limit(8)->get()->map(fn (Loan $l) => [
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
