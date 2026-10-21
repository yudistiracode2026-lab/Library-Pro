<?php

namespace Tests\Feature;

use App\Models\PokAccount;
use App\Models\PokActivity;
use App\Models\PokItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PokTest extends TestCase
{
    use RefreshDatabase;

    private function amounts(int $pagu, int $previous = 0, int $current = 0, int $lock = 0): array
    {
        return ['pagu' => $pagu, 'lock_pagu' => $lock, 'previous' => $previous, 'current' => $current];
    }

    public function test_only_admins_open_the_pok()
    {
        $this->actingAs(User::factory()->pustakawan()->create())->get('/staf/pok')->assertForbidden();
        $this->actingAs(User::factory()->admin()->create())->get('/staf/pok')->assertOk();
    }

    public function test_the_budget_is_entered_level_by_level_and_adds_up()
    {
        $this->actingAs(User::factory()->admin()->create());

        $this->post('/staf/pok/kegiatan', ['year' => 2026, 'code' => '051.0A', 'name' => 'Digitalisasi koleksi lama'])->assertSessionHasNoErrors();
        $activity = PokActivity::sole();

        $this->post("/staf/pok/kegiatan/{$activity->id}/akun", ['code' => '521213', 'name' => 'Belanja Honor Output Kegiatan']);
        $this->post("/staf/pok/kegiatan/{$activity->id}/akun", ['code' => '521219', 'name' => 'Belanja Barang Non Operasional Lainnya']);
        [$honor, $barang] = PokAccount::orderBy('code')->get();

        foreach ([['001264', 'Ketua', 275000], ['001265', 'Sekretaris', 250000], ['001266', 'Penanggungjawab', 300000], ['001267', 'Anggota', 1400000]] as [$code, $name, $pagu]) {
            $this->post("/staf/pok/akun/{$honor->id}/rincian", ['code' => $code, 'name' => $name, ...$this->amounts($pagu)])->assertSessionHasNoErrors();
        }
        foreach ([['000765', 'Penjilidan Ulang', 825000], ['001260', 'Scan Data Format Gambar', 10830000], ['001262', 'Burning CD/DVD, Cover CD/DVD, Box', 1620000], ['001263', 'Design Cover', 1620000]] as [$code, $name, $pagu]) {
            $this->post("/staf/pok/akun/{$barang->id}/rincian", ['code' => $code, 'name' => $name, ...$this->amounts($pagu)]);
        }

        // Some realisation: 825.000 last period and 412.500 in this one on the binding line.
        $binding = PokItem::where('code', '000765')->sole();
        $this->put("/staf/pok/rincian/{$binding->id}", ['code' => '000765', 'name' => 'Penjilidan Ulang', ...$this->amounts(825000, 400000, 25000, 100000)])
            ->assertSessionHasNoErrors();

        $this->get('/staf/pok?tahun=2026')->assertInertia(fn (Assert $page) => $page
            ->component('staf/pok')
            ->where('year', 2026)
            ->where('activities.0.pagu', 17120000)
            ->where('activities.0.accounts.0.pagu', 2225000)
            ->where('activities.0.accounts.1.pagu', 14895000)
            ->where('activities.0.accounts.1.items.0.realised', 425000)
            ->where('activities.0.accounts.1.items.0.remaining', 400000)
            ->where('activities.0.accounts.1.items.0.percent', 51.52)
            ->where('total.pagu', 17120000)
            ->where('total.lock_pagu', 100000)
            ->where('total.realised', 425000)
            ->where('total.remaining', 16695000));
    }

    public function test_years_are_kept_apart_and_codes_are_unique_within_their_parent()
    {
        $this->actingAs(User::factory()->admin()->create());
        $this->post('/staf/pok/kegiatan', ['year' => 2026, 'code' => '051.0A', 'name' => 'Digitalisasi']);
        $this->post('/staf/pok/kegiatan', ['year' => 2027, 'code' => '051.0A', 'name' => 'Digitalisasi'])->assertSessionHasNoErrors();
        $this->post('/staf/pok/kegiatan', ['year' => 2027, 'code' => '051.0A', 'name' => 'Lagi'])->assertSessionHasErrors('code');

        $this->get('/staf/pok?tahun=2027')->assertInertia(fn (Assert $page) => $page
            ->has('activities', 1)
            ->where('years', [2027, 2026]));

        $account = PokActivity::where('year', 2026)->sole()->accounts()->create(['code' => '521213', 'name' => 'Honor']);
        $this->post("/staf/pok/akun/{$account->id}/rincian", ['code' => '001264', 'name' => 'Ketua', ...$this->amounts(-5)])->assertSessionHasErrors('pagu');

        // Deleting an activity takes its accounts and lines with it.
        $account->items()->create(['code' => '001264', 'name' => 'Ketua', ...$this->amounts(275000)]);
        $this->delete("/staf/pok/kegiatan/{$account->pok_activity_id}");
        $this->assertSame(0, PokAccount::count() + PokItem::count());
    }
}
