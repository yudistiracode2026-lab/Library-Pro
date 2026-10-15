<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Camera;
use App\Models\CameraEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Camera wall for the circulation and reference desks. Video is embedded
 * from each camera's stream_url (an MJPEG stream or a snapshot image the
 * NVR serves); without one the tile shows a placeholder.
 */
class CctvController extends Controller
{
    public function index(Request $request): Response
    {
        $area = in_array($request->query('area'), Camera::AREAS, true) ? $request->query('area') : 'Semua';
        $cameras = Camera::orderBy('code')->get();
        $shown = $area === 'Semua' ? $cameras : $cameras->where('area', $area)->values();
        $selected = $shown->firstWhere('code', $request->string('kamera')->toString()) ?? $shown->first();

        return Inertia::render('staf/cctv', [
            'area' => $area,
            'areas' => $cameras->pluck('area')->unique()->values(),
            'summary' => [
                'total' => $cameras->count(),
                'online' => $cameras->where('online', true)->count(),
                'recording' => $cameras->where('online', true)->where('recording', true)->count(),
            ],
            'cameras' => $shown->map(fn (Camera $c) => $c->only(['id', 'code', 'name', 'floor', 'area', 'stream_url', 'online', 'recording'])),
            'selected' => $selected?->code,
            'events' => CameraEvent::with('camera')->whereDate('occurred_at', today())->latest('occurred_at')->limit(30)->get()
                ->map(fn (CameraEvent $e) => [
                    'id' => $e->id,
                    'time' => $e->occurred_at->format('H.i'),
                    'camera' => $e->camera->code,
                    'where' => $e->camera->name,
                    'kind' => $e->kind,
                    'description' => $e->description,
                ]),
            'kinds' => CameraEvent::KINDS,
            'canConfigure' => $request->user()->isAdmin(),
            'cameraAreas' => Camera::AREAS,
        ]);
    }

    public function update(Request $request, Camera $camera): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $camera->update($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'floor' => ['required', 'integer', 'between:1,10'],
            'area' => ['required', Rule::in(Camera::AREAS)],
            'stream_url' => ['nullable', 'url:http,https', 'max:500'],
        ], [], ['name' => 'lokasi', 'floor' => 'lantai', 'area' => 'area', 'stream_url' => 'URL stream']));

        return back()->with('success', "Pengaturan {$camera->code} disimpan.");
    }

    public function toggleRecording(Request $request, Camera $camera): RedirectResponse
    {
        abort_unless($camera->online, 409);

        $camera->update(['recording' => ! $camera->recording]);
        $this->log($camera, 'Info', $camera->recording ? 'Perekaman dimulai dari portal staf' : 'Perekaman dihentikan dari portal staf', $request);

        return back()->with('success', $camera->recording ? "{$camera->code} mulai merekam." : "Perekaman {$camera->code} dihentikan.");
    }

    public function toggleOnline(Request $request, Camera $camera): RedirectResponse
    {
        $camera->update(['online' => ! $camera->online]);
        $this->log($camera, $camera->online ? 'Info' : 'Offline', $camera->online ? 'Kamera tersambung ulang ke NVR' : 'Kamera ditandai terputus dari NVR', $request);

        return back()->with('success', $camera->online ? "{$camera->code} tersambung." : "{$camera->code} ditandai offline.");
    }

    public function storeEvent(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'camera_id' => ['required', 'exists:cameras,id'],
            'kind' => ['required', Rule::in(CameraEvent::KINDS)],
            'description' => ['required', 'string', 'max:255'],
        ], [], ['camera_id' => 'kamera', 'kind' => 'jenis', 'description' => 'keterangan']);

        CameraEvent::create([...$data, 'occurred_at' => now(), 'recorded_by' => $request->user()->id]);

        return back()->with('success', 'Kejadian dicatat.');
    }

    private function log(Camera $camera, string $kind, string $description, Request $request): void
    {
        $camera->events()->create(['occurred_at' => now(), 'kind' => $kind, 'description' => $description, 'recorded_by' => $request->user()->id]);
    }
}
