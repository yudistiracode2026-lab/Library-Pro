<?php

namespace Tests\Unit;

use App\Support\TitleText;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class TitleTextTest extends TestCase
{
    /**
     * @return array<string, array{string, string}>
     */
    public static function titles(): array
    {
        return [
            'all caps' => ['PENGARUH PEMBANGUNAN JALAN LINGKAR UTARA TERHADAP HARGA TANAH DI KABUPATEN MAGETAN',
                'Pengaruh Pembangunan Jalan Lingkar Utara terhadap Harga Tanah di Kabupaten Magetan'],
            'function words stay small' => ['Kapita Selekta Hukum Pidana Dan Kriminologi', 'Kapita Selekta Hukum Pidana dan Kriminologi'],
            'first word and after a colon' => ['dari desa ke kota: dan seterusnya', 'Dari Desa ke Kota: Dan Seterusnya'],
            'english' => ['ONE SIMPLE IDEA FOR STARTUPS AND ENTREPRENEURS', 'One Simple Idea for Startups and Entrepreneurs'],
            'acronyms' => ['EVALUASI PTSL DAN UUPA DI BPN', 'Evaluasi PTSL dan UUPA di BPN'],
            'acronym in brackets' => ['PEMANFAATAN PETA TEMATIK (PTPR) DI DESA', 'Pemanfaatan Peta Tematik (PTPR) di Desa'],
            'inner capitals' => ['UJI APLIKASI AutoLISP DALAM AutoCAD', 'Uji Aplikasi AutoLISP dalam AutoCAD'],
            'roman numerals' => ['KOTAMADYA DAERAH TINGKAT II MADIUN', 'Kotamadya Daerah Tingkat II Madiun'],
            'initials' => ['PROVINSI D.I. YOGYAKARTA', 'Provinsi D.I. Yogyakarta'],
            'case numbers stay' => ['PUTUSAN NOMOR: 149/PID.B/2023/PN', 'Putusan Nomor: 149/PID.B/2023/PN'],
            'hyphenated' => ['UNDANG-UNDANG POKOK AGRARIA', 'Undang-Undang Pokok Agraria'],
            'glued abbreviation' => ['TANAH DI KEC.TULANG BAWANG', 'Tanah di Kec. Tulang Bawang'],
            'spacing' => ['Ceramah : Direktur  Landreform ( Studi Kasus )', 'Ceramah: Direktur Landreform (Studi Kasus)'],
            'bracket glued to a word' => ['Peran Dan Tanggung Jawab(PPAT)Terhadap Akta', 'Peran dan Tanggung Jawab (PPAT) terhadap Akta'],
            'place name after a place word' => ['KALURAHAN THE HOK', 'Kalurahan The Hok'],
            'function word after a place word' => ['WILAYAH KABUPATEN DALAM PERSPEKTIF', 'Wilayah Kabupaten dalam Perspektif'],
        ];
    }

    #[DataProvider('titles')]
    public function test_titles_follow_puebi_title_case(string $input, string $expected): void
    {
        $this->assertSame($expected, TitleText::title($input));
        $this->assertSame($expected, TitleText::title($expected), 'running it again changes nothing');
    }

    public function test_acronyms_are_learnt_from_normal_case_titles_only(): void
    {
        $acronyms = TitleText::learnAcronyms([
            'Penilaian NJOP di Kabupaten Bantul',
            'Evaluasi NJOP dan Pajak',
            'Peta TANAH Desa', 'Peta TANAH Kota',
            'SEMUA HURUF BESAR XYZ', 'SEMUA HURUF BESAR XYZ',
        ], ['tanah' => true]);

        $this->assertArrayHasKey('NJOP', $acronyms);
        $this->assertArrayNotHasKey('TANAH', $acronyms, 'a dictionary word in capitals is emphasis');
        $this->assertArrayNotHasKey('XYZ', $acronyms, 'all-caps titles say nothing about acronyms');
    }
}
