<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\StafMenu;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StafPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/staf')->assertRedirect('/login');
    }

    public function test_staff_are_sent_from_dashboard_to_the_staff_portal()
    {
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->get('/dashboard')->assertRedirect('/staf');
    }

    public function test_members_land_on_the_member_page()
    {
        $this->actingAs(User::factory()->create());

        $this->get('/dashboard')->assertRedirect('/pemustaka');
        // An account the circulation desk has not linked to a member yet.
        $this->get('/pemustaka')->assertInertia(fn (Assert $page) => $page->component('pemustaka/belum-terhubung'));
    }

    public function test_members_cannot_open_the_staff_portal()
    {
        $this->actingAs(User::factory()->create());

        $this->get('/staf')->assertForbidden();
        $this->get('/staf/sirkulasi')->assertForbidden();
    }

    public function test_pustakawan_can_open_shared_pages_but_not_admin_pages()
    {
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->get('/staf')->assertOk();
        $this->get('/staf/sirkulasi')->assertOk();
        $this->get('/staf/aset/ruang')->assertOk();

        foreach (['pustakawan', 'tendik', 'cms', 'pengaturan'] as $path) {
            $this->get("/staf/{$path}")->assertForbidden();
        }
    }

    public function test_admin_can_open_every_staff_page()
    {
        $this->actingAs(User::factory()->admin()->create());

        foreach (StafMenu::pages() as $page) {
            $url = $page['key'] === 'dashboard' ? '/staf' : "/staf/{$page['path']}";

            $this->get($url)->assertOk();
        }
    }

    public function test_menu_hides_admin_pages_from_pustakawan()
    {
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->get('/staf')->assertInertia(function (Assert $page) {
            $keys = collect($page->toArray()['props']['stafMenu'])
                ->flatMap(fn ($group) => $group['items'])
                ->pluck('key');

            $this->assertContains('sirkulasi', $keys);
            $this->assertNotContains('pustakawan', $keys);
            $this->assertNotContains('pengaturan', $keys);
        });
    }

    public function test_menu_is_not_shared_with_members()
    {
        $this->actingAs(User::factory()->create());

        $this->get('/pemustaka')->assertInertia(fn (Assert $page) => $page->where('stafMenu', null));
    }

    public function test_every_menu_link_resolves_to_a_route()
    {
        $this->actingAs(User::factory()->admin()->create());

        $this->get('/staf')->assertInertia(function (Assert $page) {
            $hrefs = collect($page->toArray()['props']['stafMenu'])
                ->flatMap(fn ($group) => $group['items'])
                ->flatMap(fn ($item) => $item['children'] ?? [$item])
                ->pluck('href');

            $this->assertCount(27, $hrefs);
            $this->assertNotContains(null, $hrefs);
        });
    }

    public function test_forbidden_pages_render_the_branded_error_page()
    {
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->get('/staf/pengaturan')
            ->assertForbidden()
            ->assertInertia(fn (Assert $page) => $page->component('error')->where('status', 403));
    }

    public function test_failed_login_message_is_in_indonesian()
    {
        $user = User::factory()->create();

        $this->from('/login')->post('/login', ['email' => $user->email, 'password' => 'salah'])
            ->assertSessionHasErrors(['email' => 'Email atau kata sandi tidak cocok.']);
    }

    public function test_new_registrations_are_members()
    {
        $this->post('/register', [
            'name' => 'Pemustaka Baru',
            'email' => 'baru@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertSame('pemustaka', User::where('email', 'baru@example.com')->first()->role->value);
    }
}
