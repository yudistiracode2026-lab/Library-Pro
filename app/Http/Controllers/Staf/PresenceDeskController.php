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
    /** How long the scanner must stop reading a member before the next read counts. */
    private const REST_SECONDS = 10;

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
            $inside = $last && $last->checked_out_at === null;

            // Every read restarts the wait, so a phone left on the scanner never flips.
            $held = Cache::has("presensi.baca.{$member->id}");
            Cache::put("presensi.baca.{$member->id}", true, self::REST_SECONDS);

            // A code records one entry and one exit at most, so a screenshot gains little.
            if ($held || ! Cache::add("presensi.kode.{$code}.".($inside ? 'keluar' : 'masuk'), true, PresenceCode::PERIOD * 4)) {
                $wait = 'jauhkan HP, lalu pindai lagi setelah '.self::REST_SECONDS.' detik.';

                return $this->reply('ulang', $inside ? "Sudah tercatat masuk. Untuk keluar, {$wait}" : "Sudah tercatat. Untuk masuk lagi, {$wait}", $member, $last);
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
     * One row per member for today: first entry, latest exit, and the time
     * spent inside across their visits.
     *
     * @return list<array<string, mixed>>
     */
    private function recent(): array
    {
        return Visit::today()->whereNotNull('member_id')->with('member')->orderBy('checked_in_at')->get()
            ->groupBy('member_id')
            ->sortByDesc(fn ($stays) => $stays->max(fn (Visit $v) => $v->updated_at->getTimestamp()))
            ->take(8)
            ->map(function ($stays) {
                $last = $stays->last();

                return [
                    'id' => $last->member_id,
                    'name' => $last->member?->name,
                    'in' => $stays->first()->checked_in_at->format('H.i'),
                    'out' => $last->checked_out_at?->format('H.i'),
                    'minutes' => $last->checked_out_at ? $stays->sum(fn (Visit $v) => $v->minutes()) : null,
                    'stays' => $stays->count(),
                ];
            })->values()->all();
    }
}
