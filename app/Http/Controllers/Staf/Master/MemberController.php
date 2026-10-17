<?php

namespace App\Http\Controllers\Staf\Master;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Support\AuthorName;
use App\Support\CsvExport;
use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MemberController extends Controller
{
    public function index(Request $request): Response
    {
        $members = $this->query($request)->orderBy('name')->paginate(25)->withQueryString();

        return Inertia::render('staf/master/pemustaka', [
            'records' => $members->through(fn (Member $m) => [
                ...$m->only(['id', 'member_number', 'name', 'type', 'study_program', 'email', 'status']),
                'has_account' => $m->user_id !== null,
                'open_loans' => $m->open_loans_count,
            ]),
            'filters' => ['q' => $request->string('q')->toString()],
            'options' => [
                'types' => MasterOptions::forSelect(MasterOptions::MEMBER_TYPES),
                'studyPrograms' => MasterOptions::forSelect(MasterOptions::STUDY_PROGRAMS),
                'statuses' => MasterOptions::forSelect(MasterOptions::MEMBER_STATUSES),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Member::create($this->validated($request));

        return back()->with('success', 'Pemustaka ditambahkan.');
    }

    public function update(Request $request, Member $record): RedirectResponse
    {
        $record->update($this->validated($request, $record));

        return back()->with('success', 'Perubahan disimpan.');
    }

    public function destroy(Member $record): RedirectResponse
    {
        if ($record->loans()->exists()) {
            return back()->with('error', 'Pemustaka ini punya riwayat peminjaman. Ubah statusnya menjadi Diblokir saja, ya.');
        }

        $record->delete();

        return back()->with('success', 'Pemustaka dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->orderBy('name')->lazy()
            ->map(fn (Member $m) => [$m->name, $m->member_number, $m->study_program, $m->type, $m->email, $m->status]);

        return CsvExport::download('pemustaka', ['Nama', 'NIM / NIP', 'Program studi', 'Jenis', 'Email', 'Status'], $rows);
    }

    /**
     * @return Builder<Member>
     */
    private function query(Request $request): Builder
    {
        $q = trim($request->string('q')->toString());

        return Member::query()->withCount(['loans as open_loans_count' => fn ($l) => $l->open()])->when($q !== '', fn ($m) => $m->where(fn ($w) => $w
            ->where('name', 'like', "%{$q}%")
            ->orWhere('member_number', 'like', "%{$q}%")
            ->orWhere('email', 'like', "%{$q}%")));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Member $member = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'member_number' => ['required', 'string', 'max:30', Rule::unique('members')->ignore($member)],
            'study_program' => ['required', Rule::in(MasterOptions::STUDY_PROGRAMS)],
            'type' => ['required', Rule::in(MasterOptions::MEMBER_TYPES)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('members')->ignore($member)],
            'status' => ['required', Rule::in(MasterOptions::MEMBER_STATUSES)],
        ], [], ['name' => 'nama lengkap', 'member_number' => 'NIM / NIP', 'study_program' => 'program studi', 'type' => 'jenis']);

        return ['name' => AuthorName::person($data['name'])] + $data;
    }
}
