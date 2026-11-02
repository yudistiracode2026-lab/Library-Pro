<?php

namespace App\Http\Controllers\Staf\Aset;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Floor;
use App\Models\Room;
use App\Services\Accreditation\Scorer;
use App\Support\LibrarySettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoomController extends Controller
{
    public function index(Request $request): Response
    {
        $rooms = Room::withCount('assets')->orderBy('floor')->orderBy('id')->get();
        $floors = Floor::orderBy('number')->get();
        $wanted = $request->integer('lantai') ?: 2;
        $selected = $rooms->firstWhere('id', $request->integer('ruang'))
            ?? $rooms->first(fn (Room $r) => $r->floor === $wanted && ! $r->isFixed());
        $library = $rooms->where('outside_library', false);
        $area = $library->sum('area_m2');
        $sivitas = (int) LibrarySettings::get('sivitas');

        return Inertia::render('staf/aset/ruang', [
            'indicators' => app(Scorer::class)->brief(['2.1', '2.2']),
            'kpis' => [
                'area' => round($area, 1),
                'perSivitas' => $sivitas > 0 ? round($area / $sivitas, 2) : 0,
                'sivitas' => $sivitas,
                'basic' => collect(Room::BASIC_TYPES)->filter(fn ($t) => $library->contains('type', $t))->count(),
                'supporting' => $library->where('type', 'pendukung')->count(),
            ],
            'floor' => $selected?->floor ?? ($floors->firstWhere('number', $wanted) ?? $floors->first())?->number,
            'floors' => $floors->map(fn (Floor $f) => [...$f->only(['number', 'name']), 'width' => $f->width_m, 'length' => $f->length_m]),
            'rooms' => $rooms->map(fn (Room $r) => [
                'id' => $r->id,
                'floor' => $r->floor,
                'name' => $r->name,
                'type' => $r->type,
                'group' => Room::TYPES[$r->type][1],
                'typeLabel' => Room::TYPES[$r->type][0],
                'area' => $r->area_m2,
                'x' => $r->map_x, 'y' => $r->map_y, 'w' => $r->map_w, 'h' => $r->map_h,
                'fixed' => $r->isFixed(),
                'outside' => $r->outside_library,
                'assets' => $r->assets_count,
            ]),
            'selected' => $selected ? [
                'id' => $selected->id,
                'assets' => $selected->assets()->orderBy('category')->orderBy('name')->get()
                    ->map(fn (Asset $a) => $a->only(['id', 'name', 'category', 'function', 'quantity', 'condition'])),
            ] : null,
            'options' => [
                'types' => collect(Room::TYPES)->map(fn ($t, $k) => ['value' => $k, 'label' => $t[0]])->values(),
                'categories' => Asset::CATEGORIES,
                'functions' => Asset::FUNCTIONS,
                'conditions' => Asset::CONDITIONS,
            ],
        ]);
    }

    public function update(Request $request, Room $room): RedirectResponse
    {
        abort_if($room->isFixed(), 409);

        $data = $request->validate([
            'area_m2' => ['required', 'numeric', 'min:0', 'max:99999'],
            'type' => ['required', Rule::in(array_keys(Room::TYPES))],
        ], [], ['area_m2' => 'luas', 'type' => 'jenis ruang']);

        // An area typed in is official: resizing the room on the plan no longer overwrites it.
        $room->update([...$data, 'area_manual' => $room->area_manual || (float) $data['area_m2'] !== $room->area_m2]);

        return back()->with('success', "Data {$room->name} disimpan.");
    }
}
