<?php

namespace App\Console\Commands;

use App\Models\Member;
use App\Support\NameCase;
use Illuminate\Console\Command;

/**
 * Rewrites every member name in Title Case (see NameCase). New and edited
 * members are normalised on save; this fixes the existing rows, e.g. after
 * importing the SLiMS data.
 */
class TitleCaseMemberNames extends Command
{
    protected $signature = 'pemustaka:rapikan-nama {--coba : Tampilkan contoh perubahan tanpa menyimpan}';

    protected $description = 'Ubah nama seluruh pemustaka menjadi Title Case';

    public function handle(): int
    {
        $changes = [];

        Member::query()->select(['id', 'name'])->orderBy('id')->each(function (Member $m) use (&$changes) {
            $name = NameCase::title($m->name);

            if ($name !== $m->name) {
                $changes[$m->id] = [$m->name, $name];
            }
        });

        $this->table(['Sebelum', 'Sesudah'], array_slice(array_values($changes), 0, 15));
        $this->line(number_format(count($changes), 0, ',', '.').' nama akan diubah.');

        if ($this->option('coba') || $changes === []) {
            return self::SUCCESS;
        }

        foreach ($changes as $id => [, $name]) {
            // Without events/timestamps: this is a formatting fix, not an edit.
            Member::whereKey($id)->toBase()->update(['name' => $name]);
        }

        $this->info('Selesai.');

        return self::SUCCESS;
    }
}
