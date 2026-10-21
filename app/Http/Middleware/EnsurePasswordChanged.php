<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * An account still on its starting password (the member's NIM/NIP) can only
 * open the change-password page, or sign out, until it picks a new one.
 */
class EnsurePasswordChanged
{
    private const ALLOWED = ['pemustaka.sandi', 'pemustaka.sandi.update', 'logout'];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->must_change_password && ! $request->routeIs(...self::ALLOWED)) {
            return redirect()->route('pemustaka.sandi');
        }

        return $next($request);
    }
}
