<?php

namespace App\Http\Controllers\Pemustaka;

use App\Http\Controllers\Controller;
use App\Services\TitleCheck;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Cek judul skripsi": earlier works in the repository with a similar
 * title or theme.
 */
class TitleCheckController extends Controller
{
    use Concerns;

    public function __invoke(Request $request, TitleCheck $check): Response
    {
        $this->member($request);
        $q = mb_substr($request->string('q')->trim()->toString(), 0, 300);

        return Inertia::render('pemustaka/cek-judul', [
            'q' => $q,
            'result' => $q === '' ? null : $check->run($q),
            'samples' => ['Evaluasi PTSL di Kabupaten Sleman', 'Konflik agraria perkebunan sawit', 'Pemetaan batas desa dengan drone'],
        ]);
    }
}
