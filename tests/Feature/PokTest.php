<?php

namespace Tests\Feature;

use App\Models\PokAccount;
use App\Models\PokActivity;
use App\Models\PokItem;
use App\Models\PokProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PokTest extends TestCase
{
    use RefreshDatabase;

    private function amounts(int $pagu, int $lock = 0): array
    {
        return ['pagu' => $pagu, 'lock_pagu' => $lock];
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

        $this->get('/staf/pok?tahun=2026&bulan=10')->assertInertia(fn (Assert $page) => $page
            ->component('staf/pok')
            ->where('year', 2026)
            ->where('month', 10)
            ->where('activities.0.pagu', 17120000)
            ->where('activities.0.accounts.0.pagu', 2225000)
            ->where('activities.0.accounts.1.pagu', 14895000)
            ->where('total.pagu', 17120000)
            ->where('total.realised', 0)
            ->where('total.remaining', 17120000));
    }

    public function test_progress_is_entered_in_rupiah_up_to_the_pagu_and_split_by_period()
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        $line = PokActivity::create(['year' => 2026, 'code' => '051.0A', 'name' => 'Digitalisasi'])
            ->accounts()->create(['code' => '521219', 'name' => 'Belanja barang'])
            ->items()->create(['code' => '000765', 'name' => 'Penjilidan Ulang', ...$this->amounts(825000)]);

        $this->post("/staf/pok/rincian/{$line->id}/progres", ['date' => '2026-09-15', 'amount' => 400000])->assertSessionHasNoErrors();
        $this->post("/staf/pok/rincian/{$line->id}/progres", ['date' => '2026-10-02', 'amount' => 25000])->assertSessionHasNoErrors();

        // More than what is left of the pagu (400.000), a date outside the budget year, nothing at all: refused.
        $this->post("/staf/pok/rincian/{$line->id}/progres", ['date' => '2026-10-03', 'amount' => 400001])
            ->assertSessionHasErrors(['amount' => 'Melebihi pagu. Yang masih bisa diinput paling banyak Rp 400.000.']);
        $this->post("/staf/pok/rincian/{$line->id}/progres", ['date' => '2025-12-31', 'amount' => 1000])->assertSessionHasErrors('date');
        $this->post("/staf/pok/rincian/{$line->id}/progres", ['date' => '2026-10-03', 'amount' => 0])->assertSessionHasErrors('amount');
        $this->assertSame(2, PokProgress::count());
        $this->assertSame($admin->id, PokProgress::first()->user_id);

        // October: September is "periode lalu", October "periode ini".
        $this->get('/staf/pok?tahun=2026&bulan=10')->assertInertia(fn (Assert $page) => $page
            ->where('periodLabel', 'Oktober 2026')
            ->where('activities.0.accounts.0.items.0.previous', 400000)
            ->where('activities.0.accounts.0.items.0.current', 25000)
            ->where('activities.0.accounts.0.items.0.realised', 425000)
            ->where('activities.0.accounts.0.items.0.percent', 51.52)
            ->where('activities.0.accounts.0.items.0.remaining', 400000)
            ->where('activities.0.accounts.0.items.0.available', 400000)
            ->has('activities.0.accounts.0.items.0.progress', 2)
            ->where('total.realised', 425000));

        // September: October's amount is not reported yet.
        $this->get('/staf/pok?tahun=2026&bulan=9')->assertInertia(fn (Assert $page) => $page
            ->where('activities.0.accounts.0.items.0.previous', 0)
            ->where('activities.0.accounts.0.items.0.current', 400000)
            ->where('activities.0.accounts.0.items.0.remaining', 425000));

        // The rest of the pagu exactly is fine; then nothing more fits.
        $this->post("/staf/pok/rincian/{$line->id}/progres", ['date' => '2026-10-05', 'amount' => 400000])->assertSessionHasNoErrors();
        $this->post("/staf/pok/rincian/{$line->id}/progres", ['date' => '2026-10-06', 'amount' => 1])
            ->assertSessionHasErrors(['amount' => 'Realisasi rincian ini sudah mencapai pagu.']);

        // The pagu cannot be cut below what has been spent; a wrong entry can be deleted.
        $this->put("/staf/pok/rincian/{$line->id}", ['code' => '000765', 'name' => 'Penjilidan Ulang', ...$this->amounts(800000)])->assertSessionHasErrors('pagu');
        $this->delete('/staf/pok/progres/'.PokProgress::latest('id')->first()->id);
        $this->assertSame(425000, (int) $line->progress()->sum('amount'));
    }

    public function test_the_period_defaults_to_this_month_for_this_year_and_december_before()
    {
        Carbon::setTestNow('2026-10-21 09:00');
        $this->actingAs(User::factory()->admin()->create());

        $this->get('/staf/pok?tahun=2026')->assertInertia(fn (Assert $page) => $page->where('month', 10));
        $this->get('/staf/pok?tahun=2025')->assertInertia(fn (Assert $page) => $page->where('month', 12));
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

        // Deleting an activity takes its accounts, lines and progress with it.
        $account->items()->create(['code' => '001264', 'name' => 'Ketua', ...$this->amounts(275000)])
            ->progress()->create(['date' => '2026-03-01', 'amount' => 1000]);
        $this->delete("/staf/pok/kegiatan/{$account->pok_activity_id}");
        $this->assertSame(0, PokAccount::count() + PokItem::count() + PokProgress::count());
    }
}
