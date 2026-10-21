<?php

namespace App\Http\Controllers\Pemustaka;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\EbookLoan;
use App\Models\Rack;
use App\Support\FloorPlan;
use App\Support\LibrarySettings;
use App\Support\Shelving;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * "Cari buku": printed books with their shelf on the floor plan, and
 * e-books that members borrow for a fixed period.
 */
class CatalogController extends Controller
{
    use Concerns;

    public function index(Request $request): Response
    {
        $member = $this->member($request);
        $q = $request->string('q')->trim()->toString();
        $kind = in_array($request->query('jenis'), [Book::PRINTED, Book::EBOOK], true) ? $request->query('jenis') : '';
        $mine = $member->ebookLoans()->active()->pluck('book_id');

        $books = Book::query()
            ->with(['author', 'authors', 'rack'])
            ->where(fn ($b) => $b->where('type', Book::PRINTED)->orWhere(fn ($e) => $e->where('type', Book::EBOOK)->where('status', 'Terbit')))
            ->when($kind, fn ($b) => $b->where('type', $kind))
            ->when($q !== '', fn ($b) => $b->where(fn ($w) => $w
                ->where('title', 'like', "%{$q}%")
                ->orWhere('call_number', 'like', "%{$q}%")
                ->orWhereRelation('authors', 'name', 'like', "%{$q}%")
                ->orWhereRelation('author', 'name', 'like', "%{$q}%")
                ->orWhereRelation('subjects', 'name', 'like', "%{$q}%")))
            ->withCount([
                'copies as available_count' => fn ($c) => $c->where('status', BookCopy::AVAILABLE),
                'ebookLoans as licences_used' => fn ($l) => $l->active(),
            ])
            ->orderBy('title')
            ->paginate(20, pageName: 'hal');

        $selected = $request->integer('buku')
            ? Book::with(['author', 'rack'])->where('type', Book::PRINTED)->find($request->integer('buku'))
            : null;
        $ebook = $request->integer('ebook')
            ? Book::where('type', Book::EBOOK)->find($request->integer('ebook'))
            : null;

        return Inertia::render('pemustaka/cari', [
            'filters' => ['q' => $q, 'jenis' => $kind],
            'resultPage' => ['current' => $books->currentPage(), 'last' => $books->lastPage(), 'total' => $books->total()],
            'results' => $books->getCollection()->map(fn (Book $b) => [
                'id' => $b->id,
                'type' => $b->type,
                'title' => $b->title,
                'author' => implode('; ', $b->authorNames()),
                'year' => $b->year,
                'ddc_class' => $b->ddc_class,
                'cover' => $b->coverUrl(),
                'rack' => $b->rack?->code,
                'available' => $b->type === Book::PRINTED ? $b->available_count : max(0, (int) $b->license_count - $b->licences_used),
                'mine' => $mine->contains($b->id),
            ]),
            'selected' => $selected ? $this->location($selected) : null,
            'ebook' => $ebook ? $this->ebookDetail($ebook, $member->id, $mine->count()) : null,
        ]);
    }

    public function borrow(Request $request, Book $book): RedirectResponse
    {
        $member = $this->member($request);
        abort_unless($book->type === Book::EBOOK && $book->status === 'Terbit', 404);

        $max = (int) LibrarySettings::get('ebook_max_loans');

        if ($member->ebookLoans()->active()->where('book_id', $book->id)->exists()) {
            return back()->with('error', 'E-book ini sedang kamu pinjam.');
        }

        if ($member->ebookLoans()->active()->count() >= $max) {
            return back()->with('error', "Batas {$max} e-book tercapai. Kembalikan salah satu dulu, ya.");
        }

        if (EbookLoan::active()->where('book_id', $book->id)->count() >= (int) $book->license_count) {
            return back()->with('error', 'Semua lisensi sedang dipakai. Coba lagi nanti, ya.');
        }

        $days = (int) LibrarySettings::get('ebook_loan_days');
        $member->ebookLoans()->create(['book_id' => $book->id, 'borrowed_at' => now(), 'due_at' => now()->addDays($days)]);

        return to_route('pemustaka.pinjaman')->with('success', "{$book->title} berhasil dipinjam {$days} hari. Selamat membaca!");
    }

    public function giveBack(Request $request, EbookLoan $loan): RedirectResponse
    {
        abort_unless($loan->member_id === $this->member($request)->id, 403);
        $loan->update(['returned_at' => now()]);

        return back()->with('success', "{$loan->book->title} sudah dikembalikan.");
    }

    /**
     * Streams the e-book to its borrower for the in-browser reader. The file
     * is not offered as a download.
     */
    public function file(Request $request, EbookLoan $loan): StreamedResponse
    {
        abort_unless($loan->member_id === $this->member($request)->id && $loan->returned_at === null && $loan->due_at->isFuture(), 403);
        abort_unless($loan->book->file_path && Storage::disk('local')->exists($loan->book->file_path), 404);

        return Storage::disk('local')->response($loan->book->file_path, null, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function progress(Request $request, EbookLoan $loan): RedirectResponse|HttpResponse
    {
        abort_unless($loan->member_id === $this->member($request)->id, 403);
        $loan->update(['last_page' => $request->validate(['page' => ['required', 'integer', 'min:1', 'max:5000']])['page']]);

        return $request->wantsJson() ? response()->noContent() : back();
    }

    /**
     * @return array<string, mixed>
     */
    private function location(Book $book): array
    {
        $floor = $book->rack?->floor ?? 1;

        return [
            'id' => $book->id,
            'title' => $book->title,
            'author' => $book->author->name,
            'call_number' => $book->call_number,
            'ddc_class' => $book->ddc_class,
            'cover' => $book->coverUrl(),
            'available' => $book->copies()->where('status', BookCopy::AVAILABLE)->count(),
            'floor' => $floor,
            'fixtures' => FloorPlan::fixtures()[$floor] ?? [],
            'racks' => Rack::where('floor', $floor)->orderBy('code')->get()->map(fn (Rack $r) => [
                'code' => $r->code, 'x' => $r->map_x, 'y' => $r->map_y, 'w' => $r->map_w, 'h' => $r->map_h,
            ]),
            'rack' => $book->rack ? Shelving::rack($book->rack, $book) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function ebookDetail(Book $book, int $memberId, int $held): array
    {
        $book->loadMissing(['author', 'publisher']);
        $mine = EbookLoan::active()->where('book_id', $book->id)->where('member_id', $memberId)->first();
        $used = EbookLoan::active()->where('book_id', $book->id)->count();

        return [
            'id' => $book->id,
            'title' => $book->title,
            'author' => $book->author->name,
            'publisher' => $book->publisher?->name,
            'year' => $book->year,
            'ddc_class' => $book->ddc_class,
            'cover' => $book->coverUrl(),
            'collection_type' => $book->collection_type,
            'format' => $book->format,
            'size' => $book->file_size_mb,
            'licences' => (int) $book->license_count,
            'available' => max(0, (int) $book->license_count - $used),
            'mine' => $mine ? ['id' => $mine->id, 'due' => $mine->due_at->translatedFormat('j M Y')] : null,
            'full' => $held >= (int) LibrarySettings::get('ebook_max_loans'),
            'max' => (int) LibrarySettings::get('ebook_max_loans'),
            'days' => (int) LibrarySettings::get('ebook_loan_days'),
        ];
    }
}
