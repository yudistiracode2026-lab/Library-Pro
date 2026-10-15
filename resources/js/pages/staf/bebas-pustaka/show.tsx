import { Badge, StatusBadge } from '@/components/staf/master/cells';
import { Alert, Button, Card, initials, inputClass } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { type SelectOption } from '@/types';
import { Link, router, useForm } from '@inertiajs/react';
import { Check, ChevronLeft, Download, FileText, Lock, Undo2 } from 'lucide-react';
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
    const checksDone = r.thesis.checks.every((c) => c.on);

    return (
        <StafLayout title="Verifikasi bebas pustaka" group="Akademik">
            <Link
                href={route('staf.bebas-pustaka')}
                className="text-fg-2 flex items-center gap-1 self-start text-sm font-semibold hover:text-teal-700"
            >
                <ChevronLeft className="size-4" />
                Semua pengajuan
            </Link>

            <Card className="flex-row flex-wrap items-center">
                <span className="grid size-12 flex-none place-items-center rounded-full bg-teal-100 font-bold text-teal-800">
                    {initials(r.member.name)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-lg font-bold">{r.member.name}</span>
                    <span className="text-fg-3 text-[13px]">
                        {r.member.member_number} · {r.member.study_program} · diajukan {r.submitted_at}
                    </span>
                    <span className="text-fg-2 mt-1 text-sm">{r.title}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={r.status} />
                    <span className="text-fg-3 text-xs">
                        {enabled.filter((x) => x.ok).length} dari {enabled.length} syarat terpenuhi
                    </span>
                </div>
            </Card>

            {r.note && <Alert tone="warning">Catatan: {r.note}</Alert>}

            {r.letter && (
                <Card className="flex-row flex-wrap items-center bg-teal-50 dark:bg-teal-900">
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-bold">Surat keterangan bebas pustaka</span>
                        <span className="text-fg-3 font-mono text-[13px]">
                            {r.letter.number} · {r.letter.approved_at}
                        </span>
                    </div>
                    <a
                        href={r.letter.url}
                        className="shadow-teal inline-flex h-10 items-center gap-2 rounded-md bg-teal-400 px-4 text-sm font-semibold text-white hover:bg-teal-500"
                    >
                        <Download className="size-4" />
                        Unduh surat (PDF)
                    </a>
                </Card>
            )}

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="flex flex-col gap-4">
                    {req.loans && (
                        <Step n={1} title="Tidak ada buku yang belum dikembalikan" ok={req.loans.ok}>
                            {r.openLoans.length === 0 ? (
                                <p className="text-fg-3 text-sm">Tidak ada pinjaman aktif.</p>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    {r.openLoans.map((l) => (
                                        <div key={l.code} className="flex justify-between gap-3 text-sm">
                                            <span className="truncate">
                                                <span className="text-fg-3 font-mono text-xs">{l.code}</span> {l.title}
                                            </span>
                                            <span className="text-fg-3 text-xs whitespace-nowrap">jatuh tempo {l.due_at}</span>
                                        </div>
                                    ))}
                                    <p className="text-fg-3 text-xs">Selesaikan pengembaliannya di menu Sirkulasi.</p>
                                </div>
                            )}
                        </Step>
                    )}

                    {req.thesis && (
                        <Step n={2} title="Skripsi digital" ok={req.thesis.ok}>
                            {r.thesis.file ? (
                                <p className="text-fg-3 text-sm">
                                    {r.thesis.verified_at
                                        ? `Di-ACC ${r.thesis.verified_at}.`
                                        : 'Periksa berkas di panel pratinjau, centang setiap bagian, lalu ACC.'}
                                </p>
                            ) : (
                                <p className="text-fg-3 text-sm">Mahasiswa belum mengunggah file skripsi di Portal Pemustaka.</p>
                            )}
                        </Step>
                    )}

                    {req.donation && (
                        <Step n={3} title="Verval buku sumbangan" ok={req.donation.ok}>
                            {r.donation ? (
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex flex-col gap-0.5 text-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-semibold">{r.donation.title}</span>
                                            <Badge
                                                tone={
                                                    r.donation.status === 'Diterima'
                                                        ? 'success'
                                                        : r.donation.status === 'Ditolak'
                                                          ? 'danger'
                                                          : 'warning'
                                                }
                                            >
                                                {r.donation.status}
                                            </Badge>
                                        </div>
                                        <span className="text-fg-3 text-xs">
                                            {r.donation.author} · {r.donation.publisher}, {r.donation.year} · ISBN {r.donation.isbn ?? '—'} ·{' '}
                                            {r.donation.copies} eks
                                        </span>
                                    </div>
                                    {r.donation.tooOld && <Alert tone="warning">Terbitan lebih dari 5 tahun yang lalu.</Alert>}
                                    {r.donation.alreadyInCollection && <Alert tone="warning">Judul atau ISBN ini sudah ada di koleksi.</Alert>}
                                    {r.donation.book && (
                                        <p className="text-fg-3 text-xs">
                                            Masuk koleksi: Rak {r.donation.book.rack} ·{' '}
                                            <span className="font-mono">{r.donation.book.call_number}</span>
                                        </p>
                                    )}
                                    {pending && r.donation.status !== 'Diterima' && (
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => setDialog('reject')}>
                                                Tolak
                                            </Button>
                                            <Button size="sm" onClick={() => setDialog('accept')}>
                                                Terima & masukkan koleksi
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-fg-3 text-sm">Mahasiswa belum mengisi data buku sumbangan.</p>
                            )}
                        </Step>
                    )}

                    {req.hardcopy && (
                        <Step n={4} title="Hardcopy skripsi" ok={req.hardcopy.ok}>
                            {!r.thesis.verified_at && !r.hardcopy.received_at ? (
                                <p className="text-fg-3 flex items-center gap-2 text-sm">
                                    <Lock className="size-4" />
                                    Terbuka setelah file skripsi di-ACC pada langkah 2.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2.5 text-sm">
                                    <p className="text-fg-2">
                                        Jadwal penyerahan: {r.hardcopy.scheduled_at ?? 'belum dijadwalkan'}. Periksa jilid hardcover dan lembar
                                        pengesahan bertanda tangan.
                                    </p>
                                    {r.hardcopy.received_at ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge tone="success">Diterima {r.hardcopy.received_at} · simpan di rak R1</Badge>
                                            {pending && (
                                                <Button variant="ghost" size="sm" onClick={() => post('staf.bebas-pustaka.hardcopy', r.id)}>
                                                    <Undo2 />
                                                    Batalkan
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        pending && (
                                            <Button size="sm" className="self-start" onClick={() => post('staf.bebas-pustaka.hardcopy', r.id)}>
                                                Tandai hardcopy diterima
                                            </Button>
                                        )
                                    )}
                                </div>
                            )}
                        </Step>
                    )}

                    {pending && (
                        <div className="flex flex-wrap gap-2">
                            <Button size="lg" disabled={!r.complete} onClick={() => post('staf.bebas-pustaka.approve', r.id)}>
                                <Check />
                                {r.complete ? 'Setujui & terbitkan surat' : 'Lengkapi syarat dulu'}
                            </Button>
                            <Button variant="secondary" size="lg" onClick={() => setDialog('sendBack')}>
                                Kembalikan ke mahasiswa
                            </Button>
                        </div>
                    )}
                </div>

                {r.thesis.file && (
                    <Card className="gap-3 p-4 md:p-4">
                        <div className="flex items-center gap-2 text-sm">
                            <FileText className="size-4 text-teal-600" />
                            <span className="min-w-0 flex-1 truncate font-mono text-xs">{r.thesis.filename}</span>
                            <a
                                href={r.thesis.file}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-teal-600 hover:text-teal-500"
                            >
                                Buka di tab baru
                            </a>
                        </div>
                        <iframe
                            src={`${r.thesis.file}#view=FitH`}
                            title="Pratinjau skripsi"
                            className="h-[560px] w-full rounded-md border border-slate-200 bg-slate-100"
                        />
                        <span className="text-sm font-bold">Pemeriksaan berkas</span>
                        <div className="flex flex-col gap-1.5">
                            {r.thesis.checks.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    role="checkbox"
                                    aria-checked={c.on}
                                    disabled={!pending || !!r.thesis.verified_at}
                                    onClick={() => post('staf.bebas-pustaka.check', r.id, { key: c.key })}
                                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-left text-sm disabled:cursor-default ${c.on ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 dark:border-slate-700'}`}
                                >
                                    <span
                                        className={`grid size-5 flex-none place-items-center rounded-[5px] border-[1.5px] ${c.on ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 bg-white'}`}
                                    >
                                        {c.on && <Check className="size-3.5" strokeWidth={3} />}
                                    </span>
                                    {c.label}
                                </button>
                            ))}
                        </div>
                        {pending &&
                            (r.thesis.verified_at ? (
                                <Button variant="secondary" onClick={() => post('staf.bebas-pustaka.thesis', r.id)}>
                                    <Undo2 />
                                    Batalkan ACC skripsi
                                </Button>
                            ) : (
                                <Button disabled={!checksDone} onClick={() => post('staf.bebas-pustaka.thesis', r.id)}>
                                    <Check />
                                    ACC skripsi
                                </Button>
                            ))}
                    </Card>
                )}
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

function Step({ n, title, ok, children }: { n: number; title: string; ok: boolean; children: ReactNode }) {
    return (
        <Card className="gap-3">
            <div className="flex items-center gap-3">
                <span
                    className={`grid size-7 flex-none place-items-center rounded-full text-[13px] font-bold ${ok ? 'bg-success text-white' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                >
                    {ok ? <Check className="size-4" strokeWidth={3} /> : n}
                </span>
                <span className="flex-1 font-semibold">{title}</span>
                <Badge tone={ok ? 'success' : 'warning'}>{ok ? 'Terpenuhi' : 'Belum'}</Badge>
            </div>
            <div className="pl-10">{children}</div>
        </Card>
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
