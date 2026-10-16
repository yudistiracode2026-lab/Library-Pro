<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Rack;
use App\Support\FloorPlan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Find a printed book and show where it sits: floor plan, rack, and shelf.
 */
class SearchMapController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $q = $request->string('q')->trim()->toString();
        $book = $request->integer('buku') ? Book::with('rack')->where('type', Book::PRINTED)->find($request->integer('buku')) : null;
        $rack = $book?->rack
            ?? Rack::where('code', $request->string('rak')->toString())->first()
            ?? Rack::where('floor', $request->integer('lantai') ?: 1)->orderBy('code')->first();

        $racks = Rack::withCount(['books' => fn ($b) => $b->where('type', Book::PRINTED)])->orderBy('code')->get();

        return Inertia::render('staf/pencarian', [
            'filters' => ['q' => $q],
            // Like the prototype, the list shows the first five titles even before typing.
            'results' => $this->search($q)->take(5)->values(),
            'resultCount' => $this->query($q)->count(),
            'selectedBookId' => $book?->id,
            'floor' => $rack?->floor ?? 1,
            'floors' => collect(FloorPlan::fixtures())->map(fn ($fixtures, $floor) => [
                'floor' => $floor,
                'fixtures' => $fixtures,
                'racks' => $racks->where('floor', $floor)->values()->map(fn (Rack $r) => [
                    'code' => $r->code,
                    'name' => $r->name,
                    'x' => $r->map_x, 'y' => $r->map_y, 'w' => $r->map_w, 'h' => $r->map_h,
                    'books' => $r->books_count,
                ]),
            ])->values(),
            'rack' => $rack ? $this->rackDetail($rack, $book) : null,
        ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    /**
     * @return Builder<Book>
     */
    private function query(string $q): Builder
    {
        return Book::query()
            ->where('type', Book::PRINTED)
            ->when($q !== '', fn ($query) => $query->where(fn ($w) => $w
                ->where('title', 'like', "%{$q}%")
                ->orWhere('call_number', 'like', "%{$q}%")
                ->orWhereRelation('author', 'name', 'like', "%{$q}%")));
    }

    private function search(string $q): Collection
    {
        return $this->query($q)
            ->with(['author', 'rack'])
            ->withCount(['copies', 'copies as available_count' => fn ($c) => $c->where('status', BookCopy::AVAILABLE)])
            ->orderBy('title')
            ->limit(5)
            ->get()
            ->map(fn (Book $b) => [
                'id' => $b->id,
                'title' => $b->title,
                'author' => $b->author->name,
                'ddc_class' => $b->ddc_class,
                'rack' => $b->rack?->code,
                'floor' => $b->rack?->floor,
                'available' => $b->available_count,
                'copies' => $b->copies_count,
            ]);
    }

    /**
     * Books stand in call-number order, filling shelves from the first one
     * with the same number of titles on each.
     *
     * @return array<string, mixed>
     */
    private function rackDetail(Rack $rack, ?Book $selected): array
    {
        $books = $rack->books()->where('type', Book::PRINTED)->orderBy('call_number')->get(['id', 'title', 'call_number']);
        $perShelf = max(1, (int) ceil($books->count() / Rack::SHELVES));
        $placed = $books->values()->map(fn (Book $b, int $i) => [
            'id' => $b->id,
            'title' => $b->title,
            'call_number' => $b->call_number,
            'shelf' => intdiv($i, $perShelf) + 1,
        ]);

        return [
            'code' => $rack->code,
            'name' => $rack->name,
            'floor' => $rack->floor,
            'highlightShelf' => $selected ? $placed->firstWhere('id', $selected->id)['shelf'] ?? null : null,
            'shelves' => collect(range(1, Rack::SHELVES))->map(function (int $n) use ($placed) {
                $onShelf = $placed->where('shelf', $n);

                return [
                    'number' => $n,
                    'range' => $onShelf->isEmpty() ? 'Kosong' : $onShelf->first()['call_number'].' – '.$onShelf->last()['call_number'],
                ];
            }),
            'books' => $placed,
        ];
    }
}
