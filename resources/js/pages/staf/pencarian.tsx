import { DDC_COLORS } from '@/components/staf/master/cells';
import { Card, CardTitle, Eyebrow } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { router } from '@inertiajs/react';
import { ArrowUpDown, BookOpen, DoorOpen, Monitor, Repeat, Search, UsersRound } from 'lucide-react';
import { type ComponentType, useEffect, useRef, useState } from 'react';

interface Result {
    id: number;
    title: string;
    author: string;
    ddc_class: string;
    rack: string | null;
    floor: number | null;
    available: number;
    copies: number;
}

interface Floor {
    floor: number;
    fixtures: { label: string; x: number; y: number; w: number; h: number; icon: string }[];
    racks: { code: string; name: string; x: number; y: number; w: number; h: number; books: number }[];
}

interface RackDetail {
    code: string;
    name: string;
    floor: number;
    highlightShelf: number | null;
    shelves: { number: number; range: string }[];
    books: { id: number; title: string; call_number: string | null; shelf: number }[];
}

interface PencarianProps {
    filters: { q: string };
    results: Result[];
    selectedBookId: number | null;
    floor: number;
    floors: Floor[];
    rack: RackDetail | null;
}

const FIXTURE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
    repeat: Repeat,
    'door-open': DoorOpen,
    monitor: Monitor,
    'book-open': BookOpen,
    'arrow-up-down': ArrowUpDown,
    'users-round': UsersRound,
};

export default function Pencarian({ filters, results, selectedBookId, floor, floors, rack }: PencarianProps) {
    const [q, setQ] = useState(filters.q);
    const first = useRef(true);
    const plan = floors.find((f) => f.floor === floor) ?? floors[0];

    const go = (params: Record<string, string | number>) =>
        router.get(route('staf.pencarian'), { ...(q ? { q } : {}), ...params }, { preserveState: true, preserveScroll: true, replace: true });

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }

        const timer = setTimeout(() => go({}), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    return (
        <StafLayout title="Pencarian buku & denah rak" group="Layanan">
            <Card>
                <label className="text-fg-3 flex h-11 items-center gap-2.5 rounded-md border-[1.5px] border-slate-300 px-3">
                    <Search className="size-4 flex-none" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cari judul, pengarang, atau no. panggil"
                        aria-label="Cari buku"
                        className="text-fg-1 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    {q && <span className="text-xs whitespace-nowrap">{results.length} hasil</span>}
                </label>
                {results.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        {results.map((b) => {
                            const on = b.id === selectedBookId;

                            return (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => go({ buku: b.id })}
                                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-left ${on ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700'}`}
                                >
                                    <span className={`h-[38px] w-7 flex-none rounded-xs ${DDC_COLORS[b.ddc_class]}`} />
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-sm font-semibold">{b.title}</span>
                                        <span className="text-fg-3 truncate text-xs">{b.author}</span>
                                    </span>
                                    <span className="flex-none text-right text-xs font-semibold text-teal-700 dark:text-teal-200">
                                        Lt. {b.floor} · Rak {b.rack}
                                        <span className={`block font-medium ${b.available > 0 ? 'text-fg-3' : 'text-danger'}`}>
                                            {b.available > 0 ? `${b.available} dari ${b.copies} tersedia` : 'Dipinjam semua'}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
                {q && results.length === 0 && <p className="text-fg-3 text-sm">Belum ada buku yang cocok. Coba kata kunci lain, ya.</p>}
            </Card>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-stretch gap-4">
                <Card className="min-w-0">
                    <CardTitle
                        aside={
                            <div className="flex gap-1 rounded-[10px] bg-slate-100 p-1 dark:bg-slate-700">
                                {floors.map((f) => (
                                    <button
                                        key={f.floor}
                                        type="button"
                                        onClick={() => go({ lantai: f.floor })}
                                        className={`h-[30px] cursor-pointer rounded-sm px-3 text-[13px] font-semibold whitespace-nowrap ${f.floor === plan.floor ? 'text-fg-1 bg-white shadow-sm dark:bg-slate-800' : 'text-fg-3'}`}
                                    >
                                        Lantai {f.floor}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        Denah rak · tampak depan
                    </CardTitle>
                    <div className="overflow-x-auto">
                        <div className="relative aspect-[100/62] w-full min-w-[300px] rounded-md border-2 border-slate-300 bg-slate-50 dark:bg-slate-900">
                            {plan.fixtures.map((x) => {
                                const Icon = FIXTURE_ICONS[x.icon] ?? BookOpen;

                                return (
                                    <div
                                        key={x.label}
                                        className="text-fg-3 absolute flex items-center justify-center gap-1.5 rounded-sm bg-slate-200 text-center text-[11px] dark:bg-slate-700"
                                        style={{ left: `${x.x}%`, top: `${x.y}%`, width: `${x.w}%`, height: `${x.h}%` }}
                                    >
                                        <Icon className="size-3.5 flex-none" />
                                        <span className="hidden sm:inline">{x.label}</span>
                                    </div>
                                );
                            })}
                            {plan.racks.map((r) => {
                                const on = r.code === rack?.code;

                                return (
                                    <button
                                        key={r.code}
                                        type="button"
                                        title={`${r.code} · ${r.name} · ${r.books} judul`}
                                        onClick={() => go({ rak: r.code })}
                                        className={`font-display absolute flex cursor-pointer flex-col items-center justify-center rounded-[6px] border-2 text-[13px] font-extrabold ${on ? 'border-teal-500 bg-teal-400 text-white' : 'text-fg-1 border-slate-300 bg-white hover:border-teal-300 dark:bg-slate-800'}`}
                                        style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
                                    >
                                        {r.code}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="text-fg-3 flex flex-wrap gap-3.5 text-xs">
                        <Legend className="bg-teal-400">Rak dipilih</Legend>
                        <Legend className="bg-sunset">Ambalan lokasi buku</Legend>
                        <Legend className="border-2 border-slate-300 bg-white">Rak koleksi</Legend>
                        <Legend className="bg-slate-200">Area / fasilitas</Legend>
                    </div>
                </Card>

                {rack && (
                    <Card className="min-w-0">
                        <CardTitle
                            aside={
                                <span className="text-fg-3 text-xs">
                                    Lantai {rack.floor} · {rack.name}
                                </span>
                            }
                        >
                            Tampak samping rak {rack.code}
                        </CardTitle>
                        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                            <div className="text-fg-3 grid grid-rows-3 gap-2 py-2.5 text-[11px] font-semibold">
                                {[1, 2, 3].map((row) => (
                                    <span key={row} className="flex items-center">
                                        Baris {row}
                                    </span>
                                ))}
                            </div>
                            <div className="grid auto-rows-[minmax(64px,auto)] grid-cols-2 gap-2 rounded-[6px] bg-slate-700 p-2.5">
                                {rack.shelves.map((s) => {
                                    const glow = s.number === rack.highlightShelf;

                                    return (
                                        <div
                                            key={s.number}
                                            className={`flex min-w-0 flex-col justify-end gap-0.5 rounded-[3px] border-b-[5px] px-2 py-1.5 text-[11px] leading-snug font-bold ${glow ? 'animate-shelfglow bg-sunset [animation:shelfglow_1.6s_ease-in-out_infinite] border-[#c2410c] text-white' : 'text-fg-2 border-slate-400 bg-slate-100'}`}
                                        >
                                            <span>Ambalan {s.number}</span>
                                            <span className="font-mono font-medium break-words">{s.range}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <Eyebrow>Koleksi di rak ini</Eyebrow>
                        <div className="-mt-2 max-h-[220px] overflow-auto">
                            {rack.books.map((b) => (
                                <div
                                    key={b.id}
                                    className="flex justify-between gap-3 border-b border-slate-200 py-1.5 text-[13px] dark:border-slate-700"
                                >
                                    <span
                                        className={`min-w-0 truncate ${b.id === selectedBookId ? 'font-bold text-teal-700 dark:text-teal-200' : ''}`}
                                    >
                                        {b.title}
                                    </span>
                                    <span className="text-fg-3 font-mono text-[11px] whitespace-nowrap">
                                        {b.call_number} · amb. {b.shelf}
                                    </span>
                                </div>
                            ))}
                            {rack.books.length === 0 && <p className="text-fg-3 py-4 text-sm">Rak ini belum berisi koleksi.</p>}
                        </div>
                    </Card>
                )}
            </div>
        </StafLayout>
    );
}

function Legend({ className, children }: { className: string; children: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={`size-3 rounded-[3px] ${className}`} />
            {children}
        </span>
    );
}
