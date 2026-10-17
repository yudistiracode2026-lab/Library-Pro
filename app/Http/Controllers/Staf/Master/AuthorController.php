<?php

namespace App\Http\Controllers\Staf\Master;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Support\CsvExport;
use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuthorController extends Controller
{
    public function index(Request $request): Response
    {
        $authors = $this->query($request)->orderBy('name')->paginate(25)->withQueryString();

        return Inertia::render('staf/master/pengarang', [
            'records' => $authors->through(fn (Author $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'type' => $a->type,
                'books_count' => $a->books_count,
                'sample' => $a->books->first()?->title,
            ]),
            'filters' => ['q' => $request->string('q')->toString()],
            'options' => ['types' => MasterOptions::forSelect(MasterOptions::AUTHOR_TYPES)],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Author::create($this->validated($request));

        return back()->with('success', 'Pengarang ditambahkan.');
    }

    public function update(Request $request, Author $record): RedirectResponse
    {
        $record->update($this->validated($request, $record));

        return back()->with('success', 'Perubahan disimpan.');
    }

    public function destroy(Author $record): RedirectResponse
    {
        if ($record->books()->exists() || $record->credits()->exists()) {
            return back()->with('error', 'Pengarang ini masih dipakai di data koleksi.');
        }

        $record->delete();

        return back()->with('success', 'Pengarang dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->orderBy('name')->lazy()->map(fn (Author $a) => [$a->name, $a->type, $a->books_count]);

        return CsvExport::download('pengarang', ['Pengarang', 'Jenis', 'Judul di koleksi'], $rows);
    }

    /**
     * @return Builder<Author>
     */
    private function query(Request $request): Builder
    {
        $q = trim($request->string('q')->toString());

        return Author::query()
            ->withCount('books')
            ->with(['books' => fn ($b) => $b->select('id', 'author_id', 'title')->orderBy('title')])
            ->when($q !== '', fn ($a) => $a->where('name', 'like', "%{$q}%"));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Author $author = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('authors')->ignore($author)],
            'type' => ['required', Rule::in(MasterOptions::AUTHOR_TYPES)],
        ], [], ['name' => 'nama pengarang', 'type' => 'jenis']);
    }
}
