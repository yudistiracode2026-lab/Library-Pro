<?php

namespace App\Console\Commands;

use App\Models\Member;
use App\Services\MemberAccounts;
use Illuminate\Console\Command;

class ActivateMemberAccounts extends Command
{
    protected $signature = 'pemustaka:aktifkan-akun {--coba : Hitung saja, tanpa membuat akun}';

    protected $description = 'Membuat akun portal untuk semua pemustaka yang belum punya; kata sandi awal = NIM/NIP, wajib diganti saat masuk pertama';

    public function handle(MemberAccounts $accounts): int
    {
        $waiting = Member::whereNull('user_id')->count();
        if ($this->option('coba')) {
            $this->info("Akan dibuat: {$waiting} akun.");

            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($waiting);
        $made = $accounts->activateAll(progress: fn (int $done) => $bar->setProgress($done));
        $bar->finish();
        $this->newLine();
        $this->info("Dibuat: {$made} akun. Kata sandi awal = NIM/NIP masing-masing, wajib diganti saat masuk pertama.");

        return self::SUCCESS;
    }
}
