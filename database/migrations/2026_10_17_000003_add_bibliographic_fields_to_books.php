<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The catalogue fields of the old SLiMS form: several authors per title,
 * subject headings, the full classification number, collation, place,
 * language, edition, series, abstract, cover image, and "buku unggulan".
 *
 * books.author_id stays as the main author (first in book_author) so the
 * rest of the application keeps working with a single name.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('classification', 40)->nullable()->after('ddc_class');
            $table->string('edition', 50)->nullable()->after('isbn');
            $table->string('publish_place', 100)->nullable()->after('publisher_id');
            $table->string('collation', 100)->nullable()->after('year');
            $table->string('language', 30)->default('Indonesia')->after('collation');
            $table->string('series_title')->nullable()->after('title');
            $table->text('abstract')->nullable();
            $table->string('cover_path')->nullable();
            $table->boolean('featured')->default(false)->index();
        });

        Schema::create('book_author', function (Blueprint $table) {
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position')->default(0);
            $table->primary(['book_id', 'author_id']);
        });

        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('book_subject', function (Blueprint $table) {
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position')->default(0);
            $table->primary(['book_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_subject');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('book_author');

        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex(['featured']);
            $table->dropColumn(['classification', 'edition', 'publish_place', 'collation', 'language', 'series_title', 'abstract', 'cover_path', 'featured']);
        });
    }
};
