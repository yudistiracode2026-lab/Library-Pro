<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\User;
use App\Models\Visit;
use App\Support\KioskToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VisitTest extends TestCase
{
    use RefreshDatabase;

    private Member $member;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-15 08:00:00');
        $this->member = Member::create(['member_number' => '20220311', 'name' => 'Annisa Putri Lestari', 'type' => 'Mahasiswa', 'study_program' => 'D4 Pertanahan']);
    }

    public function test_staff_entry_toggles_a_member_in_and_out()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        $entry = ['mode' => 'anggota', 'member_number' => '20220311', 'purpose' => 'Membaca'];

        $this->post('/staf/kunjungan', $entry)->assertSessionHas('success');
        $this->assertNull(Visit::sole()->checked_out_at);

        Carbon::setTestNow('2026-10-15 10:30:00');
        $this->post('/staf/kunjungan', $entry);
        $this->assertSame('10:30', Visit::sole()->checked_out_at->format('H:i'));

        $this->post('/staf/kunjungan', [...$entry, 'member_number' => '000'])->assertSessionHasErrors('member_number');
    }

    public function test_guests_are_logged_and_can_be_checked_out()
    {
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->post('/staf/kunjungan', ['mode' => 'tamu', 'purpose' => 'Membaca'])->assertSessionHasErrors('guest_name');
        $this->post('/staf/kunjungan', ['mode' => 'tamu', 'guest_name' => 'Puji Astuti', 'guest_org' => 'BPN Kab. Bantul', 'purpose' => 'Membaca']);

        $visit = Visit::sole();
        $this->assertSame(Visit::METHOD_GUEST, $visit->method);

        $this->post("/staf/kunjungan/{$visit->id}/keluar");
        $this->assertNotNull($visit->fresh()->checked_out_at);
    }

    public function test_dashboard_counts_only_todays_visits()
    {
        Visit::create(['member_id' => $this->member->id, 'purpose' => 'Membaca', 'method' => 'QR', 'checked_in_at' => now()->subDay()]);
        Visit::create(['member_id' => $this->member->id, 'purpose' => 'Membaca', 'method' => 'QR', 'checked_in_at' => now()]);

        $this->actingAs(User::factory()->pustakawan()->create())
            ->get('/staf/kunjungan')
            ->assertInertia(fn (Assert $page) => $page->where('stats.total', 1)->where('stats.inside', 1)->has('visits', 1)->has('qr.url'));
    }

    public function test_kiosk_qr_unlocks_check_in_for_a_linked_member()
    {
        $user = User::factory()->create();
        $this->member->update(['user_id' => $user->id]);

        $this->actingAs($user)->get('/presensi?t='.KioskToken::current())->assertRedirect('/presensi');
        $this->get('/presensi')->assertInertia(fn (Assert $page) => $page->component('pemustaka/presensi')->where('notice', null)->where('inside', null));

        $this->post('/presensi', ['purpose' => 'Mengerjakan tugas'])->assertSessionHas('success');
        $this->assertSame(Visit::METHOD_QR, Visit::sole()->method);

        // The unlock is used up; a second post needs a fresh scan.
        $this->post('/presensi', ['purpose' => 'Membaca'])->assertSessionHas('error');
        $this->assertNull(Visit::sole()->checked_out_at);
    }

    public function test_scanning_before_login_survives_the_login_redirect()
    {
        $this->get('/presensi?t='.KioskToken::current())->assertRedirect('/presensi');
        $this->get('/presensi')->assertRedirect('/login');

        $user = User::factory()->create();
        $this->member->update(['user_id' => $user->id]);

        Carbon::setTestNow('2026-10-15 08:05:00');
        $this->actingAs($user)->post('/presensi', ['purpose' => 'Membaca'])->assertSessionHas('success');
    }

    public function test_expired_or_forged_codes_are_rejected()
    {
        $old = KioskToken::current();
        Carbon::setTestNow('2026-10-15 08:05:00');

        $this->get('/presensi?t=palsu')->assertInertia(fn (Assert $page) => $page->where('notice', fn ($n) => str_contains($n, 'kedaluwarsa')));
        $this->get("/presensi?t={$old}")->assertInertia(fn (Assert $page) => $page->where('notice', fn ($n) => str_contains($n, 'kedaluwarsa')));
    }

    public function test_a_valid_code_unlocks_for_a_short_while_only()
    {
        $user = User::factory()->create();
        $this->member->update(['user_id' => $user->id]);
        $this->actingAs($user)->get('/presensi?t='.KioskToken::current());

        Carbon::setTestNow('2026-10-15 08:11:00');
        $this->post('/presensi', ['purpose' => 'Membaca'])->assertSessionHas('error');
        $this->assertSame(0, Visit::count());
    }
}
