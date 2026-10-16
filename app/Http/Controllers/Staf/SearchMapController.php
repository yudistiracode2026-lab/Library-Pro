<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Rack;
use App\Support\FloorPlan;
use App\Support\Shelving;
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
            'rack' => $rack ? Shelving::rack($rack, $book) : null,
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
}
