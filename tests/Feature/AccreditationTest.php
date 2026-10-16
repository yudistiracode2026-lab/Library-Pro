<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Employee;
use App\Models\Evidence;
use App\Models\Indicator;
use App\Models\License;
use App\Models\Room;
use App\Models\User;
use App\Services\Accreditation\Scorer;
use App\Support\LibrarySettings;
use App\Support\WebsiteContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccreditationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        foreach (json_decode(file_get_contents(database_path('data/indicators.json')), true) as $i => $row) {
            $indicator = Indicator::create([
                'number' => $row['number'],
                'component' => (int) explode('.', $row['number'])[0],
                'name' => $row['name'],
                'mode' => $row['mode'],
                'options' => $row['options'],
                'source' => $row['source'],
                'position' => $i + 1,
            ]);

            foreach ($row['evidence'] as $label) {
                $indicator->evidence()->create(['label' => $label]);
            }
        }
    }

    private function scorer(): Scorer
    {
        return app(Scorer::class);
    }

    public function test_all_56_indicators_and_six_components_are_defined()
    {
        $results = $this->scorer()->evaluate();
        $summary = $this->scorer()->summary($results);

        $this->assertCount(56, $results);
        $this->assertSame([52, 44, 44, 24, 28, 32], array_column($summary['components'], 'max'));
        $this->assertSame(100, array_sum(array_column($summary['components'], 'weight')));
    }

    public function test_final_score_weights_components_and_maps_to_a_predicate()
    {
        // Every manual indicator at option a; computed ones depend on (empty) data.
        Indicator::query()->update(['manual_score' => 4]);
        $all4 = $this->scorer()->summary($this->scorer()->evaluate());

        // Pelayanan (weight 35, 11 IK, max 44): each step is worth 35/44 NA.
        $this->assertEqualsWithDelta(35 / 44, $this->scorer()->gainPerStep($this->scorer()->evaluate(), 3), 0.0001);
        $this->assertSame('A', Scorer::predicate(91)['letter']);
        $this->assertSame('B', Scorer::predicate(90.99)['letter']);
        $this->assertSame('C', Scorer::predicate(60)['letter']);
        $this->assertSame('Tidak Terakreditasi', Scorer::predicate(59.9)['label']);
        $this->assertLessThan(100, $all4['finalScore']);
    }

    public function test_computed_indicators_follow_system_data_and_round_down()
    {
        LibrarySettings::save(['sivitas' => 1000]);
        Room::create(['floor' => 2, 'name' => 'Rak', 'type' => 'koleksi', 'area_m2' => 400, 'map_x' => 0, 'map_y' => 0, 'map_w' => 1, 'map_h' => 1]);
        License::create(['name' => 'A', 'usage' => 'x', 'seats' => 1, 'status' => 'Berlisensi']);
        License::create(['name' => 'B', 'usage' => 'x', 'seats' => 1, 'status' => 'Tidak berlisensi']);
        Asset::create(['name' => 'Kursi', 'category' => 'Perabot', 'function' => 'Membaca', 'quantity' => 3, 'condition' => 'Baik']);
        Asset::create(['name' => 'Kursi lama', 'category' => 'Perabot', 'function' => 'Membaca', 'quantity' => 1, 'condition' => 'Rusak berat']);
        Employee::create(['kind' => 'pustakawan', 'nip' => '196807251991031002', 'name' => 'Y', 'golongan' => 'IV/a', 'position' => 'P']);

        $r = $this->scorer()->evaluate();

        // 400 m² and 0.4 m²/sivitas: option b needs ≥ 500 m², so c.
        $this->assertSame(2, $r['2.1']['score']);
        // 1 of 2 licensed = 50% → 41–60% band.
        $this->assertSame(2, $r['2.8']['score']);
        // 3 of 4 units in good condition = 75% is not "> 75%".
        $this->assertSame(3, $r['2.3']['score']);
        // 1 librarian ÷ (1000 ÷ 600) = 60% → 51–75%.
        $this->assertSame(3, $r['4.3']['score']);
        $this->assertTrue($r['4.3']['computed']);
        // The default schedule is 39 hours a week.
        $this->assertSame(39.0, WebsiteContent::weeklyHours());
        $this->assertSame(1, $r['3.1']['score']);
    }

    public function test_manual_scores_need_a_note_and_cannot_override_computed_ones()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        $manual = Indicator::where('number', '4.1')->sole();
        $computed = Indicator::where('number', '2.8')->sole();

        $this->patch("/staf/akreditasi/indikator/{$manual->id}", ['manual_score' => 3])->assertSessionHasErrors('manual_note');
        $this->patch("/staf/akreditasi/indikator/{$manual->id}", ['manual_score' => 3, 'manual_value' => 'S-2 bidang lain', 'manual_note' => 'Ijazah terlampir'])
            ->assertSessionHasNoErrors();
        $this->patch("/staf/akreditasi/indikator/{$computed->id}", ['manual_score' => 4, 'manual_note' => 'x'])->assertStatus(409);

        $this->assertSame(3, $this->scorer()->evaluate()['4.1']['score']);
    }

    public function test_evidence_upload_is_a_draft_until_the_head_approves()
    {
        $evidence = Evidence::first();
        $librarian = User::factory()->pustakawan()->create();
        $head = User::factory()->pustakawan()->create();
        Employee::create(['kind' => 'pustakawan', 'nip' => '196807251991031002', 'name' => 'Kepala', 'golongan' => 'IV/a', 'position' => 'P', 'is_head' => true, 'user_id' => $head->id]);

        $this->actingAs($librarian)
            ->post("/staf/akreditasi/bukti/{$evidence->id}/unggah", ['file' => UploadedFile::fake()->create('sk.pdf', 200, 'application/pdf')])
            ->assertSessionHas('success');
        $this->post("/staf/akreditasi/bukti/{$evidence->id}/unggah", ['file' => UploadedFile::fake()->create('virus.exe', 10)])->assertSessionHasErrors('file');

        $evidence->refresh();
        $this->assertSame(Evidence::DRAFT, $evidence->status);
        Storage::disk('local')->assertExists($evidence->file_path);

        $this->post("/staf/akreditasi/bukti/{$evidence->id}/sahkan")->assertForbidden();
        $this->actingAs($head)->post("/staf/akreditasi/bukti/{$evidence->id}/sahkan")->assertSessionHas('success');
        $this->assertSame(Evidence::APPROVED, $evidence->fresh()->status);
    }

    public function test_approved_evidence_past_its_validity_counts_as_expired()
    {
        $evidence = Evidence::first();
        $evidence->update(['status' => Evidence::APPROVED, 'file_path' => 'x.pdf', 'valid_until' => today()->subDay()]);

        $this->assertSame(Evidence::EXPIRED, $evidence->effectiveStatus());
    }

    public function test_gap_lists_indicators_below_a_by_gain()
    {
        Indicator::query()->update(['manual_score' => 3]);
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->get('/staf/akreditasi/gap')->assertInertia(fn (Assert $page) => $page
            ->component('staf/akreditasi/gap')
            // Pelayanan steps are worth the most (35/44 ≈ 0.80).
            ->where('rows.0.componentName', 'Pelayanan')
            ->where('rows.0.gain', 0.8));
    }

    public function test_only_the_head_approves_a_submission_once_every_check_passes()
    {
        $this->actingAs(User::factory()->pustakawan()->create())->post('/staf/akreditasi/berkas/setujui')->assertForbidden();

        $this->actingAs(User::factory()->admin()->create());
        $this->post('/staf/akreditasi/berkas/setujui')->assertSessionHas('error');
        $this->assertNull(LibrarySettings::get('accreditation_approved_at'));

        Storage::disk('local')->put('bukti/a.pdf', '%PDF');
        Evidence::query()->update(['status' => Evidence::APPROVED, 'file_path' => 'bukti/a.pdf']);
        $this->post('/staf/akreditasi/berkas/setujui')->assertSessionHas('success');
        $this->assertNotNull(LibrarySettings::get('accreditation_approved_at'));
        $this->get('/staf/akreditasi/berkas')->assertInertia(fn (Assert $page) => $page->whereNot('approvedAt', null));
    }

    public function test_pages_documents_package_and_snapshot()
    {
        $this->actingAs(User::factory()->admin()->create());

        foreach (['dasbor', 'indikator', 'gap', 'bukti', 'berkas'] as $page) {
            $this->get("/staf/akreditasi/{$page}")->assertOk();
        }
        $this->get('/staf/akreditasi/indikator?ik=1.2')->assertInertia(fn (Assert $page) => $page->where('selected.number', '1.2'));

        foreach (['formulir', 'profil', 'pernyataan'] as $doc) {
            $this->get("/staf/akreditasi/berkas/{$doc}")->assertOk()->assertHeader('content-type', 'application/pdf');
        }

        $this->get('/staf/akreditasi/berkas/paket-bukti')->assertSessionHas('error');

        Storage::disk('local')->put('bukti/a.pdf', '%PDF');
        Evidence::first()->update(['status' => Evidence::APPROVED, 'file_path' => 'bukti/a.pdf']);
        $this->get('/staf/akreditasi/berkas/paket-bukti')->assertOk()->assertDownload();

        $this->post('/staf/akreditasi/snapshot')->assertSessionHas('success');
        $this->assertDatabaseCount('accreditation_snapshots', 1);
    }
}
