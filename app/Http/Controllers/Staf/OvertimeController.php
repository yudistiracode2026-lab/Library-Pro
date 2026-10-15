<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\OvertimeAssignment;
use App\Models\OvertimeSession;
use App\Models\User;
use App\Support\CsvExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Overtime schedule (admin), self check-in/out by the assigned staff, and
 * the monthly report with the overtime order letter.
 */
class OvertimeController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = in_array($request->query('tab'), ['jadwal', 'presensi', 'laporan'], true) ? $request->query('tab') : 'jadwal';
        $filter = in_array($request->query('filter'), ['akan', 'lewat', 'semua'], true) ? $request->query('filter') : 'akan';
        $month = today()->startOfMonth();
        $monthSessions = OvertimeSession::with('assignments.employee')->whereBetween('date', [$month, $month->copy()->endOfMonth()])->get();
        $user = $request->user();

        return Inertia::render('staf/lembur', [
            'tab' => $tab,
            'filter' => $filter,
            'canManage' => $user->isAdmin(),
            'monthLabel' => $month->translatedFormat('F Y'),
            'kpis' => [
                'sessions' => $monthSessions->count(),
                'staff' => $monthSessions->flatMap->assignments->unique('employee_id')->count(),
                'minutes' => $monthSessions->flatMap->assignments->sum(fn (OvertimeAssignment $a) => $a->minutes()),
                'today' => $monthSessions->filter(fn ($s) => $s->date->isToday())->count(),
            ],
            'sessions' => $tab === 'jadwal' ? $this->schedule($filter) : [],
            'today' => $tab === 'presensi' ? $this->todayRows($user) : [],
            'history' => $tab === 'presensi' ? $this->history() : [],
            'report' => $tab === 'laporan' ? $this->report($monthSessions) : [],
            'staff' => $user->isAdmin()
                ? Employee::where('status', 'Aktif')->orderBy('kind')->orderBy('name')->get()->map(fn (Employee $e) => ['id' => $e->id, 'name' => $e->name, 'kind' => $e->kind])
                : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($request, $data) {
            $session = OvertimeSession::create([...collect($data)->except('employees')->all(), 'created_by' => $request->user()->id]);
            $session->assignments()->createMany(array_map(fn ($id) => ['employee_id' => $id], $data['employees']));
        });

        return back()->with('success', 'Jadwal lembur disimpan.');
    }

    public function update(Request $request, OvertimeSession $session): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($session, $data) {
            $session->update(collect($data)->except('employees')->all());
            // Keep presence records of people still assigned.
            $session->assignments()->whereNotIn('employee_id', $data['employees'])->delete();
            foreach ($data['employees'] as $id) {
                $session->assignments()->firstOrCreate(['employee_id' => $id]);
            }
        });

        return back()->with('success', 'Jadwal lembur diperbarui.');
    }

    public function destroy(OvertimeSession $session): RedirectResponse
    {
        $session->delete();

        return back()->with('success', 'Jadwal lembur dihapus.');
    }

    public function checkIn(Request $request, OvertimeAssignment $assignment): RedirectResponse
    {
        $this->authorizePresence($request, $assignment);
        $session = $assignment->session;

        if (! $session->date->isToday() || now()->lt($session->startsAt()->subMinutes(30)) || now()->gt($session->endsAt())) {
            return back()->with('error', 'Presensi masuk dibuka 30 menit sebelum lembur dimulai sampai jam selesai.');
        }

        $assignment->update(['checked_in_at' => $assignment->checked_in_at ?? now()]);

        return back()->with('success', 'Presensi masuk lembur tercatat pukul '.now()->format('H.i').'.');
    }

    public function checkOut(Request $request, OvertimeAssignment $assignment): RedirectResponse
    {
        $this->authorizePresence($request, $assignment);

        if ($assignment->checked_in_at === null) {
            return back()->with('error', 'Lakukan presensi masuk dulu, ya.');
        }

        $assignment->update(['checked_out_at' => $assignment->checked_out_at ?? now()]);

        return back()->with('success', 'Presensi keluar lembur tercatat pukul '.now()->format('H.i').'.');
    }

    public function export(): StreamedResponse
    {
        $month = today()->startOfMonth();
        $rows = OvertimeAssignment::with(['session', 'employee'])
            ->whereHas('session', fn ($s) => $s->whereBetween('date', [$month, $month->copy()->endOfMonth()]))
            ->get()
            ->sortBy(fn ($a) => $a->session->date->toDateString().$a->session->starts_at)
            ->map(fn (OvertimeAssignment $a) => [
                $a->session->date->toDateString(), $a->session->activity, $a->employee->name,
                substr($a->session->starts_at, 0, 5), substr($a->session->ends_at, 0, 5),
                $a->checked_in_at?->format('H:i'), $a->checked_out_at?->format('H:i'), $a->minutes(), $a->isLate() ? 'Ya' : '',
            ]);

        return CsvExport::download('lembur-'.$month->format('Y-m'), ['Tanggal', 'Kegiatan', 'Petugas', 'Jadwal mulai', 'Jadwal selesai', 'Masuk', 'Keluar', 'Menit', 'Terlambat'], $rows);
    }

    /**
     * Surat perintah lembur for this month's sessions.
     */
    public function letter(): HttpResponse
    {
        $month = today()->startOfMonth();
        $sessions = OvertimeSession::with('assignments.employee')
            ->whereBetween('date', [$month, $month->copy()->endOfMonth()])
            ->orderBy('date')->orderBy('starts_at')->get();

        return Pdf::loadView('pdf.surat-perintah-lembur', [
            'sessions' => $sessions,
            'month' => $month,
            'head' => Employee::where('is_head', true)->first(),
            'logo' => public_path('images/logo-stpn.png'),
        ])->setPaper('a4')->download('surat-perintah-lembur-'.$month->format('Y-m').'.pdf');
    }

    private function authorizePresence(Request $request, OvertimeAssignment $assignment): void
    {
        abort_unless($request->user()->isAdmin() || $assignment->employee->user_id === $request->user()->id, 403, 'Presensi lembur dilakukan oleh petugas yang bersangkutan.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'date' => ['required', 'date'],
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
            'activity' => ['required', 'string', 'max:255'],
            'employees' => ['required', 'array', 'min:1'],
            'employees.*' => ['integer', 'exists:employees,id'],
        ], [
            'ends_at.after' => 'Jam selesai harus setelah jam mulai.',
            'employees.required' => 'Pilih minimal satu petugas.',
        ], ['date' => 'tanggal', 'starts_at' => 'jam mulai', 'ends_at' => 'jam selesai', 'activity' => 'kegiatan']);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function schedule(string $filter): Collection
    {
        return OvertimeSession::with('assignments.employee')
            ->when($filter === 'akan', fn ($q) => $q->whereDate('date', '>=', today())->orderBy('date')->orderBy('starts_at'))
            ->when($filter === 'lewat', fn ($q) => $q->whereDate('date', '<', today())->orderByDesc('date'))
            ->when($filter === 'semua', fn ($q) => $q->orderByDesc('date'))
            ->limit(60)
            ->get()
            ->map(fn (OvertimeSession $s) => [
                'id' => $s->id,
                'date' => $s->date->toDateString(),
                'dow' => $s->date->translatedFormat('D'),
                'day' => $s->date->format('j'),
                'mon' => $s->date->translatedFormat('M'),
                'start' => substr($s->starts_at, 0, 5),
                'end' => substr($s->ends_at, 0, 5),
                'activity' => $s->activity,
                'status' => $s->date->isToday() ? 'Hari ini' : ($s->date->isFuture() ? 'Akan datang' : 'Selesai'),
                'people' => $s->assignments->map(fn ($a) => ['id' => $a->employee_id, 'name' => $a->employee->name]),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function todayRows(User $user): Collection
    {
        return OvertimeAssignment::with(['session', 'employee'])
            ->whereHas('session', fn ($s) => $s->whereDate('date', today()))
            ->get()
            ->sortBy(fn ($a) => $a->session->starts_at)
            ->values()
            ->map(fn (OvertimeAssignment $a) => [
                'id' => $a->id,
                'name' => $a->employee->name,
                'activity' => $a->session->activity,
                'start' => substr($a->session->starts_at, 0, 5),
                'end' => substr($a->session->ends_at, 0, 5),
                'in' => $a->checked_in_at?->format('H.i'),
                'out' => $a->checked_out_at?->format('H.i'),
                'minutes' => $a->minutes(),
                'late' => $a->isLate(),
                'mine' => $user->isAdmin() || $a->employee->user_id === $user->id,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function history(): Collection
    {
        return OvertimeAssignment::with(['session', 'employee'])
            ->whereHas('session', fn ($s) => $s->whereDate('date', '<', today())->whereDate('date', '>=', today()->subDays(14)))
            ->get()
            ->sortByDesc(fn ($a) => $a->session->date->toDateString())
            ->values()
            ->map(fn (OvertimeAssignment $a) => [
                'id' => $a->id,
                'date' => $a->session->date->translatedFormat('D, j M'),
                'name' => $a->employee->name,
                'activity' => $a->session->activity,
                'in' => $a->checked_in_at?->format('H.i'),
                'out' => $a->checked_out_at?->format('H.i'),
                'minutes' => $a->minutes(),
                'state' => $a->checked_in_at === null ? 'Tidak hadir' : ($a->isLate() ? 'Terlambat' : 'Tepat waktu'),
            ]);
    }

    /**
     * Per-employee totals for this month's sessions that have already happened.
     *
     * @param  Collection<int, OvertimeSession>  $sessions
     * @return Collection<int, array<string, mixed>>
     */
    private function report(Collection $sessions): Collection
    {
        return $sessions->filter(fn (OvertimeSession $s) => $s->date->lt(today()) || ($s->date->isToday() && now()->gt($s->endsAt())))
            ->flatMap->assignments
            ->groupBy('employee_id')
            ->map(fn (Collection $rows) => [
                'id' => $rows->first()->employee_id,
                'name' => $rows->first()->employee->name,
                'position' => $rows->first()->employee->position,
                'scheduled' => $rows->count(),
                'present' => $rows->whereNotNull('checked_in_at')->count(),
                'late' => $rows->filter(fn (OvertimeAssignment $a) => $a->isLate())->count(),
                'minutes' => $rows->sum(fn (OvertimeAssignment $a) => $a->minutes()),
            ])
            ->sortByDesc('minutes')
            ->values();
    }
}
