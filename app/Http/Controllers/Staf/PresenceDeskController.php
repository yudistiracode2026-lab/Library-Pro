<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Visit;
use App\Support\PresenceCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The attendance desk: a USB scanner reads the QR on a member's phone and
 * each read records them in or out. A scanner reads the same QR many times
 * while it is held up, so a repeat changes nothing.
 */
class PresenceDeskController extends Controller
{
    /** Time before the same member can be recorded again. */
    private const MIN_GAP_SECONDS = 60;

    public function show(): Response
    {
        return Inertia::render('staf/meja-presensi', [
            'codeLength' => PresenceCode::LENGTH,
            'inside' => Visit::today()->inside()->count(),
            'recent' => $this->recent(),
        ]);
    }

    public function scan(Request $request): JsonResponse
    {
        $code = strtoupper(trim($request->string('code')->toString()));
        $read = PresenceCode::read($code);

        if ($read === null) {
            return $this->reply('error', 'Bukan kode presensi. Buka QR di aplikasi pemustaka, ya.');
        }

        $member = Member::find($read['member_id']);

        if ($member === null) {
            return $this->reply('error', 'Anggota tidak ditemukan.');
        }
        if ($read['expired']) {
            return $this->reply('error', 'Kode sudah kedaluwarsa. Tunjukkan QR yang terbaru di aplikasi, ya.', $member);
        }

        return DB::transaction(function () use ($request, $code, $read, $member) {
            // One scan at a time per member, even if two arrive together.
            Member::whereKey($member->id)->lockForUpdate()->first();
            $last = $member->visits()->today()->latest('checked_in_at')->first();
            $changedAt = $last?->checked_out_at ?? $last?->checked_in_at;

            if (($changedAt && $changedAt->diffInSeconds(now()) < self::MIN_GAP_SECONDS) || ! Cache::add("presensi.kode.{$code}", true, PresenceCode::PERIOD * 4)) {
                return $this->reply('ulang', 'Sudah tercatat. Tidak perlu dipindai lagi.', $member, $last);
            }

            $purpose = Visit::PURPOSES[$read['purpose']] ?? Visit::PURPOSES[0];
            [$visit, $kind] = Visit::toggle($member, $purpose, Visit::METHOD_QR, $request->user()->id);

            return $this->reply($kind, $kind === 'masuk' ? 'Selamat datang!' : 'Sampai jumpa!', $member, $visit);
        });
    }

    private function reply(string $status, string $message, ?Member $member = null, ?Visit $visit = null): JsonResponse
    {
        return response()->json([
            'status' => $status,
            'message' => $message,
            'name' => $member?->name,
            'number' => $member?->member_number,
            'time' => $visit ? ($visit->checked_out_at ?? $visit->checked_in_at)->format('H.i') : null,
            'minutes' => $visit?->checked_out_at ? $visit->minutes() : null,
            'inside' => Visit::today()->inside()->count(),
            'recent' => $this->recent(),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recent(): array
    {
        return Visit::today()->whereNotNull('member_id')->with('member')->latest('updated_at')->latest('id')->limit(8)->get()
            ->map(fn (Visit $v) => [
                'id' => $v->id,
                'name' => $v->member?->name,
                'in' => $v->checked_in_at->format('H.i'),
                'out' => $v->checked_out_at?->format('H.i'),
                'minutes' => $v->checked_out_at ? $v->minutes() : null,
            ])->all();
    }
}
