<?php

namespace App\Http\Controllers\Pemustaka;

use App\Http\Controllers\Controller;
use App\Models\CollectionSuggestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Usulan koleksi": members propose titles and back each other's
 * proposals; the staff review them under Pengadaan buku.
 */
class SuggestionController extends Controller
{
    use Concerns;

    public function index(Request $request): Response
    {
        $member = $this->member($request);
        $voted = DB::table('suggestion_votes')->where('member_id', $member->id)->pluck('collection_suggestion_id');

        return Inertia::render('pemustaka/usulan', [
            'suggestions' => CollectionSuggestion::where('status', '!=', CollectionSuggestion::REJECTED)
                ->orderByDesc('votes')->orderByDesc('id')->get()
                ->map(fn (CollectionSuggestion $s) => [
                    'id' => $s->id,
                    'title' => $s->title,
                    'author' => $s->author,
                    'votes' => $s->votes,
                    'status' => $s->status,
                    'mine' => $voted->contains($s->id),
                    'canVote' => $s->status === CollectionSuggestion::PROPOSED,
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $member = $this->member($request);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
        ], [], ['title' => 'judul', 'author' => 'pengarang']);

        DB::transaction(function () use ($member, $data) {
            $suggestion = CollectionSuggestion::create([
                'title' => $data['title'],
                'author' => $data['author'] ?: '—',
                'member_id' => $member->id,
                'votes' => 1,
                'status' => CollectionSuggestion::PROPOSED,
            ]);
            $suggestion->voters()->attach($member->id);
        });

        return back()->with('success', 'Terima kasih, usulanmu sudah kami terima.');
    }

    public function vote(Request $request, CollectionSuggestion $suggestion): RedirectResponse
    {
        $member = $this->member($request);
        abort_unless($suggestion->status === CollectionSuggestion::PROPOSED, 409, 'Usulan ini sudah diproses.');

        DB::transaction(function () use ($suggestion, $member) {
            if ($suggestion->voters()->where('member_id', $member->id)->exists()) {
                $suggestion->voters()->detach($member->id);
                $suggestion->decrement('votes');
            } else {
                $suggestion->voters()->attach($member->id);
                $suggestion->increment('votes');
            }
        });

        return back();
    }
}
