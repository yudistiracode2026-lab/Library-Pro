<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\CollectionSuggestion;
use App\Models\Loan;
use App\Models\NewPublication;
use App\Models\ProcurementItem;
use App\Support\CsvExport;
use App\Support\LibrarySettings;
use App\Support\MasterOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProcurementController extends Controller
{
    /** Target loans per copy over six months; above this a title is a favourite to restock. */
    private const TARGET_RATIO = 4;

    private const SUGGESTION_ORDER = [
        CollectionSuggestion::PROPOSED, CollectionSuggestion::APPROVED, CollectionSuggestion::ORDERED,
        CollectionSuggestion::AVAILABLE, CollectionSuggestion::REJECTED,
    ];

    public function index(Request $request): Response
    {
        $tab = in_array($request->query('tab'), ['baru', 'favorit', 'usulan', 'daftar'], true) ? $request->query('tab') : 'baru';
        $list = $this->currentList();
        $budget = (int) LibrarySettings::get('procurement_budget');
        $total = $list->sum(fn (ProcurementItem $i) => $i->subtotal());
        $favorites = $this->favorites($list);

        return Inertia::render('staf/pengadaan', [
            'tab' => $tab,
            'kpis' => [
                'new' => NewPublication::count(),
                'favorites' => $favorites->count(),
                'pending' => CollectionSuggestion::where('status', CollectionSuggestion::PROPOSED)->count(),
                'total' => $total,
                'copies' => $list->sum('quantity'),
            ],
            'newPublications' => NewPublication::orderByDesc('year')->orderBy('title')->get()->map(fn (NewPublication $p) => [
                ...$p->only(['id', 'title', 'author', 'publisher', 'year', 'price', 'reason']),
                'ddc_class' => $p->ddc_class,
                'ddc' => MasterOptions::DDC_CLASSES[$p->ddc_class] ?? $p->ddc_class,
                'listed' => $list->firstWhere('new_publication_id', $p->id)?->quantity,
            ]),
            'favorites' => $favorites,
            'suggestions' => CollectionSuggestion::with('member')->orderByDesc('votes')->get()
                ->sortBy(fn (CollectionSuggestion $s) => array_search($s->status, self::SUGGESTION_ORDER, true))
                ->values()
                ->map(fn (CollectionSuggestion $s) => [
                    ...$s->only(['id', 'title', 'author', 'votes', 'status', 'note']),
                    'by' => $s->member?->name ?? 'Pemustaka',
                    'listed' => $list->firstWhere('suggestion_id', $s->id)?->quantity,
                ]),
            'list' => [
                'submitted_at' => $list->first()?->submitted_at?->translatedFormat('j M Y'),
                'items' => $list->map(fn (ProcurementItem $i) => [
                    ...$i->only(['id', 'title', 'author', 'publisher', 'ddc_class', 'price', 'quantity', 'source']),
                    'subtotal' => $i->subtotal(),
                ])->values(),
                'bySource' => collect(ProcurementItem::SOURCES)->map(fn ($s) => ['label' => $s, 'copies' => $list->where('source', $s)->sum('quantity')]),
                'total' => $total,
                'budget' => $budget,
            ],
        ]);
    }

    public function addNewPublication(NewPublication $publication): RedirectResponse
    {
        ProcurementItem::draft()->firstOrCreate(['new_publication_id' => $publication->id], [
            ...$publication->only(['title', 'author', 'publisher', 'year', 'ddc_class', 'price']),
            'quantity' => 1,
            'source' => 'Terbaru',
        ]);

        return back()->with('success', "{$publication->title} masuk daftar pengadaan.");
    }

    public function addFavorite(Request $request, Book $book): RedirectResponse
    {
        $quantity = $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:100']])['quantity'];
        $book->loadMissing(['author', 'publisher']);

        ProcurementItem::draft()->updateOrCreate(['book_id' => $book->id], [
            'title' => $book->title,
            'author' => $book->author->name,
            'publisher' => $book->publisher->name,
            'year' => $book->year,
            'ddc_class' => $book->ddc_class,
            'price' => $this->estimatePrice($book),
            'quantity' => $quantity,
            'source' => 'Favorit',
        ]);

        return back()->with('success', "{$book->title} +{$quantity} eks masuk daftar pengadaan.");
    }

    public function approveSuggestion(CollectionSuggestion $suggestion): RedirectResponse
    {
        abort_unless($suggestion->status === CollectionSuggestion::PROPOSED, 409);
        DB::transaction(function () use ($suggestion) {
            $suggestion->update(['status' => CollectionSuggestion::APPROVED, 'note' => null]);
            ProcurementItem::create([
                'title' => $suggestion->title,
                'author' => $suggestion->author,
                'price' => 150000,
                'quantity' => CollectionSuggestion::COPIES_ON_APPROVAL,
                'source' => 'Usulan',
                'suggestion_id' => $suggestion->id,
            ]);
        });

        return back()->with('success', 'Usulan disetujui dan masuk daftar pengadaan ('.CollectionSuggestion::COPIES_ON_APPROVAL.' eks).');
    }

    public function rejectSuggestion(Request $request, CollectionSuggestion $suggestion): RedirectResponse
    {
        abort_unless($suggestion->status === CollectionSuggestion::PROPOSED, 409);

        $note = $request->validate(['note' => ['required', 'string', 'max:255']], [], ['note' => 'alasan'])['note'];
        $suggestion->update(['status' => CollectionSuggestion::REJECTED, 'note' => $note]);

        return back()->with('success', 'Usulan ditolak.');
    }

    /**
     * Undo an approval (while the list is still a draft) or a rejection.
     */
    public function undoSuggestion(CollectionSuggestion $suggestion): RedirectResponse
    {
        abort_unless(in_array($suggestion->status, [CollectionSuggestion::APPROVED, CollectionSuggestion::REJECTED], true), 409);

        DB::transaction(function () use ($suggestion) {
            $suggestion->procurementItem()->whereNull('submitted_at')->delete();
            $suggestion->update(['status' => CollectionSuggestion::PROPOSED, 'note' => null]);
        });

        return back()->with('success', 'Keputusan dibatalkan.');
    }

    public function arrived(CollectionSuggestion $suggestion): RedirectResponse
    {
        abort_unless($suggestion->status === CollectionSuggestion::ORDERED, 409);

        $suggestion->update(['status' => CollectionSuggestion::AVAILABLE]);

        return back()->with('success', 'Ditandai tersedia. Jangan lupa catat bukunya di Buku & e-book, ya.');
    }

    public function updateItem(Request $request, ProcurementItem $item): RedirectResponse
    {
        abort_unless($item->submitted_at === null, 409);

        $item->update($request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:500']]));

        return back();
    }

    public function destroyItem(ProcurementItem $item): RedirectResponse
    {
        abort_unless($item->submitted_at === null, 409);

        DB::transaction(function () use ($item) {
            $item->suggestion?->update(['status' => CollectionSuggestion::PROPOSED]);
            $item->delete();
        });

        return back()->with('success', "{$item->title} dihapus dari daftar.");
    }

    /**
     * Send the draft list to the finance office. Suggestions on it become "Dipesan".
     */
    public function submit(): RedirectResponse
    {
        $items = ProcurementItem::draft()->get();
        $total = $items->sum(fn (ProcurementItem $i) => $i->subtotal());
        $budget = (int) LibrarySettings::get('procurement_budget');

        if ($items->isEmpty()) {
            return back()->with('error', 'Daftar pengadaan masih kosong.');
        }

        if ($total > $budget) {
            return back()->with('error', 'Estimasi melebihi pagu Rp '.number_format($budget, 0, ',', '.').'. Kurangi jumlah eksemplar dulu, ya.');
        }

        DB::transaction(function () use ($items) {
            ProcurementItem::whereKey($items->modelKeys())->update(['submitted_at' => now()]);
            CollectionSuggestion::whereKey($items->pluck('suggestion_id')->filter())->update(['status' => CollectionSuggestion::ORDERED]);
        });

        return back()->with('success', 'Daftar pengadaan diajukan ke bagian keuangan.');
    }

    public function export(): StreamedResponse
    {
        $rows = $this->currentList()->map(fn (ProcurementItem $i) => [
            $i->title, $i->author, $i->publisher, $i->year, $i->ddc_class, $i->source, $i->price, $i->quantity, $i->subtotal(),
        ]);

        return CsvExport::download('daftar-pengadaan', ['Judul', 'Pengarang', 'Penerbit', 'Tahun', 'Kelas DDC', 'Sumber', 'Harga', 'Eksemplar', 'Subtotal'], $rows);
    }

    /**
     * The draft list, or the most recently submitted one when nothing is drafted.
     *
     * @return Collection<int, ProcurementItem>
     */
    private function currentList(): Collection
    {
        $draft = ProcurementItem::draft()->orderBy('id')->get();

        if ($draft->isNotEmpty()) {
            return $draft;
        }

        $last = ProcurementItem::max('submitted_at');

        return $last ? ProcurementItem::where('submitted_at', $last)->orderBy('id')->get() : collect();
    }

    /**
     * Printed titles borrowed more than TARGET_RATIO times per copy in the
     * last six months, with the copies needed to bring the ratio down.
     *
     * @param  Collection<int, ProcurementItem>  $list
     * @return Collection<int, array<string, mixed>>
     */
    private function favorites(Collection $list): Collection
    {
        $loans = Loan::where('loaned_at', '>=', now()->subMonths(6))
            ->join('book_copies', 'book_copies.id', '=', 'loans.book_copy_id')
            ->selectRaw('book_copies.book_id, count(*) as total')
            ->groupBy('book_copies.book_id')
            ->pluck('total', 'book_id');

        return Book::with('author')
            ->where('type', Book::PRINTED)
            ->whereIn('id', $loans->keys())
            ->withCount(['copies', 'copies as available_count' => fn ($c) => $c->where('status', BookCopy::AVAILABLE)])
            ->get()
            ->map(function (Book $b) use ($loans, $list) {
                $total = (int) $loans[$b->id];
                $ratio = $b->copies_count > 0 ? $total / $b->copies_count : $total;

                return [
                    'id' => $b->id,
                    'title' => $b->title,
                    'author' => $b->author->name,
                    'call_number' => $b->call_number,
                    'ddc_class' => $b->ddc_class,
                    'copies' => $b->copies_count,
                    'available' => $b->available_count,
                    'loans' => $total,
                    'ratio' => round($ratio, 1),
                    'add' => max(0, (int) ceil($total / self::TARGET_RATIO) - $b->copies_count),
                    'listed' => $list->firstWhere('book_id', $b->id)?->quantity,
                ];
            })
            ->filter(fn (array $f) => $f['ratio'] > self::TARGET_RATIO)
            ->sortByDesc('ratio')
            ->values();
    }

    private function estimatePrice(Book $book): int
    {
        return ProcurementItem::where('book_id', $book->id)->latest('id')->value('price') ?? 100000;
    }
}
