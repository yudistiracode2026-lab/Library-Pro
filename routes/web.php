<?php

use App\Http\Controllers\CoverController;
use App\Http\Controllers\PresenceController;
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

// Kiosk QR check-in. The GET checks the scanned code before login, so
// only the POST requires an account.
Route::get('presensi', [PresenceController::class, 'show'])->name('presensi');
Route::post('presensi', [PresenceController::class, 'store'])->middleware('auth')->name('presensi.store');

require __DIR__.'/staf.php';
require __DIR__.'/pemustaka.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
