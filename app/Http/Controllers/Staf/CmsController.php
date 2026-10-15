<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\NewsPost;
use App\Support\WebsiteContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CmsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('staf/cms', [
            'content' => WebsiteContent::all(),
            'weeklyHours' => WebsiteContent::weeklyHours(),
            'news' => NewsPost::orderByRaw('published_at is null desc')->latest('published_at')->latest('id')->get()->map(fn (NewsPost $n) => [
                ...$n->only(['id', 'title', 'tag', 'excerpt']),
                'published' => $n->published_at !== null,
                'date' => $n->published_at?->translatedFormat('j M Y'),
            ]),
            'tags' => NewsPost::TAGS,
            'websiteUrl' => route('home'),
        ]);
    }

    public function updateContent(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'hero_title' => ['required', 'string', 'max:160'],
            'hero_subtitle' => ['required', 'string', 'max:400'],
            'schedule' => ['required', 'array', 'min:1', 'max:7'],
            'schedule.*.label' => ['required', 'string', 'max:60'],
            'schedule.*.days' => ['required', 'array', 'min:1'],
            'schedule.*.days.*' => ['integer', 'between:0,6'],
            'schedule.*.open' => ['nullable', 'date_format:H:i'],
            'schedule.*.close' => ['nullable', 'required_with:schedule.*.open', 'date_format:H:i', 'after:schedule.*.open'],
            'schedule.*.break_minutes' => ['required', 'integer', 'between:0,240'],
            'schedule.*.note' => ['nullable', 'string', 'max:120'],
        ], [
            'schedule.*.close.after' => 'Jam tutup harus setelah jam buka.',
            'schedule.*.close.required_with' => 'Isi jam tutup.',
        ], ['hero_title' => 'judul', 'hero_subtitle' => 'subjudul']);

        $data['schedule'] = array_map(fn ($row) => [
            'label' => $row['label'],
            'days' => array_values(array_map('intval', $row['days'])),
            'open' => $row['open'] ?? null,
            'close' => $row['open'] ? $row['close'] : null,
            'break_minutes' => (int) $row['break_minutes'],
            'note' => $row['note'] ?? '',
        ], $data['schedule']);

        WebsiteContent::save($data);

        return back()->with('success', 'Perubahan website sudah terbit. Jam layanan: '.number_format(WebsiteContent::weeklyHours(), 1, ',', '.').' jam/minggu.');
    }

    public function storeNews(Request $request): RedirectResponse
    {
        NewsPost::create([...$this->validatedNews($request), 'author_id' => $request->user()->id]);

        return back()->with('success', 'Berita disimpan sebagai draf.');
    }

    public function updateNews(Request $request, NewsPost $post): RedirectResponse
    {
        if ($request->has('published')) {
            $published = $request->boolean('published');
            $post->update(['published_at' => $published ? ($post->published_at ?? now()) : null]);

            return back()->with('success', $published ? 'Berita terbit di website.' : 'Berita ditarik ke draf.');
        }

        $post->update($this->validatedNews($request));

        return back()->with('success', 'Berita diperbarui.');
    }

    public function destroyNews(NewsPost $post): RedirectResponse
    {
        $post->delete();

        return back()->with('success', 'Berita dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedNews(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'tag' => ['required', Rule::in(NewsPost::TAGS)],
            'excerpt' => ['nullable', 'string', 'max:400'],
        ], [], ['title' => 'judul', 'tag' => 'label', 'excerpt' => 'ringkasan']);
    }
}
