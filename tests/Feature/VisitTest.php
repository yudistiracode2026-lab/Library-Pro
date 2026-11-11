<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\MemberDevice;
use App\Models\User;
use App\Models\Visit;
use App\Services\MemberAccounts;
use App\Services\MemberDevices;
use App\Support\PresenceCode;
use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
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

        // A phone left on the scanner keeps being read, across a new code too.
        foreach (['08:00:08', '08:00:16', '08:00:24', '08:00:32'] as $time) {
            Carbon::setTestNow("2026-10-15 {$time}");
            $this->scan(PresenceCode::make($this->member))->assertJsonPath('status', 'ulang');
        }
        $this->assertNull(Visit::sole()->checked_out_at);

        // Taken away, then shown again: that is the exit.
        Carbon::setTestNow('2026-10-15 08:00:45');
        $this->scan(PresenceCode::make($this->member))->assertJsonPath('status', 'keluar');
        $this->assertNotNull(Visit::sole()->checked_out_at);
    }

    public function test_the_second_scan_soon_after_the_first_records_the_exit()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        $this->scan(PresenceCode::make($this->member))->assertJsonPath('status', 'masuk');

        Carbon::setTestNow('2026-10-15 08:00:15');
        $this->scan(PresenceCode::make($this->member))->assertJsonPath('status', 'keluar');
        $this->assertSame(1, Visit::count());
    }

    public function test_a_code_records_one_entry_and_one_exit_at_most()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        $code = PresenceCode::make($this->member);
        $this->scan($code)->assertJsonPath('status', 'masuk');

        Carbon::setTestNow('2026-10-15 08:00:11');
        $this->scan($code)->assertJsonPath('status', 'keluar');

        Carbon::setTestNow('2026-10-15 08:00:22');
        $this->scan($code)->assertJsonPath('status', 'ulang');
        $this->assertSame(1, Visit::count());
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

    private function registeredPhone(): array
    {
        $user = User::factory()->create(['password' => 'kebun-raya-99']);
        $this->member->update(['user_id' => $user->id]);
        $response = $this->post('/login', ['email' => '20220311', 'password' => 'kebun-raya-99', 'device' => true]);
        $cookie = collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === 'pustagra_perangkat');
        $this->assertNotNull($cookie);
        $this->post('/logout');
        $this->assertGuest();

        return [$user, $cookie->getValue()];
    }

    public function test_a_registered_phone_shows_the_qr_on_the_sign_in_page_without_signing_in()
    {
        [, $token] = $this->registeredPhone();
        $plain = CookieValuePrefix::remove(Crypt::decrypt($token, false));
        $this->assertSame(hash('sha256', $plain), MemberDevice::sole()->token_hash, 'only a hash is stored');

        $this->withUnencryptedCookie('pustagra_perangkat', $token)->get('/login')->assertInertia(fn (Assert $page) => $page
            ->where('attendance.name', 'Annisa Putri Lestari')
            ->where('attendance.qr.code', PresenceCode::make($this->member)));
        $this->assertGuest();

        $this->withCredentials()->withUnencryptedCookie('pustagra_perangkat', $token)->getJson('/presensi/kode?keperluan=1')->assertOk()
            ->assertJsonPath('code', PresenceCode::make($this->member, 1));

        // It opens attendance only: the portal still needs an account.
        $this->withUnencryptedCookie('pustagra_perangkat', $token)->get('/pemustaka')->assertRedirect('/login');
    }

    public function test_without_a_registered_phone_there_is_no_qr()
    {
        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('attendance', null));
        $this->getJson('/presensi/kode')->assertStatus(410);
        $this->withCredentials()->withUnencryptedCookie('pustagra_perangkat', 'tebakan')->getJson('/presensi/kode')->assertStatus(410);

        // Not ticking the box registers nothing.
        $user = User::factory()->create(['password' => 'kebun-raya-99']);
        $this->member->update(['user_id' => $user->id]);
        $this->post('/login', ['email' => '20220311', 'password' => 'kebun-raya-99']);
        $this->assertSame(0, MemberDevice::count());
    }

    public function test_a_member_has_one_phone_and_a_new_one_replaces_it()
    {
        [$user, $first] = $this->registeredPhone();

        $this->actingAs($user)->post('/pemustaka/presensi/perangkat')->assertSessionHas('success');
        $this->assertSame(1, MemberDevice::count());
        $this->post('/logout');

        $this->withCredentials()->withUnencryptedCookie('pustagra_perangkat', $first)->getJson('/presensi/kode')->assertStatus(410);
    }

    public function test_a_phone_can_be_released_from_the_sign_in_page()
    {
        [, $token] = $this->registeredPhone();

        $this->withUnencryptedCookie('pustagra_perangkat', $token)->post('/presensi/lepas')->assertSessionHas('status');
        $this->assertSame(0, MemberDevice::count());
    }

    public function test_changing_or_resetting_the_password_drops_other_phones_but_not_the_one_in_hand()
    {
        [$user, $token] = $this->registeredPhone();
        $change = ['current_password' => 'kebun-raya-99', 'password' => 'sawah-hijau-77', 'password_confirmation' => 'sawah-hijau-77'];

        // Changed on the registered phone itself: it stays.
        $this->actingAs($user)->withUnencryptedCookie('pustagra_perangkat', $token)->put('/pemustaka/kata-sandi', $change)->assertSessionHasNoErrors();
        $this->assertSame(1, MemberDevice::count());

        // Changed from another browser: the phone no longer counts.
        $this->unencryptedCookies = [];
        $this->put('/pemustaka/kata-sandi', ['current_password' => 'sawah-hijau-77', 'password' => 'kebun-raya-88', 'password_confirmation' => 'kebun-raya-88'])->assertSessionHasNoErrors();
        $this->assertSame(0, MemberDevice::count());

        // A reset by staff drops it too.
        app(MemberDevices::class)->register($this->member->fresh());
        $this->assertSame(1, MemberDevice::count());
        app(MemberAccounts::class)->resetToNumber($this->member->fresh());
        $this->assertSame(0, MemberDevice::count());
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
