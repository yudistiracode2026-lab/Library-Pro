<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Book covers live on the private disk (no storage:link needed on shared
 * hosting) and are public like the catalogue itself.
 */
class CoverController extends Controller
{
    public function __invoke(Book $book): BinaryFileResponse
    {
        abort_unless($book->cover_path && Storage::disk('local')->exists($book->cover_path), 404);

        return response()->file(Storage::disk('local')->path($book->cover_path), [
            // The URL carries a version, so a long cache is safe.
            'Cache-Control' => 'public, max-age=2592000, immutable',
        ]);
    }
}
