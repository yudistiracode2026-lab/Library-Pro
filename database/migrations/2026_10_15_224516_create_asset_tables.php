<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rooms (with floor-plan position and type), the assets in them, and
     * software licenses. Room types and areas feed the accreditation's
     * facilities indicators.
     */
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('floor');
            $table->string('name');
            $table->string('type', 20);
            $table->decimal('area_m2', 7, 1)->default(0);
            $table->decimal('map_x', 5, 2);
            $table->decimal('map_y', 5, 2);
            $table->decimal('map_w', 5, 2);
            $table->decimal('map_h', 5, 2);
            $table->boolean('outside_library')->default(false);
            $table->timestamps();
        });

        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category', 30)->index();
            $table->string('function', 60);
            $table->foreignId('room_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->string('condition', 20)->default('Baik');
            $table->unsignedSmallInteger('acquired_year')->nullable();
            $table->string('inventory_code', 40)->nullable();
            $table->timestamps();
        });

        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('usage');
            $table->string('license_type', 60)->nullable();
            $table->unsignedSmallInteger('seats')->default(1);
            $table->string('status', 20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('licenses');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('rooms');
    }
};
