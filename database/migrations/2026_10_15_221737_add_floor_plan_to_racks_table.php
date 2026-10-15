<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Position of each rack on its floor plan, in percent of the plan's
     * width and height (as in the prototype's FLOORS data).
     */
    public function up(): void
    {
        Schema::table('racks', function (Blueprint $table) {
            $table->decimal('map_x', 5, 2)->default(0)->after('floor');
            $table->decimal('map_y', 5, 2)->default(0)->after('map_x');
            $table->decimal('map_w', 5, 2)->default(6)->after('map_y');
            $table->decimal('map_h', 5, 2)->default(36)->after('map_w');
        });
    }

    public function down(): void
    {
        Schema::table('racks', function (Blueprint $table) {
            $table->dropColumn(['map_x', 'map_y', 'map_w', 'map_h']);
        });
    }
};
