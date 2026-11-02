<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Author;
use App\Models\Book;
use App\Models\Floor;
use App\Models\FloorFixture;
use App\Models\FloorPlanVersion;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FloorPlanTest extends TestCase
{
    use RefreshDatabase;

    private Floor $floor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->floor = Floor::where('number', 2)->sole();
        $this->floor->fixtures()->delete();
        $this->actingAs(User::factory()->admin()->create());
    }

    private function room(string $name = 'Ruang baca', array $attributes = []): Room
    {
        return Room::create([
            'floor' => 2, 'name' => $name, 'type' => 'baca', 'area_m2' => 16,
            'map_x' => 0, 'map_y' => 0, 'map_w' => 4, 'map_h' => 4, ...$attributes,
        ]);
    }

    private function roomRow(?Room $room, array $changes = []): array
    {
        return [
            'id' => $room?->id, 'name' => $room?->name ?? 'Baru', 'type' => $room?->type ?? 'pendukung', 'area' => $room?->area_m2 ?? 0,
            'area_manual' => $room?->area_manual ?? false, 'outside' => false,
            'x' => $room?->map_x ?? 0, 'y' => $room?->map_y ?? 0, 'w' => $room?->map_w ?? 4, 'h' => $room?->map_h ?? 4, ...$changes,
        ];
    }

    private function save(array $changes = [], ?Floor $floor = null)
    {
        $floor ??= $this->floor->fresh();

        return $this->put("/staf/aset/denah/{$floor->id}", [
            'version' => $floor->version, 'name' => $floor->name, 'width' => $floor->width_m, 'length' => $floor->length_m,
            'rooms' => [], 'racks' => [], 'fixtures' => [], ...$changes,
        ]);
    }

    public function test_only_admins_edit_the_plan()
    {
        $this->get('/staf/aset/denah?lantai=2')->assertInertia(fn (Assert $page) => $page
            ->component('staf/aset/denah')
            ->where('floor.number', 2)
            ->has('floors', 3));

        $this->actingAs(User::factory()->pustakawan()->create());
        $this->get('/staf/aset/denah')->assertForbidden();
        $this->save()->assertForbidden();
    }

    public function test_the_area_follows_the_drawing_unless_it_is_official()
    {
        $drawn = $this->room('Digambar', ['area_m2' => 16]);
        $official = $this->room('Resmi', ['area_m2' => 50, 'area_manual' => true, 'map_x' => 5]);
        $moved = $this->room('Digeser', ['area_m2' => 17, 'map_x' => 10]);

        $this->save(['rooms' => [
            $this->roomRow($drawn, ['w' => 5, 'h' => 6]),
            $this->roomRow($official, ['w' => 5, 'h' => 6, 'area' => 51]),
            // Moved, not resized: its recorded area stays.
            $this->roomRow($moved, ['x' => 12, 'y' => 3]),
            $this->roomRow(null, ['name' => 'Ruang rapat', 'x' => 15, 'w' => 2.5, 'h' => 4]),
        ]])->assertSessionHasNoErrors();

        $this->assertSame(30.0, $drawn->fresh()->area_m2);
        $this->assertSame(51.0, $official->fresh()->area_m2);
        $this->assertSame(17.0, $moved->fresh()->area_m2);
        $this->assertSame(12.0, $moved->fresh()->map_x);
        $this->assertSame(10.0, Room::where('name', 'Ruang rapat')->sole()->area_m2);
    }

    public function test_saving_over_a_newer_save_is_refused()
    {
        $old = $this->floor->fresh();
        $this->save(['name' => 'Lantai dua'])->assertSessionHasNoErrors();
        $this->assertSame($old->version + 1, $this->floor->fresh()->version);

        $this->put("/staf/aset/denah/{$old->id}", [
            'version' => $old->version, 'name' => 'Terlambat', 'width' => 20, 'length' => 20, 'rooms' => [], 'racks' => [], 'fixtures' => [],
        ])->assertSessionHasErrors('version');
        $this->assertSame('Lantai dua', $this->floor->fresh()->name);
    }

    public function test_things_must_stay_inside_the_floor_and_rack_codes_stay_unique()
    {
        $room = $this->room();
        $this->save(['rooms' => [$this->roomRow($room, ['x' => 18])]])->assertSessionHasErrors('width');
        $this->assertSame(0.0, $room->fresh()->map_x);

        Rack::create(['code' => 'A1', 'name' => 'Lain', 'floor' => 1]);
        $rack = ['id' => null, 'code' => 'a1', 'name' => 'Baru', 'x' => 0, 'y' => 0, 'w' => 1, 'h' => 3];
        $this->save(['rooms' => [$this->roomRow($room)], 'racks' => [$rack]])->assertSessionHasErrors('racks');
        $this->save(['rooms' => [$this->roomRow($room)], 'racks' => [['code' => 'B1', ...$rack, 'code' => 'B1'], [...$rack, 'code' => 'b1']]])->assertSessionHasErrors('racks');
    }

    public function test_a_room_with_assets_cannot_vanish_without_a_new_home()
    {
        $room = $this->room('Lama');
        $home = $this->room('Tujuan', ['floor' => 3]);
        $asset = Asset::create(['name' => 'AC', 'category' => 'Sarana', 'function' => 'Pendingin', 'room_id' => $room->id, 'quantity' => 2, 'condition' => 'Baik']);

        $this->save()->assertSessionHasErrors('moves');
        $this->assertModelExists($room);

        $this->save(['moves' => [$room->id => $home->id]])->assertSessionHasNoErrors();
        $this->assertModelMissing($room);
        $this->assertSame($home->id, $asset->fresh()->room_id);
    }

    public function test_a_rack_with_books_cannot_be_removed_and_codes_can_swap()
    {
        $a = Rack::create(['code' => 'X1', 'name' => 'Satu', 'floor' => 2]);
        $b = Rack::create(['code' => 'X2', 'name' => 'Dua', 'floor' => 2]);
        Book::create(['type' => Book::PRINTED, 'title' => 'T', 'author_id' => Author::idForName('A'), 'publisher_id' => Publisher::idForName('P'), 'ddc_class' => '300', 'collection_type' => 'Buku teks', 'rack_id' => $a->id]);
        $row = fn (Rack $r, string $code) => ['id' => $r->id, 'code' => $code, 'name' => $r->name, 'x' => 0, 'y' => 0, 'w' => 1, 'h' => 3];

        $this->save(['racks' => [$row($b, 'X2')]])->assertSessionHasErrors('racks');
        $this->assertModelExists($a);

        $this->save(['racks' => [$row($a, 'X2'), $row($b, 'X1')]])->assertSessionHasNoErrors();
        $this->assertSame('X2', $a->fresh()->code);
        $this->assertSame('X1', $b->fresh()->code);
    }

    public function test_only_what_left_the_plan_is_deleted()
    {
        $elsewhere = $this->room('Lantai lain', ['floor' => 3]);
        $gone = $this->room('Dihapus');
        $kept = $this->room('Tetap', ['map_x' => 6]);
        $goneRack = Rack::create(['code' => 'H1', 'name' => 'Dihapus', 'floor' => 2]);
        $keptRack = Rack::create(['code' => 'H2', 'name' => 'Tetap', 'floor' => 2]);
        $otherRack = Rack::create(['code' => 'H3', 'name' => 'Lantai lain', 'floor' => 3]);
        $goneFixture = FloorFixture::create(['floor_id' => $this->floor->id, 'label' => 'Dihapus', 'map_x' => 0, 'map_y' => 0, 'map_w' => 1, 'map_h' => 1]);
        $keptFixture = FloorFixture::create(['floor_id' => $this->floor->id, 'label' => 'Tetap', 'map_x' => 0, 'map_y' => 0, 'map_w' => 1, 'map_h' => 1]);

        $this->save([
            'rooms' => [$this->roomRow($kept)],
            'racks' => [['id' => $keptRack->id, 'code' => 'H2', 'name' => 'Tetap', 'x' => 0, 'y' => 0, 'w' => 1, 'h' => 3]],
            'fixtures' => [['id' => $keptFixture->id, 'label' => 'Tetap', 'icon' => 'repeat', 'x' => 0, 'y' => 0, 'w' => 1, 'h' => 1]],
        ])->assertSessionHasNoErrors();

        foreach ([$gone, $goneRack, $goneFixture] as $model) {
            $this->assertModelMissing($model);
        }
        foreach ([$kept, $elsewhere, $keptRack, $otherRack, $keptFixture] as $model) {
            $this->assertModelExists($model);
        }
    }

    public function test_each_save_keeps_the_previous_layout_and_old_versions_are_pruned()
    {
        $room = $this->room('Sebelum');
        $this->save(['rooms' => [$this->roomRow($room, ['name' => 'Sesudah'])]])->assertSessionHasNoErrors();

        $version = FloorPlanVersion::sole();
        $this->assertSame('Sebelum', $version->payload['rooms'][0]['name']);
        $this->assertSame(auth()->id(), $version->user_id);

        foreach (range(1, 22) as $i) {
            $this->save(['rooms' => [$this->roomRow($room->fresh(), ['name' => "Ruang {$i}"])]])->assertSessionHasNoErrors();
        }
        $this->assertSame(20, FloorPlanVersion::count());
        $this->get('/staf/aset/denah?lantai=2')->assertInertia(fn (Assert $page) => $page
            ->has('versions', 20)
            ->where('versions.0.layout.rooms.0.name', 'Ruang 21'));
    }

    public function test_a_fixture_edited_here_appears_on_the_rack_map_in_percent()
    {
        $this->save(['fixtures' => [['id' => null, 'label' => 'Tangga baru', 'icon' => 'arrow-up-down', 'x' => 5, 'y' => 10, 'w' => 2, 'h' => 4]]])->assertSessionHasNoErrors();
        $this->assertSame('Tangga baru', FloorFixture::where('floor_id', $this->floor->id)->sole()->label);

        $this->get('/staf/pencarian?lantai=2')->assertInertia(fn (Assert $page) => $page
            ->where('floors.1.floor', 2)
            ->where('floors.1.aspect', 1)
            ->where('floors.1.fixtures.0', ['label' => 'Tangga baru', 'icon' => 'arrow-up-down', 'x' => 25, 'y' => 50, 'w' => 10, 'h' => 20]));
    }

    public function test_floors_can_be_added_and_removed_when_empty()
    {
        $this->post('/staf/aset/denah')->assertRedirect(route('staf.aset.denah', ['lantai' => 4]));
        $new = Floor::where('number', 4)->sole();
        $this->assertSame(20.0, $new->width_m);

        Room::create(['floor' => 4, 'name' => 'R', 'type' => 'baca', 'map_x' => 0, 'map_y' => 0, 'map_w' => 2, 'map_h' => 2]);
        $this->delete("/staf/aset/denah/{$new->id}")->assertSessionHas('error');
        $this->assertModelExists($new);

        Room::where('floor', 4)->delete();
        $this->delete("/staf/aset/denah/{$new->id}");
        $this->assertModelMissing($new);
    }

    public function test_a_scan_of_the_plan_can_be_the_background()
    {
        Storage::fake('local');
        $this->post("/staf/aset/denah/{$this->floor->id}/latar", ['file' => UploadedFile::fake()->create('denah.pdf', 10, 'application/pdf')])->assertSessionHasErrors('file');

        $this->post("/staf/aset/denah/{$this->floor->id}/latar", ['file' => UploadedFile::fake()->image('denah.png')])->assertSessionHasNoErrors();
        $path = $this->floor->fresh()->background_path;
        Storage::disk('local')->assertExists($path);
        $this->get("/staf/aset/denah/{$this->floor->id}/latar")->assertOk();

        $this->delete("/staf/aset/denah/{$this->floor->id}/latar");
        Storage::disk('local')->assertMissing($path);
        $this->assertNull($this->floor->fresh()->background_path);
    }

    public function test_an_asset_moves_between_rooms_and_an_area_typed_in_stays_official()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        $from = $this->room('Asal');
        $to = $this->room('Tujuan');
        $asset = Asset::create(['name' => 'Meja', 'category' => 'Sarana', 'function' => 'Baca', 'room_id' => $from->id, 'quantity' => 1, 'condition' => 'Baik']);

        $this->patch("/staf/aset/inventaris/aset/{$asset->id}", ['room_id' => $to->id])->assertSessionHas('success', 'Meja dipindahkan ke Tujuan.');
        $this->assertSame($to->id, $asset->fresh()->room_id);

        $this->put("/staf/aset/ruang/{$from->id}", ['area_m2' => 16, 'type' => 'baca']);
        $this->assertFalse($from->fresh()->area_manual);
        $this->put("/staf/aset/ruang/{$from->id}", ['area_m2' => 18.5, 'type' => 'baca']);
        $this->assertTrue($from->fresh()->area_manual);
    }

    public function test_the_room_page_reports_floors_with_their_size()
    {
        $this->get('/staf/aset/ruang?lantai=1')->assertInertia(fn (Assert $page) => $page
            ->where('floor', 1)
            ->where('floors.0.width', 23.5)
            ->where('floors.2.name', 'Lantai 3'));
    }
}
