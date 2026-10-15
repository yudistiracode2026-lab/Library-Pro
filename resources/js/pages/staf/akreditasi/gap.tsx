import { LetterBadge } from '@/components/staf/akreditasi';
import { Card, Kpi } from '@/components/staf/ui';
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
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                <Kpi label="NA sekarang" value={`${nf(finalScore)} · ${predicate.letter}`} sub={predicate.label} />
                <Kpi
                    label="Jika IK yang dicentang naik satu opsi"
                    value={`${nf(simulated)} · ${simPredicate[1]}`}
                    sub={`${picked.length} IK dipilih · ${simPredicate[2]}`}
                    tone={simulated > finalScore ? 'ok' : undefined}
                />
                <Kpi
                    label="Selisih ke predikat A (91)"
                    value={simulated >= 91 ? 'Tercapai' : nf(91 - simulated)}
                    sub="poin NA"
                    tone={simulated >= 91 ? 'ok' : 'warn'}
                />
            </div>

            <Card className="gap-0 p-0 md:p-0">
                <p className="text-fg-3 px-5 pt-4 pb-3 text-sm">
                    Diurutkan menurut tambahan NA terbesar. Centang IK yang akan dikerjakan untuk melihat simulasi nilai akhirnya.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-sm">
                        <thead className="text-fg-3 border-y border-slate-200 bg-slate-50 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900">
                            <tr>
                                {['', 'IK', 'Indikator & langkah', 'Komponen', 'Opsi', 'Tambahan NA', ''].map((h, i) => (
                                    <th key={i} className="px-4 py-3 font-semibold whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((g) => {
                                const on = picked.includes(g.number);

                                return (
                                    <tr
                                        key={g.number}
                                        className={`border-b border-slate-200 dark:border-slate-700 ${on ? 'bg-teal-50 dark:bg-teal-900' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                role="checkbox"
                                                aria-checked={on}
                                                aria-label={`Pilih IK ${g.number}`}
                                                onClick={() => toggle(g.number)}
                                                className={`grid size-5 cursor-pointer place-items-center rounded-[5px] border-[1.5px] ${on ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 bg-white'}`}
                                            >
                                                {on && <Check className="size-3.5" strokeWidth={3} />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 font-mono font-semibold">{g.number}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold">{g.name}</div>
                                            <div className="text-fg-3 text-xs">{g.action}</div>
                                        </td>
                                        <td className="text-fg-2 px-4 py-3">{g.componentName}</td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1.5">
                                                <LetterBadge letter={g.letter} />→<LetterBadge letter={g.to} />
                                            </span>
                                        </td>
                                        <td className="text-success px-4 py-3 font-mono font-semibold">+{nf(g.gain)}</td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={route('staf.akreditasi.indikator', { ik: g.number })}
                                                aria-label={`Buka IK ${g.number}`}
                                                className="text-fg-2 grid size-8 place-items-center rounded-[9px] hover:bg-teal-50 hover:text-teal-700"
                                            >
                                                <ChevronRight className="size-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </StafLayout>
    );
}
