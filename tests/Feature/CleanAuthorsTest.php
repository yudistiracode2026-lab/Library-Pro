<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\Publisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CleanAuthorsTest extends TestCase
{
    use RefreshDatabase;

    public function test_spellings_merge_lists_split_and_titles_keep_their_authors(): void
    {
        Storage::fake('local');

        $book = fn (string $title, array $authors) => tap(Book::create([
            'type' => Book::PRINTED, 'title' => $title, 'author_id' => Author::idForName($authors[0]),
            'publisher_id' => Publisher::idForName('Rajawali'), 'ddc_class' => '300', 'collection_type' => 'Buku teks',
        ]))->syncAuthors($authors);

        $a = $book('Pengantar Penelitian Hukum', ['Prof. DR. Soerjono Soekanto, SH., MA.']);
        $b = $book('Sosiologi', ['Soerjono Soekanto dkk 4 orang']);
        $c = $book('Penelitian Hukum Normatif', ['Prof. DR. Soerjono Soekanto, Sri Mamuji']);
        $d = $book('Hukum Adat', ['soerjono soekanto', 'Boedi Harsono']);

        $this->artisan('pengarang:rapikan', ['--coba' => true])->assertSuccessful();
        $this->assertSame(5, Author::count(), 'a dry run changes nothing');

        $this->artisan('pengarang:rapikan')->assertSuccessful();

        $soekanto = Author::where('name', 'Prof. Dr. Soerjono Soekanto, S.H., M.A.')->sole();
        $this->assertEqualsCanonicalizing(['Prof. Dr. Soerjono Soekanto, S.H., M.A.', 'Sri Mamuji', 'Boedi Harsono'], Author::pluck('name')->all());

        foreach ([$a, $b, $c, $d] as $title) {
            $this->assertSame($soekanto->id, $title->fresh()->author_id, $title->title);
        }
        $this->assertSame(['Prof. Dr. Soerjono Soekanto, S.H., M.A.', 'Sri Mamuji'], $c->fresh()->authorNames());
        $this->assertSame(['Prof. Dr. Soerjono Soekanto, S.H., M.A.', 'Boedi Harsono'], $d->fresh()->authorNames());

        // Running it again finds nothing more to do.
        $this->artisan('pengarang:rapikan')->assertSuccessful();
        $this->assertSame(3, Author::count());
    }
}
