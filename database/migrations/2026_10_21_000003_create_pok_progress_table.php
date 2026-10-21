<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Realisation is entered as dated amounts against a detail line; the
     * "periode lalu / ini" figures are worked out from the dates instead of
     * being typed in. Amounts already typed become entries.
     */
    public function up(): void
    {
        Schema::create('pok_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pok_item_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedBigInteger('amount');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['pok_item_id', 'date']);
        });

        $now = now();
        $rows = DB::table('pok_items')
            ->join('pok_accounts', 'pok_accounts.id', '=', 'pok_items.pok_account_id')
            ->join('pok_activities', 'pok_activities.id', '=', 'pok_accounts.pok_activity_id')
            ->where(fn ($q) => $q->where('pok_items.previous', '>', 0)->orWhere('pok_items.current', '>', 0))
            ->get(['pok_items.id', 'pok_items.previous', 'pok_items.current', 'pok_activities.year']);
        foreach ($rows as $row) {
            $today = $now->year === (int) $row->year ? $now->toDateString() : "{$row->year}-12-31";
            foreach ([[$row->previous, "{$row->year}-01-01"], [$row->current, $today]] as [$amount, $date]) {
                if ($amount > 0) {
                    DB::table('pok_progress')->insert(['pok_item_id' => $row->id, 'date' => $date, 'amount' => $amount, 'created_at' => $now, 'updated_at' => $now]);
                }
            }
        }

        Schema::table('pok_items', function (Blueprint $table) {
            $table->dropColumn(['previous', 'current']);
        });
    }

    public function down(): void
    {
        Schema::table('pok_items', function (Blueprint $table) {
            $table->unsignedBigInteger('previous')->default(0);
            $table->unsignedBigInteger('current')->default(0);
        });
        Schema::dropIfExists('pok_progress');
    }
};
