<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cameras watched from the staff portal and their incident log. Video
     * comes from the NVR through stream_url (MJPEG or snapshot image).
     */
    public function up(): void
    {
        Schema::create('cameras', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->unsignedTinyInteger('floor');
            $table->string('area', 30);
            $table->string('stream_url', 500)->nullable();
            $table->boolean('online')->default(true);
            $table->boolean('recording')->default(true);
            $table->timestamps();
        });

        Schema::create('camera_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('camera_id')->constrained()->cascadeOnDelete();
            $table->dateTime('occurred_at')->index();
            $table->string('kind', 20);
            $table->string('description');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('camera_events');
        Schema::dropIfExists('cameras');
    }
};
