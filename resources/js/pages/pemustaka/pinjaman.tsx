import { PdfReader } from '@/components/pemustaka/pdf-reader';
import { DDC_COLORS } from '@/components/staf/master/cells';
import PemustakaLayout from '@/layouts/pemustaka-layout';
import { Link, router } from '@inertiajs/react';
import { BookOpen } from 'lucide-react';

interface PinjamanProps {
    ebooks: { id: number; title: string; format: string | null; ddc_class: string; due: string; daysLeft: number; page: number; hasFile: boolean }[];
    max: number;
    reader: { loanId: number; title: string; due: string; page: number; format: string | null; file: string } | null;
    history: { id: number; title: string; out: string; back: string | null; late: number; open: boolean }[];
}

export default function Pinjaman({ ebooks, max, reader, history }: PinjamanProps) {
    return (
        <PemustakaLayout title="Pinjaman">
            <h1 className="font-display text-[26px] font-bold">Pinjaman &amp; riwayat</h1>

            <section className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                <div className="flex items-center justify-between">
                    <span className="font-display text-[17px] font-bold">E-book yang kamu pinjam</span>
                    <span className="text-fg-3 text-[13px]">
                        {ebooks.length}/{max} terpakai
                    </span>
                </div>
                {ebooks.map((l) => (
                    <div key={l.id} className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-slate-200 p-3 dark:border-slate-700">
                        <div className={`h-[58px] w-[42px] flex-none rounded-[5px] ${DDC_COLORS[l.ddc_class] ?? 'bg-teal-600'}`} />
                        <div className="flex min-w-[180px] flex-1 flex-col gap-[3px]">
                            <span className="text-sm font-semibold">{l.title}</span>
                            <span className="text-fg-3 text-xs">
                                {l.format} · akses s.d. {l.due}
                            </span>
                            <span className="text-fg-3 text-[11px]">{l.page > 1 ? `Terakhir dibaca halaman ${l.page}` : 'Belum dibaca'}</span>
                        </div>
                        <span
                            className={`rounded-full px-2.5 py-[3px] text-xs font-semibold ${l.daysLeft <= 2 ? 'bg-warning-soft text-amber-800' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                        >
                            {l.daysLeft <= 0 ? 'Berakhir hari ini' : `${l.daysLeft} hari lagi`}
                        </span>
                        <button
                            type="button"
                            disabled={!l.hasFile}
                            title={l.hasFile ? undefined : 'Berkas e-book belum diunggah petugas'}
                            onClick={() => router.get(route('pemustaka.pinjaman'), { baca: l.id }, { preserveScroll: true })}
                            className="flex h-[38px] cursor-pointer items-center gap-1.5 rounded-[10px] bg-teal-400 px-3.5 text-[13px] font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            <BookOpen className="size-4" />
                            Baca
                        </button>
                        <button
                            type="button"
                            onClick={() => router.post(route('pemustaka.ebook.return', l.id), {}, { preserveScroll: true })}
                            className="text-fg-1 h-[38px] cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3.5 text-[13px] font-semibold hover:bg-slate-100 dark:bg-slate-800"
                        >
                            Kembalikan
                        </button>
                    </div>
                ))}
                {ebooks.length === 0 && (
                    <div className="text-fg-3 p-5 text-center text-sm">
                        Belum ada e-book yang dipinjam. Cari e-book di menu{' '}
                        <Link href={route('pemustaka.cari', { jenis: 'ebook' })} className="font-semibold text-teal-600">
                            Cari buku
                        </Link>
                        , ya.
                    </div>
                )}
            </section>

            <section className="overflow-auto rounded-lg bg-white shadow-sm dark:bg-slate-800">
                {history.map((h) => (
                    <div
                        key={h.id}
                        className="grid min-w-[560px] grid-cols-[minmax(0,1.6fr)_120px_120px_150px] items-center gap-3 border-b border-slate-200 px-5 py-3.5 text-sm dark:border-slate-700"
                    >
                        <span className="font-semibold">{h.title}</span>
                        <span className="text-fg-3">{h.out}</span>
                        <span className="text-fg-3">{h.back ?? '—'}</span>
                        <span
                            className={`justify-self-start rounded-full px-2.5 py-[3px] text-xs font-semibold ${h.open ? 'bg-teal-50 text-teal-700' : h.late ? 'bg-warning-soft text-amber-800' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                        >
                            {h.open ? (h.late ? `Terlambat ${h.late} hari` : 'Dipinjam') : h.late ? `Terlambat ${h.late} hari` : 'Dikembalikan'}
                        </span>
                    </div>
                ))}
                {history.length === 0 && <div className="text-fg-3 p-8 text-center text-sm">Belum ada riwayat peminjaman.</div>}
            </section>

            {reader && (
                <PdfReader
                    file={reader.file}
                    title={reader.title}
                    initialPage={reader.page}
                    progressUrl={route('pemustaka.ebook.progress', reader.loanId)}
                    note={`Akses s.d. ${reader.due}`}
                    onClose={() => router.get(route('pemustaka.pinjaman'), {}, { preserveScroll: true })}
                />
            )}
        </PemustakaLayout>
    );
}
