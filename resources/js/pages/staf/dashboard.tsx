import { BarList, ColumnChart } from '@/components/charts';
import { Badge } from '@/components/staf/master/cells';
import { Card, CardTitle } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, CalendarClock, FileCheck2, Footprints, LogIn, QrCode, Repeat } from 'lucide-react';
import { type ComponentType, useState } from 'react';

interface DashboardProps {
    greeting: string;
    todayLabel: string;
    kpis: { visitsToday: number; inside: number; openLoans: number; overdue: number; dueToday: number; loansToday: number; clearancePending: number };
    collection: { label: string; titles: number; copies: number }[];
    visits: { label: string; date: string; total: number }[];
    loansByClass: { class: string; name: string; total: number }[];
    due: { id: number; title: string; member: string; code: string; daysLeft: number }[];
    activity: { icon: string; text: string; time: string }[];
}

const ACTIVITY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
    'arrow-up-right': ArrowUpRight,
    'arrow-down-left': ArrowDownLeft,
    'log-in': LogIn,
    'file-check-2': FileCheck2,
};

export default function StafDashboard({ greeting, todayLabel, kpis, collection, visits, loansByClass, due, activity }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user.name.split(',')[0].split(' ')[0];
    const [unit, setUnit] = useState<'titles' | 'copies'>('titles');
    const visitAvg = visits.reduce((s, v) => s + v.total, 0) / Math.max(1, visits.length);

    const cards = [
        {
            label: 'Kunjungan hari ini',
            value: kpis.visitsToday,
            sub: `${kpis.inside} sedang di perpustakaan`,
            href: route('staf.kunjungan'),
            icon: Footprints,
            tone: 'bg-teal-50 text-teal-700',
        },
        {
            label: 'Pinjaman aktif',
            value: kpis.openLoans,
            sub: `${kpis.loansToday} dipinjam hari ini`,
            href: route('staf.sirkulasi', { tab: 'aktif' }),
            icon: Repeat,
            tone: 'bg-teal-50 text-teal-700',
        },
        {
            label: 'Terlambat',
            value: kpis.overdue,
            sub: `${kpis.dueToday} jatuh tempo hari ini`,
            href: route('staf.sirkulasi', { tab: 'aktif' }),
            icon: CalendarClock,
            tone: kpis.overdue ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success',
        },
        {
            label: 'Bebas pustaka menunggu',
            value: kpis.clearancePending,
            sub: 'perlu diverifikasi',
            href: route('staf.bebas-pustaka'),
            icon: FileCheck2,
            tone: 'bg-warning-soft text-amber-800',
        },
    ];

    return (
        <StafLayout title="Dashboard" group="Utama">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold">
                        {greeting}, {firstName}
                    </h1>
                    <p className="text-fg-3 mt-1 text-sm">{todayLabel} · ringkasan layanan hari ini</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={route('staf.kunjungan')}
                        className="text-fg-1 flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
                    >
                        <QrCode className="size-4" />
                        Buka presensi
                    </Link>
                    <Link
                        href={route('staf.sirkulasi')}
                        className="shadow-teal flex h-10 items-center gap-2 rounded-md bg-teal-400 px-4 text-sm font-semibold text-white hover:bg-teal-500"
                    >
                        <Repeat className="size-4" />
                        Peminjaman baru
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                {cards.map(({ label, value, sub, href, icon: Icon, tone }) => (
                    <Link
                        key={label}
                        href={href}
                        className="flex flex-col gap-1 rounded-lg bg-white px-[18px] py-4 shadow-sm hover:shadow-md dark:bg-slate-800"
                    >
                        <span className="text-fg-3 flex items-center justify-between text-[13px]">
                            {label}
                            <span className={`grid size-8 place-items-center rounded-[9px] ${tone}`}>
                                <Icon className="size-4" />
                            </span>
                        </span>
                        <span className="font-display text-[28px] font-extrabold">{value.toLocaleString('id-ID')}</span>
                        <span className="text-fg-3 text-xs">{sub}</span>
                    </Link>
                ))}
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-2">
                <Card>
                    <CardTitle
                        aside={
                            <div className="flex gap-1 rounded-[10px] bg-slate-100 p-1 dark:bg-slate-700">
                                {(
                                    [
                                        ['titles', 'Judul'],
                                        ['copies', 'Eksemplar'],
                                    ] as const
                                ).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setUnit(value)}
                                        aria-pressed={unit === value}
                                        className={`h-[28px] cursor-pointer rounded-sm px-3 text-[13px] font-semibold ${unit === value ? 'text-fg-1 bg-white shadow-sm dark:bg-slate-800' : 'text-fg-3'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        Koleksi berdasarkan jenis
                    </CardTitle>
                    <BarList
                        caption={`Jumlah ${unit === 'titles' ? 'judul' : 'eksemplar'} per jenis koleksi`}
                        items={collection.map((c) => ({ label: c.label, value: unit === 'titles' ? c.titles : c.copies }))}
                    />
                </Card>

                <Card>
                    <CardTitle
                        aside={
                            <span className="text-fg-3 text-xs">Rata-rata {visitAvg.toLocaleString('id-ID', { maximumFractionDigits: 1 })}/hari</span>
                        }
                    >
                        Kunjungan 14 hari terakhir
                    </CardTitle>
                    <ColumnChart
                        caption="Kunjungan per hari, 14 hari terakhir"
                        items={visits.map((v) => ({ label: v.label, value: v.total, tip: `${v.label}: ${v.total} kunjungan` }))}
                    />
                </Card>

                <Card>
                    <CardTitle>Peminjaman per klasifikasi bulan ini</CardTitle>
                    <BarList
                        caption="Peminjaman bulan ini per kelas DDC"
                        items={loansByClass.map((c) => ({ label: `${c.class} ${c.name}`, value: c.total }))}
                    />
                </Card>

                <div className="flex flex-col gap-4">
                    <Card>
                        <CardTitle
                            aside={
                                <Link href={route('staf.sirkulasi', { tab: 'aktif' })} className="text-xs font-semibold text-teal-600">
                                    Semua pinjaman
                                </Link>
                            }
                        >
                            Jatuh tempo & terlambat
                        </CardTitle>
                        <div className="flex flex-col">
                            {due.map((d) => (
                                <div
                                    key={d.id}
                                    className="flex items-center gap-3 border-b border-slate-200 py-2 text-sm last:border-0 dark:border-slate-700"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-semibold">{d.title}</div>
                                        <div className="text-fg-3 truncate text-xs">
                                            {d.member} · <span className="font-mono">{d.code}</span>
                                        </div>
                                    </div>
                                    <Badge tone={d.daysLeft < 0 ? 'danger' : d.daysLeft === 0 ? 'warning' : 'slate'}>
                                        {d.daysLeft < 0 ? `Terlambat ${-d.daysLeft} hari` : d.daysLeft === 0 ? 'Hari ini' : `${d.daysLeft} hari lagi`}
                                    </Badge>
                                </div>
                            ))}
                            {due.length === 0 && <p className="text-fg-3 py-4 text-sm">Tidak ada pinjaman yang jatuh tempo dalam 2 hari.</p>}
                        </div>
                    </Card>

                    <Card>
                        <CardTitle>Aktivitas terbaru</CardTitle>
                        <div className="flex flex-col gap-2.5">
                            {activity.map((a, i) => {
                                const Icon = ACTIVITY_ICONS[a.icon] ?? LogIn;

                                return (
                                    <div key={i} className="flex items-start gap-3 text-sm">
                                        <span className="mt-0.5 grid size-7 flex-none place-items-center rounded-[8px] bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-100">
                                            <Icon className="size-3.5" />
                                        </span>
                                        <span className="min-w-0 flex-1">{a.text}</span>
                                        <span className="text-fg-3 font-mono text-xs whitespace-nowrap">{a.time}</span>
                                    </div>
                                );
                            })}
                            {activity.length === 0 && <p className="text-fg-3 text-sm">Belum ada aktivitas.</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </StafLayout>
    );
}
