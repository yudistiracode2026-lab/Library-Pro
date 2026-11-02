<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Sizes that match the recorded room areas: floors 2 and 3 are 400 m², floor 1 about 552 m². */
    private const SIZES = [1 => 23.5, 2 => 20, 3 => 20];

    /** floor => [label, x, y, w, h, icon] in percent; these used to live in App\Support\FloorPlan. */
    private const FIXTURES = [
        1 => [
            ['Meja sirkulasi', 4, 52, 26, 10, 'repeat'],
            ['Pintu masuk', 42, 82, 18, 12, 'door-open'],
            ['Komputer OPAC', 66, 52, 28, 10, 'monitor'],
        ],
        2 => [
            ['Ruang baca', 6, 54, 60, 30, 'book-open'],
            ['Tangga', 80, 60, 14, 26, 'arrow-up-down'],
        ],
        3 => [
            ['Ruang diskusi 1–4', 52, 8, 42, 34, 'users-round'],
            ['Area komputer', 52, 50, 42, 18, 'monitor'],
            ['Tangga', 8, 72, 20, 18, 'arrow-up-down'],
        ],
    ];

    /**
     * The floor plan becomes editable: floors have a real size and a version,
     * rooms, racks and fixtures are placed in metres, and each save keeps the
     * layout it replaced.
     */
    public function up(): void
    {
        Schema::create('floors', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('number')->unique();
            $table->string('name');
            $table->decimal('width_m', 6, 2);
            $table->decimal('length_m', 6, 2);
            $table->string('background_path')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
        });

        Schema::create('floor_fixtures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('floor_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('icon', 30)->default('book-open');
            $table->decimal('map_x', 6, 2);
            $table->decimal('map_y', 6, 2);
            $table->decimal('map_w', 6, 2);
            $table->decimal('map_h', 6, 2);
            $table->timestamps();
        });

        Schema::create('floor_plan_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('floor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->json('payload');
            $table->timestamp('created_at')->nullable();
        });

        Schema::table('rooms', function (Blueprint $table) {
            // Off: the area follows the drawing. On: it is an official figure typed in.
            $table->boolean('area_manual')->default(false)->after('area_m2');
        });

        $now = now();
        $numbers = collect(self::SIZES)->keys()
            ->concat(DB::table('rooms')->pluck('floor'))->concat(DB::table('racks')->pluck('floor'))
            ->map(fn ($n) => (int) $n)->unique()->sort();
        foreach ($numbers as $number) {
            $size = self::SIZES[$number] ?? 20;
            $id = DB::table('floors')->insertGetId([
                'number' => $number, 'name' => "Lantai {$number}", 'width_m' => $size, 'length_m' => $size, 'created_at' => $now, 'updated_at' => $now,
            ]);

            foreach (self::FIXTURES[$number] ?? [] as [$label, $x, $y, $w, $h, $icon]) {
                DB::table('floor_fixtures')->insert([
                    'floor_id' => $id, 'label' => $label, 'icon' => $icon, ...$this->metres($size, $x, $y, $w, $h), 'created_at' => $now, 'updated_at' => $now,
                ]);
            }

            foreach (DB::table('rooms')->where('floor', $number)->get() as $room) {
                $metres = $this->metres($size, $room->map_x, $room->map_y, $room->map_w, $room->map_h);
                DB::table('rooms')->where('id', $room->id)->update([
                    ...$metres,
                    // The recorded area stays; it follows the drawing only where the two already agree.
                    'area_manual' => abs($metres['map_w'] * $metres['map_h'] - (float) $room->area_m2) > 1,
                ]);
            }

            foreach (DB::table('racks')->where('floor', $number)->get() as $rack) {
                DB::table('racks')->where('id', $rack->id)->update($this->metres($size, $rack->map_x, $rack->map_y, $rack->map_w, $rack->map_h));
            }
        }

        Schema::table('racks', function (Blueprint $table) {
            $table->decimal('map_w', 5, 2)->default(1.2)->change();
            $table->decimal('map_h', 5, 2)->default(3)->change();
        });
    }

    public function down(): void
    {
        foreach (DB::table('floors')->get() as $floor) {
            $x = (float) $floor->width_m;
            $y = (float) $floor->length_m;
            $percent = fn ($row) => [
                'map_x' => round($row->map_x / $x * 100, 2), 'map_y' => round($row->map_y / $y * 100, 2),
                'map_w' => round($row->map_w / $x * 100, 2), 'map_h' => round($row->map_h / $y * 100, 2),
            ];
            foreach (['rooms', 'racks'] as $table) {
                foreach (DB::table($table)->where('floor', $floor->number)->get() as $row) {
                    DB::table($table)->where('id', $row->id)->update($percent($row));
                }
            }
        }

        Schema::table('racks', function (Blueprint $table) {
            $table->decimal('map_w', 5, 2)->default(6)->change();
            $table->decimal('map_h', 5, 2)->default(36)->change();
        });
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('area_manual');
        });
        Schema::dropIfExists('floor_plan_versions');
        Schema::dropIfExists('floor_fixtures');
        Schema::dropIfExists('floors');
    }

    /**
     * Percent to metres on a square floor, rounding the edges so neighbours stay touching.
     *
     * @return array{map_x: float, map_y: float, map_w: float, map_h: float}
     */
    private function metres(float $size, $x, $y, $w, $h): array
    {
        $edge = fn ($percent) => round($percent * $size / 100, 2);

        return [
            'map_x' => $edge($x), 'map_y' => $edge($y),
            'map_w' => round($edge($x + $w) - $edge($x), 2), 'map_h' => round($edge($y + $h) - $edge($y), 2),
        ];
    }
};
