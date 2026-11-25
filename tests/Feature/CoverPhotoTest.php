<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Author;
use App\Models\Book;
use App\Models\Publisher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CoverPhotoTest extends TestCase
{
    use RefreshDatabase;

    private function book(array $attributes = []): Book
    {
        return Book::create([
            'type' => Book::PRINTED, 'title' => 'Buku Contoh', 'author_id' => Author::idForName('Anonim'), 'publisher_id' => Publisher::idForName('STPN Press'),
            'ddc_class' => '300', 'collection_type' => 'Buku teks', 'call_number' => '300 X', ...$attributes,
        ]);
    }

    public function test_the_phone_list_shows_books_without_a_cover_and_saves_the_photo()
    {
        Storage::fake('local');
        $this->actingAs(User::factory()->create(['role' => UserRole::PengolahData]));
        $bare = $this->book(['title' => 'Buku Tanpa Sampul', 'cover_path' => null]);
        $this->book(['title' => 'Buku Bersampul', 'cover_path' => 'sampul/lama.jpg']);

        $this->get(route('staf.sampul'))->assertInertia(fn (Assert $page) => $page
            ->component('staf/sampul')
            ->where('missing', 1)
            ->has('books.data', 1)
            ->where('books.data.0.title', 'Buku Tanpa Sampul'));

        $this->get(route('staf.sampul', ['semua' => 1]))->assertInertia(fn (Assert $page) => $page->has('books.data', 2));

        $this->post(route('staf.sampul.store', $bare), ['cover' => UploadedFile::fake()->image('sampul.jpg', 800, 1200)])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $path = $bare->fresh()->cover_path;
        $this->assertNotNull($path);
        Storage::disk('local')->assertExists($path);
    }

    public function test_a_new_photo_replaces_the_old_file()
    {
        Storage::fake('local');
        Storage::disk('local')->put('sampul/lama.jpg', 'jpeg');
        $this->actingAs(User::factory()->sirkulasi()->create());
        $book = $this->book(['cover_path' => 'sampul/lama.jpg']);

        $this->post(route('staf.sampul.store', $book), ['cover' => UploadedFile::fake()->image('sampul.jpg')])->assertSessionHasNoErrors();

        Storage::disk('local')->assertMissing('sampul/lama.jpg');
        $this->post(route('staf.sampul.store', $book), ['cover' => UploadedFile::fake()->create('bukan.pdf', 10, 'application/pdf')])
            ->assertSessionHasErrors('cover');
    }

    public function test_members_cannot_upload_covers()
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Pemustaka]));
        $book = $this->book();

        $this->get(route('staf.sampul'))->assertForbidden();
        $this->post(route('staf.sampul.store', $book), ['cover' => UploadedFile::fake()->image('x.jpg')])->assertForbidden();
    }
}
