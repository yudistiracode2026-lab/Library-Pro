<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Accreditation per Perpusnas Kepka No. 197/2025: the 56 key indicators
     * (stored as data so instrument changes need no code release), the
     * physical evidence for each, and frozen assessment snapshots.
     */
    public function up(): void
    {
        Schema::create('indicators', function (Blueprint $table) {
            $table->id();
            $table->string('number', 6)->unique();
            $table->unsignedTinyInteger('component');
            $table->string('name');
            $table->string('mode', 10);
            $table->json('options');
            $table->string('source')->nullable();
            $table->string('recommendation', 500)->nullable();
            $table->unsignedTinyInteger('manual_score')->nullable();
            $table->string('manual_value')->nullable();
            $table->text('manual_note')->nullable();
            $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('assessed_at')->nullable();
            $table->foreignId('pic_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->date('due_date')->nullable();
            $table->unsignedSmallInteger('position');
            $table->timestamps();
        });

        Schema::create('evidence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('indicator_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('file_path')->nullable();
            $table->string('original_name')->nullable();
            $table->unsignedInteger('size')->nullable();
            $table->string('status', 20)->default('Belum ada')->index();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('uploaded_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->date('valid_until')->nullable();
            $table->timestamps();
        });

        Schema::create('accreditation_snapshots', function (Blueprint $table) {
            $table->id();
            $table->dateTime('taken_at');
            $table->decimal('final_score', 5, 2);
            $table->string('predicate', 30);
            $table->json('scores');
            $table->foreignId('taken_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accreditation_snapshots');
        Schema::dropIfExists('evidence');
        Schema::dropIfExists('indicators');
    }
};
