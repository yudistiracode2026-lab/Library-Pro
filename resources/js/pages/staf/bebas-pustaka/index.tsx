import { Card, initials, PillTabs } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated } from '@/types';
import { Link } from '@inertiajs/react';
import { Check, ChevronRight, X } from 'lucide-react';

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

            <Card className="gap-0 p-0 md:p-0">
                <div className="text-fg-3 hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_110px_150px_24px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold tracking-[.06em] uppercase md:grid dark:border-slate-700 dark:bg-slate-900">
                    <span>Mahasiswa</span>
                    <span>Judul skripsi</span>
                    <span>Diajukan</span>
                    <span>Syarat</span>
                    <span />
                </div>
                {requests.data.map((r) => {
                    const done = r.requirements.filter((x) => x.ok).length;

                    return (
                        <Link
                            key={r.id}
                            href={route('staf.bebas-pustaka.show', r.id)}
                            className="grid items-center gap-x-4 gap-y-2 border-b border-slate-200 px-5 py-3.5 text-sm hover:bg-slate-50 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_110px_150px_24px] dark:border-slate-700 dark:hover:bg-slate-900"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="grid size-9 flex-none place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                                    {initials(r.name)}
                                </span>
                                <div className="min-w-0">
                                    <div className="truncate font-semibold">{r.name}</div>
                                    <div className="text-fg-3 truncate text-xs">
                                        {r.member_number} · {r.study_program}
                                    </div>
                                </div>
                            </div>
                            <span className="text-fg-2 line-clamp-2">{r.title}</span>
                            <span className="text-fg-3">{r.submitted_at}</span>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    {r.requirements.map((x) => (
                                        <span
                                            key={x.label}
                                            title={x.label}
                                            className={`grid size-6 place-items-center rounded-full ${x.ok ? 'bg-success-soft text-success' : 'text-fg-4 bg-slate-100 dark:bg-slate-700'}`}
                                        >
                                            {x.ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" />}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-fg-3 font-mono text-xs">
                                    {done}/{r.requirements.length}
                                </span>
                            </div>
                            <ChevronRight className="text-fg-4 hidden size-4 md:block" />
                        </Link>
                    );
                })}
                {requests.data.length === 0 && <p className="text-fg-3 py-12 text-center text-sm">Tidak ada pengajuan di kategori ini.</p>}
            </Card>
        </StafLayout>
    );
}
