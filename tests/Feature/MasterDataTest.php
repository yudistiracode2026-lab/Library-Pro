<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Employee;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MasterDataTest extends TestCase
{
    use RefreshDatabase;

    private Rack $rack;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rack = Rack::create(['code' => 'B3', 'name' => 'Hukum pertanahan', 'floor' => 1]);
    }

    private function printedPayload(array $overrides = []): array
    {
        return [
            'type' => 'fisik',
            'title' => 'Hukum Agraria Indonesia',
            'author' => 'Boedi Harsono',
            'publisher' => 'Djambatan',
            'year' => 2008,
            'ddc_class' => '300',
            'collection_type' => 'Buku teks',
            'acquisition' => 'Pengadaan',
            'call_number' => '346.04 HAR h',
            'rack_id' => $this->rack->id,
            'copies' => 3,
            ...$overrides,
        ];
    }

    private function asPustakawan(): static
    {
        return $this->actingAs(User::factory()->pustakawan()->create());
    }

    public function test_master_pages_render_their_components()
    {
        $this->asPustakawan();

        foreach (['buku' => 'staf/master/buku', 'pengarang' => 'staf/master/pengarang', 'penerbit' => 'staf/master/penerbit',
            'penyedia' => 'staf/master/penyedia', 'pemustaka' => 'staf/master/pemustaka'] as $path => $component) {
            $this->get("/staf/{$path}")->assertInertia(fn (Assert $page) => $page->component($component)->has('records.data'));
        }
    }

    public function test_adding_a_printed_book_creates_its_copies_and_master_records()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload())->assertSessionHasNoErrors();

        $book = Book::sole();
        $this->assertSame('Boedi Harsono', $book->author->name);
        $this->assertSame('Djambatan', $book->publisher->name);
        $this->assertSame(["B{$this->pad($book->id)}-1", "B{$this->pad($book->id)}-2", "B{$this->pad($book->id)}-3"], $book->copies()->orderBy('id')->pluck('code')->all());
    }

    public function test_existing_author_names_are_reused_case_insensitively()
    {
        Author::create(['name' => 'Boedi Harsono', 'type' => 'Perorangan']);

        $this->asPustakawan()->post('/staf/buku', $this->printedPayload(['author' => 'boedi harsono']));

        $this->assertSame(1, Author::count());
    }

    public function test_copy_count_can_grow_and_shrink_only_through_available_copies()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload(['copies' => 2]));
        $book = Book::sole();

        $this->put("/staf/buku/{$book->id}", $this->printedPayload(['copies' => 4]))->assertSessionHasNoErrors();
        $this->assertSame(4, $book->copies()->count());

        $book->copies()->orderBy('id')->limit(3)->update(['status' => 'dipinjam']);

        $this->put("/staf/buku/{$book->id}", $this->printedPayload(['copies' => 1]))->assertSessionHasErrors('copies');
        $this->assertSame(4, $book->copies()->count());

        $this->put("/staf/buku/{$book->id}", $this->printedPayload(['copies' => 3]))->assertSessionHasNoErrors();
        $this->assertSame(3, $book->copies()->count());
        $this->assertSame(0, $book->copies()->where('status', BookCopy::AVAILABLE)->count());
    }

    public function test_ebooks_need_format_and_licenses_but_no_rack()
    {
        $this->asPustakawan();

        $this->post('/staf/buku', $this->printedPayload(['type' => 'ebook', 'rack_id' => null, 'call_number' => null, 'copies' => null]))
            ->assertSessionHasErrors(['format', 'license_count', 'status']);

        $this->post('/staf/buku', $this->printedPayload([
            'type' => 'ebook', 'rack_id' => null, 'call_number' => null, 'copies' => null,
            'format' => 'PDF', 'license_count' => 5, 'status' => 'Terbit',
        ]))->assertSessionHasNoErrors();

        $ebook = Book::sole();
        $this->assertNull($ebook->rack_id);
        $this->assertSame(0, $ebook->copies()->count());
    }

    public function test_book_list_can_be_searched_and_filtered_by_type()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload());
        $this->post('/staf/buku', $this->printedPayload(['title' => 'Geodesi Satelit', 'author' => 'Hasanuddin Z. Abidin']));

        $this->get('/staf/buku?q=abidin')->assertInertia(fn (Assert $page) => $page->has('records.data', 1)->where('records.data.0.title', 'Geodesi Satelit'));
        $this->get('/staf/buku?jenis=ebook')->assertInertia(fn (Assert $page) => $page->has('records.data', 0));
    }

    public function test_books_with_loaned_copies_cannot_be_deleted()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload());
        $book = Book::sole();
        $book->copies()->first()->update(['status' => 'dipinjam']);

        $this->delete("/staf/buku/{$book->id}")->assertSessionHas('error');
        $this->assertModelExists($book);
    }

    public function test_authors_and_publishers_in_use_cannot_be_deleted()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload());

        $this->delete('/staf/pengarang/'.Author::sole()->id)->assertSessionHas('error');
        $this->delete('/staf/penerbit/'.Publisher::sole()->id)->assertSessionHas('error');
        $this->assertSame(1, Author::count());
        $this->assertSame(1, Publisher::count());
    }

    public function test_pustakawan_cannot_manage_staff_records()
    {
        $this->asPustakawan();

        $this->get('/staf/pustakawan')->assertForbidden();
        $this->post('/staf/tendik', [])->assertForbidden();
    }

    public function test_employee_pages_are_isolated_by_kind()
    {
        $this->actingAs(User::factory()->admin()->create());
        $tendik = Employee::create(['kind' => 'tendik', 'nip' => '197211252006042018', 'name' => 'Sujilah, S.H', 'golongan' => 'III/c', 'position' => 'Penata Layanan Operasional']);

        $this->get('/staf/pustakawan')->assertInertia(fn (Assert $page) => $page->where('kind', 'pustakawan')->has('records.data', 0));
        $this->get('/staf/tendik')->assertInertia(fn (Assert $page) => $page->where('records.data.0.pangkat', 'Penata'));
        $this->put("/staf/pustakawan/{$tendik->id}", [])->assertNotFound();
        $this->delete("/staf/pustakawan/{$tendik->id}")->assertNotFound();
    }

    public function test_only_one_employee_is_head_of_the_library()
    {
        $this->actingAs(User::factory()->admin()->create());
        $payload = fn (string $nip, string $name) => [
            'nip' => $nip, 'name' => $name, 'golongan' => 'IV/a', 'position' => 'Pustakawan Ahli Madya', 'status' => 'Aktif', 'is_head' => true,
        ];

        $this->post('/staf/pustakawan', $payload('196807251991031002', 'Yosep'))->assertSessionHasNoErrors();
        $this->post('/staf/pustakawan', $payload('196905121991031005', 'Martinho'))->assertSessionHasNoErrors();

        $this->assertSame(['Martinho'], Employee::where('is_head', true)->pluck('name')->all());
    }

    public function test_librarian_positions_and_nip_are_validated()
    {
        $this->actingAs(User::factory()->admin()->create());

        $this->post('/staf/pustakawan', ['nip' => '123', 'name' => 'X', 'golongan' => 'V/a', 'position' => 'Kepala Gudang', 'status' => 'Aktif'])
            ->assertSessionHasErrors(['nip', 'golongan', 'position']);
    }

    public function test_members_need_a_unique_number()
    {
        $this->asPustakawan();
        $member = ['name' => 'Rizky Maulana', 'member_number' => '20220145', 'study_program' => 'D4 Pertanahan', 'type' => 'Mahasiswa', 'status' => 'Aktif'];

        $this->post('/staf/pemustaka', $member)->assertSessionHasNoErrors();
        $this->post('/staf/pemustaka', $member)->assertSessionHasErrors('member_number');
    }

    public function test_export_is_an_excel_friendly_csv()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload());

        $response = $this->get('/staf/buku/ekspor');
        $csv = $response->streamedContent();

        $response->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringStartsWith("\xEF\xBB\xBFJenis;Judul;Pengarang", $csv);
        $this->assertStringContainsString('"Buku fisik";"Hukum Agraria Indonesia";"Boedi Harsono"', $csv);
    }

    private function pad(int $id): string
    {
        return str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }
}
