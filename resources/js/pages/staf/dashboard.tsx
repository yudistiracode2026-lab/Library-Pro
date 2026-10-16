import { DDC_COLORS } from '@/components/staf/master/cells';
import StafLayout from '@/layouts/staf-layout';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    AlarmClock,
    ArrowDownLeft,
    ArrowUpRight,
    Book,
    BookCopy,
    BookMarked,
    ClipboardList,
    FileCheck2,
    Footprints,
    GraduationCap,
    LibraryBig,
    LogIn,
    Map as MapIcon,
    Newspaper,
    Presentation,
    QrCode,
    Repeat,
    TabletSmartphone,
} from 'lucide-react';
import { type ComponentType, type ReactNode, useState } from 'react';

type Icon = ComponentType<{ className?: string }>;

interface DashboardProps {
    greeting: string;
    todayLabel: string;
    kpis: { visitsToday: number; inside: number; openLoans: number; overdue: number; clearancePending: number; titles: number; copies: number };
    collection: { label: string; titles: number; copies: number }[];
    growth: { years: number[]; sources: string[]; types: Record<string, number[][]> };
    visits: { day: number; label: string; total: number; weekend: boolean; today: boolean }[];
    loansByClass: { class: string; name: string; total: number }[];
    due: { id: number; title: string; member: string; code: string; daysLeft: number }[];
    activity: { icon: string; text: string; time: string }[];
}

/** Collection types as in the prototype: icon, mark colour (CSS var), soft tile, tile ink. */
const TYPES: Record<string, [Icon, string, string, string]> = {
    'Buku teks': [Book, 'var(--color-teal-400)', 'bg-teal-50', 'text-teal-700'],
    'E-book': [TabletSmartphone, 'var(--color-teal-700)', 'bg-teal-50', 'text-teal-700'],
    Skripsi: [GraduationCap, 'var(--color-marigold)', 'bg-warning-soft', 'text-amber-800'],
    'Tugas akhir & laporan PKL': [ClipboardList, 'var(--color-sunset)', 'bg-warning-soft', 'text-amber-800'],
    Prosiding: [Presentation, 'var(--color-berry)', 'bg-danger-soft', 'text-berry'],
    'Jurnal & majalah': [Newspaper, 'var(--color-violet)', 'bg-slate-100 dark:bg-slate-700', 'text-violet'],
    Referensi: [LibraryBig, 'var(--color-coral)', 'bg-danger-soft', 'text-coral'],
    'Peta & atlas': [MapIcon, 'var(--color-plum)', 'bg-slate-100 dark:bg-slate-700', 'text-plum dark:text-fg-2'],
    'Terbitan STPN Press': [BookMarked, 'var(--color-teal-600)', 'bg-teal-50', 'text-teal-600'],
};

const SOURCE_COLORS = ['var(--color-teal-400)', 'var(--color-marigold)', 'var(--color-berry)'];

const ACTIVITY_ICONS: Record<string, Icon> = {
    'arrow-up-right': ArrowUpRight,
    'arrow-down-left': ArrowDownLeft,
    'log-in': LogIn,
    'file-check-2': FileCheck2,
};

const num = (n: number) => n.toLocaleString('id-ID');

function Panel({ children, gap = 'gap-5' }: { children: ReactNode; gap?: string }) {
    return <section className={`flex min-w-0 flex-col rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800 ${gap}`}>{children}</section>;
}

function PanelTitle({ children }: { children: ReactNode }) {
    return <div className="font-display text-[17px] font-bold">{children}</div>;
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
    return (
        <div className="flex gap-1 rounded-[10px] bg-slate-100 p-1 dark:bg-slate-700">
            {options.map(([id, label]) => (
                <button
                    key={id}
                    type="button"
                    aria-pressed={value === id}
                    onClick={() => onChange(id)}
                    className={`h-[30px] cursor-pointer rounded-[8px] px-3 text-[13px] font-semibold ${value === id ? 'text-fg-1 bg-white shadow-sm dark:bg-slate-800' : 'text-fg-3'}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

export default function StafDashboard({ greeting, todayLabel, kpis, collection, growth, visits, loansByClass, due, activity }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user.name.split(',')[0].split(' ')[0];

    const cards: { label: string; value: string; sub: string; href: string; icon: Icon; tone: string }[] = [
        {
            label: 'Kunjungan hari ini',
            value: num(kpis.visitsToday),
            sub: `${kpis.inside} sedang di perpustakaan`,
            href: route('staf.kunjungan'),
            icon: Footprints,
            tone: 'bg-teal-50 text-teal-700',
        },
        {
            label: 'Peminjaman aktif',
            value: num(kpis.openLoans),
            sub: `${num(kpis.openLoans)} eksemplar keluar`,
            href: route('staf.sirkulasi', { tab: 'aktif' }),
            icon: Repeat,
            tone: 'bg-teal-50 text-teal-700',
        },
        {
            label: 'Terlambat',
            value: num(kpis.overdue),
            sub: 'perlu diingatkan',
            href: route('staf.sirkulasi', { tab: 'aktif' }),
            icon: AlarmClock,
            tone: 'bg-danger-soft text-danger',
        },
        {
            label: 'Bebas pustaka',
            value: num(kpis.clearancePending),
            sub: 'menunggu verifikasi',
            href: route('staf.bebas-pustaka'),
            icon: FileCheck2,
            tone: 'bg-warning-soft text-amber-800',
        },
        {
            label: 'Total koleksi',
            value: num(kpis.titles),
            sub: `judul · ${num(kpis.copies)} eksemplar`,
            href: route('staf.buku'),
            icon: BookCopy,
            tone: 'text-fg-2 bg-slate-100 dark:bg-slate-700',
        },
    ];

    return (
        <StafLayout title="Dashboard" group="Utama">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display m-0 text-[28px] font-bold">
                        {greeting}, {firstName}
                    </h1>
                    <p className="text-fg-3 mt-1 text-[15px]">{todayLabel} · ringkasan layanan hari ini</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={route('staf.kunjungan')}
                        className="text-fg-1 flex h-10 flex-none items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold whitespace-nowrap hover:bg-slate-100 dark:bg-slate-800"
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

            <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
                {cards.map(({ label, value, sub, href, icon: Icon, tone }) => (
                    <Link
                        key={label}
                        href={href}
                        className="flex flex-col gap-2.5 rounded-lg bg-white p-[18px] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800"
                    >
                        <span className="flex items-center justify-between">
                            <span className="text-fg-3 text-[13px]">{label}</span>
                            <span className={`grid size-8 place-items-center rounded-[9px] ${tone}`}>
                                <Icon className="size-4" />
                            </span>
                        </span>
                        <span className="font-display text-[30px] leading-tight font-extrabold tracking-[-.02em]">{value}</span>
                        <span className="text-fg-3 text-xs">{sub}</span>
                    </Link>
                ))}
            </div>

            <CollectionByType collection={collection} todayLabel={todayLabel} />
            <CollectionGrowth growth={growth} todayLabel={todayLabel} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[repeat(auto-fit,minmax(380px,1fr))]">
                <VisitsChart visits={visits} />
                <Panel gap="gap-3.5">
                    <PanelTitle>Peminjaman per klasifikasi (bulan ini)</PanelTitle>
                    {(() => {
                        const max = Math.max(1, ...loansByClass.map((c) => c.total));

                        return loansByClass.map((c) => (
                            <div key={c.class} className="grid grid-cols-[160px_minmax(0,1fr)_40px] items-center gap-3 text-[13px]">
                                <span className="text-fg-2">
                                    {c.class} {c.name}
                                </span>
                                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                    <div
                                        className={`h-full rounded-full ${DDC_COLORS[c.class]}`}
                                        style={{ width: `${Math.round((c.total / max) * 100)}%` }}
                                    />
                                </div>
                                <span className="text-right font-mono">{c.total}</span>
                            </div>
                        ));
                    })()}
                </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[repeat(auto-fit,minmax(380px,1fr))]">
                <Panel gap="gap-3">
                    <PanelTitle>Jatuh tempo &amp; terlambat</PanelTitle>
                    {due.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 border-b border-slate-200 py-2.5 dark:border-slate-700">
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold">{d.title}</div>
                                <div className="text-fg-3 text-xs">
                                    {d.member} · {d.code}
                                </div>
                            </div>
                            <span
                                className={`flex-none rounded-full px-2.5 py-[3px] text-xs font-semibold ${d.daysLeft < 0 ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-amber-800'}`}
                            >
                                {d.daysLeft < 0 ? `Terlambat ${-d.daysLeft} hari` : 'Jatuh tempo hari ini'}
                            </span>
                        </div>
                    ))}
                    {due.length === 0 && <p className="text-fg-3 text-sm">Tidak ada pinjaman yang jatuh tempo atau terlambat.</p>}
                </Panel>

                <Panel gap="gap-3">
                    <PanelTitle>Aktivitas terbaru</PanelTitle>
                    {activity.map((a, i) => {
                        const Icon = ACTIVITY_ICONS[a.icon] ?? LogIn;

                        return (
                            <div key={i} className="flex items-start gap-3">
                                <span className="text-fg-2 grid size-[30px] flex-none place-items-center rounded-full bg-slate-100 dark:bg-slate-700">
                                    <Icon className="size-3.5" />
                                </span>
                                <div className="flex-1 text-sm leading-[1.45]">
                                    {a.text}
                                    <div className="text-fg-3 text-xs">{a.time}</div>
                                </div>
                            </div>
                        );
                    })}
                    {activity.length === 0 && <p className="text-fg-3 text-sm">Belum ada aktivitas.</p>}
                </Panel>
            </div>
        </StafLayout>
    );
}

function CollectionByType({ collection, todayLabel }: { collection: DashboardProps['collection']; todayLabel: string }) {
    const [mode, setMode] = useState<'titles' | 'copies'>('titles');
    const total = collection.reduce((a, c) => a + c[mode], 0);
    const max = Math.max(1, ...collection.map((c) => c[mode]));
    let acc = 0;
    const stops = collection.map((c) => {
        const from = (acc / Math.max(1, total)) * 360;
        acc += c[mode];

        return `${TYPES[c.label][1]} ${from}deg ${(acc / Math.max(1, total)) * 360}deg`;
    });

    return (
        <Panel>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <PanelTitle>Koleksi pustaka berdasarkan jenis</PanelTitle>
                    <div className="text-fg-3 text-[13px]">Jumlah judul per jenis koleksi · data per {todayLabel}</div>
                </div>
                <Segmented
                    value={mode}
                    onChange={setMode}
                    options={[
                        ['titles', 'Judul'],
                        ['copies', 'Eksemplar'],
                    ]}
                />
            </div>
            <div className="flex flex-wrap items-start gap-x-8 gap-y-6">
                <div className="mx-auto grid flex-[0_0_200px] place-items-center">
                    <div
                        role="img"
                        aria-label={`Total ${num(total)} ${mode === 'titles' ? 'judul' : 'eksemplar'}`}
                        className="relative aspect-square w-[200px] rounded-full"
                        style={{ background: total ? `conic-gradient(${stops.join(', ')})` : 'var(--color-slate-100)' }}
                    >
                        <div className="absolute inset-[30px] flex flex-col items-center justify-center gap-0.5 rounded-full bg-white text-center dark:bg-slate-800">
                            <span className="font-display text-[30px] font-extrabold tracking-[-.02em]">{num(total)}</span>
                            <span className="text-fg-3 text-xs">{mode === 'titles' ? 'judul koleksi' : 'eksemplar'}</span>
                        </div>
                    </div>
                </div>
                <div className="grid min-w-0 flex-[1_1_340px] grid-cols-[repeat(auto-fill,minmax(min(100%,170px),1fr))] gap-x-5 gap-y-1">
                    {collection.map((c) => {
                        const [Icon, color, soft, ink] = TYPES[c.label];
                        const value = c[mode];

                        return (
                            <div key={c.label} className="flex flex-col gap-1.5 border-b border-slate-200 py-2.5 dark:border-slate-700">
                                <div className="flex items-center gap-2.5">
                                    <span className={`grid size-[30px] flex-none place-items-center rounded-[8px] ${soft} ${ink}`}>
                                        <Icon className="size-[15px]" />
                                    </span>
                                    <span className="min-w-0 flex-1 text-[13px] leading-[1.3] font-semibold">{c.label}</span>
                                    <span className="font-mono text-sm font-semibold">{num(value)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${Math.round((value / max) * 100)}%`, background: color }}
                                        />
                                    </div>
                                    <span className="text-fg-3 w-10 text-right text-xs">
                                        {total ? ((value / total) * 100).toFixed(1).replace('.', ',') : '0,0'}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Panel>
    );
}

function CollectionGrowth({ growth, todayLabel }: { growth: DashboardProps['growth']; todayLabel: string }) {
    const [type, setType] = useState('Semua jenis');
    const { years, sources } = growth;
    const data = growth.types[type];
    const totals = data.map((d) => d.reduce((a, b) => a + b, 0));
    const max = Math.max(...totals, 1);
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((x) => x * 4 >= max) ?? Math.ceil(max / 4);
    const top = step * 4;
    const grand = totals.reduce((a, b) => a + b, 0) || 1;
    const first = years[0];
    const last = years[years.length - 1];
    const lastFull = totals[totals.length - 2];
    const prev = totals[totals.length - 3];
    const change = prev ? Math.round(((lastFull - prev) / prev) * 100) : 0;

    return (
        <Panel>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <PanelTitle>Penambahan koleksi per tahun</PanelTitle>
                    <div className="text-fg-3 text-[13px]">
                        Jumlah judul baru menurut sumber perolehan · {first}–{last} ({last} s.d. {todayLabel})
                    </div>
                </div>
                <label className="text-fg-2 flex items-center gap-2 text-[13px] font-semibold">
                    Jenis koleksi
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="text-fg-1 h-9 rounded-[10px] border-[1.5px] border-slate-200 bg-white px-2.5 text-sm font-normal dark:bg-slate-800"
                    >
                        {Object.keys(growth.types).map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                {sources.map((label, si) => {
                    const t = data.reduce((a, d) => a + d[si], 0);

                    return (
                        <div key={label} className="flex flex-col gap-1 rounded-md bg-slate-50 px-3.5 py-3 dark:bg-slate-900">
                            <span className="text-fg-2 flex items-center gap-2 text-[13px] font-semibold">
                                <span className="size-2.5 flex-none rounded-[3px]" style={{ background: SOURCE_COLORS[si] }} />
                                {label}
                            </span>
                            <span className="font-display text-[22px] font-extrabold">{num(t)}</span>
                            <span className="text-fg-3 text-xs">
                                {Math.round((t / grand) * 100)}% dari total {first}–{last}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-stretch gap-2.5">
                <div className="text-fg-3 flex h-60 flex-none flex-col justify-between pb-7 text-right font-mono text-[11px]">
                    {[4, 3, 2, 1, 0].map((i) => (
                        <span key={i}>{num(step * i)}</span>
                    ))}
                </div>
                <div className="relative flex h-60 min-w-0 flex-1 items-end gap-3 border-b border-slate-200 pb-7 dark:border-slate-700">
                    {years.map((year, yi) => {
                        const current = yi === years.length - 1;

                        return (
                            <div
                                key={year}
                                title={`${year}: ${sources.map((l, si) => `${l} ${num(data[yi][si])}`).join(' · ')}`}
                                className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                            >
                                <span className="font-mono text-xs font-semibold">{num(totals[yi])}</span>
                                <div
                                    className="flex w-[min(56px,100%)] flex-col-reverse overflow-hidden rounded-t-[6px]"
                                    style={{ height: `${(totals[yi] / top) * 100}%` }}
                                >
                                    {sources.map((s, si) => (
                                        <div
                                            key={s}
                                            style={{
                                                height: `${totals[yi] ? (data[yi][si] / totals[yi]) * 100 : 0}%`,
                                                background: SOURCE_COLORS[si],
                                                opacity: current ? 0.55 : 1,
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className={`absolute -bottom-6 text-xs font-semibold ${current ? 'text-fg-3' : 'text-fg-1'}`}>{year}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="text-fg-3 flex flex-wrap justify-between gap-3 text-[13px]">
                <span>
                    {type}: {num(lastFull)} judul ditambahkan pada {last - 1}, {change >= 0 ? 'naik' : 'turun'} {Math.abs(change)}% dibanding{' '}
                    {last - 2}. Arahkan kursor ke batang untuk rincian per sumber.
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[3px] bg-slate-300" />
                    Batang pudar: tahun berjalan (data belum penuh)
                </span>
            </div>
        </Panel>
    );
}

function VisitsChart({ visits }: { visits: DashboardProps['visits'] }) {
    const max = Math.max(1, ...visits.map((v) => v.total));
    const avg = Math.round(visits.reduce((a, v) => a + v.total, 0) / Math.max(1, visits.length));

    return (
        <Panel>
            <div className="flex justify-between">
                <PanelTitle>Kunjungan 14 hari terakhir</PanelTitle>
                <span className="text-fg-3 text-[13px]">Rata-rata {avg}/hari</span>
            </div>
            <div className="flex h-[180px] items-end gap-2">
                {visits.map((d) => (
                    <div
                        key={d.label}
                        title={`${d.label}: ${d.total} kunjungan`}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                    >
                        <span className="text-fg-3 text-[10px]">{d.total}</span>
                        <div
                            className={`w-full rounded-t-[6px] rounded-b-[2px] ${d.today ? 'bg-teal-400' : d.weekend ? 'bg-slate-200 dark:bg-slate-600' : 'bg-teal-200 dark:bg-teal-700'}`}
                            style={{ height: `${Math.round((d.total / max) * 100)}%` }}
                        />
                        <span className="text-fg-3 text-[10px]">{d.day}</span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}
