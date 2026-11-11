<?php

use App\Http\Controllers\CoverController;
use App\Http\Controllers\DevicePresenceController;
use App\Http\Controllers\WebsiteController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', WebsiteController::class)->name('home');
Route::get('sampul/{book}', CoverController::class)->name('cover');

Route::middleware(['auth'])->group(function () {
    // Landing page after login: staff go to their portal, members get theirs.
    Route::get('dashboard', function (Request $request) {
        if ($request->user()->isStaff()) {
            return to_route('staf.dashboard');
        }

        return to_route('pemustaka.beranda');
    })->name('dashboard');
});

// The QR on the sign-in page of a member's registered phone: no account session.
Route::get('presensi/kode', [DevicePresenceController::class, 'code'])->name('presensi.code');
Route::post('presensi/lepas', [DevicePresenceController::class, 'forget'])->name('presensi.forget');

require __DIR__.'/staf.php';
require __DIR__.'/pemustaka.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
