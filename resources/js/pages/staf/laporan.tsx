import { StafIcon } from '@/components/staf/staf-icon';
import { Card, CardTitle } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type SelectOption } from '@/types';
import { Link, router } from '@inertiajs/react';

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
    const download =
        'text-fg-1 flex h-9 items-center rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-semibold hover:bg-slate-100 dark:bg-slate-800';

    return (
        <StafLayout title="Laporan" group="Sistem">
            <label className="text-fg-3 flex items-center gap-2 text-sm">
                Periode
                <select
                    value={period}
                    onChange={(e) =>
                        router.get(route('staf.laporan'), { laporan: report, periode: e.target.value }, { preserveScroll: true, preserveState: true })
                    }
                    className="text-fg-1 h-10 rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 dark:bg-slate-800"
                >
                    {periods.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
            </label>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {reports.map((r) => {
                    const params = { laporan: r.key, periode: period };

                    return (
                        <div
                            key={r.key}
                            className={`flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800 ${report === r.key ? 'ring-2 ring-teal-300' : ''}`}
                        >
                            <Link href={route('staf.laporan', params)} preserveScroll className="flex flex-col gap-3">
                                <span className="grid size-10 place-items-center rounded-[10px] bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-100">
                                    <StafIcon name={r.icon} className="size-[18px]" />
                                </span>
                                <div>
                                    <div className="font-display font-bold">{r.name}</div>
                                    <div className="text-fg-3 text-[13px] leading-normal">{r.description}</div>
                                </div>
                            </Link>
                            <div className="mt-auto flex gap-2">
                                <a href={route('staf.laporan.download', { format: 'pdf', ...params })} className={download}>
                                    PDF
                                </a>
                                <a href={route('staf.laporan.download', { format: 'csv', ...params })} className={download}>
                                    Excel
                                </a>
                                <Link
                                    href={route('staf.laporan', params)}
                                    preserveScroll
                                    className="ml-auto flex h-9 items-center px-1 text-[13px] font-semibold text-teal-600 hover:text-teal-500"
                                >
                                    {report === r.key ? 'Ditampilkan' : 'Pratinjau'}
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Card>
                <CardTitle>
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
                                        <td
                                            key={k}
                                            className={`py-2 pr-4 ${typeof cell === 'number' ? 'font-mono' : ''} ${k === 0 ? 'whitespace-nowrap' : ''}`}
                                        >
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
        </StafLayout>
    );
}
