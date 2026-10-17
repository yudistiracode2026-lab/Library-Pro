<?php

namespace Tests\Unit;

use App\Support\NameCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class NameCaseTest extends TestCase
{
    /**
     * @return array<string, array{string, string}>
     */
    public static function names(): array
    {
        return [
            'all caps' => ['RAMADHANI NAUFAL', 'Ramadhani Naufal'],
            'all lower' => ['annisa putri lestari', 'Annisa Putri Lestari'],
            'apostrophe stays lower' => ["RAMADHANI NAUFAL NA'AFI", "Ramadhani Naufal Na'afi"],
            'curly apostrophe' => ['MA’IYA AFWAH', 'Ma’iya Afwah'],
            'initial without space' => ['M.irza Attarahman', 'M.Irza Attarahman'],
            'joined with a dot' => ['MUH.BILAL RAMADHAN', 'Muh.Bilal Ramadhan'],
            'initials' => ['A. MUH. FEBRI ANGGA', 'A. Muh. Febri Angga'],
            'hyphen' => ['SITI-NUR AISYAH', 'Siti-Nur Aisyah'],
            'particle' => ['MUHAMMAD BIN ABDULLAH', 'Muhammad bin Abdullah'],
            'particle in a mixed name' => ['Nafiah binti Salim', 'Nafiah binti Salim'],
            'al' => ['AGIDT AL RAYYAN BADRI', 'Agidt Al Rayyan Badri'],
            'degrees after a comma stay' => ['THERESIA SUPRIYANTI, S.SiT., M.T.', 'Theresia Supriyanti, S.SiT., M.T.'],
            'odd degrees stay too' => ['Gunawan Wibisana,s.st', 'Gunawan Wibisana,s.st'],
            'degree without comma' => ['Dadiyono SSi', 'Dadiyono SSi'],
            'haji' => ['H. SUTARMO, SH', 'H. Sutarmo, SH'],
            'prefix titles' => ['DR. IR. BUDI', 'Dr. Ir. Budi'],
            'card number as name' => ['12D14097', '12D14097'],
            'extra spaces' => ['  ANNISA   PUTRI ', 'Annisa Putri'],
            'initials in a mixed name stay' => ['Ozzy Sefriana NP', 'Ozzy Sefriana NP'],
            'short caps before the name stay' => ['BQ Uswatun M', 'BQ Uswatun M'],
            'deliberate spelling stays' => ['Umar ArifinBeleng', 'Umar ArifinBeleng'],
            'shouted word in a mixed name' => ['Annisa PUTRI lestari', 'Annisa Putri Lestari'],
            'joined degrees without comma' => ['H. Ali Pulungan SH.MH', 'H. Ali Pulungan SH.MH'],
            'initialism stays' => ['Denyndra ARWBK', 'Denyndra ARWBK'],
            'typed particle stays in a mixed name' => ['Geraldo Da Rosario Semi', 'Geraldo Da Rosario Semi'],
            'lowercase word in a mixed name' => ['agus Arifin masquri', 'Agus Arifin Masquri'],
            'prefix titles in a mixed name' => ['Prof. DR. Ir. SB. Silalahi, MS', 'Prof. Dr. Ir. SB. Silalahi, MS'],
        ];
    }

    #[DataProvider('names')]
    public function test_names_become_title_case(string $input, string $expected): void
    {
        $this->assertSame($expected, NameCase::title($input));
        $this->assertSame($expected, NameCase::title($expected), 'running it again changes nothing');
    }
}
