<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\ClearanceRequest;
use App\Models\Employee;
use App\Models\Loan;
use App\Models\Member;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\User;
use App\Support\LibrarySettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClearanceTest extends TestCase
{
    use RefreshDatabase;

    private ClearanceRequest $request;

    private Rack $rack;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Storage::disk('local')->put('skripsi/fajar.pdf', '%PDF-1.4 contoh');

        $this->rack = Rack::create(['code' => 'B3', 'name' => 'Hukum', 'floor' => 1]);
        $member = Member::create(['member_number' => '20210233', 'name' => 'Fajar Nugroho', 'type' => 'Mahasiswa', 'study_program' => 'D4 Pertanahan']);

        $this->request = ClearanceRequest::create([
            'member_id' => $member->id,
            'thesis_title' => 'Evaluasi PTSL Berbasis Partisipasi Masyarakat',
            'submitted_at' => now(),
            'thesis_file' => 'skripsi/fajar.pdf',
            'donation_title' => 'Hukum Agraria Nasional', 'donation_author' => 'Urip Santoso', 'donation_publisher' => 'Kencana',
            'donation_year' => now()->year - 1, 'donation_copies' => 2, 'donation_status' => 'Menunggu',
        ]);

        $this->actingAs(User::factory()->pustakawan()->create());
    }

    private function url(string $suffix = ''): string
    {
        return "/staf/bebas-pustaka/{$this->request->id}{$suffix}";
    }

    private function completeAllRequirements(): void
    {
        foreach (array_keys(ClearanceRequest::THESIS_CHECKS) as $key) {
            $this->post($this->url('/cek-berkas'), ['key' => $key]);
        }
        $this->post($this->url('/acc-skripsi'));
        $this->post($this->url('/sumbangan/terima'), ['ddc_class' => '300', 'call_number' => '346.04 SAN h', 'rack_id' => $this->rack->id]);
        $this->post($this->url('/hardcopy'));
    }

    public function test_thesis_needs_every_check_before_acc()
    {
        $this->post($this->url('/acc-skripsi'))->assertSessionHas('error');

        foreach (array_keys(ClearanceRequest::THESIS_CHECKS) as $key) {
            $this->post($this->url('/cek-berkas'), ['key' => $key]);
        }

        $this->post($this->url('/acc-skripsi'))->assertSessionHas('success');
        $this->assertNotNull($this->request->fresh()->thesis_verified_at);
    }

    public function test_hardcopy_is_locked_until_the_thesis_is_accepted()
    {
        $this->post($this->url('/hardcopy'))->assertSessionHas('error');
        $this->assertNull($this->request->fresh()->hardcopy_received_at);
    }

    public function test_accepting_a_donation_adds_it_to_the_collection()
    {
        $this->post($this->url('/sumbangan/terima'), ['ddc_class' => '300', 'call_number' => '346.04 SAN h', 'rack_id' => $this->rack->id])
            ->assertSessionHas('success');

        $book = $this->request->fresh()->donationBook;
        $this->assertSame('Sumbangan mahasiswa', $book->acquisition);
        $this->assertSame('Fajar Nugroho', $book->donor);
        $this->assertSame(2, $book->copies()->count());
    }

    public function test_open_loans_block_approval()
    {
        $this->completeAllRequirements();

        $copy = BookCopy::first();
        Loan::create(['book_copy_id' => $copy->id, 'member_id' => $this->request->member_id, 'loaned_at' => now(), 'due_at' => today()->addWeek()]);

        $this->post($this->url('/setujui'))->assertSessionHas('error');
        $this->assertSame(ClearanceRequest::PENDING, $this->request->fresh()->status);
    }

    public function test_approval_issues_a_numbered_letter()
    {
        $this->completeAllRequirements();
        Employee::create(['kind' => 'pustakawan', 'nip' => '196807251991031002', 'name' => 'Yosep Nai Helly', 'golongan' => 'IV/a', 'position' => 'Pustakawan Ahli Madya', 'is_head' => true]);

        $this->post($this->url('/setujui'))->assertSessionHas('success');

        $request = $this->request->fresh();
        $this->assertSame(ClearanceRequest::APPROVED, $request->status);
        $this->assertMatchesRegularExpression('#^001/BP/PERPUS-STPN/[IVX]+/\d{4}$#', $request->letter_number);

        $this->get($this->url('/surat'))->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->post($this->url('/acc-skripsi'))->assertStatus(409);
    }

    public function test_disabled_requirements_are_skipped()
    {
        LibrarySettings::save(['clearance_donation' => false, 'clearance_hardcopy' => false]);

        foreach (array_keys(ClearanceRequest::THESIS_CHECKS) as $key) {
            $this->post($this->url('/cek-berkas'), ['key' => $key]);
        }
        $this->post($this->url('/acc-skripsi'));

        $this->post($this->url('/setujui'))->assertSessionHas('success');
    }

    public function test_sending_back_requires_a_note()
    {
        $this->post($this->url('/kembalikan'))->assertSessionHasErrors('note');
        $this->post($this->url('/kembalikan'), ['note' => 'Lembar pengesahan belum bertanda tangan.'])->assertRedirect('/staf/bebas-pustaka');

        $this->assertSame(ClearanceRequest::RETURNED, $this->request->fresh()->status);
    }

    public function test_detail_page_flags_old_or_duplicate_donations_and_serves_the_pdf()
    {
        $this->request->update(['donation_year' => 2008]);
        Book::create([
            'type' => Book::PRINTED, 'title' => 'Hukum Agraria Nasional', 'author_id' => Author::idForName('A'),
            'publisher_id' => Publisher::idForName('B'), 'ddc_class' => '300', 'collection_type' => 'Buku teks',
        ]);

        $this->get($this->url())->assertInertia(fn (Assert $page) => $page
            ->component('staf/bebas-pustaka/show')
            ->where('request.donation.tooOld', true)
            ->where('request.donation.alreadyInCollection', true)
            ->where('request.requirements.loans.ok', true));

        $this->get($this->url('/skripsi'))->assertOk()->assertHeader('content-type', 'application/pdf');
    }

    public function test_list_is_filtered_by_status()
    {
        $this->get('/staf/bebas-pustaka')->assertInertia(fn (Assert $page) => $page->has('requests.data', 1)->where('counts.Menunggu', 1));
        $this->get('/staf/bebas-pustaka?status=Disetujui')->assertInertia(fn (Assert $page) => $page->has('requests.data', 0));
    }
}
