<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\Book;
use App\Models\ClearanceRequest;
use App\Models\Employee;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\Thesis;
use App\Support\MasterOptions;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Staff verification of "bebas pustaka" requests submitted by students.
 */
class ClearanceController extends Controller
{
    public function index(Request $request): Response
    {
        $status = in_array($request->query('status'), [ClearanceRequest::PENDING, ClearanceRequest::APPROVED, ClearanceRequest::RETURNED], true)
            ? $request->query('status') : ClearanceRequest::PENDING;

        return Inertia::render('staf/bebas-pustaka/index', [
            'status' => $status,
            'counts' => ClearanceRequest::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'requests' => ClearanceRequest::with('member')
                ->where('status', $status)
                ->latest('submitted_at')
                ->paginate(25)
                ->withQueryString()
                ->through(fn (ClearanceRequest $c) => [
                    'id' => $c->id,
                    'name' => $c->member->name,
                    'member_number' => $c->member->member_number,
                    'study_program' => $c->member->study_program,
                    'title' => $c->thesis_title,
                    'submitted_at' => $c->submitted_at->translatedFormat('j M Y'),
                    'requirements' => array_values($c->requirements()),
                ]),
        ]);
    }

    public function show(ClearanceRequest $clearance): Response
    {
        $clearance->load(['member', 'donationBook.rack']);
        $member = $clearance->member;
        $checks = $clearance->thesis_checks ?? [];

        return Inertia::render('staf/bebas-pustaka/show', [
            'request' => [
                'id' => $clearance->id,
                'status' => $clearance->status,
                'note' => $clearance->note,
                'title' => $clearance->thesis_title,
                'submitted_at' => $clearance->submitted_at->translatedFormat('j M Y'),
                'member' => [
                    'name' => $member->name,
                    'member_number' => $member->member_number,
                    'study_program' => $member->study_program,
                ],
                'requirements' => $clearance->requirements(),
                'complete' => $clearance->isComplete(),
                'openLoans' => $member->loans()->open()->with('copy.book')->get()->map(fn ($l) => [
                    'code' => $l->copy->code,
                    'title' => $l->copy->book->title,
                    'due_at' => $l->due_at->translatedFormat('j M Y'),
                ]),
                'thesis' => [
                    'file' => $clearance->thesis_file ? route('staf.bebas-pustaka.skripsi', $clearance) : null,
                    'filename' => $clearance->thesis_file ? basename($clearance->thesis_file) : null,
                    'checks' => collect(ClearanceRequest::THESIS_CHECKS)->map(fn ($label, $key) => ['key' => $key, 'label' => $label, 'on' => ! empty($checks[$key])])->values(),
                    'verified_at' => $clearance->thesis_verified_at?->translatedFormat('j M Y, H.i'),
                ],
                'donation' => $clearance->donation_title ? [
                    'title' => $clearance->donation_title,
                    'author' => $clearance->donation_author,
                    'publisher' => $clearance->donation_publisher,
                    'year' => $clearance->donation_year,
                    'isbn' => $clearance->donation_isbn,
                    'copies' => $clearance->donation_copies,
                    'status' => $clearance->donation_status ?? 'Menunggu',
                    'tooOld' => $clearance->donation_year !== null && $clearance->donation_year < now()->year - 5,
                    'alreadyInCollection' => $this->alreadyInCollection($clearance),
                    'book' => $clearance->donationBook ? [
                        'title' => $clearance->donationBook->title,
                        'call_number' => $clearance->donationBook->call_number,
                        'rack' => $clearance->donationBook->rack?->code,
                    ] : null,
                ] : null,
                'hardcopy' => [
                    'scheduled_at' => $clearance->hardcopy_scheduled_at?->translatedFormat('l, j M Y · H.i'),
                    'received_at' => $clearance->hardcopy_received_at?->translatedFormat('j M Y, H.i'),
                ],
                'letter' => $clearance->letter_number ? [
                    'number' => $clearance->letter_number,
                    'approved_at' => $clearance->approved_at->translatedFormat('j M Y'),
                    'url' => route('staf.bebas-pustaka.surat', $clearance),
                ] : null,
            ],
            'options' => [
                'ddc' => collect(MasterOptions::DDC_CLASSES)->map(fn ($l, $c) => ['value' => (string) $c, 'label' => "{$c} · {$l}"])->values(),
                'racks' => Rack::orderBy('code')->get()->map(fn (Rack $r) => ['value' => (string) $r->id, 'label' => "{$r->code} · {$r->name}"]),
            ],
        ]);
    }

    public function thesisFile(ClearanceRequest $clearance): StreamedResponse
    {
        abort_unless($clearance->thesis_file && Storage::disk('local')->exists($clearance->thesis_file), 404);

        return Storage::disk('local')->response($clearance->thesis_file, basename($clearance->thesis_file), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.basename($clearance->thesis_file).'"',
        ]);
    }

    public function toggleCheck(Request $request, ClearanceRequest $clearance): RedirectResponse
    {
        $this->ensurePending($clearance);
        abort_if($clearance->thesis_verified_at !== null, 409);

        $key = $request->validate(['key' => ['required', Rule::in(array_keys(ClearanceRequest::THESIS_CHECKS))]])['key'];
        $checks = $clearance->thesis_checks ?? [];
        $checks[$key] = empty($checks[$key]);
        $clearance->update(['thesis_checks' => $checks]);

        return back();
    }

    public function verifyThesis(Request $request, ClearanceRequest $clearance): RedirectResponse
    {
        $this->ensurePending($clearance);

        if ($clearance->thesis_verified_at !== null) {
            $clearance->update(['thesis_verified_at' => null, 'thesis_verified_by' => null, 'hardcopy_received_at' => null]);

            return back()->with('success', 'ACC skripsi dibatalkan.');
        }

        if (! $clearance->thesis_file || ! $clearance->thesisChecksComplete()) {
            return back()->with('error', 'Centang semua bagian berkas skripsi dulu, ya.');
        }

        $clearance->update(['thesis_verified_at' => now(), 'thesis_verified_by' => $request->user()->id]);

        return back()->with('success', 'Skripsi digital di-ACC.');
    }

    public function acceptDonation(Request $request, ClearanceRequest $clearance): RedirectResponse
    {
        $this->ensurePending($clearance);
        abort_unless($clearance->donation_title && $clearance->donation_status !== 'Diterima', 409);

        $data = $request->validate([
            'ddc_class' => ['required', Rule::in(array_keys(MasterOptions::DDC_CLASSES))],
            'call_number' => ['required', 'string', 'max:40'],
            'rack_id' => ['required', 'exists:racks,id'],
        ], [], ['ddc_class' => 'kelas DDC', 'call_number' => 'nomor panggil', 'rack_id' => 'rak']);

        DB::transaction(function () use ($clearance, $data) {
            $book = Book::create([
                'type' => Book::PRINTED,
                'title' => $clearance->donation_title,
                'author_id' => Author::idForName($clearance->donation_author ?: 'Tanpa nama'),
                'publisher_id' => Publisher::idForName($clearance->donation_publisher ?: 'Tanpa penerbit'),
                'year' => $clearance->donation_year,
                'isbn' => $clearance->donation_isbn,
                'ddc_class' => $data['ddc_class'],
                'collection_type' => 'Buku teks',
                'acquisition' => 'Sumbangan mahasiswa',
                'donor' => $clearance->member->name,
                'call_number' => $data['call_number'],
                'rack_id' => $data['rack_id'],
            ]);
            $book->syncCopyCount(max(1, $clearance->donation_copies));

            $clearance->update(['donation_status' => 'Diterima', 'donation_book_id' => $book->id]);
        });

        return back()->with('success', 'Buku sumbangan diterima dan masuk ke koleksi.');
    }

    public function rejectDonation(Request $request, ClearanceRequest $clearance): RedirectResponse
    {
        $this->ensurePending($clearance);
        abort_unless($clearance->donation_title && $clearance->donation_status !== 'Diterima', 409);

        $note = $request->validate(['note' => ['required', 'string', 'max:500']], [], ['note' => 'alasan'])['note'];
        $clearance->update(['donation_status' => 'Ditolak', 'note' => $note]);

        return back()->with('success', 'Buku sumbangan ditolak. Mahasiswa perlu mengusulkan buku lain.');
    }

    public function receiveHardcopy(ClearanceRequest $clearance): RedirectResponse
    {
        $this->ensurePending($clearance);

        if ($clearance->hardcopy_received_at !== null) {
            $clearance->update(['hardcopy_received_at' => null]);

            return back()->with('success', 'Penerimaan hardcopy dibatalkan.');
        }

        if ($clearance->thesis_verified_at === null) {
            return back()->with('error', 'Hardcopy baru bisa diterima setelah skripsi digital di-ACC.');
        }

        $clearance->update(['hardcopy_received_at' => now()]);

        return back()->with('success', 'Hardcopy diterima. Simpan di rak R1, lantai 3.');
    }

    public function approve(Request $request, ClearanceRequest $clearance): RedirectResponse
    {
        $this->ensurePending($clearance);

        if (! $clearance->isComplete()) {
            return back()->with('error', 'Masih ada syarat yang belum terpenuhi.');
        }

        DB::transaction(function () use ($request, $clearance) {
            $sequence = ClearanceRequest::whereYear('approved_at', now()->year)->lockForUpdate()->count() + 1;

            $clearance->update([
                'status' => ClearanceRequest::APPROVED,
                'approved_at' => now(),
                'approved_by' => $request->user()->id,
                'letter_number' => sprintf('%03d/BP/PERPUS-STPN/%s/%d', $sequence, $this->romanMonth(now()->month), now()->year),
            ]);

            // The approved thesis joins the repository read in "Baca di tempat".
            if ($clearance->thesis_file) {
                Thesis::updateOrCreate(['clearance_request_id' => $clearance->id], [
                    'type' => 'Skripsi',
                    'title' => $clearance->thesis_title,
                    'author' => $clearance->member->name,
                    'member_number' => $clearance->member->member_number,
                    'study_program' => $clearance->member->study_program,
                    'year' => now()->year,
                    'advisor' => $clearance->thesis_advisor,
                    'abstract' => $clearance->thesis_abstract,
                    'call_number' => 'SK '.now()->year.'/'.$clearance->member->member_number,
                    'file_path' => $clearance->thesis_file,
                ]);
            }
        });

        return back()->with('success', 'Bebas pustaka disetujui. Surat siap diunduh.');
    }

    public function sendBack(Request $request, ClearanceRequest $clearance): RedirectResponse
    {
        $this->ensurePending($clearance);

        $note = $request->validate(['note' => ['required', 'string', 'max:500']], [], ['note' => 'catatan'])['note'];
        $clearance->update(['status' => ClearanceRequest::RETURNED, 'note' => $note]);

        return to_route('staf.bebas-pustaka')->with('success', 'Pengajuan dikembalikan ke mahasiswa.');
    }

    public function letter(ClearanceRequest $clearance): HttpResponse
    {
        abort_unless($clearance->status === ClearanceRequest::APPROVED, 404);

        $head = Employee::where('is_head', true)->first();
        $pdf = Pdf::loadView('pdf.surat-bebas-pustaka', [
            'clearance' => $clearance->load('member'),
            'head' => $head,
            'logo' => public_path('images/logo-stpn.png'),
        ])->setPaper('a4');

        return $pdf->download('surat-bebas-pustaka-'.$clearance->member->member_number.'.pdf');
    }

    private function ensurePending(ClearanceRequest $clearance): void
    {
        abort_unless($clearance->status === ClearanceRequest::PENDING, 409, 'Pengajuan ini sudah diproses.');
    }

    private function alreadyInCollection(ClearanceRequest $clearance): bool
    {
        return Book::query()
            ->whereKeyNot($clearance->donation_book_id ?? 0)
            ->where(fn ($q) => $q
                ->when($clearance->donation_isbn, fn ($w) => $w->where('isbn', $clearance->donation_isbn))
                ->orWhereRaw('LOWER(title) = ?', [mb_strtolower($clearance->donation_title)]))
            ->exists();
    }

    private function romanMonth(int $month): string
    {
        return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][$month - 1];
    }
}
