<?php

namespace App\Http\Controllers\Staf\Master;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Staf\Master\Concerns\SortsRecords;
use App\Models\Member;
use App\Services\MemberAccounts;
use App\Services\MemberImport;
use App\Support\AuthorName;
use App\Support\CsvExport;
use App\Support\MasterOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Common\Exception\IOException;
use OpenSpout\Reader\Exception\ReaderException;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MemberController extends Controller
{
    use SortsRecords;

    public function index(Request $request): Response
    {
        $members = $this->sorted($this->query($request), $request, $this->sortColumns(), fn ($m) => $m->orderBy('name'))->paginate(25)->withQueryString();

        return Inertia::render('staf/master/pemustaka', [
            'records' => $members->through(fn (Member $m) => [
                ...$m->only(['id', 'member_number', 'name', 'type', 'study_program', 'email', 'status']),
                'has_account' => $m->user_id !== null,
                'open_loans' => $m->open_loans_count,
            ]),
            'filters' => ['q' => $request->string('q')->toString(), ...$this->sortFilters($request, $this->sortColumns())],
            'importReport' => $request->session()->get('importReport'),
            'options' => [
                'types' => MasterOptions::forSelect(MasterOptions::MEMBER_TYPES),
                'studyPrograms' => MasterOptions::forSelect(MasterOptions::STUDY_PROGRAMS),
                'statuses' => MasterOptions::forSelect(MasterOptions::MEMBER_STATUSES),
            ],
        ]);
    }

    public function store(Request $request, MemberAccounts $accounts): RedirectResponse
    {
        $accounts->resetToNumber(Member::create($this->validated($request)));

        return back()->with('success', 'Pemustaka ditambahkan. Masuk portal dengan NIM/NIP sebagai nama pengguna dan kata sandi.');
    }

    /** Gives the member their NIM/NIP back as the portal password, for one who forgot it. */
    public function resetPassword(Member $record, MemberAccounts $accounts): RedirectResponse
    {
        $accounts->resetToNumber($record);

        return back()->with('success', "Kata sandi portal {$record->name} kembali ke NIM/NIP ({$record->member_number}).");
    }

    /** Adds members from an Excel or CSV file, each with a portal account. */
    public function import(Request $request, MemberImport $import): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:5120', 'extensions:xlsx,csv'],
            'default_type' => ['required', Rule::in(MasterOptions::MEMBER_TYPES)],
            'default_program' => ['required', Rule::in(['D4 Pertanahan', 'D1 Pengukuran dan Pemetaan Kadastral'])],
        ], ['file.extensions' => 'Unggah berkas Excel (.xlsx) atau CSV.'], ['file' => 'berkas']);

        $file = $data['file'];
        try {
            $report = $import->run($file->getRealPath(), Str::lower($file->getClientOriginalExtension()), $data['default_type'], $data['default_program']);
        } catch (ReaderException|IOException) {
            return back()->with('error', 'Berkas tidak bisa dibaca. Simpan ulang sebagai Excel (.xlsx) atau CSV, lalu unggah lagi.');
        }

        return back()
            ->with($report['added'] > 0 ? 'success' : 'error', $report['added'] > 0
                ? "{$report['added']} pemustaka ditambahkan. Masing-masing masuk portal dengan NIM/NIP sebagai nama pengguna dan kata sandi."
                : 'Tidak ada pemustaka baru yang ditambahkan.')
            ->with('importReport', $report);
    }

    /** An empty Excel sheet to fill in, its NIM/NIP column already set to text. */
    public function importTemplate(): BinaryFileResponse
    {
        $path = tempnam(sys_get_temp_dir(), 'templat').'.xlsx';
        $writer = new XlsxWriter;
        $writer->getOptions()->setColumnWidth(22, 1);
        $writer->getOptions()->setColumnWidth(36, 2);
        $writer->getOptions()->setColumnWidthForRange(30, 3, 6);
        $writer->openToFile($path);
        $writer->getCurrentSheet()->setName('Pemustaka');

        $writer->addRow(Row::fromValues(['NIM/NIP', 'Nama', 'Jenis', 'Program studi', 'Email', 'Status'], (new Style)->setFontBold()));
        // Excel keeps leading zeros and all 18 digits of a NIP only in text cells.
        $text = (new Style)->setFormat('@');
        for ($i = 0; $i < 3000; $i++) {
            $writer->addRow(Row::fromValuesWithStyles([''], null, [$text]));
        }

        $writer->addNewSheetAndMakeItCurrent();
        $writer->getCurrentSheet()->setName('Petunjuk');
        $writer->getOptions()->setColumnWidth(110, 1);
        foreach ([
            'Isi lembar "Pemustaka" mulai baris 2. Satu baris untuk satu orang. Jangan ubah judul kolom di baris 1.',
            'NIM/NIP dan Nama wajib diisi. Kolom NIM/NIP sudah berformat Teks supaya angka nol di depan dan 18 digit NIP tidak berubah.',
            'Jenis: Mahasiswa, Dosen, Tendik, atau Umum. Pustakawan dan tenaga kependidikan diisi Tendik (kata "Pustakawan" juga diterima).',
            'Program studi hanya untuk Mahasiswa: D4 Pertanahan atau D1 Pengukuran dan Pemetaan Kadastral.',
            'Kolom yang dikosongkan memakai pilihan bawaan di jendela impor. Email boleh kosong. Status kosong berarti Aktif.',
            'NIM/NIP yang sudah terdaftar dilewati, jadi berkas yang sama aman diunggah ulang setelah memperbaiki baris yang dilaporkan.',
            'Setiap pemustaka baru langsung punya akun portal: nama pengguna dan kata sandinya sama dengan NIM/NIP.',
        ] as $line) {
            $writer->addRow(Row::fromValues([$line]));
        }
        $writer->close();

        return response()->download($path, 'templat-impor-pemustaka.xlsx')->deleteFileAfterSend();
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

        DB::transaction(function () use ($record) {
            $user = $record->user;
            $record->delete();
            $user?->delete();
        });

        return back()->with('success', 'Pemustaka dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->orderBy('name')->lazy()
            ->map(fn (Member $m) => [$m->name, $m->member_number, $m->study_program, $m->type, $m->email, $m->status]);

        return CsvExport::download('pemustaka', ['Nama', 'NIM / NIP', 'Program studi', 'Jenis', 'Email', 'Status'], $rows);
    }

    /**
     * Columns of the list that can be sorted by their header. NIM/NIP sort
     * as numbers: "9182415" comes before "20220311".
     *
     * @return array<string, mixed>
     */
    private function sortColumns(): array
    {
        return [
            'nama' => 'name',
            'nim' => $this->numeric('member_number'),
            'prodi' => 'study_program',
            'jenis' => 'type',
            'akun' => fn ($m, $direction) => $m->orderByRaw("CASE WHEN user_id IS NULL THEN 1 ELSE 0 END {$direction}"),
            'pinjaman' => 'open_loans_count',
            'status' => 'status',
        ];
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
