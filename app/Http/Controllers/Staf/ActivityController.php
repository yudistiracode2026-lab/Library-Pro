<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Employee;
use App\Support\CsvExport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Daily work log. Staff log for their own employee record; admins can log
 * for, and review, everyone.
 */
class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = $request->query('tab') === 'rekap' ? 'rekap' : 'catat';
        $date = $this->date($request);
        $month = $date->copy()->startOfMonth();
        $employee = $this->employee($request);
        $isAdmin = $request->user()->isAdmin();

        $day = $employee
            ? ActivityLog::where('employee_id', $employee->id)->whereDate('date', $date)->orderBy('starts_at')->get()
            : collect();
        $monthLogs = ActivityLog::whereBetween('date', [$month, $month->copy()->endOfMonth()])->get();
        $staff = Employee::where('status', 'Aktif')->orderBy('kind')->orderBy('name')->get();

        return Inertia::render('staf/kegiatan', [
            'tab' => $tab,
            'isAdmin' => $isAdmin,
            'date' => $date->toDateString(),
            'dateLabel' => $date->translatedFormat('l, j F Y'),
            'isToday' => $date->isToday(),
            'monthLabel' => $month->translatedFormat('F Y'),
            'employee' => $employee ? ['id' => $employee->id, 'name' => $employee->name] : null,
            'staff' => $isAdmin ? $staff->map(fn (Employee $e) => ['value' => (string) $e->id, 'label' => "{$e->name} · ".ucfirst($e->kind)]) : [],
            'kpis' => [
                'count' => $day->count(),
                'minutes' => $day->sum(fn (ActivityLog $l) => $l->minutes()),
                'daysFilled' => $employee ? $monthLogs->where('employee_id', $employee->id)->unique(fn ($l) => $l->date->toDateString())->count() : 0,
                'filledToday' => $isAdmin ? ActivityLog::whereDate('date', today())->distinct('employee_id')->count('employee_id').'/'.$staff->count() : null,
            ],
            'logs' => $day->map(fn (ActivityLog $l) => [
                ...$l->only(['id', 'category', 'description', 'output', 'status']),
                'start' => substr($l->starts_at, 0, 5),
                'end' => substr($l->ends_at, 0, 5),
                'minutes' => $l->minutes(),
            ]),
            'suggestedStart' => $day->isNotEmpty() ? substr($day->last()->ends_at, 0, 5) : '08:00',
            'recap' => $tab === 'rekap' ? $this->recap($staff, $monthLogs) : [],
            'categories' => ActivityLog::CATEGORIES,
            'statuses' => ActivityLog::STATUSES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $employee = $this->employee($request) ?? abort(403, 'Akun ini belum terhubung dengan data pegawai.');

        $data = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
            'category' => ['required', Rule::in(ActivityLog::CATEGORIES)],
            'description' => ['required', 'string', 'max:1000'],
            'output' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(ActivityLog::STATUSES)],
        ], ['ends_at.after' => 'Jam selesai harus setelah jam mulai.'], [
            'date' => 'tanggal', 'starts_at' => 'jam mulai', 'ends_at' => 'jam selesai', 'category' => 'jenis kegiatan',
            'description' => 'uraian pekerjaan', 'output' => 'hasil',
        ]);

        ActivityLog::create([...$data, 'employee_id' => $employee->id, 'created_by' => $request->user()->id]);

        return back()->with('success', 'Kegiatan tersimpan.');
    }

    public function destroy(Request $request, ActivityLog $log): RedirectResponse
    {
        abort_unless($request->user()->isAdmin() || $log->employee->user_id === $request->user()->id, 403);

        $log->delete();

        return back()->with('success', 'Kegiatan dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        $month = $this->date($request)->startOfMonth();
        $logs = ActivityLog::with('employee')
            ->whereBetween('date', [$month, $month->copy()->endOfMonth()])
            ->when(! $request->user()->isAdmin(), fn ($q) => $q->where('employee_id', $this->employee($request)?->id))
            ->orderBy('date')->orderBy('starts_at')->get();

        return CsvExport::download('kegiatan-harian-'.$month->format('Y-m'), ['Tanggal', 'Petugas', 'Mulai', 'Selesai', 'Jenis', 'Uraian', 'Hasil', 'Status'],
            $logs->map(fn (ActivityLog $l) => [
                $l->date->toDateString(), $l->employee->name, substr($l->starts_at, 0, 5), substr($l->ends_at, 0, 5),
                $l->category, $l->description, $l->output, $l->status,
            ]));
    }

    private function date(Request $request): Carbon
    {
        $date = rescue(fn () => Carbon::parse($request->query('tanggal', today()->toDateString())), today(), false);

        return $date->isFuture() ? today() : $date->startOfDay();
    }

    private function employee(Request $request): ?Employee
    {
        if ($request->user()->isAdmin() && $request->filled('pegawai')) {
            return Employee::find($request->integer('pegawai'));
        }

        return $request->user()->employee ?? ($request->user()->isAdmin() ? Employee::orderBy('id')->first() : null);
    }

    /**
     * @param  Collection<int, Employee>  $staff
     * @param  Collection<int, ActivityLog>  $logs
     * @return Collection<int, array<string, mixed>>
     */
    private function recap(Collection $staff, Collection $logs): Collection
    {
        return $staff->map(function (Employee $e) use ($logs) {
            $own = $logs->where('employee_id', $e->id);

            return [
                'id' => $e->id,
                'name' => $e->name,
                'kind' => $e->kind,
                'position' => $e->position,
                'days' => $own->unique(fn ($l) => $l->date->toDateString())->count(),
                'count' => $own->count(),
                'minutes' => $own->sum(fn (ActivityLog $l) => $l->minutes()),
                'top' => $own->countBy('category')->sortDesc()->keys()->first(),
            ];
        })->values();
    }
}
