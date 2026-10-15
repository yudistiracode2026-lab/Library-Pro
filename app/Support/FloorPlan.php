<?php

namespace App\Support;

/**
 * Fixed areas drawn on each floor plan (positions in percent), from the
 * prototype's FLOORS data. Rack positions live on the racks table; both
 * become editable in the "Ruang & denah" module (stage 4).
 */
class FloorPlan
{
    /** floor => list of [label, x, y, w, h, lucide icon] */
    public const FIXTURES = [
        1 => [
            ['Meja sirkulasi', 4, 52, 26, 10, 'repeat'],
            ['Pintu masuk', 42, 82, 18, 12, 'door-open'],
            ['Komputer OPAC', 66, 52, 28, 10, 'monitor'],
        ],
        2 => [
            ['Ruang baca', 6, 54, 60, 30, 'book-open'],
            ['Tangga', 80, 60, 14, 26, 'arrow-up-down'],
        ],
        3 => [
            ['Ruang diskusi 1–4', 52, 8, 42, 34, 'users-round'],
            ['Area komputer', 52, 50, 42, 18, 'monitor'],
            ['Tangga', 8, 72, 20, 18, 'arrow-up-down'],
        ],
    ];

    /**
     * @return array<int, list<array{label: string, x: int, y: int, w: int, h: int, icon: string}>>
     */
    public static function fixtures(): array
    {
        return array_map(
            fn (array $items) => array_map(fn (array $f) => array_combine(['label', 'x', 'y', 'w', 'h', 'icon'], $f), $items),
            self::FIXTURES,
        );
    }
}
