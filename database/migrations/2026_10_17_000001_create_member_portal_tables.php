<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tables behind the member portal (design/Portal Pemustaka.dc.html and
 * Baca di Tempat.dc.html): e-book files and loans, votes on suggestions,
 * the thesis repository read on site, and reading sessions.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('file_path')->nullable()->after('status');
        });

        Schema::table('clearance_requests', function (Blueprint $table) {
            $table->string('thesis_advisor')->nullable()->after('thesis_title');
            $table->text('thesis_abstract')->nullable()->after('thesis_advisor');
        });

        Schema::create('ebook_loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->dateTime('borrowed_at');
            $table->dateTime('due_at');
            $table->dateTime('returned_at')->nullable();
            $table->unsignedSmallInteger('last_page')->default(1);
            $table->timestamps();

            $table->index(['member_id', 'returned_at']);
        });

        Schema::create('suggestion_votes', function (Blueprint $table) {
            $table->foreignId('collection_suggestion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->primary(['collection_suggestion_id', 'member_id']);
        });

        Schema::create('theses', function (Blueprint $table) {
            $table->id();
            $table->string('type', 12)->index();
            $table->string('title');
            $table->string('author');
            $table->string('member_number', 30)->nullable();
            $table->string('study_program')->nullable();
            $table->unsignedSmallInteger('year');
            $table->string('advisor')->nullable();
            $table->string('keywords')->nullable();
            $table->unsignedSmallInteger('pages')->nullable();
            $table->text('abstract')->nullable();
            $table->string('call_number', 40)->nullable();
            $table->string('file_path')->nullable();
            $table->foreignId('clearance_request_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('reading_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thesis_id')->constrained('theses')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->dateTime('started_at');
            $table->dateTime('ended_at')->nullable();
            $table->unsignedSmallInteger('max_page')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_sessions');
        Schema::dropIfExists('theses');
        Schema::dropIfExists('suggestion_votes');
        Schema::dropIfExists('ebook_loans');
        Schema::table('clearance_requests', fn (Blueprint $table) => $table->dropColumn(['thesis_advisor', 'thesis_abstract']));
        Schema::table('books', fn (Blueprint $table) => $table->dropColumn('file_path'));
    }
};
