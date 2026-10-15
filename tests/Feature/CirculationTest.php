<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Loan;
use App\Models\Member;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\User;
use App\Support\LibrarySettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CirculationTest extends TestCase
{
    use RefreshDatabase;

    private Member $member;

    private Book $book;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-15 09:00:00');

        $this->book = Book::create([
            'type' => Book::PRINTED, 'title' => 'Hukum Agraria Indonesia',
            'author_id' => Author::idForName('Boedi Harsono'), 'publisher_id' => Publisher::idForName('Djambatan'),
            'ddc_class' => '300', 'collection_type' => 'Buku teks', 'call_number' => '346.04 HAR h',
            'rack_id' => Rack::create(['code' => 'B3', 'name' => 'Hukum', 'floor' => 1])->id,
        ]);
        $this->book->syncCopyCount(5);

        $this->member = Member::create(['member_number' => '20220145', 'name' => 'Rizky Maulana', 'type' => 'Mahasiswa', 'study_program' => 'D4 Pertanahan']);

        $this->actingAs(User::factory()->pustakawan()->create());
    }

    private function code(int $n): string
    {
        return sprintf('B%04d-%d', $this->book->id, $n);
    }

    public function test_lending_marks_copies_loaned_with_the_configured_due_date()
    {
        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(1), $this->code(2)]])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $this->assertSame(2, Loan::open()->count());
        $this->assertSame('2026-10-22', Loan::first()->due_at->toDateString());
        $this->assertSame(BookCopy::LOANED, BookCopy::where('code', $this->code(1))->value('status'));
    }

    public function test_member_cannot_exceed_the_loan_limit()
    {
        LibrarySettings::save(['max_loans' => 2]);

        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(1), $this->code(2), $this->code(3)]])
            ->assertSessionHasErrors('codes');

        $this->assertSame(0, Loan::count());
        $this->assertSame(5, BookCopy::where('status', BookCopy::AVAILABLE)->count());
    }

    public function test_copy_check_explains_why_a_copy_cannot_be_lent()
    {
        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(1)]]);

        $this->getJson(route('staf.sirkulasi.check', ['member_id' => $this->member->id, 'code' => strtolower($this->code(1))]))
            ->assertStatus(422)->assertJson(['error' => 'Eksemplar ini sudah tercatat dipinjam.']);
        $this->getJson(route('staf.sirkulasi.check', ['member_id' => $this->member->id, 'code' => 'B9999-1']))
            ->assertStatus(422)->assertJson(['error' => 'Barcode tidak dikenali.']);
        $this->getJson(route('staf.sirkulasi.check', ['member_id' => $this->member->id, 'code' => $this->code(2), 'cart' => [$this->code(2)]]))
            ->assertStatus(422);
        $this->getJson(route('staf.sirkulasi.check', ['member_id' => $this->member->id, 'code' => $this->code(2)]))
            ->assertOk()->assertJson(['code' => $this->code(2), 'title' => 'Hukum Agraria Indonesia']);
    }

    public function test_members_with_overdue_loans_or_blocked_status_cannot_borrow()
    {
        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(1)]]);
        Carbon::setTestNow('2026-10-30 09:00:00');

        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(2)]])->assertSessionHasErrors('member');

        $blocked = Member::create(['member_number' => '1', 'name' => 'X', 'type' => 'Umum', 'status' => 'Diblokir']);
        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $blocked->id, 'codes' => [$this->code(3)]])->assertSessionHasErrors('member');
    }

    public function test_late_return_records_a_fine_and_frees_the_copy()
    {
        LibrarySettings::save(['fine_per_day' => 1000]);
        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(1)]]);
        $loan = Loan::sole();

        Carbon::setTestNow('2026-10-25 15:00:00'); // due 22 Oct, 3 days late

        $this->get('/staf/sirkulasi?tab=kembali&kode='.$this->code(1))
            ->assertInertia(fn (Assert $page) => $page->where('returning.fine', 3000)->where('returning.days_left', -3));

        $this->post("/staf/sirkulasi/kembali/{$loan->id}", ['damaged' => false])->assertSessionHas('success');

        $loan->refresh();
        $this->assertSame(3000, $loan->fine_amount);
        $this->assertNotNull($loan->returned_at);
        $this->assertSame(BookCopy::AVAILABLE, $loan->copy->status);
    }

    public function test_damaged_returns_send_the_copy_to_repair()
    {
        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(1)]]);

        $this->post('/staf/sirkulasi/kembali/'.Loan::sole()->id, ['damaged' => true]);

        $this->assertSame(BookCopy::REPAIR, BookCopy::where('code', $this->code(1))->value('status'));
        $this->assertSame(0, Loan::sole()->fine_amount);
    }

    public function test_extension_respects_the_limit_and_refuses_late_loans()
    {
        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(1), $this->code(2)]]);
        [$first, $second] = Loan::orderBy('id')->get();

        $this->post("/staf/sirkulasi/perpanjang/{$first->id}")->assertSessionHasNoErrors();
        $this->assertSame('2026-10-29', $first->fresh()->due_at->toDateString());

        $this->post("/staf/sirkulasi/perpanjang/{$first->id}")->assertSessionHasErrors('loan');

        Carbon::setTestNow('2026-10-23 09:00:00');
        $this->post("/staf/sirkulasi/perpanjang/{$second->id}")->assertSessionHasErrors('loan');
    }

    public function test_active_loans_tab_lists_open_loans_with_their_status()
    {
        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(1)]]);

        $this->get('/staf/sirkulasi?tab=aktif&q=rizky')->assertInertia(fn (Assert $page) => $page
            ->component('staf/sirkulasi')
            ->where('counts.open', 1)
            ->where('loans.data.0.code', $this->code(1))
            ->where('loans.data.0.days_left', 7)
            ->where('loans.data.0.extend_problem', null));
    }

    public function test_sidebar_counts_overdue_loans()
    {
        $this->post('/staf/sirkulasi/pinjam', ['member_id' => $this->member->id, 'codes' => [$this->code(1)]]);
        Carbon::setTestNow('2026-11-01');

        $this->get('/staf')->assertInertia(fn (Assert $page) => $page->where('stafMenu.2.items.1.key', 'sirkulasi')->where('stafMenu.2.items.1.badge', 1));
    }

    public function test_settings_are_admin_only_and_validated()
    {
        $this->put('/staf/pengaturan', [])->assertForbidden();

        $this->actingAs(User::factory()->admin()->create());
        $this->put('/staf/pengaturan', ['loan_days' => 0, 'max_loans' => 3, 'max_extensions' => 1, 'fine_per_day' => 500])
            ->assertSessionHasErrors('loan_days');
        $this->put('/staf/pengaturan', ['loan_days' => 14, 'max_loans' => 3, 'max_extensions' => 1, 'fine_per_day' => 0, 'clearance_hardcopy' => false])
            ->assertSessionHasNoErrors();

        $this->assertSame(14, LibrarySettings::get('loan_days'));
        $this->assertFalse(LibrarySettings::get('clearance_hardcopy'));
    }
}
