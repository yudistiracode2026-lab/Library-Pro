import { PdfReader } from '@/components/pemustaka/pdf-reader';
import PemustakaLayout from '@/layouts/pemustaka-layout';
import { router } from '@inertiajs/react';
import { BookOpen, BookOpenText, CircleCheck, EyeOff, GraduationCap, LibraryBig, Lock, QrCode, Search, Wifi, WifiOff, X } from 'lucide-react';
import { type ComponentType, useEffect, useRef, useState } from 'react';

interface Work {
    id: number;
    type: string;
    title: string;
    author: string;
    member_number: string | null;
    study_program: string | null;
    year: number;
    advisor: string | null;
    abstract: string | null;
    keywords?: string | null;
    pages?: number | null;
    call_number?: string | null;
    hasFile?: boolean;
}

interface BacaProps {
    tab: string;
    filters: { q: string; tahun: string };
    gate: { network: boolean; presence: boolean; since: string | null; open: boolean };
    counts: Record<string, number>;
    works: Work[];
    years: number[];
    selected: Work | null;
    history: { id: number; thesisId: number; title: string; type: string; when: string; pages: string; minutes: number }[];
    reader: { sessionId: number; title: string; file: string; endsAt: number; watermark: string } | null;
    minutes: number;
}

const TYPE: Record<string, [ComponentType<{ className?: string }>, string]> = {
    Skripsi: [GraduationCap, 'bg-teal-600'],
    Tesis: [BookOpenText, 'bg-violet'],
    Disertasi: [LibraryBig, 'bg-berry'],
};

export default function Baca({ tab, filters, gate, counts, works, years, selected, history, reader, minutes }: BacaProps) {
    const [q, setQ] = useState(filters.q);
    const first = useRef(true);
    const go = (params: Record<string, string | number | undefined>) =>
        router.get(
            route('pemustaka.baca'),
            Object.fromEntries(
                Object.entries({ jenis: tab, q: q || undefined, tahun: filters.tahun || undefined, ...params }).filter(
                    ([, v]) => v !== undefined && v !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const timer = setTimeout(() => go({}), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const title = tab === 'riwayat' ? 'Riwayat baca' : `Baca di tempat · ${tab.toLowerCase()}`;

    return (
        <PemustakaLayout title="Baca di tempat" wide>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-[26px] font-bold">{title}</h1>
                <span
                    className={`flex h-[34px] flex-none items-center gap-2 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap ${gate.open ? 'bg-success-soft text-success' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                >
                    {gate.open ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
                    {gate.open ? 'Di perpustakaan · teks lengkap terbuka' : 'Di luar perpustakaan · hanya abstrak'}
                </span>
            </div>

            {tab === 'riwayat' ? (
                <>
                    <p className="text-fg-3 text-sm">
                        Riwayat sesi baca kamu. Data ini juga dipakai perpustakaan untuk statistik pemanfaatan repositori.
                    </p>
                    <section className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                        {history.map((h) => (
                            <div
                                key={h.id}
                                className="flex flex-wrap items-center gap-3.5 border-b border-slate-200 px-5 py-3.5 text-sm dark:border-slate-700"
                            >
                                <div className="min-w-[200px] flex-1">
                                    <div className="font-semibold">{h.title}</div>
                                    <div className="text-fg-3 text-xs">
                                        {h.type} · {h.when}
                                    </div>
                                </div>
                                <span className="text-fg-2 text-[13px]">{h.pages}</span>
                                <span className="font-mono text-[13px]">{h.minutes} menit</span>
                                <button
                                    type="button"
                                    onClick={() => router.get(route('pemustaka.baca'), { jenis: h.type, karya: h.thesisId })}
                                    className="text-fg-1 h-[34px] cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-semibold hover:bg-slate-100 dark:bg-slate-800"
                                >
                                    Buka lagi
                                </button>
                            </div>
                        ))}
                        {history.length === 0 && <div className="text-fg-3 p-8 text-center text-sm">Belum ada sesi baca.</div>}
                    </section>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4">
                        <section className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                            <span className="font-display text-[17px] font-bold">Syarat membaca teks lengkap</span>
                            <span className="text-fg-3 text-sm leading-relaxed">
                                Abstrak bisa dibaca dari mana saja. Teks lengkap skripsi, tesis, dan disertasi hanya bisa dibaca di dalam perpustakaan
                                dan tidak bisa diunduh, dicetak, atau disalin.
                            </span>
                            <Requirement
                                ok={gate.network}
                                icon={Wifi}
                                label="Terhubung ke Wi-Fi perpustakaan"
                                detail={gate.network ? 'Jaringan perpustakaan terdeteksi.' : 'Kamu sedang memakai jaringan di luar perpustakaan.'}
                            />
                            <Requirement
                                ok={gate.presence}
                                icon={QrCode}
                                label="Presensi masuk hari ini"
                                detail={gate.presence ? `Tercatat masuk pukul ${gate.since}.` : 'Scan QR di kios pintu masuk lewat menu Beranda.'}
                            />
                        </section>
                        <section className="bg-grad-leaf flex flex-col gap-2.5 rounded-lg p-5 text-white shadow-md">
                            <span className="text-[11px] font-semibold tracking-[.08em] text-teal-50 uppercase">Lokasi</span>
                            <span className="font-display text-xl font-extrabold">Ruang koleksi skripsi, tesis &amp; disertasi · lantai 3</span>
                            <span className="text-sm leading-relaxed">
                                Terminal baca tersedia di ruang koleksi, atau pakai laptop/HP sendiri yang terhubung ke Wi-Fi perpustakaan di area
                                mana pun di gedung perpustakaan. Satu sesi baca {minutes} menit.
                            </span>
                            <div className="mt-auto flex flex-wrap gap-2">
                                {['Skripsi', 'Tesis', 'Disertasi'].map((t) => (
                                    <span key={t} className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                                        {counts[t] ?? 0} {t.toLowerCase()}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-fg-3 flex h-[46px] flex-[1_1_280px] items-center gap-2.5 rounded-md bg-white px-3.5 shadow-sm dark:bg-slate-800">
                            <Search className="size-4 flex-none" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari judul, penulis, pembimbing, atau kata kunci"
                                aria-label="Cari karya"
                                className="text-fg-1 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                            />
                        </label>
                        <select
                            value={filters.tahun}
                            onChange={(e) => go({ tahun: e.target.value || undefined })}
                            aria-label="Tahun"
                            className="text-fg-1 h-[46px] rounded-md bg-white px-3 text-sm shadow-sm dark:bg-slate-800"
                        >
                            <option value="">Semua tahun</option>
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                            <option value="lama">{years[years.length - 1] - 1} ke bawah</option>
                        </select>
                    </div>
                    <span className="text-fg-3 text-[13px]">
                        {works.length} {tab.toLowerCase()} ditemukan
                    </span>
                    <div className="flex flex-col gap-3">
                        {works.map((w) => {
                            const [Icon, color] = TYPE[w.type] ?? TYPE.Skripsi;

                            return (
                                <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => go({ karya: w.id })}
                                    className="grid cursor-pointer grid-cols-[52px_minmax(0,1fr)_auto] items-start gap-4 rounded-lg bg-white p-[18px] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800"
                                >
                                    <span className={`grid h-[68px] w-[52px] place-items-center rounded-[6px] text-white ${color}`}>
                                        <Icon className="size-5" />
                                    </span>
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-fg-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold dark:bg-slate-700">
                                                {w.type}
                                            </span>
                                            <span className="text-fg-3 text-xs">
                                                {w.study_program} · {w.year}
                                            </span>
                                        </div>
                                        <span className="font-display text-base leading-tight font-bold">{w.title}</span>
                                        <span className="text-fg-3 text-[13px]">
                                            {w.author}
                                            {w.advisor && ` · pembimbing ${w.advisor}`}
                                        </span>
                                        <span className="text-fg-2 line-clamp-2 text-[13px] leading-normal">{w.abstract}</span>
                                    </div>
                                    <span className="bg-warning-soft flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-amber-800">
                                        <EyeOff className="size-3.5" />
                                        Tanpa unduh
                                    </span>
                                </button>
                            );
                        })}
                        {works.length === 0 && (
                            <div className="text-fg-3 p-10 text-center">Belum ada karya yang cocok. Coba kata kunci lain, ya.</div>
                        )}
                    </div>
                </>
            )}

            {selected && <Detail work={selected} open={gate.open} minutes={minutes} onClose={() => go({ karya: undefined })} />}

            {reader && (
                <PdfReader
                    file={reader.file}
                    title={reader.title}
                    watermark={reader.watermark}
                    endsAt={reader.endsAt}
                    locked
                    closeLabel="Selesai membaca"
                    progressUrl={route('pemustaka.baca.progress', reader.sessionId)}
                    onClose={() => router.post(route('pemustaka.baca.end', reader.sessionId))}
                />
            )}
        </PemustakaLayout>
    );
}

function Requirement({ ok, icon: Icon, label, detail }: { ok: boolean; icon: ComponentType<{ className?: string }>; label: string; detail: string }) {
    return (
        <div className={`flex flex-wrap items-center gap-3 rounded-md px-3.5 py-3 ${ok ? 'bg-success-soft' : 'bg-slate-100 dark:bg-slate-700'}`}>
            {ok ? <CircleCheck className="text-success size-5" /> : <Icon className="text-fg-3 size-5" />}
            <div className="min-w-[160px] flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
                <div className="text-fg-2 text-xs">{detail}</div>
            </div>
        </div>
    );
}

function Detail({ work, open, minutes, onClose }: { work: Work; open: boolean; minutes: number; onClose: () => void }) {
    const can = open && work.hasFile;

    return (
        <div onClick={onClose} className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/40 p-6">
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90vh] w-[min(720px,100%)] flex-col gap-4 overflow-auto rounded-xl bg-white p-7 shadow-xl dark:bg-slate-800"
            >
                <div className="flex justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-fg-3 text-xs">
                            {work.type} · {work.study_program} · {work.year}
                        </span>
                        <h3 className="font-display text-[22px] leading-tight font-bold">{work.title}</h3>
                    </div>
                    <button
                        type="button"
                        aria-label="Tutup"
                        onClick={onClose}
                        className="grid size-9 flex-none cursor-pointer place-items-center rounded-[10px] bg-slate-100 dark:bg-slate-700"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-sm">
                    <span className="text-fg-3">Penulis</span>
                    <span>
                        {work.author}
                        {work.member_number && ` (${work.member_number})`}
                    </span>
                    <span className="text-fg-3">Pembimbing</span>
                    <span>{work.advisor ?? '—'}</span>
                    <span className="text-fg-3">Kata kunci</span>
                    <span>{work.keywords ?? '—'}</span>
                    <span className="text-fg-3">Halaman</span>
                    <span>
                        {work.pages ? `${work.pages} halaman · ` : ''}No. panggil <span className="font-mono">{work.call_number ?? '—'}</span>
                    </span>
                    <span className="text-fg-3">Hak akses</span>
                    <span>Abstrak terbuka · teks lengkap baca di tempat</span>
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-fg-2 text-[13px] font-semibold">Abstrak</span>
                    <p className="text-sm leading-[1.7] text-pretty">{work.abstract ?? '—'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-2 dark:border-slate-700">
                    <button
                        type="button"
                        disabled={!can}
                        onClick={() => router.post(route('pemustaka.baca.start', work.id))}
                        className="flex h-[46px] cursor-pointer items-center gap-2 rounded-md bg-teal-400 px-5 text-[15px] font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {can ? <BookOpen className="size-4" /> : <Lock className="size-4" />}
                        {can ? 'Baca teks lengkap' : 'Teks lengkap terkunci'}
                    </button>
                    <span className="text-fg-3 min-w-[200px] flex-1 text-xs">
                        {!work.hasFile
                            ? 'Berkas teks lengkap belum tersedia di repositori.'
                            : open
                              ? `Sesi baca ${minutes} menit. Teks diberi tanda air nama dan NIM kamu, dan tidak bisa diunduh, dicetak, atau disalin.`
                              : 'Datang ke perpustakaan, sambungkan ke Wi-Fi perpustakaan, dan lakukan presensi masuk untuk membuka teks lengkap.'}
                    </span>
                </div>
            </div>
        </div>
    );
}
