<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use App\Support\KioskToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Member side of the kiosk QR. Scanning opens GET /presensi?t=...; a valid
 * code unlocks check-in for 10 minutes in this browser session, which leaves
 * time to log in first if needed.
 */
class PresenceController extends Controller
{
    private const UNLOCK_MINUTES = 10;

    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->filled('t')) {
            if (! KioskToken::isValid($request->query('t'))) {
                return $this->page(null, 'Kode QR sudah kedaluwarsa. Pindai lagi QR di layar kios, ya.');
            }

            $request->session()->put('presensi_until', now()->addMinutes(self::UNLOCK_MINUTES)->getTimestamp());

            return redirect()->route('presensi');
        }

        if (! $request->user()) {
            return redirect()->guest(route('login'));
        }

        return $this->page($request, $this->unlocked($request) ? null : 'Pindai QR di layar kios pintu masuk untuk mencatat kunjungan.');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['purpose' => ['required', Rule::in(Visit::PURPOSES)]]);

        if (! $this->unlocked($request)) {
            return back()->with('error', 'Kode QR sudah kedaluwarsa. Pindai lagi QR di layar kios, ya.');
        }

        $member = $request->user()->member;

        abort_if($member === null, 403);

        [, $kind] = Visit::toggle($member, $data['purpose'], Visit::METHOD_QR, null);
        $request->session()->forget('presensi_until');

        return back()->with('success', $kind === 'masuk' ? 'Selamat datang! Kunjunganmu sudah tercatat.' : 'Sampai jumpa! Kamu tercatat keluar.');
    }

    private function unlocked(Request $request): bool
    {
        return (int) $request->session()->get('presensi_until', 0) >= now()->getTimestamp();
    }

    private function page(?Request $request, ?string $notice): Response
    {
        $member = $request?->user()?->member;
        $open = $member?->visits()->today()->inside()->latest('checked_in_at')->first();

        return Inertia::render('pemustaka/presensi', [
            'notice' => $notice,
            'member' => $member ? ['name' => $member->name, 'member_number' => $member->member_number] : null,
            'hasUser' => $request?->user() !== null,
            'inside' => $open ? ['since' => $open->checked_in_at->format('H.i'), 'purpose' => $open->purpose] : null,
            'purposes' => Visit::PURPOSES,
        ]);
    }
}
