import { Badge, type Tone } from '@/components/staf/master/cells';
import { Alert, Button, Card, CardTitle, duration, IconButton, initials, inputClass, Kpi, PillTabs } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { router, useForm } from '@inertiajs/react';
import { CalendarDays, CalendarPlus, CircleCheck, ClipboardList, Download, Fingerprint, LogIn, LogOut, Pencil, Printer, Trash2 } from 'lucide-react';
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

const STATUS_TONE: Record<Session['status'], Tone> = { 'Hari ini': 'warning', 'Akan datang': 'teal', Selesai: 'slate' };
const STATE_TONE: Record<string, Tone> = { 'Tepat waktu': 'success', Terlambat: 'warning', 'Tidak hadir': 'danger' };

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
                    <Button onClick={() => setEditing('new')}>
                        <CalendarPlus />
                        Jadwalkan lembur
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-2.5">
                {sessions.map((s) => (
                    <Card key={s.id} className="flex-row items-center gap-4 py-4 md:py-4">
                        <div className="flex w-14 flex-none flex-col items-center rounded-md bg-teal-50 py-1.5 text-teal-800 dark:bg-teal-900 dark:text-teal-100">
                            <span className="text-[11px] font-semibold uppercase">{s.dow}</span>
                            <span className="font-display text-xl leading-none font-extrabold">{s.day}</span>
                            <span className="text-[11px]">{s.mon}</span>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{s.activity}</span>
                                <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                            </div>
                            <span className="text-fg-3 font-mono text-[13px]">
                                {s.start.replace(':', '.')}–{s.end.replace(':', '.')}
                            </span>
                        </div>
                        <div className="hidden items-center sm:flex">
                            {s.people.map((p, i) => (
                                <span
                                    key={p.id}
                                    title={p.name}
                                    className={`grid size-8 place-items-center rounded-full border-2 border-white bg-teal-100 text-[11px] font-bold text-teal-800 ${i ? '-ml-2' : ''}`}
                                >
                                    {initials(p.name)}
                                </span>
                            ))}
                            <span className="text-fg-3 ml-2 text-xs">{s.people.length} petugas</span>
                        </div>
                        {canManage && (
                            <div className="flex gap-1">
                                <IconButton label="Ubah" onClick={() => setEditing(s)}>
                                    <Pencil className="size-3.5" />
                                </IconButton>
                                <IconButton
                                    label="Hapus"
                                    danger
                                    onClick={() => router.delete(route('staf.lembur.destroy', s.id), { preserveScroll: true })}
                                >
                                    <Trash2 className="size-3.5" />
                                </IconButton>
                            </div>
                        )}
                    </Card>
                ))}
                {sessions.length === 0 && <p className="text-fg-3 py-8 text-center text-sm">Belum ada jadwal lembur di kategori ini.</p>}
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

    return (
        <>
            <Card>
                <CardTitle>Lembur hari ini</CardTitle>
                <p className="text-fg-3 -mt-2 text-[13px]">
                    Presensi masuk dibuka 30 menit sebelum jam mulai, dan dilakukan oleh petugas yang bersangkutan.
                </p>
                <div className="flex flex-col gap-2.5">
                    {today.map((r) => (
                        <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-md border border-slate-200 p-3.5 dark:border-slate-700">
                            <span className="grid size-10 flex-none place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                                {initials(r.name)}
                            </span>
                            <div className="min-w-[180px] flex-1">
                                <div className="font-semibold">{r.name}</div>
                                <div className="text-fg-3 text-xs">
                                    {r.activity} · {r.start.replace(':', '.')}–{r.end.replace(':', '.')}
                                </div>
                            </div>
                            <dl className="grid grid-cols-3 gap-4 text-center text-xs">
                                <div>
                                    <dt className="text-fg-3">Masuk</dt>
                                    <dd className={`font-mono text-sm font-semibold ${r.late ? 'text-amber-700' : ''}`}>{r.in ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-fg-3">Keluar</dt>
                                    <dd className="font-mono text-sm font-semibold">{r.out ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-fg-3">Durasi</dt>
                                    <dd className="font-mono text-sm font-semibold">{r.minutes ? duration(r.minutes) : '—'}</dd>
                                </div>
                            </dl>
                            <div className="flex w-[170px] justify-end">
                                {r.out ? (
                                    <span className="text-success flex items-center gap-1.5 text-sm font-semibold">
                                        <CircleCheck className="size-4" />
                                        Selesai
                                    </span>
                                ) : !r.mine ? (
                                    <span className="text-fg-3 text-xs">Presensi oleh petugas ybs.</span>
                                ) : r.in ? (
                                    <Button variant="secondary" onClick={() => act('staf.lembur.check-out', r.id)}>
                                        <LogOut />
                                        Presensi keluar
                                    </Button>
                                ) : (
                                    <Button onClick={() => act('staf.lembur.check-in', r.id)}>
                                        <LogIn />
                                        Presensi masuk
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {today.length === 0 && <p className="text-fg-3 py-6 text-center text-sm">Tidak ada lembur yang dijadwalkan hari ini.</p>}
                </div>
            </Card>

            <Card>
                <CardTitle>Riwayat presensi lembur (14 hari)</CardTitle>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead className="text-fg-3 border-b border-slate-200 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700">
                            <tr>
                                {['Tanggal', 'Petugas', 'Masuk–keluar', 'Durasi', 'Status'].map((h) => (
                                    <th key={h} className="py-2.5 pr-4 font-semibold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((r) => (
                                <tr key={r.id} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="text-fg-3 py-2.5 pr-4">{r.date}</td>
                                    <td className="py-2.5 pr-4">
                                        <div className="font-semibold">{r.name}</div>
                                        <div className="text-fg-3 text-xs">{r.activity}</div>
                                    </td>
                                    <td className="py-2.5 pr-4 font-mono">
                                        {r.in ?? '—'} – {r.out ?? '—'}
                                    </td>
                                    <td className="py-2.5 pr-4 font-mono">{r.minutes ? duration(r.minutes) : '—'}</td>
                                    <td className="py-2.5 pr-4">
                                        <Badge tone={STATE_TONE[r.state]}>{r.state}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}

function Report({ report, monthLabel }: LemburProps) {
    const link =
        'text-fg-1 flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800';

    return (
        <Card>
            <CardTitle
                aside={
                    <div className="flex flex-wrap gap-2">
                        <a href={route('staf.lembur.export')} className={link}>
                            <Download className="size-4" />
                            Unduh Excel
                        </a>
                        <a href={route('staf.lembur.letter')} className={link}>
                            <Printer className="size-4" />
                            Surat perintah lembur
                        </a>
                    </div>
                }
            >
                Rekap lembur per petugas · {monthLabel}
            </CardTitle>
            <p className="text-fg-3 -mt-2 text-[13px]">
                Hanya sesi yang sudah lewat. Terlambat = presensi masuk lebih dari 10 menit setelah jam mulai.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
                {report.map((r) => (
                    <div key={r.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 flex-none place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                                {initials(r.name)}
                            </span>
                            <div className="min-w-0">
                                <div className="truncate font-semibold">{r.name}</div>
                                <div className="text-fg-3 truncate text-xs">{r.position}</div>
                            </div>
                        </div>
                        <dl className="grid grid-cols-4 gap-2 text-center text-xs">
                            {[
                                ['Dijadwalkan', `${r.scheduled} sesi`],
                                ['Hadir', `${r.present} sesi`],
                                ['Terlambat', String(r.late)],
                                ['Total jam', duration(r.minutes)],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-sm bg-slate-50 py-2 dark:bg-slate-900">
                                    <dt className="text-fg-3">{label}</dt>
                                    <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ))}
            </div>
            {report.length === 0 && <p className="text-fg-3 py-6 text-center text-sm">Belum ada sesi lembur yang selesai bulan ini.</p>}
            <div className="text-fg-3 flex justify-between border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
                <span>Total</span>
                <span className="font-semibold">
                    {report.reduce((sum, r) => sum + r.scheduled, 0)} penugasan · {duration(report.reduce((sum, r) => sum + r.minutes, 0))}
                </span>
            </div>
        </Card>
    );
}
