<?php

namespace App\Http\Controllers\Staf\Aset;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\License;
use App\Models\Room;
use App\Support\CsvExport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = $request->string('kategori')->toString();
        $tab = in_array($tab, [...Asset::CATEGORIES, 'Lisensi'], true) ? $tab : 'Semua';

        return Inertia::render('staf/aset/inventaris', [
            'tab' => $tab,
            'counts' => Asset::selectRaw('category, count(*) as total')->groupBy('category')->pluck('total', 'category')
                ->put('Lisensi', License::count())->put('Semua', Asset::count()),
            'assets' => $tab === 'Lisensi' ? [] : Asset::with('room')
                ->when($tab !== 'Semua', fn ($a) => $a->where('category', $tab))
                ->orderBy('category')->orderBy('name')->get()
                ->map(fn (Asset $a) => [
                    ...$a->only(['id', 'name', 'category', 'function', 'quantity', 'condition', 'acquired_year', 'inventory_code', 'room_id']),
                    'room' => $a->room ? "Lt {$a->room->floor} · {$a->room->name}" : null,
                ]),
            'licenses' => $tab === 'Lisensi' ? License::orderBy('name')->get() : [],
            'missingFacilities' => $this->missingFacilities(),
            'summary' => [
                'units' => (int) Asset::sum('quantity'),
                'damaged' => (int) Asset::where('condition', '!=', 'Baik')->sum('quantity'),
                'unlicensed' => License::where('status', 'Tidak berlisensi')->count(),
            ],
            'options' => [
                'categories' => Asset::CATEGORIES,
                'functions' => Asset::FUNCTIONS,
                'conditions' => Asset::CONDITIONS,
                'licenseStatuses' => License::STATUSES,
                'rooms' => Room::where('outside_library', false)->get()->reject(fn (Room $r) => $r->isFixed())
                    ->map(fn (Room $r) => ['value' => (string) $r->id, 'label' => "Lt {$r->floor} · {$r->name}"])->values(),
            ],
        ]);
    }

    public function storeAsset(Request $request): RedirectResponse
    {
        $asset = Asset::create($this->validatedAsset($request));

        return back()->with('success', "{$asset->name} × {$asset->quantity} dicatat.");
    }

    public function updateAsset(Request $request, Asset $asset): RedirectResponse
    {
        // Inline edits send only the field that changed (quantity or condition).
        $asset->update($request->validate([
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            'condition' => ['sometimes', Rule::in(Asset::CONDITIONS)],
            'room_id' => ['sometimes', 'nullable', 'exists:rooms,id'],
        ]));

        return back();
    }

    public function destroyAsset(Asset $asset): RedirectResponse
    {
        $asset->delete();

        return back()->with('success', "{$asset->name} dihapus.");
    }

    /**
     * Record a missing public facility in one click.
     */
    public function addFacility(Request $request): RedirectResponse
    {
        $function = $request->validate(['function' => ['required', Rule::in(Asset::REQUIRED_FACILITIES)]])['function'];

        Asset::create([
            'name' => $function === 'Akses disabilitas' ? 'Ramp dan jalur pemandu disabilitas' : $function,
            'category' => 'Fasilitas umum',
            'function' => $function,
            'room_id' => Room::where('name', 'like', 'Lobi%')->value('id'),
            'quantity' => 1,
        ]);

        return back()->with('success', "{$function} dicatat sebagai fasilitas umum.");
    }

    public function storeLicense(Request $request): RedirectResponse
    {
        License::create($this->validatedLicense($request));

        return back()->with('success', 'Lisensi dicatat.');
    }

    public function updateLicense(Request $request, License $license): RedirectResponse
    {
        $license->update($request->has('name')
            ? $this->validatedLicense($request)
            : $request->validate(['status' => ['required', Rule::in(License::STATUSES)]]));

        return back();
    }

    public function destroyLicense(License $license): RedirectResponse
    {
        $license->delete();

        return back()->with('success', 'Lisensi dihapus.');
    }

    public function export(): StreamedResponse
    {
        $rows = Asset::with('room')->orderBy('category')->orderBy('name')->lazy()->map(fn (Asset $a) => [
            $a->inventory_code, $a->name, $a->category, $a->function, $a->room ? "Lt {$a->room->floor} {$a->room->name}" : '',
            $a->quantity, $a->condition, $a->acquired_year,
        ]);

        return CsvExport::download('inventaris-aset', ['Kode', 'Nama barang', 'Kategori', 'Fungsi', 'Ruang', 'Jumlah', 'Kondisi', 'Tahun'], $rows);
    }

    /**
     * @return list<string>
     */
    private function missingFacilities(): array
    {
        $present = Asset::where('category', 'Fasilitas umum')->pluck('function')->all();

        return array_values(array_diff(Asset::REQUIRED_FACILITIES, $present));
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedAsset(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(Asset::CATEGORIES)],
            'function' => ['required', 'string', 'max:60'],
            'room_id' => ['required', 'exists:rooms,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'condition' => ['required', Rule::in(Asset::CONDITIONS)],
            'acquired_year' => ['nullable', 'integer', 'between:1950,'.(now()->year + 1)],
            'inventory_code' => ['nullable', 'string', 'max:40'],
        ], [], ['name' => 'nama barang', 'category' => 'kategori', 'function' => 'fungsi', 'room_id' => 'ruang',
            'quantity' => 'jumlah', 'condition' => 'kondisi', 'acquired_year' => 'tahun perolehan', 'inventory_code' => 'kode inventaris']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedLicense(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'usage' => ['required', 'string', 'max:255'],
            'license_type' => ['nullable', 'string', 'max:60'],
            'seats' => ['required', 'integer', 'min:1', 'max:10000'],
            'status' => ['required', Rule::in(License::STATUSES)],
        ], [], ['name' => 'nama perangkat lunak', 'usage' => 'penggunaan', 'license_type' => 'jenis lisensi', 'seats' => 'jumlah unit']);
    }
}
