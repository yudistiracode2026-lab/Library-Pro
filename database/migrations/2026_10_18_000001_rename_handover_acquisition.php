<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The handover source now covers students too: "Penyerahan dosen/tendik
 * tugas belajar" becomes "Penyerahan mahasiswa, tendik dan dosen".
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('books')->where('acquisition', 'Penyerahan dosen/tendik tugas belajar')
            ->update(['acquisition' => 'Penyerahan mahasiswa, tendik dan dosen']);
    }

    public function down(): void
    {
        DB::table('books')->where('acquisition', 'Penyerahan mahasiswa, tendik dan dosen')
            ->update(['acquisition' => 'Penyerahan dosen/tendik tugas belajar']);
    }
};
