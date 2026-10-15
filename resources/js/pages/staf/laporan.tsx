import { StafIcon } from '@/components/staf/staf-icon';
import { Card, CardTitle, inputClass } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type SelectOption } from '@/types';
import { Link, router } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';

interface LaporanProps {
    reports: { key: string; icon: string; name: string; description: string }[];
    periods: SelectOption[];
    report: string;
    period: string;
    data: {
        title: string;
        period: string;
        columns: string[];
        rows: (string | number | null)[][];
        summary: { label: string; value: string }[];
    };
}

export default function Laporan({ reports, periods, report, period, data }: LaporanProps) {
    const params = { laporan: report, periode: period };
    const link =
        'text-fg-1 flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800';

    return (
        <StafLayout title="Laporan" group="Sistem">
            <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                <Card className="gap-2 p-3 md:p-3">
                    <label className="flex flex-col gap-1.5 px-2 pt-1 pb-2 text-[13px] font-semibold">
                        Periode
                        <select
                            value={period}
                            onChange={(e) =>
                                router.get(
                                    route('staf.laporan'),
                                    { laporan: report, periode: e.target.value },
                                    { preserveScroll: true, preserveState: true },
                                )
                            }
                            className={inputClass}
                        >
                            {periods.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    {reports.map((r) => (
                        <Link
                            key={r.key}
                            href={route('staf.laporan', { laporan: r.key, periode: period })}
                            preserveScroll
                            className={`flex gap-3 rounded-md p-2.5 ${report === r.key ? 'bg-teal-50 dark:bg-teal-900' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                        >
                            <span
                                className={`grid size-9 flex-none place-items-center rounded-[9px] ${report === r.key ? 'bg-teal-400 text-white' : 'bg-teal-50 text-teal-700'}`}
                            >
                                <StafIcon name={r.icon} className="size-4" />
                            </span>
                            <div>
                                <div className="text-sm font-semibold">{r.name}</div>
                                <div className="text-fg-3 text-xs leading-snug">{r.description}</div>
                            </div>
                        </Link>
                    ))}
                </Card>

                <Card>
                    <CardTitle
                        aside={
                            <div className="flex gap-2">
                                <a href={route('staf.laporan.download', { format: 'pdf', ...params })} className={link}>
                                    <FileText className="size-4" />
                                    PDF
                                </a>
                                <a href={route('staf.laporan.download', { format: 'csv', ...params })} className={link}>
                                    <Download className="size-4" />
                                    Excel (CSV)
                                </a>
                            </div>
                        }
                    >
                        {data.title} · {data.period}
                    </CardTitle>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                        {data.summary.map((s) => (
                            <div key={s.label} className="rounded-md bg-slate-50 px-3.5 py-3 dark:bg-slate-900">
                                <div className="text-fg-3 text-xs">{s.label}</div>
                                <div className="font-display mt-0.5 text-lg font-extrabold">{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-fg-3 border-b border-slate-200 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700">
                                <tr>
                                    {data.columns.map((c) => (
                                        <th key={c} className="py-2.5 pr-4 font-semibold whitespace-nowrap">
                                            {c}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((row, i) => (
                                    <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                                        {row.map((cell, k) => (
                                            <td key={k} className={`py-2 pr-4 ${typeof cell === 'number' ? 'font-mono' : ''}`}>
                                                {cell ?? '—'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.rows.length === 0 && <p className="text-fg-3 py-10 text-center text-sm">Tidak ada data pada periode ini.</p>}
                    </div>
                </Card>
            </div>
        </StafLayout>
    );
}
