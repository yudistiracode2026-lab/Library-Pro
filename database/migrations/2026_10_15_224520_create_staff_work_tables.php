<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Daily activity logs and overtime sessions for librarians and support
     * staff (employees).
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->time('starts_at');
            $table->time('ends_at');
            $table->string('category', 40);
            $table->text('description');
            $table->string('output')->nullable();
            $table->string('status', 20)->default('Selesai');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['employee_id', 'date']);
        });

        Schema::create('overtime_sessions', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->time('starts_at');
            $table->time('ends_at');
            $table->string('activity');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('overtime_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('overtime_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->dateTime('checked_in_at')->nullable();
            $table->dateTime('checked_out_at')->nullable();
            $table->timestamps();

            $table->unique(['overtime_session_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtime_assignments');
        Schema::dropIfExists('overtime_sessions');
        Schema::dropIfExists('activity_logs');
    }
};
