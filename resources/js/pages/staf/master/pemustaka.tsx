import { Cell, StatusBadge } from '@/components/staf/master/cells';
import { MasterPage } from '@/components/staf/master/master-page';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated, type SelectOption } from '@/types';
import { router } from '@inertiajs/react';
import { Download, KeyRound, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MemberRow {
    id: number;
    member_number: string;
    name: string;
    type: string;
    study_program: string | null;
    email: string | null;
    status: string;
    has_account: boolean;
    open_loans: number;
}

interface ImportReport {
    added: number;
    existing: number;
    problems: string[];
}

interface PemustakaProps {
    records: Paginated<MemberRow>;
    filters: { q: string; urut?: string; arah?: string };
    importReport: ImportReport | null;
    options: { types: SelectOption[]; studyPrograms: SelectOption[]; statuses: SelectOption[] };
}

const select = 'text-fg-1 h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal dark:bg-slate-800';

export default function Pemustaka({ records, filters, options, importReport }: PemustakaProps) {
    const [resetting, setResetting] = useState<MemberRow | null>(null);
    const [importing, setImporting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [defaultType, setDefaultType] = useState('Mahasiswa');
    const [defaultProgram, setDefaultProgram] = useState('D4 Pertanahan');
    const [sending, setSending] = useState(false);
    const [report, setReport] = useState<ImportReport | null>(importReport);

    useEffect(() => setReport(importReport), [importReport]);

    const upload = () => {
        if (!file) return;
        router.post(
            route('staf.pemustaka.import'),
            { file, default_type: defaultType, default_program: defaultProgram },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setSending(true),
                onFinish: () => setSending(false),
                onSuccess: () => {
                    setImporting(false);
                    setFile(null);
                },
            },
        );
    };

    return (
        <StafLayout title="Master pemustaka" group="Master data">
            <MasterPage<MemberRow>
                routeKey="pemustaka"
                heading="Data pemustaka"
                description="Mahasiswa, dosen, tenaga kependidikan, dan anggota luar yang terdaftar"
                addLabel="Tambah pemustaka"
                headerActions={
                    <button
                        type="button"
                        onClick={() => setImporting(true)}
                        className="text-fg-1 flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
                    >
                        <Upload className="size-4" />
                        Impor
                    </button>
                }
                records={records}
                filters={filters}
                numbered
                grid="minmax(0,1.8fr) 130px minmax(0,1.2fr) 100px 90px 100px"
                describeRow={(m) => m.name}
                rowActions={(m) => (
                    <button
                        type="button"
                        title="Reset kata sandi portal"
                        aria-label={`Reset kata sandi portal ${m.name}`}
                        onClick={() => setResetting(m)}
                        className="text-fg-2 grid size-[34px] cursor-pointer place-items-center rounded-[9px] hover:bg-teal-50 hover:text-teal-700"
                    >
                        <KeyRound className="size-4" />
                    </button>
                )}
                columns={[
                    {
                        label: 'Nama',
                        sort: 'nama',
                        render: (m) => (
                            <Cell bold sub={m.email}>
                                {m.name}
                            </Cell>
                        ),
                    },
                    { label: 'NIM / NIP', sort: 'nim', render: (m) => <Cell mono>{m.member_number}</Cell> },
                    { label: 'Program studi', sort: 'prodi', render: (m) => <Cell>{m.study_program}</Cell> },
                    { label: 'Jenis', sort: 'jenis', render: (m) => <Cell>{m.type}</Cell> },
                    { label: 'Pinjaman', sort: 'pinjaman', render: (m) => <Cell>{`${m.open_loans} aktif`}</Cell> },
                    { label: 'Status', sort: 'status', render: (m) => <StatusBadge status={m.status} /> },
                ]}
                form={{
                    title: (m) => (m ? 'Ubah pemustaka' : 'Tambah pemustaka'),
                    empty: { name: '', member_number: '', study_program: 'D4 Pertanahan', type: 'Mahasiswa', email: '', status: 'Aktif' },
                    fromRow: (m) => ({
                        name: m.name,
                        member_number: m.member_number,
                        study_program: m.study_program ?? '',
                        type: m.type,
                        email: m.email ?? '',
                        status: m.status,
                    }),
                    fields: [
                        { name: 'name', label: 'Nama lengkap', span: 2, required: true },
                        { name: 'member_number', label: 'NIM / NIP', required: true },
                        { name: 'study_program', label: 'Program studi', type: 'select', options: options.studyPrograms, required: true },
                        { name: 'type', label: 'Jenis', type: 'select', options: options.types, required: true },
                        { name: 'email', label: 'Email', type: 'email' },
                        { name: 'status', label: 'Status', type: 'select', options: options.statuses, required: true },
                    ],
                }}
            />

            <Dialog open={resetting !== null} onOpenChange={(open) => !open && setResetting(null)}>
                <DialogContent className="rounded-xl p-7 sm:max-w-[460px]">
                    <DialogTitle className="font-display text-xl font-bold">Reset kata sandi portal?</DialogTitle>
                    <DialogDescription className="text-fg-2 text-[15px] leading-relaxed">
                        Kata sandi portal <b>{resetting?.name}</b> dikembalikan ke NIM/NIP-nya (
                        <span className="font-mono">{resetting?.member_number}</span>).
                        {resetting && !resetting.has_account && ' Akun portalnya juga dibuat sekarang.'}
                    </DialogDescription>
                    <div className="mt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setResetting(null)}
                            className="h-11 cursor-pointer rounded-md border border-slate-200 bg-white px-[18px] font-semibold hover:bg-slate-100 dark:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                resetting &&
                                router.post(
                                    route('staf.pemustaka.reset-password', { record: resetting.id }),
                                    {},
                                    {
                                        preserveScroll: true,
                                        onFinish: () => setResetting(null),
                                    },
                                )
                            }
                            className="h-11 cursor-pointer rounded-md bg-teal-600 px-5 font-semibold text-white hover:bg-teal-700 active:scale-[.98]"
                        >
                            Reset kata sandi
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={importing} onOpenChange={(open) => !sending && setImporting(open)}>
                <DialogContent className="rounded-xl p-7 sm:max-w-[520px]">
                    <DialogTitle className="font-display text-xl font-bold">Impor pemustaka</DialogTitle>
                    <DialogDescription className="text-fg-2 text-[15px] leading-relaxed">
                        Tambahkan banyak pemustaka sekaligus dari berkas Excel (.xlsx) atau CSV, misalnya taruna angkatan baru atau daftar pustakawan
                        dan tenaga kependidikan. Masing-masing langsung punya akun portal dengan NIM/NIP sebagai nama pengguna dan kata sandi.
                    </DialogDescription>
                    <a
                        href={route('staf.pemustaka.import-template')}
                        className="flex items-center gap-2 self-start text-sm font-semibold text-teal-700 hover:underline"
                    >
                        <Download className="size-4" />
                        Unduh templat Excel
                    </a>
                    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                        Berkas
                        <input
                            type="file"
                            accept=".xlsx,.csv"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            className="text-fg-2 text-sm font-normal file:mr-3 file:h-10 file:cursor-pointer file:rounded-md file:border-0 file:bg-teal-50 file:px-3.5 file:font-semibold file:text-teal-800"
                        />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                            Jenis bila kolomnya kosong
                            <select value={defaultType} onChange={(e) => setDefaultType(e.target.value)} className={select}>
                                {options.types.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                            Prodi mahasiswa bila kosong
                            <select value={defaultProgram} onChange={(e) => setDefaultProgram(e.target.value)} className={select}>
                                {options.studyPrograms
                                    .filter((o) => o.value.startsWith('D'))
                                    .map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                            </select>
                        </label>
                    </div>
                    <p className="text-fg-3 text-xs leading-relaxed">
                        Baris pertama berisi judul kolom: NIM/NIP dan Nama wajib, Jenis, Program studi, Email, dan Status boleh ada. NIM/NIP yang
                        sudah terdaftar dilewati.
                    </p>
                    <div className="mt-1 flex justify-end gap-2">
                        <button
                            type="button"
                            disabled={sending}
                            onClick={() => setImporting(false)}
                            className="h-11 cursor-pointer rounded-md border border-slate-200 bg-white px-[18px] font-semibold hover:bg-slate-100 disabled:opacity-60 dark:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            disabled={!file || sending}
                            onClick={upload}
                            className="h-11 cursor-pointer rounded-md bg-teal-600 px-5 font-semibold text-white hover:bg-teal-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {sending ? 'Mengimpor…' : 'Impor'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={report !== null} onOpenChange={(open) => !open && setReport(null)}>
                <DialogContent className="rounded-xl p-7 sm:max-w-[560px]">
                    <DialogTitle className="font-display text-xl font-bold">Hasil impor</DialogTitle>
                    <DialogDescription className="text-fg-2 text-[15px] leading-relaxed">
                        <b>{report?.added ?? 0}</b> pemustaka baru ditambahkan, <b>{report?.existing ?? 0}</b> dilewati karena NIM/NIP-nya sudah
                        terdaftar.
                    </DialogDescription>
                    {report && report.problems.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold">Perlu diperiksa ({report.problems.length})</span>
                            <ul className="text-fg-2 max-h-[300px] list-disc overflow-y-auto rounded-md bg-slate-50 py-3 pr-3 pl-7 text-[13px] leading-relaxed dark:bg-slate-800">
                                {report.problems.map((p, i) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="mt-1 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setReport(null)}
                            className="h-11 cursor-pointer rounded-md bg-teal-600 px-5 font-semibold text-white hover:bg-teal-700"
                        >
                            Selesai
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </StafLayout>
    );
}
