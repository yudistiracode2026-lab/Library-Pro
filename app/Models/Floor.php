<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A floor of the building, with its size in metres. Rooms, racks and fixtures
 * are placed on it in metres; plans that only show them use percentages.
 */
class Floor extends Model
{
    public const FIXTURE_ICONS = ['book-open', 'door-open', 'arrow-up-down', 'monitor', 'repeat', 'users-round'];

    protected $fillable = ['number', 'name', 'width_m', 'length_m', 'background_path', 'version'];

    protected function casts(): array
    {
        return ['number' => 'integer', 'width_m' => 'float', 'length_m' => 'float', 'version' => 'integer'];
    }

    /**
     * @return HasMany<Room, $this>
     */
    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'floor', 'number');
    }

    /**
     * @return HasMany<Rack, $this>
     */
    public function racks(): HasMany
    {
        return $this->hasMany(Rack::class, 'floor', 'number');
    }

    /**
     * @return HasMany<FloorFixture, $this>
     */
    public function fixtures(): HasMany
    {
        return $this->hasMany(FloorFixture::class);
    }

    /**
     * @return HasMany<FloorPlanVersion, $this>
     */
    public function versions(): HasMany
    {
        return $this->hasMany(FloorPlanVersion::class);
    }

    public function aspect(): float
    {
        return round($this->width_m / $this->length_m, 4);
    }

    /**
     * Where something placed in metres sits on this floor, in percent.
     *
     * @return array{x: float, y: float, w: float, h: float}
     */
    public function percent(Model $placed): array
    {
        return [
            'x' => round($placed->map_x / $this->width_m * 100, 2),
            'y' => round($placed->map_y / $this->length_m * 100, 2),
            'w' => round($placed->map_w / $this->width_m * 100, 2),
            'h' => round($placed->map_h / $this->length_m * 100, 2),
        ];
    }

    /**
     * Metres from percent on a numbered floor, for the seeded layouts.
     *
     * @return array{map_x: float, map_y: float, map_w: float, map_h: float}
     */
    public static function metres(int $number, float $x, float $y, float $w, float $h): array
    {
        $floor = self::where('number', $number)->firstOrFail();
        $across = fn (float $percent) => round($percent * $floor->width_m / 100, 2);
        $down = fn (float $percent) => round($percent * $floor->length_m / 100, 2);

        return [
            'map_x' => $across($x), 'map_y' => $down($y),
            'map_w' => round($across($x + $w) - $across($x), 2), 'map_h' => round($down($y + $h) - $down($y), 2),
        ];
    }

    /**
     * The layout as the editor reads it; kept as a version before each save.
     *
     * @return array<string, mixed>
     */
    public function layout(): array
    {
        return [
            'name' => $this->name,
            'width' => $this->width_m,
            'length' => $this->length_m,
            'rooms' => $this->rooms()->orderBy('id')->get()->map(fn (Room $r) => [
                'id' => $r->id, 'name' => $r->name, 'type' => $r->type, 'area' => $r->area_m2, 'area_manual' => $r->area_manual,
                'outside' => $r->outside_library, 'x' => $r->map_x, 'y' => $r->map_y, 'w' => $r->map_w, 'h' => $r->map_h,
            ])->all(),
            'racks' => $this->racks()->orderBy('code')->get()->map(fn (Rack $r) => [
                'id' => $r->id, 'code' => $r->code, 'name' => $r->name, 'x' => $r->map_x, 'y' => $r->map_y, 'w' => $r->map_w, 'h' => $r->map_h,
            ])->all(),
            'fixtures' => $this->fixtures()->orderBy('id')->get()->map(fn (FloorFixture $f) => [
                'id' => $f->id, 'label' => $f->label, 'icon' => $f->icon, 'x' => $f->map_x, 'y' => $f->map_y, 'w' => $f->map_w, 'h' => $f->map_h,
            ])->all(),
        ];
    }
}
