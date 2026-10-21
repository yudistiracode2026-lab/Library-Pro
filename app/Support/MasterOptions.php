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

    /** Sub-types of the collection; each belongs to one SNP collection type below. */
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

    /**
     * Collection types of the Standar Nasional Perpustakaan Perguruan Tinggi
     * (Perka Perpusnas 13/2017), and the sub-types in each.
     */
    public const COLLECTION_CATEGORIES = [
        'Koleksi umum' => ['Buku teks'],
        'Referensi' => ['Referensi', 'Peta & atlas'],
        'Terbitan berkala' => ['Jurnal & majalah'],
        'Muatan lokal' => ['Skripsi', 'Tugas akhir & laporan PKL', 'Prosiding', 'Terbitan STPN Press'],
    ];

    /** Material types (jenis bahan) as in INLISLite, the Perpusnas library system. */
    public const MATERIAL_TYPES = [
        'Monograf',
        'Terbitan berkala',
        'Bahan kartografis',
        'Bahan grafis',
        'Rekaman suara',
        'Rekaman video',
        'Bentuk mikro',
        'Sumber elektronik',
        'Braille',
    ];

    public const ACQUISITIONS = ['Pengadaan', 'Penyerahan mahasiswa, tendik dan dosen', 'Sumbangan mahasiswa'];

    /** Languages used in the old SLiMS catalogue. */
    public const LANGUAGES = ['Indonesia', 'Inggris', 'Indonesia / Inggris', 'Indonesia / Arab', 'Arab', 'Belanda', 'Jerman', 'Lainnya'];

    public const EBOOK_FORMATS = ['PDF', 'EPUB'];

    public const EBOOK_STATUSES = ['Terbit', 'Draf'];

    public const AUTHOR_TYPES = ['Perorangan', 'Lembaga'];

    public const ACTIVE_STATUSES = ['Aktif', 'Nonaktif'];

    public const SUPPLIER_TYPES = ['Distributor', 'Toko buku', 'Penerbit langsung'];

    public const MEMBER_TYPES = ['Mahasiswa', 'Dosen', 'Tendik', 'Umum'];

    public const MEMBER_STATUSES = ['Aktif', 'Nonaktif', 'Diblokir'];

    public const STUDY_PROGRAMS = ['D4 Pertanahan', 'D1 Pengukuran dan Pemetaan Kadastral', 'Dosen', 'Tendik', 'Umum'];

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
    /** The SNP collection type of a sub-type: "Skripsi" -> "Muatan lokal". */
    public static function categoryOf(?string $collectionType): ?string
    {
        foreach (self::COLLECTION_CATEGORIES as $category => $types) {
            if (in_array($collectionType, $types, true)) {
                return $category;
            }
        }

        return null;
    }

    /**
     * Sub-types for a select, labelled with their collection type: "Skripsi · Muatan lokal".
     *
     * @return list<array{value: string, label: string}>
     */
    public static function collectionTypeOptions(): array
    {
        return array_map(fn ($t) => ['value' => $t, 'label' => $t === self::categoryOf($t) ? $t : $t.' · '.self::categoryOf($t)], self::COLLECTION_TYPES);
    }

    public static function forSelect(array $options): array
    {
        return array_is_list($options)
            ? array_map(fn ($o) => ['value' => $o, 'label' => $o], $options)
            : array_map(fn ($v, $l) => ['value' => (string) $v, 'label' => $l], array_keys($options), $options);
    }
}
