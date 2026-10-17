<?php

namespace Tests\Unit;

use App\Support\AuthorName;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AuthorNameTest extends TestCase
{
    /**
     * @return array<string, array{string, list<string>}>
     */
    public static function entries(): array
    {
        return [
            'et al. marker' => ['Oloan Sitorus dkk 5 orang', ['Oloan Sitorus']],
            'et al. glued to the count' => ['Aristiono Nugroho dkk6 orang', ['Aristiono Nugroho']],
            'et al. after a comma' => ['Siti Indarwati, dkk', ['Siti Indarwati']],
            'glued title' => ['Prof. DR.Kaelan,M.S', ['Prof. Dr. Kaelan, M.S.']],
            'initials spacing' => ['M.Yahya Harahap, SH', ['M. Yahya Harahap, S.H.']],
            'degrees standardised' => ['Widi Nugraha Ingsih, SH., MH.', ['Widi Nugraha Ingsih, S.H., M.H.']],
            'degree typed with a comma' => ['Dr. Gabib Adjie, S,H., M.Hum.', ['Dr. Gabib Adjie, S.H., M.Hum.']],
            'comma inside the name' => ['Prof. Soedjito, Sosrodihardjo, SH, MA', ['Prof. Soedjito, Sosrodihardjo, S.H., M.A.']],
            'rare degrees stay with the name' => ['Drs. Rasmon Sinamo, M.A.P.', ['Drs. Rasmon Sinamo, M.A.P.']],
            'leading dot' => ['. Wantjik Saleh', ['Wantjik Saleh']],
            'list with "dan"' => ['Oloan Sitorus Dan Darwinsyah Minin', ['Oloan Sitorus', 'Darwinsyah Minin']],
            'list with commas and "and"' => ['J.C. Muller, J.P. Lagrange And R. Weibel', ['J.C. Muller', 'J.P. Lagrange', 'R. Weibel']],
            'list with semicolons' => ['Pamela Allen; Tineke Wellwig; Anne Booth', ['Pamela Allen', 'Tineke Wellwig', 'Anne Booth']],
            'one-word name in a list' => ['Aristiono Nugroho, Suharno, Tullus Subroto', ['Aristiono Nugroho', 'Suharno', 'Tullus Subroto']],
            'two people by a comma' => ['Prof. DR. Soerjono Soekanto, Sri Mamuji', ['Prof. Dr. Soerjono Soekanto', 'Sri Mamuji']],
            'degree then another person' => ['Prof. R. Subekti, S.H. , R Tjitrosudibio', ['Prof. R. Subekti, S.H.', 'R Tjitrosudibio']],
            'title split by a semicolon' => ['Prof. Dr; Husaini Usman, M.Pd., M.T.', ['Prof. Dr. Husaini Usman, M.Pd., M.T.']],
            'apostrophe typed as semicolon' => ['Anang Sujana dan Syafi;ie El Bantanie', ['Anang Sujana', 'Syafiie El Bantanie']],
            'organisation with "dan" is one' => ['Pusat Pembinaan Dan Pengembangan Bahasa', ['Pusat Pembinaan dan Pengembangan Bahasa']],
            'organisation keeps acronyms' => ['BADAN PERTANAHAN NASIONAL RI', ['Badan Pertanahan Nasional RI']],
            'firm is not split' => ['Red. Griffin And George Limited', ['Red. Griffin and George Limited']],
            'letter by letter' => ['A R M I N', ['Armin']],
            'letter by letter with a tail' => ['J U N A Idi', ['Junaidi']],
            'apostrophes and quotes go' => ['"Dr. Siska Lis Sulistiani, M.Ag.', ['Dr. Siska Lis Sulistiani, M.Ag.']],
            'apostrophe inside a name' => ["Abdul Mun'im Saleh", ['Abdul Munim Saleh']],
            'odd case' => ['Andi Ryan Eru KUrniawan Mappatombong', ['Andi Ryan Eru Kurniawan Mappatombong']],
            'shouted inside a name' => ['rADEN Dani Fauzan', ['Raden Dani Fauzan']],
            'mc names and particles' => ['Nikolaos van Dam, Geoffrey McNicoll', ['Nikolaos van Dam', 'Geoffrey McNicoll']],
            'initials stay' => ['Prof. Dr. Maria S.W. Sumardjono, SH', ['Prof. Dr. Maria S.W. Sumardjono, S.H.']],
            'roman numeral' => ['Hamengku Buwono IX', ['Hamengku Buwono IX']],
            'unknown degrees stay' => ['Dr. Ir. Max H. Pohan, CES, M.A.', ['Dr. Ir. Max H. Pohan, CES, M.A.']],
            'hyphen and slash parts' => ['Kementerian Agraria Dan Tata Ruang/BPN, McGraw-Hill', ['Kementerian Agraria dan Tata Ruang/BPN, McGraw-Hill']],
            'and the others' => ['Adiwan F. Aritenang, and the others', ['Adiwan F. Aritenang']],
            'names typed together' => ['KarlMay', ['Karl May']],
            'broken quote encoding' => ['RIFâ€™ATI Dina Handayani', ['Rifati Dina Handayani']],
            'acronym after a dot' => ['Badan Pusat Statistik Prop.DIY', ['Badan Pusat Statistik Prop.DIY']],
            'list joined by hyphens' => ['Arthur H. Robinson-Joel L. Morrison-Phillip C. Muehrcke', ['Arthur H. Robinson', 'Joel L. Morrison', 'Phillip C. Muehrcke']],
            'hyphenated name stays' => ['R. Andre Karo-Karo', ['R. Andre Karo-Karo']],
            'organisation small words' => ['Biro HUkum Dan Hubungan Masyarakat BPN', ['Biro Hukum dan Hubungan Masyarakat BPN']],
            'cut-off list' => ['Dominik Bonatz, John David Neidel and', ['Dominik Bonatz', 'John David Neidel']],
        ];
    }

    /**
     * @param  list<string>  $expected
     */
    #[DataProvider('entries')]
    public function test_entries_are_cleaned_and_split(string $entry, array $expected): void
    {
        $this->assertSame($expected, AuthorName::people($entry));

        // Cleaning a cleaned name changes nothing.
        foreach ($expected as $name) {
            $this->assertSame([$name], AuthorName::people($name), "stable: {$name}");
        }
    }

    public function test_spellings_of_one_person_share_a_key(): void
    {
        $key = AuthorName::key('Prof. Dr. Soerjono Soekanto, S.H., M.A.');

        foreach (['Soerjono Soekanto', 'DR. Soerjono Soekanto, SH.', 'Prof.Dr.Soerjono Soekanto, SH., MA'] as $spelling) {
            $this->assertSame($key, AuthorName::key(AuthorName::people($spelling)[0]));
        }

        $this->assertNotSame(AuthorName::key('R. Widodo'), AuthorName::key('Dr. Widodo'), 'Raden is part of the name');
    }
}
