<?php

namespace App\Services;

use App\Models\BookCopy;
use App\Models\Loan;
use App\Models\Member;
use App\Models\User;
use App\Support\LibrarySettings;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Lending rules from Portal Staf > Pengaturan: loan length, maximum open
 * loans per member, maximum extensions, and the fine per late day.
 */
class Circulation
{
    /**
     * Problems that stop a member from borrowing at all.
     */
    public function memberBlock(Member $member): ?string
    {
        if (! $member->isActive()) {
            return "Status anggota {$member->name} sedang {$member->status}.";
        }

        if ($member->loans()->overdue()->exists()) {
            return 'Anggota ini masih punya pinjaman yang terlambat. Selesaikan pengembaliannya dulu, ya.';
        }

        return null;
    }

    /**
     * Problem with adding $code to a member's cart, or null when it can be lent.
     *
     * @param  list<string>  $cart  codes already in the cart
     */
    public function copyProblem(Member $member, string $code, array $cart): ?string
    {
        $copy = BookCopy::with('book')->where('code', $code)->first();

        if ($copy === null) {
            return 'Barcode tidak dikenali.';
        }

        if (in_array($copy->code, $cart, true)) {
            return 'Eksemplar ini sudah ada di daftar pinjam.';
        }

        if ($copy->status !== BookCopy::AVAILABLE) {
            return $copy->status === BookCopy::LOANED
                ? 'Eksemplar ini sudah tercatat dipinjam.'
                : "Eksemplar ini sedang dalam {$copy->status}.";
        }

        $max = LibrarySettings::get('max_loans');

        if ($member->loans()->open()->count() + count($cart) >= $max) {
            return "Batas pinjaman {$max} buku sudah tercapai.";
        }

        return null;
    }

    /**
     * @param  list<string>  $codes
     * @return Collection<int, Loan>
     *
     * @throws ValidationException
     */
    public function lend(Member $member, array $codes, User $staff): Collection
    {
        return DB::transaction(function () use ($member, $codes, $staff) {
            if ($problem = $this->memberBlock($member)) {
                throw ValidationException::withMessages(['member' => $problem]);
            }

            $loans = collect();
            $cart = [];

            foreach ($codes as $code) {
                if ($problem = $this->copyProblem($member, $code, $cart)) {
                    throw ValidationException::withMessages(['codes' => "{$code}: {$problem}"]);
                }

                $copy = BookCopy::where('code', $code)->lockForUpdate()->firstOrFail();
                $copy->update(['status' => BookCopy::LOANED]);

                $loans->push(Loan::create([
                    'book_copy_id' => $copy->id,
                    'member_id' => $member->id,
                    'loaned_at' => now(),
                    'due_at' => today()->addDays(LibrarySettings::get('loan_days')),
                    'loaned_by' => $staff->id,
                ]));
                $cart[] = $code;
            }

            return $loans;
        });
    }

    public function fineFor(Loan $loan): int
    {
        return $loan->daysLate() * (int) LibrarySettings::get('fine_per_day');
    }

    public function giveBack(Loan $loan, bool $damaged, User $staff): Loan
    {
        return DB::transaction(function () use ($loan, $damaged, $staff) {
            $loan->update([
                'returned_at' => now(),
                'fine_amount' => $this->fineFor($loan),
                'damaged' => $damaged,
                'returned_by' => $staff->id,
            ]);
            $loan->copy->update(['status' => $damaged ? BookCopy::REPAIR : BookCopy::AVAILABLE]);

            return $loan;
        });
    }

    public function extensionProblem(Loan $loan): ?string
    {
        $max = LibrarySettings::get('max_extensions');

        if ($loan->returned_at !== null) {
            return 'Pinjaman ini sudah dikembalikan.';
        }

        if ($loan->daysLate() > 0) {
            return 'Pinjaman yang sudah terlambat tidak bisa diperpanjang.';
        }

        if ($loan->extensions >= $max) {
            return "Batas perpanjangan {$max} kali sudah tercapai.";
        }

        return null;
    }

    /**
     * @throws ValidationException
     */
    public function extend(Loan $loan): Loan
    {
        if ($problem = $this->extensionProblem($loan)) {
            throw ValidationException::withMessages(['loan' => $problem]);
        }

        $loan->update([
            'due_at' => $loan->due_at->copy()->addDays(LibrarySettings::get('loan_days')),
            'extensions' => $loan->extensions + 1,
        ]);

        return $loan;
    }
}
