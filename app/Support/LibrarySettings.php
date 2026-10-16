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
        // Students and staff served; the accreditation wants > 0.5 m² of library per person.
        'sivitas' => 3280,
        // Semester procurement budget in rupiah.
        'procurement_budget' => 25000000,
        // When the head of library approved the SiPAPI submission (null until then).
        'accreditation_approved_at' => null,
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
