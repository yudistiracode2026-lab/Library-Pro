import { Badge, type Tone } from '@/components/staf/master/cells';
import { Alert, Button, Card, CardTitle, duration, IconButton, initials, inputClass, Kpi, PillTabs } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type SelectOption } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { BarChart3, ChevronLeft, ChevronRight, Download, NotebookPen, Plus, Target, Trash2 } from 'lucide-react';
import { type FormEvent } from 'react';

interface Log {
    id: number;
    category: string;
    description: string;
    output: string | null;
    status: string;
    start: string;
    end: string;
    minutes: number;
}

interface KegiatanProps {
    tab: 'catat' | 'rekap';
    isAdmin: boolean;
    date: string;
    dateLabel: string;
    isToday: boolean;
    monthLabel: string;
    employee: { id: number; name: string } | null;
    staff: SelectOption[];
    kpis: { count: number; minutes: number; daysFilled: number; filledToday: string | null };
    logs: Log[];
    suggestedStart: string;
    recap: { id: number; name: string; kind: string; position: string; days: number; count: number; minutes: number; top: string | null }[];
    categories: string[];
    statuses: string[];
}

const CATEGORY_TONE: Record<string, Tone> = {
    'Layanan sirkulasi': 'teal',
    'Layanan referensi': 'teal',
    'Pengolahan bahan pustaka': 'warning',
    'Pengembangan koleksi': 'warning',
    'Pemeliharaan koleksi': 'success',
};

function shiftDate(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Kegiatan(props: KegiatanProps) {
    const { tab, isAdmin, date, employee, kpis, monthLabel } = props;
    const base = { tanggal: date, ...(isAdmin && employee ? { pegawai: String(employee.id) } : {}) };

    return (
        <StafLayout title="Kegiatan harian" group="Kepegawaian">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <Kpi label="Kegiatan tercatat" value={String(kpis.count)} sub="pada tanggal dipilih" />
                <Kpi label="Jam kerja tercatat" value={duration(kpis.minutes)} sub="pada tanggal dipilih" />
                <Kpi label="Hari terisi" value={String(kpis.daysFilled)} sub={monthLabel} />
                {kpis.filledToday && <Kpi label="Sudah mengisi hari ini" value={kpis.filledToday} sub="pustakawan & tendik" />}
            </div>

            <PillTabs
                tabs={[
                    { label: 'Catatan harian', href: route('staf.kegiatan', base), active: tab === 'catat', icon: <NotebookPen /> },
                    { label: 'Rekap bulanan', href: route('staf.kegiatan', { ...base, tab: 'rekap' }), active: tab === 'rekap', icon: <BarChart3 /> },
                ]}
            />

            {tab === 'catat' ? <Daily key={`${date}-${employee?.id}`} {...props} base={base} /> : <Recap {...props} base={base} />}
        </StafLayout>
    );
}

function Daily({
    isAdmin,
    date,
    dateLabel,
    isToday,
    employee,
    staff,
    logs,
    suggestedStart,
    categories,
    statuses,
    base,
}: KegiatanProps & { base: Record<string, string> }) {
    const go = (params: Record<string, string>) =>
        router.get(route('staf.kegiatan'), { ...base, ...params }, { preserveScroll: true, preserveState: true });
    const endOf = (start: string) => {
        const [h, m] = start.split(':').map(Number);
        return `${String(Math.min(23, h + 2)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    const form = useForm({
        date,
        pegawai: employee ? String(employee.id) : '',
        starts_at: suggestedStart,
        ends_at: endOf(suggestedStart),
        category: categories[0],
        description: '',
        output: '',
        status: statuses[0],
    });

    if (!employee) {
        return (
            <Alert tone="warning">
                Akun ini belum terhubung dengan data pegawai. Minta administrator menautkannya di master Pustakawan atau Tendik.
            </Alert>
        );
    }

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('staf.kegiatan.store'), { preserveScroll: true, onSuccess: () => form.reset('description', 'output') });
    };

    return (
        <>
            <Card className="flex-row flex-wrap items-center">
                <IconButton label="Hari sebelumnya" onClick={() => go({ tanggal: shiftDate(date, -1) })}>
                    <ChevronLeft className="size-4" />
                </IconButton>
                <span className="min-w-[200px] text-center font-semibold">{dateLabel}</span>
                <IconButton label="Hari berikutnya" disabled={isToday} onClick={() => go({ tanggal: shiftDate(date, 1) })}>
                    <ChevronRight className="size-4" />
                </IconButton>
                {!isToday && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.get(route('staf.kegiatan'), base.pegawai ? { pegawai: base.pegawai } : {}, { preserveScroll: true })}
                    >
                        Hari ini
                    </Button>
                )}
                {isAdmin && (
                    <label className="ml-auto flex items-center gap-2 text-[13px] font-semibold">
                        Petugas
                        <select
                            value={String(employee.id)}
                            onChange={(e) => go({ pegawai: e.target.value })}
                            className={`${inputClass} w-auto max-w-[320px]`}
                        >
                            {staff.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </Card>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <Card>
                    <CardTitle>Catat kegiatan</CardTitle>
                    <p className="text-fg-3 -mt-2 text-[13px]">
                        {employee.name} · {dateLabel}
                    </p>
                    <form onSubmit={submit} className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Mulai">
                                <input
                                    type="time"
                                    value={form.data.starts_at}
                                    onChange={(e) => form.setData('starts_at', e.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Selesai">
                                <input
                                    type="time"
                                    value={form.data.ends_at}
                                    onChange={(e) => form.setData('ends_at', e.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <Field label="Jenis kegiatan">
                            <select value={form.data.category} onChange={(e) => form.setData('category', e.target.value)} className={inputClass}>
                                {categories.map((c) => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Uraian pekerjaan">
                            <textarea
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                rows={3}
                                required
                                placeholder="mis. Katalogisasi buku sumbangan mahasiswa"
                                className={`${inputClass} h-auto py-2.5`}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Hasil / volume">
                                <input
                                    value={form.data.output}
                                    onChange={(e) => form.setData('output', e.target.value)}
                                    placeholder="mis. 25 judul"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Status">
                                <select value={form.data.status} onChange={(e) => form.setData('status', e.target.value)} className={inputClass}>
                                    {statuses.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                        {Object.values(form.errors)[0] && <Alert>{Object.values(form.errors)[0]}</Alert>}
                        <Button type="submit" disabled={form.processing}>
                            <Plus />
                            Simpan kegiatan
                        </Button>
                    </form>
                </Card>

                <Card>
                    <CardTitle
                        aside={
                            <span className="text-fg-3 text-[13px]">{`${logs.length} kegiatan · ${duration(logs.reduce((s, l) => s + l.minutes, 0))}`}</span>
                        }
                    >
                        Daftar kegiatan
                    </CardTitle>
                    <div className="flex flex-col gap-2.5">
                        {logs.map((l) => (
                            <div key={l.id} className="flex gap-3 rounded-md border border-slate-200 p-3.5 dark:border-slate-700">
                                <div className="flex w-[82px] flex-none flex-col">
                                    <span className="font-mono text-[13px] font-semibold">
                                        {l.start.replace(':', '.')}–{l.end.replace(':', '.')}
                                    </span>
                                    <span className="text-fg-3 text-xs">{duration(l.minutes)}</span>
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <div className="flex flex-wrap gap-1.5">
                                        <Badge tone={CATEGORY_TONE[l.category] ?? 'slate'}>{l.category}</Badge>
                                        {l.status === 'Berlanjut' && <Badge tone="warning">Berlanjut</Badge>}
                                    </div>
                                    <span className="text-sm">{l.description}</span>
                                    {l.output && (
                                        <span className="text-fg-3 flex items-center gap-1 text-xs">
                                            <Target className="size-3.5" />
                                            {l.output}
                                        </span>
                                    )}
                                </div>
                                <IconButton
                                    label="Hapus kegiatan"
                                    danger
                                    onClick={() => router.delete(route('staf.kegiatan.destroy', l.id), { preserveScroll: true })}
                                >
                                    <Trash2 className="size-3.5" />
                                </IconButton>
                            </div>
                        ))}
                        {logs.length === 0 && <p className="text-fg-3 py-8 text-center text-sm">Belum ada kegiatan tercatat di tanggal ini.</p>}
                    </div>
                </Card>
            </div>
        </>
    );
}

function Recap({ recap, monthLabel, isAdmin, base }: KegiatanProps & { base: Record<string, string> }) {
    return (
        <Card>
            <CardTitle
                aside={
                    <a
                        href={route('staf.kegiatan.export', { tanggal: base.tanggal })}
                        className="text-fg-1 flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
                    >
                        <Download className="size-4" />
                        Unduh laporan
                    </a>
                }
            >
                Rekap kegiatan {monthLabel}
            </CardTitle>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                    <thead className="text-fg-3 border-b border-slate-200 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700">
                        <tr>
                            {['Petugas', 'Hari terisi', 'Kegiatan', 'Total jam', 'Kegiatan terbanyak'].map((h) => (
                                <th key={h} className="py-2.5 pr-4 font-semibold">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {recap.map((r) => (
                            <tr
                                key={r.id}
                                onClick={() => isAdmin && router.get(route('staf.kegiatan'), { tanggal: base.tanggal, pegawai: String(r.id) })}
                                className={`border-b border-slate-200 dark:border-slate-700 ${isAdmin ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900' : ''}`}
                            >
                                <td className="py-2.5 pr-4">
                                    <div className="flex items-center gap-2.5">
                                        <span className="grid size-8 flex-none place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                                            {initials(r.name)}
                                        </span>
                                        <div>
                                            <div className="font-semibold">{r.name}</div>
                                            <div className="text-fg-3 text-xs">
                                                {r.kind === 'pustakawan' ? 'Pustakawan' : 'Tendik'} · {r.position}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-2.5 pr-4">{r.days}</td>
                                <td className="py-2.5 pr-4">{r.count}</td>
                                <td className="py-2.5 pr-4 font-mono">{duration(r.minutes)}</td>
                                <td className="text-fg-2 py-2.5 pr-4">{r.top ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            {label}
            {children}
        </label>
    );
}
