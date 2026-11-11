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

    public static function make(Member $member, int $purpose = 0): string
    {
        return self::build($member->id, self::window(), $purpose);
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
            'purpose' => $purpose,
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
