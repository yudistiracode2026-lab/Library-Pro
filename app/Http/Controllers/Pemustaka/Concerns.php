<?php

namespace App\Http\Controllers\Pemustaka;

use App\Models\Member;
use Illuminate\Http\Request;

/**
 * The member record behind the logged-in account. Accounts without one
 * (not yet linked by the circulation desk) get a 403.
 */
trait Concerns
{
    protected function member(Request $request): Member
    {
        $member = $request->user()?->member;

        abort_if($member === null, 403, 'Akun ini belum terhubung dengan data anggota. Hubungi meja sirkulasi, ya.');

        return $member;
    }
}
