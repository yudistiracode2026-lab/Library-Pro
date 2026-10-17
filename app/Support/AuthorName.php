<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Cleaning of author names typed over the years in SLiMS: "et al." markers,
 * several people in one entry, spacing around titles and degrees, and the
 * key that tells two spellings of the same person apart from two people.
 *
 * A name is read as [prefix titles] [the name itself], [degrees], e.g.
 * "Prof. Dr. | Soerjono Soekanto | S.H., M.A.".
 */
class AuthorName
{
    /** Titles before a name, compared lowercase without dots. */
    private const PREFIXES = ['prof', 'dr', 'drs', 'dra', 'ir', 'h', 'hj', 'kh', 'mr', 'ust', 'hc'];

    /** Degrees, compared lowercase without dots and spaces. */
    private const DEGREES = [
        'sh', 'se', 'st', 'ssi', 'spd', 'skom', 'ssos', 'sip', 'sp', 'ss', 'sst', 'ssit', 'sag', 'sei', 'sked', 'stp', 'shi', 'sth',
        'skm', 'sfarm', 'apt', 'spsi', 'shum', 'sfil', 'shut', 'spn', 'sp1', 'sp2', 'stat', 'sars', 'spt', 'ssn',
        'mm', 'msi', 'mt', 'mpd', 'mh', 'mhum', 'mkn', 'meng', 'msc', 'ma', 'mag', 'mec', 'mak', 'mkes', 'ms', 'mp', 'mse', 'mhi',
        'mth', 'mcl', 'msp', 'mmsi', 'mpsi', 'mfil', 'mhut', 'mba', 'mpa', 'mpp', 'mcrp', 'msm', 'mppm', 'mea', 'mecdev', 'mling',
        'amd', 'ap', 'aptnh', 'phd', 'ba', 'eds', 'su', 'murp', 'llm', 'dea', 'dess', 'cpa', 'ak', 'cn', 'mnotary', 'dipl', 'ing',
        'advdem', 'mt', 'msi', 'mpd', 'drs', 'dra', 'ir', 'dr', 'llb', 'bsc', 'mphil', 'md', 'mag', 'dipling',
    ];

    /** The standard spelling of common degrees, by their letters. */
    private const STANDARD = [
        'sh' => 'S.H.', 'se' => 'S.E.', 'st' => 'S.T.', 'ssi' => 'S.Si.', 'spd' => 'S.Pd.', 'skom' => 'S.Kom.', 'ssos' => 'S.Sos.',
        'sip' => 'S.IP.', 'ss' => 'S.S.', 'sst' => 'S.ST.', 'ssit' => 'S.SiT.', 'sag' => 'S.Ag.', 'sp' => 'S.P.', 'shi' => 'S.H.I.',
        'stp' => 'S.TP.', 'skm' => 'S.K.M.', 'mm' => 'M.M.', 'msi' => 'M.Si.', 'mt' => 'M.T.', 'mpd' => 'M.Pd.', 'mh' => 'M.H.',
        'mhum' => 'M.Hum.', 'mkn' => 'M.Kn.', 'meng' => 'M.Eng.', 'msc' => 'M.Sc.', 'ma' => 'M.A.', 'ms' => 'M.S.', 'mpa' => 'M.P.A.',
        'mba' => 'M.B.A.', 'mag' => 'M.Ag.', 'mkes' => 'M.Kes.', 'mp' => 'M.P.', 'mhi' => 'M.H.I.', 'mec' => 'M.Ec.', 'mcrp' => 'M.C.R.P.',
        'phd' => 'Ph.D.', 'aptnh' => 'A.Ptnh.', 'amd' => 'A.Md.', 'ap' => 'A.P.', 'llm' => 'LL.M.', 'su' => 'S.U.', 'murp' => 'M.U.R.P.',
    ];

    /** Words that mark an organisation rather than a person. */
    private const ORGANISATION = '/\b(badan|kantor|kementerian|kementrian|departemen|direktorat|ditjen|pusat|lembaga|universitas|fakultas|jurusan|tim|team|dinas|proyek|yayasan|institut|sekolah|biro|bagian|komisi|dewan|menteri|mentri|perpustakaan|balai|kelompok|panitia|bank|kanwil|pemerintah|pemda|provinsi|propinsi|kabupaten|kota|redaksi|penerbit|program|seksi|sub|unit|asosiasi|ikatan|forum|konsorsium|corporation|corp|company|inc|ltd|press|society|association|council|ministry|department|office|institute|university|center|centre|foundation|organization|organisation|agency|bureau|commission|committee|service|survey|limited|co|pt|cv|tbk|red|editor|science|education|studies|research|publishing|publisher|books|media|group|bidang|sekretariat|sekmeneg|deputi|divisi|subdit|lingkungan|kependudukan|nasional|indonesia|republik|ri|bpn|stpn|ugm|itb|ipb|ui|lipi|bps|bappenas|depdikbud|abri|fao|unesco|undp|usaid|world)\b/iu';

    public static function isOrganisation(string $name, ?string $type = null): bool
    {
        return $type === 'Lembaga'
            || (bool) preg_match(self::ORGANISATION, $name)
            || (bool) preg_match('/^[A-Z0-9&.\-]{2,8}$/', trim($name));
    }

    /**
     * The entry without "dkk" markers, with tidy spacing and Title Case;
     * null when nothing is left. "Prof. DR.Kaelan,M.S" -> "Prof. Dr. Kaelan, M.S".
     */
    public static function clean(string $name, bool $organisation = false): ?string
    {
        $name = preg_replace('/\s+/u', ' ', $name);
        // "dkk", "dkk.", "dkk 6 orang", ", et al." at the end.
        $name = preg_replace('/[\s,;]*\b(dkk|et\.? ?al\b).*$/iu', '', $name);
        // Leading punctuation (". Wantjik Saleh") and stray trailing separators.
        $name = trim(ltrim($name, " \t.,;:-/"));
        $name = rtrim($name, " \t,;:-/");
        // A connector left by a cut-off list ("John David Neidel and").
        $name = preg_replace('/\s+(?:dan|and|&)$/iu', '', $name);
        // A space after a title glued to the name ("DR.Kaelan") and after commas.
        $name = preg_replace('/\b(Prof|Dr|Drs|Dra|Ir|Hj|KH|Mr)\.(?=\p{L})/iu', '$1. ', $name);
        // A title written without its dot before the name: "Prof. Dr Husaini" -> "Prof. Dr. Husaini".
        $name = preg_replace('/\b(Prof|Dr|Drs|Dra|Ir|Hj|KH)(?=\s+\p{L})/iu', '$1.', $name);
        // "S,H." -> "S.H.": a comma typed for a dot inside a degree.
        $name = preg_replace('/(?<=\b\p{Lu}),(?=\p{L}{1,3}(\.|\b))/u', '.', $name);
        // One comma between parts, never empty ones (", , ,," -> ", ").
        $name = trim(preg_replace('/\s*(,\s*)+/u', ', ', $name), ' ,');

        if ($name === '') {
            return null;
        }

        $name = NameCase::title($name, $organisation);

        if (! $organisation) {
            // "M.Yahya" -> "M. Yahya", "C.S.T.Kansil" -> "C.S.T. Kansil" (in the name, not the degrees).
            [$prefixes, $core, $degrees] = self::parts($name);
            $core = preg_replace('/\.(?=\p{Lu}\p{Ll})/u', '. ', $core);
            $name = self::join($prefixes, $core, $degrees);
        }

        return $name;
    }

    /**
     * Several people typed in one entry, split on ";", " dan ", " and ",
     * " & " and the commas of such a list. Organisations are never split.
     *
     * @return list<string>
     */
    public static function people(string $name, ?string $type = null): array
    {
        $organisation = self::isOrganisation($name, $type);

        if ($organisation) {
            return array_values(array_filter([self::clean($name, true)]));
        }

        // "X, dkk" means "X and others": drop the marker before splitting.
        $name = preg_replace('/[\s,;]*\b(dkk|et\.? ?al\b).*$/iu', '', $name);
        // A semicolon typed for an apostrophe ("Syafi;ie") and "Prof, Dr." for "Prof. Dr.".
        $name = preg_replace('/(\p{L});(\p{Ll})/u', "$1'$2", $name);
        $name = preg_replace('/\b(Prof|Dr|Drs|Dra|Ir)\s*,\s*(?=(Prof|Dr|Drs|Dra|Ir|H)\b)/iu', '$1. ', $name);
        $parts = self::attachTitles(preg_split('/\s*;\s*|,?\s+(?:dan0?|and|&)\s+/iu', $name));

        // "A, B and C" or "A, B": commas separate people too. Degree pieces
        // ("S.H.", "M.A.P.") go back to the name before them.
        $expanded = [];
        foreach ($parts as $part) {
            $pieces = [];
            foreach (array_filter(array_map('trim', explode(',', $part)), fn ($p) => $p !== '') as $piece) {
                if ($pieces !== [] && self::looksLikeDegrees($piece)) {
                    $pieces[count($pieces) - 1] .= ', '.$piece;
                } else {
                    $pieces[] = $piece;
                }
            }
            // One-word names count when the list also has full names ("A B, Suharno, C D").
            $full = count(array_filter($pieces, fn ($p) => self::looksLikePerson(self::parts($p)[1])));
            $single = count(array_filter($pieces, fn ($p) => (bool) preg_match('/^\p{Lu}\p{Ll}{3,}$/u', self::parts($p)[1])));
            $split = count($pieces) > 1 && $full >= 1 && $full + $single === count($pieces);
            array_push($expanded, ...($split ? $pieces : [$part]));
        }
        $parts = $expanded;

        // Only split when every piece reads as a person ("Griffin And George" is a firm).
        if (count($parts) > 1 && count(array_filter($parts, fn ($p) => self::looksLikePerson($p) || preg_match('/^\p{Lu}\p{Ll}{3,}$/u', $p))) !== count($parts)) {
            $parts = [$name];
        }

        return array_values(array_unique(array_filter(array_map(fn ($p) => self::clean($p), $parts))));
    }

    /**
     * A piece that is only prefix titles ("Prof. Dr" in "Prof. Dr; Husaini
     * Usman") belongs to the name after it.
     *
     * @param  list<string>  $parts
     * @return list<string>
     */
    private static function attachTitles(array $parts): array
    {
        $out = [];
        $carry = '';
        foreach ($parts as $part) {
            $words = preg_split('/\s+/u', trim($part), -1, PREG_SPLIT_NO_EMPTY);
            if ($words !== [] && collect($words)->every(fn ($w) => in_array(self::flat($w), self::PREFIXES, true))) {
                $carry .= implode(' ', $words).' ';
            } else {
                $out[] = $carry.trim($part);
                $carry = '';
            }
        }

        return $out;
    }

    /**
     * Matching key: the name itself without titles, degrees, punctuation,
     * case and accents. "Dr. Aslan Noor, S.H., M.H., Sp1" -> "aslannoor".
     */
    /**
     * The key without single-letter initials: "John D. Nystuen" and "John
     * Nystuen" -> "johnnystuen". Empty when fewer than two words remain.
     */
    public static function keyWithoutInitials(string $name): string
    {
        $words = array_filter(preg_split('/[\s.]+/u', Str::lower(Str::ascii(self::parts($name)[1]))), fn ($w) => strlen(preg_replace('/[^a-z]/', '', $w)) > 1);

        return count($words) >= 2 ? preg_replace('/[^a-z]/', '', implode('', $words)) : '';
    }

    /** The initials of a name, in order: "John D. Nystuen" -> "d". */
    public static function initials(string $name): string
    {
        $words = preg_split('/[\s.]+/u', Str::lower(Str::ascii(self::parts($name)[1])), -1, PREG_SPLIT_NO_EMPTY);

        return implode('', array_filter($words, fn ($w) => strlen(preg_replace('/[^a-z]/', '', $w)) === 1));
    }

    public static function key(string $name): string
    {
        return preg_replace('/[^a-z]/', '', Str::lower(Str::ascii(self::parts($name)[1])));
    }

    /**
     * @return array{0: list<string>, 1: string, 2: string} prefix titles, the name, degrees
     */
    public static function parts(string $name): array
    {
        // Degrees start at the first comma whose remainder is all degrees:
        // "Prof. Soedjito, Sosrodihardjo, SH, MA" -> "SH, MA".
        $degrees = '';
        $offset = 0;
        while (($comma = mb_strpos($name, ',', $offset)) !== false) {
            if (self::looksLikeDegrees(trim(mb_substr($name, $comma + 1)))) {
                $degrees = trim(mb_substr($name, $comma + 1));
                $name = trim(mb_substr($name, 0, $comma));
                break;
            }
            $offset = $comma + 1;
        }
        $name = rtrim($name, ' ,');

        $words = explode(' ', trim($name));
        $prefixes = [];
        while (count($words) > 1 && in_array(self::flat($words[0]), self::PREFIXES, true)) {
            $prefixes[] = array_shift($words);
        }

        // Degrees typed without a comma at the end ("Dadiyono SSi").
        $tail = [];
        while (count($words) > 1 && self::isDegree(end($words))) {
            array_unshift($tail, array_pop($words));
        }
        if ($tail !== []) {
            $degrees = trim(implode(' ', $tail).($degrees !== '' ? ', '.$degrees : ''));
        }

        return [$prefixes, implode(' ', $words), $degrees];
    }

    /**
     * @param  list<string>  $prefixes
     */
    public static function join(array $prefixes, string $core, string $degrees): string
    {
        // "M. Si" -> "M.Si", then "S.H" -> "S.H.", "M.Hum" -> "M.Hum.": dotted degrees end with a dot.
        $degrees = preg_replace('/\b(\p{Lu})\. (\p{L}{1,3})\b/u', '$1.$2', $degrees);
        // "M.SI" -> "M.Si", "M.HUM" -> "M.Hum": the usual case of degree parts.
        $degrees = preg_replace_callback('/(?<=\.)(SI|HUM|PD|KOM|SOS|SIT|ENG|SC|AG|KN|KES|EC|PSI|FIL|HUT|FARM|TH)\b/u',
            fn ($m) => ['SIT' => 'SiT'][$m[1]] ?? ucfirst(strtolower($m[1])), $degrees);
        // Common degrees in their standard spelling ("SH", "S.H" -> "S.H."); a
        // degree list typed without commas ("SH.MH", "SH MM") is split first.
        $tokens = [];
        foreach (array_filter(array_map('trim', explode(',', $degrees))) as $d) {
            $pieces = preg_split('/\s+|(?<=\.)(?=\p{L})/u', $d);
            $all = $pieces !== [] && collect($pieces)->every(fn ($p) => isset(self::STANDARD[self::flat($p)]));
            array_push($tokens, ...(count($pieces) > 1 && $all ? $pieces : [$d]));
        }
        $degrees = implode(', ', array_map(
            fn ($d) => self::STANDARD[self::flat($d)] ?? (preg_match('/^(\p{L}{1,4}\.)+\p{L}{1,5}$/u', $d) ? $d.'.' : $d),
            $tokens,
        ));

        return rtrim(trim(implode(' ', [...$prefixes, $core])), ' ,').($degrees !== '' ? ', '.$degrees : '');
    }

    /** How many degrees, preferring the dotted standard spelling ("S.H." over "SH"). */
    public static function degreeScore(string $degrees): int
    {
        if ($degrees === '') {
            return 0;
        }

        // More degrees first; then dotted, unspaced, not shouted ("M.Si." over "M. SI").
        return count(array_filter(explode(',', $degrees))) * 100 + substr_count($degrees, '.') * 3
            - substr_count($degrees, ' ') + (preg_match('/\p{Ll}/u', $degrees) ? 1 : 0);
    }

    /** Lowercase without dots and spaces: "S.H." -> "sh". */
    public static function flat(string $word): string
    {
        return Str::lower(str_replace(['.', ' '], '', $word));
    }

    private static function isDegree(string $word): bool
    {
        $flat = self::flat($word);

        if (in_array($flat, self::DEGREES, true)) {
            return true;
        }

        $parts = array_filter(explode('.', Str::lower(trim($word, '.'))));

        return count($parts) > 1 && array_diff($parts, self::DEGREES) === [];
    }

    /**
     * Degrees after a comma, including rare or glued ones: "S.H., M.Hum.",
     * "SS.M.HuM", "S.U. Psikolog", "Dipl. T.", "M. Devt.M.".
     */
    private static function looksLikeDegrees(string $text): bool
    {
        $parts = array_filter(array_map('trim', preg_split('/[,]+/u', $text)));

        foreach ($parts as $part) {
            if (! self::isDegree($part) && ! collect(preg_split('/\s+/u', $part))->every(fn ($w) => self::isDegree($w)
                || preg_match('/^(\p{L}{1,5}\.)+(\p{L}{1,5}\.?)?$/u', $w)
                || in_array(Str::lower(trim($w, '.')), ['psikolog', 'akuntan', 'apoteker', 'notaris', 'ppat', 'dipl', 'psi', 'cert', 'mediator', 'adv', 'cfp', 'cpa'], true))) {
                return false;
            }
        }

        return $parts !== [];
    }

    /** Two or more words, or an initial: "Henry M. Kendall", "R. Weibel" — not "George". */
    private static function looksLikePerson(string $text): bool
    {
        $text = trim($text);

        return $text !== '' && ! preg_match(self::ORGANISATION, $text)
            && ! preg_match('/\b(the|of|for|volume|vol|process|setting)\b/iu', $text)
            && (str_word_count(Str::ascii($text)) >= 2 || str_contains($text, '.'))
            && str_word_count(Str::ascii($text)) <= 6;
    }
}
