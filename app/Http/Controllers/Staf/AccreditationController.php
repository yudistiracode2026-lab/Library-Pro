<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\AccreditationSnapshot;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Employee;
use App\Models\Evidence;
use App\Models\Indicator;
use App\Models\Member;
use App\Models\Room;
use App\Models\User;
use App\Services\Accreditation\Scorer;
use App\Support\LibrarySettings;
use App\Support\WebsiteContent;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

/**
 * Accreditation workspace (PRD M0): score dashboard, indicators, gap
 * analysis, evidence bank, and the SiPAPI submission files.
 */
class AccreditationController extends Controller
{
    public function __construct(private Scorer $scorer) {}

    public function dashboard(): Response
    {
        $results = $this->scorer->evaluate();
        $summary = $this->scorer->summary($results);
        $evidence = Evidence::all();

        return Inertia::render('staf/akreditasi/dasbor', [
            ...$summary,
            'modeStats' => collect(Indicator::MODES)->mapWithKeys(fn ($m) => [$m => $results->filter(fn ($r) => $r['indicator']->mode === $m)->count()]),
            'evidence' => collect(Evidence::STATUSES)->mapWithKeys(fn ($s) => [$s => $evidence->filter(fn (Evidence $e) => $e->effectiveStatus() === $s)->count()]),
            'readyIndicators' => $evidence->groupBy('indicator_id')->filter(fn ($items) => $items->every(fn (Evidence $e) => $e->effectiveStatus() === Evidence::APPROVED))->count(),
            'gap' => $this->gapRows($results)->take(5)->values(),
        ]);
    }

    public function indicators(Request $request): Response
    {
        $results = $this->scorer->evaluate();
        $component = $request->integer('komponen');
        $mode = in_array($request->query('mode'), Indicator::MODES, true) ? $request->query('mode') : '';
        $selected = $results->get($request->string('ik')->toString());
        $evidence = Evidence::all()->groupBy('indicator_id');

        return Inertia::render('staf/akreditasi/indikator', [
            'components' => collect(Scorer::COMPONENTS)->map(fn ($c, $n) => ['number' => $n, 'name' => $c[0]])->values(),
            'filters' => ['komponen' => $component ?: null, 'mode' => $mode],
            'rows' => $results
                ->filter(fn ($r) => (! $component || $r['indicator']->component === $component) && (! $mode || $r['indicator']->mode === $mode))
                ->map(fn ($r) => [
                    ...$this->row($r),
                    'evidenceDone' => $evidence->get($r['indicator']->id, collect())->filter(fn (Evidence $e) => $e->effectiveStatus() === Evidence::APPROVED)->count(),
                    'evidenceTotal' => $evidence->get($r['indicator']->id, collect())->count(),
                ])->values(),
            'selected' => $selected ? $this->detail($selected, $results) : null,
            'staff' => Employee::where('status', 'Aktif')->orderBy('name')->get(['id', 'name']),
            'canApprove' => $this->canApprove($request->user()),
        ]);
    }

    public function gap(): Response
    {
        $results = $this->scorer->evaluate();
        $summary = $this->scorer->summary($results);

        return Inertia::render('staf/akreditasi/gap', [
            'finalScore' => $summary['finalScore'],
            'predicate' => $summary['predicate'],
            'rows' => $this->gapRows($results)->values(),
            'predicates' => Scorer::PREDICATES,
        ]);
    }

    public function evidence(Request $request): Response
    {
        $status = in_array($request->query('status'), Evidence::STATUSES, true) ? $request->query('status') : '';
        $all = Evidence::with('indicator')->get()->sortBy(fn (Evidence $e) => [$e->indicator->position, $e->id])->values();

        return Inertia::render('staf/akreditasi/bukti', [
            'status' => $status,
            'counts' => collect(Evidence::STATUSES)->mapWithKeys(fn ($s) => [$s => $all->filter(fn (Evidence $e) => $e->effectiveStatus() === $s)->count()])->put('', $all->count()),
            'items' => $all->filter(fn (Evidence $e) => ! $status || $e->effectiveStatus() === $status)
                ->map(fn (Evidence $e) => [...$this->evidenceRow($e), 'indicator' => ['number' => $e->indicator->number, 'name' => $e->indicator->name]])
                ->values(),
            'canApprove' => $this->canApprove($request->user()),
            'accept' => Evidence::MIMES,
        ]);
    }

    public function files(): Response
    {
        $results = $this->scorer->evaluate();
        $summary = $this->scorer->summary($results);

        $profile = $this->profile();
        $head = Employee::where('is_head', true)->first();
        $approvedAt = LibrarySettings::get('accreditation_approved_at');

        return Inertia::render('staf/akreditasi/berkas', [
            'finalScore' => $summary['finalScore'],
            'predicate' => $summary['predicate'],
            'approvedEvidence' => Evidence::where('status', Evidence::APPROVED)->whereNotNull('file_path')->count(),
            'checks' => $this->submissionChecks($results),
            'canApprove' => $this->canApprove(request()->user()),
            'approvedAt' => $approvedAt ? Carbon::parse($approvedAt)->translatedFormat('j M Y, H.i') : null,
            'today' => now()->translatedFormat('j M Y'),
            'profile' => [
                ['Nama perpustakaan', 'Perpustakaan Politeknik Agraria'],
                ['Lembaga induk', 'Politeknik Agraria (STPN), Kementerian ATR/BPN'],
                ['Alamat', 'Jl. Tata Bumi No. 5, Banyuraden, Gamping, Sleman, D.I. Yogyakarta'],
                ['Kepala perpustakaan', $head?->name ?? '—'],
                ['Luas gedung', number_format($profile['area'], 0, ',', '.').' m² ('.Room::where('outside_library', false)->count().' ruang)'],
                ['Luas per sivitas', number_format($profile['area'] / max(1, $profile['sivitas']), 2, ',', '.').' m²'],
                ['Jumlah sivitas', number_format($profile['sivitas'], 0, ',', '.')],
                ['Jumlah koleksi', number_format($profile['printed'] + $profile['ebooks'], 0, ',', '.').' judul · '.number_format($profile['copies'], 0, ',', '.').' eksemplar'],
                ['Jenis koleksi', Book::distinct()->count('collection_type').' jenis'],
                ['Pustakawan', $profile['librarians']->count().' orang'],
                ['Tenaga teknis', $profile['support'].' orang'],
                ['Jam layanan', number_format($profile['hours'], 1, ',', '.').' jam per minggu'],
                ['Nilai akhir simulasi', number_format($summary['finalScore'], 2, ',', '.')." ({$summary['predicate']['letter']} · {$summary['predicate']['label']})"],
            ],
            'snapshots' => AccreditationSnapshot::latest('taken_at')->limit(10)->get()->map(fn ($s) => [
                'id' => $s->id, 'taken_at' => $s->taken_at->translatedFormat('j M Y, H.i'), 'finalScore' => $s->final_score, 'predicate' => $s->predicate,
            ]),
        ]);
    }

    public function updateIndicator(Request $request, Indicator $indicator): RedirectResponse
    {
        $data = $request->validate([
            'manual_score' => ['sometimes', 'nullable', 'integer', 'between:1,4'],
            'manual_value' => ['sometimes', 'nullable', 'string', 'max:255'],
            'manual_note' => [Rule::requiredIf(fn () => $request->filled('manual_score')), 'nullable', 'string', 'max:1000'],
            'pic_employee_id' => ['sometimes', 'nullable', 'exists:employees,id'],
            'due_date' => ['sometimes', 'nullable', 'date'],
        ], ['manual_note.required' => 'Catatan alasan wajib diisi saat memilih opsi.'], ['manual_note' => 'catatan alasan']);

        if (array_key_exists('manual_score', $data)) {
            abort_if(in_array($indicator->number, Scorer::COMPUTED, true), 409, 'Skor IK ini dihitung otomatis dari data.');
            $data += ['assessed_by' => $request->user()->id, 'assessed_at' => now()];
        }

        $indicator->update($data);

        return back()->with('success', "IK {$indicator->number} diperbarui.");
    }

    public function uploadEvidence(Request $request, Evidence $evidence): RedirectResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:'.Evidence::MIMES, 'max:'.Evidence::MAX_KB]], [], ['file' => 'berkas']);
        $file = $request->file('file');

        // Earlier versions stay in storage; the record points at the newest.
        $path = $file->storeAs('bukti/'.str_replace('.', '-', $evidence->indicator->number), now()->format('YmdHis').'-'.str($file->getClientOriginalName())->slug('-', 'id').'.'.$file->extension(), 'local');

        $evidence->update([
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'status' => Evidence::DRAFT,
            'uploaded_by' => $request->user()->id,
            'uploaded_at' => now(),
            'approved_by' => null,
            'approved_at' => null,
            'valid_until' => null,
        ]);

        return back()->with('success', 'Bukti diunggah sebagai draf. Menunggu pengesahan kepala perpustakaan.');
    }

    public function approveEvidence(Request $request, Evidence $evidence): RedirectResponse
    {
        abort_unless($this->canApprove($request->user()), 403, 'Pengesahan bukti dilakukan oleh kepala perpustakaan.');
        abort_if($evidence->file_path === null, 409, 'Belum ada berkas.');

        $data = $request->validate(['valid_until' => ['nullable', 'date', 'after:today']], [], ['valid_until' => 'berlaku sampai']);
        $evidence->update([
            'status' => Evidence::APPROVED,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'valid_until' => $data['valid_until'] ?? null,
        ]);

        return back()->with('success', "Bukti \"{$evidence->label}\" disahkan.");
    }

    public function evidenceFile(Evidence $evidence): StreamedResponse
    {
        abort_unless($evidence->file_path && Storage::disk('local')->exists($evidence->file_path), 404);

        return Storage::disk('local')->response($evidence->file_path, $evidence->original_name);
    }

    public function snapshot(Request $request): RedirectResponse
    {
        $results = $this->scorer->evaluate();
        $summary = $this->scorer->summary($results);

        AccreditationSnapshot::create([
            'taken_at' => now(),
            'final_score' => $summary['finalScore'],
            'predicate' => "{$summary['predicate']['letter']} · {$summary['predicate']['label']}",
            'scores' => $results->map(fn ($r) => ['score' => $r['score'], 'value' => $r['value'], 'computed' => $r['computed']])->all(),
            'taken_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Snapshot penilaian disimpan (NA '.number_format($summary['finalScore'], 2, ',', '.').').');
    }

    /**
     * Formulir pengajuan, data profil, or pernyataan penulisan sertifikat.
     */
    public function document(string $type): HttpResponse
    {
        abort_unless(in_array($type, ['formulir', 'profil', 'pernyataan'], true), 404);

        $summary = $this->scorer->summary($this->scorer->evaluate());
        $head = Employee::where('is_head', true)->first();

        return Pdf::loadView("pdf.akreditasi-{$type}", [
            'head' => $head,
            'logo' => public_path('images/logo-stpn.png'),
            'summary' => $summary,
            'profile' => $this->profile(),
        ])->setPaper('a4')->download("akreditasi-{$type}-".now()->format('Y-m-d').'.pdf');
    }

    /**
     * Approved evidence arranged by component and indicator, for SiPAPI.
     */
    public function evidencePackage(): BinaryFileResponse|RedirectResponse
    {
        $items = Evidence::with('indicator')->where('status', Evidence::APPROVED)->whereNotNull('file_path')->get()
            ->filter(fn (Evidence $e) => $e->effectiveStatus() === Evidence::APPROVED && Storage::disk('local')->exists($e->file_path));

        if ($items->isEmpty()) {
            return back()->with('error', 'Belum ada bukti tersahkan untuk dikemas.');
        }

        $zipPath = tempnam(sys_get_temp_dir(), 'bukti');
        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::OVERWRITE);

        foreach ($items as $e) {
            $component = $e->indicator->component;
            $folder = "Komponen {$component} - ".Scorer::COMPONENTS[$component][0]."/IK {$e->indicator->number} - {$e->indicator->name}";
            $zip->addFile(Storage::disk('local')->path($e->file_path), "{$folder}/".str($e->label)->slug('-', 'id').'.'.pathinfo($e->file_path, PATHINFO_EXTENSION));
        }

        $zip->close();

        return response()->download($zipPath, 'paket-bukti-akreditasi-'.now()->format('Y-m-d').'.zip')->deleteFileAfterSend();
    }

    /**
     * The head of library approves the submission once every check passes.
     */
    public function approveSubmission(Request $request): RedirectResponse
    {
        abort_unless($this->canApprove($request->user()), 403);

        if (collect($this->submissionChecks($this->scorer->evaluate()))->contains('ok', false)) {
            return back()->with('error', 'Masih ada pemeriksaan yang belum terpenuhi.');
        }

        LibrarySettings::save(['accreditation_approved_at' => now()->toDateTimeString()]);

        return back()->with('success', 'Pengajuan disetujui. Koordinator bisa mengunggah berkas ke SiPAPI.');
    }

    /**
     * Checks before submission, as listed in the prototype.
     *
     * @param  Collection<string, mixed>  $results
     * @return list<array{label: string, detail: string, ok: bool}>
     */
    private function submissionChecks(Collection $results): array
    {
        $evidence = Evidence::all();
        $ready = $evidence->groupBy('indicator_id')->filter(fn ($items) => $items->every(fn (Evidence $e) => $e->effectiveStatus() === Evidence::APPROVED))->count();
        $drafts = $evidence->filter(fn (Evidence $e) => $e->effectiveStatus() === Evidence::DRAFT)->count();
        $expired = $evidence->filter(fn (Evidence $e) => $e->effectiveStatus() === Evidence::EXPIRED)->count();
        $total = $results->count();
        $manualWithoutNote = $results->filter(fn ($r) => ! $r['computed'] && $r['indicator']->manual_score !== null && blank($r['indicator']->manual_note))->count();

        return [
            ['label' => 'Semua IK punya bukti tersahkan', 'detail' => "{$ready} dari {$total} IK lengkap · {$drafts} draf menunggu pengesahan", 'ok' => $ready === $total],
            ['label' => 'Tidak ada bukti kedaluwarsa', 'detail' => "{$expired} bukti perlu diperbarui", 'ok' => $expired === 0],
            ['label' => 'IK manual disertai alasan', 'detail' => $manualWithoutNote ? "{$manualWithoutNote} IK belum punya catatan alasan" : 'Setiap opsi manual punya catatan alasan', 'ok' => $manualWithoutNote === 0],
            ['label' => 'Formulir terisi dari data sistem', 'detail' => 'Formulir Pengajuan, Data Profil, dan Pernyataan Sertifikat siap dihasilkan', 'ok' => true],
        ];
    }

    private function canApprove(User $user): bool
    {
        return $user->isAdmin() || (bool) $user->employee?->is_head;
    }

    /**
     * @param  array{indicator: Indicator, score: int|null, value: string|null, computed: bool}  $r
     * @return array<string, mixed>
     */
    private function row(array $r): array
    {
        $i = $r['indicator'];

        return [
            'number' => $i->number,
            'component' => $i->component,
            'name' => $i->name,
            'mode' => $i->mode,
            'computed' => $r['computed'],
            'value' => $r['value'],
            'score' => $r['score'],
            'letter' => $r['score'] ? Scorer::LETTERS[$r['score']] : null,
            'source' => $i->source,
        ];
    }

    /**
     * @param  array{indicator: Indicator, score: int|null, value: string|null, computed: bool}  $r
     * @param  Collection<string, mixed>  $results
     * @return array<string, mixed>
     */
    private function detail(array $r, Collection $results): array
    {
        $i = $r['indicator']->load(['evidence', 'pic']);

        return [
            ...$this->row($r),
            'id' => $i->id,
            'componentName' => Scorer::COMPONENTS[$i->component][0],
            'options' => $i->options,
            'recommendation' => $i->recommendation,
            'manualNote' => $i->manual_note,
            'manualValue' => $i->manual_value,
            'assessedAt' => $i->assessed_at?->translatedFormat('j M Y'),
            'gain' => $r['score'] && $r['score'] < 4 ? round($this->scorer->gainPerStep($results, $i->component), 2) : null,
            'picId' => $i->pic_employee_id,
            'dueDate' => $i->due_date?->toDateString(),
            'evidence' => $i->evidence->map(fn (Evidence $e) => $this->evidenceRow($e))->values(),
            'accept' => Evidence::MIMES,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function evidenceRow(Evidence $e): array
    {
        return [
            'id' => $e->id,
            'label' => $e->label,
            'status' => $e->effectiveStatus(),
            'file' => $e->file_path ? route('staf.akreditasi.bukti.file', $e) : null,
            'fileName' => $e->original_name,
            'size' => $e->size,
            'uploadedAt' => $e->uploaded_at?->translatedFormat('j M Y'),
            'approvedAt' => $e->approved_at?->translatedFormat('j M Y'),
            'validUntil' => $e->valid_until?->translatedFormat('j M Y'),
        ];
    }

    /**
     * Indicators below option a, ordered by the NA gained from one step up.
     *
     * @param  Collection<string, mixed>  $results
     * @return Collection<int, array<string, mixed>>
     */
    private function gapRows(Collection $results): Collection
    {
        return $results
            ->filter(fn ($r) => $r['score'] !== null && $r['score'] < 4)
            ->map(fn ($r) => [
                ...$this->row($r),
                'componentName' => Scorer::COMPONENTS[$r['indicator']->component][0],
                'to' => Scorer::LETTERS[$r['score'] + 1],
                'gain' => round($this->scorer->gainPerStep($results, $r['indicator']->component), 2),
                'action' => $r['indicator']->recommendation ?? $r['indicator']->options[4 - $r['score'] - 1],
            ])
            ->sortBy([['gain', 'desc'], ['number', 'asc']])
            ->values();
    }

    /**
     * Facts for the profile document, from system data.
     *
     * @return array<string, mixed>
     */
    private function profile(): array
    {
        return [
            'area' => (float) Room::where('outside_library', false)->sum('area_m2'),
            'printed' => Book::where('type', Book::PRINTED)->count(),
            'copies' => BookCopy::count(),
            'ebooks' => Book::where('type', Book::EBOOK)->count(),
            'members' => Member::count(),
            'sivitas' => (int) LibrarySettings::get('sivitas'),
            'librarians' => Employee::where('kind', 'pustakawan')->where('status', 'Aktif')->get(['name', 'position']),
            'support' => Employee::where('kind', 'tendik')->where('status', 'Aktif')->count(),
            'hours' => WebsiteContent::weeklyHours(),
            'schedule' => WebsiteContent::all()['schedule'],
        ];
    }
}
