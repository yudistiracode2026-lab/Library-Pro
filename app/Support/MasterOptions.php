<?php

namespace App\Support;

/**
 * Fixed option lists for master data, taken from design/Portal Staf.dc.html.
 * Controllers validate against these and pass them to the forms.
 */
class MasterOptions
{
    public const BOOK_TYPES = ['fisik' => 'Buku fisik', 'ebook' => 'E-book'];

    /** Dewey Decimal main classes. */
    public const DDC_CLASSES = [
        '000' => 'Karya umum',
        '100' => 'Filsafat',
        '200' => 'Agama',
        '300' => 'Ilmu sosial & hukum',
        '400' => 'Bahasa',
        '500' => 'Sains',
        '600' => 'Teknologi',
        '700' => 'Seni & tata ruang',
        '800' => 'Sastra',
        '900' => 'Sejarah & geografi',
    ];

    public const COLLECTION_TYPES = [
        'Buku teks',
        'Skripsi',
        'Tugas akhir & laporan PKL',
        'Prosiding',
        'Jurnal & majalah',
        'Referensi',
        'Peta & atlas',
        'Terbitan STPN Press',
    ];

    public const ACQUISITIONS = ['Pengadaan', 'Sumbangan mahasiswa'];

    public const EBOOK_FORMATS = ['PDF', 'EPUB'];

    public const EBOOK_STATUSES = ['Terbit', 'Draf'];

    public const AUTHOR_TYPES = ['Perorangan', 'Lembaga'];

    public const ACTIVE_STATUSES = ['Aktif', 'Nonaktif'];

    public const SUPPLIER_TYPES = ['Distributor', 'Toko buku', 'Penerbit langsung'];

    public const MEMBER_TYPES = ['Mahasiswa', 'Dosen', 'Umum'];

    public const MEMBER_STATUSES = ['Aktif', 'Diblokir'];

    public const STUDY_PROGRAMS = ['D4 Pertanahan', 'D1 Pengukuran dan Pemetaan Kadastral', 'Dosen', 'Umum'];

    public const EMPLOYEE_STATUSES = ['Aktif', 'Cuti'];

    /** Civil-service grade (golongan/ruang) => rank (pangkat). */
    public const GOLONGAN = [
        'IV/e' => 'Pembina Utama',
        'IV/d' => 'Pembina Utama Madya',
        'IV/c' => 'Pembina Utama Muda',
        'IV/b' => 'Pembina Tk. I',
        'IV/a' => 'Pembina',
        'III/d' => 'Penata Tk. I',
        'III/c' => 'Penata',
        'III/b' => 'Penata Muda Tk. I',
        'III/a' => 'Penata Muda',
        'II/d' => 'Pengatur Tk. I',
        'II/c' => 'Pengatur',
        'II/b' => 'Pengatur Muda Tk. I',
        'II/a' => 'Pengatur Muda',
    ];

    public const LIBRARIAN_POSITIONS = [
        'Pustakawan Ahli Utama',
        'Pustakawan Ahli Madya',
        'Pustakawan Ahli Muda',
        'Pustakawan Ahli Pertama',
        'Pustakawan Penyelia',
        'Pustakawan Mahir',
        'Pustakawan Terampil',
    ];

    /**
     * ['a', 'b'] or ['a' => 'A'] => [['value' => 'a', 'label' => 'A'], ...]
     *
     * @param  array<int|string, string>  $options
     * @return list<array{value: string, label: string}>
     */
    public static function forSelect(array $options): array
    {
        return array_is_list($options)
            ? array_map(fn ($o) => ['value' => $o, 'label' => $o], $options)
            : array_map(fn ($v, $l) => ['value' => (string) $v, 'label' => $l], array_keys($options), $options);
    }
}
