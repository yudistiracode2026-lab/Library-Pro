<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Penyerahan dosen/tendik tugas belajar" does not fit in 30 characters.
     */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('acquisition', 60)->default('Pengadaan')->change();
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('acquisition', 30)->default('Pengadaan')->change();
        });
    }
};
