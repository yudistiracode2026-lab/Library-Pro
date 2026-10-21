import { Cell, StatusBadge } from '@/components/staf/master/cells';
import { MasterPage } from '@/components/staf/master/master-page';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated, type SelectOption } from '@/types';
import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';

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

interface PemustakaProps {
    records: Paginated<MemberRow>;
    filters: { q: string; urut?: string; arah?: string };
    options: { types: SelectOption[]; studyPrograms: SelectOption[]; statuses: SelectOption[] };
}

export default function Pemustaka({ records, filters, options }: PemustakaProps) {
    const [resetting, setResetting] = useState<MemberRow | null>(null);

    return (
        <StafLayout title="Master pemustaka" group="Master data">
            <MasterPage<MemberRow>
                routeKey="pemustaka"
                heading="Data pemustaka"
                description="Mahasiswa, dosen, dan anggota luar yang terdaftar"
                addLabel="Tambah pemustaka"
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
                        <span className="font-mono">{resetting?.member_number}</span>). Pemustaka wajib menggantinya saat masuk berikutnya.
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
        </StafLayout>
    );
}
