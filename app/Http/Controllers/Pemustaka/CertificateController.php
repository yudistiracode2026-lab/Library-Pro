<?php

namespace App\Http\Controllers\Pemustaka;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Member;
use App\Models\Visit;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The library's letter stating a cadet is a member who visits and uses the
 * library. A cadet can download it once the desk scanner has recorded them
 * at least once.
 */
class CertificateController extends Controller
{
    use Concerns;

    public const SEMESTERS = [
        1 => 'I (Satu)', 2 => 'II (Dua)', 3 => 'III (Tiga)', 4 => 'IV (Empat)', 5 => 'V (Lima)', 6 => 'VI (Enam)', 7 => 'VII (Tujuh)',
        8 => 'VIII (Delapan)', 9 => 'IX (Sembilan)', 10 => 'X (Sepuluh)', 11 => 'XI (Sebelas)', 12 => 'XII (Dua Belas)',
    ];

    private const ROMAN_MONTHS = [1 => 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

    /** Programme names as written in letters. */
    private const PROGRAMME_NAMES = [
        'D4 Pertanahan' => 'Diploma IV Pertanahan',
        'D1 Pengukuran dan Pemetaan Kadastral' => 'Diploma I Pengukuran dan Pemetaan Kadastral',
    ];

    public function show(Request $request): Response
    {
        $member = $this->member($request);
        $scans = $this->scans($member);

        return Inertia::render('pemustaka/surat-keterangan', [
            'student' => $member->type === 'Mahasiswa',
            'scans' => $scans->count(),
            'lastScan' => $scans->max('checked_in_at')?->translatedFormat('j F Y, H.i'),
            'semesters' => collect(self::SEMESTERS)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
            'programme' => $this->programme($member),
        ]);
    }

    public function download(Request $request): HttpResponse
    {
        $member = $this->member($request);
        abort_unless($member->type === 'Mahasiswa', 403, 'Surat keterangan ini khusus untuk taruna.');
        abort_unless($this->scans($member)->isNotEmpty(), 403, 'Surat bisa diunduh setelah kamu pernah presensi dengan scan QR di meja presensi perpustakaan.');

        $data = $request->validate([
            'semester' => ['required', 'integer', 'between:1,'.count(self::SEMESTERS)],
            'kelas' => ['nullable', 'string', 'max:20'],
        ], [], ['kelas' => 'kelas']);

        $class = trim((string) ($data['kelas'] ?? ''));
        $class = preg_replace('/^kelas\s+/i', '', $class);

        return Pdf::loadView('pdf.surat-keterangan-pemustaka', [
            'member' => $member,
            'semester' => self::SEMESTERS[(int) $data['semester']],
            'kelas' => $this->programme($member).($class !== '' ? ' – Kelas '.$class : ''),
            'nomor' => '/UPA-PERPUS/STPN/'.self::ROMAN_MONTHS[now()->month].'/'.now()->year,
            'date' => now()->translatedFormat('j F Y'),
            'head' => Employee::where('is_head', true)->first(),
            'logo' => public_path('images/logo-stpn.png'),
            // Only the glyphs used are embedded, so the file stays small enough for a phone.
        ])->setOption('enable_font_subsetting', true)->setPaper('a4')->download('surat-keterangan-perpustakaan-'.$member->member_number.'.pdf');
    }

    /** Visits recorded by the desk scanner, not typed in by staff. */
    private function scans(Member $member)
    {
        return $member->visits()->where('method', Visit::METHOD_QR)->get(['checked_in_at']);
    }

    private function programme(Member $member): string
    {
        return self::PROGRAMME_NAMES[$member->study_program] ?? $member->study_program;
    }
}
