import { Alert, Button, initials, inputClass } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { type SelectOption } from '@/types';
import { Link, router, useForm } from '@inertiajs/react';
import { Book as BookIcon, Check, ChevronLeft, CircleCheck, Download, ExternalLink, Eye, FileText, Lock, X } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

interface ShowProps {
    request: {
        id: number;
        status: string;
        note: string | null;
        title: string;
        submitted_at: string;
        member: { name: string; member_number: string; study_program: string | null };
        requirements: Record<'loans' | 'thesis' | 'donation' | 'hardcopy', { label: string; ok: boolean } | undefined>;
        complete: boolean;
        openLoans: { code: string; title: string; due_at: string }[];
        thesis: { file: string | null; filename: string | null; checks: { key: string; label: string; on: boolean }[]; verified_at: string | null };
        donation: {
            title: string;
            author: string | null;
            publisher: string | null;
            year: number | null;
            isbn: string | null;
            copies: number;
            status: string;
            tooOld: boolean;
            alreadyInCollection: boolean;
            book: { title: string; call_number: string | null; rack: string | null } | null;
        } | null;
        hardcopy: { scheduled_at: string | null; received_at: string | null };
        letter: { number: string; approved_at: string; url: string } | null;
    };
    options: { ddc: SelectOption[]; racks: SelectOption[] };
}

const post = (name: string, id: number, data = {}) => router.post(route(name, id), data, { preserveScroll: true });

export default function BebasPustakaShow({ request: r, options }: ShowProps) {
    const pending = r.status === 'Menunggu';
    const req = r.requirements;
    const enabled = Object.values(req).filter(Boolean) as { ok: boolean }[];
    const [dialog, setDialog] = useState<'accept' | 'reject' | 'sendBack' | null>(null);
    const [viewer, setViewer] = useState(false);
    const accepted = !!r.thesis.verified_at;
    const steps = [req.loans, req.thesis, req.donation, req.hardcopy];
    const number = (step: (typeof steps)[number]) => steps.filter(Boolean).indexOf(step) + 1;

    return (
        <StafLayout title="Verifikasi bebas pustaka" group="Akademik">
            {viewer && r.thesis.file && (
                <ThesisViewer request={r} pending={pending} onClose={() => setViewer(false)} onRevise={() => setDialog('sendBack')} />
            )}

            <div className="flex w-full max-w-[820px] flex-col gap-4">
                <Link
                    href={route('staf.bebas-pustaka')}
                    className="flex h-[34px] items-center gap-1.5 self-start rounded-[10px] pr-3 pl-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 dark:text-teal-200 dark:hover:bg-teal-900"
                >
                    <ChevronLeft className="size-4" />
                    Semua pengajuan
                </Link>

                <section className="flex flex-wrap items-center gap-4 rounded-lg bg-white px-6 py-5 shadow-sm dark:bg-slate-800">
                    <span className="grid size-12 flex-none place-items-center rounded-full bg-teal-100 font-bold text-teal-800">
                        {initials(r.member.name)}
                    </span>
                    <div className="min-w-[200px] flex-1">
                        <div className="font-display text-[19px] font-bold">{r.member.name}</div>
                        <div className="text-fg-3 text-sm">
                            <span className="font-mono">{r.member.member_number}</span> · {r.member.study_program} · diajukan {r.submitted_at}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <span className={`rounded-full px-2.5 py-[3px] text-xs font-semibold ${STATUS_TONE[r.status] ?? STATUS_TONE.Menunggu}`}>
                            {r.status}
                        </span>
                        <span className="text-fg-3 text-[13px]">
                            {enabled.filter((x) => x.ok).length}/{enabled.length} syarat terpenuhi
                        </span>
                    </div>
                </section>

                {r.note && <Alert tone="warning">Catatan: {r.note}</Alert>}

                <section className="flex flex-col gap-3 rounded-lg bg-white px-6 py-5 shadow-sm dark:bg-slate-800">
                    {req.loans && (
                        <Step
                            n={number(req.loans)}
                            title="Tidak ada buku yang belum dikembalikan"
                            ok={req.loans.ok}
                            pill={req.loans.ok ? 'Otomatis · lolos' : 'Ada pinjaman'}
                        >
                            <span className="text-fg-2 text-[13px]">
                                {r.openLoans.length === 0
                                    ? 'Dicek otomatis dari data sirkulasi. Tidak ada pinjaman aktif.'
                                    : `${r.openLoans.length} buku belum dikembalikan: ${r.openLoans.map((l) => l.title).join(', ')}`}
                            </span>
                        </Step>
                    )}

                    {req.thesis && (
                        <Step
                            n={number(req.thesis)}
                            title="Pratinjau skripsi digital"
                            ok={req.thesis.ok}
                            pill={!r.thesis.file ? 'Belum unggah' : accepted ? 'Di-ACC' : 'Perlu diperiksa'}
                        >
                            {r.thesis.file ? (
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3.5 py-3 dark:bg-slate-900">
                                        <span className="bg-danger-soft text-danger grid size-10 flex-none place-items-center rounded-[10px]">
                                            <FileText className="size-[18px]" />
                                        </span>
                                        <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                                            <div className="text-sm font-semibold">{r.thesis.filename}</div>
                                            <div className="text-fg-3 text-xs">{r.title}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setViewer(true)}
                                            className="text-fg-1 flex h-[34px] flex-none cursor-pointer items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-semibold whitespace-nowrap hover:bg-slate-100 dark:bg-slate-800"
                                        >
                                            <Eye className="size-4" />
                                            Pratinjau
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={accepted}
                                        disabled={!pending || (!accepted && !r.thesis.checks.every((c) => c.on))}
                                        title={
                                            !accepted && !r.thesis.checks.every((c) => c.on) ? 'Centang semua bagian di pratinjau dulu' : undefined
                                        }
                                        onClick={() => post('staf.bebas-pustaka.thesis', r.id)}
                                        className={`text-fg-1 flex cursor-pointer items-center gap-2.5 rounded-md border px-3.5 py-3 text-left text-sm disabled:cursor-not-allowed ${accepted ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 bg-white disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800'}`}
                                    >
                                        <CheckBox on={accepted} />
                                        ACC skripsi: format, lembar pengesahan, dan abstrak sudah sesuai
                                    </button>
                                </div>
                            ) : (
                                <span className="text-fg-3 text-[13px]">Mahasiswa belum mengunggah file skripsi di Portal Pemustaka.</span>
                            )}
                        </Step>
                    )}

                    {req.donation && (
                        <Step
                            n={number(req.donation)}
                            title="Verval buku sumbangan"
                            ok={req.donation.ok}
                            pill={r.donation?.status ?? 'Belum diisi'}
                            locked={!r.donation}
                        >
                            {r.donation ? (
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3.5 py-3 dark:bg-slate-900">
                                        <span className="grid h-[54px] w-10 flex-none place-items-center rounded-[5px] bg-teal-600 text-white">
                                            <BookIcon className="size-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold">{r.donation.title}</div>
                                            <div className="text-fg-3 text-xs">
                                                {r.donation.author} · {r.donation.publisher}, {r.donation.year} ·{' '}
                                                <span className="font-mono">{r.donation.isbn ?? '—'}</span> · {r.donation.copies} eks
                                            </div>
                                            {r.donation.status === 'Menunggu' && (r.donation.tooOld || r.donation.alreadyInCollection) && (
                                                <div className="text-xs text-amber-800">
                                                    {[
                                                        r.donation.alreadyInCollection && 'Judul sudah ada di koleksi',
                                                        r.donation.tooOld && 'Terbitan lebih dari 5 tahun',
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </div>
                                            )}
                                            {r.donation.book && (
                                                <div className="text-fg-3 text-xs">
                                                    Masuk koleksi: Rak {r.donation.book.rack} ·{' '}
                                                    <span className="font-mono">{r.donation.book.call_number}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {pending && r.donation.status !== 'Diterima' && (
                                        <div className="flex flex-wrap gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setDialog('reject')}
                                                className={`${small} text-danger border border-slate-200 bg-white px-3 dark:bg-slate-800`}
                                            >
                                                Tolak
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDialog('accept')}
                                                className={`${small} bg-teal-400 px-3 text-white hover:bg-teal-500`}
                                            >
                                                Terima &amp; masukkan koleksi
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-fg-3 text-[13px]">Mahasiswa belum mengisi data buku sumbangan.</span>
                            )}
                        </Step>
                    )}

                    {req.hardcopy && (
                        <Step
                            n={number(req.hardcopy)}
                            title="Hardcopy skripsi"
                            ok={req.hardcopy.ok}
                            pill={
                                !accepted && !r.hardcopy.received_at
                                    ? 'Terkunci'
                                    : r.hardcopy.received_at
                                      ? 'Diterima'
                                      : r.hardcopy.scheduled_at
                                        ? 'Dijadwalkan'
                                        : 'Belum dijadwalkan'
                            }
                            locked={!accepted && !r.hardcopy.received_at}
                        >
                            {!accepted && !r.hardcopy.received_at ? (
                                <span className="text-fg-3 flex items-center gap-1.5 text-[13px]">
                                    <Lock className="size-4" />
                                    Terbuka setelah file skripsi di-ACC pada langkah {req.thesis ? number(req.thesis) : 2}.
                                </span>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    <span className="text-fg-2 text-[13px]">
                                        Jadwal penyerahan: {r.hardcopy.scheduled_at ?? 'belum dipilih'}. Periksa jilid hardcover dan lembar pengesahan
                                        bertanda tangan.
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {r.hardcopy.received_at ? (
                                            <>
                                                <span className="text-success flex items-center gap-1.5 text-[13px] font-semibold">
                                                    <CircleCheck className="size-4" />
                                                    Disimpan di rak R1 · {r.hardcopy.received_at}
                                                </span>
                                                {pending && (
                                                    <button
                                                        type="button"
                                                        onClick={() => post('staf.bebas-pustaka.hardcopy', r.id)}
                                                        className={`${small} text-fg-1 border border-slate-200 bg-white px-3 dark:bg-slate-800`}
                                                    >
                                                        Batalkan
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            pending && (
                                                <button
                                                    type="button"
                                                    onClick={() => post('staf.bebas-pustaka.hardcopy', r.id)}
                                                    className={`${small} bg-teal-400 px-3 text-white hover:bg-teal-500`}
                                                >
                                                    Tandai hardcopy diterima
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </Step>
                    )}

                    <div className="mt-1 flex gap-2">
                        {r.letter ? (
                            <a
                                href={r.letter.url}
                                className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-md bg-teal-400 text-[15px] font-semibold text-white hover:bg-teal-500"
                            >
                                <Download className="size-4" />
                                Lihat surat · {r.letter.number}
                            </a>
                        ) : (
                            <button
                                type="button"
                                disabled={!pending || !r.complete}
                                onClick={() => post('staf.bebas-pustaka.approve', r.id)}
                                className="h-[46px] flex-1 cursor-pointer rounded-md bg-teal-400 text-[15px] font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {r.complete
                                    ? 'Setujui & terbitkan surat'
                                    : `Lengkapi syarat dulu (${enabled.filter((x) => x.ok).length}/${enabled.length})`}
                            </button>
                        )}
                        {pending && (
                            <button
                                type="button"
                                onClick={() => setDialog('sendBack')}
                                className="text-danger h-[46px] cursor-pointer rounded-md border border-slate-200 bg-white px-[18px] font-semibold hover:bg-slate-50 dark:bg-slate-800"
                            >
                                Kembalikan
                            </button>
                        )}
                    </div>
                </section>
            </div>

            {dialog === 'accept' && <AcceptDonation id={r.id} options={options} onClose={() => setDialog(null)} />}
            {(dialog === 'reject' || dialog === 'sendBack') && (
                <NoteDialog
                    title={dialog === 'reject' ? 'Tolak buku sumbangan' : 'Kembalikan pengajuan'}
                    label={dialog === 'reject' ? 'Alasan penolakan' : 'Catatan untuk mahasiswa'}
                    action={route(dialog === 'reject' ? 'staf.bebas-pustaka.donation.reject' : 'staf.bebas-pustaka.send-back', r.id)}
                    onClose={() => setDialog(null)}
                />
            )}
        </StafLayout>
    );
}

const STATUS_TONE: Record<string, string> = {
    Menunggu: 'bg-warning-soft text-amber-800',
    Disetujui: 'bg-success-soft text-success',
    Dikembalikan: 'bg-danger-soft text-danger',
};

const small = 'h-[34px] cursor-pointer rounded-[10px] text-[13px] font-semibold whitespace-nowrap';

function CheckBox({ on }: { on: boolean }) {
    return (
        <span
            className={`grid size-5 flex-none place-items-center rounded-[5px] border-[1.5px] text-white ${on ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white dark:bg-slate-800'}`}
        >
            <Check className={`size-3.5 ${on ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
        </span>
    );
}

function Step({
    n,
    title,
    ok,
    pill,
    locked,
    children,
}: {
    n: number;
    title: string;
    ok: boolean;
    pill: string;
    locked?: boolean;
    children: ReactNode;
}) {
    const tone = ok ? 'bg-success-soft text-success' : locked ? 'text-fg-3 bg-slate-100 dark:bg-slate-700' : 'bg-warning-soft text-amber-800';

    return (
        <div
            className={`flex flex-col gap-3 rounded-[14px] border-[1.5px] bg-white p-4 dark:bg-slate-800 ${ok ? 'border-teal-300' : 'border-slate-200 dark:border-slate-700'}`}
        >
            <div className="flex items-center gap-3">
                <span
                    className={`grid size-[30px] flex-none place-items-center rounded-full text-[13px] font-bold ${ok ? 'bg-teal-400 text-white' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                >
                    {ok ? <Check className="size-4" strokeWidth={3} /> : n}
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-bold">{title}</span>
                <span className={`flex-none rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap ${tone}`}>{pill}</span>
            </div>
            <div className="pl-[42px]">{children}</div>
        </div>
    );
}

/** Full-screen thesis preview with the per-section checklist, as in the prototype. */
function ThesisViewer({
    request: r,
    pending,
    onClose,
    onRevise,
}: {
    request: ShowProps['request'];
    pending: boolean;
    onClose: () => void;
    onRevise: () => void;
}) {
    const done = r.thesis.checks.filter((c) => c.on).length;
    const all = done === r.thesis.checks.length;
    const accepted = !!r.thesis.verified_at;

    return (
        <div className="fixed inset-0 z-[80] flex bg-[rgba(15,14,10,0.55)] p-6" role="dialog" aria-modal aria-label="Pratinjau skripsi">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-slate-100 shadow-xl dark:bg-slate-900">
                <div className="flex h-[60px] flex-none items-center gap-3 border-b border-slate-200 bg-white pr-4 pl-5 dark:border-slate-700 dark:bg-slate-800">
                    <span className="bg-danger-soft text-danger grid size-[34px] flex-none place-items-center rounded-[9px]">
                        <FileText className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{r.thesis.filename}</div>
                        <div className="text-fg-3 text-xs">{r.member.name} · PDF</div>
                    </div>
                    <a
                        href={r.thesis.file ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-fg-2 hidden h-[34px] items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold hover:bg-slate-100 sm:flex dark:hover:bg-slate-700"
                    >
                        <ExternalLink className="size-4" />
                        Tab baru
                    </a>
                    <button
                        type="button"
                        aria-label="Tutup"
                        onClick={onClose}
                        className="grid size-[38px] cursor-pointer place-items-center rounded-[10px] hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <X className="size-[18px]" />
                    </button>
                </div>
                <div className="flex min-h-0 flex-1">
                    <iframe src={`${r.thesis.file}#view=FitH`} title="Pratinjau skripsi" className="min-w-0 flex-1 bg-slate-100" />
                    <div className="flex w-[300px] flex-none flex-col gap-3.5 overflow-auto border-l border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                        <div className="font-display text-base font-bold">Pemeriksaan berkas</div>
                        <span className="text-fg-3 text-[13px] leading-normal">Centang setiap bagian setelah dicek.</span>
                        {r.thesis.checks.map((c) => (
                            <button
                                key={c.key}
                                type="button"
                                role="checkbox"
                                aria-checked={c.on}
                                disabled={!pending || accepted}
                                onClick={() => post('staf.bebas-pustaka.check', r.id, { key: c.key })}
                                className={`text-fg-1 flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-left text-sm font-semibold disabled:cursor-default ${c.on ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}
                            >
                                <CheckBox on={c.on} />
                                {c.label}
                            </button>
                        ))}
                        <div className="mt-auto flex flex-col gap-2">
                            <button
                                type="button"
                                disabled={!pending || (!all && !accepted)}
                                onClick={() => (accepted ? onClose() : post('staf.bebas-pustaka.thesis', r.id))}
                                className="h-11 cursor-pointer rounded-md bg-teal-400 text-sm font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {accepted ? 'Sudah di-ACC · tutup' : all ? 'ACC skripsi' : `Periksa semua bagian (${done}/${r.thesis.checks.length})`}
                            </button>
                            {pending && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onRevise();
                                    }}
                                    className="text-danger h-10 cursor-pointer rounded-md border border-slate-200 bg-white text-sm font-semibold dark:bg-slate-800"
                                >
                                    Minta revisi berkas
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AcceptDonation({ id, options, onClose }: { id: number; options: ShowProps['options']; onClose: () => void }) {
    const form = useForm({ ddc_class: '', call_number: '', rack_id: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('staf.bebas-pustaka.donation.accept', id), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-xl p-7 sm:max-w-[480px]">
                <form onSubmit={submit} className="flex flex-col gap-3.5">
                    <DialogTitle className="font-display text-xl font-bold">Masukkan ke koleksi</DialogTitle>
                    <DialogDescription>Buku dicatat sebagai sumbangan mahasiswa. Lengkapi data katalognya.</DialogDescription>
                    <Field label="Kelas DDC" error={form.errors.ddc_class}>
                        <select
                            value={form.data.ddc_class}
                            onChange={(e) => form.setData('ddc_class', e.target.value)}
                            required
                            className={inputClass}
                        >
                            <option value="" disabled>
                                Pilih…
                            </option>
                            {options.ddc.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="No. panggil" error={form.errors.call_number}>
                        <input
                            value={form.data.call_number}
                            onChange={(e) => form.setData('call_number', e.target.value)}
                            required
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Rak" error={form.errors.rack_id}>
                        <select value={form.data.rack_id} onChange={(e) => form.setData('rack_id', e.target.value)} required className={inputClass}>
                            <option value="" disabled>
                                Pilih…
                            </option>
                            {options.racks.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <div className="mt-2 flex justify-end gap-2">
                        <Button variant="secondary" size="lg" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" size="lg" disabled={form.processing}>
                            Terima & simpan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function NoteDialog({ title, label, action, onClose }: { title: string; label: string; action: string; onClose: () => void }) {
    const form = useForm({ note: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(action, { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-xl p-7 sm:max-w-[480px]">
                <form onSubmit={submit} className="flex flex-col gap-3.5">
                    <DialogTitle className="font-display text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription>Mahasiswa akan melihat catatan ini di Portal Pemustaka.</DialogDescription>
                    <Field label={label} error={form.errors.note}>
                        <textarea
                            value={form.data.note}
                            onChange={(e) => form.setData('note', e.target.value)}
                            required
                            rows={4}
                            className={`${inputClass} h-auto py-2.5`}
                        />
                    </Field>
                    <div className="mt-2 flex justify-end gap-2">
                        <Button variant="secondary" size="lg" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" variant="danger" size="lg" disabled={form.processing}>
                            Kirim
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            {label}
            {children}
            {error && <span className="text-danger text-xs font-normal">{error}</span>}
        </label>
    );
}
