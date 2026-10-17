<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Book;
use App\Models\Indicator;
use App\Models\Member;
use App\Models\Rack;
use App\Models\User;
use Database\Seeders\ProductionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_one_admin_and_the_structure_without_demo_data(): void
    {
        $this->artisan('db:seed', ['--class' => ProductionSeeder::class])
            ->expectsQuestion('Nama administrator', 'Kepala TI')
            ->expectsQuestion('Email administrator (dipakai untuk login)', 'ti@kampus.ac.id')
            ->expectsOutputToContain('Password sementara:')
            ->assertSuccessful();

        $admin = User::sole();
        $this->assertSame('ti@kampus.ac.id', $admin->email);
        $this->assertSame(UserRole::Admin, $admin->role);
        $this->assertGreaterThan(0, Rack::count());
        $this->assertSame(56, Indicator::count());
        $this->assertSame(0, Book::count());
        $this->assertSame(0, Member::count());
    }

    public function test_it_leaves_an_existing_database_alone(): void
    {
        User::factory()->create();

        $this->artisan('db:seed', ['--class' => ProductionSeeder::class])->assertSuccessful();

        $this->assertSame(1, User::count());
        $this->assertSame(0, Rack::count());
    }
}
