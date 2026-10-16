import { Badge, type Tone } from '@/components/staf/master/cells';
import { Alert, Button, Card, CardTitle, inputClass } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { router, useForm, usePage } from '@inertiajs/react';
import { ClipboardCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';

type State = 'belum' | 'ada' | 'rusak' | 'hilang' | 'dipinjam';

interface OpnameProps {
    session: {
        id: number;
        name: string;
        started_at: string;
        progress: { total: number; done: number };
        racks: { code: string; name: string; total: number; done: number }[];
        rack: {
            code: string;
            name: string;
            items: { code: string; title: string; call_number: string | null; state: State }[];
            summary: Partial<Record<State, number>>;
        } | null;
    } | null;
    history: { id: number; name: string; period: string; counts: Record<string, number> }[];
}

/** label: the action button; summary: the status pill, as worded in the prototype. */
const STATE: Record<State, { label: string; summary: string; tone: Tone }> = {
    belum: { label: 'Belum dicek', summary: 'Belum dicek', tone: 'slate' },
    ada: { label: 'Ada', summary: 'Ditemukan', tone: 'success' },
    rusak: { label: 'Rusak', summary: 'Rusak', tone: 'warning' },
    hilang: { label: 'Hilang', summary: 'Hilang', tone: 'danger' },
    dipinjam: { label: 'Dipinjam', summary: 'Dipinjam', tone: 'teal' },
};

const TONE: Record<Tone, string> = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-amber-800',
    danger: 'bg-danger-soft text-danger',
    teal: 'bg-teal-50 text-teal-700',
    slate: 'text-fg-3 bg-slate-100 dark:bg-slate-700',
};

const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export default function Opname({ session, history }: OpnameProps) {
    return (
        <StafLayout title="Stock opname" group="Koleksi">
            {session ? <ActiveSession session={session} /> : <StartSession />}

            {history.length > 0 && (
                <Card>
                    <CardTitle>Riwayat sesi</CardTitle>
                    {history.map((h) => (
                        <div
                            key={h.id}
                            className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 text-sm last:border-0 last:pb-0 dark:border-slate-700"
                        >
                            <div>
                                <div className="font-semibold">{h.name}</div>
                                <div className="text-fg-3 text-xs">{h.period}</div>
                            </div>
                            <div className="flex gap-1.5">
                                <Badge tone="success">{h.counts.ada ?? 0} ada</Badge>
                                <Badge tone="warning">{h.counts.rusak ?? 0} rusak</Badge>
                                <Badge tone="danger">{h.counts.hilang ?? 0} hilang</Badge>
                            </div>
                        </div>
                    ))}
                </Card>
            )}
        </StafLayout>
    );
}

function StartSession() {
    const year = new Date().getFullYear();
    const form = useForm({ name: `Stock opname semester ganjil ${year}/${year + 1}` });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('staf.opname.start'), { preserveScroll: true });
    };

    return (
        <Card className="items-start">
            <span className="grid size-12 place-items-center rounded-lg bg-teal-50 text-teal-700">
                <ClipboardCheck className="size-6" />
            </span>
            <div>
                <h2 className="text-xl font-bold">Belum ada sesi stock opname</h2>
                <p className="text-fg-3 mt-1 text-sm">
                    Mulai sesi baru, lalu periksa setiap eksemplar di rak. Eksemplar yang sedang dipinjam tidak perlu dicek.
                </p>
            </div>
            <form onSubmit={submit} className="flex w-full max-w-xl gap-2">
                <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} aria-label="Nama sesi" className={inputClass} />
                <Button type="submit" className="h-[42px]" disabled={form.processing}>
                    Mulai sesi
                </Button>
            </form>
            {form.errors.name && <span className="text-danger text-xs">{form.errors.name}</span>}
        </Card>
    );
}

function ActiveSession({ session }: { session: NonNullable<OpnameProps['session']> }) {
    const errors = usePage().props.errors as Record<string, string>;
    const [code, setCode] = useState('');
    const [confirm, setConfirm] = useState(false);
    const rack = session.rack;
    const all = session.progress;

    const record = (barcode: string, result?: 'ada' | 'rusak' | 'hilang') =>
        router.post(
            route('staf.opname.check'),
            { code: barcode, ...(result ? { result } : {}) },
            { preserveScroll: true, preserveState: true, onSuccess: () => setCode('') },
        );

    const scan = (e: FormEvent) => {
        e.preventDefault();
        if (code.trim()) record(code.trim());
    };

    return (
        <>
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white px-6 py-5 shadow-sm dark:bg-slate-800">
                <div>
                    <div className="text-fg-3 text-xs">Sesi aktif · dimulai {session.started_at}</div>
                    <div className="font-display text-[19px] font-bold">{session.name}</div>
                </div>
                <div className="flex max-w-[420px] min-w-[240px] flex-1 flex-col gap-1.5">
                    <div className="flex justify-between text-[13px]">
                        <span>
                            {all.done} dari {all.total} eksemplar dicek
                        </span>
                        <span className="font-bold">{pct(all.done, all.total)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className="h-full bg-teal-400" style={{ width: `${pct(all.done, all.total)}%` }} />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setConfirm(true)}
                    className="h-10 cursor-pointer rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                    Selesaikan sesi
                </button>
            </section>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] items-start gap-4">
                <section className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
                    {session.racks.map((r) => {
                        const on = r.code === rack?.code;
                        const done = r.total > 0 && r.done >= r.total;

                        return (
                            <button
                                key={r.code}
                                type="button"
                                title={r.name}
                                onClick={() => router.get(route('staf.opname'), { rak: r.code }, { preserveScroll: true, preserveState: true })}
                                className={`flex cursor-pointer flex-col gap-1.5 rounded-[10px] px-3 py-2.5 text-left ${on ? 'bg-teal-50 dark:bg-teal-900' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                            >
                                <span className="flex justify-between text-sm">
                                    <span className="font-semibold">Rak {r.code}</span>
                                    <span className="text-fg-3 text-xs">
                                        {r.done}/{r.total}
                                    </span>
                                </span>
                                <span className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                    <span
                                        className={`block h-full ${done ? 'bg-success' : 'bg-teal-400'}`}
                                        style={{ width: `${pct(r.done, r.total)}%` }}
                                    />
                                </span>
                            </button>
                        );
                    })}
                </section>

                {rack && (
                    <section className="flex min-w-0 flex-col gap-3.5 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                        <div className="font-display text-[17px] font-bold">
                            Rak {rack.code} · {rack.name}
                        </div>
                        <form onSubmit={scan} className="flex min-w-[280px] flex-1 gap-2">
                            <input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder={`Scan barcode eksemplar di rak ${rack.code}`}
                                aria-label="Barcode eksemplar"
                                autoFocus
                                className="text-fg-1 h-11 min-w-0 flex-1 rounded-md border-[1.5px] border-slate-300 bg-white px-3 font-mono text-sm outline-none focus:border-teal-400 dark:bg-slate-800"
                            />
                            <button
                                type="submit"
                                className="text-fg-1 h-11 flex-none cursor-pointer rounded-md border border-slate-200 bg-white px-4 font-semibold hover:bg-slate-100 dark:bg-slate-800"
                            >
                                Cek
                            </button>
                        </form>
                        {errors.code && <Alert>{errors.code}</Alert>}
                        <div className="flex flex-wrap gap-3 text-[13px]">
                            {(['ada', 'rusak', 'hilang', 'belum', 'dipinjam'] as State[]).map((st) => (
                                <span key={st} className={`rounded-full px-3 py-1 font-semibold ${TONE[STATE[st].tone]}`}>
                                    {STATE[st].summary}: {rack.summary[st] ?? 0}
                                </span>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            {rack.items.map((i) => (
                                <div
                                    key={i.code}
                                    className="grid grid-flow-row grid-cols-[repeat(auto-fit,minmax(110px,auto))] items-center gap-3 border-b border-slate-200 py-2.5 text-sm dark:border-slate-700"
                                >
                                    <span className="font-mono text-xs">{i.code}</span>
                                    <span>{i.title}</span>
                                    <span
                                        className={`justify-self-start rounded-full px-2.5 py-[3px] text-xs font-semibold ${TONE[STATE[i.state].tone]}`}
                                    >
                                        {STATE[i.state].summary}
                                    </span>
                                    {i.state !== 'dipinjam' ? (
                                        <div className="flex justify-end gap-1">
                                            {(['ada', 'rusak', 'hilang'] as const).map((r) => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    aria-pressed={i.state === r}
                                                    onClick={() => record(i.code, r)}
                                                    className={`h-[30px] cursor-pointer rounded-[8px] border px-2.5 text-xs ${i.state === r ? 'border-teal-300 bg-teal-50 font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-100' : 'border-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800'}`}
                                                >
                                                    {STATE[r].label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <span />
                                    )}
                                </div>
                            ))}
                            {rack.items.length === 0 && <p className="text-fg-3 py-6 text-sm">Rak ini belum berisi koleksi.</p>}
                        </div>
                    </section>
                )}
            </div>

            <Dialog open={confirm} onOpenChange={setConfirm}>
                <DialogContent className="rounded-xl p-7 sm:max-w-[460px]">
                    <DialogTitle className="font-display text-xl font-bold">Selesaikan sesi?</DialogTitle>
                    <DialogDescription className="text-fg-2 text-[15px] leading-relaxed">
                        Eksemplar yang ditandai rusak masuk status perbaikan, dan yang hilang ditandai hilang di katalog.
                        {all.done < all.total && ` Masih ada ${all.total - all.done} eksemplar yang belum dicek dan tidak akan berubah statusnya.`}
                    </DialogDescription>
                    <div className="mt-2 flex justify-end gap-2">
                        <Button variant="secondary" size="lg" onClick={() => setConfirm(false)}>
                            Batal
                        </Button>
                        <Button size="lg" onClick={() => router.post(route('staf.opname.finish'), {}, { onFinish: () => setConfirm(false) })}>
                            Selesaikan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
