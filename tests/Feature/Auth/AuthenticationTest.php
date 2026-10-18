<?php

namespace Tests\Feature\Auth;

use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered()
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen()
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password()
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    public function test_members_and_staff_have_their_own_login_pages()
    {
        $this->get('/login')->assertInertia(fn ($page) => $page->component('auth/login')->where('portal', 'pemustaka'));
        $this->get('/staf/masuk')->assertInertia(fn ($page) => $page->component('auth/login')->where('portal', 'staf'));
    }

    public function test_staff_sign_in_on_the_staff_page()
    {
        $staff = User::factory()->pustakawan()->create();

        $this->post('/staf/masuk', ['email' => $staff->email, 'password' => 'password'])->assertRedirect('/staf');
        $this->assertAuthenticatedAs($staff);

        // Staff go back to their own sign-in page on logout.
        $this->post('/logout')->assertRedirect('/staf/masuk');
    }

    public function test_members_sign_in_with_their_nim()
    {
        $user = User::factory()->create();
        Member::create(['member_number' => '20220311', 'name' => 'Annisa', 'type' => 'Mahasiswa', 'study_program' => 'D4 Pertanahan', 'status' => 'Aktif', 'user_id' => $user->id]);

        $this->post('/login', ['email' => '20220311', 'password' => 'password'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_the_wrong_login_page_signs_nobody_in_and_points_to_the_right_one()
    {
        $staff = User::factory()->pustakawan()->create();
        $member = User::factory()->create();

        $this->from('/login')->post('/login', ['email' => $staff->email, 'password' => 'password'])
            ->assertSessionHasErrors(['email' => 'Akun petugas masuk lewat halaman login staf.']);
        $this->assertGuest();

        $this->from('/staf/masuk')->post('/staf/masuk', ['email' => $member->email, 'password' => 'password'])
            ->assertSessionHasErrors(['email' => 'Akun pemustaka masuk lewat halaman login pemustaka.']);
        $this->assertGuest();
    }

    public function test_a_wrong_password_never_reveals_which_page_an_account_uses()
    {
        $staff = User::factory()->pustakawan()->create();

        $this->from('/login')->post('/login', ['email' => $staff->email, 'password' => 'salah'])
            ->assertSessionHasErrors(['email' => 'Email atau kata sandi tidak cocok.']);
    }
}
