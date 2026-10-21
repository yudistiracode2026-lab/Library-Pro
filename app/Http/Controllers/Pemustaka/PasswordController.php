<?php

namespace App\Http\Controllers\Pemustaka;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A member changes their portal password. Required right after the first
 * sign-in, when the password is still the NIM/NIP.
 */
class PasswordController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('pemustaka/sandi', [
            'required' => (bool) $request->user()->must_change_password,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $number = (string) $user->member?->member_number;

        $request->validate([
            // Not asked while it is still the NIM/NIP the member just signed in with.
            'current_password' => $user->must_change_password ? ['nullable'] : ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults(), ...($number !== '' ? ['not_in:'.$number] : [])],
        ], [
            'password.not_in' => 'Kata sandi baru tidak boleh sama dengan NIM/NIP.',
        ], [
            'current_password' => 'kata sandi saat ini',
            'password' => 'kata sandi baru',
        ]);

        $user->forceFill([
            'password' => Hash::make($request->string('password')->toString()),
            'must_change_password' => false,
        ])->save();

        return to_route('pemustaka.beranda')->with('success', 'Kata sandi diganti. Pakai kata sandi baru ini saat masuk berikutnya.');
    }
}
