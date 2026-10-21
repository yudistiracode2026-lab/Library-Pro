<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\Publisher;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DdcSuggestionsTest extends TestCase
{
    use RefreshDatabase;

    private function book(string $title, string $classification, ?string $isbn = null, array $subjects = []): Book
    {
        $book = Book::create([
            'type' => Book::PRINTED, 'title' => $title, 'author_id' => Author::idForName('Anonim'), 'publisher_id' => Publisher::idForName('STPN Press'),
            'ddc_class' => Book::ddcClassOf($classification), 'classification' => $classification, 'isbn' => $isbn,
            'collection_type' => 'Buku teks', 'call_number' => "{$classification} X",
        ]);
        $book->subjects()->sync(collect($subjects)->map(fn ($s) => Subject::firstOrCreate(['name' => $s])->id));

        return $book;
    }

    private function marc(string $ddc, string $title): string
    {
        return '<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:numberOfRecords>1</zs:numberOfRecords><record>'
            .'<datafield tag="082" ind1="0" ind2="0"><subfield code="a">'.$ddc.'</subfield></datafield>'
            .'<datafield tag="245" ind1="1" ind2="0"><subfield code="a">'.$title.' /</subfield></datafield></record></zs:searchRetrieveResponse>';
    }

    public function test_the_library_of_congress_number_is_suggested_for_a_foreign_isbn()
    {
        Http::fake(['lx2.loc.gov:210/*' => Http::response($this->marc('371.2/07', 'Humanizing the education machine'))]);
        $this->actingAs(User::factory()->pustakawan()->create());

        $this->getJson('/staf/buku/saran-ddc?isbn=978-1-119-28310-2&title=Humanizing')
            ->assertOk()
            ->assertJsonPath('loc.number', '371.207')
            ->assertJsonPath('loc.title', 'Humanizing the education machine');

        Http::assertSent(fn ($request) => str_contains(urldecode($request->url()), 'bath.isbn=9781119283102'));
    }

    public function test_this_catalogue_suggests_numbers_by_isbn_subject_and_title()
    {
        Http::fake(['lx2.loc.gov:210/*' => Http::response('<zs:numberOfRecords>0</zs:numberOfRecords>')]);
        $this->actingAs(User::factory()->pustakawan()->create());
        $this->book('Konsolidasi Tanah Perkotaan', '711.4');
        $this->book('Konsolidasi Tanah Pertanian di Sragi', '711.4');
        $this->book('Pelaksanaan Konsolidasi Tanah Desa', '333.3');
        $this->book('Hukum Agraria Indonesia', '346.043', null, ['Hukum agraria']);
        $this->book('Geodesi Satelit', '526.1', '9789790000001');
        $this->book('Resep Masakan Nusantara', '641.5');

        $this->getJson('/staf/buku/saran-ddc?'.http_build_query(['isbn' => '978-979-000000-1', 'title' => 'Konsolidasi Tanah Perkotaan di Denpasar', 'subjects' => ['Hukum agraria']]))
            ->assertOk()
            ->assertJsonPath('loc', null)
            ->assertJsonPath('locError', false)
            // ISBN first, then subjects, then titles: 711.4 shares the most words.
            ->assertJsonPath('catalogue.0.number', '526.1')
            ->assertJsonPath('catalogue.0.reason', 'ISBN sama di katalog')
            ->assertJsonPath('catalogue.1.number', '346.043')
            ->assertJsonPath('catalogue.1.reason', 'Subjek sama')
            ->assertJsonPath('catalogue.2.number', '711.4')
            ->assertJsonPath('catalogue.2.count', 2)
            ->assertJsonMissing(['number' => '641.5']);
    }

    public function test_an_unreachable_library_of_congress_still_leaves_the_catalogue_suggestions()
    {
        Http::fake(['lx2.loc.gov:210/*' => Http::response('', 503)]);
        $this->actingAs(User::factory()->pustakawan()->create());
        $this->book('Geodesi Satelit', '526.1');

        $this->getJson('/staf/buku/saran-ddc?isbn=9781119283102&title=Geodesi+Satelit+Lanjut')
            ->assertOk()
            ->assertJsonPath('locError', true)
            ->assertJsonPath('catalogue.0.number', '526.1');
    }

    public function test_members_cannot_ask_for_suggestions()
    {
        $this->actingAs(User::factory()->create())->getJson('/staf/buku/saran-ddc?title=Tanah')->assertForbidden();
    }
}
