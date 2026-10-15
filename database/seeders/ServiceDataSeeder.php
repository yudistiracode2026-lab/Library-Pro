<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\ClearanceRequest;
use App\Models\Loan;
use App\Models\Member;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\Visit;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Sample loans, today's visits, and bebas pustaka requests from the
 * prototype (design/Portal Staf.dc.html), with dates relative to today.
 */
class ServiceDataSeeder extends Seeder
{
    /** copy code, member number, loaned days ago, due in days, extensions */
    private const LOANS = [
        ['B0001-2', '20220145', 10, -3, 0],
        ['B0003-1', '20220311', 5, 2, 0],
        ['B0007-1', '20220402', 7, 0, 0],
        ['B0018-1', '20210190', 12, -5, 1],
        ['B0004-1', '20220311', 2, 5, 0],
        ['B0022-1', '20220402', 6, 1, 0],
        ['B0016-3', '20220311', 7, 0, 0],
        ['B0002-4', '20220402', 3, 4, 0],
    ];

    public function run(): void
    {
        $this->loans();
        $this->visits();
        $this->clearances();
    }

    private function loans(): void
    {
        foreach (self::LOANS as [$code, $number, $ago, $dueIn, $ext]) {
            $copy = BookCopy::where('code', $code)->firstOrFail();
            $copy->update(['status' => BookCopy::LOANED]);

            Loan::create([
                'book_copy_id' => $copy->id,
                'member_id' => Member::where('member_number', $number)->value('id'),
                'loaned_at' => today()->subDays($ago)->setTime(9, 15),
                'due_at' => today()->addDays($dueIn),
                'extensions' => $ext,
            ]);
        }
    }

    private function visits(): void
    {
        $member = fn (string $number) => Member::where('member_number', $number)->value('id');
        $at = fn (string $hm) => today()->setTimeFromTimeString($hm);

        foreach ([
            [$member('20220311'), null, null, '07:58', null, 'Membaca', 'QR'],
            [$member('197203152'), null, null, '08:40', '09:32', 'Layanan referensi', 'QR'],
            [null, 'Puji Astuti', 'BPN Kab. Bantul', '09:05', null, 'Membaca', 'Tamu'],
            [$member('20210233'), null, null, '09:21', null, 'Mengerjakan tugas', 'QR'],
            [$member('20220402'), null, null, '08:05', '08:50', 'Pinjam / kembali', 'QR'],
        ] as [$memberId, $guest, $org, $in, $out, $purpose, $method]) {
            Visit::create([
                'member_id' => $memberId,
                'guest_name' => $guest,
                'guest_org' => $org,
                'purpose' => $purpose,
                'method' => $method,
                'checked_in_at' => $at($in),
                'checked_out_at' => $out ? $at($out) : null,
            ]);
        }
    }

    private function clearances(): void
    {
        $fajar = $this->request('20210233', 'Evaluasi PTSL Berbasis Partisipasi Masyarakat di Kabupaten Kulon Progo', 2, [
            'donation_title' => 'Hukum Agraria Nasional: Teori dan Praktik', 'donation_author' => 'Urip Santoso',
            'donation_publisher' => 'Kencana', 'donation_year' => now()->year - 3, 'donation_isbn' => '978-623-218-111-0',
            'hardcopy_scheduled_at' => today()->addDay()->setTime(10, 0),
        ]);
        $this->acceptDonation($fajar, '300', '346.04 SAN h', 'B3');

        $this->request('20210088', 'Pemetaan Partisipatif Batas Desa di Kabupaten Gunungkidul', 1, [
            'thesis_checks' => array_fill_keys(array_keys(ClearanceRequest::THESIS_CHECKS), true),
            'thesis_verified_at' => now()->subDay(),
            'donation_title' => 'Kartografi Digital untuk Pemetaan Desa', 'donation_author' => 'Bambang Riadi',
            'donation_publisher' => 'Andi', 'donation_year' => now()->year - 2, 'donation_isbn' => '978-623-01-2345-6',
            'hardcopy_scheduled_at' => today()->setTime(13, 30),
        ]);

        $this->request('20210190', 'Penyelesaian Sengketa Tanah Wakaf melalui Mediasi', 1, [
            'donation_title' => 'Hukum Perwakafan di Indonesia', 'donation_author' => 'Rachmadi Usman',
            'donation_publisher' => 'Sinar Grafika', 'donation_year' => now()->year - 4, 'donation_isbn' => '978-979-007-555-1',
            'hardcopy_scheduled_at' => today()->addDays(2)->setTime(9, 0),
        ]);

        $this->request('20220145', 'Analisis Konflik Tanah Ulayat di Sumatera Barat', 0, [
            'thesis_file' => null,
            'donation_title' => 'Laskar Pelangi', 'donation_author' => 'Andrea Hirata', 'donation_publisher' => 'Bentang Pustaka',
            'donation_year' => 2008, 'donation_isbn' => '978-979-3062-79-1', 'donation_status' => 'Ditolak',
            'note' => 'Terbitan lebih dari 5 tahun dan judul sudah ada di koleksi.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function request(string $number, string $title, int $daysAgo, array $attributes): ClearanceRequest
    {
        $member = Member::where('member_number', $number)->firstOrFail();
        $file = array_key_exists('thesis_file', $attributes) ? $attributes['thesis_file'] : $this->thesisPdf($member, $title);

        return ClearanceRequest::create([
            'member_id' => $member->id,
            'thesis_title' => $title,
            'submitted_at' => today()->subDays($daysAgo)->setTime(10, 20),
            'donation_status' => 'Menunggu',
            ...$attributes,
            'thesis_file' => $file,
        ]);
    }

    private function acceptDonation(ClearanceRequest $request, string $ddc, string $call, string $rack): void
    {
        $book = Book::create([
            'type' => Book::PRINTED,
            'title' => $request->donation_title,
            'author_id' => Author::idForName($request->donation_author),
            'publisher_id' => Publisher::idForName($request->donation_publisher),
            'year' => $request->donation_year,
            'isbn' => $request->donation_isbn,
            'ddc_class' => $ddc,
            'collection_type' => 'Buku teks',
            'acquisition' => 'Sumbangan mahasiswa',
            'donor' => $request->member->name,
            'call_number' => $call,
            'rack_id' => Rack::where('code', $rack)->value('id'),
        ]);
        $book->syncCopyCount(1);

        $request->update(['donation_status' => 'Diterima', 'donation_book_id' => $book->id]);
    }

    private function thesisPdf(Member $member, string $title): string
    {
        $first = strtolower(preg_replace('/[^a-z]/i', '', explode(' ', $member->name)[0]));
        $path = "skripsi/skripsi_{$member->member_number}_{$first}.pdf";

        Storage::disk('local')->put($path, Pdf::loadView('pdf.contoh-skripsi', [
            'title' => $title,
            'name' => $member->name,
            'nim' => $member->member_number,
            'logo' => public_path('images/logo-stpn.png'),
        ])->setPaper('a4')->output());

        return $path;
    }
}
