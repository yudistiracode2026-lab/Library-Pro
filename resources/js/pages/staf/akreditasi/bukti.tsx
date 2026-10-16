import { formatSize } from '@/components/staf/akreditasi';
import StafLayout from '@/layouts/staf-layout';
import { Link, router } from '@inertiajs/react';

interface BuktiProps {
    status: string;
    counts: Record<string, number>;
    items: {
        id: number;
        label: string;
        status: string;
        file: string | null;
        fileName: string | null;
        size: number | null;
        uploadedAt: string | null;
        approvedAt: string | null;
        validUntil: string | null;
        indicator: { number: string; name: string };
    }[];
    canApprove: boolean;
    accept: string;
}

const COLS = 'grid-cols-[52px_minmax(0,1.8fr)_minmax(0,1fr)_110px_200px]';

const TONE: Record<string, string> = {
    Disahkan: 'bg-success-soft text-success',
    Draf: 'bg-warning-soft text-amber-800',
    Kedaluwarsa: 'bg-danger-soft text-danger',
    'Belum ada': 'text-fg-3 bg-slate-100 dark:bg-slate-700',
};

export default function Bukti({ status, counts, items, canApprove }: BuktiProps) {
    return (
        <StafLayout title="Akreditasi · bank bukti fisik" group="Akreditasi">
            <div className="flex flex-wrap gap-1.5">
                {['', 'Draf', 'Belum ada', 'Kedaluwarsa', 'Disahkan'].map((st) => (
                    <Link
                        key={st}
                        href={route('staf.akreditasi.bukti', st ? { status: st } : {})}
                        preserveScroll
                        className={`flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap ${status === st ? 'border-teal-400 bg-teal-400 text-white' : 'text-fg-2 border-slate-200 bg-white dark:bg-slate-800'}`}
                    >
                        {st || 'Semua'} ({counts[st] ?? 0})
                    </Link>
                ))}
            </div>
            <section className="overflow-auto rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div
                    className={`text-fg-3 grid min-w-[760px] ${COLS} gap-3.5 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900`}
                >
                    <span>IK</span>
                    <span>Bukti fisik</span>
                    <span>Berkas</span>
                    <span>Status</span>
                    <span />
                </div>
                {items.map((e) => (
                    <div
                        key={e.id}
                        className={`grid min-w-[760px] ${COLS} items-center gap-3.5 border-b border-slate-200 px-5 py-3 text-sm dark:border-slate-700`}
                    >
                        <span className="font-mono font-semibold">{e.indicator.number}</span>
                        <div className="min-w-0">
                            <div className="font-semibold">{e.label}</div>
                            <div className="text-fg-3 text-xs">{e.indicator.name}</div>
                        </div>
                        <div className="min-w-0">
                            {e.file ? (
                                <a
                                    href={e.file}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-fg-1 text-[13px] [overflow-wrap:anywhere] hover:text-teal-700"
                                >
                                    {e.fileName}
                                </a>
                            ) : (
                                <div className="text-[13px]">—</div>
                            )}
                            <div className="text-fg-3 text-xs">
                                {e.file
                                    ? `${formatSize(e.size)} · ${e.uploadedAt}${e.validUntil ? ` · s.d. ${e.validUntil}` : ''}`
                                    : 'belum diunggah'}
                            </div>
                        </div>
                        <span className={`justify-self-start rounded-full px-2.5 py-[3px] text-xs font-semibold ${TONE[e.status]}`}>{e.status}</span>
                        <div className="flex justify-end gap-1.5">
                            {canApprove && e.file && e.status === 'Draf' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post(route('staf.akreditasi.bukti.approve', e.id), {}, { preserveScroll: true, preserveState: true })
                                    }
                                    className="h-8 cursor-pointer rounded-[10px] bg-teal-400 px-3 text-xs font-semibold text-white hover:bg-teal-500"
                                >
                                    Sahkan
                                </button>
                            )}
                            <Link
                                href={route('staf.akreditasi.indikator', { ik: e.indicator.number })}
                                className="text-fg-1 flex h-8 items-center rounded-[10px] border border-slate-200 bg-white px-3 text-xs font-semibold hover:bg-slate-100 dark:bg-slate-800"
                            >
                                Buka IK
                            </Link>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-fg-3 py-10 text-center text-sm">Tidak ada bukti di kategori ini.</p>}
            </section>
        </StafLayout>
    );
}
