<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use App\Models\Employee;
use App\Models\Member;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Sample master data copied from the prototype (design/Portal Staf.dc.html).
 */
class MasterDataSeeder extends Seeder
{
    /** floor => code => [name, x, y, w, h] (position on the floor plan, in percent) */
    public const RACKS = [
        1 => [
            'A1' => ['Karya umum', 8, 8, 6, 36], 'A2' => ['Komputer & informatika', 20, 8, 6, 36],
            'A3' => ['Filsafat & etika', 32, 8, 6, 36], 'A4' => ['Agama', 44, 8, 6, 36],
            'B1' => ['Kebijakan & reforma agraria', 60, 8, 6, 36], 'B2' => ['Ekonomi lahan', 72, 8, 6, 36],
            'B3' => ['Hukum pertanahan', 84, 8, 6, 36],
        ],
        2 => [
            'C1' => ['Bahasa', 6, 8, 6, 36], 'C2' => ['Tata ruang & lanskap', 17, 8, 6, 36], 'C3' => ['Sastra', 28, 8, 6, 36],
            'D1' => ['Ukur tanah & kartografi', 42, 8, 6, 36], 'D2' => ['Statistik & geodesi', 53, 8, 6, 36],
            'D3' => ['Teknologi survei', 64, 8, 6, 36], 'E1' => ['Sejarah', 78, 8, 6, 36], 'E2' => ['Geografi & SIG', 89, 8, 6, 36],
        ],
        3 => [
            'R1' => ['Skripsi D4 Pertanahan', 8, 8, 6, 40], 'R2' => ['Tugas akhir & laporan PKL', 20, 8, 6, 40],
            'J1' => ['Jurnal & terbitan berkala', 34, 8, 6, 40],
        ],
    ];

    /** id, title, author, publisher, year, ddc, call number, rack, copies */
    private const BOOKS = [
        [1, 'Hukum Agraria Indonesia', 'Boedi Harsono', 'Djambatan', 2008, '300', '346.04 HAR h', 'B3', 12],
        [2, 'Pengantar Ilmu Ukur Tanah', 'Sri Wahyuni', 'Andi', 2019, '500', '526.9 WAH p', 'D1', 8],
        [3, 'Sistem Informasi Geografis', 'Eddy Prahasta', 'Informatika', 2014, '900', '910.285 PRA s', 'E2', 10],
        [4, 'Kebijakan Pertanahan Nasional', 'Tim Pusat Kajian STPN', 'STPN Press', 2021, '300', '333.3 TIM k', 'B1', 6],
        [5, 'Reforma Agraria dan Keadilan Sosial', 'Gunawan Wiradi', 'STPN Press', 2017, '300', '333.31 WIR r', 'B1', 9],
        [6, 'Kartografi Dasar', 'Rini Astuti', 'UGM Press', 2016, '500', '526 AST k', 'D1', 5],
        [7, 'Fotogrametri dan Penginderaan Jauh', 'Hartono Saputra', 'ITB Press', 2018, '600', '621.367 SAP f', 'D3', 7],
        [8, 'Pendaftaran Tanah di Indonesia', 'Adrian Sutedi', 'Sinar Grafika', 2020, '300', '346.043 SUT p', 'B3', 11],
        [9, 'Metodologi Penelitian Kualitatif', 'Lexy Moleong', 'Remaja Rosdakarya', 2017, '000', '001.42 MOL m', 'A1', 14],
        [10, 'Python untuk Data Spasial', 'Dimas Prakoso', 'Elex Media', 2022, '000', '005.133 PRA p', 'A2', 4],
        [11, 'Filsafat Ilmu', 'Jujun S. Suriasumantri', 'Pustaka Sinar Harapan', 2015, '100', '101 SUR f', 'A3', 8],
        [12, 'Etika Profesi Aparatur Negara', 'Nur Hidayat', 'Kencana', 2019, '100', '174 HID e', 'A3', 5],
        [13, 'Fikih Pertanahan', 'Ahmad Syafii', 'Pustaka Pelajar', 2016, '200', '297.4 SYA f', 'A4', 3],
        [14, 'Bahasa Indonesia untuk Karya Ilmiah', 'Dewi Kartika', 'Erlangga', 2020, '400', '499.221 KAR b', 'C1', 10],
        [15, 'English for Surveyors', 'Michael Grant', 'Routledge', 2013, '400', '428 GRA e', 'C1', 4],
        [16, 'Geodesi Satelit', 'Hasanuddin Z. Abidin', 'Pradnya Paramita', 2015, '500', '526.1 ABI g', 'D2', 6],
        [17, 'Statistika Spasial', 'Yuli Rahmawati', 'Deepublish', 2021, '500', '519.5 RAH s', 'D2', 5],
        [18, 'Teknik Pengukuran GNSS', 'Bambang Setiadi', 'ITB Press', 2023, '600', '526.982 SET t', 'D3', 6],
        [19, 'Penatagunaan Tanah dan Tata Ruang', 'Arif Wibowo', 'STPN Press', 2022, '700', '711.4 WIB p', 'C2', 8],
        [20, 'Arsitektur Lanskap Perdesaan', 'Laras Pertiwi', 'Kanisius', 2018, '700', '712 PER a', 'C2', 3],
        [21, 'Bumi Manusia', 'Pramoedya Ananta Toer', 'Lentera Dipantara', 2011, '800', '899.221 3 TOE b', 'C3', 4],
        [22, 'Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2008, '800', '899.221 3 HIR l', 'C3', 3],
        [23, 'Sejarah Agraria Indonesia', 'Noer Fauzi Rachman', 'Insist Press', 2012, '900', '959.8 RAC s', 'E1', 6],
        [24, 'Atlas Nasional Indonesia', 'Badan Informasi Geospasial', 'BIG', 2019, '900', '912.598 BAD a', 'E2', 2],
        [25, 'Ekonomi Sumber Daya Lahan', 'Sitorus Manurung', 'IPB Press', 2017, '300', '333.7 MAN e', 'B2', 7],
        [26, 'Mediasi Sengketa Pertanahan', 'Ratna Sari Dewi', 'Kencana', 2021, '300', '346.04 DEW m', 'B3', 5],
        [27, 'Analisis Konflik Tanah Ulayat di Sumatera Barat', 'Rizky Maulana', 'Skripsi D4 Pertanahan', 2025, '300', 'SK 333.2 MAU a', 'R1', 1],
        [28, 'Jurnal Bhumi Vol. 10 No. 2', 'Politeknik Agraria', 'STPN Press', 2024, '300', 'J 333 BHU', 'J1', 3],
    ];

    /** Books whose collection type is not "Buku teks". */
    private const BOOK_COLLECTION = [4 => 'Terbitan STPN Press', 5 => 'Terbitan STPN Press', 19 => 'Terbitan STPN Press',
        24 => 'Peta & atlas', 27 => 'Skripsi', 28 => 'Jurnal & majalah', 9 => 'Referensi', 14 => 'Referensi'];

    /** title, author, publisher, year, ddc, format, size MB, licenses, collection type */
    private const EBOOKS = [
        ['Hukum Agraria Indonesia (edisi digital)', 'Boedi Harsono', 'Djambatan', 2008, '300', 'PDF', 4.2, 5, 'Buku teks'],
        ['Reforma Agraria: Sebuah Pengantar', 'Gunawan Wiradi', 'STPN Press', 2019, '300', 'EPUB', 1.8, 10, 'Terbitan STPN Press'],
        ['Sistem Informasi Geografis untuk Pertanahan', 'Eddy Prahasta', 'Informatika', 2020, '000', 'PDF', 12.5, 3, 'Buku teks'],
        ['Dasar-Dasar Survei Kadastral', 'Sri Wahyuni', 'STPN Press', 2021, '500', 'PDF', 8.1, 5, 'Terbitan STPN Press'],
        ['Penginderaan Jauh untuk Pemetaan Bidang Tanah', 'Hartono Saputra', 'ITB Press', 2022, '500', 'PDF', 15.3, 2, 'Buku teks'],
        ['Perencanaan Tata Ruang Wilayah', 'Arif Wibowo', 'STPN Press', 2023, '700', 'EPUB', 2.4, 6, 'Terbitan STPN Press'],
        ['Analisis Spasial dengan QGIS', 'Arif Rahman', 'Informatika', 2024, '000', 'PDF', 9.7, 4, 'Buku teks'],
        ['Sejarah Pertanahan Nusantara', 'Noer Fauzi Rachman', 'Insist Press', 2016, '900', 'EPUB', 3.1, 3, 'Buku teks'],
        ['Jurnal Bhumi Vol. 11 No. 1', 'Politeknik Agraria', 'STPN Press', 2025, '300', 'PDF', 5.6, 20, 'Jurnal & majalah'],
        ['Mediasi Sengketa Pertanahan', 'Ratna Sari Dewi', 'Kencana', 2021, '300', 'PDF', 3.9, 3, 'Prosiding'],
    ];

    private const INSTITUTIONS = ['Tim Pusat Kajian STPN', 'Badan Informasi Geospasial', 'Politeknik Agraria'];

    private const PUBLISHER_CITIES = ['STPN Press' => 'Sleman', 'Djambatan' => 'Jakarta', 'Andi' => 'Yogyakarta', 'Informatika' => 'Bandung',
        'UGM Press' => 'Yogyakarta', 'ITB Press' => 'Bandung', 'Sinar Grafika' => 'Jakarta', 'Remaja Rosdakarya' => 'Bandung',
        'Elex Media' => 'Jakarta', 'Kencana' => 'Jakarta', 'Erlangga' => 'Jakarta', 'Deepublish' => 'Yogyakarta', 'Kanisius' => 'Yogyakarta',
        'Insist Press' => 'Yogyakarta', 'BIG' => 'Bogor', 'IPB Press' => 'Bogor', 'Routledge' => 'London', 'Pustaka Pelajar' => 'Yogyakarta'];

    public function run(): void
    {
        foreach (self::RACKS as $floor => $racks) {
            foreach ($racks as $code => [$name, $x, $y, $w, $h]) {
                Rack::create(['code' => $code, 'name' => $name, 'floor' => $floor, 'map_x' => $x, 'map_y' => $y, 'map_w' => $w, 'map_h' => $h]);
            }
        }

        $racks = Rack::pluck('id', 'code');

        foreach (self::BOOKS as [$id, $title, $author, $publisher, $year, $ddc, $call, $rack, $copies]) {
            $book = Book::create([
                'type' => Book::PRINTED,
                'title' => $title,
                'author_id' => $this->author($author)->id,
                'publisher_id' => $this->publisher($publisher)->id,
                'year' => $year,
                'isbn' => sprintf('978-602-%d-%d-%d', 1000 + $id * 37, 10 + $id, $id % 9),
                'ddc_class' => $ddc,
                'collection_type' => self::BOOK_COLLECTION[$id] ?? 'Buku teks',
                // Titles handed over by lecturers/staff returning from study leave.
                'acquisition' => in_array($id, [11, 12, 17, 20, 25], true) ? 'Penyerahan dosen/tendik tugas belajar' : 'Pengadaan',
                'call_number' => $call,
                'rack_id' => $racks[$rack],
            ]);
            $book->syncCopyCount($copies);
        }

        foreach (self::EBOOKS as [$title, $author, $publisher, $year, $ddc, $format, $size, $licenses, $collection]) {
            Book::create([
                'type' => Book::EBOOK,
                'title' => $title,
                'author_id' => $this->author($author)->id,
                'publisher_id' => $this->publisher($publisher)->id,
                'year' => $year,
                'ddc_class' => $ddc,
                'collection_type' => $collection,
                'acquisition' => 'Pengadaan',
                'format' => $format,
                'file_size_mb' => $size,
                'license_count' => $licenses,
                'status' => 'Terbit',
            ]);
        }

        $this->suppliers();
        $this->members();
        $this->employees();
        $this->backdateAcquisitions();
    }

    /**
     * Sample titles entered the collection the year after publication (at
     * the latest last year), so year-on-year growth (IK 1.2) has a history.
     */
    private function backdateAcquisitions(): void
    {
        Book::query()->each(function (Book $book) {
            $year = min(($book->year ?? 2015) + 1, now()->year - 1);
            $at = now()->setDate($year, 1 + $book->id % 12, 1 + $book->id % 27)->setTime(10, 0);

            $book->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
        });
    }

    private function author(string $name): Author
    {
        return Author::firstOrCreate(['name' => $name], ['type' => in_array($name, self::INSTITUTIONS, true) ? 'Lembaga' : 'Perorangan']);
    }

    private function publisher(string $name): Publisher
    {
        return Publisher::firstOrCreate(['name' => $name], ['city' => self::PUBLISHER_CITIES[$name] ?? null]);
    }

    private function suppliers(): void
    {
        foreach ([
            ['CV Pustaka Agraria Mandiri', 'Distributor', 'Dwi Hartanto', '0812-2745-1180', 'Yogyakarta', 'Aktif'],
            ['PT Gramedia Asri Media', 'Toko buku', 'Layanan Institusi', '(021) 5365 0110', 'Jakarta', 'Aktif'],
            ['STPN Press', 'Penerbit langsung', 'Bagian Penerbitan', '(0274) 587239', 'Sleman', 'Aktif'],
            ['CV Ilmu Geospasial Nusantara', 'Distributor', 'Rahmat Saputra', '0857-4012-3321', 'Bandung', 'Aktif'],
            ['UD Toko Buku Sinar Kampus', 'Toko buku', 'Siti Aminah', '0813-9001-2244', 'Yogyakarta', 'Nonaktif'],
        ] as [$name, $type, $contact, $phone, $city, $status]) {
            Supplier::create(['name' => $name, 'type' => $type, 'contact_name' => $contact, 'phone' => $phone, 'city' => $city, 'status' => $status]);
        }
    }

    private function members(): void
    {
        foreach ([
            ['20220145', 'Rizky Maulana', 'D4 Pertanahan', 'Mahasiswa'],
            ['20220311', 'Annisa Putri Lestari', 'D4 Pertanahan', 'Mahasiswa'],
            ['20210190', 'Siti Nurhaliza', 'D4 Pertanahan', 'Mahasiswa'],
            ['20220402', 'Yohanes Kristianto', 'D4 Pertanahan', 'Mahasiswa'],
            ['20210233', 'Fajar Nugroho', 'D4 Pertanahan', 'Mahasiswa'],
            ['197203152', 'Dr. Sutaryono, M.Si.', 'Dosen', 'Dosen'],
            ['20210088', 'Larasati Handayani', 'D4 Pertanahan', 'Mahasiswa'],
        ] as [$number, $name, $prodi, $type]) {
            $first = strtolower(preg_replace('/[^a-z]/i', '', explode(' ', str_replace('Dr. ', '', $name))[0]));

            Member::create([
                'member_number' => $number,
                'name' => $name,
                'study_program' => $prodi,
                'type' => $type,
                'email' => "{$first}@stpn.ac.id",
                'status' => 'Aktif',
                'user_id' => User::where('name', $name)->value('id'),
            ]);
        }
    }

    private function employees(): void
    {
        foreach ([
            ['pustakawan', '196807251991031002', 'Yosep Nai Helly, S.SiT., M.A', 'IV/a', 'Pustakawan Ahli Madya', true],
            ['pustakawan', '196905121991031005', 'Martinho Magno, S.Si.T', 'III/d', 'Pustakawan Ahli Muda', false],
            ['tendik', '197406062001122002', 'Ety Kusummanningsih, S.P., S.ST., M.M.', 'IV/a', 'Penelaah Teknis Kebijakan', false],
            ['tendik', '197211252006042018', 'Sujilah, S.H', 'III/c', 'Penata Layanan Operasional', false],
            ['tendik', '198206242003122002', 'Lita Gunawati, S.E', 'III/b', 'Penata Layanan Operasional', false],
            ['tendik', '197404052006041017', 'Mujiana Suryanta', 'III/b', 'Pengadministrasi Perkantoran', false],
            ['tendik', '197303162006041017', 'Sugiharto', 'III/b', 'Pengadministrasi Perkantoran', false],
            ['tendik', '198603102008041001', 'Muhamad Irfan Yudistira, S.ST., M.Eng', 'III/c', 'Penata Layanan Operasional', false],
        ] as [$kind, $nip, $name, $golongan, $position, $head]) {
            Employee::create([
                'kind' => $kind,
                'nip' => $nip,
                'name' => $name,
                'golongan' => $golongan,
                'position' => $position,
                'status' => 'Aktif',
                'is_head' => $head,
                'user_id' => User::where('name', $name)->value('id'),
            ]);
        }
    }
}
