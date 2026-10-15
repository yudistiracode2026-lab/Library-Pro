<?php

namespace App\Http\Controllers\Staf\Master;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Publisher;
use App\Models\Rack;
use App\Support\CsvExport;
use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookController extends Controller
{
    public function index(Request $request): Response
    {
        $books = $this->query($request)->latest('id')->paginate(25)->withQueryString();

        return Inertia::render('staf/master/buku', [
            'records' => $books->through(fn (Book $b) => $this->row($b)),
            'filters' => ['q' => $request->string('q')->toString(), 'jenis' => $request->string('jenis')->toString()],
            'summary' => [
                'printed' => Book::where('type', Book::PRINTED)->count(),
                'copies' => BookCopy::count(),
                'ebooks' => Book::where('type', Book::EBOOK)->count(),
            ],
            'options' => [
                'types' => MasterOptions::forSelect(MasterOptions::BOOK_TYPES),
                'ddc' => collect(MasterOptions::DDC_CLASSES)->map(fn ($l, $c) => ['value' => (string) $c, 'label' => "{$c} · {$l}"])->values(),
                'collectionTypes' => MasterOptions::forSelect(MasterOptions::COLLECTION_TYPES),
                'acquisitions' => MasterOptions::forSelect(MasterOptions::ACQUISITIONS),
                'formats' => MasterOptions::forSelect(MasterOptions::EBOOK_FORMATS),
                'ebookStatuses' => MasterOptions::forSelect(MasterOptions::EBOOK_STATUSES),
                'racks' => Rack::orderBy('code')->get()->map(fn (Rack $r) => ['value' => (string) $r->id, 'label' => "{$r->code} · {$r->name}"]),
                'authors' => Author::orderBy('name')->pluck('name'),
                'publishers' => Publisher::orderBy('name')->pluck('name'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data) {
            $book = Book::create($this->attributes($data));

            if ($book->isPrinted()) {
                $book->syncCopyCount((int) $data['copies']);
            }
        });

        return back()->with('success', 'Koleksi ditambahkan.');
    }

    public function update(Request $request, Book $record): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($record, $data) {
            $record->update($this->attributes($data));

            if ($record->isPrinted()) {
                $record->syncCopyCount((int) $data['copies']);
            } else {
                $record->syncCopyCount(0);
            }
        });

        return back()->with('success', 'Perubahan disimpan.');
    }

    public function destroy(Book $record): RedirectResponse
    {
        if ($record->copies()->where('status', '!=', BookCopy::AVAILABLE)->exists()) {
            return back()->with('error', 'Koleksi ini masih punya eksemplar yang sedang dipinjam atau diproses.');
        }

        $record->delete();

        return back()->with('success', 'Koleksi dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->orderBy('title')->lazy()->map(fn (Book $b) => [
            MasterOptions::BOOK_TYPES[$b->type], $b->title, $b->author->name, $b->publisher->name, $b->year, $b->isbn,
            $b->ddc_class, $b->collection_type, $b->acquisition, $b->donor, $b->call_number, $b->rack?->code,
            $b->isPrinted() ? $b->copies_count : null, $b->isPrinted() ? $b->available_count : null,
            $b->format, $b->license_count, $b->status,
        ]);

        return CsvExport::download('buku-dan-ebook', [
            'Jenis', 'Judul', 'Pengarang', 'Penerbit', 'Tahun', 'ISBN', 'Kelas DDC', 'Klasifikasi koleksi', 'Asal perolehan',
            'Donatur', 'No. panggil', 'Rak', 'Eksemplar', 'Tersedia', 'Format', 'Lisensi', 'Status',
        ], $rows);
    }

    /**
     * @return Builder<Book>
     */
    private function query(Request $request): Builder
    {
        $q = trim($request->string('q')->toString());
        $type = $request->string('jenis')->toString();

        return Book::query()
            ->with(['author', 'publisher', 'rack'])
            ->withCount(['copies', 'copies as available_count' => fn ($c) => $c->where('status', BookCopy::AVAILABLE)])
            ->when(in_array($type, [Book::PRINTED, Book::EBOOK], true), fn ($b) => $b->where('type', $type))
            ->when($q !== '', fn ($b) => $b->where(fn ($w) => $w
                ->where('title', 'like', "%{$q}%")
                ->orWhere('isbn', 'like', "%{$q}%")
                ->orWhere('call_number', 'like', "%{$q}%")
                ->orWhereHas('author', fn ($a) => $a->where('name', 'like', "%{$q}%"))
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
            'author' => $b->author->name,
            'publisher' => $b->publisher->name,
            'year' => $b->year,
            'isbn' => $b->isbn,
            'ddc_class' => $b->ddc_class,
            'collection_type' => $b->collection_type,
            'acquisition' => $b->acquisition,
            'donor' => $b->donor,
            'call_number' => $b->call_number,
            'rack_id' => $b->rack_id ? (string) $b->rack_id : '',
            'rack' => $b->rack?->code,
            'copies' => $b->copies_count,
            'available' => $b->available_count,
            'format' => $b->format,
            'file_size_mb' => $b->file_size_mb,
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

        return $request->validate([
            'type' => ['required', Rule::in(array_keys(MasterOptions::BOOK_TYPES))],
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'publisher' => ['required', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'between:1800,'.(now()->year + 1)],
            'isbn' => ['nullable', 'string', 'max:20'],
            'ddc_class' => ['required', Rule::in(array_keys(MasterOptions::DDC_CLASSES))],
            'collection_type' => ['required', Rule::in(MasterOptions::COLLECTION_TYPES)],
            'acquisition' => ['required', Rule::in(MasterOptions::ACQUISITIONS)],
            'donor' => ['nullable', 'string', 'max:255'],
            'call_number' => [$printed ? 'required' : 'nullable', 'string', 'max:40'],
            'rack_id' => [$printed ? 'required' : 'nullable', 'exists:racks,id'],
            'copies' => [$printed ? 'required' : 'nullable', 'integer', 'min:1', 'max:500'],
            'format' => [$printed ? 'nullable' : 'required', Rule::in(MasterOptions::EBOOK_FORMATS)],
            'file_size_mb' => ['nullable', 'numeric', 'min:0', 'max:9999'],
            'license_count' => [$printed ? 'nullable' : 'required', 'integer', 'min:1', 'max:9999'],
            'status' => [$printed ? 'nullable' : 'required', Rule::in(MasterOptions::EBOOK_STATUSES)],
        ], [], [
            'title' => 'judul', 'author' => 'pengarang', 'publisher' => 'penerbit', 'year' => 'tahun',
            'ddc_class' => 'kelas DDC', 'collection_type' => 'klasifikasi koleksi', 'acquisition' => 'asal perolehan',
            'call_number' => 'nomor panggil', 'rack_id' => 'rak', 'copies' => 'jumlah eksemplar',
            'license_count' => 'jumlah lisensi', 'file_size_mb' => 'ukuran berkas',
        ]);
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
            'author_id' => Author::idForName($data['author']),
            'publisher_id' => Publisher::idForName($data['publisher']),
            'year' => $data['year'] ?? null,
            'isbn' => $data['isbn'] ?? null,
            'ddc_class' => $data['ddc_class'],
            'collection_type' => $data['collection_type'],
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
