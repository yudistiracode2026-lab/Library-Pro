import { initials, PillTabs } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated } from '@/types';
import { Link } from '@inertiajs/react';
import { BookCopy, BookHeart, ChevronRight, FileText, Repeat } from 'lucide-react';

interface RequestRow {
    id: number;
    name: string;
    member_number: string;
    study_program: string | null;
    title: string;
    submitted_at: string;
    requirements: { label: string; ok: boolean }[];
}

interface IndexProps {
    status: string;
    counts: Record<string, number>;
    requests: Paginated<RequestRow>;
}

const STATUSES = ['Menunggu', 'Disetujui', 'Dikembalikan'];

const COLS = 'grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_110px_200px_120px_20px]';

const STATUS_TONE: Record<string, string> = {
    Menunggu: 'bg-warning-soft text-amber-800',
    Disetujui: 'bg-success-soft text-success',
    Dikembalikan: 'bg-danger-soft text-danger',
};

/** One icon per requirement, matched on the label from ClearanceRequest::requirements(). */
const REQUIREMENT_ICONS: [string, typeof Repeat][] = [
    ['Tidak ada pinjaman', Repeat],
    ['Skripsi', FileText],
    ['Buku sumbangan', BookHeart],
    ['Hardcopy', BookCopy],
];

export default function BebasPustakaIndex({ status, counts, requests }: IndexProps) {
    return (
        <StafLayout title="Verifikasi bebas pustaka" group="Akademik">
            <p className="text-fg-3 -mb-2 text-sm">
                Buka pengajuan untuk memeriksa syarat bebas pustaka: pinjaman, skripsi digital, buku sumbangan, dan hardcopy skripsi.
            </p>
            <PillTabs
                tabs={STATUSES.map((s) => ({
                    label: s,
                    href: route('staf.bebas-pustaka', { status: s }),
                    active: status === s,
                    count: counts[s] ?? 0,
                }))}
            />

            <section className="overflow-auto rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div
                    className={`text-fg-3 grid min-w-[900px] ${COLS} gap-3.5 border-b border-slate-200 px-5 py-3 text-xs font-semibold tracking-[.04em] uppercase dark:border-slate-700`}
                >
                    <span>Mahasiswa</span>
                    <span>Judul skripsi</span>
                    <span>Diajukan</span>
                    <span>Syarat</span>
                    <span>Status</span>
                    <span />
                </div>
                {requests.data.map((r) => {
                    const done = r.requirements.filter((x) => x.ok).length;

                    return (
                        <Link
                            key={r.id}
                            href={route('staf.bebas-pustaka.show', r.id)}
                            className={`text-fg-1 grid min-w-[900px] ${COLS} items-center gap-3.5 border-b border-slate-200 px-5 py-3.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900`}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="grid size-[38px] flex-none place-items-center rounded-full bg-teal-100 text-[13px] font-bold text-teal-800">
                                    {initials(r.name)}
                                </span>
                                <div className="min-w-0">
                                    <div className="font-semibold">{r.name}</div>
                                    <div className="text-fg-3 text-xs">
                                        <span className="font-mono">{r.member_number}</span> · {r.study_program}
                                    </div>
                                </div>
                            </div>
                            <span className="text-fg-2 text-[13px] leading-[1.4]">{r.title}</span>
                            <span className="text-fg-2 text-[13px]">{r.submitted_at}</span>
                            <div className="flex items-center gap-1.5">
                                {r.requirements.map((x) => {
                                    const Icon = REQUIREMENT_ICONS.find(([prefix]) => x.label.startsWith(prefix))?.[1] ?? FileText;

                                    return (
                                        <span
                                            key={x.label}
                                            title={`${x.label} · ${x.ok ? 'selesai' : 'belum'}`}
                                            className={`grid size-7 place-items-center rounded-[8px] ${x.ok ? 'bg-success-soft text-success' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}
                                        >
                                            <Icon className="size-3.5" />
                                        </span>
                                    );
                                })}
                                <span className="text-fg-3 ml-1 text-xs font-semibold">
                                    {done}/{r.requirements.length}
                                </span>
                            </div>
                            <span
                                className={`justify-self-start rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap ${STATUS_TONE[status]}`}
                            >
                                {status === 'Menunggu' && done < r.requirements.length ? 'Belum lengkap' : status}
                            </span>
                            <ChevronRight className="text-fg-3 size-4" />
                        </Link>
                    );
                })}
                {requests.data.length === 0 && <p className="text-fg-3 py-12 text-center text-sm">Tidak ada pengajuan di kategori ini.</p>}
            </section>
        </StafLayout>
    );
}
