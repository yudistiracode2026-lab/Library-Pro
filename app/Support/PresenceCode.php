<?php

namespace App\Support;

use App\Models\Member;

/**
 * The rotating code a member shows as a QR to the scanner at the attendance
 * desk. It changes every 30 seconds, so a screenshot soon stops working.
 *
 * A USB scanner types what it reads like a keyboard, so the code uses only
 * capitals and digits, of fixed length: it survives Caps Lock and keyboard
 * layouts, and the desk knows when it has read all of it.
 */
class PresenceCode
{
    public const PERIOD = 30;

    public const LENGTH = 33;

    private const PREFIX = 'PSG';

    /** Earlier windows that still count, for a code that changed as it was shown. */
    private const GRACE_WINDOWS = 1;

    /**
     * Added to the purpose digit while the member is inside. The code then
     * changes as soon as a scan is recorded: scanners often refuse to send
     * the same code twice in a row, which would swallow the next scan.
     */
    private const INSIDE_OFFSET = 5;

    public static function make(Member $member, int $purpose = 0): string
    {
        $inside = $member->visits()->today()->inside()->exists();

        return self::build($member->id, self::window(), $purpose + ($inside ? self::INSIDE_OFFSET : 0));
    }

    /**
     * What a page needs to show the QR and whether the desk has recorded the member.
     *
     * @return array<string, mixed>
     */
    public static function payload(Member $member, int $purpose = 0): array
    {
        $last = $member->visits()->today()->latest('checked_in_at')->first();

        return [
            'code' => self::make($member, $purpose),
            'secondsLeft' => self::secondsLeft(),
            'period' => self::PERIOD,
            'presence' => $last ? [
                'inside' => $last->checked_out_at === null,
                'kind' => $last->checked_out_at ? 'Keluar' : 'Masuk',
                'time' => ($last->checked_out_at ?? $last->checked_in_at)->format('H.i'),
                'minutes' => $last->minutes(),
            ] : null,
        ];
    }

    public static function secondsLeft(): int
    {
        return self::PERIOD - now()->getTimestamp() % self::PERIOD;
    }

    /**
     * @return array{member_id: int, purpose: int, expired: bool}|null null when it is not a genuine code
     */
    public static function read(string $code): ?array
    {
        $code = strtoupper(trim($code));

        if (! preg_match('/^'.self::PREFIX.'([0-9A-Z]{6})([0-9A-Z]{7})([0-9])[0-9A-F]{16}$/', $code, $m)) {
            return null;
        }

        $member = (int) base_convert($m[1], 36, 10);
        $window = (int) base_convert($m[2], 36, 10);
        $purpose = (int) $m[3];

        if (! hash_equals(self::build($member, $window, $purpose), $code)) {
            return null;
        }

        return [
            'member_id' => $member,
            'purpose' => $purpose % self::INSIDE_OFFSET,
            'expired' => $window > self::window() || $window < self::window() - self::GRACE_WINDOWS,
        ];
    }

    private static function window(): int
    {
        return intdiv(now()->getTimestamp(), self::PERIOD);
    }

    private static function build(int $member, int $window, int $purpose): string
    {
        $id = str_pad(strtoupper(base_convert((string) $member, 10, 36)), 6, '0', STR_PAD_LEFT);
        $slot = str_pad(strtoupper(base_convert((string) $window, 10, 36)), 7, '0', STR_PAD_LEFT);
        $signature = strtoupper(substr(hash_hmac('sha256', "presensi|{$member}|{$window}|{$purpose}", (string) config('app.key')), 0, 16));

        return self::PREFIX.$id.$slot.$purpose.$signature;
    }
}
