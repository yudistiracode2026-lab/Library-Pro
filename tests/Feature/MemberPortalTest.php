<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\ClearanceRequest;
use App\Models\CollectionSuggestion;
use App\Models\EbookLoan;
use App\Models\Loan;
use App\Models\Member;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\Thesis;
use App\Models\User;
use App\Models\Visit;
use App\Support\KioskToken;
use App\Support\LibrarySettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MemberPortalTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Member $member;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        $this->user = User::factory()->create(['email' => 'annisa@stpn.ac.id']);
        $this->member = Member::create([
            'member_number' => '20220311', 'name' => 'Annisa Putri Lestari', 'type' => 'Mahasiswa',
            'study_program' => 'D4 Pertanahan', 'user_id' => $this->user->id,
        ]);
    }

    private function ebook(int $licences = 1): Book
    {
        Storage::disk('local')->put('ebook/a.pdf', '%PDF-1.4 contoh');

        return Book::create([
            'type' => Book::EBOOK, 'title' => 'Analisis Spasial dengan QGIS', 'author_id' => Author::idForName('Arif Rahman'),
            'publisher_id' => Publisher::idForName('Informatika'), 'year' => 2024, 'ddc_class' => '000', 'collection_type' => 'Buku teks',
            'format' => 'PDF', 'license_count' => $licences, 'status' => 'Terbit', 'file_path' => 'ebook/a.pdf',
        ]);
    }

    private function thesis(): Thesis
    {
        Storage::disk('local')->put('repositori/a.pdf', '%PDF-1.4 contoh');

        return Thesis::create([
            'type' => 'Skripsi', 'title' => 'Evaluasi Pelaksanaan PTSL di Kabupaten Kulon Progo', 'author' => 'Fajar Nugroho',
            'study_program' => 'D4 Pertanahan', 'year' => 2025, 'keywords' => 'PTSL; Pendaftaran tanah', 'file_path' => 'repositori/a.pdf',
        ]);
    }

    public function test_members_sign_in_with_their_nim()
    {
        $this->post('/login', ['email' => '20220311', 'password' => 'password'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($this->user);
        $this->get('/dashboard')->assertRedirect('/pemustaka');
    }

    public function test_every_page_renders_and_staff_are_kept_out()
    {
        $this->actingAs(User::factory()->pustakawan()->create())->get('/pemustaka')->assertForbidden();

        $this->actingAs($this->user);
        foreach (['/pemustaka' => 'beranda', '/pemustaka/cari' => 'cari', '/pemustaka/pinjaman' => 'pinjaman', '/pemustaka/cek-judul' => 'cek-judul',
            '/pemustaka/bebas-pustaka' => 'bebas-pustaka', '/pemustaka/usulan' => 'usulan', '/pemustaka/baca' => 'baca'] as $url => $page) {
            $this->get($url)->assertInertia(fn (Assert $p) => $p->component("pemustaka/{$page}"));
        }
    }

    public function test_members_extend_only_their_own_loans()
    {
        $rack = Rack::create(['code' => 'B3', 'name' => 'Hukum', 'floor' => 1]);
        $book = Book::create([
            'type' => Book::PRINTED, 'title' => 'Hukum Agraria Indonesia', 'author_id' => Author::idForName('Boedi Harsono'),
            'publisher_id' => Publisher::idForName('Djambatan'), 'ddc_class' => '300', 'collection_type' => 'Buku teks', 'rack_id' => $rack->id,
        ]);
        $book->syncCopyCount(2);
        [$a, $b] = $book->copies()->get()->all();
        $other = Member::create(['member_number' => '1', 'name' => 'Rizky', 'type' => 'Mahasiswa']);
        $mine = Loan::create(['book_copy_id' => $a->id, 'member_id' => $this->member->id, 'loaned_at' => now(), 'due_at' => today()->addDays(3)]);
        $theirs = Loan::create(['book_copy_id' => $b->id, 'member_id' => $other->id, 'loaned_at' => now(), 'due_at' => today()->addDays(3)]);
        $a->update(['status' => BookCopy::LOANED]);

        $this->actingAs($this->user);
        $this->get('/pemustaka')->assertInertia(fn (Assert $p) => $p->where('stats.loans', 1)->where('loans.0.title', 'Hukum Agraria Indonesia'));
        $this->post("/pemustaka/pinjaman/{$theirs->id}/perpanjang")->assertForbidden();
        $this->post("/pemustaka/pinjaman/{$mine->id}/perpanjang")->assertSessionHas('success');
        $this->assertSame(1, $mine->fresh()->extensions);
        $this->post("/pemustaka/pinjaman/{$mine->id}/perpanjang")->assertSessionHas('error');

        $this->get("/pemustaka/cari?buku={$book->id}")->assertInertia(fn (Assert $p) => $p->where('selected.rack.code', 'B3')->where('selected.available', 1));
    }

    public function test_ebooks_respect_licences_and_the_loan_limit()
    {
        $book = $this->ebook(licences: 1);
        $rival = Member::create(['member_number' => '2', 'name' => 'Siti', 'type' => 'Mahasiswa']);
        $held = EbookLoan::create(['book_id' => $book->id, 'member_id' => $rival->id, 'borrowed_at' => now(), 'due_at' => now()->addDays(3)]);

        $this->actingAs($this->user);
        $this->post("/pemustaka/ebook/{$book->id}/pinjam")->assertSessionHas('error');

        $held->update(['returned_at' => now()]);
        $this->post("/pemustaka/ebook/{$book->id}/pinjam")->assertRedirect('/pemustaka/pinjaman');
        $loan = $this->member->ebookLoans()->sole();
        $this->get("/pemustaka/ebook/{$loan->id}/berkas")->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->patchJson("/pemustaka/ebook/{$loan->id}/halaman", ['page' => 4])->assertNoContent();
        $this->assertSame(4, $loan->fresh()->last_page);

        // A second borrower cannot read someone else's copy.
        $this->actingAs(User::factory()->create());
        Member::create(['member_number' => '3', 'name' => 'Lain', 'type' => 'Mahasiswa', 'user_id' => auth()->id()]);
        $this->get("/pemustaka/ebook/{$loan->id}/berkas")->assertForbidden();

        $this->actingAs($this->user);
        $this->post("/pemustaka/ebook/{$loan->id}/kembalikan")->assertSessionHas('success');
        $this->get("/pemustaka/ebook/{$loan->id}/berkas")->assertForbidden();
    }

    public function test_title_check_ranks_similar_theses()
    {
        $this->thesis();
        Thesis::create(['type' => 'Skripsi', 'title' => 'Konflik Agraria Perkebunan di Kabupaten Jember', 'author' => 'X', 'year' => 2022, 'keywords' => 'Sengketa & konflik']);

        $this->actingAs($this->user);
        $this->get('/pemustaka/cek-judul?q='.urlencode('Evaluasi PTSL di Kabupaten Sleman'))->assertInertia(fn (Assert $p) => $p
            ->where('result.keywords', ['evaluasi', 'ptsl', 'sleman'])
            ->has('result.results', 1)
            ->where('result.results.0.title', 'Evaluasi Pelaksanaan PTSL di Kabupaten Kulon Progo')
            ->where('result.results.0.pct', 60));
    }

    public function test_members_propose_and_back_suggestions()
    {
        $this->actingAs($this->user);
        $this->post('/pemustaka/usulan', ['title' => 'QGIS untuk Pemula', 'author' => 'Agus Purwanto'])->assertSessionHas('success');
        $own = CollectionSuggestion::sole();
        $this->assertSame(1, $own->votes);

        $other = CollectionSuggestion::create(['title' => 'Drone Mapping', 'author' => 'P. van der Molen', 'votes' => 14, 'status' => CollectionSuggestion::PROPOSED]);
        $this->post("/pemustaka/usulan/{$other->id}/dukung");
        $this->assertSame(15, $other->fresh()->votes);
        $this->post("/pemustaka/usulan/{$other->id}/dukung");
        $this->assertSame(14, $other->fresh()->votes);
    }

    public function test_clearance_from_the_student_side()
    {
        $this->actingAs($this->user);

        $this->post('/pemustaka/bebas-pustaka/sumbangan', ['title' => 'Buku', 'author' => 'A', 'publisher' => 'B', 'year' => now()->year - 9, 'copies' => 1])
            ->assertSessionHasErrors('year');
        $this->post('/pemustaka/bebas-pustaka/sumbangan', ['title' => 'Reforma Agraria', 'author' => 'Maria S.W. Sumardjono', 'publisher' => 'Kompas', 'year' => now()->year - 1, 'copies' => 1])
            ->assertSessionHas('success');

        $clearance = $this->member->clearanceRequests()->sole();
        $this->assertSame(ClearanceRequest::PENDING, $clearance->status);
        $this->assertSame('Menunggu', $clearance->donation_status);

        $this->post('/pemustaka/bebas-pustaka/hardcopy', ['date' => today()->addDay()->toDateString()])->assertStatus(409);
        $this->post('/pemustaka/bebas-pustaka/skripsi', ['title' => 'Redistribusi TORA', 'advisor' => 'Dr. Sutaryono', 'file' => UploadedFile::fake()->create('s.pdf', 100, 'application/pdf')])
            ->assertSessionHasErrors('agree');
        $this->post('/pemustaka/bebas-pustaka/skripsi', [
            'title' => 'Redistribusi TORA', 'advisor' => 'Dr. Sutaryono', 'abstract' => 'Abstrak', 'agree' => '1',
            'file' => UploadedFile::fake()->create('s.pdf', 100, 'application/pdf'),
        ])->assertSessionHas('success');
        Storage::disk('local')->assertExists($clearance->fresh()->thesis_file);

        $clearance->update(['thesis_verified_at' => now()]);
        $this->post('/pemustaka/bebas-pustaka/hardcopy', ['date' => today()->addDay()->toDateString()])->assertSessionHas('success');
        $this->get('/pemustaka/bebas-pustaka/surat')->assertNotFound();

        // Approval by the staff adds the thesis to the repository.
        $clearance->update(['donation_status' => 'Diterima', 'hardcopy_received_at' => now()]);
        $this->actingAs(User::factory()->pustakawan()->create())->post("/staf/bebas-pustaka/{$clearance->id}/setujui")->assertSessionHas('success');
        $this->assertSame('Redistribusi TORA', Thesis::sole()->title);

        $this->actingAs($this->user)->get('/pemustaka/bebas-pustaka/surat')->assertOk()->assertHeader('content-type', 'application/pdf');
    }

    public function test_full_text_needs_the_library_network_and_a_check_in()
    {
        $thesis = $this->thesis();
        $this->actingAs($this->user);

        // On the library network (tests come from 127.0.0.1) but not checked in.
        $this->post("/pemustaka/baca/{$thesis->id}/mulai")->assertSessionHas('error');

        Visit::create(['member_id' => $this->member->id, 'purpose' => 'Membaca', 'method' => 'QR', 'checked_in_at' => now()]);
        $this->post("/pemustaka/baca/{$thesis->id}/mulai")->assertRedirect();
        $session = $this->member->readingSessions()->sole();
        $this->get("/pemustaka/baca?jenis=Skripsi&sesi={$session->id}")->assertInertia(fn (Assert $p) => $p->where('gate.open', true)->where('reader.sessionId', $session->id));
        $this->get("/pemustaka/baca/sesi/{$session->id}/berkas")->assertOk();

        // Off the library network the file closes again.
        LibrarySettings::save(['onsite_networks' => '10.99.0.0/16']);
        $this->get("/pemustaka/baca/sesi/{$session->id}/berkas")->assertForbidden();

        LibrarySettings::save(['onsite_networks' => '127.0.0.1/32']);
        $this->post("/pemustaka/baca/sesi/{$session->id}/selesai")->assertSessionHas('success');
        $this->get("/pemustaka/baca/sesi/{$session->id}/berkas")->assertForbidden();
        $this->get('/pemustaka/baca?jenis=riwayat')->assertInertia(fn (Assert $p) => $p->has('history', 1));
    }

    public function test_the_scanner_checks_in_with_the_kiosk_code()
    {
        $this->actingAs($this->user);
        $this->post('/presensi', ['purpose' => 'Membaca', 't' => 'salah'])->assertSessionHas('error');
        $this->post('/presensi', ['purpose' => 'Membaca', 't' => KioskToken::current()])->assertSessionHas('success');
        $this->assertTrue($this->member->visits()->today()->inside()->exists());
    }

    public function test_library_networks_are_validated()
    {
        $this->actingAs(User::factory()->admin()->create());
        $settings = LibrarySettings::all();

        $this->put('/staf/pengaturan', [...$settings, 'onsite_networks' => 'kampus'])->assertSessionHasErrors('onsite_networks');
        $this->put('/staf/pengaturan', [...$settings, 'onsite_networks' => '192.168.10.0/24, 10.0.0.0/8'])->assertSessionHasNoErrors();
        $this->assertSame('192.168.10.0/24, 10.0.0.0/8', LibrarySettings::get('onsite_networks'));
    }
}
