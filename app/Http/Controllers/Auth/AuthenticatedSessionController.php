<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Visit;
use App\Services\MemberDevices;
use App\Support\PresenceCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * The members' sign-in page (NIM/NIP), linked from the website.
     */
    public function create(Request $request, MemberDevices $devices): Response
    {
        $member = $devices->memberFor($request);

        return $this->page($request, 'pemustaka', $member ? [
            'name' => $member->name,
            'qr' => PresenceCode::payload($member),
            'purposes' => Visit::PURPOSES,
        ] : null);
    }

    /**
     * The staff sign-in page (email) at /staf/masuk, shared with staff only.
     */
    public function createStaff(Request $request): Response
    {
        return $this->page($request, 'staf');
    }

    /**
     * Handle a member signing in.
     */
    public function store(LoginRequest $request, MemberDevices $devices): RedirectResponse
    {
        $request->authenticate('pemustaka');
        $request->session()->regenerate();

        $member = $request->user()->member;
        if ($request->boolean('device') && $member) {
            $devices->register($member);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Handle a librarian, administrative staff or administrator signing in.
     */
    public function storeStaff(LoginRequest $request): RedirectResponse
    {
        $request->authenticate('staf');
        $request->session()->regenerate();

        return redirect()->intended(route('staf.dashboard', absolute: false));
    }

    /**
     * @param  'pemustaka'|'staf'  $portal
     * @param  array<string, mixed>|null  $attendance  the QR of this browser's registered phone
     */
    private function page(Request $request, string $portal, ?array $attendance = null): Response
    {
        return Inertia::render('auth/login', [
            'portal' => $portal,
            'attendance' => $attendance,
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $staff = (bool) $request->user()?->isStaff();

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Staff go back to their own sign-in page, which the website does not link to.
        return $staff ? to_route('staf.login') : redirect('/');
    }
}
