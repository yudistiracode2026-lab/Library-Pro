<?php

namespace App\Support;

/**
 * Rotating code shown as a QR on the entrance kiosk. A member scans it with
 * their phone camera, which opens /presensi?t=<token> on their account.
 * Codes change every 30 seconds, so a photo of the QR stops working soon
 * after leaving the building.
 */
class KioskToken
{
    public const PERIOD = 30;

    /** How many earlier windows still count, to allow for slow scans. */
    private const GRACE_WINDOWS = 2;

    public static function current(): string
    {
        return self::forWindow(self::window());
    }

    public static function secondsLeft(): int
    {
        return self::PERIOD - (now()->getTimestamp() % self::PERIOD);
    }

    public static function isValid(?string $token): bool
    {
        if (! is_string($token) || $token === '') {
            return false;
        }

        $window = self::window();

        for ($i = 0; $i <= self::GRACE_WINDOWS; $i++) {
            if (hash_equals(self::forWindow($window - $i), $token)) {
                return true;
            }
        }

        return false;
    }

    private static function window(): int
    {
        return intdiv(now()->getTimestamp(), self::PERIOD);
    }

    private static function forWindow(int $window): string
    {
        return substr(hash_hmac('sha256', "kiosk|{$window}", (string) config('app.key')), 0, 20);
    }
}
