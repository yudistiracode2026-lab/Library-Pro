<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Visit;
use App\Support\KioskToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class VisitController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = in_array($request->query('status'), ['dalam', 'keluar'], true) ? $request->query('status') : '';
        $today = Visit::today();

        return Inertia::render('staf/kunjungan', [
            'stats' => [
                'total' => (clone $today)->count(),
                'inside' => (clone $today)->inside()->count(),
                'out' => (clone $today)->whereNotNull('checked_out_at')->count(),
                'purposes' => collect(Visit::PURPOSES)->map(fn ($p) => ['label' => $p, 'total' => (clone $today)->where('purpose', $p)->count()]),
            ],
            'visits' => Visit::today()
                ->with('member')
                ->when($filter === 'dalam', fn ($v) => $v->inside())
                ->when($filter === 'keluar', fn ($v) => $v->whereNotNull('checked_out_at'))
                ->latest('checked_in_at')
                ->limit(200)
                ->get()
                ->map(fn (Visit $v) => $this->row($v)),
            'filter' => $filter,
            'purposes' => Visit::PURPOSES,
            'qr' => $this->qr(),
        ]);
    }

    /**
     * Full-screen QR for the entrance display.
     */
    public function kiosk(): Response
    {
        return Inertia::render('staf/kios', ['qr' => $this->qr()]);
    }

    /**
     * Staff entry: a member number toggles in/out; a guest is checked in.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'mode' => ['required', Rule::in(['anggota', 'tamu'])],
            'member_number' => ['required_if:mode,anggota', 'nullable', 'string'],
            'guest_name' => ['required_if:mode,tamu', 'nullable', 'string', 'max:255'],
            'guest_org' => ['nullable', 'string', 'max:255'],
            'purpose' => ['required', Rule::in(Visit::PURPOSES)],
        ], ['required_if' => ':attribute wajib diisi.'], ['member_number' => 'NIM / NIP', 'guest_name' => 'nama tamu']);

        if ($data['mode'] === 'tamu') {
            Visit::create([
                'guest_name' => $data['guest_name'],
                'guest_org' => $data['guest_org'] ?? null,
                'purpose' => $data['purpose'],
                'method' => Visit::METHOD_GUEST,
                'checked_in_at' => now(),
                'recorded_by' => $request->user()->id,
            ]);

            return back()->with('success', "Tamu {$data['guest_name']} tercatat masuk.");
        }

        $member = Member::where('member_number', trim($data['member_number']))->first()
            ?? throw ValidationException::withMessages(['member_number' => 'Anggota tidak ditemukan.']);

        [$visit, $kind] = Visit::toggle($member, $data['purpose'], Visit::METHOD_MANUAL, $request->user()->id);

        return back()->with('success', "{$member->name} tercatat {$kind} pukul {$visit->{$kind === 'masuk' ? 'checked_in_at' : 'checked_out_at'}->format('H.i')}.");
    }

    public function checkout(Visit $visit): RedirectResponse
    {
        if ($visit->checked_out_at === null) {
            $visit->update(['checked_out_at' => now()]);
        }

        return back()->with('success', 'Pengunjung ditandai keluar.');
    }

    /**
     * @return array{url: string, secondsLeft: int, period: int}
     */
    private function qr(): array
    {
        return [
            'url' => route('presensi', ['t' => KioskToken::current()]),
            'secondsLeft' => KioskToken::secondsLeft(),
            'period' => KioskToken::PERIOD,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Visit $v): array
    {
        return [
            'id' => $v->id,
            'name' => $v->member?->name ?? $v->guest_name,
            'detail' => $v->member ? "{$v->member->member_number} · {$v->member->study_program}" : ($v->guest_org ?? 'Tamu umum'),
            'purpose' => $v->purpose,
            'method' => $v->method,
            'in' => $v->checked_in_at->format('H.i'),
            'out' => $v->checked_out_at?->format('H.i'),
        ];
    }
}
