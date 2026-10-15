<?php

namespace App\Http\Controllers\Staf;

use App\Http\Controllers\Controller;
use App\Models\BookCopy;
use App\Models\Loan;
use App\Models\Member;
use App\Services\Circulation;
use App\Support\LibrarySettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CirculationController extends Controller
{
    public function __construct(private Circulation $circulation) {}

    public function index(Request $request): Response
    {
        $tab = in_array($request->query('tab'), ['pinjam', 'kembali', 'aktif'], true) ? $request->query('tab') : 'pinjam';
        $settings = LibrarySettings::all();

        return Inertia::render('staf/sirkulasi', [
            'tab' => $tab,
            'rules' => [
                'loanDays' => $settings['loan_days'],
                'maxLoans' => $settings['max_loans'],
                'maxExtensions' => $settings['max_extensions'],
                'finePerDay' => $settings['fine_per_day'],
                'dueDate' => today()->addDays($settings['loan_days'])->translatedFormat('j M Y'),
            ],
            'counts' => [
                'open' => Loan::open()->count(),
                'overdue' => Loan::overdue()->count(),
            ],
            'borrower' => $this->borrower($request->string('anggota')->trim()->toString()),
            'returning' => $this->returning($request->string('kode')->trim()->upper()->toString()),
            'loans' => $this->openLoans($request->string('q')->trim()->toString()),
            'filters' => ['q' => $request->string('q')->toString()],
            'hints' => [
                'members' => Member::where('status', 'Aktif')->whereDoesntHave('loans', fn ($l) => $l->overdue())
                    ->orderBy('id')->limit(3)->pluck('member_number'),
                'copies' => BookCopy::where('status', BookCopy::AVAILABLE)->inRandomOrder()->limit(4)->pluck('code'),
            ],
        ]);
    }

    /**
     * Cart check while scanning: is this copy lendable to this member?
     */
    public function checkCopy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'member_id' => ['required', 'exists:members,id'],
            'code' => ['required', 'string'],
            'cart' => ['array'],
            'cart.*' => ['string'],
        ]);

        $member = Member::findOrFail($data['member_id']);
        $code = strtoupper(trim($data['code']));
        $problem = $this->circulation->memberBlock($member) ?? $this->circulation->copyProblem($member, $code, $data['cart'] ?? []);

        if ($problem) {
            return response()->json(['error' => $problem], 422);
        }

        $copy = BookCopy::with('book')->where('code', $code)->firstOrFail();

        return response()->json(['code' => $copy->code, 'title' => $copy->book->title, 'call' => $copy->book->call_number]);
    }

    public function lend(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'member_id' => ['required', 'exists:members,id'],
            'codes' => ['required', 'array', 'min:1'],
            'codes.*' => ['string', 'distinct'],
        ]);

        $member = Member::findOrFail($data['member_id']);
        $loans = $this->circulation->lend($member, array_map('strtoupper', $data['codes']), $request->user());

        return to_route('staf.sirkulasi', ['tab' => 'pinjam'])
            ->with('success', "{$loans->count()} buku dipinjam oleh {$member->name}. Jatuh tempo {$loans->first()->due_at->translatedFormat('j M Y')}.");
    }

    public function giveBack(Request $request, Loan $loan): RedirectResponse
    {
        abort_if($loan->returned_at !== null, 404);

        $data = $request->validate(['damaged' => ['boolean']]);
        $loan = $this->circulation->giveBack($loan, (bool) ($data['damaged'] ?? false), $request->user());

        $message = $loan->damaged ? 'Dikembalikan. Kondisi rusak dicatat untuk perbaikan.' : 'Buku sudah dikembalikan. Terima kasih!';

        if ($loan->fine_amount > 0) {
            $message .= ' Denda keterlambatan Rp '.number_format($loan->fine_amount, 0, ',', '.').'.';
        }

        return to_route('staf.sirkulasi', ['tab' => 'kembali'])->with('success', $message);
    }

    public function extend(Loan $loan): RedirectResponse
    {
        $this->circulation->extend($loan);

        return back()->with('success', "Diperpanjang sampai {$loan->due_at->translatedFormat('j M Y')}.");
    }

    /**
     * @return array<string, mixed>|null
     */
    private function borrower(string $number): ?array
    {
        if ($number === '') {
            return null;
        }

        $member = Member::where('member_number', $number)->first();

        if ($member === null) {
            return ['error' => 'Anggota tidak ditemukan.'];
        }

        return [
            'id' => $member->id,
            'name' => $member->name,
            'member_number' => $member->member_number,
            'study_program' => $member->study_program,
            'active' => $member->loans()->open()->count(),
            'block' => $this->circulation->memberBlock($member),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function returning(string $code): ?array
    {
        if ($code === '') {
            return null;
        }

        $loan = Loan::open()->with(['copy.book', 'member'])->whereRelation('copy', 'code', $code)->first();

        if ($loan === null) {
            return ['error' => 'Eksemplar ini tidak tercatat sedang dipinjam.'];
        }

        return [
            ...$this->loanRow($loan),
            'fine' => $this->circulation->fineFor($loan),
        ];
    }

    private function openLoans(string $q): mixed
    {
        return Loan::open()
            ->with(['copy.book', 'member'])
            ->when($q !== '', fn ($l) => $l->where(fn ($w) => $w
                ->whereRelation('copy', 'code', 'like', "%{$q}%")
                ->orWhereRelation('copy.book', 'title', 'like', "%{$q}%")
                ->orWhereRelation('member', 'name', 'like', "%{$q}%")
                ->orWhereRelation('member', 'member_number', 'like', "%{$q}%")))
            ->orderBy('due_at')
            ->paginate(25, pageName: 'hal')
            ->withQueryString()
            ->through(fn (Loan $l) => $this->loanRow($l));
    }

    /**
     * @return array<string, mixed>
     */
    private function loanRow(Loan $loan): array
    {
        return [
            'id' => $loan->id,
            'code' => $loan->copy->code,
            'title' => $loan->copy->book->title,
            'call_number' => $loan->copy->book->call_number,
            'member' => $loan->member->name,
            'member_number' => $loan->member->member_number,
            'loaned_at' => $loan->loaned_at->translatedFormat('j M Y'),
            'due_at' => $loan->due_at->translatedFormat('j M Y'),
            'days_left' => (int) today()->diffInDays($loan->due_at, false),
            'extensions' => $loan->extensions,
            'extend_problem' => $this->circulation->extensionProblem($loan),
        ];
    }
}
