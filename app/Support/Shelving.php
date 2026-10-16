<?php

namespace App\Support;

use App\Models\Book;
use App\Models\Rack;

/**
 * Where a title sits on its rack: shelves are filled in call-number order,
 * the same number of titles per shelf. Used by the staff search map and the
 * member catalogue.
 */
class Shelving
{
    /**
     * @return array<string, mixed>
     */
    public static function rack(Rack $rack, ?Book $selected = null): array
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
                    'count' => $onShelf->count(),
                ];
            }),
            'books' => $placed,
        ];
    }
}
