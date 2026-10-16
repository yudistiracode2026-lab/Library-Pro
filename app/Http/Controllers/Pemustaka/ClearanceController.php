<?php

namespace App\Http\Controllers\Pemustaka;

use App\Http\Controllers\Controller;
use App\Models\ClearanceRequest;
use App\Models\Employee;
use App\Models\Loan;
use App\Models\Member;
use App\Support\LibrarySettings;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * Student side of bebas pustaka: the four requirements can be met in any
 * order; the hardcopy can only be scheduled once the PDF is approved.
 */
class ClearanceController extends Controller
{
    use Concerns;

    public function show(Request $request): Response
    {
        $member = $this->member($request);
        $clearance = $member->clearanceRequests()->latest('id')->first();
        $settings = LibrarySettings::all();
        $loans = $member->loans()->open()->with('copy.book')->get();

        return Inertia::render('pemustaka/bebas-pustaka', [
            'enabled' => [
                'loans' => (bool) $settings['clearance_no_loans'],
                'donation' => (bool) $settings['clearance_donation'],
                'thesis' => (bool) $settings['clearance_thesis'],
                'hardcopy' => (bool) $settings['clearance_hardcopy'],
            ],
            'loans' => $loans->map(fn (Loan $l) => ['title' => $l->copy->book->title, 'due' => $l->due_at->translatedFormat('j M Y')]),
            'request' => $clearance ? [
                'status' => $clearance->status,
                'note' => $clearance->note,
                'donation' => $clearance->donation_title ? [
                    'title' => $clearance->donation_title,
                    'author' => $clearance->donation_author,
                    'publisher' => $clearance->donation_publisher,
                    'year' => $clearance->donation_year,
                    'isbn' => $clearance->donation_isbn,
                    'copies' => $clearance->donation_copies,
                    'status' => $clearance->donation_status ?? 'Menunggu',
                ] : null,
                'thesis' => $clearance->thesis_file ? [
                    'title' => $clearance->thesis_title,
                    'advisor' => $clearance->thesis_advisor,
                    'file' => basename($clearance->thesis_file),
                    'status' => $clearance->thesis_verified_at ? 'Di-ACC' : 'Menunggu ACC',
                ] : null,
                'hardcopy' => [
                    'scheduled' => $clearance->hardcopy_scheduled_at?->translatedFormat('l, j F Y'),
                    'received' => $clearance->hardcopy_received_at?->translatedFormat('j F Y'),
                ],
                'letter' => $clearance->letter_number ? [
                    'number' => $clearance->letter_number,
                    'date' => $clearance->approved_at->translatedFormat('j F Y'),
                    'url' => route('pemustaka.bebas-pustaka.surat'),
                ] : null,
            ] : null,
            'member' => ['name' => $member->name, 'member_number' => $member->member_number, 'study_program' => $member->study_program],
            'head' => Employee::where('is_head', true)->first()?->only(['name', 'nip']),
            'minYear' => now()->year - 5,
        ]);
    }

    public function donation(Request $request): RedirectResponse
    {
        $member = $this->member($request);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'publisher' => ['required', 'string', 'max:255'],
            'year' => ['required', 'integer', 'between:'.(now()->year - 5).','.now()->year],
            'isbn' => ['nullable', 'string', 'max:20'],
            'copies' => ['required', 'integer', 'between:1,10'],
        ], ['year.between' => 'Tahun terbit harus :min atau lebih baru.'], [
            'title' => 'judul buku', 'author' => 'pengarang', 'publisher' => 'penerbit', 'year' => 'tahun terbit', 'copies' => 'jumlah eksemplar',
        ]);

        $clearance = $this->openRequest($member);
        abort_if(in_array($clearance->donation_status, ['Menunggu', 'Diterima'], true) && $clearance->donation_title, 409, 'Data buku sumbangan sudah dikirim.');

        $clearance->update([
            'donation_title' => $data['title'], 'donation_author' => $data['author'], 'donation_publisher' => $data['publisher'],
            'donation_year' => $data['year'], 'donation_isbn' => $data['isbn'] ?? null, 'donation_copies' => $data['copies'],
            'donation_status' => 'Menunggu', 'donation_book_id' => null,
        ]);

        return back()->with('success', 'Data buku terkirim. Bawa bukunya ke meja sirkulasi untuk diverifikasi, ya.');
    }

    public function thesis(Request $request): RedirectResponse
    {
        $member = $this->member($request);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'advisor' => ['required', 'string', 'max:255'],
            'abstract' => ['nullable', 'string', 'max:5000'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:20480'],
            'agree' => ['accepted'],
        ], ['agree.accepted' => 'Centang pernyataan versi final dulu, ya.'], [
            'title' => 'judul skripsi', 'advisor' => 'pembimbing', 'file' => 'berkas skripsi',
        ]);

        $clearance = $this->openRequest($member);
        abort_if($clearance->thesis_verified_at !== null, 409, 'Skripsi sudah di-ACC.');

        $path = $request->file('file')->storeAs('skripsi', "skripsi_{$member->member_number}_".now()->format('YmdHis').'.pdf', 'local');

        $clearance->update([
            'thesis_title' => $data['title'], 'thesis_advisor' => $data['advisor'], 'thesis_abstract' => $data['abstract'] ?? null,
            'thesis_file' => $path, 'thesis_checks' => null,
            // A request sent back to the student goes back to the queue.
            'status' => ClearanceRequest::PENDING, 'note' => $clearance->status === ClearanceRequest::RETURNED ? null : $clearance->note,
            'submitted_at' => now(),
        ]);

        return back()->with('success', 'File skripsi terkirim. Tunggu ACC pustakawan, ya.');
    }

    public function hardcopy(Request $request): RedirectResponse
    {
        $member = $this->member($request);
        $date = $request->validate(['date' => ['required', 'date', 'after_or_equal:today']], [], ['date' => 'jadwal penyerahan'])['date'];

        $clearance = $this->openRequest($member);
        abort_if($clearance->thesis_verified_at === null, 409, 'Hardcopy baru bisa dijadwalkan setelah file skripsi di-ACC.');

        $clearance->update(['hardcopy_scheduled_at' => $date]);

        return back()->with('success', 'Penyerahan hardcopy dijadwalkan.');
    }

    public function letter(Request $request): HttpResponse
    {
        $clearance = $this->member($request)->clearanceRequests()->where('status', ClearanceRequest::APPROVED)->latest('approved_at')->firstOrFail();

        return Pdf::loadView('pdf.surat-bebas-pustaka', [
            'clearance' => $clearance->load('member'),
            'head' => Employee::where('is_head', true)->first(),
            'logo' => public_path('images/logo-stpn.png'),
        ])->setPaper('a4')->download('surat-bebas-pustaka-'.$clearance->member->member_number.'.pdf');
    }

    /**
     * The member's request still in progress, started on first use.
     */
    private function openRequest(Member $member): ClearanceRequest
    {
        $latest = $member->clearanceRequests()->latest('id')->first();

        abort_if($latest?->status === ClearanceRequest::APPROVED, 409, 'Bebas pustaka kamu sudah disetujui.');

        return $latest ?? $member->clearanceRequests()->create([
            'thesis_title' => '—',
            'submitted_at' => now(),
            'status' => ClearanceRequest::PENDING,
        ]);
    }
}
