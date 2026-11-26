<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Publisher;
use App\Models\User;
use App\Support\MasterOptions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** Copy codes: 2-digit year of acquisition, acquisition code, inventory number ("26SM22610"). */
class InventoryCodesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-26 10:00');
        $this->actingAs(User::factory()->create(['role' => UserRole::PengolahData]));
    }

    private function payload(array $overrides = []): array
    {
        return [
            'type' => 'fisik', 'title' => 'Hukum Agraria Indonesia', 'authors' => ['Boedi Harsono'], 'publisher' => 'Djambatan',
            'year' => 2008, 'language' => 'Indonesia', 'ddc_class' => '300', 'collection_type' => 'Buku teks',
            'acquisition' => 'Pembelian', 'call_number' => '346.04 HAR h', 'rack_id' => null, 'copies' => 2, ...$overrides,
        ];
    }

    private function codes(string $title): array
    {
        return Book::where('title', $title)->sole()->copies()->orderBy('id')->pluck('code')->all();
    }

    private function donated(array $codes): Book
    {
        $book = Book::create([
            'type' => Book::PRINTED, 'title' => 'Buku Sumbangan', 'author_id' => Author::idForName('Anonim'),
            'publisher_id' => Publisher::idForName('Tanpa penerbit'), 'ddc_class' => '300', 'collection_type' => 'Buku teks',
            'acquisition' => 'Sumbangan mahasiswa',
        ]);
        foreach ($codes as $code) {
            $book->copies()->create(['code' => $code, 'status' => BookCopy::AVAILABLE]);
        }

        return $book;
    }

    public function test_new_copies_continue_after_the_highest_inventory_number()
    {
        $this->donated(['26SM22915', '26SM22916', 'B0001-1']);

        $this->post(route('staf.buku.store'), $this->payload())->assertSessionHasNoErrors();

        $this->assertSame(['26P22917', '26P22918'], $this->codes('Hukum Agraria Indonesia'));
    }

    public function test_the_first_inventory_number_and_year_can_be_given()
    {
        $this->post(route('staf.buku.store'), $this->payload(['acquisition' => 'Sumbangan luar', 'inventory_start' => 30001, 'acquired_year' => 2025, 'copies' => 3]))
            ->assertSessionHasNoErrors();

        $this->assertSame(['25SL30001', '25SL30002', '25SL30003'], $this->codes('Hukum Agraria Indonesia'));
        $this->assertSame(30004, Book::nextInventoryNumber());
    }

    public function test_an_inventory_number_in_use_is_refused()
    {
        $this->donated(['26SM22610', '26SM22611']);

        $this->post(route('staf.buku.store'), $this->payload(['inventory_start' => 22609]))
            ->assertSessionHasErrors('inventory_start');
        $this->assertFalse(Book::where('title', 'Hukum Agraria Indonesia')->exists());
    }

    public function test_extra_copies_of_an_existing_title_get_the_next_numbers()
    {
        $book = $this->donated(['26SM22610', 'B0001-1']);

        $book->syncCopyCount(4);

        $this->assertSame(['26SM22610', 'B0001-1', '26SM22611', '26SM22612'], $book->copies()->orderBy('id')->pluck('code')->all());
    }

    public function test_every_acquisition_has_a_code()
    {
        foreach (MasterOptions::ACQUISITIONS as $acquisition) {
            $this->assertMatchesRegularExpression('/^[A-Z]{1,3}$/', (string) MasterOptions::ACQUISITION_CODES[$acquisition] ?? '', $acquisition);
        }
    }
}
