<?php

namespace App\Support;

use App\Models\Member;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\IpUtils;

/**
 * Whether a member is inside the library: on the library network (one of
 * the CIDR ranges in Pengaturan) and checked in through presensi today.
 * Both are needed to open the full text of a repository work.
 */
class OnSite
{
    public static function onNetwork(Request $request): bool
    {
        $ranges = array_filter(array_map('trim', explode(',', (string) LibrarySettings::get('onsite_networks'))));

        return $ranges !== [] && IpUtils::checkIp((string) $request->ip(), $ranges);
    }

    public static function checkedIn(?Member $member): bool
    {
        return $member !== null && $member->visits()->today()->inside()->exists();
    }

    /**
     * @return array{network: bool, presence: bool, since: string|null, open: bool}
     */
    public static function status(Request $request, ?Member $member): array
    {
        $visit = $member?->visits()->today()->inside()->latest('checked_in_at')->first();
        $network = self::onNetwork($request);

        return [
            'network' => $network,
            'presence' => $visit !== null,
            'since' => $visit?->checked_in_at->format('H.i'),
            'open' => $network && $visit !== null,
        ];
    }
}
