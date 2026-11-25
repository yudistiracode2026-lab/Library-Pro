<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usage: ->middleware('role:admin,kepala'), or 'role:staf' for every staff level.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if ($roles === ['staf']) {
            abort_unless($request->user()?->isStaff(), 403);

            return $next($request);
        }

        $allowed = array_map(fn (string $role) => UserRole::from($role), $roles);

        abort_unless($request->user()?->hasRole(...$allowed), 403);

        return $next($request);
    }
}
