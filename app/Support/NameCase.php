<?php

namespace App\Support;

/**
 * Title Case for personal names as librarians write them in Indonesia:
 * "MUH.BILAL RAMADHAN" -> "Muh.Bilal Ramadhan", "na'afi" -> "Na'afi".
 *
 * A name typed all in capitals (or all lowercase) is rewritten completely.
 * In a name that already mixes cases only the words typed all lowercase or
 * as long all-caps words change, so initials ("Ozzy Sefriana NP", "BQ
 * Uswatun") and deliberate spellings stay. Academic degrees after the
 * first comma and known degrees at the end stay as typed, particles such
 * as "bin" stay lowercase, and anything with digits is left alone.
 */
class NameCase
{
    /** Degrees, compared without dots and case, kept as typed when they end a name. */
    private const DEGREES = [
        'sh', 'se', 'st', 'ssi', 'spd', 'skom', 'ssos', 'sip', 'sp', 'ss', 'sst', 'ssit', 'sag', 'sei', 'sked', 'stp',
        'mm', 'msi', 'mt', 'mpd', 'mh', 'mhum', 'mkn', 'meng', 'msc', 'ma', 'mag', 'mec', 'mak', 'mkes',
        'amd', 'ap', 'aptnh', 'phd',
    ];

    /** Titles before a name, in their usual spelling. */
    private const PREFIXES = ['dr.' => 'Dr.', 'drs.' => 'Drs.', 'dra.' => 'Dra.', 'ir.' => 'Ir.', 'prof.' => 'Prof.', 'h.' => 'H.', 'hj.' => 'Hj.'];

    /** Names after the Balinese "I": "I Made", "Drs. I Ketut". */
    private const BALINESE = ['made', 'md', 'wayan', 'wyn', 'ketut', 'kt', 'nyoman', 'nym', 'putu', 'pt', 'gede', 'gde', 'gd', 'gusti', 'gst',
        'dewa', 'dw', 'komang', 'kadek', 'nengah', 'kade', 'ngurah', 'nyoman', 'nyomam', 'luh', 'nengah', 'kompiang', 'agung', 'wy', 'k'];

    private const PARTICLES = ['bin', 'binti', 'van', 'der', 'den', 'de', 'von', 'da', 'di'];

    /**
     * @param  bool  $organisation  keep acronyms ("BPN", "STPN") even when the whole name is in capitals
     */
    public static function title(?string $name, bool $organisation = false): string
    {
        $name = trim(preg_replace('/\s+/u', ' ', (string) $name));

        if ($name === '' || preg_match('/\d/', $name)) {
            return $name;
        }

        [$proper, $degrees] = array_pad(explode(',', $name, 2), 2, null);
        $words = explode(' ', trim($proper));
        $mixed = $organisation || (preg_match('/\p{Lu}/u', $proper) && preg_match('/\p{Ll}/u', $proper));

        // Degrees written without a comma at the end of the name.
        $tail = [];
        while (count($words) > 1 && self::isDegree(end($words))) {
            array_unshift($tail, array_pop($words));
        }

        foreach ($words as $i => $word) {
            $lower = mb_strtolower($word);
            $words[$i] = match (true) {
                isset(self::PREFIXES[$lower]) => self::PREFIXES[$lower],
                // "bin", "van": lowercase, unless a mixed name capitalises it on purpose.
                $i > 0 && in_array($lower, self::PARTICLES, true) && (! $mixed || $word === $lower) => $lower,
                // "M.irza": a lowercase letter right after an initial.
                ! $mixed, $word === $lower, (bool) preg_match('/\.\p{Ll}/u', $word) => self::word($word),
                // A shouted word, not an initialism such as "ARWBK".
                $word === mb_strtoupper($word) && mb_strlen(preg_replace('/\P{L}/u', '', $word)) > 3
                    && preg_match_all('/[AIUEO]/u', $word) >= 2 => self::word($word),
                default => $word,
            };
        }

        if (! $organisation) {
            $words = self::initials($words);
        }

        return implode(' ', [...$words, ...$tail]).($degrees !== null ? ','.$degrees : '');
    }

    /**
     * Initials end with a dot and are followed by a space, as in PUEBI:
     * "A Abuzar" -> "A. Abuzar", "M.Yahya" -> "M. Yahya", "A.W Widjaja"
     * -> "A.W. Widjaja". The Balinese "I" (I Wayan, I Gusti) is not an
     * initial and stays as it is.
     *
     * @param  list<string>  $words
     * @return list<string>
     */
    public static function initials(array $words): array
    {
        $out = [];
        foreach (array_values($words) as $i => $word) {
            // The Balinese "I": before a Balinese name, or first in the name (after any titles).
            $first = collect(array_slice($words, 0, $i))->every(fn ($w) => isset(self::PREFIXES[mb_strtolower($w)]));
            if ($word === 'I' && isset($words[$i + 1]) && ($first || in_array(mb_strtolower(rtrim($words[$i + 1], '.')), self::BALINESE, true))) {
                $out[] = $word;

                continue;
            }

            // An abbreviation glued to the next name: "M.Yahya", "Muh.Bilal".
            $word = preg_replace('/\.(?=\p{Lu}\p{Ll})/u', '. ', $word);

            foreach (explode(' ', $word) as $piece) {
                $out[] = preg_match('/^(\p{Lu}\.)*\p{Lu}$/u', $piece) ? $piece.'.' : $piece;
            }
        }

        return $out;
    }

    /** "SSi", "M.Si.", "SH.MH": a degree, or degrees joined by dots. */
    private static function isDegree(string $word): bool
    {
        $lower = mb_strtolower(trim($word, '.'));

        if (in_array(str_replace('.', '', $lower), self::DEGREES, true)) {
            return true;
        }

        $parts = explode('.', $lower);

        return count($parts) > 1 && array_diff($parts, self::DEGREES) === [];
    }

    /** "MUH.BILAL" -> "Muh.Bilal", "SITI-NUR" -> "Siti-Nur", "MA'RUF" -> "Ma'ruf". */
    private static function word(string $word): string
    {
        return preg_replace_callback(
            '/(^|[.\-_\/(])(\p{Ll})/u',
            fn ($m) => $m[1].mb_strtoupper($m[2]),
            mb_strtolower($word),
        );
    }
}
