<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Services\Reports;
use App\Support\CsvExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ReportController extends Controller
{
    public function __construct(private Reports $reports) {}

    public function index(Request $request): Response
    {
        [$report, $period] = $this->choice($request);

        return Inertia::render('staf/laporan', [
            'reports' => collect(Reports::REPORTS)->map(fn ($r, $key) => ['key' => $key, 'icon' => $r[0], 'name' => $r[1], 'description' => $r[2]])->values(),
            'periods' => collect(Reports::PERIODS)->map(fn ($label, $key) => ['value' => $key, 'label' => $label])->values(),
            'report' => $report,
            'period' => $period,
            'data' => $this->reports->build($report, $period),
        ]);
    }

    public function download(Request $request, string $format): HttpResponse
    {
        abort_unless(in_array($format, ['csv', 'pdf'], true), 404);
        [$report, $period] = $this->choice($request);
        $data = $this->reports->build($report, $period);
        $name = str($data['title'])->slug().'-'.str($data['period'])->slug();

        if ($format === 'csv') {
            return CsvExport::download($name, $data['columns'], $data['rows']);
        }

        return Pdf::loadView('pdf.laporan', [
            ...$data,
            'logo' => public_path('images/logo-stpn.png'),
            'head' => Employee::where('is_head', true)->first(),
        ])->setPaper('a4', count($data['columns']) > 6 ? 'landscape' : 'portrait')->download("{$name}.pdf");
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function choice(Request $request): array
    {
        $report = array_key_exists($request->query('laporan'), Reports::REPORTS) ? $request->query('laporan') : 'kunjungan';
        $period = array_key_exists($request->query('periode'), Reports::PERIODS) ? $request->query('periode') : 'bulan-ini';

        return [$report, $period];
    }
}
