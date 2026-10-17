<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Loan;
use App\Models\Member;
use App\Models\Thesis;
use App\Models\Visit;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ImportSlimsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['database.connections.slims' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']]);
        $this->fakeSlims();
    }

    public function test_it_imports_the_catalogue_members_and_history(): void
    {
        $this->artisan('import:slims', ['--force' => true])->assertSuccessful();

        $book = Book::with(['author', 'publisher'])->find(10);
        $this->assertSame('Hukum Agraria Indonesia', $book->title);
        $this->assertSame('Boedi Harsono', $book->author->name);
        $this->assertSame('300', $book->ddc_class);
        $this->assertSame('Buku teks', $book->collection_type);

        $thesis = Book::with(['author', 'publisher'])->find(11);
        $this->assertSame('Skripsi', $thesis->collection_type);
        $this->assertSame('Tanpa penerbit', $thesis->publisher->name);
        $this->assertSame('Anonim', $thesis->author->name);
        $this->assertSame('Tafsir Islam', Book::find(12)->title);
        $this->assertSame('200', Book::find(12)->ddc_class);

        $this->assertSame(1, Thesis::count());
        $this->assertSame('PTSL; Pendaftaran tanah', Thesis::first()->keywords);

        $this->assertSame(BookCopy::LOANED, BookCopy::where('code', 'B0002')->value('status'));
        $this->assertSame(BookCopy::REPAIR, BookCopy::where('code', 'B0003')->value('status'));

        $this->assertSame('Aktif', Member::where('member_number', '20220311')->value('status'));
        $this->assertSame('Nonaktif', Member::where('member_number', '10100')->value('status'));
        $this->assertSame('D4 Pertanahan', Member::where('member_number', '20220311')->value('study_program'));
        $this->assertNull(Member::where('member_number', '10100')->value('email'), 'duplicate e-mails are dropped');

        $this->assertSame(2, Loan::count(), 'the loan of an unknown member is skipped');
        $this->assertSame(1, Loan::open()->count());
        $this->assertSame(2, Visit::count());
        $this->assertSame('Tamu', Visit::whereNull('member_id')->value('method'));
    }

    public function test_it_refuses_to_run_on_a_filled_database(): void
    {
        Member::create(['member_number' => 'X1', 'name' => 'Ada', 'type' => 'Umum', 'study_program' => 'Umum', 'status' => 'Aktif']);

        $this->artisan('import:slims', ['--force' => true])->assertFailed();
        $this->assertSame(0, Book::count());
    }

    private function fakeSlims(): void
    {
        $schema = DB::connection('slims')->getSchemaBuilder();
        $db = DB::connection('slims');

        $schema->create('mst_author', fn (Blueprint $t) => [$t->integer('author_id'), $t->string('author_name'), $t->string('authority_type')]);
        $schema->create('mst_publisher', fn (Blueprint $t) => [$t->integer('publisher_id'), $t->string('publisher_name')]);
        $schema->create('mst_gmd', fn (Blueprint $t) => [$t->integer('gmd_id'), $t->string('gmd_name')]);
        $schema->create('biblio', function (Blueprint $t) {
            foreach (['biblio_id', 'gmd_id', 'publisher_id', 'publish_year'] as $c) {
                $t->integer($c)->nullable();
            }
            foreach (['title', 'isbn_issn', 'classification', 'call_number', 'notes', 'input_date', 'last_update'] as $c) {
                $t->text($c)->nullable();
            }
        });
        $schema->create('biblio_author', fn (Blueprint $t) => [$t->integer('biblio_id'), $t->integer('author_id'), $t->integer('level')]);
        $schema->create('mst_topic', fn (Blueprint $t) => [$t->integer('topic_id'), $t->string('topic')]);
        $schema->create('biblio_topic', fn (Blueprint $t) => [$t->integer('biblio_id'), $t->integer('topic_id'), $t->integer('level')]);
        $schema->create('item', function (Blueprint $t) {
            $t->integer('item_id');
            $t->integer('biblio_id');
            $t->integer('coll_type_id');
            $t->string('item_code');
            $t->string('item_status_id')->nullable();
            $t->text('input_date')->nullable();
            $t->text('last_update')->nullable();
        });
        $schema->create('member', function (Blueprint $t) {
            $t->string('member_id');
            $t->string('member_name');
            $t->integer('member_type_id');
            $t->string('member_email')->nullable();
            foreach (['expire_date', 'register_date', 'input_date', 'last_update'] as $c) {
                $t->text($c)->nullable();
            }
        });
        $schema->create('loan', function (Blueprint $t) {
            $t->integer('loan_id');
            $t->string('item_code');
            $t->string('member_id');
            $t->text('loan_date');
            $t->text('due_date');
            $t->text('return_date')->nullable();
            $t->integer('renewed');
            $t->integer('is_lent');
            $t->integer('is_return');
        });
        $schema->create('vs', fn (Blueprint $t) => [$t->integer('id'), $t->string('member_id'), $t->text('checkin_date')]);

        $db->table('mst_author')->insert([['author_id' => 1, 'author_name' => 'Boedi Harsono', 'authority_type' => 'p'], ['author_id' => 2, 'author_name' => 'BOEDI HARSONO', 'authority_type' => 'p']]);
        $db->table('mst_publisher')->insert([['publisher_id' => 1, 'publisher_name' => 'Djambatan']]);
        $db->table('mst_gmd')->insert([['gmd_id' => 1, 'gmd_name' => 'Buku'], ['gmd_id' => 2, 'gmd_name' => 'Skripsi']]);
        $db->table('biblio')->insert([
            ['biblio_id' => 10, 'gmd_id' => 1, 'title' => "Hukum Agraria\nIndonesia", 'publisher_id' => 1, 'publish_year' => 2008, 'isbn_issn' => null, 'classification' => '346.04', 'call_number' => '346.04 Boe h', 'notes' => null, 'input_date' => '2015-02-01 10:00:00', 'last_update' => null],
            ['biblio_id' => 11, 'gmd_id' => 2, 'title' => 'Evaluasi PTSL di Sleman', 'publisher_id' => 0, 'publish_year' => 0, 'isbn_issn' => null, 'classification' => '', 'call_number' => 'SK', 'notes' => 'Abstrak.', 'input_date' => '2021-08-01 10:00:00', 'last_update' => null],
            ['biblio_id' => 12, 'gmd_id' => 1, 'title' => 'Tafsir Islam', 'publisher_id' => 1, 'publish_year' => 2001, 'isbn_issn' => null, 'classification' => '2X4.1', 'call_number' => null, 'notes' => null, 'input_date' => '0000-00-00 00:00:00', 'last_update' => null],
        ]);
        $db->table('biblio_author')->insert([['biblio_id' => 10, 'author_id' => 2, 'level' => 2], ['biblio_id' => 10, 'author_id' => 1, 'level' => 1]]);
        $db->table('mst_topic')->insert([['topic_id' => 1, 'topic' => 'PTSL'], ['topic_id' => 2, 'topic' => 'Pendaftaran tanah']]);
        $db->table('biblio_topic')->insert([['biblio_id' => 11, 'topic_id' => 2, 'level' => 2], ['biblio_id' => 11, 'topic_id' => 1, 'level' => 1]]);
        $db->table('item')->insert([
            ['item_id' => 1, 'biblio_id' => 10, 'coll_type_id' => 2, 'item_code' => 'B0001', 'item_status_id' => 'A', 'input_date' => null, 'last_update' => null],
            ['item_id' => 2, 'biblio_id' => 10, 'coll_type_id' => 2, 'item_code' => 'B0002', 'item_status_id' => null, 'input_date' => null, 'last_update' => null],
            ['item_id' => 3, 'biblio_id' => 11, 'coll_type_id' => 1, 'item_code' => 'B0003', 'item_status_id' => 'R', 'input_date' => null, 'last_update' => null],
            ['item_id' => 4, 'biblio_id' => 99, 'coll_type_id' => 2, 'item_code' => 'B0099', 'item_status_id' => null, 'input_date' => null, 'last_update' => null],
        ]);
        $db->table('member')->insert([
            ['member_id' => '20220311', 'member_name' => 'Annisa', 'member_type_id' => 2, 'member_email' => 'annisa@example.test', 'expire_date' => now()->addYear()->toDateString(), 'register_date' => '2022-08-01', 'input_date' => null, 'last_update' => null],
            ['member_id' => '10100', 'member_name' => 'Alumni', 'member_type_id' => 1, 'member_email' => 'ANNISA@example.test', 'expire_date' => '2019-01-01', 'register_date' => '2015-08-01', 'input_date' => null, 'last_update' => null],
        ]);
        $db->table('loan')->insert([
            ['loan_id' => 1, 'item_code' => 'B0001', 'member_id' => '10100', 'loan_date' => '2016-01-02', 'due_date' => '2016-01-14', 'return_date' => '2016-01-10', 'renewed' => 0, 'is_lent' => 1, 'is_return' => 1],
            ['loan_id' => 2, 'item_code' => 'b0002', 'member_id' => '20220311', 'loan_date' => '2025-09-20', 'due_date' => '2025-10-02', 'return_date' => null, 'renewed' => 1, 'is_lent' => 1, 'is_return' => 0],
            ['loan_id' => 3, 'item_code' => 'B0001', 'member_id' => 'unknown', 'loan_date' => '2025-09-20', 'due_date' => '2025-10-02', 'return_date' => null, 'renewed' => 0, 'is_lent' => 1, 'is_return' => 1],
        ]);
        $db->table('vs')->insert([['id' => 1, 'member_id' => '20220311', 'checkin_date' => '2025-09-30 09:00:00'], ['id' => 2, 'member_id' => 'Tamu Dinas', 'checkin_date' => '2025-09-30 10:00:00']]);
    }
}
