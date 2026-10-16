<?php

use App\Http\Controllers\Staf\AccreditationController;
use App\Http\Controllers\Staf\ActivityController;
use App\Http\Controllers\Staf\Aset\InventoryController;
use App\Http\Controllers\Staf\Aset\RoomController;
use App\Http\Controllers\Staf\CctvController;
use App\Http\Controllers\Staf\CirculationController;
use App\Http\Controllers\Staf\ClearanceController;
use App\Http\Controllers\Staf\CmsController;
use App\Http\Controllers\Staf\DashboardController;
use App\Http\Controllers\Staf\OpnameController;
use App\Http\Controllers\Staf\OvertimeController;
use App\Http\Controllers\Staf\ProcurementController;
use App\Http\Controllers\Staf\ReportController;
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

        // Master data CRUD, generated from the menu.
        foreach (StafMenu::pages() as $page) {
            if ($page['controller'] === null) {
                continue;
            }

            Route::middleware($page['admin_only'] ? ['role:admin'] : [])->group(function () use ($page) {
                ['key' => $key, 'path' => $path, 'controller' => $controller] = $page;

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

        Route::controller(RoomController::class)->prefix('aset/ruang')->name('aset.ruang')->group(function () {
            Route::get('/', 'index')->name('');
            Route::put('{room}', 'update')->name('.update');
        });

        Route::controller(InventoryController::class)->prefix('aset/inventaris')->name('aset.inventaris')->group(function () {
            Route::get('/', 'index')->name('');
            Route::get('ekspor', 'export')->name('.export');
            Route::post('aset', 'storeAsset')->name('.assets.store');
            Route::patch('aset/{asset}', 'updateAsset')->name('.assets.update');
            Route::delete('aset/{asset}', 'destroyAsset')->name('.assets.destroy');
            Route::post('fasilitas', 'addFacility')->name('.facility');
            Route::post('lisensi', 'storeLicense')->name('.licenses.store');
            Route::patch('lisensi/{license}', 'updateLicense')->name('.licenses.update');
            Route::delete('lisensi/{license}', 'destroyLicense')->name('.licenses.destroy');
        });

        Route::controller(OpnameController::class)->prefix('opname')->name('opname')->group(function () {
            Route::get('/', 'index')->name('');
            Route::post('mulai', 'start')->name('.start');
            Route::post('cek', 'check')->name('.check');
            Route::post('selesai', 'finish')->name('.finish');
        });

        Route::controller(ProcurementController::class)->prefix('pengadaan')->name('pengadaan')->group(function () {
            Route::get('/', 'index')->name('');
            Route::get('ekspor', 'export')->name('.export');
            Route::post('terbitan/{publication}', 'addNewPublication')->name('.new');
            Route::post('favorit/{book}', 'addFavorite')->name('.favorite');
            Route::post('usulan/{suggestion}/setujui', 'approveSuggestion')->name('.suggestion.approve');
            Route::post('usulan/{suggestion}/tolak', 'rejectSuggestion')->name('.suggestion.reject');
            Route::post('usulan/{suggestion}/batal', 'undoSuggestion')->name('.suggestion.undo');
            Route::post('usulan/{suggestion}/tiba', 'arrived')->name('.suggestion.arrived');
            Route::patch('daftar/{item}', 'updateItem')->name('.item.update');
            Route::delete('daftar/{item}', 'destroyItem')->name('.item.destroy');
            Route::post('ajukan', 'submit')->name('.submit');
        });

        Route::controller(ActivityController::class)->prefix('kegiatan')->name('kegiatan')->group(function () {
            Route::get('/', 'index')->name('');
            Route::get('ekspor', 'export')->name('.export');
            Route::post('/', 'store')->name('.store');
            Route::delete('{log}', 'destroy')->name('.destroy');
        });

        Route::controller(OvertimeController::class)->prefix('lembur')->name('lembur')->group(function () {
            Route::get('/', 'index')->name('');
            Route::get('ekspor', 'export')->name('.export');
            Route::get('surat', 'letter')->name('.letter');
            Route::post('{assignment}/masuk', 'checkIn')->name('.check-in');
            Route::post('{assignment}/keluar', 'checkOut')->name('.check-out');

            Route::middleware('role:admin')->group(function () {
                Route::post('/', 'store')->name('.store');
                Route::put('{session}', 'update')->name('.update');
                Route::delete('{session}', 'destroy')->name('.destroy');
            });
        });

        Route::controller(CctvController::class)->prefix('cctv')->name('cctv')->group(function () {
            Route::get('/', 'index')->name('');
            Route::post('kejadian', 'storeEvent')->name('.event');
            Route::put('{camera}', 'update')->name('.update');
            Route::post('{camera}/rekam', 'toggleRecording')->name('.recording');
            Route::post('{camera}/sambungan', 'toggleOnline')->name('.online');
        });

        Route::controller(AccreditationController::class)->prefix('akreditasi')->name('akreditasi.')->group(function () {
            Route::get('dasbor', 'dashboard')->name('dasbor');
            Route::get('indikator', 'indicators')->name('indikator');
            Route::get('gap', 'gap')->name('gap');
            Route::get('bukti', 'evidence')->name('bukti');
            Route::get('berkas', 'files')->name('berkas');
            Route::patch('indikator/{indicator}', 'updateIndicator')->name('indikator.update');
            Route::post('bukti/{evidence}/unggah', 'uploadEvidence')->name('bukti.upload');
            Route::post('bukti/{evidence}/sahkan', 'approveEvidence')->name('bukti.approve');
            Route::get('bukti/{evidence}/berkas', 'evidenceFile')->name('bukti.file');
            Route::post('snapshot', 'snapshot')->name('snapshot');
            Route::post('berkas/setujui', 'approveSubmission')->name('berkas.approve');
            Route::get('berkas/paket-bukti', 'evidencePackage')->name('berkas.package');
            Route::get('berkas/{type}', 'document')->name('berkas.document');
        });

        Route::controller(ReportController::class)->prefix('laporan')->name('laporan')->group(function () {
            Route::get('/', 'index')->name('');
            Route::get('unduh/{format}', 'download')->name('.download');
        });

        Route::middleware('role:admin')->controller(CmsController::class)->prefix('cms')->name('cms')->group(function () {
            Route::get('/', 'index')->name('');
            Route::put('konten', 'updateContent')->name('.content');
            Route::post('berita', 'storeNews')->name('.news.store');
            Route::patch('berita/{post}', 'updateNews')->name('.news.update');
            Route::delete('berita/{post}', 'destroyNews')->name('.news.destroy');
        });

        Route::middleware('role:admin')->controller(SettingsController::class)->prefix('pengaturan')->name('pengaturan')->group(function () {
            Route::get('/', 'index')->name('');
            Route::put('/', 'update')->name('.update');
        });
    });
