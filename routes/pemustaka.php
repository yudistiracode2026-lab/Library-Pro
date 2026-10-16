<?php

use App\Http\Controllers\Pemustaka\CatalogController;
use App\Http\Controllers\Pemustaka\ClearanceController;
use App\Http\Controllers\Pemustaka\HomeController;
use App\Http\Controllers\Pemustaka\LoansController;
use App\Http\Controllers\Pemustaka\ReadingController;
use App\Http\Controllers\Pemustaka\SuggestionController;
use App\Http\Controllers\Pemustaka\TitleCheckController;
use Illuminate\Support\Facades\Route;

/*
| Member portal (design/Portal Pemustaka.dc.html). Every page needs an
| account linked to a member record; the controllers check that.
*/
Route::middleware(['auth', 'role:pemustaka'])->prefix('pemustaka')->name('pemustaka.')->group(function () {
    Route::get('/', HomeController::class)->name('beranda');
    Route::post('pinjaman/{loan}/perpanjang', [HomeController::class, 'extend'])->name('loan.extend');

    Route::get('cari', [CatalogController::class, 'index'])->name('cari');
    Route::post('ebook/{book}/pinjam', [CatalogController::class, 'borrow'])->name('ebook.borrow');
    Route::post('ebook/{loan}/kembalikan', [CatalogController::class, 'giveBack'])->name('ebook.return');
    Route::get('ebook/{loan}/berkas', [CatalogController::class, 'file'])->name('ebook.file');
    Route::patch('ebook/{loan}/halaman', [CatalogController::class, 'progress'])->name('ebook.progress');

    Route::get('pinjaman', LoansController::class)->name('pinjaman');
    Route::get('cek-judul', TitleCheckController::class)->name('cek-judul');

    Route::get('bebas-pustaka', [ClearanceController::class, 'show'])->name('bebas-pustaka');
    Route::post('bebas-pustaka/sumbangan', [ClearanceController::class, 'donation'])->name('bebas-pustaka.donation');
    Route::post('bebas-pustaka/skripsi', [ClearanceController::class, 'thesis'])->name('bebas-pustaka.thesis');
    Route::post('bebas-pustaka/hardcopy', [ClearanceController::class, 'hardcopy'])->name('bebas-pustaka.hardcopy');
    Route::get('bebas-pustaka/surat', [ClearanceController::class, 'letter'])->name('bebas-pustaka.surat');

    Route::get('usulan', [SuggestionController::class, 'index'])->name('usulan');
    Route::post('usulan', [SuggestionController::class, 'store'])->name('usulan.store');
    Route::post('usulan/{suggestion}/dukung', [SuggestionController::class, 'vote'])->name('usulan.vote');

    Route::get('baca', [ReadingController::class, 'index'])->name('baca');
    Route::post('baca/{thesis}/mulai', [ReadingController::class, 'start'])->name('baca.start');
    Route::get('baca/sesi/{session}/berkas', [ReadingController::class, 'file'])->name('baca.file');
    Route::patch('baca/sesi/{session}/halaman', [ReadingController::class, 'progress'])->name('baca.progress');
    Route::post('baca/sesi/{session}/selesai', [ReadingController::class, 'end'])->name('baca.end');
});
