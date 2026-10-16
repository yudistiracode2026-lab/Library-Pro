import AppLogoIcon from '@/components/app-logo-icon';
import PemustakaLayout from '@/layouts/pemustaka-layout';
import { useForm } from '@inertiajs/react';
import {
    BadgeCheck,
    BookCopy,
    BookHeart,
    Check,
    CircleAlert,
    CircleCheck,
    Download,
    FileCheck,
    FileText,
    Lock,
    Repeat,
    ShieldCheck,
    Upload,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { type ComponentType, type FormEvent, type ReactNode } from 'react';

interface Request {
    status: string;
    note: string | null;
    donation: { title: string; author: string; publisher: string; year: number; isbn: string | null; copies: number; status: string } | null;
    thesis: { title: string; advisor: string | null; file: string; status: string } | null;
    hardcopy: { scheduled: string | null; received: string | null };
    letter: { number: string; date: string; url: string } | null;
}

interface BebasProps {
    enabled: Record<'loans' | 'donation' | 'thesis' | 'hardcopy', boolean>;
    loans: { title: string; due: string }[];
    request: Request | null;
    member: { name: string; member_number: string; study_program: string | null };
    head: { name: string; nip: string } | null;
    minYear: number;
}

const field =
    'h-11 w-full min-w-0 rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 text-sm font-normal text-fg-1 outline-none focus:border-teal-400 dark:bg-slate-800';
const submit =
    'h-11 cursor-pointer self-start rounded-md bg-teal-400 px-5 text-sm font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300';

export default function BebasPustaka({ enabled, loans, request, member, head, minYear }: BebasProps) {
    const thesisOk = request?.thesis?.status === 'Di-ACC';
    const checks = {
        loans: loans.length === 0,
        donation: request?.donation?.status === 'Diterima',
        thesis: thesisOk,
        hardcopy: !!request?.hardcopy.received,
    };
    const active = (Object.keys(enabled) as (keyof typeof enabled)[]).filter((k) => enabled[k]);
    const done = active.filter((k) => checks[k]).length;

    return (
        <PemustakaLayout title="Bebas pustaka">
            <div>
                <h1 className="font-display text-[26px] font-bold">Bebas pustaka</h1>
                <p className="text-fg-3 mt-1 text-[15px]">
                    Syarat pendaftaran wisuda. Penuhi semua syarat di bawah untuk mendapatkan surat bebas pustaka.
                </p>
            </div>

            {request?.letter ? (
                <Letter request={request} member={member} head={head} />
            ) : (
                <>
                    {request?.status === 'Dikembalikan' && request.note && (
                        <div className="bg-danger-soft text-danger flex max-w-[960px] items-start gap-2.5 rounded-md px-4 py-3 text-sm">
                            <CircleAlert className="mt-0.5 size-4 flex-none" />
                            Pengajuan dikembalikan petugas: {request.note}
                        </div>
                    )}
                    <section className="flex max-w-[960px] flex-wrap items-center gap-4 rounded-lg bg-white px-[22px] py-[18px] shadow-sm dark:bg-slate-800">
                        <div className="flex min-w-[220px] flex-1 flex-col gap-2">
                            <span className="text-[15px] font-bold">
                                {done} dari {active.length} syarat terpenuhi
                            </span>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div
                                    className="h-full rounded-full bg-teal-400"
                                    style={{ width: `${active.length ? (done / active.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-fg-3 max-w-[420px] text-[13px] leading-normal">
                            Syarat bisa diselesaikan dalam urutan apa saja. Hardcopy skripsi baru bisa diserahkan setelah file skripsi di-ACC
                            pustakawan.
                        </span>
                    </section>

                    <div className="grid max-w-[960px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
                        {enabled.loans && (
                            <Requirement
                                ok={checks.loans}
                                icon={Repeat}
                                title="Pengembalian buku"
                                description="Kembalikan semua pinjaman kapan saja di meja sirkulasi."
                                pill={checks.loans ? 'Lunas' : `${loans.length} buku dipinjam`}
                            >
                                {loans.map((l) => (
                                    <div
                                        key={l.title}
                                        className="flex justify-between gap-2.5 rounded-[10px] bg-slate-50 px-3 py-2.5 text-[13px] dark:bg-slate-900"
                                    >
                                        <span className="min-w-0 font-semibold">{l.title}</span>
                                        <span className="text-fg-3 flex-none">jatuh tempo {l.due}</span>
                                    </div>
                                ))}
                                {checks.loans && (
                                    <span className="text-success text-[13px] font-semibold">
                                        Tidak ada pinjaman aktif. Dicek otomatis dari data sirkulasi.
                                    </span>
                                )}
                            </Requirement>
                        )}
                        {enabled.donation && <Donation request={request} minYear={minYear} ok={checks.donation} />}
                        {enabled.thesis && <Thesis request={request} ok={checks.thesis} />}
                        {enabled.hardcopy && <Hardcopy request={request} ok={checks.hardcopy} unlocked={thesisOk || !enabled.thesis} />}
                    </div>
                </>
            )}
        </PemustakaLayout>
    );
}

function Requirement({
    ok,
    locked,
    icon: Icon,
    title,
    description,
    pill,
    children,
}: {
    ok: boolean;
    locked?: boolean;
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
    pill: string;
    children: ReactNode;
}) {
    return (
        <section
            className={`flex min-w-0 flex-col gap-3.5 rounded-lg border-[1.5px] bg-white p-[22px] shadow-sm dark:bg-slate-800 ${ok ? 'border-success' : 'border-transparent'}`}
        >
            <div className="flex items-start gap-3">
                <span
                    className={`grid size-9 flex-none place-items-center rounded-[10px] ${ok ? 'bg-success-soft text-success' : 'bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-100'}`}
                >
                    {ok ? <CircleCheck className="size-[18px]" /> : <Icon className="size-[18px]" />}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="font-display text-[17px] font-bold">{title}</div>
                    <div className="text-fg-3 text-[13px] leading-normal">{description}</div>
                </div>
                <span
                    className={`flex-none rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${ok ? 'bg-success-soft text-success' : locked ? 'text-fg-3 bg-slate-100 dark:bg-slate-700' : 'bg-warning-soft text-amber-800'}`}
                >
                    {pill}
                </span>
            </div>
            {children}
        </section>
    );
}

function Donation({ request, minYear, ok }: { request: Request | null; minYear: number; ok: boolean }) {
    const d = request?.donation;
    const form = useForm({ title: '', author: '', publisher: '', year: '', isbn: '', copies: '1' });
    const sent = d && d.status !== 'Ditolak';
    const send = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('pemustaka.bebas-pustaka.donation'), { preserveScroll: true });
    };
    const cannot =
        !form.data.title.trim() ||
        !form.data.author.trim() ||
        !form.data.publisher.trim() ||
        Number(form.data.year) < minYear ||
        !(Number(form.data.copies) > 0);

    return (
        <Requirement
            ok={ok}
            locked={!d}
            icon={BookHeart}
            title="Buku sumbangan"
            description={`1 buku asli terbitan ${minYear} atau lebih baru, bidang pertanahan, agraria, survei, atau tata ruang, belum ada di koleksi.`}
            pill={d ? (d.status === 'Menunggu' ? 'Menunggu verifikasi' : d.status) : 'Belum diisi'}
        >
            {sent ? (
                <>
                    <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-slate-200 p-4 dark:border-slate-700">
                        <span className="grid h-[58px] w-11 flex-none place-items-center rounded-[5px] bg-teal-600 text-white">
                            <BookHeart className="size-5" />
                        </span>
                        <div className="min-w-[200px] flex-1">
                            <div className="font-bold">{d.title}</div>
                            <div className="text-fg-3 text-[13px]">
                                {d.author} · {d.publisher}, {d.year}
                                {d.isbn && (
                                    <>
                                        {' · '}
                                        <span className="font-mono">{d.isbn}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {d.status === 'Menunggu' && (
                        <span className="text-fg-2 text-[13px]">Bawa bukunya ke meja sirkulasi lantai 2 untuk diverifikasi.</span>
                    )}
                </>
            ) : (
                <form onSubmit={send} className="flex flex-col gap-3">
                    {d?.status === 'Ditolak' && request?.note && (
                        <span className="text-danger text-[13px]">Buku sebelumnya ditolak: {request.note}. Isi data buku pengganti, ya.</span>
                    )}
                    <Field label="Judul buku" error={form.errors.title}>
                        <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className={field} />
                    </Field>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                        <Field label="Pengarang" error={form.errors.author}>
                            <input value={form.data.author} onChange={(e) => form.setData('author', e.target.value)} className={field} />
                        </Field>
                        <Field label="Penerbit" error={form.errors.publisher}>
                            <input value={form.data.publisher} onChange={(e) => form.setData('publisher', e.target.value)} className={field} />
                        </Field>
                        <Field label="Tahun terbit" error={form.errors.year}>
                            <input type="number" value={form.data.year} onChange={(e) => form.setData('year', e.target.value)} className={field} />
                        </Field>
                        <Field label="ISBN" error={form.errors.isbn}>
                            <input
                                value={form.data.isbn}
                                onChange={(e) => form.setData('isbn', e.target.value)}
                                placeholder="978-…"
                                className={`${field} font-mono`}
                            />
                        </Field>
                        <Field label="Jumlah eksemplar" error={form.errors.copies}>
                            <input
                                type="number"
                                min={1}
                                value={form.data.copies}
                                onChange={(e) => form.setData('copies', e.target.value)}
                                className={field}
                            />
                        </Field>
                    </div>
                    {form.data.year !== '' && Number(form.data.year) < minYear && (
                        <span className="text-danger text-[13px]">Tahun terbit harus {minYear} atau lebih baru.</span>
                    )}
                    <button type="submit" disabled={cannot || form.processing} className={submit}>
                        Kirim data buku
                    </button>
                </form>
            )}
        </Requirement>
    );
}

function Thesis({ request, ok }: { request: Request | null; ok: boolean }) {
    const t = request?.thesis;
    const form = useForm<{ title: string; advisor: string; abstract: string; file: File | null; agree: boolean }>({
        title: '',
        advisor: '',
        abstract: '',
        file: null,
        agree: false,
    });
    const send = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('pemustaka.bebas-pustaka.thesis'), { preserveScroll: true, forceFormData: true });
    };
    const cannot = !form.data.file || !form.data.title.trim() || !form.data.advisor.trim() || !form.data.agree;
    const resend = request?.status === 'Dikembalikan' && !ok;

    return (
        <Requirement
            ok={ok}
            locked={!t}
            icon={FileText}
            title="Unggah file skripsi"
            description="PDF versi final, termasuk lembar pengesahan dan abstrak. Diperiksa dan di-ACC pustakawan."
            pill={t ? t.status : 'Belum unggah'}
        >
            {t && !resend ? (
                <>
                    <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3.5 py-3 dark:bg-slate-900">
                        <span className="bg-danger-soft text-danger grid size-[38px] flex-none place-items-center rounded-[10px]">
                            <FileText className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                            <div className="text-sm font-semibold">{t.file}</div>
                            <div className="text-fg-3 text-xs">{t.title}</div>
                        </div>
                    </div>
                    {t.status !== 'Di-ACC' && (
                        <span className="text-fg-2 text-[13px]">Pustakawan sedang memeriksa format, lembar pengesahan, dan abstrak.</span>
                    )}
                </>
            ) : (
                <form onSubmit={send} className="flex flex-col gap-3">
                    <Field label="Judul skripsi" error={form.errors.title}>
                        <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className={field} />
                    </Field>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
                        <Field label="Pembimbing 1" error={form.errors.advisor}>
                            <input value={form.data.advisor} onChange={(e) => form.setData('advisor', e.target.value)} className={field} />
                        </Field>
                        <Field label="Tahun lulus">
                            <input value={new Date().getFullYear()} readOnly className={`${field} border-slate-200 bg-slate-50 dark:bg-slate-900`} />
                        </Field>
                    </div>
                    <Field label="Abstrak" error={form.errors.abstract}>
                        <textarea
                            value={form.data.abstract}
                            onChange={(e) => form.setData('abstract', e.target.value)}
                            rows={4}
                            className={`${field} h-auto resize-y py-2.5`}
                        />
                    </Field>
                    <label
                        className={`flex cursor-pointer items-center gap-3.5 rounded-[14px] border-[1.5px] border-dashed p-5 ${form.data.file ? 'border-teal-400 bg-teal-50 dark:bg-teal-900' : 'border-slate-300 bg-slate-50 dark:bg-slate-900'}`}
                    >
                        <span className="grid size-11 place-items-center rounded-md bg-white text-teal-700 dark:bg-slate-800">
                            {form.data.file ? <FileCheck className="size-5" /> : <Upload className="size-5" />}
                        </span>
                        <div className="flex-1">
                            <div className="font-semibold">{form.data.file ? form.data.file.name : 'Unggah skripsi lengkap (PDF)'}</div>
                            <div className="text-fg-3 text-[13px]">
                                {form.data.file
                                    ? `${(form.data.file.size / 1048576).toFixed(1)} MB · siap diunggah`
                                    : 'Maks. 20 MB · termasuk lembar pengesahan dan abstrak'}
                            </div>
                        </div>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)}
                            className="hidden"
                        />
                        <span className="text-[13px] font-semibold text-teal-700">Pilih berkas</span>
                    </label>
                    {form.errors.file && <span className="text-danger text-xs">{form.errors.file}</span>}
                    <button
                        type="button"
                        role="checkbox"
                        aria-checked={form.data.agree}
                        onClick={() => form.setData('agree', !form.data.agree)}
                        className={`text-fg-1 flex w-full cursor-pointer items-start gap-2.5 rounded-md border px-3.5 py-3 text-left text-sm leading-normal ${form.data.agree ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}
                    >
                        <span
                            className={`mt-px grid size-5 flex-none place-items-center rounded-[5px] border-[1.5px] text-white ${form.data.agree ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white'}`}
                        >
                            <Check className={`size-3.5 ${form.data.agree ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                        </span>
                        Saya menyatakan berkas ini adalah versi final yang sudah disahkan, dan bersedia dipublikasikan di repositori Politeknik
                        Agraria.
                    </button>
                    {form.errors.agree && <span className="text-danger text-xs">{form.errors.agree}</span>}
                    <button type="submit" disabled={cannot || form.processing} className={submit}>
                        Kirim untuk diperiksa
                    </button>
                </form>
            )}
        </Requirement>
    );
}

function Hardcopy({ request, ok, unlocked }: { request: Request | null; ok: boolean; unlocked: boolean }) {
    const form = useForm({ date: '' });
    const h = request?.hardcopy;
    const send = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('pemustaka.bebas-pustaka.hardcopy'), { preserveScroll: true });
    };

    return (
        <Requirement
            ok={ok}
            locked={!unlocked}
            icon={BookCopy}
            title="Hardcopy skripsi"
            description="1 eksemplar dijilid hardcover biru tua, dengan lembar pengesahan bertanda tangan, ke meja sirkulasi lantai 2."
            pill={!unlocked ? 'Terkunci' : ok ? 'Diterima' : h?.scheduled ? 'Dijadwalkan' : 'Belum dijadwalkan'}
        >
            {!unlocked ? (
                <div className="text-fg-2 flex items-center gap-2.5 rounded-md bg-slate-50 px-3.5 py-3 text-[13px] dark:bg-slate-900">
                    <Lock className="text-fg-3 size-4" />
                    Terbuka setelah file skripsi di-ACC pustakawan.
                </div>
            ) : ok ? (
                <span className="text-success text-[13px] font-semibold">Hardcopy diterima {h?.received}.</span>
            ) : (
                <form onSubmit={send} className="flex flex-col gap-3">
                    {h?.scheduled && (
                        <span className="text-fg-2 text-[13px]">
                            Dijadwalkan {h.scheduled}. Serahkan ke petugas di meja sirkulasi, atau ubah jadwal di bawah.
                        </span>
                    )}
                    <Field label="Jadwal penyerahan" error={form.errors.date}>
                        <input type="date" value={form.data.date} onChange={(e) => form.setData('date', e.target.value)} className={field} />
                    </Field>
                    <button type="submit" disabled={!form.data.date || form.processing} className={submit}>
                        Jadwalkan penyerahan
                    </button>
                </form>
            )}
        </Requirement>
    );
}

function Letter({ request, member, head }: { request: Request; member: BebasProps['member']; head: BebasProps['head'] }) {
    const letter = request.letter!;

    return (
        <section className="flex max-w-[760px] flex-col gap-[18px] rounded-lg bg-white p-7 shadow-sm dark:bg-slate-800">
            <div className="flex flex-col items-center gap-3 py-3 text-center">
                <span className="bg-success-soft text-success grid size-16 place-items-center rounded-full">
                    <BadgeCheck className="size-7" />
                </span>
                <span className="font-display text-xl font-bold">Surat bebas pustaka sudah terbit</span>
                <span className="text-fg-2 text-[15px]">Nomor {letter.number} · berlaku untuk pendaftaran wisuda.</span>
                <a
                    href={letter.url}
                    className="shadow-teal flex h-[46px] items-center gap-2 rounded-md bg-teal-400 px-5 font-semibold text-white hover:bg-teal-500"
                >
                    <Download className="size-4" />
                    Unduh surat (PDF)
                </a>
            </div>
            <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white px-12 py-10 text-sm leading-[1.7] text-slate-800 shadow-xs">
                <div className="flex items-center gap-3.5 border-b-2 border-slate-800 pb-3.5">
                    <AppLogoIcon className="size-[58px] flex-none" />
                    <div className="leading-snug">
                        <div className="font-display font-bold">KEMENTERIAN AGRARIA DAN TATA RUANG / BPN</div>
                        <div className="font-bold">Perpustakaan Politeknik Agraria</div>
                        <div className="text-xs">Jl. Tata Bumi No. 5, Banyuraden, Gamping, Sleman, Yogyakarta</div>
                    </div>
                </div>
                <div className="text-center">
                    <div className="font-display text-[17px] font-extrabold underline">SURAT KETERANGAN BEBAS PUSTAKA</div>
                    <div className="font-mono text-xs">Nomor: {letter.number}</div>
                </div>
                <p>Kepala Perpustakaan Politeknik Agraria menerangkan bahwa:</p>
                <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-x-3 gap-y-1">
                    <span>Nama</span>
                    <span>: {member.name}</span>
                    <span>NIM</span>
                    <span>: {member.member_number}</span>
                    <span>Program studi</span>
                    <span>: {member.study_program}</span>
                    <span>Judul skripsi</span>
                    <span>: {request.thesis?.title ?? '—'}</span>
                </div>
                <p>
                    tidak memiliki pinjaman buku di Perpustakaan Politeknik Agraria, telah menyerahkan buku sumbangan dan hardcopy skripsi, serta
                    telah menyerahkan skripsi dalam bentuk digital ke repositori perpustakaan.
                </p>
                <p>Surat keterangan ini dibuat untuk keperluan pendaftaran wisuda.</p>
                <div className="mt-3 flex flex-col gap-1 self-end">
                    <span>Yogyakarta, {letter.date}</span>
                    <span>Kepala Perpustakaan,</span>
                    <QRCodeSVG value={`PUSTAGRA · ${letter.number} · ${member.member_number}`} size={96} marginSize={0} className="my-1.5" />
                    <span className="font-bold">{head?.name ?? '—'}</span>
                    {head?.nip && <span className="text-xs">NIP {head.nip}</span>}
                </div>
                <div className="text-fg-3 flex items-center gap-2 border-t border-dashed border-slate-300 pt-3 text-[11px] leading-normal">
                    <ShieldCheck className="size-3.5 text-teal-700" />
                    Ditandatangani secara elektronik (TTE). Pindai kode QR untuk memverifikasi keaslian surat.
                </div>
            </div>
        </section>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold">
            {label}
            {children}
            {error && <span className="text-danger text-xs font-normal">{error}</span>}
        </label>
    );
}
