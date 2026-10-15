<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Development accounts only — every password is "password".
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Muhamad Irfan Yudistira, S.ST., M.Eng',
            'email' => 'admin@perpus.test',
            'title' => 'Administrator sistem',
        ]);

        User::factory()->pustakawan()->create([
            'name' => 'Yosep Nai Helly, S.SiT., M.A',
            'email' => 'yosep@perpus.test',
            'title' => 'Pustakawan Ahli Madya',
        ]);

        User::factory()->pustakawan()->create([
            'name' => 'Martinho Magno, S.Si.T',
            'email' => 'martinho@perpus.test',
            'title' => 'Pustakawan Ahli Muda',
        ]);

        User::factory()->create([
            'name' => 'Annisa Putri Lestari',
            'email' => 'pemustaka@perpus.test',
            'title' => 'Mahasiswa D4 Pertanahan',
        ]);
    }
}
