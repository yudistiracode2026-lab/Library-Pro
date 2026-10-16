import { type Tone } from '@/components/staf/master/cells';
import { Alert, Button, Card, duration, initials, inputClass, Kpi, PillTabs } from '@/components/staf/ui';
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
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" aria-label="Hari sebelumnya" onClick={() => go({ tanggal: shiftDate(date, -1) })} className={dayButton}>
                        <ChevronLeft className="size-4" />
                    </button>
                    <div className="flex min-w-[150px] flex-col px-2">
                        <span className="font-display text-base font-bold">{dayTitle(date, isToday, dateLabel)}</span>
                        <span className="text-fg-3 text-xs">{dateLabel}</span>
                    </div>
                    <button
                        type="button"
                        aria-label="Hari berikutnya"
                        disabled={isToday}
                        onClick={() => go({ tanggal: shiftDate(date, 1) })}
                        className={`${dayButton} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                        <ChevronRight className="size-4" />
                    </button>
                    {!isToday && (
                        <button
                            type="button"
                            onClick={() =>
                                router.get(route('staf.kegiatan'), base.pegawai ? { pegawai: base.pegawai } : {}, { preserveScroll: true })
                            }
                            className="h-9 cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-semibold text-teal-700 dark:bg-slate-800 dark:text-teal-200"
                        >
                            Hari ini
                        </button>
                    )}
                </div>
                {isAdmin && (
                    <label className="text-fg-2 flex items-center gap-2 text-[13px] font-semibold">
                        Petugas
                        <select
                            value={String(employee.id)}
                            onChange={(e) => go({ pegawai: e.target.value })}
                            className="text-fg-1 h-[38px] max-w-[320px] rounded-[10px] border-[1.5px] border-slate-200 bg-white px-2.5 text-sm font-normal dark:bg-slate-800"
                        >
                            {staff.map((st) => (
                                <option key={st.value} value={st.value}>
                                    {st.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="flex flex-wrap items-start gap-5">
                <Card className="min-w-0 flex-[38_1_300px] gap-3.5 md:p-5">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-display text-[17px] font-bold">Catat kegiatan</span>
                        <span className="text-fg-3 text-[13px]">
                            {employee.name} · {dateLabel}
                        </span>
                    </div>
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

                <Card className="min-w-0 flex-[62_1_380px] gap-1 md:p-5">
                    <div className="flex items-center justify-between gap-2 pb-2.5">
                        <span className="font-display text-[17px] font-bold">Daftar kegiatan</span>
                        <span className="text-fg-3 text-[13px]">{`${logs.length} kegiatan · ${duration(logs.reduce((sum, l) => sum + l.minutes, 0))}`}</span>
                    </div>
                    {logs.map((l) => (
                        <div key={l.id} className="flex items-start gap-3.5 border-t border-slate-200 py-3 dark:border-slate-700">
                            <div className="flex w-[86px] flex-none flex-col gap-0.5">
                                <span className="font-mono text-[13px] font-semibold">
                                    {l.start.replace(':', '.')}–{l.end.replace(':', '.')}
                                </span>
                                <span className="text-fg-3 text-xs">{duration(l.minutes)}</span>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Pill tone={TONES[CATEGORY_TONE[l.category] ?? 'slate']}>{l.category}</Pill>
                                    <Pill tone={l.status === 'Selesai' ? TONES.success : TONES.warning}>{l.status}</Pill>
                                </div>
                                <span className="text-sm leading-normal">{l.description}</span>
                                {l.output && (
                                    <span className="text-fg-3 flex items-center gap-1.5 text-[13px]">
                                        <Target className="size-3.5" />
                                        {l.output}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                aria-label="Hapus kegiatan"
                                onClick={() => router.delete(route('staf.kegiatan.destroy', l.id), { preserveScroll: true })}
                                className="text-fg-3 hover:bg-danger-soft hover:text-danger grid size-8 flex-none cursor-pointer place-items-center rounded-[9px]"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-fg-3 border-t border-slate-200 py-7 text-center text-sm dark:border-slate-700">
                            Belum ada kegiatan tercatat di tanggal ini.
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}

function Recap({ recap, monthLabel, isAdmin, base }: KegiatanProps & { base: Record<string, string> }) {
    const cols = 'grid-cols-[minmax(0,1.6fr)_110px_110px_110px_minmax(0,1fr)_20px]';

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-fg-3 text-sm">
                    Rekap kegiatan {monthLabel}
                    {isAdmin && ' · klik baris untuk melihat catatan harian.'}
                </span>
                <a
                    href={route('staf.kegiatan.export', { tanggal: base.tanggal })}
                    className="flex h-9 items-center gap-1.5 rounded-[10px] bg-teal-400 px-3.5 text-[13px] font-semibold whitespace-nowrap text-white hover:bg-teal-500"
                >
                    <Download className="size-4" />
                    Unduh laporan
                </a>
            </div>
            <section className="overflow-auto rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div
                    className={`text-fg-3 grid min-w-[760px] ${cols} gap-3.5 border-b border-slate-200 px-5 py-3 text-xs font-semibold tracking-[.04em] uppercase dark:border-slate-700`}
                >
                    <span>Petugas</span>
                    <span>Hari terisi</span>
                    <span>Kegiatan</span>
                    <span>Total jam</span>
                    <span>Kegiatan terbanyak</span>
                    <span />
                </div>
                {recap.map((r) => (
                    <button
                        key={r.id}
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => router.get(route('staf.kegiatan'), { tanggal: base.tanggal, pegawai: String(r.id) })}
                        className={`text-fg-1 grid w-full min-w-[760px] ${cols} items-center gap-3.5 border-b border-slate-200 bg-white px-5 py-3 text-left text-sm enabled:cursor-pointer enabled:hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:enabled:hover:bg-slate-900`}
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <span className="grid size-[34px] flex-none place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                                {initials(r.name)}
                            </span>
                            <div className="min-w-0">
                                <div className="font-semibold">{r.name}</div>
                                <div className="text-fg-3 text-xs">
                                    {r.kind === 'pustakawan' ? 'Pustakawan' : 'Tendik'} · {r.position}
                                </div>
                            </div>
                        </div>
                        <span className="font-mono">{r.days}</span>
                        <span className="font-mono">{r.count}</span>
                        <span className="font-mono">{duration(r.minutes)}</span>
                        <span className="text-fg-2 text-[13px]">{r.top ?? '—'}</span>
                        {isAdmin ? <ChevronRight className="text-fg-3 size-4" /> : <span />}
                    </button>
                ))}
            </section>
        </>
    );
}

function Pill({ tone, children }: { tone: string; children: string }) {
    return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{children}</span>;
}

const TONES: Record<Tone, string> = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-amber-800',
    teal: 'bg-teal-50 text-teal-700',
    slate: 'text-fg-2 bg-slate-100 dark:bg-slate-700',
    danger: 'bg-danger-soft text-berry',
};

const dayButton =
    'grid size-9 cursor-pointer place-items-center rounded-[10px] border border-slate-200 bg-white hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-900';

/** "Hari ini", "Kemarin", or the weekday, as the heading above the full date. */
function dayTitle(date: string, isToday: boolean, label: string): string {
    if (isToday) return 'Hari ini';
    if (shiftDate(date, 1) === new Date().toLocaleDateString('sv-SE')) return 'Kemarin';

    return label.split(',')[0];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            {label}
            {children}
        </label>
    );
}
