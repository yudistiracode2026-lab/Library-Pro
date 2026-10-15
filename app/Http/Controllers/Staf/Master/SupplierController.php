<?php

namespace App\Http\Controllers\Staf\Master;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Support\CsvExport;
use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $suppliers = $this->query($request)->orderBy('name')->paginate(25)->withQueryString();

        return Inertia::render('staf/master/penyedia', [
            'records' => $suppliers->through(fn (Supplier $s) => $s->only(['id', 'name', 'type', 'city', 'contact_name', 'phone', 'status'])),
            'filters' => ['q' => $request->string('q')->toString()],
            'options' => [
                'types' => MasterOptions::forSelect(MasterOptions::SUPPLIER_TYPES),
                'statuses' => MasterOptions::forSelect(MasterOptions::ACTIVE_STATUSES),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Supplier::create($this->validated($request));

        return back()->with('success', 'Penyedia ditambahkan.');
    }

    public function update(Request $request, Supplier $record): RedirectResponse
    {
        $record->update($this->validated($request));

        return back()->with('success', 'Perubahan disimpan.');
    }

    public function destroy(Supplier $record): RedirectResponse
    {
        $record->delete();

        return back()->with('success', 'Penyedia dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->orderBy('name')->lazy()
            ->map(fn (Supplier $s) => [$s->name, $s->type, $s->contact_name, $s->phone, $s->city, $s->status]);

        return CsvExport::download('penyedia-buku', ['Nama penyedia', 'Jenis', 'Kontak', 'Telepon', 'Kota', 'Status'], $rows);
    }

    /**
     * @return Builder<Supplier>
     */
    private function query(Request $request): Builder
    {
        $q = trim($request->string('q')->toString());

        return Supplier::query()->when($q !== '', fn ($s) => $s->where(fn ($w) => $w
            ->where('name', 'like', "%{$q}%")
            ->orWhere('city', 'like', "%{$q}%")
            ->orWhere('contact_name', 'like', "%{$q}%")));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(MasterOptions::SUPPLIER_TYPES)],
            'city' => ['nullable', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'status' => ['required', Rule::in(MasterOptions::ACTIVE_STATUSES)],
        ], [], ['name' => 'nama penyedia', 'type' => 'jenis', 'city' => 'kota', 'contact_name' => 'nama kontak', 'phone' => 'telepon']);
    }
}
