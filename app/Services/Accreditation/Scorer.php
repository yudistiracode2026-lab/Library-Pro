<?php

namespace App\Services\Accreditation;

use App\Models\Asset;
use App\Models\Book;
use App\Models\Employee;
use App\Models\Indicator;
use App\Models\License;
use App\Models\Loan;
use App\Models\Room;
use App\Models\Visit;
use App\Support\LibrarySettings;
use App\Support\WebsiteContent;
use Illuminate\Support\Collection;

/**
 * Scores the 56 indicators (a = 4 … d = 1) and the final score (NA):
 *   NA = Σ (component score ÷ component max) × component weight
 * per the PRD's reading of the instrument. Indicators with a calculator
 * below are scored from system data; the rest use the staff's manual
 * choice. A value between two options rounds down to the lower option.
 */
class Scorer
{
    /** component => [name, weight] */
    public const COMPONENTS = [
        1 => ['Koleksi', 15],
        2 => ['Sarana dan prasarana', 10],
        3 => ['Pelayanan', 35],
        4 => ['Tenaga', 15],
        5 => ['Penyelenggaraan', 15],
        6 => ['Pengelolaan', 10],
    ];

    /** [minimum NA, letter, label] */
    public const PREDICATES = [
        [91, 'A', 'Sangat Baik'],
        [76, 'B', 'Baik'],
        [60, 'C', 'Cukup Baik'],
        [0, '—', 'Tidak Terakreditasi'],
    ];

    public const LETTERS = [4 => 'a', 3 => 'b', 2 => 'c', 1 => 'd'];

    /** Indicators with a calculator in calculators(). */
    public const COMPUTED = ['1.2', '1.3', '1.7', '1.12', '2.1', '2.2', '2.3', '2.4', '2.5', '2.7', '2.8', '2.9', '2.10', '3.1', '3.2', '4.3', '4.4', '6.7'];

    /**
     * Every indicator with its score, measured value, and whether the
     * score came from system data.
     *
     * @return Collection<string, array{indicator: Indicator, score: int|null, value: string|null, computed: bool}>
     */
    public function evaluate(): Collection
    {
        $calculators = $this->calculators();

        return Indicator::orderBy('position')->get()->mapWithKeys(function (Indicator $indicator) use ($calculators) {
            $computed = isset($calculators[$indicator->number]) ? $calculators[$indicator->number]() : null;

            return [$indicator->number => [
                'indicator' => $indicator,
                'score' => $computed['score'] ?? $indicator->manual_score,
                'value' => $computed['value'] ?? $indicator->manual_value,
                'computed' => $computed !== null,
            ]];
        });
    }

    /**
     * @param  Collection<string, array{indicator: Indicator, score: int|null}>  $results
     * @return array{finalScore: float, predicate: array{letter: string, label: string}, components: list<array<string, mixed>>}
     */
    public function summary(Collection $results): array
    {
        $components = [];
        $finalScore = 0.0;

        foreach (self::COMPONENTS as $number => [$name, $weight]) {
            $items = $results->filter(fn ($r) => $r['indicator']->component === $number);
            $max = $items->count() * 4;
            $score = $items->sum(fn ($r) => $r['score'] ?? 0);
            $contribution = $max > 0 ? $score / $max * $weight : 0;
            $finalScore += $contribution;

            $components[] = [
                'number' => $number,
                'name' => $name,
                'weight' => $weight,
                'score' => $score,
                'max' => $max,
                'count' => $items->count(),
                'contribution' => round($contribution, 2),
                'low' => $items->filter(fn ($r) => ($r['score'] ?? 0) <= 2)->count(),
                'unscored' => $items->filter(fn ($r) => $r['score'] === null)->count(),
            ];
        }

        return ['finalScore' => round($finalScore, 2), 'predicate' => self::predicate($finalScore), 'components' => $components];
    }

    /**
     * NA gained if this indicator rises one option.
     *
     * @param  Collection<string, array{indicator: Indicator}>  $results
     */
    public function gainPerStep(Collection $results, int $component): float
    {
        $count = $results->filter(fn ($r) => $r['indicator']->component === $component)->count();

        return $count > 0 ? self::COMPONENTS[$component][1] / ($count * 4) : 0;
    }

    /**
     * @return array{letter: string, label: string}
     */
    public static function predicate(float $finalScore): array
    {
        foreach (self::PREDICATES as [$min, $letter, $label]) {
            if ($finalScore >= $min) {
                return ['letter' => $letter, 'label' => $label];
            }
        }

        return ['letter' => '—', 'label' => 'Tidak Terakreditasi'];
    }

    /**
     * Score for "> a | ≥ b | ≥ c | below": 4, 3, 2, 1.
     */
    private static function band(float $value, float $a, float $b, float $c): int
    {
        return match (true) {
            $value > $a => 4,
            $value >= $b => 3,
            $value >= $c => 2,
            default => 1,
        };
    }

    private static function num(float $value, int $decimals = 0): string
    {
        return number_format($value, $decimals, ',', '.');
    }

    /**
     * Indicators computed from system data. Each returns ['value', 'score'],
     * or null when the system holds no data yet (the manual score is used).
     *
     * @return array<string, callable(): (array{value: string, score: int}|null)>
     */
    private function calculators(): array
    {
        $sivitas = max(1, (int) LibrarySettings::get('sivitas'));
        $assets = Asset::all();
        $working = fn (string $category) => $assets->where('category', $category)->where('condition', 'Baik')->pluck('function')->unique();

        return [
            // 1.2 Penambahan koleksi: new titles this year ÷ titles at the end of last year
            '1.2' => function () {
                $before = Book::where('created_at', '<', now()->startOfYear())->count();
                $new = Book::where('created_at', '>=', now()->startOfYear())->count();

                if ($before === 0) {
                    return null;
                }

                $pct = $new / $before * 100;

                return ['value' => self::num($pct, 1)."% ({$new} judul baru)", 'score' => self::band($pct, 5, 4, 3)];
            },
            // 1.3 Jenis koleksi: collection types holding at least one title
            '1.3' => function () {
                $types = Book::distinct()->count('collection_type');

                return ['value' => "{$types} jenis berisi", 'score' => self::band($types, 8, 7, 5)];
            },
            // 1.7 Jumlah koleksi: printed + digital titles
            '1.7' => function () {
                $titles = Book::count();

                return ['value' => self::num($titles).' judul cetak + digital', 'score' => self::band($titles, 5000, 3001, 1001)];
            },
            // 1.12 Pengorganisasian: collection types catalogued and searchable in the OPAC
            '1.12' => function () {
                $types = Book::distinct()->count('collection_type');

                return $types === 0 ? null : ['value' => "{$types} dari {$types} jenis terkatalog di OPAC (100%)", 'score' => 4];
            },
            // 2.1 Luas gedung: m² and m² per sivitas
            '2.1' => function () use ($sivitas) {
                $area = (float) Room::where('outside_library', false)->sum('area_m2');
                $per = $area / $sivitas;
                $score = match (true) {
                    $area > 750 && $per > 0.5 => 4,
                    $area >= 500 && $per >= 0.3 => 3,
                    $area >= 300 && $per >= 0.2 => 2,
                    default => 1,
                };

                return ['value' => self::num($area).' m² · '.self::num($per, 2).' m²/sivitas', 'score' => $score];
            },
            // 2.2 Ruang/area: the four basic rooms plus supporting rooms
            '2.2' => function () {
                $rooms = Room::where('outside_library', false)->get();
                $basic = collect(Room::BASIC_TYPES)->filter(fn ($t) => $rooms->contains('type', $t))->count();
                $supporting = $rooms->where('type', 'pendukung')->count();
                $score = match (true) {
                    $basic === 4 && $supporting > 1 => 4,
                    $basic === 4 && $supporting === 1 => 3,
                    $basic >= 3 => 2,
                    default => 1,
                };

                return $rooms->isEmpty() ? null : ['value' => "{$basic} ruang dasar + {$supporting} pendukung", 'score' => $score];
            },
            // 2.3 Sarana prasarana berfungsi: units in good condition ÷ all units
            '2.3' => function () use ($assets) {
                $total = $assets->sum('quantity');

                if ($total === 0) {
                    return null;
                }

                $pct = $assets->where('condition', 'Baik')->sum('quantity') / $total * 100;

                return ['value' => self::num($pct, 1).'% unit berfungsi baik', 'score' => self::band($pct, 75, 61, 41)];
            },
            // 2.4 Perabot: the four basic furniture functions plus supporting ones
            '2.4' => function () use ($assets) {
                $functions = $assets->where('category', 'Perabot')->pluck('function')->unique();
                $basic = collect(array_slice(Asset::FUNCTIONS['Perabot'], 0, 4))->intersect($functions)->count();
                $supporting = $functions->count() - $basic;
                $score = $basic < 4 ? 1 : self::band($supporting, 4, 3, 1);

                return $functions->isEmpty() ? null : ['value' => "{$basic} fungsi dasar + {$supporting} pendukung", 'score' => $score];
            },
            // 2.5 Komputer untuk layanan: service functions with a working computer
            '2.5' => function () use ($working) {
                $services = ['Sirkulasi', 'OPAC', 'Referensi', 'Pengolahan', 'Repositori', 'Baca di tempat'];
                $covered = $working('Komputer')->intersect($services)->count();
                $pct = $covered / count($services) * 100;

                return ['value' => "{$covered} dari ".count($services).' fungsi layanan berkomputer', 'score' => self::band($pct, 75, 51, 26)];
            },
            // 2.7 Perangkat multimedia: working device types
            '2.7' => function () use ($working) {
                $types = $working('Multimedia')->count();

                return ['value' => "{$types} jenis berfungsi", 'score' => self::band($types, 5, 4, 2)];
            },
            // 2.8 Lisensi: licensed or open-source applications ÷ all applications
            '2.8' => function () {
                $total = License::count();

                if ($total === 0) {
                    return null;
                }

                $ok = License::whereIn('status', ['Berlisensi', 'Open source'])->count();
                $pct = $ok / $total * 100;

                return ['value' => "{$ok} dari {$total} aplikasi berlisensi (".self::num($pct).'%)', 'score' => self::band($pct, 75, 61, 41)];
            },
            // 2.9 Sarana keamanan: working safety and security facilities
            '2.9' => function () use ($working) {
                $types = $working('Keamanan')->count();

                return ['value' => "{$types} sarana berfungsi", 'score' => self::band($types, 5, 4, 2)];
            },
            // 2.10 Fasilitas umum: of the seven required public facilities
            '2.10' => function () use ($assets) {
                $present = collect(Asset::REQUIRED_FACILITIES)->intersect($assets->where('category', 'Fasilitas umum')->pluck('function'))->count();

                return ['value' => "{$present} dari 7 fasilitas", 'score' => self::band($present, 6, 5, 3)];
            },
            // 3.1 Jam layanan: weekly opening hours from the website schedule
            '3.1' => function () {
                $hours = WebsiteContent::weeklyHours();

                return ['value' => self::num($hours, 1).' jam/minggu', 'score' => self::band($hours, 51, 46, 40)];
            },
            // 3.2 Jenis layanan: services offered
            '3.2' => function () {
                $count = count(WebsiteContent::SERVICES);

                return ['value' => "{$count} jenis aktif", 'score' => self::band($count, 8, 7, 5)];
            },
            // 4.3 Jumlah pustakawan: librarians ÷ (sivitas ÷ 600)
            '4.3' => function () use ($sivitas) {
                $count = Employee::where('kind', 'pustakawan')->where('status', 'Aktif')->count();
                $pct = $count / ($sivitas / 600) * 100;

                return ['value' => "{$count} pustakawan untuk ".self::num($sivitas)." sivitas ({$this->cap($pct)})", 'score' => self::band($pct, 75, 51, 26)];
            },
            // 4.4 Jumlah tenaga teknis: support staff ÷ (sivitas ÷ 1.200)
            '4.4' => function () use ($sivitas) {
                $count = Employee::where('kind', 'tendik')->where('status', 'Aktif')->count();
                $pct = $count / ($sivitas / 1200) * 100;

                return ['value' => "{$count} tenaga teknis ({$this->cap($pct)})", 'score' => self::band($pct, 75, 51, 26)];
            },
            // 6.7 Pemanfaatan: members who borrowed or visited in the last year ÷ sivitas.
            // Option a also needs users from abroad, which the system does not record.
            '6.7' => function () use ($sivitas) {
                $since = now()->subYear();
                $active = Loan::where('loaned_at', '>=', $since)->distinct()->pluck('member_id')
                    ->merge(Visit::where('checked_in_at', '>=', $since)->whereNotNull('member_id')->distinct()->pluck('member_id'))
                    ->unique()->count();
                $pct = $active / $sivitas * 100;

                return ['value' => self::num($pct, 1)."% sivitas aktif ({$active} orang)", 'score' => min(3, self::band($pct, 75, 61, 41))];
            },
        ];
    }

    private function cap(float $pct): string
    {
        return $pct > 999 ? '> 999%' : self::num($pct).'%';
    }
}
