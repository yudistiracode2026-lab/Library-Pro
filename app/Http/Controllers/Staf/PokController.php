<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\PokAccount;
use App\Models\PokActivity;
use App\Models\PokItem;
use App\Models\PokProgress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Petunjuk Operasional Kegiatan (admin): the budget of each year as
 * activity -> account -> detail line. Detail lines carry the pagu; their
 * realisation is entered as dated amounts (never more than the pagu in
 * all), and "periode lalu / ini" follow from the month being reported.
 */
class PokController extends Controller
{
    private const AMOUNTS = ['pagu', 'lock_pagu', 'previous', 'current'];

    public function index(Request $request): Response
    {
        $years = PokActivity::distinct()->orderByDesc('year')->pluck('year');
        $year = $request->integer('tahun') ?: ($years->first() ?? (int) now()->year);
        // The month reported on: this month for this year, December for past years.
        $month = $request->integer('bulan') ?: ($year === (int) now()->year ? (int) now()->month : 12);
        $month = max(1, min(12, $month));
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();

        $activities = PokActivity::where('year', $year)->orderBy('code')->with('accounts.items.progress.user')->get();

        $rows = $activities->map(function (PokActivity $activity) use ($start, $end) {
            $accounts = $activity->accounts->map(function (PokAccount $account) use ($start, $end) {
                $items = $account->items->map(function (PokItem $i) use ($start, $end) {
                    $spent = $i->progress->sum('amount');

                    return [
                        'id' => $i->id, 'code' => $i->code, 'name' => $i->name,
                        ...$this->figures([
                            'pagu' => $i->pagu,
                            'lock_pagu' => $i->lock_pagu,
                            'previous' => $i->progress->filter(fn (PokProgress $p) => $p->date->lt($start))->sum('amount'),
                            'current' => $i->progress->filter(fn (PokProgress $p) => $p->date->between($start, $end))->sum('amount'),
                        ]),
                        // What can still be entered, whatever the period.
                        'available' => max(0, $i->pagu - $spent),
                        'progress' => $i->progress->map(fn (PokProgress $p) => [
                            'id' => $p->id,
                            'date' => $p->date->toDateString(),
                            'label' => $p->date->translatedFormat('j M Y'),
                            'amount' => $p->amount,
                            'by' => $p->user?->name,
                        ])->values(),
                    ];
                });

                return ['id' => $account->id, 'code' => $account->code, 'name' => $account->name, ...$this->sum($items), 'items' => $items];
            });

            return ['id' => $activity->id, 'code' => $activity->code, 'name' => $activity->name, ...$this->sum($accounts), 'accounts' => $accounts];
        });

        return Inertia::render('staf/pok', [
            'year' => $year,
            'month' => $month,
            'periodLabel' => $start->translatedFormat('F Y'),
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
        $data = $this->itemData($request, $item->pok_account_id, $item->id);
        $spent = (int) $item->progress()->sum('amount');
        if ($data['pagu'] < $spent) {
            throw ValidationException::withMessages(['pagu' => 'Pagu tidak boleh lebih kecil dari realisasi yang sudah diinput ('.$this->rupiah($spent).').']);
        }
        $item->update($data);

        return back()->with('success', 'Rincian diperbarui.');
    }

    public function destroyItem(PokItem $item): RedirectResponse
    {
        $item->delete();

        return back()->with('success', 'Rincian dihapus.');
    }

    /** Records realisation on a detail line; the lines's total stays within its pagu. */
    public function storeProgress(Request $request, PokItem $item): RedirectResponse
    {
        $year = $item->account->activity->year;
        $available = max(0, $item->pagu - (int) $item->progress()->sum('amount'));

        $data = $request->validate([
            'date' => ['required', 'date', "after_or_equal:{$year}-01-01", "before_or_equal:{$year}-12-31"],
            'amount' => ['required', 'integer', 'min:1', 'max:'.$available],
        ], [
            'date.after_or_equal' => "Tanggal harus di tahun anggaran {$year}.",
            'date.before_or_equal' => "Tanggal harus di tahun anggaran {$year}.",
            'amount.max' => $available > 0
                ? 'Melebihi pagu. Yang masih bisa diinput paling banyak '.$this->rupiah($available).'.'
                : 'Realisasi rincian ini sudah mencapai pagu.',
        ], ['date' => 'tanggal', 'amount' => 'nominal']);

        $item->progress()->create([...$data, 'user_id' => $request->user()->id]);

        return back()->with('success', 'Progres '.$this->rupiah((int) $data['amount'])." dicatat untuk {$item->code} {$item->name}.");
    }

    public function destroyProgress(PokProgress $progress): RedirectResponse
    {
        $progress->delete();

        return back()->with('success', 'Progres dihapus.');
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

    private function rupiah(int $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
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
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function codeAndName(Request $request, string $table, string $parentColumn, int $parentId, ?int $ignore = null, array $extra = []): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:30', Rule::unique($table)->where($parentColumn, $parentId)->ignore($ignore)],
            'name' => ['required', 'string', 'max:255'],
            ...$extra,
        ], [], ['code' => 'kode', 'name' => 'uraian', 'pagu' => 'pagu', 'lock_pagu' => 'lock pagu']);
    }

    /**
     * @return array<string, mixed>
     */
    private function itemData(Request $request, int $accountId, ?int $ignore = null): array
    {
        $amount = ['required', 'integer', 'min:0', 'max:999999999999'];

        return $this->codeAndName($request, 'pok_items', 'pok_account_id', $accountId, $ignore, ['pagu' => $amount, 'lock_pagu' => $amount]);
    }
}
