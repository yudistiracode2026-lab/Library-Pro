<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MemberAccountsTest extends TestCase
{
    use RefreshDatabase;

    private function member(string $number, ?string $email = null): Member
    {
        return Member::create(['member_number' => $number, 'name' => "Anggota {$number}", 'type' => 'Mahasiswa', 'study_program' => 'D4 Pertanahan', 'email' => $email, 'status' => 'Aktif']);
    }

    public function test_bulk_activation_gives_every_member_an_account_with_the_nim_as_password()
    {
        $a = $this->member('20220311', 'annisa@example.com');
        $b = $this->member('20220312');
        // Address already used by a staff account: the member gets a stand-in one.
        User::factory()->pustakawan()->create(['email' => 'shared@example.com']);
        $c = $this->member('20220313', 'shared@example.com');

        $this->artisan('pemustaka:aktifkan-akun --coba')->expectsOutputToContain('Akan dibuat: 3 akun.')->assertSuccessful();
        $this->assertSame(0, Member::whereNotNull('user_id')->count());

        $this->artisan('pemustaka:aktifkan-akun')->assertSuccessful();

        foreach ([$a, $b, $c] as $m) {
            $user = $m->fresh()->user;
            $this->assertSame(UserRole::Pemustaka, $user->role);
            $this->assertTrue($user->must_change_password);
            $this->assertTrue(Hash::check($m->member_number, $user->password));
        }
        $this->assertSame('annisa@example.com', $a->fresh()->user->email);
        $this->assertStringEndsWith('@anggota.invalid', $c->fresh()->user->email);

        // Run again: nothing left to do.
        $this->artisan('pemustaka:aktifkan-akun')->expectsOutputToContain('Dibuat: 0 akun.');
    }

    public function test_first_sign_in_requires_a_new_password_before_anything_else()
    {
        $member = $this->member('20220311');
        $this->artisan('pemustaka:aktifkan-akun');

        $this->post('/login', ['email' => '20220311', 'password' => '20220311'])->assertRedirect('/dashboard');
        $this->get('/dashboard')->assertRedirect(route('pemustaka.sandi'));
        $this->get(route('pemustaka.beranda'))->assertRedirect(route('pemustaka.sandi'));
        $this->get(route('pemustaka.sandi'))->assertInertia(fn ($page) => $page->component('pemustaka/sandi')->where('required', true));

        // The NIM/NIP again, or a mismatch, is refused.
        $this->put(route('pemustaka.sandi.update'), ['password' => '20220311', 'password_confirmation' => '20220311'])->assertSessionHasErrors('password');
        $this->put(route('pemustaka.sandi.update'), ['password' => 'kebun-raya-99', 'password_confirmation' => 'lain'])->assertSessionHasErrors('password');

        $this->put(route('pemustaka.sandi.update'), ['password' => 'kebun-raya-99', 'password_confirmation' => 'kebun-raya-99'])
            ->assertRedirect(route('pemustaka.beranda'));
        $user = $member->fresh()->user;
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('kebun-raya-99', $user->password));
        $this->get(route('pemustaka.beranda'))->assertOk();

        // Later changes ask for the current password.
        $this->put(route('pemustaka.sandi.update'), ['password' => 'sawah-hijau-77', 'password_confirmation' => 'sawah-hijau-77'])->assertSessionHasErrors('current_password');
        $this->put(route('pemustaka.sandi.update'), ['current_password' => 'kebun-raya-99', 'password' => 'sawah-hijau-77', 'password_confirmation' => 'sawah-hijau-77'])
            ->assertSessionHasNoErrors();
    }

    public function test_staff_reset_a_password_to_the_nim_and_new_members_get_an_account()
    {
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->post(route('staf.pemustaka.store'), [
            'name' => 'Budi', 'member_number' => '20230001', 'study_program' => 'D4 Pertanahan', 'type' => 'Mahasiswa', 'status' => 'Aktif',
        ])->assertSessionHasNoErrors();
        $member = Member::where('member_number', '20230001')->sole();
        $this->assertTrue(Hash::check('20230001', $member->user->password));

        $member->user->forceFill(['password' => Hash::make('lupa-lagi'), 'must_change_password' => false])->save();
        $this->post(route('staf.pemustaka.reset-password', $member))->assertSessionHas('success');
        $user = $member->fresh()->user;
        $this->assertTrue(Hash::check('20230001', $user->password));
        $this->assertTrue($user->must_change_password);

        // Deleting the member removes the portal account too.
        $this->delete(route('staf.pemustaka.destroy', $member));
        $this->assertModelMissing($user);
    }
}
