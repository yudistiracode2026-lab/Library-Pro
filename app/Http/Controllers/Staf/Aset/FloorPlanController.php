<?php

namespace App\Http\Controllers\Staf\Aset;

use App\Http\Controllers\Controller;
use App\Models\Floor;
use App\Models\FloorFixture;
use App\Models\FloorPlanVersion;
use App\Models\Rack;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * The floor plan editor (admin). The browser edits a draft of one floor and
 * sends it whole: one transaction replaces the layout, after keeping the old
 * one as a version. Saving over someone else's newer save is refused.
 */
class FloorPlanController extends Controller
{
    private const VERSIONS_KEPT = 20;

    /** Tolerance for edges rounded to two decimals, in metres. */
    private const EDGE = 0.05;

    public function edit(Request $request): Response
    {
        $floors = Floor::orderBy('number')->get();
        $floor = $floors->firstWhere('number', $request->integer('lantai')) ?? $floors->firstWhere('number', 2) ?? $floors->first();
        $layout = $floor->layout();
        $assets = Room::where('floor', $floor->number)->withCount('assets')->pluck('assets_count', 'id');
        $books = Rack::where('floor', $floor->number)->withCount('books')->pluck('books_count', 'id');

        return Inertia::render('staf/aset/denah', [
            'floors' => $floors->map(fn (Floor $f) => $f->only(['id', 'number', 'name'])),
            'floor' => [
                ...$floor->only(['id', 'number', 'version']),
                'background' => $floor->background_path ? route('staf.aset.denah.background.show', [$floor, 'v' => md5($floor->background_path)]) : null,
                'layout' => [
                    ...$layout,
                    'rooms' => collect($layout['rooms'])->map(fn ($r) => [...$r, 'assets' => $assets[$r['id']] ?? 0]),
                    'racks' => collect($layout['racks'])->map(fn ($r) => [...$r, 'books' => $books[$r['id']] ?? 0]),
                ],
            ],
            'versions' => $floor->versions()->with('user:id,name')->latest('id')->limit(self::VERSIONS_KEPT)->get()->map(fn (FloorPlanVersion $v) => [
                'id' => $v->id,
                'at' => $v->created_at->translatedFormat('j M Y, H.i'),
                'by' => $v->user?->name,
                'layout' => $v->payload,
            ]),
            'targetRooms' => Room::orderBy('floor')->orderBy('name')->get()->reject(fn (Room $r) => $r->isFixed())
                ->map(fn (Room $r) => ['id' => $r->id, 'floor' => $r->floor, 'name' => $r->name])->values(),
            'options' => [
                'types' => collect(Room::TYPES)->map(fn ($t, $k) => ['value' => $k, 'label' => $t[0], 'group' => $t[1]])->values(),
                'icons' => Floor::FIXTURE_ICONS,
            ],
        ]);
    }

    public function save(Request $request, Floor $floor): RedirectResponse
    {
        $data = $request->validate([
            'version' => ['required', 'integer'],
            'name' => ['required', 'string', 'max:60'],
            'width' => ['required', 'numeric', 'min:3', 'max:200'],
            'length' => ['required', 'numeric', 'min:3', 'max:200'],
            'rooms' => ['present', 'array', 'max:300'],
            'rooms.*.id' => ['nullable', 'integer'],
            'rooms.*.name' => ['required', 'string', 'max:255'],
            'rooms.*.type' => ['required', Rule::in(array_keys(Room::TYPES))],
            'rooms.*.area' => ['required', 'numeric', 'min:0', 'max:99999'],
            'rooms.*.area_manual' => ['required', 'boolean'],
            'rooms.*.outside' => ['required', 'boolean'],
            'racks' => ['present', 'array', 'max:300'],
            'racks.*.id' => ['nullable', 'integer'],
            'racks.*.code' => ['required', 'string', 'max:10'],
            'racks.*.name' => ['required', 'string', 'max:255'],
            'fixtures' => ['present', 'array', 'max:300'],
            'fixtures.*.id' => ['nullable', 'integer'],
            'fixtures.*.label' => ['required', 'string', 'max:255'],
            'fixtures.*.icon' => ['required', Rule::in(Floor::FIXTURE_ICONS)],
            ...collect(['rooms', 'racks', 'fixtures'])->flatMap(fn ($list) => [
                "{$list}.*.x" => ['required', 'numeric', 'min:0'],
                "{$list}.*.y" => ['required', 'numeric', 'min:0'],
                "{$list}.*.w" => ['required', 'numeric', 'min:0.25'],
                "{$list}.*.h" => ['required', 'numeric', 'min:0.25'],
            ])->all(),
            'moves' => ['array'],
            'moves.*' => ['integer'],
        ], [
            'rooms.*.name.required' => 'Semua ruang harus punya nama.',
            'racks.*.code.required' => 'Semua rak harus punya kode.',
            'racks.*.name.required' => 'Semua rak harus punya nama.',
            'fixtures.*.label.required' => 'Semua fasilitas harus punya nama.',
        ], ['name' => 'nama lantai', 'width' => 'lebar lantai', 'length' => 'panjang lantai']);

        DB::transaction(function () use ($request, $floor, $data) {
            $floor = Floor::lockForUpdate()->findOrFail($floor->id);

            if ($floor->version !== (int) $data['version']) {
                $by = $floor->versions()->with('user:id,name')->latest('id')->first()?->user?->name ?? 'admin lain';
                throw ValidationException::withMessages(['version' => "Denah ini baru saja diubah oleh {$by}. Muat ulang halaman; perubahan Anda belum tersimpan."]);
            }

            $this->checkBounds($data);
            $this->checkRackCodes($floor, $data['racks']);

            FloorPlanVersion::create(['floor_id' => $floor->id, 'user_id' => $request->user()->id, 'payload' => $floor->layout()]);

            $this->saveRooms($floor, $data['rooms'], $data['moves'] ?? []);
            $this->saveRacks($floor, $data['racks']);
            $this->saveFixtures($floor, $data['fixtures']);

            $floor->update(['name' => $data['name'], 'width_m' => $data['width'], 'length_m' => $data['length'], 'version' => $floor->version + 1]);

            $old = $floor->versions()->latest('id')->skip(self::VERSIONS_KEPT)->take(PHP_INT_MAX)->pluck('id');
            FloorPlanVersion::whereIn('id', $old)->delete();
        });

        return to_route('staf.aset.denah', ['lantai' => $floor->number])->with('success', 'Denah disimpan.');
    }

    public function store(): RedirectResponse
    {
        $number = (int) Floor::max('number') + 1;
        Floor::create(['number' => $number, 'name' => "Lantai {$number}", 'width_m' => 20, 'length_m' => 20]);

        return to_route('staf.aset.denah', ['lantai' => $number])->with('success', "Lantai {$number} ditambahkan.");
    }

    public function destroy(Floor $floor): RedirectResponse
    {
        if ($floor->rooms()->exists() || $floor->racks()->exists() || $floor->fixtures()->exists()) {
            return back()->with('error', 'Lantai ini masih berisi ruang, rak, atau fasilitas. Kosongkan dan simpan dulu, ya.');
        }
        if (Floor::count() === 1) {
            return back()->with('error', 'Minimal harus ada satu lantai.');
        }

        if ($floor->background_path) {
            Storage::disk('local')->delete($floor->background_path);
        }
        $floor->delete();

        return to_route('staf.aset.denah')->with('success', "{$floor->name} dihapus.");
    }

    /** A scan or photo of the real plan to trace over. */
    public function uploadBackground(Request $request, Floor $floor): RedirectResponse
    {
        $request->validate(['file' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120']], [], ['file' => 'gambar denah']);

        if ($floor->background_path) {
            Storage::disk('local')->delete($floor->background_path);
        }
        $floor->update(['background_path' => $request->file('file')->store('denah', 'local')]);

        return back()->with('success', 'Gambar latar dipasang.');
    }

    public function destroyBackground(Floor $floor): RedirectResponse
    {
        if ($floor->background_path) {
            Storage::disk('local')->delete($floor->background_path);
            $floor->update(['background_path' => null]);
        }

        return back()->with('success', 'Gambar latar dihapus.');
    }

    public function background(Floor $floor): BinaryFileResponse
    {
        abort_unless($floor->background_path && Storage::disk('local')->exists($floor->background_path), 404);

        return response()->file(Storage::disk('local')->path($floor->background_path));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function checkBounds(array $data): void
    {
        $outside = [];
        foreach (['rooms' => 'name', 'racks' => 'code', 'fixtures' => 'label'] as $list => $label) {
            foreach ($data[$list] as $item) {
                if ($item['x'] + $item['w'] > $data['width'] + self::EDGE || $item['y'] + $item['h'] > $data['length'] + self::EDGE) {
                    $outside[] = $item[$label];
                }
            }
        }

        if ($outside) {
            throw ValidationException::withMessages(['width' => 'Keluar dari batas lantai: '.implode(', ', array_slice($outside, 0, 5)).'. Geser atau perbesar lantainya, ya.']);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $racks
     */
    private function checkRackCodes(Floor $floor, array $racks): void
    {
        $codes = collect($racks)->pluck('code')->map(fn ($c) => strtoupper(trim($c)));
        $twice = $codes->duplicates()->first();
        $elsewhere = Rack::whereIn('code', $codes)->where('floor', '!=', $floor->number)->first();

        if ($twice || $elsewhere) {
            $code = $twice ?? $elsewhere->code;
            $where = $elsewhere && ! $twice ? " (sudah dipakai di lantai {$elsewhere->floor})" : '';
            throw ValidationException::withMessages(['racks' => "Kode rak {$code} dipakai lebih dari sekali{$where}."]);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  array<int|string, int>  $moves  deleted room id => room that takes over its assets
     */
    private function saveRooms(Floor $floor, array $rows, array $moves): void
    {
        $current = $floor->rooms()->withCount('assets')->get()->keyBy('id');
        $kept = collect($rows)->pluck('id')->filter();
        // Keyed again: except() on models renumbers the keys.
        $deleted = $current->except($kept->all())->keyBy('id');

        foreach ($deleted as $room) {
            if ($room->assets_count === 0) {
                continue;
            }
            $target = $moves[$room->id] ?? null;
            if (! $target || $deleted->has($target) || ! Room::whereKey($target)->exists()) {
                throw ValidationException::withMessages(['moves' => "Ruang {$room->name} masih berisi {$room->assets_count} aset. Pilih ruang tujuan pemindahannya, ya."]);
            }
            $room->assets()->update(['room_id' => $target]);
        }
        Room::whereIn('id', $deleted->keys())->delete();

        foreach ($rows as $row) {
            $room = $current->get($row['id'] ?? 0) ?? new Room(['floor' => $floor->number]);
            $resized = ! $room->exists || abs($room->map_w - $row['w']) > 0.001 || abs($room->map_h - $row['h']) > 0.001;

            $room->fill([
                'name' => trim($row['name']),
                'type' => $row['type'],
                'area_manual' => $row['area_manual'],
                'outside_library' => $row['outside'],
                // An official figure stays as typed; otherwise the area follows a change in the drawing.
                'area_m2' => $row['area_manual'] ? $row['area'] : ($resized ? round($row['w'] * $row['h'], 1) : $room->area_m2),
                'map_x' => $row['x'], 'map_y' => $row['y'], 'map_w' => $row['w'], 'map_h' => $row['h'],
            ])->save();
        }
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function saveRacks(Floor $floor, array $rows): void
    {
        $current = $floor->racks()->withCount('books')->get()->keyBy('id');
        $deleted = $current->except(collect($rows)->pluck('id')->filter()->all())->keyBy('id');

        $full = $deleted->first(fn (Rack $r) => $r->books_count > 0);
        if ($full) {
            throw ValidationException::withMessages(['racks' => "Rak {$full->code} masih berisi {$full->books_count} judul. Pindahkan bukunya dulu, ya."]);
        }
        Rack::whereIn('id', $deleted->keys())->delete();

        // Codes may swap between racks: clear them first so the unique index never trips.
        $keepers = $current->except($deleted->keys()->all());
        $keepers->each(fn (Rack $r) => $r->update(['code' => "~{$r->id}"]));

        foreach ($rows as $row) {
            ($current->get($row['id'] ?? 0) ?? new Rack(['floor' => $floor->number]))->fill([
                'code' => strtoupper(trim($row['code'])),
                'name' => trim($row['name']),
                'map_x' => $row['x'], 'map_y' => $row['y'], 'map_w' => $row['w'], 'map_h' => $row['h'],
            ])->save();
        }
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function saveFixtures(Floor $floor, array $rows): void
    {
        /** @var Collection<int, FloorFixture> $current */
        $current = $floor->fixtures()->get()->keyBy('id');
        FloorFixture::whereIn('id', $current->except(collect($rows)->pluck('id')->filter()->all())->modelKeys())->delete();

        foreach ($rows as $row) {
            ($current->get($row['id'] ?? 0) ?? new FloorFixture(['floor_id' => $floor->id]))->fill([
                'label' => trim($row['label']),
                'icon' => $row['icon'],
                'map_x' => $row['x'], 'map_y' => $row['y'], 'map_w' => $row['w'], 'map_h' => $row['h'],
            ])->save();
        }
    }
}
