<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Member;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MemberCertificateTest extends TestCase
{
    use RefreshDatabase;

    private Member $member;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create();
        $this->member = Member::create([
            'member_number' => '23303145', 'name' => 'Rizky Aditya Pratama', 'type' => 'Mahasiswa',
            'study_program' => 'D4 Pertanahan', 'status' => 'Aktif', 'user_id' => $user->id,
        ]);
        Employee::create(['kind' => 'pustakawan', 'nip' => '196807251991031002', 'name' => 'Yosep Nai Helly, S.SiT., M.A.', 'golongan' => 'IV/a', 'position' => 'Pustakawan Ahli Madya', 'status' => 'Aktif', 'is_head' => true]);
        $this->actingAs($user);
    }

    private function visit(string $method): void
    {
        Visit::create(['member_id' => $this->member->id, 'purpose' => 'Membaca', 'method' => $method, 'checked_in_at' => now()->subDay(), 'checked_out_at' => now()->subDay()->addHour()]);
    }

    public function test_the_letter_needs_a_visit_recorded_by_the_scanner()
    {
        // Visits typed in by staff or carried over from SLiMS do not count.
        $this->visit(Visit::METHOD_MANUAL);

        $this->get(route('pemustaka.surat-keterangan'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('pemustaka/surat-keterangan')->where('student', true)->where('scans', 0)->where('programme', 'Diploma IV Pertanahan'));
        $this->get(route('pemustaka.surat-keterangan.download', ['semester' => 5, 'kelas' => 'B']))->assertForbidden();

        $this->visit(Visit::METHOD_QR);
        $this->get(route('pemustaka.surat-keterangan'))->assertInertia(fn (Assert $page) => $page->where('scans', 1));

        $response = $this->get(route('pemustaka.surat-keterangan.download', ['semester' => 5, 'kelas' => 'Kelas B']))->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString('surat-keterangan-perpustakaan-23303145.pdf', $response->headers->get('content-disposition'));
    }

    public function test_the_letter_reads_like_the_library_form()
    {
        $this->visit(Visit::METHOD_QR);
        $this->travelTo(now()->setDate(2026, 11, 9));

        $html = view('pdf.surat-keterangan-pemustaka', [
            'member' => $this->member,
            'semester' => 'V (Lima)',
            'kelas' => 'Diploma IV Pertanahan – Kelas B',
            'nomor' => '/UPA-PERPUS/STPN/XI/2026',
            'date' => '9 November 2026',
            'head' => Employee::where('is_head', true)->first(),
            'logo' => public_path('images/logo-stpn.png'),
        ])->render();

        foreach (['SURAT KETERANGAN', '/UPA-PERPUS/STPN/XI/2026', 'Yosep Nai Helly, S.SiT., M.A.', '196807251991031002', 'Rizky Aditya Pratama', '23303145', 'V (Lima)', 'Diploma IV Pertanahan – Kelas B', 'Yogyakarta, 9 November 2026'] as $text) {
            $this->assertStringContainsString($text, $html);
        }
    }

    public function test_the_semester_is_required_and_only_cadets_get_the_letter()
    {
        $this->visit(Visit::METHOD_QR);
        $this->get(route('pemustaka.surat-keterangan.download'))->assertSessionHasErrors('semester');

        $this->member->update(['type' => 'Dosen', 'study_program' => 'Dosen']);
        $this->actingAs(User::find($this->member->user_id));
        $this->get(route('pemustaka.surat-keterangan'))->assertInertia(fn (Assert $page) => $page->where('student', false));
        $this->get(route('pemustaka.surat-keterangan.download', ['semester' => 1]))->assertForbidden();
    }
}
