<?php

namespace App\Http\Controllers\Pemustaka;

use App\Http\Controllers\Controller;
use App\Models\ReadingSession;
use App\Models\Thesis;
use App\Support\LibrarySettings;
use App\Support\OnSite;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * "Baca di tempat": abstracts are open everywhere; the full text of a
 * skripsi, tesis, or disertasi opens only on the library network after
 * checking in, in timed sessions, without download or print.
 */
class ReadingController extends Controller
{
    use Concerns;

    public function index(Request $request): Response
    {
        $member = $this->member($request);
        $tab = in_array($request->query('jenis'), [...Thesis::TYPES, 'riwayat'], true) ? $request->query('jenis') : 'Skripsi';
        $q = $request->string('q')->trim()->toString();
        $year = $request->string('tahun')->toString();
        $gate = OnSite::status($request, $member);
        $session = $request->integer('sesi') ? $this->activeSession($member->id, $request->integer('sesi')) : null;

        return Inertia::render('pemustaka/baca', [
            'tab' => $tab,
            'filters' => ['q' => $q, 'tahun' => $year],
            'gate' => $gate,
            'counts' => collect(Thesis::TYPES)->mapWithKeys(fn ($t) => [$t => Thesis::where('type', $t)->count()])
                ->put('riwayat', $member->readingSessions()->count()),
            'works' => $tab === 'riwayat' ? null : Thesis::where('type', $tab)
                ->when($q !== '', fn ($w) => $w->where(fn ($s) => $s
                    ->where('title', 'like', "%{$q}%")->orWhere('author', 'like', "%{$q}%")
                    ->orWhere('advisor', 'like', "%{$q}%")->orWhere('keywords', 'like', "%{$q}%")))
                ->when($year === 'lama', fn ($w) => $w->where('year', '<=', now()->year - 3))
                ->when(ctype_digit($year), fn ($w) => $w->where('year', (int) $year))
                ->orderByDesc('year')->orderBy('title')
                ->paginate(20, ['id', 'type', 'title', 'author', 'member_number', 'study_program', 'year', 'advisor', 'abstract'])
                ->withQueryString()
                ->through(fn (Thesis $t) => $this->work($t)),
            'years' => collect(range(now()->year, now()->year - 2))->all(),
            'selected' => $request->integer('karya') ? $this->work(Thesis::findOrFail($request->integer('karya')), true) : null,
            'history' => $tab === 'riwayat' ? $member->readingSessions()->with('thesis')->latest('started_at')->limit(30)->get()->map(fn (ReadingSession $s) => [
                'id' => $s->id,
                'thesisId' => $s->thesis_id,
                'title' => $s->thesis->title,
                'type' => $s->thesis->type,
                'when' => $s->started_at->isToday() ? 'Hari ini, '.$s->started_at->format('H.i') : $s->started_at->translatedFormat('j M Y, H.i'),
                'pages' => 'hlm. 1–'.$s->max_page,
                'minutes' => max(1, (int) round($s->started_at->diffInMinutes($s->ended_at ?? now()))),
            ]) : [],
            'reader' => $session && $gate['open'] ? [
                'sessionId' => $session->id,
                'title' => $session->thesis->title,
                'file' => route('pemustaka.baca.file', $session),
                'endsAt' => $session->started_at->copy()->addMinutes($this->minutes())->getTimestamp() * 1000,
                'watermark' => "{$member->name} · {$member->member_number} · ".now()->translatedFormat('j M, H.i'),
            ] : null,
            'minutes' => $this->minutes(),
        ]);
    }

    public function start(Request $request, Thesis $thesis): RedirectResponse
    {
        $member = $this->member($request);

        if (! OnSite::status($request, $member)['open']) {
            return back()->with('error', 'Teks lengkap hanya bisa dibuka di perpustakaan: sambungkan ke Wi-Fi perpustakaan dan lakukan presensi masuk.');
        }

        abort_unless($thesis->file_path && Storage::disk('local')->exists($thesis->file_path), 404, 'Berkas teks lengkap belum tersedia.');

        // Close any other session still open for this member first.
        $member->readingSessions()->whereNull('ended_at')->update(['ended_at' => now()]);
        $session = $member->readingSessions()->create(['thesis_id' => $thesis->id, 'started_at' => now()]);

        return to_route('pemustaka.baca', ['jenis' => $thesis->type, 'sesi' => $session->id]);
    }

    public function file(Request $request, ReadingSession $session): StreamedResponse
    {
        $member = $this->member($request);
        abort_unless($this->activeSession($member->id, $session->id) && OnSite::status($request, $member)['open'], 403);

        return Storage::disk('local')->response($session->thesis->file_path, null, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function progress(Request $request, ReadingSession $session): RedirectResponse|HttpResponse
    {
        abort_unless($session->member_id === $this->member($request)->id, 403);
        $page = $request->validate(['page' => ['required', 'integer', 'min:1', 'max:5000']])['page'];
        $session->update(['max_page' => max($session->max_page, $page)]);

        return $request->wantsJson() ? response()->noContent() : back();
    }

    public function end(Request $request, ReadingSession $session): RedirectResponse
    {
        abort_unless($session->member_id === $this->member($request)->id, 403);
        $session->ended_at ??= now();
        $session->save();

        return to_route('pemustaka.baca', ['jenis' => $session->thesis->type])->with('success', 'Sesi baca selesai dan tercatat di riwayat.');
    }

    private function minutes(): int
    {
        return (int) LibrarySettings::get('reading_minutes');
    }

    private function activeSession(int $memberId, int $id): ?ReadingSession
    {
        return ReadingSession::with('thesis')
            ->whereKey($id)
            ->where('member_id', $memberId)
            ->whereNull('ended_at')
            ->where('started_at', '>', now()->subMinutes($this->minutes()))
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    private function work(Thesis $t, bool $full = false): array
    {
        return [
            'id' => $t->id,
            'type' => $t->type,
            'title' => $t->title,
            'author' => $t->author,
            'member_number' => $t->member_number,
            'study_program' => $t->study_program,
            'year' => $t->year,
            'advisor' => $t->advisor,
            'abstract' => $full ? $t->abstract : str($t->abstract)->limit(260)->toString(),
            ...($full ? ['keywords' => $t->keywords, 'pages' => $t->pages, 'call_number' => $t->call_number, 'hasFile' => $t->file_path !== null] : []),
        ];
    }
}
