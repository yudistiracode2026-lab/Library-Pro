import StafLayout from '@/layouts/staf-layout';
import { router } from '@inertiajs/react';
import { Award, CircleAlert, CircleCheck, FileText, FolderArchive, IdCard } from 'lucide-react';

interface BerkasProps {
    finalScore: number;
    predicate: { letter: string; label: string };
    approvedEvidence: number;
    checks: { label: string; detail: string; ok: boolean }[];
    canApprove: boolean;
    approvedAt: string | null;
    today: string;
    profile: [string, string][];
    snapshots: { id: number; taken_at: string; finalScore: number; predicate: string }[];
}

const DOCS = [
    {
        type: 'formulir',
        icon: FileText,
        name: 'Formulir pengajuan',
        description: 'Identitas lembaga dan permohonan akreditasi, terisi dari data profil.',
    },
    {
        type: 'profil',
        icon: IdCard,
        name: 'Data profil perpustakaan',
        description: 'Luas, koleksi, tenaga, sivitas, dan jam layanan dari data sistem.',
    },
    {
        type: 'pernyataan',
        icon: Award,
        name: 'Pernyataan penulisan sertifikat',
        description: 'Nama lembaga dan kepala perpustakaan sesuai penulisan di sertifikat.',
    },
];

const nf = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const button =
    'text-fg-1 flex h-9 cursor-pointer items-center rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-semibold whitespace-nowrap hover:bg-slate-100 dark:bg-slate-800';

export default function Berkas({ finalScore, approvedEvidence, checks, canApprove, approvedAt, today, profile, snapshots }: BerkasProps) {
    const ready = checks.every((c) => c.ok);
    const cannot = !canApprove || !!approvedAt || !ready;

    return (
        <StafLayout title="Akreditasi · berkas pengajuan SiPAPI" group="Akreditasi">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-4">
                {DOCS.map(({ type, icon: Icon, name, description }) => (
                    <Doc key={type} icon={<Icon className="size-[18px]" />} name={name} description={description}>
                        <a href={route('staf.akreditasi.berkas.document', type)} className={button}>
                            PDF
                        </a>
                    </Doc>
                ))}
                <Doc
                    icon={<FolderArchive className="size-[18px]" />}
                    name="Paket bukti (ZIP)"
                    description={`${approvedEvidence} bukti tersahkan, tersusun per komponen dan nomor IK untuk SiPAPI.`}
                >
                    <a href={route('staf.akreditasi.berkas.package')} className={button}>
                        Unduh ZIP
                    </a>
                    <button
                        type="button"
                        title={snapshots[0] ? `Snapshot terakhir ${snapshots[0].taken_at} (NA ${nf(snapshots[0].finalScore)})` : undefined}
                        onClick={() => router.post(route('staf.akreditasi.snapshot'), {}, { preserveScroll: true })}
                        className={button}
                    >
                        Snapshot
                    </button>
                </Doc>
            </div>

            <div className="flex flex-wrap items-start gap-4">
                <section className="flex min-w-0 flex-[55_1_420px] flex-col gap-3.5 rounded-lg border border-slate-200 bg-white px-10 py-9 text-[13px] leading-relaxed text-slate-800 shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-3 border-b-2 border-slate-800 pb-3 dark:border-slate-200">
                        <img src="/images/logo-stpn.png" alt="Logo Politeknik Agraria STPN" className="size-12 flex-none object-contain" />
                        <div className="leading-snug">
                            <div className="font-display font-extrabold">DATA PROFIL PERPUSTAKAAN</div>
                            <div className="text-xs">Lampiran pengajuan akreditasi · dihasilkan otomatis {today}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-x-4 gap-y-1.5">
                        {profile.map(([k, v]) => (
                            <div key={k} className="contents">
                                <span className="text-fg-3">{k}</span>
                                <span className="font-medium">{v}</span>
                            </div>
                        ))}
                    </div>
                    <span className="text-fg-3 text-[11px]">
                        Setiap angka tertaut ke data sumber: luas dari Manajemen aset, tenaga dari master pustakawan/tendik, koleksi dari master buku
                        &amp; e-book.
                    </span>
                </section>

                <section className="flex min-w-0 flex-[45_1_300px] flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                    <span className="font-display text-base font-bold">Pemeriksaan sebelum pengajuan</span>
                    {checks.map((c) => (
                        <div
                            key={c.label}
                            className={`flex items-start gap-2.5 rounded-md px-3 py-2.5 ${c.ok ? 'bg-success-soft' : 'bg-warning-soft'}`}
                        >
                            {c.ok ? (
                                <CircleCheck className="text-success mt-px size-[18px] flex-none" />
                            ) : (
                                <CircleAlert className="mt-px size-[18px] flex-none text-amber-800" />
                            )}
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                                <div className="text-xs text-slate-700">{c.detail}</div>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        disabled={cannot}
                        onClick={() => router.post(route('staf.akreditasi.berkas.approve'), {}, { preserveScroll: true })}
                        className="h-[46px] cursor-pointer rounded-md bg-teal-400 text-[15px] font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {approvedAt
                            ? `Pengajuan disetujui · ${approvedAt}`
                            : !canApprove
                              ? 'Persetujuan oleh kepala perpustakaan'
                              : 'Setujui pengajuan'}
                    </button>
                    <span className="text-fg-3 text-xs">
                        Pengunggahan ke SiPAPI (akreditasi.perpusnas.go.id) tetap dilakukan manual oleh koordinator. NA saat ini {nf(finalScore)}.
                    </span>
                </section>
            </div>
        </StafLayout>
    );
}

function Doc({ icon, name, description, children }: { icon: React.ReactNode; name: string; description: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
            <span className="grid size-10 place-items-center rounded-[10px] bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-100">
                {icon}
            </span>
            <div>
                <div className="font-display font-bold">{name}</div>
                <div className="text-fg-3 text-[13px] leading-normal">{description}</div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">{children}</div>
        </section>
    );
}
