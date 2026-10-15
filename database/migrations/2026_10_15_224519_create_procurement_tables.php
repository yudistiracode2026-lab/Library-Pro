<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Procurement sources (new publications, member suggestions) and the
     * semester's procurement list.
     */
    public function up(): void
    {
        Schema::create('new_publications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('author');
            $table->string('publisher');
            $table->unsignedSmallInteger('year');
            $table->char('ddc_class', 3);
            $table->unsignedInteger('price');
            $table->string('reason');
            $table->timestamps();
        });

        Schema::create('collection_suggestions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('author');
            $table->foreignId('member_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('votes')->default(1);
            $table->string('status', 20)->default('Diusulkan')->index();
            $table->string('note')->nullable();
            $table->foreignId('book_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('procurement_items', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('author');
            $table->string('publisher')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->char('ddc_class', 3)->nullable();
            $table->unsignedInteger('price');
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->string('source', 20);
            $table->foreignId('book_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('new_publication_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('suggestion_id')->nullable()->constrained('collection_suggestions')->nullOnDelete();
            $table->dateTime('submitted_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procurement_items');
        Schema::dropIfExists('collection_suggestions');
        Schema::dropIfExists('new_publications');
    }
};
