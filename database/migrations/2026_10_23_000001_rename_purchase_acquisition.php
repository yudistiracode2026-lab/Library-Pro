<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** The purchase acquisition is "Pembelian" (code P on the labels), no longer "Pengadaan". */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('acquisition', 60)->default('Pembelian')->change();
        });
        DB::table('books')->where('acquisition', 'Pengadaan')->update(['acquisition' => 'Pembelian']);
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('acquisition', 60)->default('Pengadaan')->change();
        });
        DB::table('books')->where('acquisition', 'Pembelian')->update(['acquisition' => 'Pengadaan']);
    }
};
