<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Bebas pustaka" requests. Students submit them from the member portal;
     * staff verify four requirements: no open loans, the thesis PDF, the
     * donated book, and the bound hardcopy.
     */
    public function up(): void
    {
        Schema::create('clearance_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->string('thesis_title');
            $table->dateTime('submitted_at');
            $table->string('status', 20)->default('Menunggu')->index();
            $table->text('note')->nullable();

            // Requirement 2: digital thesis
            $table->string('thesis_file')->nullable();
            $table->json('thesis_checks')->nullable();
            $table->dateTime('thesis_verified_at')->nullable();
            $table->foreignId('thesis_verified_by')->nullable()->constrained('users')->nullOnDelete();

            // Requirement 3: donated book
            $table->string('donation_title')->nullable();
            $table->string('donation_author')->nullable();
            $table->string('donation_publisher')->nullable();
            $table->unsignedSmallInteger('donation_year')->nullable();
            $table->string('donation_isbn', 20)->nullable();
            $table->unsignedTinyInteger('donation_copies')->default(1);
            $table->string('donation_status', 20)->nullable();
            $table->foreignId('donation_book_id')->nullable()->constrained('books')->nullOnDelete();

            // Requirement 4: bound hardcopy
            $table->dateTime('hardcopy_scheduled_at')->nullable();
            $table->dateTime('hardcopy_received_at')->nullable();

            // Outcome
            $table->dateTime('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('letter_number', 60)->nullable()->unique();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clearance_requests');
    }
};
