<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Pustakawan = 'pustakawan';
    case Pemustaka = 'pemustaka';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Pustakawan => 'Pustakawan',
            self::Pemustaka => 'Pemustaka',
        };
    }

    /**
     * Roles that may open the staff portal.
     */
    public function isStaff(): bool
    {
        return in_array($this, [self::Admin, self::Pustakawan], true);
    }
}
