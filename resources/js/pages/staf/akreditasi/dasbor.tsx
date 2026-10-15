import { LetterBadge } from '@/components/staf/akreditasi';
import { Badge } from '@/components/staf/master/cells';
import { Card, CardTitle } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { Link } from '@inertiajs/react';
import { ArrowRight, FileOutput } from 'lucide-react';

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
    modeStats: { computed: number; manual: number; unscored: number };
    evidence: Record<string, number>;
    readyIndicators: number;
    gap: { number: string; name: string; letter: string; to: string; gain: number; action: string }[];
    snapshots: { id: number; taken_at: string; finalScore: number; predicate: string }[];
}

const nf = (n: number, d = 2) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

const MARKS = [
    { at: 60, label: 'C' },
    { at: 76, label: 'B' },
    { at: 91, label: 'A' },
];

export default function Dasbor({ finalScore, predicate, components, modeStats, evidence, readyIndicators, gap, snapshots }: DasborProps) {
    const total = components.reduce((s, c) => s + c.count, 0);

    return (
        <StafLayout title="Akreditasi · dasbor skor" group="Akreditasi">
            <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <Card>
                    <span className="text-fg-3 text-[13px]">Nilai akhir (NA) simulasi</span>
                    <div className="flex items-end gap-4">
                        <span className="font-display text-5xl leading-none font-extrabold">{nf(finalScore)}</span>
                        <div className="flex items-center gap-2 pb-1">
                            <span className="font-display grid size-10 place-items-center rounded-[10px] bg-teal-400 text-xl font-extrabold text-white">
                                {predicate.letter}
                            </span>
                            <span className="font-semibold">{predicate.label}</span>
                        </div>
                    </div>
                    <div className="relative mt-3 mb-5">
                        <div className="flex h-3 overflow-hidden rounded-full">
                            <span className="bg-danger-soft" style={{ width: '60%' }} />
                            <span className="bg-warning-soft" style={{ width: '16%' }} />
                            <span className="bg-teal-100" style={{ width: '15%' }} />
                            <span className="bg-success-soft" style={{ width: '9%' }} />
                        </div>
                        <span
                            className="absolute -top-1 h-5 w-1 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-white"
                            style={{ left: `${Math.min(100, finalScore)}%` }}
                            aria-hidden
                        />
                        {MARKS.map((m) => (
                            <span key={m.at} className="text-fg-3 absolute top-4 -translate-x-1/2 font-mono text-[11px]" style={{ left: `${m.at}%` }}>
                                {m.label} · {m.at}
                            </span>
                        ))}
                    </div>
                    <p className="text-fg-3 text-xs">
                        NA = Σ (skor komponen ÷ skor maks) × bobot. Rumus mengikuti tafsiran PRD dan perlu divalidasi dengan asesor.
                    </p>
                </Card>

                <Card>
                    <CardTitle>Kesiapan berkas</CardTitle>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                            ['Dihitung dari data', modeStats.computed],
                            ['Isian manual', modeStats.manual],
                            ['Belum dinilai', modeStats.unscored],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-md bg-slate-50 py-2.5 dark:bg-slate-900">
                                <div className="font-display text-xl font-extrabold">{value}</div>
                                <div className="text-fg-3 text-[11px]">{label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-fg-2">IK dengan bukti tersahkan lengkap</span>
                        <span className="font-mono font-semibold">
                            {readyIndicators} / {total}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <Badge tone="success">Disahkan: {evidence.Disahkan ?? 0}</Badge>
                        <Badge tone="warning">Draf: {evidence.Draf ?? 0}</Badge>
                        <Badge tone="slate">Belum ada: {evidence['Belum ada'] ?? 0}</Badge>
                        <Badge tone="danger">Kedaluwarsa: {evidence.Kedaluwarsa ?? 0}</Badge>
                    </div>
                    <Link
                        href={route('staf.akreditasi.berkas')}
                        className="shadow-teal mt-auto flex h-10 items-center justify-center gap-2 rounded-md bg-teal-400 text-sm font-semibold text-white hover:bg-teal-500"
                    >
                        <FileOutput className="size-4" />
                        Siapkan berkas pengajuan
                    </Link>
                </Card>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                {components.map((c) => (
                    <Link
                        key={c.number}
                        href={route('staf.akreditasi.indikator', { komponen: c.number })}
                        className="flex flex-col gap-2.5 rounded-lg bg-white p-5 shadow-sm hover:shadow-md dark:bg-slate-800"
                    >
                        <span className="text-fg-3 text-xs">
                            Komponen {c.number} · bobot {c.weight}
                        </span>
                        <span className="font-bold">{c.name}</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-2xl font-extrabold">{nf(c.contribution)}</span>
                            <span className="text-fg-3 text-xs">dari {c.weight} poin NA</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                            <div
                                className="h-full rounded-full bg-teal-600 dark:bg-teal-500"
                                style={{ width: `${c.max ? (c.score / c.max) * 100 : 0}%` }}
                            />
                        </div>
                        <span className="text-fg-3 text-xs">
                            Skor {c.score}/{c.max} · {c.count} IK{c.low > 0 && ` · ${c.low} IK di opsi c/d`}
                            {c.unscored > 0 && ` · ${c.unscored} belum dinilai`}
                        </span>
                    </Link>
                ))}
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Card>
                    <CardTitle
                        aside={
                            <Link href={route('staf.akreditasi.gap')} className="flex items-center gap-1 text-xs font-semibold text-teal-600">
                                Lihat analisis gap
                                <ArrowRight className="size-3.5" />
                            </Link>
                        }
                    >
                        Prioritas perbaikan
                    </CardTitle>
                    <p className="text-fg-3 -mt-2 text-[13px]">5 IK dengan tambahan NA terbesar jika naik satu opsi.</p>
                    {gap.map((g) => (
                        <Link
                            key={g.number}
                            href={route('staf.akreditasi.indikator', { ik: g.number })}
                            className="flex items-center gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                        >
                            <span className="w-10 font-mono text-sm font-semibold">{g.number}</span>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold">{g.name}</div>
                                <div className="text-fg-3 truncate text-xs">{g.action}</div>
                            </div>
                            <span className="text-fg-2 font-mono text-xs uppercase">
                                {g.letter} → {g.to}
                            </span>
                            <span className="text-success w-14 text-right font-mono text-sm font-semibold">+{nf(g.gain)}</span>
                        </Link>
                    ))}
                </Card>

                <Card>
                    <CardTitle>Snapshot penilaian</CardTitle>
                    {snapshots.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-center justify-between border-b border-slate-200 pb-2 text-sm last:border-0 dark:border-slate-700"
                        >
                            <span className="text-fg-2">{s.taken_at}</span>
                            <span className="font-mono font-semibold">
                                {nf(s.finalScore)} · {s.predicate.split(' ')[0]}
                            </span>
                        </div>
                    ))}
                    {snapshots.length === 0 && <p className="text-fg-3 text-sm">Belum ada snapshot. Simpan dari halaman berkas pengajuan.</p>}
                    <LetterBadgeLegend />
                </Card>
            </div>
        </StafLayout>
    );
}

function LetterBadgeLegend() {
    return (
        <div className="text-fg-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 text-xs dark:border-slate-700">
            Opsi:
            {['a', 'b', 'c', 'd'].map((l, i) => (
                <span key={l} className="flex items-center gap-1">
                    <LetterBadge letter={l} />
                    skor {4 - i}
                </span>
            ))}
        </div>
    );
}
