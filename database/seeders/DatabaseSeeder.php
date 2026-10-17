<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Development accounts only — every password is "password". For a real
     * server use ProductionSeeder.
     */
    public function run(): void
    {
        $password = Hash::make('password');

        foreach ([
            [UserRole::Admin, 'Muhamad Irfan Yudistira, S.ST., M.Eng', 'admin@perpus.test', 'Administrator sistem'],
            [UserRole::Pustakawan, 'Yosep Nai Helly, S.SiT., M.A', 'yosep@perpus.test', 'Pustakawan Ahli Madya'],
            [UserRole::Pustakawan, 'Martinho Magno, S.Si.T', 'martinho@perpus.test', 'Pustakawan Ahli Muda'],
            [UserRole::Pemustaka, 'Annisa Putri Lestari', 'pemustaka@perpus.test', 'Mahasiswa D4 Pertanahan'],
        ] as [$role, $name, $email, $title]) {
            // Not a factory: Faker is a dev dependency and absent on servers.
            User::forceCreate([
                'name' => $name, 'email' => $email, 'title' => $title, 'role' => $role,
                'password' => $password, 'email_verified_at' => now(),
            ]);
        }

        $this->call([MasterDataSeeder::class, ServiceDataSeeder::class, OperationsDataSeeder::class, AccreditationSeeder::class, PortalDataSeeder::class]);
    }
}
