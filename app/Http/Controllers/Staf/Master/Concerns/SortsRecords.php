<?php

namespace App\Http\Controllers\Staf\Master\Concerns;

use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Sorting of master lists by a column header: ?urut=<key>&arah=asc|desc.
 * Only the keys a controller lists can be used, so the query string never
 * reaches SQL as a column name.
 */
trait SortsRecords
{
    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  array<string, string|Closure(Builder<TModel>, string): mixed>  $columns  key => column, or a closure ordering the query
     * @param  Closure(Builder<TModel>): mixed  $default  the order when no (known) column is asked for
     * @return Builder<TModel>
     */
    protected function sorted(Builder $query, Request $request, array $columns, Closure $default): Builder
    {
        [$key, $direction] = $this->sort($request, $columns);

        if ($key === null) {
            $default($query);

            return $query;
        }

        $column = $columns[$key];
        $column instanceof Closure ? $column($query, $direction) : $query->orderBy($column, $direction);

        // A stable order for equal values, so pages never repeat or skip rows.
        return $query->orderBy($query->getModel()->getQualifiedKeyName(), $direction);
    }

    /**
     * The sort to show in the list's headers.
     *
     * @param  array<string, mixed>  $columns
     * @return array{urut: string, arah: string}
     */
    protected function sortFilters(Request $request, array $columns): array
    {
        [$key, $direction] = $this->sort($request, $columns);

        return ['urut' => $key ?? '', 'arah' => $direction];
    }

    /**
     * Numbers stored as text in numeric order: "9182415" before "20220311".
     *
     * @return Closure(Builder<Model>, string): void
     */
    protected function numeric(string $column): Closure
    {
        return fn (Builder $query, string $direction) => $query
            ->orderByRaw("LENGTH({$column}) {$direction}")
            ->orderBy($column, $direction);
    }

    /**
     * Values in a given order rather than alphabetical ("IV/e" before "III/a").
     *
     * @param  list<string>  $order
     * @return Closure(Builder<Model>, string): void
     */
    protected function inOrder(string $column, array $order): Closure
    {
        return function (Builder $query, string $direction) use ($column, $order) {
            $cases = implode(' ', array_fill(0, count($order), 'WHEN ? THEN ?'));
            $bindings = [];
            foreach ($order as $i => $value) {
                array_push($bindings, $value, $i);
            }
            $query->orderByRaw("CASE {$column} {$cases} ELSE ".count($order)." END {$direction}", $bindings);
        };
    }

    /**
     * @param  array<string, mixed>  $columns
     * @return array{0: string|null, 1: string}
     */
    private function sort(Request $request, array $columns): array
    {
        $key = $request->string('urut')->toString();

        return [
            array_key_exists($key, $columns) ? $key : null,
            $request->string('arah')->toString() === 'desc' ? 'desc' : 'asc',
        ];
    }
}
