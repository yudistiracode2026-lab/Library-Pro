<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Evidence;
use App\Models\Indicator;
use App\Models\Rack;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * First run on a real server: one administrator, the rack and room plans,
 * and the 56 accreditation indicators with empty evidence slots. No demo
 * accounts, collections or transactions.
 *
 *   php artisan db:seed --class=ProductionSeeder --force
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        if (User::exists()) {
            $this->command->warn('Database sudah berisi pengguna; seeder production dilewati.');

            return;
        }

        $name = $this->command->ask('Nama administrator', 'Administrator');
        $email = $this->command->ask('Email administrator (dipakai untuk login)', 'admin@'.parse_url(config('app.url'), PHP_URL_HOST));
        $password = Str::password(16, symbols: false);

        User::forceCreate([
            'name' => $name,
            'email' => $email,
            'title' => 'Administrator sistem',
            'role' => UserRole::Admin,
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        foreach (MasterDataSeeder::RACKS as $floor => $racks) {
            foreach ($racks as $code => [$rackName, $x, $y, $w, $h]) {
                Rack::create(['code' => $code, 'name' => $rackName, 'floor' => $floor, 'map_x' => $x, 'map_y' => $y, 'map_w' => $w, 'map_h' => $h]);
            }
        }

        foreach (OperationsDataSeeder::ROOMS as [, $floor, $roomName, $type, $area, $x, $y, $w, $h]) {
            Room::create([
                'floor' => $floor, 'name' => $roomName, 'type' => $type, 'area_m2' => $area,
                'map_x' => $x, 'map_y' => $y, 'map_w' => $w, 'map_h' => $h, 'outside_library' => $floor === 1,
            ]);
        }

        $indicators = json_decode(file_get_contents(database_path('data/indicators.json')), true);

        foreach ($indicators as $i => $row) {
            $indicator = Indicator::create([
                'number' => $row['number'],
                'component' => (int) explode('.', $row['number'])[0],
                'name' => $row['name'],
                'mode' => $row['mode'],
                'options' => $row['options'],
                'source' => $row['source'],
                'position' => $i + 1,
            ]);

            foreach ($row['evidence'] as $label) {
                Evidence::create(['indicator_id' => $indicator->id, 'label' => $label, 'status' => Evidence::MISSING]);
            }
        }

        $this->command->newLine();
        $this->command->info("Akun administrator dibuat: {$email}");
        $this->command->info("Password sementara: {$password}");
        $this->command->warn('Catat sekarang — password ini tidak ditampilkan lagi. Ganti setelah login pertama.');
    }
}
