<?php

namespace App\Enums;

/**
 * User levels. "admin" is the superadmin. The head of the library manages
 * everything except the system pages (CMS, reports, settings). The desk
 * roles (sirkulasi, pengolah data, referensi) and the older general
 * "pustakawan" level see the ordinary staff pages.
 */
enum UserRole: string
{
    case Admin = 'admin';
    case Kepala = 'kepala';
    case Sirkulasi = 'sirkulasi';
    case PengolahData = 'pengolah';
    case Referensi = 'referensi';
    case Pustakawan = 'pustakawan';
    case Pemustaka = 'pemustaka';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Superadmin',
            self::Kepala => 'Kepala Perpustakaan',
            self::Sirkulasi => 'Sirkulasi',
            self::PengolahData => 'Pengolah Data',
            self::Referensi => 'Referensi',
            self::Pustakawan => 'Pustakawan',
            self::Pemustaka => 'Pemustaka',
        };
    }

    /**
     * Roles that may open the staff portal.
     */
    public function isStaff(): bool
    {
        return $this !== self::Pemustaka;
    }

    /**
     * Roles that manage the library: staff records, budgets, schedules,
     * floor plans, and everyone's work logs.
     */
    public function manages(): bool
    {
        return in_array($this, [self::Admin, self::Kepala], true);
    }
}
