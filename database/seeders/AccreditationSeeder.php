<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Evidence;
use App\Models\Indicator;
use App\Models\NewsPost;
use App\Models\User;
use App\Services\Accreditation\Scorer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * The 56 indicators from database/data/indicators.json (taken from the
 * prototype design/Akreditasi.dc.html), sample evidence, and website news.
 *
 * Manual scores and values for indicators the system cannot compute are
 * the prototype's figures and must be verified by the accreditation team.
 */
class AccreditationSeeder extends Seeder
{
    public function run(): void
    {
        $data = json_decode(file_get_contents(database_path('data/indicators.json')), true);
        $staff = Employee::orderBy('id')->pluck('id')->values();
        $head = User::where('email', 'yosep@perpus.test')->value('id');

        foreach ($data as $i => $row) {
            $computed = in_array($row['number'], Scorer::COMPUTED, true);

            $indicator = Indicator::create([
                'number' => $row['number'],
                'component' => (int) explode('.', $row['number'])[0],
                'name' => $row['name'],
                'mode' => $row['mode'],
                'options' => $row['options'],
                'source' => $row['source'],
                'recommendation' => $computed ? null : $row['recommendation'],
                'manual_score' => $computed ? null : $row['score'],
                'manual_value' => $computed ? null : $row['value'],
                'manual_note' => $computed || $row['score'] === null ? null : 'Isian awal dari prototipe, perlu diverifikasi tim akreditasi.',
                'assessed_at' => $computed ? null : now()->subDays(3),
                'pic_employee_id' => $staff[$i % $staff->count()] ?? null,
                'due_date' => $row['score'] !== null && $row['score'] < 4 ? today()->addWeeks(2 + $i % 6) : null,
                'position' => $i + 1,
            ]);

            foreach ($row['evidence'] as $k => $label) {
                // Roughly a third approved, a third drafted, a third still missing.
                $state = ($i + $k) % 3;
                $file = $state === 2 ? null : $this->samplePdf($indicator, $label);

                Evidence::create([
                    'indicator_id' => $indicator->id,
                    'label' => $label,
                    'file_path' => $file,
                    'original_name' => $file ? basename($file) : null,
                    'size' => $file ? Storage::disk('local')->size($file) : null,
                    'status' => [Evidence::APPROVED, Evidence::DRAFT, Evidence::MISSING][$state],
                    'uploaded_at' => $file ? now()->subDays(10 - $k) : null,
                    'approved_by' => $state === 0 ? $head : null,
                    'approved_at' => $state === 0 ? now()->subDays(5) : null,
                ]);
            }
        }

        foreach ([
            ['Pengumuman', 13, 'Batas pengajuan bebas pustaka wisuda periode Oktober', 'Pengajuan dibuka hingga 20 Oktober melalui portal pemustaka. Pastikan tidak ada pinjaman aktif.'],
            ['Koleksi baru', 20, '84 judul baru bidang survei dan pemetaan', 'Termasuk buku GNSS, fotogrametri drone, dan analisis spasial berbasis Python.'],
            ['Kegiatan', 27, 'Kelas literasi informasi untuk mahasiswa baru', 'Belajar menelusur e-jurnal dan mengelola sitasi dengan Zotero, setiap Rabu.'],
        ] as [$tag, $daysAgo, $title, $excerpt]) {
            NewsPost::create(['tag' => $tag, 'title' => $title, 'excerpt' => $excerpt, 'published_at' => now()->subDays($daysAgo)]);
        }

        NewsPost::create(['tag' => 'Pengumuman', 'title' => 'Libur layanan Maulid Nabi', 'excerpt' => 'Layanan tutup sehari; repositori daring tetap bisa diakses.']);
    }

    private function samplePdf(Indicator $indicator, string $label): string
    {
        $path = 'bukti/ik-'.str_replace('.', '-', $indicator->number).'-'.str($label)->slug().'.pdf';

        Storage::disk('local')->put($path, Pdf::loadView('pdf.contoh-bukti', [
            'number' => $indicator->number,
            'indicator' => $indicator->name,
            'label' => $label,
        ])->output());

        return $path;
    }
}
