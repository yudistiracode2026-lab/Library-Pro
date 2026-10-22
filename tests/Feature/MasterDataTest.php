<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Employee;
use App\Models\Member;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\User;
use App\Support\MasterOptions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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
            'authors' => ['Boedi Harsono'],
            'publisher' => 'Djambatan',
            'year' => 2008,
            'language' => 'Indonesia',
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

    public function test_material_type_defaults_to_the_usual_one_and_collection_type_gives_the_snp_category()
    {
        $this->asPustakawan();
        $this->post('/staf/buku', $this->printedPayload(['title' => 'Atlas Indonesia', 'collection_type' => 'Peta & atlas']))->assertSessionHasNoErrors();
        $this->post('/staf/buku', $this->printedPayload(['title' => 'Video Pengukuran', 'collection_type' => 'Referensi', 'material_type' => 'Rekaman video']))->assertSessionHasNoErrors();
        $this->post('/staf/buku', $this->printedPayload(['title' => 'Salah', 'material_type' => 'Kaset']))->assertSessionHasErrors('material_type');

        $atlas = Book::where('title', 'Atlas Indonesia')->sole();
        $this->assertSame('Bahan kartografis', $atlas->material_type);
        $this->assertSame('Referensi', $atlas->collectionCategory());
        $this->assertSame('Rekaman video', Book::where('title', 'Video Pengukuran')->sole()->material_type);

        $this->get('/staf/buku?q=Atlas')->assertInertia(fn (Assert $page) => $page
            ->where('records.data.0.material_type', 'Bahan kartografis')
            ->where('records.data.0.collection_category', 'Referensi'));
    }

    public function test_every_kind_of_donation_keeps_its_donor_and_the_options_show_the_label_codes()
    {
        $this->asPustakawan();
        $this->post('/staf/buku', $this->printedPayload(['title' => 'Hibah', 'acquisition' => 'Sumbangan luar', 'donor' => 'Kementerian ATR/BPN']))->assertSessionHasNoErrors();
        $this->post('/staf/buku', $this->printedPayload(['title' => 'Beli', 'acquisition' => 'Pengadaan', 'donor' => 'Diabaikan']))->assertSessionHasNoErrors();

        $this->assertSame('Kementerian ATR/BPN', Book::where('title', 'Hibah')->sole()->donor);
        $this->assertNull(Book::where('title', 'Beli')->sole()->donor);

        $labels = array_column(MasterOptions::acquisitionOptions(), 'label');
        $this->assertContains('Pengadaan / pembelian (P)', $labels);
        $this->assertContains('Sumbangan STPN (SS)', $labels);
        $this->assertContains('Penyerahan mahasiswa, tendik dan dosen', $labels);

        // The dashboard chart counts every donation together.
        $this->get('/staf')->assertInertia(fn (Assert $page) => $page
            ->where('growth.sources', ['Pengadaan', 'Penyerahan mahasiswa, tendik dan dosen', 'Sumbangan'])
            ->where('growth.types.Semua jenis.6', [1, 0, 1]));
    }

    public function test_every_collection_sub_type_belongs_to_one_snp_collection_type()
    {
        foreach (MasterOptions::COLLECTION_TYPES as $type) {
            $this->assertNotNull(MasterOptions::categoryOf($type), $type);
        }
        $this->assertSame('Muatan lokal', MasterOptions::categoryOf('Skripsi'));
        $this->assertSame('Sumber elektronik', Book::materialTypeOf(Book::EBOOK, 'Buku teks'));
    }

    public function test_adding_a_printed_book_creates_its_copies_and_master_records()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload())->assertSessionHasNoErrors();

        $book = Book::sole();
        $this->assertSame('Boedi Harsono', $book->author->name);
        $this->assertSame('Djambatan', $book->publisher->name);
        $this->assertSame(["B{$this->pad($book->id)}-1", "B{$this->pad($book->id)}-2", "B{$this->pad($book->id)}-3"], $book->copies()->orderBy('id')->pluck('code')->all());
    }

    public function test_a_title_keeps_its_authors_subjects_and_catalogue_fields()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload([
            'authors' => ['Boedi Harsono', 'Arie Sukanti Hutagalung'],
            'subjects' => ['Hukum agraria', 'Pendaftaran tanah'],
            'classification' => '346.043',
            'ddc_class' => '',
            'collation' => 'xv, 320 hlm.: 24 cm',
            'publish_place' => 'Jakarta',
            'edition' => 'Ed. revisi',
            'language' => 'Indonesia / Inggris',
            'abstract' => 'Sejarah pembentukan UUPA.',
            'featured' => true,
        ]))->assertSessionHasNoErrors();

        $book = Book::sole();
        $this->assertSame(['Boedi Harsono', 'Arie Sukanti Hutagalung'], $book->authorNames());
        $this->assertSame('Boedi Harsono', $book->author->name);
        $this->assertSame(['Hukum agraria', 'Pendaftaran tanah'], $book->subjects->pluck('name')->all());
        $this->assertSame('300', $book->ddc_class, 'the DDC class follows the classification number');
        $this->assertTrue($book->featured);

        // Reordering makes the other author the main one.
        $this->put("/staf/buku/{$book->id}", $this->printedPayload(['authors' => ['Arie Sukanti Hutagalung', 'Boedi Harsono'], 'subjects' => []]))
            ->assertSessionHasNoErrors();
        $this->assertSame('Arie Sukanti Hutagalung', $book->fresh()->author->name);
        $this->assertSame(0, $book->subjects()->count());

        // The second author is still credited, so it cannot be deleted.
        $this->delete('/staf/pengarang/'.Author::where('name', 'Boedi Harsono')->value('id'))->assertSessionHas('error');
        $this->get('/staf/buku?q=boedi')->assertInertia(fn (Assert $page) => $page->has('records.data', 1));
    }

    public function test_a_title_needs_a_class_number_or_ddc_class_and_an_author()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload(['authors' => [], 'ddc_class' => '', 'classification' => '']))
            ->assertSessionHasErrors(['authors']);
        $this->post('/staf/buku', $this->printedPayload(['ddc_class' => '', 'classification' => 'SK']))
            ->assertSessionHasErrors(['ddc_class']);
    }

    public function test_cover_images_are_stored_and_served()
    {
        Storage::fake('local');
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload(['cover' => UploadedFile::fake()->image('sampul.jpg', 300, 450)]))
            ->assertSessionHasNoErrors();

        $book = Book::sole();
        Storage::disk('local')->assertExists($book->cover_path);
        $this->get($book->coverUrl())->assertOk();

        // Replacing the cover removes the old file.
        $old = $book->cover_path;
        $this->post("/staf/buku/{$book->id}", $this->printedPayload(['_method' => 'put', 'cover' => UploadedFile::fake()->image('baru.png')]))
            ->assertSessionHasNoErrors();
        Storage::disk('local')->assertMissing($old);
        Storage::disk('local')->assertExists($book->fresh()->cover_path);
    }

    public function test_form_suggestions_match_names()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload(['subjects' => ['Hukum agraria'], 'publish_place' => 'Jakarta']));

        $this->getJson('/staf/buku/saran?jenis=pengarang&q=boe')->assertExactJson(['Boedi Harsono']);
        $this->getJson('/staf/buku/saran?jenis=pengarang&q=harso')->assertExactJson(['Boedi Harsono']);
        $this->getJson('/staf/buku/saran?jenis=subjek&q=agra')->assertExactJson(['Hukum agraria']);
        $this->getJson('/staf/buku/saran?jenis=tempat&q=jak')->assertExactJson(['Jakarta']);
        $this->getJson('/staf/buku/saran?jenis=penerbit&q=d')->assertExactJson([]);
    }

    public function test_existing_author_names_are_reused_case_insensitively()
    {
        Author::create(['name' => 'Boedi Harsono', 'type' => 'Perorangan']);

        $this->asPustakawan()->post('/staf/buku', $this->printedPayload(['authors' => ['boedi harsono']]));

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
        $this->post('/staf/buku', $this->printedPayload(['title' => 'Geodesi Satelit', 'authors' => ['Hasanuddin Z. Abidin']]));

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

    public function test_lists_sort_by_any_column_and_numbers_sort_as_numbers()
    {
        $this->asPustakawan();
        foreach ([['Citra', '20220311'], ['Budi', '9182415'], ['Ani', '12D14097']] as [$name, $number]) {
            Member::create(['name' => $name, 'member_number' => $number, 'study_program' => 'D4 Pertanahan', 'type' => 'Mahasiswa', 'status' => 'Aktif']);
        }

        $numbers = fn ($response) => collect($response->viewData('page')['props']['records']['data'])->pluck('member_number')->all();

        // NIM as a number: the 7-digit one before the 8-digit ones.
        $this->assertSame(['9182415', '12D14097', '20220311'], $numbers($this->get('/staf/pemustaka?urut=nim&arah=asc')));
        $this->assertSame(['20220311', '12D14097', '9182415'], $numbers($this->get('/staf/pemustaka?urut=nim&arah=desc')));
        $this->get('/staf/pemustaka?urut=nim&arah=desc')->assertInertia(fn (Assert $page) => $page->where('filters.urut', 'nim')->where('filters.arah', 'desc'));

        // Alphabetical by name is the default; an unknown column falls back to it.
        $this->assertSame(['12D14097', '9182415', '20220311'], $numbers($this->get('/staf/pemustaka')));
        $this->assertSame(['12D14097', '9182415', '20220311'], $numbers($this->get('/staf/pemustaka?urut=password&arah=desc')));
    }

    public function test_grades_sort_by_rank_not_alphabetically()
    {
        $this->actingAs(User::factory()->admin()->create());
        foreach ([['A', 'III/a'], ['B', 'IV/a'], ['C', 'II/b']] as $i => [$name, $grade]) {
            Employee::create(['kind' => 'pustakawan', 'nip' => '19680725199103100'.$i, 'name' => $name, 'golongan' => $grade, 'position' => 'Pustakawan Ahli Muda']);
        }

        $grades = collect($this->get('/staf/pustakawan?urut=golongan&arah=asc')->viewData('page')['props']['records']['data'])->pluck('golongan')->all();

        $this->assertSame(['II/b', 'III/a', 'IV/a'], $grades);
    }

    public function test_members_need_a_unique_number()
    {
        $this->asPustakawan();
        $member = ['name' => 'Rizky Maulana', 'member_number' => '20220145', 'study_program' => 'D4 Pertanahan', 'type' => 'Mahasiswa', 'status' => 'Aktif'];

        $this->post('/staf/pemustaka', $member)->assertSessionHasNoErrors();
        $this->post('/staf/pemustaka', $member)->assertSessionHasErrors('member_number');
    }

    public function test_member_names_are_saved_in_title_case()
    {
        $this->asPustakawan()->post('/staf/pemustaka', [
            'name' => 'RIZKY MAULANA', 'member_number' => '20220145', 'study_program' => 'D4 Pertanahan', 'type' => 'Mahasiswa', 'status' => 'Aktif',
        ])->assertSessionHasNoErrors();

        $this->assertSame('Rizky Maulana', Member::sole()->name);
    }

    public function test_export_is_an_excel_friendly_csv()
    {
        $this->asPustakawan()->post('/staf/buku', $this->printedPayload());

        $response = $this->get('/staf/buku/ekspor');
        $csv = $response->streamedContent();

        $response->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringStartsWith("\xEF\xBB\xBFJenis;Judul;\"Judul seri\";Pengarang", $csv);
        $this->assertStringContainsString('"Buku fisik";"Hukum Agraria Indonesia";;"Boedi Harsono"', $csv);
    }

    private function pad(int $id): string
    {
        return str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }
}
