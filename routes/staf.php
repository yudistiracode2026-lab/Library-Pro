<?php

use App\Http\Controllers\Staf\DashboardController;
use App\Http\Controllers\Staf\PageController;
use App\Support\StafMenu;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:admin,pustakawan'])
    ->prefix('staf')
    ->name('staf.')
    ->group(function () {
        Route::get('/', DashboardController::class)->name('dashboard');

        foreach (StafMenu::pages() as $page) {
            if ($page['key'] === 'dashboard') {
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
    });
