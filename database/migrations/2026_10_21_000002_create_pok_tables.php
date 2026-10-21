<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Petunjuk Operasional Kegiatan: per budget year, activities (051.0A),
     * their accounts (521213) and the detail lines (001264) that carry the
     * amounts. Activity and account amounts are the sums of their lines.
     */
    public function up(): void
    {
        Schema::create('pok_activities', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year')->index();
            $table->string('code', 30);
            $table->string('name');
            $table->timestamps();

            $table->unique(['year', 'code']);
        });

        Schema::create('pok_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pok_activity_id')->constrained()->cascadeOnDelete();
            $table->string('code', 30);
            $table->string('name');
            $table->timestamps();

            $table->unique(['pok_activity_id', 'code']);
        });

        Schema::create('pok_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pok_account_id')->constrained()->cascadeOnDelete();
            $table->string('code', 30);
            $table->string('name');
            $table->unsignedBigInteger('pagu')->default(0);
            $table->unsignedBigInteger('lock_pagu')->default(0);
            // Realisation before the current period and within it.
            $table->unsignedBigInteger('previous')->default(0);
            $table->unsignedBigInteger('current')->default(0);
            $table->timestamps();

            $table->unique(['pok_account_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pok_items');
        Schema::dropIfExists('pok_accounts');
        Schema::dropIfExists('pok_activities');
    }
};
