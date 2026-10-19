<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\Loan;
use App\Models\Member;
use App\Models\NewsPost;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\User;
use App\Models\Visit;
use App\Support\WebsiteContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WebsiteAndReportsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-15 10:00:00'); // Thursday
        $rack = Rack::create(['code' => 'B3', 'name' => 'Hukum', 'floor' => 1]);

        foreach ([['Hukum Agraria Indonesia', 'Boedi Harsono', '300'], ['Geodesi Satelit', 'Hasanuddin Z. Abidin', '500']] as [$title, $author, $ddc]) {
            Book::create([
                'type' => Book::PRINTED, 'title' => $title, 'author_id' => Author::idForName($author), 'publisher_id' => Publisher::idForName('Andi'),
                'ddc_class' => $ddc, 'collection_type' => 'Buku teks', 'call_number' => "{$ddc} X", 'rack_id' => $rack->id,
            ])->syncCopyCount(2);
        }
    }

    public function test_public_website_searches_the_catalogue()
    {
        $this->get('/?q=abidin')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('website')
            ->where('resultCount', 1)
            ->where('results.0.title', 'Geodesi Satelit')
            ->where('results.0.rack', 'B3')
            ->where('today.open', true));

        $this->get('/?q=geodesi&field=author')->assertInertia(fn (Assert $page) => $page->where('resultCount', 0));
        $this->get('/?kelas=500')->assertInertia(fn (Assert $page) => $page->has('gallery', 1));
    }

    public function test_only_published_news_appears_on_the_website()
    {
        NewsPost::create(['title' => 'Terbit', 'published_at' => now()->subDay()]);
        NewsPost::create(['title' => 'Draf']);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->has('news', 1)->where('news.0.title', 'Terbit'));
    }

    public function test_cms_updates_the_schedule_and_weekly_hours()
    {
        $this->actingAs(User::factory()->pustakawan()->create())->get('/staf/cms')->assertForbidden();
        $this->actingAs(User::factory()->admin()->create());

        $this->put('/staf/cms/konten', [
            'hero_title' => 'Judul baru',
            'hero_subtitle' => 'Sub',
            'schedule' => [
                ['label' => 'Senin – Jumat', 'days' => [1, 2, 3, 4, 5], 'open' => '07:30', 'close' => '18:00', 'break_minutes' => 30, 'note' => ''],
                ['label' => 'Sabtu', 'days' => [6], 'open' => '08:00', 'close' => '07:00', 'break_minutes' => 0, 'note' => ''],
            ],
        ])->assertSessionHasErrors('schedule.1.close');

        $this->put('/staf/cms/konten', [
            'hero_title' => 'Judul baru',
            'hero_subtitle' => 'Sub',
            'schedule' => [
                ['label' => 'Senin – Jumat', 'days' => [1, 2, 3, 4, 5], 'open' => '07:30', 'close' => '18:00', 'break_minutes' => 30, 'note' => ''],
                ['label' => 'Minggu', 'days' => [0, 6], 'open' => null, 'close' => null, 'break_minutes' => 0, 'note' => 'Tutup'],
            ],
        ])->assertSessionHasNoErrors();

        $this->assertSame(50.0, WebsiteContent::weeklyHours());
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('hero.title', 'Judul baru'));
    }

    public function test_news_can_be_drafted_and_published()
    {
        $this->actingAs(User::factory()->admin()->create());

        $this->post('/staf/cms/berita', ['title' => 'Kelas literasi', 'tag' => 'Kegiatan']);
        $post = NewsPost::sole();
        $this->assertNull($post->published_at);

        $this->patch("/staf/cms/berita/{$post->id}", ['published' => true]);
        $this->assertNotNull($post->fresh()->published_at);
    }

    public function test_reports_preview_and_download()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        $member = Member::create(['member_number' => '1', 'name' => 'A', 'type' => 'Mahasiswa']);
        Visit::create(['member_id' => $member->id, 'purpose' => 'Membaca', 'method' => 'QR', 'checked_in_at' => now()]);
        Visit::create(['guest_name' => 'Tamu', 'purpose' => 'Membaca', 'method' => 'Tamu', 'checked_in_at' => now()]);
        Loan::create(['book_copy_id' => Book::first()->copies()->first()->id, 'member_id' => $member->id, 'loaned_at' => now(), 'due_at' => today()->addWeek()]);

        $this->get('/staf/laporan')->assertInertia(fn (Assert $page) => $page
            ->where('data.title', 'Rekap kunjungan')
            ->where('data.rows.0.1', 2)
            ->where('data.rows.0.3', 1));

        $this->get('/staf/laporan?laporan=populer&periode=tahun')->assertInertia(fn (Assert $page) => $page->where('data.rows.0.1', 'Hukum Agraria Indonesia'));
        $this->get('/staf/laporan?laporan=sirkulasi')->assertInertia(fn (Assert $page) => $page->where('data.summary.0.value', '1'));

        $this->get('/staf/laporan/unduh/csv?laporan=kunjungan')->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->get('/staf/laporan/unduh/pdf?laporan=bebas&periode=semester')->assertOk()->assertHeader('content-type', 'application/pdf');
    }

    public function test_overdue_loans_report_lists_the_oldest_first()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        $member = Member::create(['member_number' => '20220311', 'name' => 'Annisa', 'type' => 'Mahasiswa']);
        [$a, $b] = Book::first()->copies()->get();
        $c = Book::latest('id')->first()->copies()->first();
        Loan::create(['book_copy_id' => $a->id, 'member_id' => $member->id, 'loaned_at' => now()->subMonth(), 'due_at' => today()->subDays(3)]);
        Loan::create(['book_copy_id' => $b->id, 'member_id' => $member->id, 'loaned_at' => now()->subYears(2), 'due_at' => today()->subDays(400)]);
        // Not overdue yet, and already returned: both left out.
        Loan::create(['book_copy_id' => $c->id, 'member_id' => $member->id, 'loaned_at' => now(), 'due_at' => today()->addWeek()]);
        Loan::create(['book_copy_id' => $c->id, 'member_id' => $member->id, 'loaned_at' => now()->subYear(), 'due_at' => today()->subMonths(11), 'returned_at' => now()->subMonths(10)]);

        $this->get('/staf/laporan?laporan=jatuh-tempo')->assertInertia(fn (Assert $page) => $page
            ->where('data.title', 'Pinjaman jatuh tempo')
            ->where('data.period', 'Per 15 Oktober 2026')
            ->has('data.rows', 2)
            ->where('data.rows.0.0', 1)
            ->where('data.rows.0.7', '400 hari')
            ->where('data.rows.1.7', '3 hari')
            ->where('data.summary.0.value', '2')
            ->where('data.summary.2.value', '1'));

        $this->get('/staf/laporan/unduh/pdf?laporan=jatuh-tempo')->assertOk()->assertHeader('content-type', 'application/pdf');
    }

    public function test_dashboard_shows_live_figures()
    {
        $this->actingAs(User::factory()->pustakawan()->create());
        Visit::create(['guest_name' => 'Tamu', 'purpose' => 'Membaca', 'method' => 'Tamu', 'checked_in_at' => now()]);

        $this->get('/staf')->assertInertia(fn (Assert $page) => $page
            ->component('staf/dashboard')
            ->where('kpis.visitsToday', 1)
            ->where('collection.0.titles', 2)
            ->has('visits', 14)
            ->where('visits.13.total', 1));
    }
}
