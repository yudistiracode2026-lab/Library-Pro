<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Cover photos taken on the cataloguer's phone: the record is typed on a PC,
 * then the phone opens this list, photographs the book, and the cropped
 * image lands on that record.
 */
class CoverController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim($request->string('q')->toString());
        $all = $request->boolean('semua');

        $books = Book::query()
            ->with('author')
            ->when(! $all && $q === '', fn ($b) => $b->whereNull('cover_path'))
            ->when($q !== '', fn ($b) => $b->where(fn ($w) => $w
                ->where('title', 'like', "%{$q}%")
                ->orWhere('isbn', 'like', "%{$q}%")
                ->orWhere('call_number', 'like', "%{$q}%")
                // The code on a copy's QR label.
                ->orWhereHas('copies', fn ($c) => $c->where('code', $q))))
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('staf/sampul', [
            'books' => $books->through(fn (Book $b) => [
                'id' => $b->id,
                'title' => $b->title,
                'author' => $b->author?->name,
                'year' => $b->year,
                'call_number' => $b->call_number,
                'ddc_class' => $b->ddc_class,
                'type' => $b->type,
                'cover' => $b->coverUrl(),
            ]),
            'filters' => ['q' => $q, 'semua' => $all],
            'missing' => Book::whereNull('cover_path')->count(),
        ]);
    }

    public function store(Request $request, Book $book): RedirectResponse
    {
        $file = $request->validate(['cover' => ['required', 'image', 'max:4096']], [], ['cover' => 'gambar sampul'])['cover'];
        $book->replaceCover($file);

        return back()->with('success', "Sampul {$book->title} tersimpan.");
    }
}
