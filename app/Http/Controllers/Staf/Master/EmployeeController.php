<?php

namespace App\Http\Controllers\Staf\Master;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Staf\Master\Concerns\SortsRecords;
use App\Models\Employee;
use App\Support\CsvExport;
use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Serves both /staf/pustakawan and /staf/tendik; the kind comes from the
 * route name, so one record can never be edited through the other page.
 */
class EmployeeController extends Controller
{
    use SortsRecords;

    public function index(Request $request): Response
    {
        $kind = $this->kind($request);
        $employees = $this->sorted($this->query($request), $request, $this->sortColumns(), fn ($e) => $e->orderByDesc('is_head')->orderBy('name'))
            ->paginate(25)->withQueryString();

        return Inertia::render('staf/master/pegawai', [
            'kind' => $kind,
            'records' => $employees->through(fn (Employee $e) => [
                ...$e->only(['id', 'nip', 'name', 'golongan', 'position', 'status', 'is_head']),
                'pangkat' => $e->pangkat(),
                'has_account' => $e->user_id !== null,
            ]),
            'filters' => ['q' => $request->string('q')->toString(), ...$this->sortFilters($request, $this->sortColumns())],
            'options' => [
                'golongan' => collect(MasterOptions::GOLONGAN)->map(fn ($p, $g) => ['value' => $g, 'label' => "{$g} · {$p}"])->values(),
                'positions' => $kind === 'pustakawan' ? MasterOptions::forSelect(MasterOptions::LIBRARIAN_POSITIONS) : null,
                'statuses' => MasterOptions::forSelect(MasterOptions::EMPLOYEE_STATUSES),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(fn () => $this->clearOtherHeads(Employee::create([...$data, 'kind' => $this->kind($request)])));

        return back()->with('success', 'Data pegawai ditambahkan.');
    }

    public function update(Request $request, Employee $record): RedirectResponse
    {
        abort_unless($record->kind === $this->kind($request), 404);

        $data = $this->validated($request, $record);

        DB::transaction(function () use ($record, $data) {
            $record->update($data);
            $this->clearOtherHeads($record);
        });

        return back()->with('success', 'Perubahan disimpan.');
    }

    public function destroy(Request $request, Employee $record): RedirectResponse
    {
        abort_unless($record->kind === $this->kind($request), 404);

        $record->delete();

        return back()->with('success', 'Data pegawai dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->orderBy('name')->lazy()->map(fn (Employee $e) => [
            $e->name, $e->nip, $e->golongan, $e->pangkat(), $e->position, $e->status, $e->is_head ? 'Ya' : '',
        ]);

        return CsvExport::download($this->kind($request), ['Nama', 'NIP', 'Golongan', 'Pangkat', 'Jabatan', 'Status', 'Kepala perpustakaan'], $rows);
    }

    private function kind(Request $request): string
    {
        return str($request->route()->getName())->after('staf.')->before('.')->toString();
    }

    /**
     * Only one employee can be head of the library.
     */
    private function clearOtherHeads(Employee $employee): void
    {
        if ($employee->is_head) {
            Employee::whereKeyNot($employee->id)->where('is_head', true)->update(['is_head' => false]);
        }
    }

    /**
     * Columns of the list that can be sorted by their header. Grades sort by
     * rank (I/a lowest), not alphabetically; NIP sorts as a number.
     *
     * @return array<string, mixed>
     */
    private function sortColumns(): array
    {
        $grades = array_reverse(array_keys(MasterOptions::GOLONGAN));

        return [
            'nama' => 'name',
            'nip' => $this->numeric('nip'),
            'golongan' => $this->inOrder('golongan', $grades),
            'pangkat' => $this->inOrder('golongan', $grades),
            'jabatan' => 'position',
            'status' => 'status',
        ];
    }

    /**
     * @return Builder<Employee>
     */
    private function query(Request $request): Builder
    {
        $q = trim($request->string('q')->toString());

        return Employee::query()
            ->ofKind($this->kind($request))
            ->when($q !== '', fn ($e) => $e->where(fn ($w) => $w
                ->where('name', 'like', "%{$q}%")
                ->orWhere('nip', 'like', "%{$q}%")
                ->orWhere('position', 'like', "%{$q}%")));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Employee $employee = null): array
    {
        $librarian = $this->kind($request) === 'pustakawan';

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'nip' => ['required', 'digits:18', Rule::unique('employees')->ignore($employee)],
            'golongan' => ['required', Rule::in(array_keys(MasterOptions::GOLONGAN))],
            'position' => ['required', 'string', 'max:255', ...($librarian ? [Rule::in(MasterOptions::LIBRARIAN_POSITIONS)] : [])],
            'status' => ['required', Rule::in(MasterOptions::EMPLOYEE_STATUSES)],
            'is_head' => ['boolean'],
        ], [], ['name' => 'nama lengkap', 'nip' => 'NIP', 'position' => 'jabatan']);
    }
}
