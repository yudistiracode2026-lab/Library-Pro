<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Member;
use App\Models\Thesis;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Demo data for the member portal: the thesis repository (from
 * design/Baca di Tempat.dc.html and the title-check list in Portal
 * Pemustaka.dc.html), e-book files, and Annisa's e-book loan and reading.
 */
class PortalDataSeeder extends Seeder
{
    /** [type, title, author, nim, programme, year, advisor, keywords, pages, abstract] */
    private const WORKS = [
        ['Skripsi', 'Analisis Konflik Tanah Ulayat di Sumatera Barat', 'Rizky Maulana', '20220145', 'D4 Pertanahan', 2025, 'Dr. Sutaryono, M.Si.', 'tanah ulayat; konflik agraria; nagari', 112, 'Penelitian ini mengkaji pola konflik tanah ulayat nagari di Kabupaten Agam dan peran lembaga adat dalam penyelesaiannya. Data dikumpulkan melalui wawancara dengan ninik mamak, kantor pertanahan, dan pemerintah nagari. Hasilnya menunjukkan konflik paling sering muncul pada pendaftaran tanah kaum yang belum memiliki batas jelas.'],
        ['Skripsi', 'Pemanfaatan Drone RTK untuk Pengukuran Bidang Tanah Pertanian', 'Yohanes Kristianto', '20220402', 'D4 Pertanahan', 2024, 'Martinho Magno, S.Si.T', 'drone; RTK; pengukuran bidang', 86, 'Penelitian ini membandingkan ketelitian pengukuran bidang tanah pertanian dengan drone RTK terhadap pengukuran terestris. Selisih luas rata-rata di bawah toleransi yang ditetapkan untuk pendaftaran tanah.'],
        ['Skripsi', 'Redistribusi Tanah Objek Reforma Agraria di Kabupaten Blitar', 'Annisa Putri Lestari', '20220311', 'D4 Pertanahan', 2023, 'Dr. Sutaryono, M.Si.', 'reforma agraria; TORA; redistribusi', 95, 'Skripsi ini menelusuri pelaksanaan redistribusi TORA eks HGU di Kabupaten Blitar dan dampaknya terhadap akses petani penggarap.'],
        ['Tesis', 'Model Kadaster Multiguna untuk Perencanaan Tata Ruang Perdesaan', 'Dewi Anggraini', null, 'Magister Perencanaan Wilayah (deposit dosen)', 2024, 'Prof. Dr. Ir. Hartono Saputra', 'kadaster multiguna; tata ruang; perdesaan', 168, 'Tesis ini merancang model data kadaster multiguna yang mengintegrasikan informasi bidang tanah, zonasi tata ruang, dan potensi desa untuk mendukung perencanaan di tingkat desa.'],
        ['Tesis', 'Kepastian Hukum Hak atas Tanah Masyarakat Hukum Adat', 'Ratna Sari Dewi', null, 'Magister Ilmu Hukum (deposit dosen)', 2022, 'Prof. Dr. Maria S.W. Sumardjono, S.H.', 'hak ulayat; masyarakat hukum adat', 154, 'Tesis ini mengkaji perkembangan pengakuan hak ulayat dalam peraturan pertanahan dan praktik penatausahaannya di beberapa provinsi.'],
        ['Tesis', 'Model Partisipasi Masyarakat dalam Konsolidasi Tanah Perkotaan', 'Hendra Wijaya', null, 'Magister Perencanaan Wilayah (deposit dosen)', 2020, 'Prof. Dr. Ir. Hartono Saputra', 'Konsolidasi tanah; Tata ruang', 142, 'Tesis ini merumuskan model partisipasi pemilik tanah dalam konsolidasi tanah perkotaan agar penataan kawasan berjalan tanpa penggusuran.'],
        ['Disertasi', 'Dinamika Penguasaan Tanah dan Reforma Agraria di Jawa, 1960–2020', 'Sutaryono', null, 'Doktor Ilmu Sosial (deposit dosen)', 2023, 'Prof. Dr. Gunawan Wiradi (alm.)', 'penguasaan tanah; sejarah agraria; Jawa; Reforma agraria', 312, 'Disertasi ini menelusuri perubahan struktur penguasaan tanah di Jawa sejak UUPA 1960 hingga program reforma agraria terkini, dengan studi kasus tiga desa di Jawa Tengah.'],
        ['Disertasi', 'Integrasi Data Spasial Pertanahan untuk Satu Peta Nasional', 'Muhamad Irfan Yudistira', null, 'Doktor Geomatika (deposit dosen)', 2025, 'Prof. Dr. Hasanuddin Z. Abidin', 'data spasial; satu peta; interoperabilitas', 276, 'Disertasi ini mengusulkan kerangka interoperabilitas data spasial pertanahan dengan data tematik kementerian lain untuk mendukung kebijakan satu peta.'],
        ['Disertasi', 'Politik Hukum Pendaftaran Tanah Sistematis di Indonesia', 'Dr. Sutaryono', null, 'Doktor Ilmu Hukum (deposit dosen)', 2019, 'Prof. Dr. Maria S.W. Sumardjono, S.H.', 'Pendaftaran tanah; PTSL', 298, 'Disertasi ini menganalisis arah politik hukum pendaftaran tanah sistematis dan konsekuensinya bagi kepastian hukum hak atas tanah.'],
        ['Disertasi', 'Dinamika Konflik Agraria dan Gerakan Petani di Jawa', 'Dr. Ahmad Nashih Luthfi', null, 'Doktor Sejarah (deposit dosen)', 2018, 'Prof. Dr. Gunawan Wiradi (alm.)', 'Sengketa & konflik; Reforma agraria', 284, 'Disertasi ini menelusuri hubungan antara konflik agraria dan tumbuhnya gerakan petani di Jawa sejak masa Orde Baru.'],
    ];

    /** Earlier skripsi from the title-check list: [title, author, year, keywords]. */
    private const SKRIPSI = [
        ['Efektivitas Pendaftaran Tanah Sistematis Lengkap di Kabupaten Sleman', 'Dimas Arya Pratama', 2024, 'PTSL; Pendaftaran tanah'],
        ['Kendala Penerbitan Sertipikat PTSL Kluster 3 di Kabupaten Bantul', 'Nur Aini Rahmawati', 2023, 'PTSL; Sertipikasi'],
        ['Pemetaan Partisipatif Batas Desa Menggunakan Drone di Kabupaten Gunungkidul', 'Bagas Saputra', 2025, 'Pemetaan partisipatif; Survei & pemetaan'],
        ['Akurasi Peta Bidang Tanah Hasil Foto Udara UAV untuk Percepatan Pendaftaran Tanah', 'Rizal Fahmi', 2024, 'Survei & pemetaan; Pendaftaran tanah'],
        ['Penyelesaian Sengketa Batas Tanah melalui Mediasi di Kantor Pertanahan Kota Yogyakarta', 'Ayu Lestari', 2023, 'Sengketa & konflik'],
        ['Konflik Agraria Perkebunan dan Upaya Penyelesaiannya di Kabupaten Jember', 'Fajar Nugroho', 2022, 'Sengketa & konflik; Reforma agraria'],
        ['Pemberdayaan Masyarakat Pasca Redistribusi Tanah dalam Program Reforma Agraria', 'Yudha Prakoso', 2025, 'Reforma agraria; Pemberdayaan'],
        ['Pengendalian Alih Fungsi Lahan Pertanian Pangan Berkelanjutan di Kabupaten Klaten', 'Larasati Dewi', 2023, 'Tata ruang; LP2B'],
        ['Kesesuaian Penggunaan Tanah terhadap Rencana Tata Ruang Wilayah Kota Magelang', 'Andika Putra', 2022, 'Tata ruang'],
        ['Penilaian Tanah untuk Pengadaan Tanah Jalan Tol Yogyakarta–Solo', 'Wulan Sari', 2024, 'Pengadaan tanah; Penilaian tanah'],
        ['Ganti Kerugian dalam Pengadaan Tanah bagi Pembangunan untuk Kepentingan Umum', 'Rahmat Hidayat', 2021, 'Pengadaan tanah'],
        ['Pengakuan Hak Komunal atas Tanah Adat di Kabupaten Lebak', 'Galih Ramadhan', 2022, 'Tanah adat'],
        ['Penerapan Sertipikat Elektronik dan Kesiapan Kantor Pertanahan', 'Nadia Kusuma', 2025, 'Layanan digital; Sertipikasi'],
        ['Kualitas Layanan Pertanahan Elektronik Hak Tanggungan di Kota Semarang', 'Teguh Santoso', 2024, 'Layanan digital'],
        ['Validasi Data Bidang Tanah dalam Program Kota Lengkap', 'Mega Puspita', 2025, 'Pendaftaran tanah; Survei & pemetaan'],
        ['Pemanfaatan Tanah Terlantar untuk Ketahanan Pangan', 'Arief Wibowo', 2021, 'Tanah terlantar; Reforma agraria'],
    ];

    private const ADVISORS = ['Dr. Sutaryono, M.Si.', 'Martinho Magno, S.Si.T', 'Dr. Ratna Sari Dewi, S.H., M.Hum.'];

    public function run(): void
    {
        $works = self::WORKS;

        foreach (self::SKRIPSI as $i => [$title, $author, $year, $keywords]) {
            $works[] = ['Skripsi', $title, $author, null, 'D4 Pertanahan', $year, self::ADVISORS[$i % 3], $keywords, 80 + ($i * 7) % 40,
                'Penelitian ini mengkaji '.mb_strtolower($title).'. Data dikumpulkan melalui wawancara, observasi lapangan, dan studi dokumen di kantor pertanahan setempat.'];
        }

        foreach ($works as $i => [$type, $title, $author, $nim, $programme, $year, $advisor, $keywords, $pages, $abstract]) {
            $path = sprintf('repositori/%s-%03d.pdf', strtolower($type), $i + 1);
            Storage::disk('local')->put($path, Pdf::loadView('pdf.contoh-karya', [
                'title' => $title, 'type' => $type, 'author' => $author, 'nim' => $nim, 'program' => $programme,
                'year' => $year, 'abstract' => $abstract, 'keywords' => str_replace(';', ',', $keywords),
                'logo' => public_path('images/logo-stpn.png'),
            ])->setPaper('a4')->output());

            Thesis::create([
                'type' => $type, 'title' => $title, 'author' => $author, 'member_number' => $nim, 'study_program' => $programme,
                'year' => $year, 'advisor' => $advisor, 'keywords' => $keywords, 'pages' => $pages, 'abstract' => $abstract,
                'call_number' => sprintf('%s %d.%d %s', ['Skripsi' => 'SK', 'Tesis' => 'TS', 'Disertasi' => 'DS'][$type], 333 + $i % 9, 10 + $i, strtoupper(substr(preg_replace('/[^A-Za-z]/', '', last(explode(' ', $author))), 0, 3))),
                'file_path' => $path,
            ]);
        }

        Book::where('type', Book::EBOOK)->where('format', 'PDF')->with(['author', 'publisher'])->get()->each(function (Book $book) {
            $path = "ebook/ebook-{$book->id}.pdf";
            Storage::disk('local')->put($path, Pdf::loadView('pdf.contoh-ebook', [
                'title' => $book->title, 'author' => $book->author->name, 'publisher' => $book->publisher?->name, 'year' => $book->year, 'chapters' => 8,
            ])->setPaper('a5')->output());
            $book->update(['file_path' => $path]);
        });

        $annisa = Member::where('member_number', '20220311')->first();
        $sig = Book::where('title', 'like', 'Sistem Informasi Geografis untuk Pertanahan%')->first();

        if ($annisa && $sig) {
            $annisa->ebookLoans()->create(['book_id' => $sig->id, 'borrowed_at' => now()->subDays(5), 'due_at' => now()->addDays(9), 'last_page' => 4]);
            $annisa->readingSessions()->create([
                'thesis_id' => Thesis::where('title', 'like', 'Pemanfaatan Drone RTK%')->value('id'),
                'started_at' => now()->subDay()->setTime(10, 12), 'ended_at' => now()->subDay()->setTime(10, 50), 'max_page' => 6,
            ]);
        }
    }
}
