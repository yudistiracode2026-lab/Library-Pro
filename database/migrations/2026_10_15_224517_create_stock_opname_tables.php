<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stock-taking sessions and the result recorded for each copy checked.
     */
    public function up(): void
    {
        Schema::create('opname_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->dateTime('started_at');
            $table->dateTime('finished_at')->nullable();
            $table->foreignId('started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('opname_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opname_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('book_copy_id')->constrained()->cascadeOnDelete();
            $table->string('result', 10);
            $table->dateTime('checked_at');
            $table->foreignId('checked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['opname_session_id', 'book_copy_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opname_checks');
        Schema::dropIfExists('opname_sessions');
    }
};
