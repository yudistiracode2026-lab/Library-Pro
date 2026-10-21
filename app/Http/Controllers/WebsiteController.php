<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Member;
use App\Models\NewsPost;
use App\Models\Visit;
use App\Support\MasterOptions;
use App\Support\WebsiteContent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public library website with the OPAC, built from
 * design/Website Perpustakaan.dc.html and the CMS content.
 */
class WebsiteController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $content = WebsiteContent::all();
        $today = WebsiteContent::today();
        $filters = [
            'q' => $request->string('q')->trim()->toString(),
            'field' => in_array($request->query('field'), ['title', 'author', 'subject', 'isbn'], true) ? $request->query('field') : 'all',
            'type' => in_array($request->query('type'), ['fisik', 'ebook', ...MasterOptions::COLLECTION_TYPES], true) ? $request->query('type') : '',
            'available' => $request->boolean('tersedia'),
        ];
        // The gallery opens on the featured titles ("buku unggulan") when there are any.
        $featured = Book::where('featured', true)->count();
        $class = $request->query('kelas') === 'unggulan' || array_key_exists($request->query('kelas'), MasterOptions::DDC_CLASSES)
            ? $request->query('kelas')
            : ($featured > 0 ? 'unggulan' : '300');
        $results = $this->search($filters)->paginate(20, pageName: 'hal');

        return Inertia::render('website', [
            'hero' => ['title' => $content['hero_title'], 'subtitle' => $content['hero_subtitle']],
            'today' => [
                'open' => $today['open'],
                'label' => $today['row'] && $today['row']['open']
                    ? 'Hari ini '.str_replace(':', '.', $today['row']['open']).' – '.str_replace(':', '.', $today['row']['close'])
                    : 'Hari ini tutup',
            ],
            'schedule' => collect($content['schedule'])->map(fn ($row) => [
                'label' => $row['label'],
                'hours' => $row['open'] ? str_replace(':', '.', $row['open']).' – '.str_replace(':', '.', $row['close']) : 'Tutup',
                'note' => $row['note'],
                'today' => in_array(now()->dayOfWeek, $row['days'], true),
                'closed' => ! $row['open'],
            ]),
            'stats' => [
                ['book-copy', number_format(Book::count(), 0, ',', '.'), 'Judul koleksi'],
                ['library-big', number_format(BookCopy::count(), 0, ',', '.'), 'Eksemplar'],
                ['graduation-cap', number_format(Book::where('collection_type', 'Skripsi')->count(), 0, ',', '.'), 'Skripsi'],
                ['tablet-smartphone', number_format(Book::where('type', Book::EBOOK)->count(), 0, ',', '.'), 'Judul e-book'],
                ['users', number_format(Member::where('status', 'Aktif')->count(), 0, ',', '.'), 'Pemustaka aktif'],
                ['footprints', number_format(Visit::where('checked_in_at', '>=', now()->startOfMonth())->count(), 0, ',', '.'), 'Kunjungan bulan ini'],
            ],
            'filters' => $filters,
            'resultCount' => $results->total(),
            'results' => $results->getCollection()->map(fn (Book $b) => $this->card($b)),
            'resultPage' => ['current' => $results->currentPage(), 'last' => $results->lastPage(), 'from' => $results->firstItem(), 'to' => $results->lastItem()],
            'classes' => collect(MasterOptions::DDC_CLASSES)->map(fn ($name, $code) => [
                'code' => (string) $code,
                'name' => $name,
                'count' => Book::where('ddc_class', (string) $code)->count(),
            ])->values()->when($featured > 0, fn ($c) => $c->prepend(['code' => 'unggulan', 'name' => 'Buku unggulan', 'count' => $featured])),
            'selectedClass' => $class,
            'gallery' => Book::with(['author', 'authors', 'subjects', 'publisher', 'rack'])->withCount(['copies', 'copies as available_count' => fn ($c) => $c->where('status', BookCopy::AVAILABLE)])
                ->when($class === 'unggulan', fn ($b) => $b->where('featured', true), fn ($b) => $b->where('ddc_class', $class))
                // Titles with a cover first, so the gallery looks like a shelf.
                ->orderByRaw('cover_path IS NULL')->orderBy('title')->limit(18)->get()->map(fn (Book $b) => $this->card($b)),
            'collectionTypes' => MasterOptions::COLLECTION_TYPES,
            'services' => collect(WebsiteContent::SERVICES)->map(fn ($s) => ['icon' => $s[0], 'name' => $s[1], 'description' => $s[2]]),
            'facilities' => collect(WebsiteContent::FACILITIES)->map(fn ($f) => ['icon' => $f[0], 'name' => $f[1], 'description' => $f[2]]),
            'news' => NewsPost::published()->latest('published_at')->limit(6)->get()->map(fn (NewsPost $n) => [
                'id' => $n->id, 'tag' => $n->tag, 'title' => $n->title, 'excerpt' => $n->excerpt, 'date' => $n->published_at->translatedFormat('j M Y'),
            ]),
        ]);
    }

    /**
     * @param  array{q: string, field: string, type: string, available: bool}  $filters
     * @return Builder<Book>
     */
    private function search(array $filters): Builder
    {
        $q = $filters['q'];

        return Book::query()
            ->with(['author', 'authors', 'subjects', 'publisher', 'rack'])
            ->withCount(['copies', 'copies as available_count' => fn ($c) => $c->where('status', BookCopy::AVAILABLE)])
            ->when($filters['type'] === 'fisik' || $filters['type'] === 'ebook', fn ($b) => $b->where('type', $filters['type']))
            ->when(in_array($filters['type'], MasterOptions::COLLECTION_TYPES, true), fn ($b) => $b->where('collection_type', $filters['type']))
            ->when($filters['available'], fn ($b) => $b->where(fn ($w) => $w->where('type', Book::EBOOK)->orWhereHas('copies', fn ($c) => $c->where('status', BookCopy::AVAILABLE))))
            ->when($q !== '', fn ($b) => $b->where(fn ($w) => match ($filters['field']) {
                'title' => $w->where('title', 'like', "%{$q}%"),
                'author' => $w->whereRelation('authors', 'name', 'like', "%{$q}%")->orWhereRelation('author', 'name', 'like', "%{$q}%"),
                'subject' => $w->whereRelation('subjects', 'name', 'like', "%{$q}%")
                    ->orWhere('classification', 'like', "{$q}%")->orWhere('call_number', 'like', "%{$q}%"),
                'isbn' => $w->where('isbn', 'like', "%{$q}%"),
                default => $w->where('title', 'like', "%{$q}%")
                    ->orWhere('isbn', 'like', "%{$q}%")
                    ->orWhere('call_number', 'like', "%{$q}%")
                    ->orWhereRelation('authors', 'name', 'like', "%{$q}%")
                    ->orWhereRelation('author', 'name', 'like', "%{$q}%")
                    ->orWhereRelation('subjects', 'name', 'like', "%{$q}%")
                    ->orWhereRelation('publisher', 'name', 'like', "%{$q}%"),
            }))
            ->orderBy('title');
    }

    /**
     * @return array<string, mixed>
     */
    private function card(Book $b): array
    {
        return [
            'id' => $b->id,
            'type' => $b->type,
            'title' => $b->title,
            'series_title' => $b->series_title,
            'author' => $b->author->name,
            'authors' => $b->authorNames(),
            'subjects' => $b->subjects->pluck('name')->all(),
            'publisher' => $b->publisher->name,
            'publish_place' => $b->publish_place,
            'year' => $b->year,
            'edition' => $b->edition,
            'collation' => $b->collation,
            'language' => $b->language,
            'isbn' => $b->isbn,
            'abstract' => $b->abstract,
            'cover' => $b->coverUrl(),
            'ddc_class' => $b->ddc_class,
            'collection_type' => $b->collection_type,
            'call_number' => $b->call_number,
            'rack' => $b->rack?->code,
            'floor' => $b->rack?->floor,
            'copies' => $b->copies_count,
            'available' => $b->available_count,
            'format' => $b->format,
        ];
    }
}
