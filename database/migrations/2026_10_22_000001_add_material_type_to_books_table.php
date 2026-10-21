<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jenis bahan (material type) as in INLISLite, next to the collection
     * sub-type. Existing titles get the usual one for their kind.
     */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('material_type', 30)->nullable()->after('collection_type')->index();
        });

        DB::table('books')->where('type', 'ebook')->update(['material_type' => 'Sumber elektronik']);
        DB::table('books')->whereNull('material_type')->where('collection_type', 'Jurnal & majalah')->update(['material_type' => 'Terbitan berkala']);
        DB::table('books')->whereNull('material_type')->where('collection_type', 'Peta & atlas')->update(['material_type' => 'Bahan kartografis']);
        DB::table('books')->whereNull('material_type')->update(['material_type' => 'Monograf']);
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex(['material_type']);
            $table->dropColumn('material_type');
        });
    }
};
