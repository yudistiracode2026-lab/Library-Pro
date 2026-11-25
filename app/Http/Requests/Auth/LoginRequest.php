<?php

namespace App\Http\Requests\Auth;

use App\Models\Employee;
use App\Models\Member;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // An email address, or a member's NIT/NIP as in the member portal.
            'email' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials through one of the
     * two sign-in pages: members at /login, staff at /staf/masuk. A correct
     * password at the wrong page signs nobody in and points to the right one.
     *
     * @param  'pemustaka'|'staf'  $portal
     *
     * @throws ValidationException
     */
    public function authenticate(string $portal = 'pemustaka'): void
    {
        $this->ensureIsNotRateLimited();

        $provider = Auth::getProvider();
        $user = $provider->retrieveByCredentials(['email' => $this->loginEmail($portal)]);

        if (! $user || ! $provider->validateCredentials($user, ['password' => $this->string('password')->toString()])) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if ($user->isStaff() !== ($portal === 'staf')) {
            throw ValidationException::withMessages([
                'email' => $user->isStaff()
                    ? 'Akun petugas masuk lewat halaman login staf.'
                    : 'Akun pemustaka masuk lewat halaman login pemustaka.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
        Auth::login($user, $this->boolean('remember'));
    }

    /**
     * The account email for the given login: the input itself, or the email
     * of the account behind a number: the employee with that NIP on the
     * staff page, the member with that NIT/NIP on the members' page.
     *
     * @param  'pemustaka'|'staf'  $portal
     */
    private function loginEmail(string $portal): string
    {
        $login = trim($this->string('email')->toString());

        if (str_contains($login, '@')) {
            return $login;
        }

        if ($portal === 'staf') {
            return Employee::where('nip', $login)->whereNotNull('user_id')->first()?->user?->email ?? $login;
        }

        return Member::where('member_number', $login)->whereNotNull('user_id')->first()?->user?->email ?? $login;
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
