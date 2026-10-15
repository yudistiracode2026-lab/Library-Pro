<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    // Landing page after login: staff go to their portal, members get theirs.
    Route::get('dashboard', function (Request $request) {
        if ($request->user()->isStaff()) {
            return to_route('staf.dashboard');
        }

        return Inertia::render('pemustaka/beranda');
    })->name('dashboard');
});

require __DIR__.'/staf.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
