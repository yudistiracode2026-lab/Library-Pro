<?php

namespace App\Http\Controllers\Staf\Master;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Publisher;
use App\Support\CsvExport;
use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PublisherController extends Controller
{
    public function index(Request $request): Response
    {
        $publishers = $this->query($request)->orderBy('name')->paginate(25)->withQueryString();

        return Inertia::render('staf/master/penerbit', [
            'records' => $publishers->through(fn (Publisher $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'city' => $p->city,
                'status' => $p->status,
                'printed_count' => $p->printed_count,
                'ebook_count' => $p->ebook_count,
            ]),
            'filters' => ['q' => $request->string('q')->toString()],
            'options' => ['statuses' => MasterOptions::forSelect(MasterOptions::ACTIVE_STATUSES)],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Publisher::create($this->validated($request));

        return back()->with('success', 'Penerbit ditambahkan.');
    }

    public function update(Request $request, Publisher $record): RedirectResponse
    {
        $record->update($this->validated($request, $record));

        return back()->with('success', 'Perubahan disimpan.');
    }

    public function destroy(Publisher $record): RedirectResponse
    {
        if ($record->books()->exists()) {
            return back()->with('error', 'Penerbit ini masih dipakai di data koleksi.');
        }

        $record->delete();

        return back()->with('success', 'Penerbit dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->orderBy('name')->lazy()
            ->map(fn (Publisher $p) => [$p->name, $p->city, $p->printed_count, $p->ebook_count, $p->status]);

        return CsvExport::download('penerbit', ['Penerbit', 'Kota', 'Buku fisik', 'E-book', 'Status'], $rows);
    }

    /**
     * @return Builder<Publisher>
     */
    private function query(Request $request): Builder
    {
        $q = trim($request->string('q')->toString());

        return Publisher::query()
            ->withCount([
                'books as printed_count' => fn ($b) => $b->where('type', Book::PRINTED),
                'books as ebook_count' => fn ($b) => $b->where('type', Book::EBOOK),
            ])
            ->when($q !== '', fn ($p) => $p->where(fn ($w) => $w->where('name', 'like', "%{$q}%")->orWhere('city', 'like', "%{$q}%")));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Publisher $publisher = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('publishers')->ignore($publisher)],
            'city' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(MasterOptions::ACTIVE_STATUSES)],
        ], [], ['name' => 'nama penerbit', 'city' => 'kota']);
    }
}
