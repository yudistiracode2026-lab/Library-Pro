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

            $route = Route::get($page['path'], PageController::class)->name($page['key']);

            if ($page['admin_only']) {
                $route->middleware('role:admin');
            }
        }
    });
