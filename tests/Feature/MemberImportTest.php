<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

class MemberImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->pustakawan()->create());
        Member::create(['member_number' => '2602020001', 'name' => 'Sudah Ada', 'type' => 'Mahasiswa', 'study_program' => 'D4 Pertanahan', 'status' => 'Aktif']);
    }

    private function upload(UploadedFile $file, array $extra = [])
    {
        return $this->post(route('staf.pemustaka.import'), ['file' => $file, 'default_type' => 'Mahasiswa', 'default_program' => 'D4 Pertanahan', ...$extra]);
    }

    private function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('angkatan.csv', $content);
    }

    public function test_a_semicolon_csv_from_excel_adds_members_with_accounts_and_reports_the_rest()
    {
        $this->upload($this->csv(implode("\n", [
            'NIM;Nama;Jenis;Prodi;Email;Status',
            '2602020221;budi santoso;;;budi@example.com;',
            '2603020070;Citra Lestari;Taruna;D1;;',
            '2602020001;Sudah Ada;;;;',
            '198206242003122002;Dewi Anggraini;Pustakawan;;;Aktif',
            '2602020221;Ganda;;;;',
            '2602020300;Eko;Satpam;;;',
            ';Tanpa Nomor;;;;',
            ';;;;;',
        ])))->assertSessionHas('success')->assertSessionHas('importReport', fn ($r) => $r['added'] === 3 && $r['existing'] === 1 && count($r['problems']) === 3);

        $budi = Member::where('member_number', '2602020221')->sole();
        $this->assertSame(['Budi Santoso', 'Mahasiswa', 'D4 Pertanahan', 'budi@example.com', 'Aktif'], [$budi->name, $budi->type, $budi->study_program, $budi->email, $budi->status]);
        $this->assertSame('D1 Pengukuran dan Pemetaan Kadastral', Member::where('member_number', '2603020070')->value('study_program'));
        $dewi = Member::where('member_number', '198206242003122002')->sole();
        $this->assertSame(['Tendik', 'Tendik'], [$dewi->type, $dewi->study_program]);

        // Every new member can sign in with the NIM/NIP straight away.
        foreach ([$budi, $dewi] as $m) {
            $this->assertTrue(Hash::check($m->member_number, $m->fresh()->user->password));
        }
        $this->post('/logout');
        $this->post('/login', ['email' => '198206242003122002', 'password' => '198206242003122002'])->assertRedirect('/dashboard');

        // The report is shown on the page after the upload.
        $this->actingAs(User::factory()->pustakawan()->create());
        $this->upload($this->csv("NIM;Nama\n2602020221;Budi Santoso"))->assertSessionHas('error');
        $this->get(route('staf.pemustaka'))->assertInertia(fn (Assert $page) => $page->where('importReport.existing', 1));
        $this->get(route('staf.pemustaka'))->assertInertia(fn (Assert $page) => $page->where('importReport', null));
    }

    public function test_the_applied_bachelor_programmes_are_recognised()
    {
        $this->upload($this->csv(implode("\n", [
            'NO;NIT;NAMA;PROGRAM STUDI;KELAS',
            '1;2604020066;ABDIEL JABBAR SYADID;Sarjana Terapan KMPT;I/A',
            '2;2603020067;AGISNA RAHMA;Sarjana Terapan MPRP;I/A',
            '3;2601355998;A. ATHIRAH RAMADHANI AMRI;Diploma IV Pertanahan;I/A',
            '4;2602020146;ABIGAIL DIMOMONMAU;Sarjana Terapan SPIP;I/A',
        ])))->assertSessionHas('importReport', fn ($r) => $r['added'] === 4 && $r['problems'] === []);

        $this->assertSame(
            ['Sarjana Terapan KMPT', 'Sarjana Terapan MPRP', 'Sarjana Terapan SPIP', 'D4 Pertanahan'],
            Member::whereIn('member_number', ['2604020066', '2603020067', '2601355998', '2602020146'])->orderBy('member_number', 'desc')->pluck('study_program')->all(),
        );
    }

    public function test_a_file_without_the_required_headers_adds_nothing()
    {
        $this->upload($this->csv("Nomor Induk Mahasiswa,Nama Taruna\n2602020500,Fajar"))
            ->assertSessionHas('error')->assertSessionHas('importReport', fn ($r) => $r['added'] === 0 && str_contains($r['problems'][0], 'judul kolom'));
        $this->assertSame(1, Member::count());
    }

    public function test_an_excel_file_is_read_and_a_nip_stored_as_a_number_is_refused()
    {
        $path = tempnam(sys_get_temp_dir(), 'impor').'.xlsx';
        $writer = new Writer;
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues(['NIM/NIP', 'Nama', 'Jenis']));
        $writer->addRow(Row::fromValues([2602020400, 'Gilang Ramadhan', 'Mahasiswa']));
        $writer->addRow(Row::fromValues([1.98206242003122E+17, 'Hana Pertiwi', 'Tendik']));
        $writer->addRow(Row::fromValues(['199001012015031001', 'Indra Kusuma', 'Dosen']));
        $writer->close();

        $this->upload(new UploadedFile($path, 'pegawai.xlsx', null, null, true))
            ->assertSessionHas('importReport', fn ($r) => $r['added'] === 2 && str_contains($r['problems'][0], 'Teks'));
        $this->assertTrue(Member::where('member_number', '2602020400')->exists());
        $this->assertSame('Dosen', Member::where('member_number', '199001012015031001')->value('study_program'));
    }

    public function test_the_template_is_an_excel_sheet_with_the_headers()
    {
        $response = $this->get(route('staf.pemustaka.import-template'))->assertOk();
        $reader = new Reader;
        $reader->open($response->getFile()->getPathname());
        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $this->assertSame(['NIM/NIP', 'Nama', 'Jenis', 'Program studi', 'Email', 'Status'], $row->toArray());
                break;
            }
            break;
        }
        $reader->close();
    }

    public function test_only_staff_import()
    {
        $this->actingAs(User::factory()->create());
        $this->upload($this->csv("NIM;Nama\n2602020600;Joko"))->assertForbidden();
    }
}
