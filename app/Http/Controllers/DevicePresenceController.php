<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use App\Services\MemberDevices;
use App\Support\PresenceCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The QR on the sign-in page of a registered phone. No session here: the
 * phone's own cookie says whose QR it is, and it opens attendance only.
 */
class DevicePresenceController extends Controller
{
    public function __construct(private MemberDevices $devices) {}

    public function code(Request $request): JsonResponse
    {
        $member = $this->devices->memberFor($request);

        // 410: this phone is no longer registered, so the page drops the QR.
        if ($member === null) {
            return response()->json(['message' => 'Perangkat tidak terdaftar.'], 410);
        }

        $purpose = $request->integer('keperluan');

        return response()->json(PresenceCode::payload($member, array_key_exists($purpose, Visit::PURPOSES) ? $purpose : 0));
    }

    public function forget(Request $request): RedirectResponse
    {
        $this->devices->forget($request);

        return back()->with('status', 'HP ini tidak lagi dipakai untuk presensi.');
    }
}
