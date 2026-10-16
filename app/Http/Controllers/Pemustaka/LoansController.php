<?php

namespace App\Http\Controllers\Pemustaka;

use App\Http\Controllers\Controller;
use App\Models\EbookLoan;
use App\Models\Loan;
use App\Support\LibrarySettings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Pinjaman & riwayat": e-books on loan (read in the browser) and the
 * history of printed loans.
 */
class LoansController extends Controller
{
    use Concerns;

    public function __invoke(Request $request): Response
    {
        $member = $this->member($request);
        $reading = $request->integer('baca');

        $ebooks = $member->ebookLoans()->active()->with('book')->orderBy('due_at')->get();

        return Inertia::render('pemustaka/pinjaman', [
            'ebooks' => $ebooks->map(fn (EbookLoan $l) => [
                'id' => $l->id,
                'title' => $l->book->title,
                'format' => $l->book->format,
                'ddc_class' => $l->book->ddc_class,
                'due' => $l->due_at->translatedFormat('j M Y'),
                'daysLeft' => (int) now()->startOfDay()->diffInDays($l->due_at->copy()->startOfDay(), false),
                'page' => $l->last_page,
                'hasFile' => $l->book->file_path !== null,
            ]),
            'max' => (int) LibrarySettings::get('ebook_max_loans'),
            'reader' => ($open = $ebooks->firstWhere('id', $reading)) && $open->book->file_path ? [
                'loanId' => $open->id,
                'title' => $open->book->title,
                'due' => $open->due_at->translatedFormat('j M Y'),
                'page' => $open->last_page,
                'format' => $open->book->format,
                'file' => route('pemustaka.ebook.file', $open),
            ] : null,
            'history' => $member->loans()->with('copy.book')->latest('loaned_at')->limit(30)->get()->map(fn (Loan $l) => [
                'id' => $l->id,
                'title' => $l->copy->book->title,
                'out' => $l->loaned_at->translatedFormat('j M Y'),
                'back' => $l->returned_at?->translatedFormat('j M Y'),
                'late' => $l->returned_at ? max(0, (int) $l->due_at->copy()->startOfDay()->diffInDays($l->returned_at->copy()->startOfDay(), false)) : $l->daysLate(),
                'open' => $l->returned_at === null,
            ]),
        ]);
    }
}
