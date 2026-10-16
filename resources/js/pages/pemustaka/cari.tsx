import { DDC_COLORS } from '@/components/staf/master/cells';
import PemustakaLayout from '@/layouts/pemustaka-layout';
import { router } from '@inertiajs/react';
import { BookOpen, Download, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Result {
    id: number;
    type: 'fisik' | 'ebook';
    title: string;
    author: string;
    year: number | null;
    ddc_class: string;
    rack: string | null;
    available: number;
    mine: boolean;
}

interface Location {
    id: number;
    title: string;
    author: string;
    call_number: string | null;
    ddc_class: string;
    available: number;
    floor: number;
    fixtures: { label: string; x: number; y: number; w: number; h: number }[];
    racks: { code: string; x: number; y: number; w: number; h: number }[];
    rack: {
        code: string;
        name: string;
        highlightShelf: number | null;
        shelves: { number: number; range: string; count: number }[];
    } | null;
}

interface Ebook {
    id: number;
    title: string;
    author: string;
    publisher: string | null;
    year: number | null;
    ddc_class: string;
    collection_type: string;
    format: string | null;
    size: number | null;
    licences: number;
    available: number;
    mine: { id: number; due: string } | null;
    full: boolean;
    max: number;
    days: number;
}

interface CariProps {
    filters: { q: string; jenis: string };
    results: Result[];
    selected: Location | null;
    ebook: Ebook | null;
}

export default function Cari({ filters, results, selected, ebook }: CariProps) {
    const [q, setQ] = useState(filters.q);
    const first = useRef(true);
    const go = (params: Record<string, string | number | undefined>) =>
        router.get(
            route('pemustaka.cari'),
            Object.fromEntries(
                Object.entries({ q: q || undefined, jenis: filters.jenis || undefined, ...params }).filter(([, v]) => v !== undefined && v !== ''),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const timer = setTimeout(() => go({ buku: selected?.id }), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    return (
        <PemustakaLayout title="Cari buku">
            <label className="text-fg-3 flex h-[52px] items-center gap-2.5 rounded-[14px] bg-white px-4 shadow-md dark:bg-slate-800">
                <Search className="size-5 flex-none" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari judul, pengarang, atau subjek"
                    aria-label="Cari buku"
                    className="text-fg-1 min-w-0 flex-1 bg-transparent text-base outline-none"
                />
            </label>
            <div className="flex flex-wrap gap-1.5">
                {[
                    ['', 'Semua'],
                    ['fisik', 'Buku fisik'],
                    ['ebook', 'E-book'],
                ].map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => go({ jenis: value || undefined })}
                        className={`h-9 cursor-pointer rounded-full border px-3.5 text-[13px] font-semibold ${filters.jenis === value ? 'border-teal-400 bg-teal-400 text-white' : 'text-fg-2 border-slate-200 bg-white dark:bg-slate-800'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-5">
                <div className="flex flex-col gap-2.5">
                    {results.map((b) => {
                        const on = b.type === 'fisik' && selected?.id === b.id;

                        return (
                            <button
                                key={b.id}
                                type="button"
                                onClick={() => go(b.type === 'ebook' ? { ebook: b.id, buku: selected?.id } : { buku: b.id })}
                                className={`flex cursor-pointer gap-3.5 rounded-[14px] border p-3 text-left ${on ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 bg-white hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800'}`}
                            >
                                <div className={`h-[58px] w-[42px] flex-none rounded-[5px] ${DDC_COLORS[b.ddc_class] ?? 'bg-teal-600'}`} />
                                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                                    <span
                                        className={`self-start rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.type === 'ebook' ? 'bg-teal-50 text-teal-700' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                                    >
                                        {b.type === 'ebook' ? 'E-book' : 'Buku fisik'}
                                    </span>
                                    <span className="text-[15px] font-semibold">{b.title}</span>
                                    <span className="text-fg-3 text-[13px]">
                                        {b.author}
                                        {b.year && ` · ${b.year}`}
                                    </span>
                                    <span
                                        className={`text-xs font-semibold ${b.mine ? 'text-teal-700' : b.available > 0 ? 'text-success' : 'text-amber-800'}`}
                                    >
                                        {b.type === 'ebook'
                                            ? b.mine
                                                ? 'Sedang kamu pinjam'
                                                : b.available > 0
                                                  ? `${b.available} lisensi tersedia · baca daring`
                                                  : 'Semua lisensi sedang dipakai'
                                            : `${b.available > 0 ? `${b.available} tersedia` : 'Sedang dipinjam'} · Rak ${b.rack ?? '—'}`}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                    {results.length === 0 && (
                        <p className="text-fg-3 p-8 text-center text-sm">Belum ada koleksi yang cocok. Coba kata kunci lain, ya.</p>
                    )}
                </div>

                {selected && <LocationPanel book={selected} />}
            </div>

            {ebook && <EbookModal ebook={ebook} onClose={() => go({ ebook: undefined, buku: selected?.id })} />}
        </PemustakaLayout>
    );
}

function LocationPanel({ book }: { book: Location }) {
    const shelf = book.rack?.highlightShelf;

    return (
        <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm lg:sticky lg:top-[84px] dark:bg-slate-800">
            <div className="flex gap-4">
                <div className={`h-[110px] w-20 flex-none rounded-[6px] ${DDC_COLORS[book.ddc_class] ?? 'bg-teal-600'}`} />
                <div className="flex flex-col gap-1">
                    <span className="font-display text-[19px] leading-tight font-bold">{book.title}</span>
                    <span className="text-fg-3 text-sm">{book.author}</span>
                    <span className="text-fg-3 font-mono text-xs">{book.call_number}</span>
                    <span className={`text-[13px] font-semibold ${book.available ? 'text-success' : 'text-amber-800'}`}>
                        {book.available ? `${book.available} eksemplar tersedia` : 'Semua eksemplar sedang dipinjam'}
                    </span>
                </div>
            </div>
            {book.rack && (
                <>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">
                            Lantai {book.floor} · Rak {book.rack.code}
                            {shelf && ` · ambalan ${shelf}`}
                        </span>
                        <span className="text-fg-3 text-xs">{book.rack.name}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="relative aspect-[100/62] w-full min-w-[420px] rounded-md border-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900">
                            {book.fixtures.map((x) => (
                                <div
                                    key={x.label}
                                    className="text-fg-3 absolute flex items-center justify-center rounded-[8px] bg-slate-200 text-center text-[11px] dark:bg-slate-700"
                                    style={{ left: `${x.x}%`, top: `${x.y}%`, width: `${x.w}%`, height: `${x.h}%` }}
                                >
                                    {x.label}
                                </div>
                            ))}
                            {book.racks.map((r) => {
                                const hit = r.code === book.rack?.code;

                                return (
                                    <div
                                        key={r.code}
                                        className={`font-display absolute grid place-items-center rounded-[5px] border-2 text-[11px] font-extrabold ${hit ? '[animation:pulsering_1.4s_ease-out_infinite] border-teal-600 bg-teal-400 text-white' : 'text-fg-3 border-slate-300 bg-white dark:bg-slate-800'}`}
                                        style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
                                    >
                                        {r.code}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">Tampak samping rak {book.rack.code}</span>
                        <div className="grid max-w-[440px] grid-cols-[auto_minmax(0,1fr)] gap-2">
                            <div className="text-fg-3 grid grid-rows-[repeat(3,68px)] gap-2 py-2.5 text-[11px] font-semibold">
                                {[1, 2, 3].map((n) => (
                                    <span key={n} className="flex items-center">
                                        Baris {n}
                                    </span>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 grid-rows-[repeat(3,68px)] gap-2 rounded-[6px] bg-slate-700 p-2.5">
                                {book.rack.shelves.map((s) => {
                                    const glow = s.number === shelf;

                                    return (
                                        <div
                                            key={s.number}
                                            className={`flex min-w-0 flex-col justify-end gap-0.5 rounded-[3px] border-b-[5px] px-2 py-1.5 text-[11px] font-bold ${glow ? 'bg-sunset border-sunset [animation:shelfglow_1.2s_ease-in-out_infinite] text-white' : 'text-fg-3 border-slate-400 bg-slate-100'}`}
                                        >
                                            Ambalan {s.number}
                                            <span className="truncate font-medium">
                                                {glow ? book.title : s.count ? `${s.count} judul` : 'kosong'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

function EbookModal({ ebook, onClose }: { ebook: Ebook; onClose: () => void }) {
    const can = !!ebook.mine || (ebook.available > 0 && !ebook.full);
    const label = ebook.mine
        ? 'Lanjut baca'
        : ebook.available <= 0
          ? 'Belum tersedia'
          : ebook.full
            ? `Batas ${ebook.max} e-book tercapai`
            : `Pinjam ${ebook.days} hari`;
    const note = ebook.mine
        ? 'Kembalikan lebih awal dari menu Pinjaman agar lisensinya bisa dipakai pemustaka lain.'
        : ebook.full
          ? 'Kembalikan salah satu e-book dulu sebelum meminjam yang baru.'
          : ebook.available <= 0
            ? 'Coba lagi nanti. Lisensi kembali otomatis saat jatuh tempo peminjam lain.'
            : `Akses berakhir otomatis setelah ${ebook.days} hari. Berkas tidak bisa diunduh atau dicetak.`;

    return (
        <div onClick={onClose} className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/40 p-6">
            <div
                onClick={(e) => e.stopPropagation()}
                className="grid max-h-[90vh] w-[min(640px,100%)] grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-6 overflow-auto rounded-xl bg-white p-7 shadow-xl dark:bg-slate-800"
            >
                <div
                    className={`flex aspect-[2/3] max-w-[200px] flex-col justify-between rounded-[8px] p-3.5 text-white shadow-md ${DDC_COLORS[ebook.ddc_class] ?? 'bg-teal-600'}`}
                >
                    <span className="self-start rounded-[4px] bg-white/25 px-1.5 py-0.5 font-mono text-[10px] font-semibold">{ebook.format}</span>
                    <span className="font-display text-base leading-tight font-extrabold">{ebook.title}</span>
                    <span className="text-xs">{ebook.author}</span>
                </div>
                <div className="col-span-2 flex min-w-0 flex-col gap-3.5">
                    <div className="flex justify-between gap-3">
                        <h3 className="font-display text-[21px] leading-tight font-bold">{ebook.title}</h3>
                        <button
                            type="button"
                            aria-label="Tutup"
                            onClick={onClose}
                            className="grid size-9 flex-none cursor-pointer place-items-center rounded-[10px] bg-slate-100 dark:bg-slate-700"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-sm">
                        <span className="text-fg-3">Pengarang</span>
                        <span>{ebook.author}</span>
                        <span className="text-fg-3">Penerbit</span>
                        <span>
                            {ebook.publisher}
                            {ebook.year && `, ${ebook.year}`}
                        </span>
                        <span className="text-fg-3">Kategori</span>
                        <span>{ebook.collection_type}</span>
                        <span className="text-fg-3">Berkas</span>
                        <span>
                            {ebook.format}
                            {ebook.size && ` · ${ebook.size.toLocaleString('id-ID')} MB`}
                        </span>
                        <span className="text-fg-3">Lisensi</span>
                        <span className={`font-semibold ${ebook.mine ? 'text-teal-700' : ebook.available > 0 ? 'text-success' : 'text-amber-800'}`}>
                            {ebook.mine
                                ? `Sedang kamu pinjam · s.d. ${ebook.mine.due}`
                                : ebook.available > 0
                                  ? `${ebook.available} dari ${ebook.licences} lisensi tersedia`
                                  : 'Semua lisensi sedang dipakai'}
                        </span>
                    </div>
                    <button
                        type="button"
                        disabled={!can}
                        onClick={() =>
                            ebook.mine
                                ? router.get(route('pemustaka.pinjaman'), { baca: ebook.mine.id })
                                : router.post(route('pemustaka.ebook.borrow', ebook.id))
                        }
                        className="mt-auto flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-md bg-teal-400 text-[15px] font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {ebook.mine ? <BookOpen className="size-4" /> : <Download className="size-4" />}
                        {label}
                    </button>
                    <span className="text-fg-3 text-xs">{note}</span>
                </div>
            </div>
        </div>
    );
}
