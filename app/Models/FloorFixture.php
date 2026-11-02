<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Something drawn on a floor plan that is not a room or rack: stairs, a desk, an entrance. */
class FloorFixture extends Model
{
    protected $fillable = ['floor_id', 'label', 'icon', 'map_x', 'map_y', 'map_w', 'map_h'];

    protected function casts(): array
    {
        return ['map_x' => 'float', 'map_y' => 'float', 'map_w' => 'float', 'map_h' => 'float'];
    }
}
