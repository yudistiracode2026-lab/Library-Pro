<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Once;

/**
 * Library rules editable from Portal Staf > Pengaturan. Unsaved keys fall
 * back to the prototype's defaults (plus a fine per late day).
 */
class LibrarySettings
{
    public const DEFAULTS = [
        'loan_days' => 7,
        'max_loans' => 3,
        'max_extensions' => 1,
        'fine_per_day' => 500,
        'clearance_no_loans' => true,
        'clearance_thesis' => true,
        'clearance_donation' => true,
        'clearance_hardcopy' => true,
    ];

    public static function get(string $key): mixed
    {
        return self::all()[$key];
    }

    /**
     * Read once per request.
     *
     * @return array<string, mixed>
     */
    public static function all(): array
    {
        return once(fn () => array_merge(self::DEFAULTS, Setting::pluck('value', 'key')->all()));
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public static function save(array $values): void
    {
        foreach (array_intersect_key($values, self::DEFAULTS) as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Once::flush();
    }
}
