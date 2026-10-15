<?php

namespace App\Http\Controllers\Staf;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\StafMenu;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $counts = User::query()
            ->selectRaw('role, count(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role');

        $stages = collect(StafMenu::pages())
            ->where('key', '!=', 'dashboard')
            ->groupBy('stage')
            ->sortKeys()
            ->map(fn ($pages, $stage) => [
                'stage' => $stage,
                'pages' => $pages->pluck('label')->values(),
            ])
            ->values();

        return Inertia::render('staf/dashboard', [
            'userCounts' => collect(UserRole::cases())->map(fn (UserRole $role) => [
                'role' => $role->value,
                'label' => $role->label(),
                'total' => (int) ($counts[$role->value] ?? 0),
            ]),
            'stages' => $stages,
        ]);
    }
}
