<?php

namespace App\Support;

/**
 * Title Case for collection titles following PUEBI: every word starts with
 * a capital except function words ("di", "dan", "yang", "of", "the")
 * inside the title. Kept as they are: acronyms (PTSL, BPN, UUPA), words
 * with inner capitals (AutoCAD, ArcGIS, e-KTP), Roman numerals and words
 * with digits. Spacing around punctuation is tidied ("Judul : Sub" ->
 * "Judul: Sub").
 */
class TitleText
{
    /** Function words written in lowercase inside a title. */
    private const SMALL = [
        'di', 'ke', 'dari', 'dan', 'yang', 'untuk', 'pada', 'dalam', 'atau', 'dengan', 'bagi', 'oleh', 'tentang', 'terhadap',
        'sebagai', 'serta', 'kepada', 'daripada', 'sejak', 'hingga', 'sampai', 'tanpa', 'melalui', 'menurut', 'demi', 'karena',
        'agar', 'supaya', 'maupun', 'bahwa', 'antara', 'akan', 'atas', 'per', 'si', 'sang',
        'a', 'an', 'the', 'and', 'or', 'nor', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'with', 'from', 'as', 'into', 'vs', 'via', 'than',
    ];

    /** Acronyms common in a land administration library, besides those learnt from the catalogue. */
    public const ACRONYMS = [
        'PTSL', 'UUPA', 'BPN', 'ATR', 'RI', 'NKRI', 'DIY', 'DKI', 'GIS', 'SIG', 'GPS', 'GNSS', 'CORS', 'RTK', 'UAV', 'RTRW', 'RDTR',
        'HGU', 'HGB', 'HPL', 'HM', 'BUMN', 'BUMD', 'APBN', 'APBD', 'PBB', 'BPHTB', 'PPAT', 'PNS', 'SDM', 'TNI', 'POLRI', 'ABRI', 'UGM',
        'ITB', 'IPB', 'UI', 'STPN', 'LIPI', 'BPS', 'UUD', 'PP', 'UU', 'NTB', 'NTT', 'DPR', 'DPRD', 'MPR', 'KPK', 'NGO', 'LSM', 'KUHP',
        'ISO', 'CSR', 'ICT', 'SPSS', 'PDF', 'SKPD', 'TORA', 'KKP', 'LP2B', 'PKL', 'TA', 'DAS', 'KTP', 'NJOP', 'IMB', 'SHM',
        'PRONA', 'LARASITA', 'IBM', 'PC', 'KUA', 'MoU', 'HAM', 'PBB-P2', 'SKB', 'UMKM', 'IPTEK', 'TIK', 'PKI', 'USA', 'UK', 'UN', 'FAO', 'UNDP',
    ];

    /**
     * @param  array<string, true>  $acronyms  uppercase acronyms to keep
     */
    public static function title(string $title, array $acronyms = []): string
    {
        $title = self::tidy($title);
        $acronyms += array_fill_keys(self::ACRONYMS, true);

        $words = explode(' ', $title);
        $start = true;
        foreach ($words as $i => $token) {
            $words[$i] = self::token($token, $start, $acronyms);
            // The next word starts a (sub)title after ":", " - " or a full stop, and
            // is a name after a place word ("Kalurahan The Hok").
            $start = (bool) preg_match('/[:.!?]$|^[-–—]$/u', $token)
                // A place name after a place word, unless it is an Indonesian function word.
                || (preg_match('/^(kabupaten|kecamatan|kelurahan|kalurahan|desa|kota|kotamadya|kodya|provinsi|propinsi|pulau|kampung|dusun|nagari|distrik)$/iu', $token)
                    && ! in_array(mb_strtolower($words[$i + 1] ?? ''), array_slice(self::SMALL, 0, 37), true));
        }

        return implode(' ', $words);
    }

    /** "Judul : Sub" -> "Judul: Sub", "Kata(PPAT)" -> "Kata (PPAT)", single spaces. */
    public static function tidy(string $title): string
    {
        $title = preg_replace('/\s+/u', ' ', trim($title));
        $title = preg_replace('/\s+([:;,.!?)])/u', '$1', $title);
        $title = preg_replace('/([:;,!?])(?=\p{L})/u', '$1 ', $title);
        $title = preg_replace('/\(\s+/u', '(', $title);
        $title = preg_replace('/(?<=\p{L})\((?=\p{L})/u', ' (', $title);
        $title = preg_replace('/\)(?=\p{L})/u', ') ', $title);
        // An abbreviation glued to the next word: "Kec.Tulang" -> "Kec. Tulang" (not "S.H." or "U.S.A.").
        $title = preg_replace('/(?<![\p{L}.])(\p{L}{2,5})\.(?=\p{L}{2,})/u', '$1. ', $title);

        return trim($title);
    }

    /**
     * @param  array<string, true>  $acronyms
     */
    private static function token(string $token, bool $start, array $acronyms): string
    {
        // Leading and trailing punctuation stay around the word: "(Studi", "Sleman)".
        if (! preg_match('/^(\P{L}*)(.*?)(\P{L}*)$/su', $token, $m) || $m[2] === '') {
            return $token;
        }
        [, $lead, $word, $trail] = $m;
        $start = $start || $lead === '(' || $lead === '"';

        // Case numbers and codes ("149/PID.B/2023/PN") stay as typed; initials
        // ("D.I.", "U.S.A.") are capitals; an acronym in brackets ("(PTPR)") stays.
        if (preg_match('/\d/', $word)) {
            return $token;
        }
        if (preg_match('/^(\p{L}\.)+\p{L}$/u', $word) && str_starts_with($trail, '.')) {
            return $lead.mb_strtoupper($word).$trail;
        }
        if ($lead === '(' && str_starts_with($trail, ')') && $word === mb_strtoupper($word) && mb_strlen($word) <= 6) {
            return $token;
        }

        $parts = preg_split('/([\-\/+&])/u', $word, -1, PREG_SPLIT_DELIM_CAPTURE);
        foreach ($parts as $j => $part) {
            if (in_array($part, ['-', '/', '+', '&', ''], true)) {
                continue;
            }
            $parts[$j] = self::word($part, $start && $j === 0, $acronyms);
        }

        return $lead.implode('', $parts).$trail;
    }

    /**
     * @param  array<string, true>  $acronyms
     */
    private static function word(string $word, bool $start, array $acronyms): string
    {
        $upper = mb_strtoupper($word);
        $lower = mb_strtolower($word);
        $letters = preg_replace('/\P{L}/u', '', $word);

        return match (true) {
            (bool) preg_match('/\d/', $word) => $word,
            // AutoCAD, ArcGIS, iPhone, e-KTP: inner capitals in a word that is not all caps.
            $word !== $upper && (bool) preg_match('/\p{Ll}\p{Lu}/u', $word) => $word,
            isset($acronyms[$upper]) && mb_strlen($letters) >= 2 => $upper,
            // Roman numerals in titles ("Jilid II", "Abad XXI"), not the word "di".
            mb_strlen($word) > 1 && (bool) preg_match('/^(?=[IVXLC]+$)M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/', $upper)
                && $word === $upper && ! in_array($lower, self::SMALL, true) => $upper,
            // Initials: "A.", "S.W."
            (bool) preg_match('/^(\p{L}\.)+$/u', $word) => $upper,
            ! $start && in_array($lower, self::SMALL, true) => $lower,
            default => mb_strtoupper(mb_substr($lower, 0, 1)).mb_substr($lower, 1),
        };
    }

    /**
     * Acronyms as the catalogue writes them: all-caps words in titles that
     * are otherwise in normal case, seen at least twice.
     *
     * Words found in $dictionary are ordinary words written in capitals
     * for emphasis ("Peta TANAH"), not acronyms.
     *
     * @param  iterable<string>  $titles
     * @param  array<string, true>  $dictionary  lowercase words
     * @return array<string, true>
     */
    public static function learnAcronyms(iterable $titles, array $dictionary = []): array
    {
        $seen = [];
        foreach ($titles as $title) {
            $letters = preg_replace('/\P{L}/u', '', (string) $title);
            $caps = preg_replace('/\P{Lu}/u', '', $letters);
            // Skip titles typed (mostly) in capitals: they say nothing about acronyms.
            if ($letters === '' || mb_strlen($caps) / mb_strlen($letters) > 0.4) {
                continue;
            }
            preg_match_all('/(?<![\p{L}])\p{Lu}{2,6}(?![\p{L}])/u', $title, $m);
            foreach ($m[0] as $word) {
                $lower = mb_strtolower($word);
                // Without a dictionary only consonant-only words count ("BPN", not "TANAH").
                $ordinary = $dictionary !== [] ? isset($dictionary[$lower]) : (bool) preg_match('/[AIUEO]/', $word);
                if (! in_array($lower, self::SMALL, true) && ! $ordinary) {
                    $seen[$word] = ($seen[$word] ?? 0) + 1;
                }
            }
        }

        // Long words with several vowels are names written in capitals ("BHUMI", "WIDYA").
        $seen = array_filter($seen, fn ($n, $w) => $n >= 2 && ! (mb_strlen($w) >= 5 && preg_match_all('/[AIUEO]/', $w) >= 2), ARRAY_FILTER_USE_BOTH);

        return array_fill_keys(array_keys($seen), true);
    }
}
