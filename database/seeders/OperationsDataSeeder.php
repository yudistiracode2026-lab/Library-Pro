<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Asset;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Camera;
use App\Models\CameraEvent;
use App\Models\CollectionSuggestion;
use App\Models\Employee;
use App\Models\License;
use App\Models\Loan;
use App\Models\Member;
use App\Models\NewPublication;
use App\Models\OpnameCheck;
use App\Models\OpnameSession;
use App\Models\OvertimeSession;
use App\Models\ProcurementItem;
use App\Models\Rack;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Sample data for the operations modules, from design/ManajemenAset.dc.html
 * and design/Portal Staf.dc.html, with dates relative to today.
 */
class OperationsDataSeeder extends Seeder
{
    /** code, floor, name, type, area m², x, y, w, h */
    public const ROOMS = [
        ['f1', 1, 'Ruang Dosen', 'kerja', 24, 0, 0, 17, 26], ['f2', 1, 'Ruang Dosen', 'kerja', 22, 17, 0, 25, 16],
        ['f3', 1, 'P4MI', 'kerja', 42, 42, 0, 21, 36], ['f4', 1, 'Ruang PPPM', 'kerja', 32, 63, 0, 37, 16],
        ['f5', 1, 'Klinik', 'fasum', 32, 0, 26, 17, 34], ['f6', 1, 'Humas', 'kerja', 38, 0, 60, 17, 40],
        ['f7', 1, 'Ruang Dosen', 'kerja', 28, 17, 16, 25, 20], ['f8', 1, 'Selasar', 'pendukung', 18, 63, 16, 16, 20],
        ['f9', 1, 'Selasar & area tengah', 'pendukung', 220, 17, 36, 62, 64], ['f10', 1, 'Toilet', 'fasum', 18, 79, 16, 21, 21],
        ['f11', 1, 'Tangga', 'non', 16, 79, 37, 21, 20], ['f12', 1, 'Ruang Dosen', 'kerja', 26, 79, 57, 21, 22],
        ['f13', 1, 'Ruang Kapti', 'kerja', 24, 79, 79, 21, 21],
        ['r8', 2, 'Rak buku', 'koleksi', 72, 0, 0, 18, 100], ['r9', 2, 'Ruang baca & komputer penelusuran', 'baca', 76, 18, 0, 19, 100],
        ['r20', 2, 'Ruang pengelolaan', 'kerja', 59, 37, 0, 40, 37], ['r10', 2, 'Ruang kepala perpustakaan', 'pendukung', 23, 77, 0, 23, 25],
        ['r21', 2, 'Void', 'non', 0, 37, 37, 23, 26], ['r22', 2, 'Loket peminjaman & warung kejujuran', 'layanan', 17, 37, 63, 23, 19],
        ['r31', 2, 'Area baca tambahan', 'baca', 11, 37, 82, 15, 18], ['r23', 2, 'Lobi & mesin presensi', 'pendukung', 31, 60, 37, 17, 45],
        ['r11', 2, 'Area loker', 'pendukung', 23, 77, 57, 23, 25], ['r12', 2, 'Toilet', 'fasum', 14, 77, 25, 23, 15],
        ['r13', 2, 'Tangga', 'non', 16, 77, 40, 23, 17], ['r24', 2, 'Area lesehan', 'pendukung', 18, 52, 82, 25, 18],
        ['r17', 2, 'Ruang TI & pengelolaan', 'pendukung', 17, 77, 82, 23, 18],
        ['r14', 3, 'Ruang koleksi skripsi, tesis & disertasi', 'koleksi', 126, 0, 0, 77, 41], ['r25', 3, 'Meja petugas', 'layanan', 26, 77, 0, 23, 28],
        ['r26', 3, 'Ruang referensi, koleksi asing & arsip', 'koleksi', 50, 0, 41, 33, 38], ['r27', 3, 'Void', 'non', 0, 33, 41, 27, 37],
        ['r28', 3, 'Studio musik', 'pendukung', 28, 0, 79, 33, 21], ['r18', 3, 'Ruang tunggu', 'pendukung', 25, 60, 41, 17, 37],
        ['r15', 3, 'Area diskusi', 'pendukung', 59, 33, 78, 67, 22], ['r29', 3, 'Toilet', 'fasum', 14, 77, 28, 23, 15],
        ['r30', 3, 'Tangga', 'non', 32, 77, 43, 23, 35],
    ];

    /** name, category, function, room code, quantity, condition */
    private const ASSETS = [
        ['Rak buku baja double face', 'Perabot', 'Penyimpanan koleksi', 'r8', 42, 'Baik'], ['Rak buku kayu', 'Perabot', 'Penyimpanan koleksi', 'r8', 18, 'Rusak ringan'],
        ['Rak buku baja', 'Perabot', 'Penyimpanan koleksi', 'r8', 30, 'Baik'], ['Meja baca kelompok', 'Perabot', 'Membaca', 'r9', 24, 'Baik'],
        ['Kursi baca', 'Perabot', 'Membaca', 'r9', 120, 'Baik'], ['Kursi baca lama', 'Perabot', 'Membaca', 'r9', 16, 'Rusak berat'],
        ['Meja sirkulasi', 'Perabot', 'Layanan sirkulasi', 'r22', 2, 'Baik'], ['Meja kerja pengolahan', 'Perabot', 'Kerja pengolahan', 'r20', 4, 'Baik'],
        ['Rak display koleksi baru', 'Perabot', 'Display koleksi baru', 'r8', 3, 'Baik'], ['Troli buku', 'Perabot', 'Troli buku', 'r20', 4, 'Baik'],
        ['Sofa baca santai', 'Perabot', 'Area baca santai', 'r9', 6, 'Baik'], ['Papan informasi', 'Perabot', 'Papan informasi', 'r23', 2, 'Baik'],
        ['Meja diskusi', 'Perabot', 'Diskusi kelompok', 'r15', 8, 'Baik'], ['PC sirkulasi', 'Komputer', 'Sirkulasi', 'r22', 2, 'Baik'],
        ['PC OPAC', 'Komputer', 'OPAC', 'r9', 6, 'Baik'], ['PC pengolahan', 'Komputer', 'Pengolahan', 'r20', 3, 'Baik'],
        ['Server repositori', 'Komputer', 'Repositori', 'r17', 1, 'Baik'], ['Terminal baca di tempat', 'Komputer', 'Baca di tempat', 'r14', 4, 'Baik'],
        ['PC area komputer', 'Komputer', 'Akses internet', 'r18', 10, 'Baik'], ['PC area komputer (lama)', 'Komputer', 'Akses internet', 'r18', 2, 'Rusak berat'],
        ['Proyektor', 'Multimedia', 'Proyektor', 'r18', 2, 'Baik'], ['Smart TV 65 inci', 'Multimedia', 'Layar TV', 'r15', 4, 'Baik'],
        ['Sound system', 'Multimedia', 'Sound system', 'r18', 1, 'Baik'], ['Kamera dokumentasi', 'Multimedia', 'Kamera', 'r20', 1, 'Baik'],
        ['Scanner buku A3', 'Multimedia', 'Scanner', 'r20', 1, 'Rusak berat'], ['Printer multifungsi', 'Multimedia', 'Printer', 'r22', 2, 'Baik'],
        ['Perangkat video conference', 'Multimedia', 'Video conference', 'r15', 1, 'Baik'], ['CCTV', 'Keamanan', 'CCTV', 'r23', 8, 'Baik'],
        ['APAR', 'Keamanan', 'APAR', 'r23', 6, 'Baik'], ['Security gate', 'Keamanan', 'Security gate', 'r23', 1, 'Rusak ringan'],
        ['Detektor asap', 'Keamanan', 'Detektor asap', 'r9', 10, 'Baik'], ['Alarm kebakaran', 'Keamanan', 'Alarm kebakaran', 'r23', 1, 'Baik'],
        ['Rambu jalur evakuasi', 'Keamanan', 'Jalur evakuasi', 'r23', 12, 'Baik'], ['Kotak P3K', 'Keamanan', 'P3K', 'r22', 2, 'Baik'],
        ['Toilet', 'Fasilitas umum', 'Toilet', 'r12', 6, 'Baik'], ['Mushola', 'Fasilitas umum', 'Mushola', 'r23', 1, 'Baik'],
        ['Loker pemustaka (80 pintu)', 'Fasilitas umum', 'Loker', 'r23', 80, 'Baik'], ['Area parkir', 'Fasilitas umum', 'Parkir', 'r23', 1, 'Baik'],
        ['Pantry', 'Fasilitas umum', 'Pantry', 'r20', 1, 'Baik'],
    ];

    /** Loans per title over the last six months (prototype's LOAN6). */
    private const LOAN_HISTORY = [1 => 46, 2 => 38, 3 => 41, 4 => 29, 5 => 20, 6 => 18, 7 => 33, 8 => 25, 10 => 22, 16 => 24, 18 => 31, 22 => 27, 26 => 19];

    public function run(): void
    {
        $this->rooms();
        $this->licenses();
        $this->opname();
        $this->procurement();
        $this->activities();
        $this->overtime();
        $this->cameras();
    }

    private function rooms(): void
    {
        $ids = [];

        foreach (self::ROOMS as [$code, $floor, $name, $type, $area, $x, $y, $w, $h]) {
            $ids[$code] = Room::create([
                'floor' => $floor, 'name' => $name, 'type' => $type, 'area_m2' => $area,
                'map_x' => $x, 'map_y' => $y, 'map_w' => $w, 'map_h' => $h, 'outside_library' => $floor === 1,
            ])->id;
        }

        foreach (self::ASSETS as $i => [$name, $category, $function, $room, $qty, $condition]) {
            Asset::create([
                'name' => $name, 'category' => $category, 'function' => $function, 'room_id' => $ids[$room],
                'quantity' => $qty, 'condition' => $condition, 'acquired_year' => 2016 + $i % 9,
            ]);
        }
    }

    private function licenses(): void
    {
        foreach ([
            ['Windows 11 Pro', 'Sistem operasi PC layanan', 'OEM', 25, 'Berlisensi'],
            ['Microsoft Office 2021', 'Pengolahan dan administrasi', 'Volume license', 12, 'Berlisensi'],
            ['SLiMS (otomasi perpustakaan)', 'Katalog dan sirkulasi', 'GPL v3', 1, 'Open source'],
            ['Antivirus endpoint', 'Keamanan PC', 'Langganan tahunan', 25, 'Berlisensi'],
            ['Adobe Acrobat Pro', 'Pengolahan PDF skripsi', null, 3, 'Tidak berlisensi'],
            ['Zotero', 'Kelas literasi sitasi', 'AGPL', 12, 'Open source'],
            ['Turnitin', 'Cek plagiarisme', 'Langganan institusi', 1, 'Berlisensi'],
            ['CorelDRAW', 'Desain poster kegiatan', null, 1, 'Tidak berlisensi'],
            ['QGIS', 'Area komputer (SIG)', 'GPL', 12, 'Open source'],
        ] as [$name, $usage, $type, $seats, $status]) {
            License::create(['name' => $name, 'usage' => $usage, 'license_type' => $type, 'seats' => $seats, 'status' => $status]);
        }
    }

    private function opname(): void
    {
        $session = OpnameSession::create([
            'name' => 'Stock opname semester ganjil '.now()->year.'/'.(now()->year + 1),
            'started_at' => today()->startOfMonth()->setTime(8, 0),
            'started_by' => User::where('email', 'yosep@perpus.test')->value('id'),
        ]);

        // Racks A1–A3 are done; one damaged and one missing copy among them.
        $copies = BookCopy::where('status', BookCopy::AVAILABLE)
            ->whereHas('book', fn ($b) => $b->whereIn('rack_id', Rack::whereIn('code', ['A1', 'A2', 'A3'])->pluck('id')))
            ->orderBy('id')->get();

        foreach ($copies as $i => $copy) {
            OpnameCheck::create([
                'opname_session_id' => $session->id,
                'book_copy_id' => $copy->id,
                'result' => match ($i) {
                    3 => OpnameCheck::DAMAGED,
                    7 => OpnameCheck::MISSING,
                    default => OpnameCheck::FOUND,
                },
                'checked_at' => $session->started_at->copy()->addHours(2 + $i % 5),
            ]);
        }
    }

    private function procurement(): void
    {
        foreach ([
            ['Kadaster Multiguna: Konsep dan Implementasi', 'Randy Wirawan', 'STPN Press', 2026, '300', 125000, 'Terbitan terbaru STPN Press'],
            ['Pemetaan Bidang Tanah dengan Drone RTK', 'Agung Prasetyo', 'ITB Press', 2026, '600', 145000, 'Mendukung mata kuliah Fotogrametri'],
            ['Hukum Pengadaan Tanah untuk Kepentingan Umum', 'Maria S.W. Sumardjono', 'Penerbit Buku Kompas', 2025, '300', 110000, '32 pencarian OPAC tanpa hasil'],
            ['QGIS 3 untuk Analisis Spasial', 'Arif Rahman', 'Informatika', 2025, '000', 98000, '27 pencarian OPAC tanpa hasil'],
            ['Tata Ruang Pesisir dan Pulau-Pulau Kecil', 'Dewi Anggraini', 'UGM Press', 2025, '700', 120000, 'Kurikulum baru D4 Pertanahan'],
            ['Penilaian Tanah dan Properti', 'Hendro Wibisono', 'Salemba Empat', 2025, '300', 135000, 'Mata kuliah Penilaian Tanah'],
            ['Konflik Agraria di Indonesia 2015–2025', 'Tim KPA', 'Insist Press', 2026, '900', 90000, 'Sering dirujuk di skripsi'],
        ] as [$title, $author, $publisher, $year, $ddc, $price, $reason]) {
            NewPublication::create(compact('title', 'author', 'publisher', 'year', 'price', 'reason') + ['ddc_class' => $ddc]);
        }

        $member = fn (string $name) => Member::where('name', $name)->value('id');
        CollectionSuggestion::create(['title' => 'Drone Mapping for Cadastral Survey', 'author' => 'P. van der Molen', 'member_id' => $member('Fajar Nugroho'), 'votes' => 14]);
        $approved = CollectionSuggestion::create(['title' => 'Hukum Tanah Adat di Indonesia', 'author' => 'Maria S.W. Sumardjono', 'member_id' => $member('Siti Nurhaliza'), 'votes' => 9, 'status' => CollectionSuggestion::APPROVED]);
        CollectionSuggestion::create(['title' => 'QGIS untuk Pemula', 'author' => 'Agus Purwanto', 'member_id' => $member('Yohanes Kristianto'), 'votes' => 6]);

        $this->loanHistory();

        $laskar = Book::where('title', 'Laskar Pelangi')->firstOrFail();
        $kadaster = NewPublication::where('title', 'like', 'Kadaster Multiguna%')->firstOrFail();

        ProcurementItem::create(['title' => $approved->title, 'author' => $approved->author, 'price' => 150000, 'quantity' => 2, 'source' => 'Usulan', 'suggestion_id' => $approved->id, 'ddc_class' => '300']);
        ProcurementItem::create(['title' => $laskar->title, 'author' => 'Andrea Hirata', 'publisher' => 'Bentang Pustaka', 'price' => 105000, 'quantity' => 4, 'source' => 'Favorit', 'book_id' => $laskar->id, 'ddc_class' => '800']);
        ProcurementItem::create([...$kadaster->only(['title', 'author', 'publisher', 'year', 'ddc_class', 'price']), 'quantity' => 3, 'source' => 'Terbaru', 'new_publication_id' => $kadaster->id]);
    }

    /**
     * Returned loans spread over the last six months, so "favorit stok
     * sedikit" works from real circulation data.
     */
    private function loanHistory(): void
    {
        $members = Member::where('type', 'Mahasiswa')->pluck('id')->all();

        foreach (self::LOAN_HISTORY as $bookId => $count) {
            $copies = BookCopy::where('book_id', $bookId)->pluck('id')->all();

            for ($i = 0; $i < $count; $i++) {
                $out = today()->subDays(8 + (int) floor($i * 170 / $count))->setTime(9 + $i % 7, 10);

                Loan::create([
                    'book_copy_id' => $copies[$i % count($copies)],
                    'member_id' => $members[$i % count($members)],
                    'loaned_at' => $out,
                    'due_at' => $out->copy()->addDays(7)->startOfDay(),
                    'returned_at' => $out->copy()->addDays(5 + $i % 3),
                ]);
            }
        }
    }

    private function activities(): void
    {
        $templates = [
            ['Layanan sirkulasi', 'Melayani peminjaman dan pengembalian buku di loket', '42 transaksi'],
            ['Pengolahan bahan pustaka', 'Katalogisasi dan klasifikasi buku baru', '18 judul'],
            ['Pengolahan bahan pustaka', 'Pelabelan nomor panggil dan pemasangan barcode', '35 eksemplar'],
            ['Layanan referensi', 'Membantu penelusuran referensi skripsi mahasiswa', '6 pemustaka'],
            ['Pengembangan koleksi', 'Verifikasi usulan pengadaan buku dari pemustaka', '12 usulan'],
            ['Digitalisasi & repositori', 'Validasi dan unggah skripsi digital ke repositori', '9 file'],
            ['Administrasi', 'Rekap laporan kunjungan mingguan', '1 laporan'],
            ['Pemeliharaan koleksi', 'Shelving dan merapikan rak koleksi umum', 'Rak A1–A4'],
            ['Bebas pustaka', 'Verifikasi berkas dan hardcopy bebas pustaka', '4 mahasiswa'],
            ['Administrasi', 'Surat-menyurat dan pengarsipan', '5 surat'],
        ];
        $slots = [['08:00', '10:00'], ['10:00', '12:00'], ['13:00', '15:00'], ['15:00', '16:00']];

        foreach (Employee::orderBy('id')->get()->values() as $pi => $employee) {
            for ($d = 0; $d >= -24; $d--) {
                $date = today()->addDays($d);

                if ($date->isWeekend() || ($d < 0 && ($pi - $d) % 6 === 0)) {
                    continue;
                }

                $n = $d === 0 ? ($pi % 3 === 0 ? 0 : 2) : 3 + ($pi - $d) % 2;

                for ($k = 0; $k < $n; $k++) {
                    [$category, $description, $output] = $templates[($pi * 3 - $d * 2 + $k) % count($templates)];

                    ActivityLog::create([
                        'employee_id' => $employee->id,
                        'date' => $date,
                        'starts_at' => $slots[$k][0],
                        'ends_at' => $slots[$k][1],
                        'category' => $category,
                        'description' => $description,
                        'output' => $output,
                        'status' => $d === 0 && $k === $n - 1 ? 'Berlanjut' : 'Selesai',
                    ]);
                }
            }
        }
    }

    private function overtime(): void
    {
        $librarians = Employee::where('kind', 'pustakawan')->orderBy('id')->pluck('id')->values();
        $tendik = Employee::where('kind', 'tendik')->orderBy('id')->pluck('id')->values();
        $who = fn (string $code) => $code[0] === 'L' ? $librarians[(int) $code[1] - 1] : $tendik[(int) $code[1] - 1];

        foreach ([
            [-6, '16:00', '21:00', 'Layanan ruang baca masa ujian', ['L2' => ['15:58', '21:05'], 'T2' => ['16:12', '21:00']]],
            [-4, '16:00', '20:00', 'Stock opname rak B1–B3', ['T4' => ['16:00', '20:10'], 'T3' => ['16:05', '19:40']]],
            [-2, '13:00', '17:00', 'Layanan Sabtu ruang baca', ['L2' => ['12:55', '17:02']]],
            [-1, '16:00', '21:00', 'Layanan ruang baca masa ujian', ['T4' => null, 'T5' => ['16:01', '21:00']]],
            [0, '16:00', '21:00', 'Layanan ruang baca masa ujian', ['L2' => null, 'T6' => null]],
            [2, '16:00', '21:00', 'Layanan ruang baca masa ujian', ['T4' => null, 'T2' => null]],
            [4, '08:00', '13:00', 'Pengolahan koleksi baru (84 judul)', ['L2' => null, 'T4' => null, 'T3' => null]],
            [6, '16:00', '21:00', 'Layanan ruang baca masa ujian', ['L1' => null, 'T6' => null]],
        ] as [$offset, $start, $end, $activity, $people]) {
            $date = today()->addDays($offset);
            $session = OvertimeSession::create(['date' => $date, 'starts_at' => $start, 'ends_at' => $end, 'activity' => $activity]);

            foreach ($people as $code => $presence) {
                $session->assignments()->create([
                    'employee_id' => $who($code),
                    'checked_in_at' => $presence ? $date->copy()->setTimeFromTimeString($presence[0]) : null,
                    'checked_out_at' => $presence ? $date->copy()->setTimeFromTimeString($presence[1]) : null,
                ]);
            }
        }
    }

    private function cameras(): void
    {
        $ids = [];

        foreach ([
            ['CAM-01', 'Loket peminjaman & warung kejujuran', 2, 'Sirkulasi', true],
            ['CAM-02', 'Lobi & mesin presensi', 2, 'Sirkulasi', true],
            ['CAM-03', 'Ruang referensi, koleksi asing & arsip', 3, 'Referensi', true],
            ['CAM-04', 'Meja petugas referensi', 3, 'Referensi', false],
        ] as [$code, $name, $floor, $area, $online]) {
            $ids[$code] = Camera::create(['code' => $code, 'name' => $name, 'floor' => $floor, 'area' => $area, 'online' => $online, 'recording' => $online])->id;
        }

        foreach ([
            ['09:48', 'CAM-01', 'Antrean peminjaman lebih dari 5 orang', 'Antrean'],
            ['09:31', 'CAM-02', 'Security gate berbunyi, petugas sudah mengecek', 'Alarm'],
            ['09:12', 'CAM-03', 'Gerakan terdeteksi di rak arsip', 'Gerakan'],
            ['08:55', 'CAM-04', 'Kamera terputus dari NVR', 'Offline'],
            ['08:02', 'CAM-02', 'Pintu dibuka, layanan dimulai', 'Info'],
        ] as [$time, $code, $description, $kind]) {
            CameraEvent::create(['camera_id' => $ids[$code], 'occurred_at' => today()->setTimeFromTimeString($time), 'kind' => $kind, 'description' => $description]);
        }
    }
}
