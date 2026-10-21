<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Member;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Member portal accounts. A member signs in with their NIM/NIP; a new or
 * reset account has that NIM/NIP as its password and must change it on the
 * first sign-in.
 */
class MemberAccounts
{
    /** Cost for the starting passwords; the hash is upgraded on the first sign-in. */
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
                'must_change_password' => true,
            ])->saveQuietly();

            if ($member->user_id !== $user->id) {
                $member->update(['user_id' => $user->id]);
            }
            DB::table('sessions')->where('user_id', $user->id)->delete();

            return $user;
        });
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
                    'must_change_password' => true,
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
