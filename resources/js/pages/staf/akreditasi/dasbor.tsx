import StafLayout from '@/layouts/staf-layout';
import { Link } from '@inertiajs/react';
import { BookCopy, Building, FileOutput, HandHelping, Landmark, Settings2, Users } from 'lucide-react';

interface Component {
    number: number;
    name: string;
    weight: number;
    score: number;
    max: number;
    count: number;
    contribution: number;
    low: number;
    unscored: number;
}

interface DasborProps {
    finalScore: number;
    predicate: { letter: string; label: string };
    components: Component[];
    modeStats: Record<'Otomatis' | 'Semi' | 'Manual', number>;
    evidence: Record<string, number>;
    readyIndicators: number;
    gap: { number: string; name: string; letter: string; to: string; gain: number; action: string }[];
}

const nf = (n: number, d = 2) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

const MARKS = [
    { at: 60, label: 'C 60' },
    { at: 76, label: 'B 76' },
    { at: 91, label: 'A 91' },
];

const ICONS = [BookCopy, Building, HandHelping, Users, Landmark, Settings2];

const EVIDENCE = [
    ['Disahkan', 'bg-success-soft text-success'],
    ['Draf', 'bg-warning-soft text-amber-800'],
    ['Kedaluwarsa', 'bg-danger-soft text-danger'],
    ['Belum ada', 'text-fg-3 bg-slate-100 dark:bg-slate-700'],
];

export default function Dasbor({ finalScore, predicate, components, modeStats, evidence, readyIndicators, gap }: DasborProps) {
    const total = components.reduce((s, c) => s + c.count, 0);
    const strongest = [...components].sort((a, b) => b.weight / b.max - a.weight / a.max)[0];

    return (
        <StafLayout title="Akreditasi · dasbor skor" group="Akreditasi">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
                <section className="bg-grad-leaf flex flex-col gap-[18px] rounded-xl p-7 text-white shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold tracking-[.08em] text-teal-50 uppercase">Nilai akhir (NA) simulasi</span>
                            <span className="font-display text-[60px] leading-none font-extrabold tracking-[-.03em]">{nf(finalScore)}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            <span className="font-display grid size-16 place-items-center rounded-[18px] bg-white text-[40px] leading-none font-extrabold text-teal-700">
                                {predicate.letter}
                            </span>
                            <span className="text-[13px] font-semibold">{predicate.label}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="relative h-2.5 rounded-full bg-white/25">
                            <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${Math.min(100, finalScore)}%` }} />
                            {MARKS.map((m) => (
                                <span key={m.at} className="bg-sunset absolute -top-1 h-[18px] w-[3px] rounded-[2px]" style={{ left: `${m.at}%` }} />
                            ))}
                        </div>
                        <div className="relative h-4 text-[11px] text-teal-50">
                            {MARKS.map((m) => (
                                <span key={m.at} className="absolute -translate-x-1/2" style={{ left: `${m.at}%` }}>
                                    {m.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <span className="text-sm leading-normal">
                        {finalScore >= 91
                            ? 'Sudah di rentang predikat A. Jaga bukti tetap tersahkan sampai visitasi.'
                            : `Butuh ${nf(91 - finalScore)} poin lagi untuk predikat A. Komponen ${strongest?.name} (bobot ${strongest?.weight}) memberi tambahan terbesar per IK.`}
                    </span>
                </section>

                <section className="flex flex-col gap-3.5 rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                    <span className="font-display text-[17px] font-bold">Kesiapan berkas</span>
                    <div className="grid grid-cols-3 gap-2.5">
                        {[
                            ['Otomatis', modeStats.Otomatis],
                            ['Semi-otomatis', modeStats.Semi],
                            ['Manual', modeStats.Manual],
                        ].map(([label, value]) => (
                            <div key={label} className="flex flex-col gap-0.5 rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                                <span className="font-display text-2xl font-extrabold">{value}</span>
                                <span className="text-fg-3 text-xs">{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[13px]">
                            <span>IK dengan bukti tersahkan lengkap</span>
                            <span className="font-bold">
                                {readyIndicators} / {total}
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                            <div
                                className="h-full rounded-full bg-teal-400"
                                style={{ width: `${total ? Math.round((readyIndicators / total) * 100) : 0}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {EVIDENCE.map(([label, tone]) => (
                            <span key={label} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
                                {label}: {evidence[label] ?? 0}
                            </span>
                        ))}
                    </div>
                    <Link
                        href={route('staf.akreditasi.berkas')}
                        className="mt-auto flex h-10 items-center gap-2 self-start rounded-md bg-teal-400 px-4 text-sm font-semibold text-white hover:bg-teal-500"
                    >
                        <FileOutput className="size-4" />
                        Siapkan berkas pengajuan
                    </Link>
                </section>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
                {components.map((c) => {
                    const Icon = ICONS[c.number - 1] ?? BookCopy;
                    const ratio = c.max ? c.score / c.max : 0;

                    return (
                        <Link
                            key={c.number}
                            href={route('staf.akreditasi.indikator', { komponen: c.number })}
                            className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-100">
                                    <Icon className="size-[17px]" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="text-fg-3 text-xs">
                                        Komponen {c.number} · bobot {c.weight}
                                    </div>
                                    <div className="font-display text-base font-bold">{c.name}</div>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-display text-[28px] font-extrabold">{nf(c.contribution)}</span>
                                <span className="text-fg-3 text-[13px]">dari {c.weight} poin NA</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div
                                    className={`h-full rounded-full ${ratio >= 0.8 ? 'bg-teal-400' : ratio >= 0.65 ? 'bg-marigold' : 'bg-sunset'}`}
                                    style={{ width: `${Math.round(ratio * 100)}%` }}
                                />
                            </div>
                            <div className="text-fg-3 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs">
                                <span className="whitespace-nowrap">
                                    Skor {c.score}/{c.max} · {c.count} IK
                                </span>
                                <span className={`font-semibold ${c.low ? 'text-sunset' : 'text-success'}`}>
                                    {c.low ? `${c.low} IK di opsi c/d` : 'Tidak ada opsi c/d'}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <section className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <div>
                        <div className="font-display text-[17px] font-bold">Prioritas perbaikan</div>
                        <div className="text-fg-3 text-[13px]">5 IK dengan tambahan NA terbesar jika naik satu opsi</div>
                    </div>
                    <Link
                        href={route('staf.akreditasi.gap')}
                        className="text-fg-1 flex h-9 items-center rounded-[10px] border border-slate-200 bg-white px-3.5 text-[13px] font-semibold hover:bg-slate-100 dark:bg-slate-800"
                    >
                        Lihat analisis gap
                    </Link>
                </div>
                {gap.map((g) => (
                    <Link
                        key={g.number}
                        href={route('staf.akreditasi.indikator', { ik: g.number })}
                        className="grid grid-cols-[52px_minmax(0,1fr)_90px_80px] items-center gap-3 border-b border-slate-200 px-5 py-3 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                    >
                        <span className="text-fg-3 font-mono font-semibold">{g.number}</span>
                        <div className="min-w-0">
                            <div className="font-semibold">{g.name}</div>
                            <div className="text-fg-3 text-xs">{g.action || '—'}</div>
                        </div>
                        <span className="text-fg-2 text-[13px]">
                            {g.letter} → {g.to}
                        </span>
                        <span className="font-display text-right font-extrabold text-teal-700 dark:text-teal-200">+{nf(g.gain)}</span>
                    </Link>
                ))}
            </section>
        </StafLayout>
    );
}
