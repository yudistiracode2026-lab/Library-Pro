<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('member_number', 30)->unique();
            $table->string('name');
            $table->string('type', 20);
            $table->string('study_program')->nullable();
            $table->string('email')->nullable()->unique();
            $table->string('status', 20)->default('Aktif');
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
