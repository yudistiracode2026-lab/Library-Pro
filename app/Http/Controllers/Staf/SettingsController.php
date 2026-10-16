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
            'ebook_loan_days' => ['sometimes', 'integer', 'between:1,60'],
            'ebook_max_loans' => ['sometimes', 'integer', 'between:1,10'],
            'reading_minutes' => ['sometimes', 'integer', 'between:10,240'],
            'onsite_networks' => ['sometimes', 'string', 'max:500', function ($attribute, $value, $fail) {
                foreach (array_filter(array_map('trim', explode(',', $value))) as $range) {
                    [$ip, $bits] = array_pad(explode('/', $range, 2), 2, null);
                    if (! filter_var($ip, FILTER_VALIDATE_IP) || ($bits !== null && ! ctype_digit($bits))) {
                        $fail("Rentang jaringan \"{$range}\" tidak valid. Contoh: 192.168.10.0/24.");
                    }
                }
            }],
        ], [], [
            'ebook_loan_days' => 'lama pinjam e-book', 'ebook_max_loans' => 'maksimal e-book', 'reading_minutes' => 'durasi sesi baca',
            'onsite_networks' => 'jaringan perpustakaan',
            'sivitas' => 'jumlah sivitas', 'procurement_budget' => 'pagu pengadaan',
            'loan_days' => 'lama peminjaman', 'max_loans' => 'maksimal buku dipinjam',
            'max_extensions' => 'maksimal perpanjangan', 'fine_per_day' => 'denda per hari',
        ]);

        LibrarySettings::save($data);

        return back()->with('success', 'Pengaturan tersimpan.');
    }
}
