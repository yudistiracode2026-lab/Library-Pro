import StafLayout from '@/layouts/staf-layout';
import { Link } from '@inertiajs/react';
import { Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface GapRow {
    number: string;
    name: string;
    componentName: string;
    letter: string;
    to: string;
    gain: number;
    action: string;
    computed: boolean;
}

interface GapProps {
    finalScore: number;
    predicate: { letter: string; label: string };
    rows: GapRow[];
    predicates: [number, string, string][];
}

const nf = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Gap({ finalScore, predicate, rows, predicates }: GapProps) {
    const [picked, setPicked] = useState<string[]>([]);
    const simulated = Math.min(100, finalScore + rows.filter((r) => picked.includes(r.number)).reduce((s, r) => s + r.gain, 0));
    const simPredicate = predicates.find(([min]) => simulated >= min) ?? predicates[predicates.length - 1];
    const toggle = (n: string) => setPicked(picked.includes(n) ? picked.filter((x) => x !== n) : [...picked, n]);

    return (
        <StafLayout title="Akreditasi · analisis gap" group="Akreditasi">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <Stat label="NA sekarang" value={`${nf(finalScore)} · ${predicate.letter}`} />
                <Stat label="Jika IK yang dicentang naik satu opsi" value={`${nf(simulated)} · ${simPredicate[1]}`} accent />
                <Stat label="Selisih ke predikat A (91)" value={simulated >= 91 ? 'Sudah A' : `${nf(91 - simulated)} poin`} />
            </div>
            <p className="text-fg-3 text-sm">
                Diurutkan menurut tambahan NA terbesar. Centang IK yang akan dikerjakan untuk melihat simulasi nilai akhirnya.
            </p>
            <section className="overflow-auto rounded-lg bg-white shadow-sm dark:bg-slate-800">
                {rows.map((g) => {
                    const on = picked.includes(g.number);

                    return (
                        <div
                            key={g.number}
                            className="grid min-w-[720px] grid-cols-[32px_52px_minmax(0,1.6fr)_110px_70px_110px] items-center gap-3 border-b border-slate-200 px-5 py-3 text-sm dark:border-slate-700"
                        >
                            <button
                                type="button"
                                role="checkbox"
                                aria-checked={on}
                                aria-label={`Pilih IK ${g.number}`}
                                onClick={() => toggle(g.number)}
                                className={`grid size-5 cursor-pointer place-items-center rounded-[5px] border-[1.5px] p-0 text-white ${on ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white dark:bg-slate-800'}`}
                            >
                                <Check className={`size-3.5 ${on ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                            </button>
                            <span className="font-mono font-semibold">{g.number}</span>
                            <div className="min-w-0">
                                <div className="font-semibold">{g.name}</div>
                                <div className="text-fg-3 text-xs leading-[1.45]">{g.action || '—'}</div>
                            </div>
                            <span className="text-fg-3 text-xs">{g.componentName}</span>
                            <span className="text-[13px] font-semibold">
                                {g.letter} → {g.to}
                            </span>
                            <div className="flex items-center justify-end gap-2">
                                <span className="font-display font-extrabold text-teal-700 dark:text-teal-200">+{nf(g.gain)}</span>
                                <Link
                                    href={route('staf.akreditasi.indikator', { ik: g.number })}
                                    title="Buka detail"
                                    aria-label={`Buka IK ${g.number}`}
                                    className="text-fg-2 grid size-[30px] place-items-center rounded-[8px] border border-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800"
                                >
                                    <ChevronRight className="size-4" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </section>
        </StafLayout>
    );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="rounded-lg bg-white p-[18px] shadow-sm dark:bg-slate-800">
            <div className="text-fg-3 text-[13px]">{label}</div>
            <div className={`font-display text-[28px] font-extrabold ${accent ? 'text-teal-700 dark:text-teal-200' : ''}`}>{value}</div>
        </div>
    );
}
