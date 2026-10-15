<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Library visits: members (via kiosk QR or staff entry) and guests.
     */
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_name')->nullable();
            $table->string('guest_org')->nullable();
            $table->string('purpose', 40);
            $table->string('method', 10);
            $table->dateTime('checked_in_at')->index();
            $table->dateTime('checked_out_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['member_id', 'checked_out_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
