import { Badge, type Tone } from '@/components/staf/master/cells';
import { Alert, Button, Card, CardTitle, inputClass } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { router, useForm, usePage } from '@inertiajs/react';
import { ClipboardCheck, Flag, ScanBarcode } from 'lucide-react';
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

const STATE: Record<State, { label: string; tone: Tone }> = {
    belum: { label: 'Belum dicek', tone: 'slate' },
    ada: { label: 'Ada', tone: 'success' },
    rusak: { label: 'Rusak', tone: 'warning' },
    hilang: { label: 'Hilang', tone: 'danger' },
    dipinjam: { label: 'Dipinjam', tone: 'teal' },
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
            <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <span className="text-fg-3 text-xs">Sesi aktif · dimulai {session.started_at}</span>
                        <h2 className="text-xl font-bold">{session.name}</h2>
                    </div>
                    <Button variant="secondary" onClick={() => setConfirm(true)}>
                        <Flag />
                        Selesaikan sesi
                    </Button>
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm">
                        <span className="text-fg-2">
                            {all.done} dari {all.total} eksemplar dicek
                        </span>
                        <span className="font-mono font-semibold">{pct(all.done, all.total)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-teal-400" style={{ width: `${pct(all.done, all.total)}%` }} />
                    </div>
                </div>
            </Card>

            <div className="flex flex-wrap gap-2">
                {session.racks.map((r) => {
                    const on = r.code === rack?.code;
                    const done = r.total > 0 && r.done >= r.total;

                    return (
                        <button
                            key={r.code}
                            type="button"
                            title={r.name}
                            onClick={() => router.get(route('staf.opname'), { rak: r.code }, { preserveScroll: true, preserveState: true })}
                            className={`flex min-w-[92px] cursor-pointer flex-col gap-1 rounded-md border px-3 py-2 text-left ${on ? 'border-teal-400 bg-teal-400 text-white' : 'border-slate-200 bg-white hover:border-teal-300 dark:bg-slate-800'}`}
                        >
                            <span className="flex items-center justify-between gap-2 text-sm font-bold">
                                Rak {r.code}
                                {done && <span className={`size-2 rounded-full ${on ? 'bg-white' : 'bg-success'}`} />}
                            </span>
                            <span className={`font-mono text-xs ${on ? 'text-teal-50' : 'text-fg-3'}`}>
                                {r.done}/{r.total}
                            </span>
                        </button>
                    );
                })}
            </div>

            {rack && (
                <Card>
                    <CardTitle
                        aside={
                            <div className="flex flex-wrap gap-1.5">
                                {(['ada', 'rusak', 'hilang', 'belum', 'dipinjam'] as State[]).map((s) => (
                                    <Badge key={s} tone={STATE[s].tone}>
                                        {STATE[s].label}: {rack.summary[s] ?? 0}
                                    </Badge>
                                ))}
                            </div>
                        }
                    >
                        Rak {rack.code} · {rack.name}
                    </CardTitle>
                    <form onSubmit={scan} className="flex max-w-xl gap-2">
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={`Scan barcode eksemplar di rak ${rack.code}`}
                            aria-label="Barcode eksemplar"
                            autoFocus
                            className={`${inputClass} font-mono`}
                        />
                        <Button type="submit" variant="secondary" className="h-[42px]">
                            <ScanBarcode />
                            Cek
                        </Button>
                    </form>
                    {errors.code && <Alert>{errors.code}</Alert>}

                    <div className="flex flex-col">
                        {rack.items.map((i) => (
                            <div
                                key={i.code}
                                className="flex flex-wrap items-center gap-3 border-b border-slate-200 py-2.5 text-sm last:border-0 dark:border-slate-700"
                            >
                                <span className="text-fg-3 w-[72px] font-mono text-xs">{i.code}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-semibold">{i.title}</div>
                                    <div className="text-fg-3 font-mono text-xs">{i.call_number}</div>
                                </div>
                                <Badge tone={STATE[i.state].tone}>{STATE[i.state].label}</Badge>
                                {i.state !== 'dipinjam' && (
                                    <div className="flex gap-1">
                                        {(['ada', 'rusak', 'hilang'] as const).map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => record(i.code, r)}
                                                className={`h-[30px] cursor-pointer rounded-[8px] border px-2.5 text-xs font-semibold ${i.state === r ? 'border-teal-400 bg-teal-400 text-white' : 'text-fg-2 border-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800'}`}
                                            >
                                                {STATE[r].label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {rack.items.length === 0 && <p className="text-fg-3 py-6 text-sm">Rak ini belum berisi koleksi.</p>}
                    </div>
                </Card>
            )}

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
