<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_copies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20)->unique();
            $table->string('status', 12)->default('tersedia')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_copies');
    }
};
