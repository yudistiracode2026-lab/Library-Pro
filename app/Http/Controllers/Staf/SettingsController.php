<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Support\LibrarySettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('staf/pengaturan', ['settings' => LibrarySettings::all()]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'loan_days' => ['required', 'integer', 'between:1,60'],
            'max_loans' => ['required', 'integer', 'between:1,20'],
            'max_extensions' => ['required', 'integer', 'between:0,5'],
            'fine_per_day' => ['required', 'integer', 'between:0,100000'],
            'clearance_no_loans' => ['boolean'],
            'clearance_thesis' => ['boolean'],
            'clearance_donation' => ['boolean'],
            'clearance_hardcopy' => ['boolean'],
            'sivitas' => ['sometimes', 'integer', 'min:1'],
            'procurement_budget' => ['sometimes', 'integer', 'min:0'],
        ], [], [
            'sivitas' => 'jumlah sivitas', 'procurement_budget' => 'pagu pengadaan',
            'loan_days' => 'lama peminjaman', 'max_loans' => 'maksimal buku dipinjam',
            'max_extensions' => 'maksimal perpanjangan', 'fine_per_day' => 'denda per hari',
        ]);

        LibrarySettings::save($data);

        return back()->with('success', 'Pengaturan tersimpan.');
    }
}
