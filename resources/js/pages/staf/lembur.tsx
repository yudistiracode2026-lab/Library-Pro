import { Alert, Button, duration, initials, inputClass, Kpi, PillTabs } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    CalendarPlus,
    CircleCheck,
    ClipboardList,
    Clock,
    Fingerprint,
    LogIn,
    LogOut,
    Pencil,
    Printer,
    Sheet,
    Trash2,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Session {
    id: number;
    date: string;
    dow: string;
    day: string;
    mon: string;
    start: string;
    end: string;
    activity: string;
    status: 'Hari ini' | 'Akan datang' | 'Selesai';
    people: { id: number; name: string }[];
}

interface LemburProps {
    tab: 'jadwal' | 'presensi' | 'laporan';
    filter: 'akan' | 'lewat' | 'semua';
    canManage: boolean;
    monthLabel: string;
    kpis: { sessions: number; staff: number; minutes: number; today: number };
    sessions: Session[];
    today: {
        id: number;
        name: string;
        activity: string;
        start: string;
        end: string;
        in: string | null;
        out: string | null;
        minutes: number;
        late: boolean;
        mine: boolean;
    }[];
    history: { id: number; date: string; name: string; activity: string; in: string | null; out: string | null; minutes: number; state: string }[];
    report: { id: number; name: string; position: string; scheduled: number; present: number; late: number; minutes: number }[];
    staff: { id: number; name: string; kind: string }[];
}

const STATUS_TONE: Record<Session['status'], string> = {
    'Akan datang': 'text-fg-2 bg-slate-100 dark:bg-slate-700',
    'Hari ini': 'bg-warning-soft text-amber-800',
    Selesai: 'bg-success-soft text-success',
};
const STATE_TONE: Record<string, string> = {
    'Tepat waktu': 'bg-success-soft text-success',
    Terlambat: 'bg-warning-soft text-amber-800',
    'Belum keluar': 'bg-warning-soft text-amber-800',
    'Tidak hadir': 'bg-danger-soft text-danger',
};

export default function Lembur(props: LemburProps) {
    const { tab, kpis } = props;

    return (
        <StafLayout title="Lembur petugas" group="Kepegawaian">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <Kpi label="Jadwal bulan ini" value={String(kpis.sessions)} sub="sesi lembur" />
                <Kpi label="Petugas terlibat" value={String(kpis.staff)} sub="pustakawan & tendik" />
                <Kpi label="Total jam lembur" value={duration(kpis.minutes)} sub="dari presensi masuk–keluar" />
                <Kpi label="Lembur hari ini" value={String(kpis.today)} sub="sesi berlangsung / akan datang" />
            </div>

            <PillTabs
                tabs={[
                    { label: 'Jadwal', href: route('staf.lembur', { tab: 'jadwal' }), active: tab === 'jadwal', icon: <CalendarDays /> },
                    { label: 'Presensi lembur', href: route('staf.lembur', { tab: 'presensi' }), active: tab === 'presensi', icon: <Fingerprint /> },
                    { label: 'Laporan', href: route('staf.lembur', { tab: 'laporan' }), active: tab === 'laporan', icon: <ClipboardList /> },
                ]}
            />

            {tab === 'jadwal' && <Schedule {...props} />}
            {tab === 'presensi' && <Presence {...props} />}
            {tab === 'laporan' && <Report {...props} />}
        </StafLayout>
    );
}

function Schedule({ sessions, filter, canManage, staff }: LemburProps) {
    const [editing, setEditing] = useState<Session | 'new' | null>(null);

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1.5">
                    {[
                        ['akan', 'Akan datang'],
                        ['lewat', 'Sudah lewat'],
                        ['semua', 'Semua'],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() =>
                                router.get(route('staf.lembur'), { tab: 'jadwal', filter: value }, { preserveScroll: true, preserveState: true })
                            }
                            className={`h-[34px] cursor-pointer rounded-full border px-3.5 text-[13px] font-semibold ${filter === value ? 'border-teal-400 bg-teal-400 text-white' : 'text-fg-2 border-slate-200 bg-white dark:bg-slate-800'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {canManage && (
                    <button
                        type="button"
                        onClick={() => setEditing('new')}
                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] bg-teal-400 px-3.5 text-[13px] font-semibold whitespace-nowrap text-white hover:bg-teal-500 active:scale-[.98]"
                    >
                        <CalendarPlus className="size-4" />
                        Jadwalkan lembur
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {sessions.map((s) => {
                    const isToday = s.status === 'Hari ini';

                    return (
                        <section
                            key={s.id}
                            className={`flex flex-wrap items-center gap-5 rounded-lg bg-white px-5 py-4 shadow-sm dark:bg-slate-800 ${s.status === 'Selesai' ? 'opacity-75' : ''}`}
                        >
                            <div
                                className={`flex w-16 flex-none flex-col items-center rounded-md py-2 ${isToday ? 'bg-teal-400 text-white' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                            >
                                <span className="text-[11px] font-semibold tracking-[.06em] uppercase">{s.dow}</span>
                                <span className="font-display text-2xl leading-[1.1] font-extrabold">{s.day}</span>
                                <span className="text-[11px]">{s.mon}</span>
                            </div>
                            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-display text-base font-bold">{s.activity}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[s.status]}`}>{s.status}</span>
                                </div>
                                <span className="text-fg-3 flex items-center gap-1.5 text-[13px]">
                                    <Clock className="size-3.5" />
                                    <span className="font-mono">
                                        {s.start.replace(':', '.')} – {s.end.replace(':', '.')}
                                    </span>
                                    · {duration(minutesBetween(s.start, s.end))}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="flex pl-1.5">
                                    {s.people.map((p) => (
                                        <span
                                            key={p.id}
                                            title={p.name}
                                            className="font-display -ml-1.5 grid size-[34px] place-items-center rounded-full border-2 border-white bg-teal-100 text-xs font-bold text-teal-800 dark:border-slate-800"
                                        >
                                            {initials(p.name)}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-fg-2 text-[13px]">
                                    {s.people.length === 1 ? s.people[0].name.split(',')[0] : `${s.people.length} petugas`}
                                </span>
                            </div>
                            {canManage && (
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        title="Ubah"
                                        onClick={() => setEditing(s)}
                                        className="text-fg-2 grid size-[34px] cursor-pointer place-items-center rounded-[9px] hover:bg-teal-50 hover:text-teal-700"
                                    >
                                        <Pencil className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        title="Hapus"
                                        onClick={() => router.delete(route('staf.lembur.destroy', s.id), { preserveScroll: true })}
                                        className="text-fg-2 hover:bg-danger-soft hover:text-danger grid size-[34px] cursor-pointer place-items-center rounded-[9px]"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            )}
                        </section>
                    );
                })}
                {sessions.length === 0 && (
                    <div className="text-fg-3 rounded-lg bg-white p-10 text-center text-sm shadow-sm dark:bg-slate-800">
                        Belum ada jadwal lembur di kategori ini.
                    </div>
                )}
            </div>

            {editing && <SessionForm session={editing === 'new' ? null : editing} staff={staff} onClose={() => setEditing(null)} />}
        </>
    );
}

function SessionForm({ session, staff, onClose }: { session: Session | null; staff: LemburProps['staff']; onClose: () => void }) {
    const form = useForm({
        activity: session?.activity ?? '',
        date: session?.date ?? '',
        starts_at: session?.start ?? '16:00',
        ends_at: session?.end ?? '21:00',
        employees: session?.people.map((p) => p.id) ?? ([] as number[]),
    });

    const toggle = (id: number) =>
        form.setData('employees', form.data.employees.includes(id) ? form.data.employees.filter((x) => x !== id) : [...form.data.employees, id]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };
        if (session) form.put(route('staf.lembur.update', session.id), options);
        else form.post(route('staf.lembur.store'), options);
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl p-7 sm:max-w-[560px]">
                <form onSubmit={submit} className="flex flex-col gap-3.5">
                    <DialogTitle className="font-display text-xl font-bold">{session ? 'Ubah jadwal lembur' : 'Jadwalkan lembur'}</DialogTitle>
                    <DialogDescription className="sr-only">Isi kegiatan, waktu, dan petugas lembur.</DialogDescription>
                    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                        Kegiatan
                        <input
                            value={form.data.activity}
                            onChange={(e) => form.setData('activity', e.target.value)}
                            required
                            placeholder="mis. Layanan ruang baca masa ujian"
                            className={inputClass}
                        />
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                            Tanggal
                            <input
                                type="date"
                                value={form.data.date}
                                onChange={(e) => form.setData('date', e.target.value)}
                                required
                                className={inputClass}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                            Mulai
                            <input
                                type="time"
                                value={form.data.starts_at}
                                onChange={(e) => form.setData('starts_at', e.target.value)}
                                required
                                className={inputClass}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                            Selesai
                            <input
                                type="time"
                                value={form.data.ends_at}
                                onChange={(e) => form.setData('ends_at', e.target.value)}
                                required
                                className={inputClass}
                            />
                        </label>
                    </div>
                    <span className="text-[13px] font-semibold">Petugas lembur</span>
                    <div className="-mt-1.5 flex flex-wrap gap-1.5">
                        {staff.map((p) => {
                            const on = form.data.employees.includes(p.id);

                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => toggle(p.id)}
                                    aria-pressed={on}
                                    className={`flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-[13px] ${on ? 'border-teal-400 bg-teal-50 font-semibold text-teal-800 dark:bg-teal-900' : 'text-fg-2 border-slate-200'}`}
                                >
                                    <span className="grid size-6 place-items-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-800">
                                        {initials(p.name)}
                                    </span>
                                    {p.name.split(',')[0]}
                                </button>
                            );
                        })}
                    </div>
                    {Object.values(form.errors)[0] && <Alert>{Object.values(form.errors)[0]}</Alert>}
                    <div className="mt-2 flex justify-end gap-2">
                        <Button variant="secondary" size="lg" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" size="lg" disabled={form.processing}>
                            Simpan jadwal
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Presence({ today, history }: LemburProps) {
    const act = (name: string, id: number) => router.post(route(name, id), {}, { preserveScroll: true });
    const small = 'flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] text-[13px] font-semibold whitespace-nowrap active:scale-[.98]';

    return (
        <>
            <section className="flex flex-col gap-3.5 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-display text-[17px] font-bold">Lembur hari ini</span>
                    <span className="text-fg-3 text-[13px]">Presensi masuk dibuka 30 menit sebelum jam mulai, oleh petugas yang bersangkutan.</span>
                </div>
                {today.map((r) => (
                    <div
                        key={r.id}
                        className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-slate-200 px-3.5 py-3 dark:border-slate-700"
                    >
                        <span className="font-display grid size-10 flex-none place-items-center rounded-full border-2 border-white bg-teal-100 text-xs font-bold text-teal-800 dark:border-slate-800">
                            {initials(r.name)}
                        </span>
                        <div className="min-w-0 flex-[1_1_200px]">
                            <div className="font-semibold">{r.name}</div>
                            <div className="text-fg-3 text-xs">
                                {r.activity} ·{' '}
                                <span className="font-mono">
                                    {r.start.replace(':', '.')} – {r.end.replace(':', '.')}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-4 text-[13px]">
                            {[
                                ['Masuk', r.in ?? '—', r.late ? 'text-amber-800' : ''],
                                ['Keluar', r.out ?? '—', ''],
                            ].map(([label, value, tone]) => (
                                <div key={label} className="flex flex-col">
                                    <span className="text-fg-3 text-[11px]">{label}</span>
                                    <span className={`font-mono font-semibold ${tone}`}>{value}</span>
                                </div>
                            ))}
                            <div className="flex flex-col">
                                <span className="text-fg-3 text-[11px]">Durasi</span>
                                <span className="font-semibold">{r.minutes ? duration(r.minutes) : '—'}</span>
                            </div>
                        </div>
                        {r.out ? (
                            <span className="text-success flex items-center gap-1.5 text-[13px] font-semibold">
                                <CircleCheck className="size-4" />
                                Selesai
                            </span>
                        ) : !r.mine ? (
                            <span className="text-fg-4 text-xs">Presensi oleh petugas ybs.</span>
                        ) : r.in ? (
                            <button
                                type="button"
                                onClick={() => act('staf.lembur.check-out', r.id)}
                                className={`${small} text-fg-1 border border-slate-200 bg-white px-3 hover:bg-slate-100 dark:bg-slate-800`}
                            >
                                <LogOut className="size-4" />
                                Presensi keluar
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => act('staf.lembur.check-in', r.id)}
                                className={`${small} bg-teal-400 px-3.5 text-white hover:bg-teal-500`}
                            >
                                <LogIn className="size-4" />
                                Presensi masuk
                            </button>
                        )}
                    </div>
                ))}
                {today.length === 0 && <div className="text-fg-3 p-6 text-center text-sm">Tidak ada lembur yang dijadwalkan hari ini.</div>}
            </section>

            <section className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div className="font-display border-b border-slate-200 px-5 py-4 text-[17px] font-bold dark:border-slate-700">
                    Riwayat presensi lembur
                </div>
                {history.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center gap-3.5 border-b border-slate-200 px-5 py-3 text-sm dark:border-slate-700">
                        <span className="text-fg-3 w-[84px] flex-none text-[13px]">{r.date}</span>
                        <span className="font-display grid size-8 flex-none place-items-center rounded-full border-2 border-white bg-teal-100 text-xs font-bold text-teal-800 dark:border-slate-800">
                            {initials(r.name)}
                        </span>
                        <div className="min-w-0 flex-[1_1_200px]">
                            <div className="font-semibold">{r.name}</div>
                            <div className="text-fg-3 text-xs">{r.activity}</div>
                        </div>
                        <span className="w-[110px] font-mono text-[13px]">
                            {r.in ?? '—'} – {r.out ?? '—'}
                        </span>
                        <span className="w-[70px] text-[13px] font-semibold">{r.minutes ? duration(r.minutes) : '—'}</span>
                        <span
                            className={`rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap ${STATE_TONE[r.state] ?? STATE_TONE['Tidak hadir']}`}
                        >
                            {r.state}
                        </span>
                    </div>
                ))}
                {history.length === 0 && <div className="text-fg-3 p-6 text-center text-sm">Belum ada riwayat presensi lembur.</div>}
            </section>
        </>
    );
}

function Report({ report, monthLabel }: LemburProps) {
    const max = Math.max(1, ...report.map((r) => r.minutes));
    const button = 'flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold whitespace-nowrap';

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-fg-3 flex items-center gap-2 text-sm">
                    Periode
                    <select className="text-fg-1 h-10 rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 dark:bg-slate-800">
                        <option>{monthLabel}</option>
                    </select>
                </label>
                <div className="flex flex-wrap gap-2">
                    <a
                        href={route('staf.lembur.export')}
                        className={`${button} text-fg-1 border border-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800`}
                    >
                        <Sheet className="size-4" />
                        Unduh Excel
                    </a>
                    <a href={route('staf.lembur.letter')} className={`${button} bg-teal-400 px-3.5 text-white hover:bg-teal-500`}>
                        <Printer className="size-4" />
                        Cetak surat perintah lembur
                    </a>
                </div>
            </div>
            <section className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div className="flex flex-wrap justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <span className="font-display text-[17px] font-bold">Rekap lembur per petugas</span>
                    <span className="text-fg-3 text-[13px]">Hanya sesi yang sudah lewat · {monthLabel}</span>
                </div>
                {report.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center gap-3.5 border-b border-slate-200 px-5 py-3.5 dark:border-slate-700">
                        <span className="font-display grid size-[38px] flex-none place-items-center rounded-full border-2 border-white bg-teal-100 text-xs font-bold text-teal-800 dark:border-slate-800">
                            {initials(r.name)}
                        </span>
                        <div className="min-w-0 flex-[1_1_200px]">
                            <div className="font-semibold">{r.name}</div>
                            <div className="text-fg-3 text-xs">{r.position}</div>
                        </div>
                        <div className="flex flex-wrap gap-5 text-[13px]">
                            <Stat label="Dijadwalkan" value={`${r.scheduled} sesi`} />
                            <Stat label="Hadir" value={`${r.present} sesi`} />
                            <Stat label="Terlambat" value={String(r.late)} tone={r.late ? 'text-amber-800' : ''} />
                            <div className="flex min-w-[150px] flex-col gap-1">
                                <span className="text-fg-3 text-[11px]">Total jam</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                        <div className="h-full bg-teal-400" style={{ width: `${Math.round((r.minutes / max) * 100)}%` }} />
                                    </div>
                                    <span className="font-mono font-bold">{duration(r.minutes)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {report.length === 0 && <div className="text-fg-3 p-6 text-center text-sm">Belum ada sesi lembur yang selesai bulan ini.</div>}
                <div className="flex flex-wrap justify-between gap-3 bg-slate-50 px-5 py-3.5 text-sm font-bold dark:bg-slate-900">
                    <span>Total</span>
                    <span>
                        {report.reduce((sum, r) => sum + r.scheduled, 0)} penugasan · {duration(report.reduce((sum, r) => sum + r.minutes, 0))}
                    </span>
                </div>
            </section>
        </>
    );
}

function Stat({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
    return (
        <div className="flex min-w-[60px] flex-col">
            <span className="text-fg-3 text-[11px]">{label}</span>
            <span className={`font-bold ${tone}`}>{value}</span>
        </div>
    );
}

function minutesBetween(start: string, end: string): number {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);

    return h2 * 60 + m2 - (h1 * 60 + m1);
}
