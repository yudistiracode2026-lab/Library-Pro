<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per lent copy. An open loan has returned_at = null.
     */
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_copy_id')->constrained()->restrictOnDelete();
            $table->foreignId('member_id')->constrained()->restrictOnDelete();
            $table->dateTime('loaned_at');
            $table->date('due_at');
            $table->unsignedTinyInteger('extensions')->default(0);
            $table->dateTime('returned_at')->nullable();
            $table->unsignedInteger('fine_amount')->default(0);
            $table->boolean('damaged')->default(false);
            $table->foreignId('loaned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('returned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['member_id', 'returned_at']);
            $table->index(['book_copy_id', 'returned_at']);
            $table->index(['returned_at', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
