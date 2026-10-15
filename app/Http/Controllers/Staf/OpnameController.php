<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\OpnameCheck;
use App\Models\OpnameSession;
use App\Models\Rack;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Stock-taking: staff walk the racks and mark every copy found, damaged,
 * or missing. Copies out on loan are skipped. Closing the session writes
 * damaged and missing results back to the copies.
 */
class OpnameController extends Controller
{
    public function index(Request $request): Response
    {
        $session = OpnameSession::active();
        $racks = Rack::orderBy('code')->get();
        $rack = $racks->firstWhere('code', $request->string('rak')->toString()) ?? $racks->first();

        return Inertia::render('staf/opname', [
            'session' => $session ? [
                'id' => $session->id,
                'name' => $session->name,
                'started_at' => $session->started_at->translatedFormat('j M Y'),
                'progress' => $this->progress($session),
                'racks' => $racks->map(fn (Rack $r) => ['code' => $r->code, 'name' => $r->name, ...$this->progress($session, $r)]),
                'rack' => $rack ? $this->rackItems($session, $rack) : null,
            ] : null,
            'history' => OpnameSession::whereNotNull('finished_at')->latest('finished_at')->limit(5)->get()->map(fn (OpnameSession $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'period' => $s->started_at->translatedFormat('j M').' – '.$s->finished_at->translatedFormat('j M Y'),
                'counts' => $s->checks()->selectRaw('result, count(*) as total')->groupBy('result')->pluck('total', 'result'),
            ]),
        ]);
    }

    public function start(Request $request): RedirectResponse
    {
        abort_if(OpnameSession::active() !== null, 409, 'Masih ada sesi yang berjalan.');

        $name = $request->validate(['name' => ['required', 'string', 'max:255']], [], ['name' => 'nama sesi'])['name'];
        OpnameSession::create(['name' => $name, 'started_at' => now(), 'started_by' => $request->user()->id]);

        return back()->with('success', 'Sesi stock opname dimulai.');
    }

    /**
     * Record a result for one copy: from a barcode scan ("ada") or from the
     * Ada / Rusak / Hilang buttons.
     */
    public function check(Request $request): RedirectResponse
    {
        $session = OpnameSession::active() ?? abort(409, 'Tidak ada sesi yang berjalan.');

        $data = $request->validate([
            'code' => ['required', 'string'],
            'result' => ['sometimes', Rule::in(OpnameCheck::RESULTS)],
        ]);

        $copy = BookCopy::where('code', strtoupper(trim($data['code'])))->first()
            ?? throw ValidationException::withMessages(['code' => 'Barcode tidak dikenali.']);

        if ($copy->status === BookCopy::LOANED) {
            throw ValidationException::withMessages(['code' => "{$copy->code} sedang dipinjam, tidak perlu dicek."]);
        }

        OpnameCheck::updateOrCreate(
            ['opname_session_id' => $session->id, 'book_copy_id' => $copy->id],
            ['result' => $data['result'] ?? OpnameCheck::FOUND, 'checked_at' => now(), 'checked_by' => $request->user()->id],
        );

        return back()->with('success', "{$copy->code} dicatat ".($data['result'] ?? OpnameCheck::FOUND).'.');
    }

    public function finish(): RedirectResponse
    {
        $session = OpnameSession::active() ?? abort(409);

        DB::transaction(function () use ($session) {
            $results = $session->checks()->pluck('result', 'book_copy_id');

            BookCopy::whereKey($results->filter(fn ($r) => $r === OpnameCheck::DAMAGED)->keys())
                ->where('status', '!=', BookCopy::LOANED)->update(['status' => BookCopy::REPAIR]);
            BookCopy::whereKey($results->filter(fn ($r) => $r === OpnameCheck::MISSING)->keys())
                ->where('status', '!=', BookCopy::LOANED)->update(['status' => BookCopy::LOST]);
            // Copies found on the shelf after being marked lost are back in circulation.
            BookCopy::whereKey($results->filter(fn ($r) => $r === OpnameCheck::FOUND)->keys())
                ->where('status', BookCopy::LOST)->update(['status' => BookCopy::AVAILABLE]);

            $session->update(['finished_at' => now()]);
        });

        $counts = $session->checks()->selectRaw('result, count(*) as total')->groupBy('result')->pluck('total', 'result');

        return back()->with('success', sprintf(
            'Sesi selesai: %d ada, %d rusak, %d hilang. Status eksemplar sudah diperbarui.',
            $counts[OpnameCheck::FOUND] ?? 0, $counts[OpnameCheck::DAMAGED] ?? 0, $counts[OpnameCheck::MISSING] ?? 0,
        ));
    }

    /**
     * Copies that should be on the shelves (all printed copies not on loan).
     *
     * @return Builder<BookCopy>
     */
    private function shelfCopies(?Rack $rack = null): Builder
    {
        return BookCopy::query()
            ->where('status', '!=', BookCopy::LOANED)
            ->whereHas('book', fn ($b) => $b->where('type', Book::PRINTED)->when($rack, fn ($q) => $q->where('rack_id', $rack->id)));
    }

    /**
     * @return array{total: int, done: int}
     */
    private function progress(OpnameSession $session, ?Rack $rack = null): array
    {
        $copies = $this->shelfCopies($rack);

        return [
            'total' => (clone $copies)->count(),
            'done' => $session->checks()->whereIn('book_copy_id', (clone $copies)->select('id'))->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rackItems(OpnameSession $session, Rack $rack): array
    {
        $checks = $session->checks()->pluck('result', 'book_copy_id');
        $copies = BookCopy::with('book:id,title,call_number')
            ->whereHas('book', fn ($b) => $b->where('type', Book::PRINTED)->where('rack_id', $rack->id))
            ->get()
            ->sortBy(fn (BookCopy $c) => [$c->book->call_number, $c->code])
            ->values();

        $items = $copies->map(fn (BookCopy $c) => [
            'code' => $c->code,
            'title' => $c->book->title,
            'call_number' => $c->book->call_number,
            'state' => $c->status === BookCopy::LOANED ? 'dipinjam' : ($checks[$c->id] ?? 'belum'),
        ]);

        return [
            'code' => $rack->code,
            'name' => $rack->name,
            'items' => $items,
            'summary' => $items->countBy('state'),
        ];
    }
}
