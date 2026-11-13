<?php

namespace App\Services;

use App\Models\Member;
use App\Models\MemberDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

/**
 * Remembers the phone a member uses for attendance, so its sign-in page can
 * show their QR without signing in. That opens attendance only, never the
 * portal. A member has one such phone: registering another replaces it.
 */
class MemberDevices
{
    private const COOKIE = 'pustagra_perangkat';

    /** Browsers cap cookies near this long anyway; use renews it. */
    private const COOKIE_MINUTES = 60 * 24 * 400;

    public function register(Member $member): void
    {
        $token = Str::random(64);
        MemberDevice::updateOrCreate(['member_id' => $member->id], ['token_hash' => $this->hash($token), 'last_used_at' => now()]);
        $this->remember($token);
    }

    /** The device this browser holds, if it is still the member's registered one. */
    public function current(Request $request): ?MemberDevice
    {
        $token = $request->cookie(self::COOKIE);

        return is_string($token) && $token !== '' ? MemberDevice::with('member')->where('token_hash', $this->hash($token))->first() : null;
    }

    /** The member behind this browser's device, keeping the device alive while it is used. */
    public function memberFor(Request $request): ?Member
    {
        $device = $this->current($request);

        if ($device && (! $device->last_used_at || $device->last_used_at->lt(now()->subDay()))) {
            $device->update(['last_used_at' => now()]);
            $this->remember($request->cookie(self::COOKIE));
        }

        return $device?->member;
    }

    public function forget(Request $request): void
    {
        $this->current($request)?->delete();
        Cookie::queue(Cookie::forget(self::COOKIE));
    }

    public function revoke(Member $member): void
    {
        MemberDevice::where('member_id', $member->id)->delete();
    }

    private function remember(string $token): void
    {
        Cookie::queue(self::COOKIE, $token, self::COOKIE_MINUTES);
    }

    private function hash(string $token): string
    {
        return hash('sha256', $token);
    }
}
