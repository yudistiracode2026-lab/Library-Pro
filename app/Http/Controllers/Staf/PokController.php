<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\PokAccount;
use App\Models\PokActivity;
use App\Models\PokItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Petunjuk Operasional Kegiatan (admin): the budget of each year as
 * activity -> account -> detail line, with realisation per period. Only
 * detail lines are typed in; the other rows and the total add them up.
 */
class PokController extends Controller
{
    private const AMOUNTS = ['pagu', 'lock_pagu', 'previous', 'current'];

    public function index(Request $request): Response
    {
        $years = PokActivity::distinct()->orderByDesc('year')->pluck('year');
        $year = $request->integer('tahun') ?: ($years->first() ?? (int) now()->year);

        $activities = PokActivity::where('year', $year)->orderBy('code')->with('accounts.items')->get();

        $rows = $activities->map(function (PokActivity $activity) {
            $accounts = $activity->accounts->map(function (PokAccount $account) {
                $items = $account->items->map(fn (PokItem $i) => [
                    'id' => $i->id, 'code' => $i->code, 'name' => $i->name, ...$this->figures($i->only(self::AMOUNTS)),
                ]);

                return ['id' => $account->id, 'code' => $account->code, 'name' => $account->name, ...$this->sum($items), 'items' => $items];
            });

            return ['id' => $activity->id, 'code' => $activity->code, 'name' => $activity->name, ...$this->sum($accounts), 'accounts' => $accounts];
        });

        return Inertia::render('staf/pok', [
            'year' => $year,
            // The years with data, plus the chosen one and the current one.
            'years' => $years->push($year, (int) now()->year)->unique()->sortDesc()->values(),
            'activities' => $rows,
            'total' => $this->sum($rows),
        ]);
    }

    public function storeActivity(Request $request): RedirectResponse
    {
        $activity = PokActivity::create($this->activityData($request));

        return to_route('staf.pok', ['tahun' => $activity->year])->with('success', 'Kegiatan ditambahkan.');
    }

    public function updateActivity(Request $request, PokActivity $activity): RedirectResponse
    {
        $activity->update($this->activityData($request, $activity));

        return to_route('staf.pok', ['tahun' => $activity->year])->with('success', 'Kegiatan diperbarui.');
    }

    public function destroyActivity(PokActivity $activity): RedirectResponse
    {
        $activity->delete();

        return back()->with('success', 'Kegiatan beserta akun dan rinciannya dihapus.');
    }

    public function storeAccount(Request $request, PokActivity $activity): RedirectResponse
    {
        $activity->accounts()->create($this->codeAndName($request, 'pok_accounts', 'pok_activity_id', $activity->id));

        return back()->with('success', 'Akun ditambahkan.');
    }

    public function updateAccount(Request $request, PokAccount $account): RedirectResponse
    {
        $account->update($this->codeAndName($request, 'pok_accounts', 'pok_activity_id', $account->pok_activity_id, $account->id));

        return back()->with('success', 'Akun diperbarui.');
    }

    public function destroyAccount(PokAccount $account): RedirectResponse
    {
        $account->delete();

        return back()->with('success', 'Akun beserta rinciannya dihapus.');
    }

    public function storeItem(Request $request, PokAccount $account): RedirectResponse
    {
        $account->items()->create($this->itemData($request, $account->id));

        return back()->with('success', 'Rincian ditambahkan.');
    }

    public function updateItem(Request $request, PokItem $item): RedirectResponse
    {
        $item->update($this->itemData($request, $item->pok_account_id, $item->id));

        return back()->with('success', 'Rincian diperbarui.');
    }

    public function destroyItem(PokItem $item): RedirectResponse
    {
        $item->delete();

        return back()->with('success', 'Rincian dihapus.');
    }

    /**
     * @param  array<string, int>  $amounts
     * @return array<string, int|float>
     */
    private function figures(array $amounts): array
    {
        $realised = $amounts['previous'] + $amounts['current'];

        return [
            ...$amounts,
            'realised' => $realised,
            'percent' => $amounts['pagu'] > 0 ? round($realised / $amounts['pagu'] * 100, 2) : 0,
            'remaining' => $amounts['pagu'] - $realised,
        ];
    }

    /**
     * @param  iterable<array<string, mixed>>  $rows
     * @return array<string, int|float>
     */
    private function sum(iterable $rows): array
    {
        $totals = array_fill_keys(self::AMOUNTS, 0);
        foreach ($rows as $row) {
            foreach (self::AMOUNTS as $key) {
                $totals[$key] += $row[$key];
            }
        }

        return $this->figures($totals);
    }

    /**
     * @return array<string, mixed>
     */
    private function activityData(Request $request, ?PokActivity $activity = null): array
    {
        return $request->validate([
            'year' => ['required', 'integer', 'between:2000,2100'],
            'code' => ['required', 'string', 'max:30', Rule::unique('pok_activities')->where('year', $request->integer('year'))->ignore($activity)],
            'name' => ['required', 'string', 'max:255'],
        ], [], ['year' => 'tahun anggaran', 'code' => 'kode', 'name' => 'uraian']);
    }

    /**
     * @return array<string, mixed>
     */
    private function codeAndName(Request $request, string $table, string $parentColumn, int $parentId, ?int $ignore = null, array $extra = []): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:30', Rule::unique($table)->where($parentColumn, $parentId)->ignore($ignore)],
            'name' => ['required', 'string', 'max:255'],
            ...$extra,
        ], [], ['code' => 'kode', 'name' => 'uraian', 'pagu' => 'pagu', 'lock_pagu' => 'lock pagu', 'previous' => 'periode lalu', 'current' => 'periode ini']);
    }

    /**
     * @return array<string, mixed>
     */
    private function itemData(Request $request, int $accountId, ?int $ignore = null): array
    {
        $amount = ['required', 'integer', 'min:0', 'max:999999999999'];

        return $this->codeAndName($request, 'pok_items', 'pok_account_id', $accountId, $ignore, array_fill_keys(self::AMOUNTS, $amount));
    }
}
