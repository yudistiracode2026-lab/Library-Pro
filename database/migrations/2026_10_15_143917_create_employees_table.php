<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Library staff records: "pustakawan" (functional librarians) and
     * "tendik" (support staff). Rank (pangkat) is derived from golongan.
     */
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 12)->index();
            $table->string('nip', 18)->unique();
            $table->string('name');
            $table->string('golongan', 5);
            $table->string('position');
            $table->string('status', 20)->default('Aktif');
            $table->boolean('is_head')->default(false);
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
