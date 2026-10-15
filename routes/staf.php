<?php

use App\Http\Controllers\Staf\CirculationController;
use App\Http\Controllers\Staf\ClearanceController;
use App\Http\Controllers\Staf\DashboardController;
use App\Http\Controllers\Staf\PageController;
use App\Http\Controllers\Staf\SearchMapController;
use App\Http\Controllers\Staf\SettingsController;
use App\Http\Controllers\Staf\VisitController;
use App\Support\StafMenu;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:admin,pustakawan'])
    ->prefix('staf')
    ->name('staf.')
    ->group(function () {
        Route::get('/', DashboardController::class)->name('dashboard');

        // Master data CRUD and placeholders, generated from the menu.
        foreach (StafMenu::pages() as $page) {
            if ($page['key'] === 'dashboard' || $page['custom']) {
                continue;
            }

            Route::middleware($page['admin_only'] ? ['role:admin'] : [])->group(function () use ($page) {
                ['key' => $key, 'path' => $path, 'controller' => $controller] = $page;

                if ($controller === null) {
                    Route::get($path, PageController::class)->name($key);

                    return;
                }

                Route::get($path, [$controller, 'index'])->name($key);
                Route::get("{$path}/ekspor", [$controller, 'export'])->name("{$key}.export");
                Route::post($path, [$controller, 'store'])->name("{$key}.store");
                Route::put("{$path}/{record}", [$controller, 'update'])->name("{$key}.update");
                Route::delete("{$path}/{record}", [$controller, 'destroy'])->name("{$key}.destroy");
            });
        }

        Route::controller(CirculationController::class)->prefix('sirkulasi')->name('sirkulasi')->group(function () {
            Route::get('/', 'index')->name('');
            Route::get('cek-eksemplar', 'checkCopy')->name('.check');
            Route::post('pinjam', 'lend')->name('.lend');
            Route::post('kembali/{loan}', 'giveBack')->name('.return');
            Route::post('perpanjang/{loan}', 'extend')->name('.extend');
        });

        Route::controller(VisitController::class)->prefix('kunjungan')->name('kunjungan')->group(function () {
            Route::get('/', 'index')->name('');
            Route::get('kios', 'kiosk')->name('.kiosk');
            Route::post('/', 'store')->name('.store');
            Route::post('{visit}/keluar', 'checkout')->name('.checkout');
        });

        Route::get('pencarian', SearchMapController::class)->name('pencarian');

        Route::controller(ClearanceController::class)->prefix('bebas-pustaka')->name('bebas-pustaka')->group(function () {
            Route::get('/', 'index')->name('');
            Route::get('{clearance}', 'show')->name('.show');
            Route::get('{clearance}/skripsi', 'thesisFile')->name('.skripsi');
            Route::get('{clearance}/surat', 'letter')->name('.surat');
            Route::post('{clearance}/cek-berkas', 'toggleCheck')->name('.check');
            Route::post('{clearance}/acc-skripsi', 'verifyThesis')->name('.thesis');
            Route::post('{clearance}/sumbangan/terima', 'acceptDonation')->name('.donation.accept');
            Route::post('{clearance}/sumbangan/tolak', 'rejectDonation')->name('.donation.reject');
            Route::post('{clearance}/hardcopy', 'receiveHardcopy')->name('.hardcopy');
            Route::post('{clearance}/setujui', 'approve')->name('.approve');
            Route::post('{clearance}/kembalikan', 'sendBack')->name('.send-back');
        });

        Route::middleware('role:admin')->controller(SettingsController::class)->prefix('pengaturan')->name('pengaturan')->group(function () {
            Route::get('/', 'index')->name('');
            Route::put('/', 'update')->name('.update');
        });
    });
