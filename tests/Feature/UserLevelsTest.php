<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserLevelsTest extends TestCase
{
    use RefreshDatabase;

    /** Management pages: superadmin and head. */
    private const MANAGEMENT = ['staf.akreditasi.dasbor', 'staf.akreditasi.bukti', 'staf.pok', 'staf.aset.denah'];

    /** The Sistem group: superadmin only. */
    private const SYSTEM = ['staf.cms', 'staf.laporan', 'staf.pengaturan'];

    /** Pages every staff level opens. */
    private const DESK = [
        'staf.dashboard',
        // Master data
        'staf.buku', 'staf.pengarang', 'staf.penerbit', 'staf.penyedia', 'staf.pemustaka', 'staf.pustakawan', 'staf.tendik', 'staf.aset.ruang', 'staf.aset.inventaris',
        // Layanan, Koleksi, Kepegawaian, Akademik
        'staf.kunjungan', 'staf.sirkulasi', 'staf.pencarian', 'staf.cctv', 'staf.opname', 'staf.pengadaan', 'staf.sampul', 'staf.kegiatan', 'staf.lembur', 'staf.bebas-pustaka',
    ];

    private function as(UserRole $role): User
    {
        $user = User::factory()->create(['role' => $role]);
        $this->actingAs($user);

        return $user;
    }

    private function menu(): array
    {
        return collect($this->get(route('staf.dashboard'))->viewData('page')['props']['stafMenu'])
            ->flatMap(fn ($group) => collect($group['items'])->flatMap(fn ($item) => $item['children'] ? array_column($item['children'], 'key') : [$item['key']]))
            ->all();
    }

    public function test_the_superadmin_opens_everything()
    {
        $this->as(UserRole::Admin);

        foreach ([...self::DESK, ...self::MANAGEMENT, ...self::SYSTEM] as $route) {
            $this->get(route($route))->assertOk();
        }
        $this->assertContains('laporan', $this->menu());
    }

    public function test_the_head_of_library_opens_everything_but_the_system_pages()
    {
        $this->as(UserRole::Kepala);

        foreach ([...self::DESK, ...self::MANAGEMENT] as $route) {
            $this->get(route($route))->assertOk();
        }
        foreach (self::SYSTEM as $route) {
            $this->get(route($route))->assertForbidden();
        }

        $menu = $this->menu();
        $this->assertContains('pok', $menu);
        $this->assertContains('akreditasi.dasbor', $menu);
        $this->assertEmpty(array_intersect(['cms', 'laporan', 'pengaturan'], $menu));
        $this->get(route('staf.lembur'))->assertInertia(fn (Assert $page) => $page->where('canManage', true));
    }

    public function test_desk_levels_see_the_ordinary_staff_pages()
    {
        foreach ([UserRole::Sirkulasi, UserRole::PengolahData, UserRole::Referensi] as $role) {
            $this->as($role);

            foreach (self::DESK as $route) {
                $this->get(route($route))->assertOk();
            }
            foreach ([...self::MANAGEMENT, ...self::SYSTEM] as $route) {
                $this->get(route($route))->assertForbidden();
            }
            $this->assertEmpty(array_intersect(['akreditasi.dasbor', 'pok', 'cms', 'laporan', 'pengaturan'], $this->menu()));
            $this->assertContains('pustakawan', $this->menu());
        }
    }

    public function test_only_the_superadmin_and_head_choose_the_head_of_library()
    {
        $employee = ['name' => 'Pustakawan Contoh', 'nip' => '199001012020121002', 'golongan' => 'III/a', 'position' => 'Pustakawan Ahli Pertama', 'status' => 'Aktif', 'is_head' => true];

        $this->as(UserRole::Sirkulasi);
        $this->get(route('staf.pustakawan'))->assertInertia(fn (Assert $page) => $page->where('canSetHead', false));
        $this->post(route('staf.pustakawan.store'), $employee)->assertSessionHasNoErrors();
        $this->assertFalse(Employee::where('nip', '199001012020121002')->value('is_head'));

        $this->as(UserRole::Kepala);
        $record = Employee::where('nip', '199001012020121002')->sole();
        $this->put(route('staf.pustakawan.update', $record), $employee)->assertSessionHasNoErrors();
        $this->assertTrue($record->fresh()->is_head);
    }

    public function test_staff_sign_in_with_their_nip_on_the_staff_page()
    {
        $user = User::factory()->create(['role' => UserRole::Sirkulasi, 'email' => '199001012020121001@pegawai.invalid', 'password' => Hash::make('contoh-sandi-uji')]);
        Employee::create(['kind' => 'tendik', 'nip' => '199001012020121001', 'name' => 'Petugas Contoh', 'golongan' => 'II/c', 'position' => 'Pengadministrasi Perkantoran', 'status' => 'Aktif', 'user_id' => $user->id]);

        $this->post(route('staf.login.store'), ['email' => '199001012020121001', 'password' => 'contoh-sandi-uji'])->assertRedirect();
        $this->assertAuthenticatedAs($user);
    }
}
