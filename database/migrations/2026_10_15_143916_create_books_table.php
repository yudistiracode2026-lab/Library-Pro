<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One table for both printed books ("fisik") and e-books; the
     * type-specific columns are nullable for the other type.
     */
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('type', 10)->index();
            $table->string('title');
            $table->foreignId('author_id')->constrained()->restrictOnDelete();
            $table->foreignId('publisher_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('isbn', 20)->nullable();
            $table->char('ddc_class', 3);
            $table->string('collection_type', 40);
            $table->string('acquisition', 30)->default('Pengadaan');
            $table->string('donor')->nullable();

            // Printed books
            $table->string('call_number', 40)->nullable();
            $table->foreignId('rack_id')->nullable()->constrained()->nullOnDelete();

            // E-books
            $table->string('format', 10)->nullable();
            $table->decimal('file_size_mb', 6, 1)->nullable();
            $table->unsignedSmallInteger('license_count')->nullable();
            $table->string('status', 10)->nullable();

            $table->timestamps();

            $table->index('title');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
