<?php

namespace App\Http\Controllers\Staf\Master;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Staf\Master\Concerns\SortsRecords;
use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\Subject;
use App\Services\DdcSuggestions;
use App\Support\CsvExport;
use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookController extends Controller
{
    use SortsRecords;

    public function index(Request $request): Response
    {
        $books = $this->sorted($this->query($request), $request, $this->sortColumns(), fn ($b) => $b->latest('id'))->paginate(25)->withQueryString();

        return Inertia::render('staf/master/buku', [
            'records' => $books->through(fn (Book $b) => $this->row($b)),
            'filters' => ['q' => $request->string('q')->toString(), 'jenis' => $request->string('jenis')->toString(), ...$this->sortFilters($request, $this->sortColumns())],
            'summary' => [
                'printed' => Book::where('type', Book::PRINTED)->count(),
                'copies' => BookCopy::count(),
                'ebooks' => Book::where('type', Book::EBOOK)->count(),
            ],
            'options' => [
                'types' => MasterOptions::forSelect(MasterOptions::BOOK_TYPES),
                'ddc' => collect(MasterOptions::DDC_CLASSES)->map(fn ($l, $c) => ['value' => (string) $c, 'label' => "{$c} · {$l}"])->values(),
                'collectionTypes' => MasterOptions::collectionTypeOptions(),
                'materialTypes' => MasterOptions::forSelect(MasterOptions::MATERIAL_TYPES),
                'acquisitions' => MasterOptions::forSelect(MasterOptions::ACQUISITIONS),
                'formats' => MasterOptions::forSelect(MasterOptions::EBOOK_FORMATS),
                'ebookStatuses' => MasterOptions::forSelect(MasterOptions::EBOOK_STATUSES),
                'racks' => Rack::orderBy('code')->get()->map(fn (Rack $r) => ['value' => (string) $r->id, 'label' => "{$r->code} · {$r->name}"]),
                'languages' => MasterOptions::forSelect(MasterOptions::LANGUAGES),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($request, $data) {
            $book = Book::create($this->attributes($data));
            $this->saveRelations($request, $book, $data);

            if ($book->isPrinted()) {
                $book->syncCopyCount((int) $data['copies']);
            }
        });

        return back()->with('success', 'Koleksi ditambahkan.');
    }

    public function update(Request $request, Book $record): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($request, $record, $data) {
            $record->update($this->attributes($data));
            $this->saveRelations($request, $record, $data);

            if ($record->isPrinted()) {
                $record->syncCopyCount((int) $data['copies']);
            } else {
                $record->syncCopyCount(0);
            }
        });

        return back()->with('success', 'Perubahan disimpan.');
    }

    /**
     * Attaches the PDF of an e-book. EPUB titles are listed but only PDF can
     * be read in the member portal for now.
     */
    public function uploadFile(Request $request, Book $book): RedirectResponse
    {
        abort_unless($book->type === Book::EBOOK, 404);
        $file = $request->validate(['file' => ['required', 'file', 'mimes:pdf', 'max:51200']], [], ['file' => 'berkas e-book'])['file'];

        if ($book->file_path) {
            Storage::disk('local')->delete($book->file_path);
        }

        $book->update([
            'file_path' => $file->storeAs('ebook', "ebook-{$book->id}-".now()->format('YmdHis').'.pdf', 'local'),
            'format' => 'PDF',
            'file_size_mb' => round($file->getSize() / 1048576, 1),
        ]);

        return back()->with('success', "Berkas {$book->title} terunggah.");
    }

    /**
     * Up to 12 names starting with (then containing) what was typed, for the
     * author, publisher, subject and place fields: the master lists are too
     * long to send with the page.
     */
    public function suggest(Request $request): JsonResponse
    {
        $q = trim($request->string('q')->toString());
        $kind = $request->string('jenis')->toString();

        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        [$query, $column] = match ($kind) {
            'penerbit' => [Publisher::query(), 'name'],
            'subjek' => [Subject::query(), 'name'],
            'tempat' => [Book::query()->whereNotNull('publish_place')->distinct(), 'publish_place'],
            default => [Author::query(), 'name'],
        };

        $starts = (clone $query)->where($column, 'like', "{$q}%")->orderBy($column)->limit(12)->pluck($column);
        $contains = $starts->count() < 12
            ? (clone $query)->where($column, 'like', "%{$q}%")->where($column, 'not like', "{$q}%")->orderBy($column)->limit(12 - $starts->count())->pluck($column)
            : collect();

        return response()->json($starts->concat($contains)->values());
    }

    /** DDC numbers to suggest for the title being catalogued (Library of Congress and this catalogue). */
    public function ddcSuggestions(Request $request, DdcSuggestions $suggestions): JsonResponse
    {
        $data = $request->validate([
            'isbn' => ['nullable', 'string', 'max:40'],
            'title' => ['nullable', 'string', 'max:500'],
            'subjects' => ['nullable', 'array', 'max:30'],
            'subjects.*' => ['string', 'max:255'],
            'id' => ['nullable', 'integer'],
        ]);

        return response()->json($suggestions->for($data['isbn'] ?? null, $data['title'] ?? null, $data['subjects'] ?? [], $data['id'] ?? null));
    }

    public function destroy(Book $record): RedirectResponse
    {
        if ($record->copies()->where('status', '!=', BookCopy::AVAILABLE)->exists()) {
            return back()->with('error', 'Koleksi ini masih punya eksemplar yang sedang dipinjam atau diproses.');
        }

        $record->delete();

        if ($record->cover_path) {
            Storage::disk('local')->delete($record->cover_path);
        }

        return back()->with('success', 'Koleksi dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->with('subjects')->orderBy('title')->lazy()->map(fn (Book $b) => [
            MasterOptions::BOOK_TYPES[$b->type], $b->title, $b->series_title, implode('; ', $b->authorNames()), $b->publisher->name, $b->publish_place,
            $b->year, $b->edition, $b->collation, $b->language, $b->isbn, $b->classification, $b->ddc_class, $b->material_type, $b->collectionCategory(), $b->collection_type,
            $b->subjects->pluck('name')->implode('; '), $b->acquisition, $b->donor, $b->call_number, $b->rack?->code,
            $b->isPrinted() ? $b->copies_count : null, $b->isPrinted() ? $b->available_count : null,
            $b->format, $b->license_count, $b->status, $b->featured ? 'Ya' : '',
        ]);

        return CsvExport::download('buku-dan-ebook', [
            'Jenis', 'Judul', 'Judul seri', 'Pengarang', 'Penerbit', 'Tempat terbit', 'Tahun', 'Edisi', 'Kolasi', 'Bahasa', 'ISBN',
            'Klasifikasi', 'Kelas DDC', 'Jenis bahan', 'Jenis koleksi', 'Sub-jenis koleksi', 'Subjek', 'Asal perolehan', 'Donatur', 'No. panggil', 'Rak',
            'Eksemplar', 'Tersedia', 'Format', 'Lisensi', 'Status', 'Unggulan',
        ], $rows);
    }

    /**
     * Columns of the list that can be sorted by their header.
     *
     * @return array<string, mixed>
     */
    private function sortColumns(): array
    {
        return [
            'judul' => 'title',
            'jenis' => 'type',
            'perolehan' => 'acquisition',
            'koleksi' => 'collection_type',
            'bahan' => 'material_type',
            'lokasi' => 'call_number',
            'tersedia' => 'available_count',
            'status' => fn ($b, $direction) => $b->orderBy('status', $direction)->orderBy('available_count', $direction),
        ];
    }

    /**
     * @return Builder<Book>
     */
    private function query(Request $request): Builder
    {
        $q = trim($request->string('q')->toString());
        $type = $request->string('jenis')->toString();

        return Book::query()
            ->with(['author', 'authors', 'subjects', 'publisher', 'rack'])
            ->withCount(['copies', 'copies as available_count' => fn ($c) => $c->where('status', BookCopy::AVAILABLE)])
            ->when(in_array($type, [Book::PRINTED, Book::EBOOK], true), fn ($b) => $b->where('type', $type))
            ->when($q !== '', fn ($b) => $b->where(fn ($w) => $w
                ->where('title', 'like', "%{$q}%")
                ->orWhere('isbn', 'like', "%{$q}%")
                ->orWhere('call_number', 'like', "%{$q}%")
                ->orWhere('classification', 'like', "{$q}%")
                ->orWhereHas('authors', fn ($a) => $a->where('name', 'like', "%{$q}%"))
                ->orWhereHas('author', fn ($a) => $a->where('name', 'like', "%{$q}%"))
                ->orWhereHas('subjects', fn ($t) => $t->where('name', 'like', "%{$q}%"))
                ->orWhereHas('publisher', fn ($p) => $p->where('name', 'like', "%{$q}%"))));
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Book $b): array
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
            'classification' => $b->classification,
            'abstract' => $b->abstract,
            'cover' => $b->coverUrl(),
            'featured' => $b->featured,
            'ddc_class' => $b->ddc_class,
            'collection_type' => $b->collection_type,
            'collection_category' => $b->collectionCategory(),
            'material_type' => $b->material_type,
            'acquisition' => $b->acquisition,
            'donor' => $b->donor,
            'call_number' => $b->call_number,
            'rack_id' => $b->rack_id ? (string) $b->rack_id : '',
            'rack' => $b->rack?->code,
            'copies' => $b->copies_count,
            'available' => $b->available_count,
            'format' => $b->format,
            'file_size_mb' => $b->file_size_mb,
            'has_file' => $b->file_path !== null,
            'license_count' => $b->license_count,
            'status' => $b->status,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $printed = $request->input('type') === Book::PRINTED;

        $data = $request->validate([
            'type' => ['required', Rule::in(array_keys(MasterOptions::BOOK_TYPES))],
            'title' => ['required', 'string', 'max:255'],
            'series_title' => ['nullable', 'string', 'max:255'],
            'authors' => ['required', 'array', 'min:1', 'max:20'],
            'authors.*' => ['required', 'string', 'max:255'],
            'publisher' => ['required', 'string', 'max:255'],
            'publish_place' => ['nullable', 'string', 'max:100'],
            'year' => ['nullable', 'integer', 'between:1800,'.(now()->year + 1)],
            'edition' => ['nullable', 'string', 'max:50'],
            'collation' => ['nullable', 'string', 'max:100'],
            'language' => ['required', Rule::in(MasterOptions::LANGUAGES)],
            'isbn' => ['nullable', 'string', 'max:20'],
            'classification' => ['nullable', 'string', 'max:40'],
            'ddc_class' => ['nullable', Rule::in(array_keys(MasterOptions::DDC_CLASSES))],
            'subjects' => ['nullable', 'array', 'max:20'],
            'subjects.*' => ['required', 'string', 'max:255'],
            'abstract' => ['nullable', 'string', 'max:10000'],
            'cover' => ['nullable', 'image', 'max:2048'],
            'featured' => ['boolean'],
            'collection_type' => ['required', Rule::in(MasterOptions::COLLECTION_TYPES)],
            'material_type' => ['nullable', Rule::in(MasterOptions::MATERIAL_TYPES)],
            'acquisition' => ['required', Rule::in(MasterOptions::ACQUISITIONS)],
            'donor' => ['nullable', 'string', 'max:255'],
            'call_number' => [$printed ? 'required' : 'nullable', 'string', 'max:40'],
            'rack_id' => ['nullable', 'exists:racks,id'],
            'copies' => [$printed ? 'required' : 'nullable', 'integer', 'min:0', 'max:500'],
            'format' => [$printed ? 'nullable' : 'required', Rule::in(MasterOptions::EBOOK_FORMATS)],
            'file_size_mb' => ['nullable', 'numeric', 'min:0', 'max:9999'],
            'license_count' => [$printed ? 'nullable' : 'required', 'integer', 'min:1', 'max:9999'],
            'status' => [$printed ? 'nullable' : 'required', Rule::in(MasterOptions::EBOOK_STATUSES)],
        ], [
            'authors.required' => 'Isi minimal satu pengarang.',
        ], [
            'title' => 'judul', 'series_title' => 'judul seri', 'authors' => 'pengarang', 'publisher' => 'penerbit',
            'publish_place' => 'tempat terbit', 'year' => 'tahun', 'edition' => 'edisi', 'collation' => 'kolasi', 'language' => 'bahasa',
            'classification' => 'klasifikasi', 'subjects' => 'subjek', 'abstract' => 'abstrak', 'cover' => 'gambar sampul',
            'ddc_class' => 'kelas DDC', 'collection_type' => 'sub-jenis koleksi', 'material_type' => 'jenis bahan', 'acquisition' => 'asal perolehan',
            'call_number' => 'nomor panggil', 'rack_id' => 'rak', 'copies' => 'jumlah eksemplar',
            'license_count' => 'jumlah lisensi', 'file_size_mb' => 'ukuran berkas',
        ]);

        // The main class follows the classification number when there is one.
        $data['ddc_class'] = Book::ddcClassOf($data['classification'] ?? null) ?? ($data['ddc_class'] ?? null);

        if ($data['ddc_class'] === null) {
            throw ValidationException::withMessages(['ddc_class' => 'Isi klasifikasi atau pilih kelas DDC.']);
        }

        return $data;
    }

    /**
     * Authors, subjects and the cover image, which live outside the books row.
     *
     * @param  array<string, mixed>  $data
     */
    private function saveRelations(Request $request, Book $book, array $data): void
    {
        $book->syncAuthors($data['authors']);
        $book->syncSubjects($data['subjects'] ?? []);

        if ($request->hasFile('cover')) {
            $old = $book->cover_path;
            $file = $request->file('cover');
            $book->update(['cover_path' => $file->storeAs('sampul', "sampul-{$book->id}-".now()->format('YmdHis').'.'.$file->extension(), 'local')]);

            if ($old) {
                Storage::disk('local')->delete($old);
            }
        }
    }

    /**
     * Author and publisher are typed freely, as in the prototype; unknown
     * names become new master records.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributes(array $data): array
    {
        $printed = $data['type'] === Book::PRINTED;

        return [
            'type' => $data['type'],
            'title' => $data['title'],
            'series_title' => $data['series_title'] ?? null,
            'author_id' => Author::idForName($data['authors'][0]),
            'publisher_id' => Publisher::idForName($data['publisher']),
            'publish_place' => $data['publish_place'] ?? null,
            'year' => $data['year'] ?? null,
            'edition' => $data['edition'] ?? null,
            'collation' => $data['collation'] ?? null,
            'language' => $data['language'],
            'isbn' => $data['isbn'] ?? null,
            'classification' => $data['classification'] ?? null,
            'abstract' => $data['abstract'] ?? null,
            'featured' => (bool) ($data['featured'] ?? false),
            'ddc_class' => $data['ddc_class'],
            'collection_type' => $data['collection_type'],
            'material_type' => $data['material_type'] ?? Book::materialTypeOf($data['type'], $data['collection_type']),
            'acquisition' => $data['acquisition'],
            'donor' => $data['acquisition'] === 'Sumbangan mahasiswa' ? ($data['donor'] ?? null) : null,
            'call_number' => $printed ? $data['call_number'] : null,
            'rack_id' => $printed ? $data['rack_id'] : null,
            'format' => $printed ? null : $data['format'],
            'file_size_mb' => $printed ? null : ($data['file_size_mb'] ?? null),
            'license_count' => $printed ? null : $data['license_count'],
            'status' => $printed ? null : $data['status'],
        ];
    }
}
