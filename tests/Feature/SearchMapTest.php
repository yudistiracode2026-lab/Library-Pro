<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SearchMapTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_locates_the_book_on_its_rack_and_shelf()
    {
        $rack = Rack::create(['code' => 'D1', 'name' => 'Ukur tanah', 'floor' => 2, 'map_x' => 42, 'map_y' => 8]);
        $make = fn (string $title, string $call) => Book::create([
            'type' => Book::PRINTED, 'title' => $title, 'author_id' => Author::idForName('Sri Wahyuni'),
            'publisher_id' => Publisher::idForName('Andi'), 'ddc_class' => '500', 'collection_type' => 'Buku teks',
            'call_number' => $call, 'rack_id' => $rack->id,
        ]);

        // Twelve books, two per shelf in call-number order.
        foreach (range(1, 12) as $i) {
            $make("Buku {$i}", sprintf('526.%02d X', $i));
        }
        $target = Book::where('title', 'Buku 7')->sole();

        $this->actingAs(User::factory()->pustakawan()->create())
            ->get('/staf/pencarian?q=buku 7&buku='.$target->id)
            ->assertInertia(fn (Assert $page) => $page
                ->component('staf/pencarian')
                ->where('results.0.title', 'Buku 7')
                ->where('floor', 2)
                ->where('rack.code', 'D1')
                ->where('rack.highlightShelf', 4)
                ->where('rack.shelves.3.range', '526.07 X – 526.08 X'));
    }
}
