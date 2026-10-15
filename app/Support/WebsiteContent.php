<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Once;

/**
 * Public website content edited from Portal Staf > CMS website. The
 * opening-hours schedule also drives accreditation IK 3.1 (weekly hours).
 */
class WebsiteContent
{
    public const DEFAULTS = [
        'website_hero_title' => 'Sumber pengetahuan pertanahan dan agraria Indonesia',
        'website_hero_subtitle' => 'Cari buku, skripsi, jurnal, dan peta koleksi Perpustakaan Politeknik Agraria. Pinjam, perpanjang, dan urus bebas pustaka langsung dari portal pemustaka.',
        // days: 0 = Minggu … 6 = Sabtu; times null = tutup
        'website_schedule' => [
            ['label' => 'Senin – Kamis', 'days' => [1, 2, 3, 4], 'open' => '08:00', 'close' => '16:00', 'break_minutes' => 60, 'note' => 'Istirahat 12.00 – 13.00'],
            ['label' => 'Jumat', 'days' => [5], 'open' => '08:00', 'close' => '16:30', 'break_minutes' => 90, 'note' => 'Istirahat 11.30 – 13.00'],
            ['label' => 'Sabtu', 'days' => [6], 'open' => '09:00', 'close' => '13:00', 'break_minutes' => 0, 'note' => 'Ruang baca saja'],
            ['label' => 'Minggu & libur nasional', 'days' => [0], 'open' => null, 'close' => null, 'break_minutes' => 0, 'note' => 'Repositori daring tetap aktif'],
        ],
    ];

    /** Services offered; also the count for IK 3.2 (jenis layanan). */
    public const SERVICES = [
        ['repeat', 'Sirkulasi', 'Pinjam hingga 3 buku selama 7 hari, bisa diperpanjang sekali.'],
        ['file-check-2', 'Bebas pustaka', 'Cek pinjaman dan unggah skripsi untuk surat bebas pustaka.'],
        ['tablet-smartphone', 'E-book', 'Pinjam dan baca e-book langsung dari portal pemustaka.'],
        ['book-lock', 'Baca di tempat', 'Baca teks lengkap skripsi, tesis, dan disertasi di perpustakaan.'],
        ['message-circle-question', 'Layanan referensi', 'Bantuan penelusuran literatur dan sitasi.'],
        ['database', 'Repositori digital', 'Akses skripsi dan jurnal STPN secara daring.'],
        ['lightbulb', 'Usulan koleksi', 'Usulkan buku yang belum ada di perpustakaan.'],
    ];

    public const FACILITIES = [
        ['book-open', 'Ruang baca utama', '120 kursi, pencahayaan alami, dan area senyap di lantai 2.'],
        ['users-round', 'Ruang diskusi', '4 ruang untuk 6–10 orang. Tanyakan ketersediaan di meja sirkulasi.'],
        ['monitor', 'Komputer OPAC & internet', '12 unit komputer dengan akses e-jurnal dan repositori.'],
        ['map', 'Pojok koleksi agraria', 'Koleksi khusus peta, arsip pertanahan, dan terbitan STPN Press.'],
        ['graduation-cap', 'Ruang skripsi & repositori', 'Skripsi, tugas akhir, dan laporan PKL sejak 1995.'],
        ['lock', 'Loker & Wi-Fi', '80 loker dengan kartu anggota. Wi-Fi kampus di seluruh lantai.'],
    ];

    /**
     * @return array{hero_title: string, hero_subtitle: string, schedule: list<array<string, mixed>>}
     */
    public static function all(): array
    {
        $stored = once(fn () => Setting::whereIn('key', array_keys(self::DEFAULTS))->pluck('value', 'key')->all());
        $values = array_merge(self::DEFAULTS, $stored);

        return [
            'hero_title' => $values['website_hero_title'],
            'hero_subtitle' => $values['website_hero_subtitle'],
            'schedule' => $values['website_schedule'],
        ];
    }

    /**
     * @param  array{hero_title?: string, hero_subtitle?: string, schedule?: list<array<string, mixed>>}  $values
     */
    public static function save(array $values): void
    {
        foreach (['hero_title', 'hero_subtitle', 'schedule'] as $key) {
            if (array_key_exists($key, $values)) {
                Setting::updateOrCreate(['key' => "website_{$key}"], ['value' => $values[$key]]);
            }
        }

        Once::flush();
    }

    /**
     * Service hours per week, net of breaks.
     */
    public static function weeklyHours(): float
    {
        $minutes = 0;

        foreach (self::all()['schedule'] as $row) {
            if (! $row['open'] || ! $row['close']) {
                continue;
            }

            $daily = Carbon::parse($row['open'])->diffInMinutes(Carbon::parse($row['close'])) - (int) $row['break_minutes'];
            $minutes += max(0, $daily) * count($row['days']);
        }

        return round($minutes / 60, 1);
    }

    /**
     * Today's schedule row and whether the library is open right now.
     *
     * @return array{row: array<string, mixed>|null, open: bool}
     */
    public static function today(): array
    {
        $row = collect(self::all()['schedule'])->first(fn ($r) => in_array(now()->dayOfWeek, $r['days'], true));
        $open = $row && $row['open'] && now()->between(now()->setTimeFromTimeString($row['open']), now()->setTimeFromTimeString($row['close']));

        return ['row' => $row, 'open' => (bool) $open];
    }
}
