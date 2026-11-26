<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Publisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DonatedCopiesTest extends TestCase
{
    use RefreshDatabase;

    public function test_extra_copies_of_a_donated_title_keep_the_usual_numbering()
    {
        $book = Book::create([
            'type' => Book::PRINTED, 'title' => 'Buku Sumbangan Contoh', 'author_id' => Author::idForName('Anonim'),
            'publisher_id' => Publisher::idForName('Tanpa penerbit'), 'ddc_class' => '300', 'collection_type' => 'Buku teks',
            'acquisition' => 'Sumbangan mahasiswa',
        ]);
        $book->copies()->create(['code' => '26SM22610', 'status' => BookCopy::AVAILABLE]);
        $book->copies()->create(['code' => '26SM22611', 'status' => BookCopy::AVAILABLE]);

        $book->syncCopyCount(4);

        $this->assertSame(
            ['26SM22610', '26SM22611', sprintf('B%04d-1', $book->id), sprintf('B%04d-2', $book->id)],
            $book->copies()->orderBy('id')->pluck('code')->all(),
        );
    }
}
