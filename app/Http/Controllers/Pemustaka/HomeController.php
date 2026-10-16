<?php

namespace App\Http\Controllers\Pemustaka;

use App\Http\Controllers\Controller;
use App\Models\ClearanceRequest;
use App\Models\EbookLoan;
use App\Models\Loan;
use App\Models\NewsPost;
use App\Models\Visit;
use App\Services\Circulation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    use Concerns;

    public function __construct(private Circulation $circulation) {}

    public function __invoke(Request $request): Response
    {
        if ($request->user()->member === null) {
            return Inertia::render('pemustaka/belum-terhubung');
        }

        $member = $this->member($request);
        $last = $member->visits()->today()->latest('checked_in_at')->first();
        $loans = $member->loans()->open()->with('copy.book')->orderBy('due_at')->get();

        return Inertia::render('pemustaka/beranda', [
            'presence' => $last ? [
                'inside' => $last->checked_out_at === null,
                'kind' => $last->checked_out_at ? 'Keluar' : 'Masuk',
                'time' => ($last->checked_out_at ?? $last->checked_in_at)->format('H.i'),
            ] : null,
            'purposes' => Visit::PURPOSES,
            'stats' => [
                'loans' => $loans->count(),
                'history' => $member->loans()->whereNotNull('returned_at')->count(),
                'ebooks' => $member->ebookLoans()->active()->count(),
            ],
            'loans' => $loans->map(fn (Loan $l) => $this->loanRow($l)),
            'notifications' => $this->notifications($member, $loans),
        ]);
    }

    public function extend(Request $request, Loan $loan): RedirectResponse
    {
        abort_unless($loan->member_id === $this->member($request)->id, 403);

        try {
            $this->circulation->extend($loan);
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }

        return back()->with('success', 'Diperpanjang hingga '.$loan->due_at->translatedFormat('j M Y').'.');
    }

    /**
     * @return array<string, mixed>
     */
    private function loanRow(Loan $l): array
    {
        $days = (int) today()->diffInDays($l->due_at, false);

        return [
            'id' => $l->id,
            'title' => $l->copy->book->title,
            'ddc_class' => $l->copy->book->ddc_class,
            'due' => $l->due_at->translatedFormat('j M Y'),
            'daysLeft' => $days,
            'extensions' => $l->extensions,
            'extendProblem' => $this->circulation->extensionProblem($l),
        ];
    }

    /**
     * Due dates, e-book access ending, clearance updates, and the latest
     * announcements, newest first.
     *
     * @param  Collection<int, Loan>  $loans
     * @return list<array{icon: string, tone: string, text: string, time: string}>
     */
    private function notifications($member, $loans): array
    {
        $items = [];

        foreach ($loans as $l) {
            $days = (int) today()->diffInDays($l->due_at, false);

            if ($days <= 2) {
                $items[] = ['icon' => 'clock', 'tone' => 'warning', 'text' => $days < 0
                    ? "{$l->copy->book->title} terlambat ".(-$days).' hari. Kembalikan ke meja sirkulasi, ya.'
                    : ($days === 0 ? "{$l->copy->book->title} jatuh tempo hari ini." : "{$l->copy->book->title} jatuh tempo {$days} hari lagi."), 'time' => 'Hari ini'];
            }
        }

        $member->ebookLoans()->active()->with('book')->where('due_at', '<=', now()->addDays(2))->get()
            ->each(function (EbookLoan $e) use (&$items) {
                $items[] = ['icon' => 'tablet-smartphone', 'tone' => 'warning', 'text' => "Akses e-book {$e->book->title} berakhir {$e->due_at->translatedFormat('j M, H.i')}.", 'time' => 'Hari ini'];
            });

        $clearance = $member->clearanceRequests()->latest('id')->first();

        if ($clearance?->status === ClearanceRequest::APPROVED) {
            $items[] = ['icon' => 'badge-check', 'tone' => 'success', 'text' => "Surat bebas pustaka nomor {$clearance->letter_number} sudah terbit.", 'time' => $clearance->approved_at->translatedFormat('j M Y')];
        } elseif ($clearance?->status === ClearanceRequest::RETURNED) {
            $items[] = ['icon' => 'circle-alert', 'tone' => 'danger', 'text' => "Pengajuan bebas pustaka dikembalikan: {$clearance->note}", 'time' => $clearance->updated_at->translatedFormat('j M Y')];
        }

        NewsPost::whereNotNull('published_at')->where('published_at', '<=', now())->latest('published_at')->limit(2)->get()
            ->each(function (NewsPost $n) use (&$items) {
                $items[] = ['icon' => 'megaphone', 'tone' => 'slate', 'text' => $n->title, 'time' => $n->published_at->translatedFormat('j M Y')];
            });

        return $items;
    }
}
