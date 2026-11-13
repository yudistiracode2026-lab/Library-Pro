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
            $this->assertTrue(Hash::check($m->member_number, $user->password));
        }
        $this->assertSame('annisa@example.com', $a->fresh()->user->email);
        $this->assertStringEndsWith('@anggota.invalid', $c->fresh()->user->email);

        // Run again: nothing left to do.
        $this->artisan('pemustaka:aktifkan-akun')->expectsOutputToContain('Dibuat: 0 akun.');
    }

    public function test_members_sign_in_with_the_nim_as_password_and_go_straight_to_the_portal()
    {
        $this->member('20220311');
        $this->artisan('pemustaka:aktifkan-akun');

        $this->post('/login', ['email' => '20220311', 'password' => '20220311'])->assertRedirect('/dashboard');
        $this->get(route('pemustaka.beranda'))->assertOk();

        // There is no page to change it.
        $this->get('/pemustaka/kata-sandi')->assertNotFound();
    }

    public function test_library_staff_become_members_with_their_nip()
    {
        $this->actingAs(User::factory()->admin()->create());
        $employee = ['name' => 'Dewi Anggraini', 'nip' => '198206242003122002', 'golongan' => 'III/a', 'position' => 'Pustakawan Ahli Pertama', 'status' => 'Aktif'];

        $this->post(route('staf.pustakawan.store'), $employee)->assertSessionHasNoErrors();
        $member = Member::where('member_number', '198206242003122002')->sole();
        $this->assertSame(['Tendik', 'Tendik', 'Aktif'], [$member->type, $member->study_program, $member->status]);
        $this->assertTrue(Hash::check('198206242003122002', $member->user->password));

        // Already a member but marked inactive, as many SLiMS records are: made active.
        $this->member('199001012015031001')->update(['type' => 'Tendik', 'study_program' => 'Tendik', 'status' => 'Nonaktif']);
        $this->post(route('staf.tendik.store'), ['name' => 'Indra Kusuma', 'nip' => '199001012015031001', 'golongan' => 'III/b', 'position' => 'Pengelola Arsip', 'status' => 'Aktif'])->assertSessionHasNoErrors();
        $this->assertSame('Aktif', Member::where('member_number', '199001012015031001')->value('status'));
        $this->assertSame(2, Member::count());
    }

    public function test_staff_reset_a_password_to_the_nim_and_new_members_get_an_account()
    {
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->post(route('staf.pemustaka.store'), [
            'name' => 'Budi', 'member_number' => '20230001', 'study_program' => 'D4 Pertanahan', 'type' => 'Mahasiswa', 'status' => 'Aktif',
        ])->assertSessionHasNoErrors();
        $member = Member::where('member_number', '20230001')->sole();
        $this->assertTrue(Hash::check('20230001', $member->user->password));

        $member->user->forceFill(['password' => Hash::make('lupa-lagi')])->save();
        $this->post(route('staf.pemustaka.reset-password', $member))->assertSessionHas('success');
        $user = $member->fresh()->user;
        $this->assertTrue(Hash::check('20230001', $user->password));

        // Deleting the member removes the portal account too.
        $this->delete(route('staf.pemustaka.destroy', $member));
        $this->assertModelMissing($user);
    }
}
