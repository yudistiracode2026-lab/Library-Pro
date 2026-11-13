<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Employee;
use App\Models\Member;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Member portal accounts. A member signs in with their NIM/NIP as both the
 * login and the password; members cannot change it.
 */
class MemberAccounts
{
    /** Cost for the NIM/NIP passwords; the hash is upgraded on the first sign-in. */
    private const STARTING_ROUNDS = 10;

    /** Creates the member's account, or gives an existing one its NIM/NIP back as the password. */
    public function resetToNumber(Member $member): User
    {
        return DB::transaction(function () use ($member) {
            $user = $member->user ?? new User;
            $user->forceFill([
                'name' => $member->name,
                'email' => $user->exists ? $user->email : $this->emailFor($member),
                'role' => UserRole::Pemustaka,
                'password' => $this->startingHash($member),
            ])->saveQuietly();

            if ($member->user_id !== $user->id) {
                $member->update(['user_id' => $user->id]);
            }
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $member->device()->delete();

            return $user;
        });
    }

    /**
     * Library staff are members too, with their NIP as the member number. A
     * member record marked inactive is made active again, a blocked one is
     * left as it is.
     */
    public function forEmployee(Employee $employee): Member
    {
        $member = Member::firstOrNew(['member_number' => $employee->nip]);

        if (! $member->exists) {
            $member->fill(['name' => $employee->name, 'type' => 'Tendik', 'study_program' => 'Tendik', 'status' => 'Aktif'])->save();
        } elseif ($member->status === 'Nonaktif') {
            $member->update(['status' => 'Aktif']);
        }

        if ($member->user_id === null) {
            $this->resetToNumber($member);
        }

        return $member;
    }

    /**
     * Accounts for every member without one, in batches.
     *
     * @param  callable(int): void  $progress  called with the number made so far
     */
    public function activateAll(bool $dryRun = false, ?callable $progress = null): int
    {
        $made = 0;
        Member::whereNull('user_id')->orderBy('id')->chunkById(200, function ($members) use ($dryRun, $progress, &$made) {
            if ($dryRun) {
                $made += $members->count();

                return;
            }

            DB::transaction(function () use ($members, &$made) {
                $now = now();
                $taken = User::whereIn('email', $members->pluck('email')->filter())->pluck('email')->flip();
                $rows = $members->mapWithKeys(fn (Member $m) => [$m->id => [
                    'name' => $m->name,
                    'email' => $this->emailFor($m, $taken->has($m->email ?? '')),
                    'role' => UserRole::Pemustaka->value,
                    'password' => $this->startingHash($m),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]]);
                User::insert($rows->values()->all());

                $ids = User::whereIn('email', $rows->pluck('email'))->pluck('id', 'email');
                foreach ($rows as $memberId => $row) {
                    Member::whereKey($memberId)->update(['user_id' => $ids[$row['email']]]);
                }
                $made += $rows->count();
            });
            $progress && $progress($made);
        });

        return $made;
    }

    /**
     * The member's own address when it is free, so "forgot password" can
     * reach them; otherwise one that only identifies the account.
     */
    private function emailFor(Member $member, ?bool $taken = null): string
    {
        $own = Str::lower(trim((string) $member->email));
        $taken ??= $own !== '' && User::where('email', $own)->exists();

        if ($own !== '' && filter_var($own, FILTER_VALIDATE_EMAIL) && ! $taken) {
            return $own;
        }

        return Str::slug($member->member_number).'.'.$member->id.'@anggota.invalid';
    }

    private function startingHash(Member $member): string
    {
        return Hash::make($member->member_number, ['rounds' => min(self::STARTING_ROUNDS, (int) config('hashing.bcrypt.rounds'))]);
    }
}
