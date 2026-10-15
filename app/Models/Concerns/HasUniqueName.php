<?php

namespace App\Models\Concerns;

trait HasUniqueName
{
    /**
     * Id of the record with this name, creating it if needed. Matching is
     * case-insensitive on every database, not only MariaDB's collation.
     */
    public static function idForName(string $name): int
    {
        $name = trim($name);

        return static::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->value('id')
            ?? static::create(['name' => $name])->id;
    }
}
