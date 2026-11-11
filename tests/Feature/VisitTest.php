<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\User;
use App\Models\Visit;
use App\Support\PresenceCode;
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
            ->assertInertia(fn (Assert $page) => $page->where('stats.total', 1)->where('stats.inside', 1)->has('visits', 1));
    }

    private function scan(string $code)
    {
        return $this->postJson('/staf/kunjungan/pindai', ['code' => $code]);
    }

    public function test_the_desk_records_in_and_out_and_the_length_of_stay()
    {
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->scan(PresenceCode::make($this->member, 2))->assertOk()
            ->assertJsonPath('status', 'masuk')
            ->assertJsonPath('name', 'Annisa Putri Lestari')
            ->assertJsonPath('inside', 1);
        $visit = Visit::sole();
        $this->assertSame(Visit::PURPOSES[2], $visit->purpose);
        $this->assertSame(Visit::METHOD_QR, $visit->method);

        Carbon::setTestNow('2026-10-15 10:30:00');
        $this->scan(PresenceCode::make($this->member))->assertJsonPath('status', 'keluar')->assertJsonPath('minutes', 150)->assertJsonPath('inside', 0);
        $this->assertSame(150, $visit->fresh()->minutes());
        $this->assertSame(Visit::PURPOSES[2], $visit->fresh()->purpose);
    }

    public function test_a_scanner_reading_the_same_qr_repeatedly_changes_nothing()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        $code = PresenceCode::make($this->member);

        $this->scan($code)->assertJsonPath('status', 'masuk');
        $this->scan($code)->assertJsonPath('status', 'ulang');

        // A new code straight after is still within the minimum gap.
        Carbon::setTestNow('2026-10-15 08:00:31');
        $this->scan(PresenceCode::make($this->member))->assertJsonPath('status', 'ulang');
        $this->assertNull(Visit::sole()->checked_out_at);

        Carbon::setTestNow('2026-10-15 08:01:30');
        $this->scan(PresenceCode::make($this->member))->assertJsonPath('status', 'keluar');
    }

    public function test_a_code_used_once_cannot_be_used_again_after_the_gap()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        Carbon::setTestNow('2026-10-15 08:00:29');
        $code = PresenceCode::make($this->member);
        $this->scan($code)->assertJsonPath('status', 'masuk');

        // Still inside its grace window, past the gap only if the visit is backdated.
        Visit::sole()->update(['checked_in_at' => now()->subMinutes(5)]);
        $this->scan($code)->assertJsonPath('status', 'ulang');
        $this->assertNull(Visit::sole()->checked_out_at);
    }

    public function test_expired_forged_and_foreign_codes_are_rejected()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        $old = PresenceCode::make($this->member);
        $real = PresenceCode::make($this->member);

        $this->scan('palsu')->assertJsonPath('status', 'error');
        $this->scan('20220311')->assertJsonPath('status', 'error');
        // Another member's id on a signature made for this one.
        $this->scan(substr_replace($real, '000ZZZ', 3, 6))->assertJsonPath('status', 'error');

        Carbon::setTestNow('2026-10-15 08:05:00');
        $this->scan($old)->assertJsonPath('status', 'error')->assertJsonPath('name', 'Annisa Putri Lestari');
        $this->assertSame(0, Visit::count());
    }

    public function test_a_scan_survives_caps_lock_and_stray_spaces()
    {
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->scan(' '.strtolower(PresenceCode::make($this->member))."\n")->assertJsonPath('status', 'masuk');
    }

    public function test_only_staff_use_the_desk()
    {
        $this->actingAs(User::factory()->create());

        $this->get('/staf/kunjungan/meja')->assertForbidden();
        $this->scan(PresenceCode::make($this->member))->assertForbidden();
    }

    public function test_the_dashboard_reports_how_long_members_stay()
    {
        $other = Member::create(['member_number' => '20220312', 'name' => 'Budi', 'type' => 'Mahasiswa', 'study_program' => 'D4 Pertanahan']);
        Visit::create(['member_id' => $this->member->id, 'purpose' => 'Membaca', 'method' => 'QR', 'checked_in_at' => today()->setTime(7, 0), 'checked_out_at' => today()->setTime(7, 30)]);
        Visit::create(['member_id' => $this->member->id, 'purpose' => 'Membaca', 'method' => 'QR', 'checked_in_at' => today()->setTime(7, 10), 'checked_out_at' => today()->setTime(8, 0)]);
        Visit::create(['member_id' => $other->id, 'purpose' => 'Membaca', 'method' => 'QR', 'checked_in_at' => today()->setTime(7, 45)]);
        // Forgot to scan out yesterday: no known length, so left out of the average.
        Visit::create(['member_id' => $other->id, 'purpose' => 'Membaca', 'method' => 'QR', 'checked_in_at' => now()->subDay()]);

        $this->actingAs(User::factory()->pustakawan()->create())->get('/staf')->assertInertia(fn (Assert $page) => $page
            ->where('presence.completed', 2)
            ->where('presence.averageMinutes', 40)
            ->where('presence.totalMinutes', 80)
            ->where('presence.longestMinutes', 50)
            ->where('presence.missedCheckout', 1)
            ->where('presence.insideTotal', 1)
            ->where('presence.inside.0.name', 'Budi')
            ->where('presence.inside.0.minutes', 15));
    }
}
