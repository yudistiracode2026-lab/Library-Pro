<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Support\StafMenu;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Placeholder for staff pages whose module has not been built yet.
 */
class PageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $key = str($request->route()->getName())->after('staf.')->toString();
        $page = StafMenu::find($key);

        abort_if($page === null, 404);

        return Inertia::render('staf/segera-hadir', [
            'page' => [
                'title' => $page['title'],
                'group' => $page['group'],
                'icon' => $page['icon'],
                'description' => $page['description'],
                'stage' => $page['stage'],
            ],
        ]);
    }
}
