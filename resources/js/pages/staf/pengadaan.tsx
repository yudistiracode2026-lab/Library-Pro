import { DDC_COLORS } from '@/components/staf/master/cells';
import { Button, inputClass, rupiah } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { Link, router, useForm } from '@inertiajs/react';
import {
    Check,
    CircleCheck,
    Download,
    Flame,
    Lightbulb,
    Minus,
    PackageCheck,
    Plus,
    ShoppingCart,
    Sparkles,
    ThumbsUp,
    Trash2,
    Undo2,
    Wallet,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

interface PengadaanProps {
    tab: 'baru' | 'favorit' | 'usulan' | 'daftar';
    kpis: { new: number; favorites: number; pending: number; total: number; copies: number };
    newPublications: {
        id: number;
        title: string;
        author: string;
        publisher: string;
        year: number;
        price: number;
        reason: string;
        ddc_class: string;
        ddc: string;
        listed: number | null;
    }[];
    favorites: {
        id: number;
        title: string;
        author: string;
        call_number: string | null;
        ddc_class: string;
        copies: number;
        available: number;
        loans: number;
        ratio: number;
        add: number;
        listed: number | null;
    }[];
    suggestions: {
        id: number;
        title: string;
        author: string;
        votes: number;
        status: string;
        note: string | null;
        by: string;
        listed: number | null;
    }[];
    list: {
        submitted_at: string | null;
        items: {
            id: number;
            title: string;
            author: string;
            publisher: string | null;
            ddc_class: string | null;
            price: number;
            quantity: number;
            source: string;
            subtotal: number;
        }[];
        bySource: { label: string; copies: number }[];
        total: number;
        budget: number;
    };
}

/** Suggestion stages: badge colours and the hint under the badge, as in the prototype. */
const STAGES: Record<string, { tone: string; hint: (listed: number | null, note: string | null) => string }> = {
    Diusulkan: { tone: 'text-fg-2 bg-slate-100 dark:bg-slate-700', hint: () => 'Menunggu keputusan pustakawan' },
    Disetujui: { tone: 'bg-teal-50 text-teal-700', hint: (listed) => `Di daftar pengadaan · ${listed ?? 0} eks` },
    Dipesan: { tone: 'bg-warning-soft text-amber-800', hint: () => 'Menunggu buku tiba' },
    Tersedia: { tone: 'bg-success-soft text-success', hint: () => 'Sudah masuk koleksi' },
    Ditolak: { tone: 'bg-danger-soft text-danger', hint: (_, note) => note ?? 'Pengusul sudah dikabari' },
};

const STEPS: [string, string, string][] = [
    ['Diusulkan', 'Pemustaka mengirim usulan dan pemustaka lain bisa ikut mendukung.', 'text-fg-2 bg-slate-200 dark:bg-slate-600'],
    ['Disetujui', 'Pustakawan menyetujui, judul otomatis masuk daftar pengadaan (2 eks).', 'bg-teal-100 text-teal-800'],
    ['Dipesan', 'Otomatis setelah daftar pengadaan diajukan ke bagian keuangan.', 'bg-warning-soft text-amber-800'],
    ['Tersedia', 'Buku tiba dan masuk koleksi. Pengusul mendapat notifikasi.', 'bg-success-soft text-success'],
];

const SOURCE_TONE: Record<string, string> = {
    Terbaru: 'bg-teal-50 text-teal-700',
    Favorit: 'bg-warning-soft text-amber-800',
    Usulan: 'bg-danger-soft text-berry',
};

const SOURCE_LABEL: Record<string, string> = { Terbaru: 'Terbitan baru', Favorit: 'Favorit', Usulan: 'Usulan pemustaka' };

const post = (name: string, id: number, data = {}) => router.post(route(name, id), data, { preserveScroll: true, preserveState: true });

const btn = 'flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] text-[13px] font-semibold whitespace-nowrap active:scale-[.98]';
const btnPrimary = `${btn} bg-teal-400 px-3.5 text-white hover:bg-teal-500`;
const btnSecondary = `${btn} text-fg-1 border border-slate-200 bg-white px-3 hover:bg-slate-100 dark:bg-slate-800`;

/** "semester ganjil 2026/2027": Aug–Jan is the odd semester. */
function semester(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    if (m >= 8) return `semester ganjil ${y}/${y + 1}`;
    if (m === 1) return `semester ganjil ${y - 1}/${y}`;

    return `semester genap ${y - 1}/${y}`;
}

export default function Pengadaan({ tab, kpis, newPublications, favorites, suggestions, list }: PengadaanProps) {
    const [rejecting, setRejecting] = useState<number | null>(null);

    const tabs: { t: PengadaanProps['tab']; label: string; icon: typeof Sparkles; count: number }[] = [
        { t: 'baru', label: 'Terbitan baru', icon: Sparkles, count: kpis.new },
        { t: 'favorit', label: 'Favorit stok sedikit', icon: Flame, count: kpis.favorites },
        { t: 'usulan', label: 'Usulan pemustaka', icon: Lightbulb, count: kpis.pending },
        { t: 'daftar', label: 'Daftar pengadaan', icon: ShoppingCart, count: list.items.length },
    ];

    return (
        <StafLayout title="Pengadaan buku" group="Koleksi">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
                {[
                    {
                        t: 'baru',
                        label: 'Terbitan baru',
                        value: String(kpis.new),
                        sub: 'belum ada di koleksi',
                        icon: Sparkles,
                        tone: 'bg-teal-50 text-teal-700',
                    },
                    {
                        t: 'favorit',
                        label: 'Favorit stok sedikit',
                        value: String(kpis.favorites),
                        sub: 'rasio pinjam tinggi',
                        icon: Flame,
                        tone: 'bg-warning-soft text-amber-800',
                    },
                    {
                        t: 'usulan',
                        label: 'Usulan pemustaka',
                        value: String(kpis.pending),
                        sub: 'menunggu ditinjau',
                        icon: Lightbulb,
                        tone: 'bg-danger-soft text-berry',
                    },
                    {
                        t: 'daftar',
                        label: 'Estimasi anggaran',
                        value: rupiah(kpis.total),
                        sub: `${kpis.copies} eksemplar di daftar`,
                        icon: Wallet,
                        tone: 'text-fg-2 bg-slate-100 dark:bg-slate-700',
                    },
                ].map(({ t, label, value, sub, icon: Icon, tone }) => (
                    <Link
                        key={t}
                        href={route('staf.pengadaan', { tab: t })}
                        preserveScroll
                        className="flex flex-col gap-1.5 rounded-lg bg-white px-[18px] py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800"
                    >
                        <span className="flex items-center justify-between">
                            <span className="text-fg-3 text-[13px]">{label}</span>
                            <span className={`grid size-8 place-items-center rounded-[9px] ${tone}`}>
                                <Icon className="size-4" />
                            </span>
                        </span>
                        <span className="font-display text-[26px] font-extrabold tracking-[-.02em]">{value}</span>
                        <span className="text-fg-3 text-xs">{sub}</span>
                    </Link>
                ))}
            </div>

            <div className="flex flex-wrap gap-1 self-start rounded-md bg-white p-1 shadow-xs dark:bg-slate-800">
                {tabs.map(({ t, label, icon: Icon, count }) => {
                    const on = tab === t;

                    return (
                        <Link
                            key={t}
                            href={route('staf.pengadaan', { tab: t })}
                            preserveScroll
                            className={`flex h-9 items-center gap-2 rounded-[9px] px-3.5 text-sm font-semibold ${on ? 'bg-teal-400 text-white' : 'text-fg-2 hover:bg-teal-50 hover:text-teal-700'}`}
                        >
                            <Icon className="size-4" />
                            {label}
                            <span
                                className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${on ? 'bg-white/25 text-white' : 'text-fg-3 bg-slate-100 dark:bg-slate-700'}`}
                            >
                                {count}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {tab === 'baru' && (
                <>
                    <Intro>
                        Terbitan 2025–2026 di bidang pertanahan, survei, dan tata ruang yang belum ada di koleksi. Disusun dari katalog penerbit, kata
                        kunci OPAC yang tidak menemukan hasil, dan kebutuhan kurikulum.
                    </Intro>
                    <Grid
                        cols="44px minmax(0,1.8fr) minmax(0,1fr) minmax(0,1.3fr) 100px 170px"
                        min="min-w-[860px]"
                        head={['', 'Judul', 'Klasifikasi', 'Alasan', 'Harga', '']}
                        rows={newPublications.map((n) => ({
                            key: n.id,
                            cells: [
                                <Cover key="c" ddc={n.ddc_class} />,
                                <div key="t" className="min-w-0">
                                    <div className="font-semibold">{n.title}</div>
                                    <div className="text-fg-3 text-xs">
                                        {n.author} · {n.publisher}, {n.year}
                                    </div>
                                </div>,
                                <span key="k" className="text-fg-2">
                                    {n.ddc_class} {n.ddc}
                                </span>,
                                <span key="a" className="text-fg-2 text-[13px]">
                                    {n.reason}
                                </span>,
                                <span key="h" className="font-mono text-[13px]">
                                    {rupiah(n.price)}
                                </span>,
                                <AddButton key="b" listed={n.listed} onClick={() => post('staf.pengadaan.new', n.id)} />,
                            ],
                        }))}
                    />
                </>
            )}

            {tab === 'favorit' && (
                <>
                    <Intro>
                        Judul yang sering dipinjam dalam 6 bulan terakhir, tetapi jumlah eksemplarnya sedikit. Rasio = jumlah peminjaman dibagi
                        eksemplar. Saran tambahan dihitung agar rasio turun ke 4× atau kurang.
                    </Intro>
                    <Grid
                        cols="44px minmax(0,1.8fr) 100px 110px minmax(0,1fr) 110px 170px"
                        min="min-w-[900px]"
                        head={['', 'Judul', 'Eksemplar', 'Dipinjam 6 bln', 'Rasio', 'Saran', '']}
                        empty="Tidak ada judul dengan rasio pinjam di atas 4×."
                        rows={favorites.map((f) => ({
                            key: f.id,
                            cells: [
                                <Cover key="c" ddc={f.ddc_class} />,
                                <div key="t" className="min-w-0">
                                    <div className="font-semibold">{f.title}</div>
                                    <div className="text-fg-3 text-xs">
                                        {f.author} · <span className="font-mono">{f.call_number}</span>
                                    </div>
                                </div>,
                                <div key="e">
                                    <div className="font-semibold">{f.copies}</div>
                                    <div className={`text-xs ${f.available ? 'text-fg-3' : 'text-danger'}`}>{f.available} tersedia</div>
                                </div>,
                                <span key="l" className="font-display text-base font-bold">
                                    {f.loans}×
                                </span>,
                                <div key="r" className="flex items-center gap-2.5">
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                        <div
                                            className={`h-full rounded-full ${f.ratio >= 6 ? 'bg-danger' : 'bg-sunset'}`}
                                            style={{ width: `${Math.min(100, Math.round(f.ratio * 10))}%` }}
                                        />
                                    </div>
                                    <span className="w-9 font-mono text-xs">{f.ratio.toFixed(1)}×</span>
                                </div>,
                                <span key="s" className="font-semibold text-teal-700 dark:text-teal-200">
                                    +{f.add} eks
                                </span>,
                                <AddButton key="b" listed={f.listed} onClick={() => post('staf.pengadaan.favorite', f.id, { quantity: f.add })} />,
                            ],
                        }))}
                    />
                </>
            )}

            {tab === 'usulan' && (
                <>
                    <section className="flex flex-col gap-3.5 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                        <span className="font-display text-base font-bold">Alur usulan pemustaka</span>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5">
                            {STEPS.map(([label, desc, tone], i) => (
                                <div key={label} className="flex gap-2.5 rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                                    <span className={`grid size-[26px] flex-none place-items-center rounded-full text-xs font-bold ${tone}`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-semibold">{label}</span>
                                        <span className="text-fg-3 text-xs leading-[1.45]">{desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <span className="text-fg-3 text-xs">
                            Usulan yang tidak relevan dengan bidang agraria atau sudah ada di koleksi bisa <b>ditolak</b>. Penolakan masih bisa
                            dibatalkan.
                        </span>
                    </section>
                    <Grid
                        cols="64px minmax(0,1fr) 130px 190px"
                        min="min-w-[520px]"
                        dense
                        head={[
                            'Suara',
                            'Judul & pengusul',
                            'Tahap',
                            <span key="a" className="block text-right">
                                Aksi
                            </span>,
                        ]}
                        rows={suggestions.map((u) => {
                            const stage = STAGES[u.status] ?? STAGES.Diusulkan;

                            return {
                                key: u.id,
                                cells: [
                                    <span key="v" className="flex items-center gap-1 font-bold text-teal-700 dark:text-teal-200">
                                        <ThumbsUp className="size-4" />
                                        {u.votes}
                                    </span>,
                                    <div key="t" className="min-w-0">
                                        <div className="font-semibold">{u.title}</div>
                                        <div className="text-fg-3 text-xs">
                                            {u.author} · diusulkan {u.by}
                                        </div>
                                    </div>,
                                    <div key="s" className="flex flex-col gap-1">
                                        <span className={`self-start rounded-full px-2.5 py-[3px] text-xs font-semibold ${stage.tone}`}>
                                            {u.status}
                                        </span>
                                        <span className="text-fg-3 text-[11px]">{stage.hint(u.listed, u.note)}</span>
                                    </div>,
                                    <div key="a" className="flex flex-wrap items-center justify-end gap-1.5">
                                        {u.status === 'Diusulkan' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setRejecting(u.id)}
                                                    className={`${btnSecondary} hover:text-danger`}
                                                >
                                                    Tolak
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => post('staf.pengadaan.suggestion.approve', u.id)}
                                                    className={btnPrimary}
                                                >
                                                    <Check className="size-4" />
                                                    Setujui
                                                </button>
                                            </>
                                        )}
                                        {u.status === 'Disetujui' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => post('staf.pengadaan.suggestion.undo', u.id)}
                                                    className={btnSecondary}
                                                >
                                                    Batalkan
                                                </button>
                                                <Link
                                                    href={route('staf.pengadaan', { tab: 'daftar' })}
                                                    preserveScroll
                                                    className={`${btnSecondary} hover:text-teal-700`}
                                                >
                                                    <ShoppingCart className="size-4" />
                                                    Daftar
                                                </Link>
                                            </>
                                        )}
                                        {u.status === 'Dipesan' && (
                                            <button
                                                type="button"
                                                onClick={() => post('staf.pengadaan.suggestion.arrived', u.id)}
                                                className={btnPrimary}
                                            >
                                                <PackageCheck className="size-4" />
                                                Sudah tiba
                                            </button>
                                        )}
                                        {u.status === 'Tersedia' && (
                                            <span className="text-success flex items-center gap-1.5 text-[13px] font-semibold">
                                                <CircleCheck className="size-4" />
                                                Selesai
                                            </span>
                                        )}
                                        {u.status === 'Ditolak' && (
                                            <button
                                                type="button"
                                                onClick={() => post('staf.pengadaan.suggestion.undo', u.id)}
                                                className={btnSecondary}
                                            >
                                                <Undo2 className="size-4" />
                                                Batalkan
                                            </button>
                                        )}
                                    </div>,
                                ],
                            };
                        })}
                    />
                </>
            )}

            {tab === 'daftar' && <ProcurementList list={list} />}

            {rejecting !== null && <RejectDialog id={rejecting} onClose={() => setRejecting(null)} />}
        </StafLayout>
    );
}

function ProcurementList({ list }: { list: PengadaanProps['list'] }) {
    const submitted = list.submitted_at !== null;
    const copies = list.items.reduce((s, i) => s + i.quantity, 0);
    const over = list.total > list.budget;
    const used = list.budget ? Math.round((list.total / list.budget) * 100) : 0;
    const cannot = submitted || over || list.items.length === 0;
    const setQty = (id: number, quantity: number) =>
        router.patch(route('staf.pengadaan.item.update', id), { quantity }, { preserveScroll: true, preserveState: true });

    return (
        <div className="flex flex-wrap items-start gap-4">
            <section className="min-w-0 flex-[2_1_520px] overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <span className="font-display text-[17px] font-bold">Daftar pengadaan {semester()}</span>
                    <span
                        className={`flex-none rounded-full px-2.5 py-[3px] text-xs font-semibold ${submitted ? 'bg-success-soft text-success' : 'text-fg-3 bg-slate-100 dark:bg-slate-700'}`}
                    >
                        {submitted ? 'Diajukan' : 'Draf'}
                    </span>
                </div>
                {list.items.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center gap-3.5 border-b border-slate-200 px-5 py-3 text-sm dark:border-slate-700">
                        <span className={`h-[50px] w-9 flex-none rounded-xs ${p.ddc_class ? DDC_COLORS[p.ddc_class] : 'bg-teal-600'}`} />
                        <div className="min-w-[180px] flex-1">
                            <div className="font-semibold">{p.title}</div>
                            <div className="text-fg-3 flex items-center gap-2 text-xs">
                                <span className={`rounded-full px-2 py-px font-semibold ${SOURCE_TONE[p.source] ?? SOURCE_TONE.Terbaru}`}>
                                    {p.source}
                                </span>
                                {p.author} · {rupiah(p.price)}/eks
                            </div>
                        </div>
                        {submitted ? (
                            <span className="font-mono font-semibold">{p.quantity} eks</span>
                        ) : (
                            <div className="flex items-center overflow-hidden rounded-[10px] border border-slate-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    aria-label="Kurangi"
                                    disabled={p.quantity <= 1}
                                    onClick={() => setQty(p.id, p.quantity - 1)}
                                    className="grid size-[34px] cursor-pointer place-items-center bg-white hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800"
                                >
                                    <Minus className="size-[15px]" />
                                </button>
                                <span className="w-10 text-center font-mono font-semibold">{p.quantity}</span>
                                <button
                                    type="button"
                                    aria-label="Tambah"
                                    onClick={() => setQty(p.id, p.quantity + 1)}
                                    className="grid size-[34px] cursor-pointer place-items-center bg-white hover:bg-slate-100 dark:bg-slate-800"
                                >
                                    <Plus className="size-[15px]" />
                                </button>
                            </div>
                        )}
                        <span className="w-[110px] text-right font-mono font-semibold">{rupiah(p.subtotal)}</span>
                        {!submitted && (
                            <button
                                type="button"
                                title="Hapus"
                                aria-label={`Hapus ${p.title}`}
                                onClick={() => router.delete(route('staf.pengadaan.item.destroy', p.id), { preserveScroll: true })}
                                className="text-fg-3 hover:bg-danger-soft hover:text-danger grid size-[34px] cursor-pointer place-items-center rounded-[9px]"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        )}
                    </div>
                ))}
                {list.items.length === 0 && (
                    <div className="text-fg-3 p-10 text-center text-sm">
                        Daftar masih kosong. Tambahkan dari tab terbitan baru, favorit, atau usulan, ya.
                    </div>
                )}
            </section>

            <section className="flex flex-[1_1_300px] flex-col gap-4 rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                <span className="font-display text-[17px] font-bold">Ringkasan</span>
                <dl className="grid grid-cols-[1fr_auto] gap-2 text-sm">
                    <dt className="text-fg-3">Judul</dt>
                    <dd className="font-semibold">{list.items.length}</dd>
                    <dt className="text-fg-3">Eksemplar</dt>
                    <dd className="font-semibold">{copies}</dd>
                    {list.bySource.map((b) => (
                        <div key={b.label} className="contents">
                            <dt className="text-fg-3 pl-3">· {SOURCE_LABEL[b.label] ?? b.label}</dt>
                            <dd>{b.copies} eks</dd>
                        </div>
                    ))}
                </dl>
                <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <span className="text-fg-3 text-[13px]">Estimasi anggaran</span>
                    <span className={`font-display text-[26px] font-extrabold ${over ? 'text-danger' : ''}`}>{rupiah(list.total)}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className={`h-full rounded-full ${over ? 'bg-danger' : 'bg-teal-400'}`} style={{ width: `${Math.min(100, used)}%` }} />
                    </div>
                    <span className={`text-xs ${over ? 'text-danger' : ''}`}>
                        {over
                            ? `Melebihi pagu ${rupiah(list.budget)}. Kurangi jumlah eksemplar dulu, ya.`
                            : `${used}% dari pagu ${rupiah(list.budget)} · sisa ${rupiah(list.budget - list.total)}`}
                    </span>
                </div>
                <button
                    type="button"
                    disabled={cannot}
                    onClick={() => router.post(route('staf.pengadaan.submit'), {}, { preserveScroll: true })}
                    className="h-[46px] cursor-pointer rounded-md bg-teal-400 text-[15px] font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {submitted ? 'Sudah diajukan' : 'Ajukan ke bagian keuangan'}
                </button>
                <a
                    href={route('staf.pengadaan.export')}
                    className="text-fg-1 flex h-[42px] items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
                >
                    <Download className="size-4" />
                    Unduh daftar (Excel)
                </a>
            </section>
        </div>
    );
}

function Intro({ children }: { children: ReactNode }) {
    return <p className="text-fg-3 text-sm">{children}</p>;
}

function Cover({ ddc }: { ddc: string }) {
    return <div className={`h-[62px] w-11 rounded-xs shadow-sm ${DDC_COLORS[ddc] ?? 'bg-teal-600'}`} />;
}

/** Grid table on a white card with a slate header row, as in the prototype. */
function Grid({
    cols,
    min,
    head,
    rows,
    empty,
    dense,
}: {
    cols: string;
    min: string;
    head: ReactNode[];
    rows: { key: number; cells: ReactNode[] }[];
    empty?: string;
    dense?: boolean;
}) {
    const gap = dense ? 'gap-3.5 px-4' : 'gap-4 px-5';

    return (
        <section className="overflow-auto rounded-lg bg-white shadow-sm dark:bg-slate-800">
            <div
                className={`text-fg-3 grid ${min} ${gap} border-b border-slate-200 bg-slate-50 py-3 text-xs font-semibold tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900`}
                style={{ gridTemplateColumns: cols }}
            >
                {head.map((h, i) => (
                    <span key={i}>{h}</span>
                ))}
            </div>
            {rows.map((r) => (
                <div
                    key={r.key}
                    className={`grid ${min} ${gap} items-center border-b border-slate-200 py-3.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900`}
                    style={{ gridTemplateColumns: cols }}
                >
                    {r.cells}
                </div>
            ))}
            {rows.length === 0 && empty && <div className="text-fg-3 p-8 text-center text-sm">{empty}</div>}
        </section>
    );
}

function AddButton({ listed, onClick }: { listed: number | null; onClick: () => void }) {
    // After a list is submitted, adding a title starts the next draft list.
    return listed ? (
        <Link
            href={route('staf.pengadaan', { tab: 'daftar' })}
            preserveScroll
            className="flex h-9 items-center justify-center rounded-[10px] bg-teal-50 px-3 text-[13px] font-semibold whitespace-nowrap text-teal-700 dark:bg-teal-900 dark:text-teal-100"
        >
            Di daftar · {listed} eks
        </Link>
    ) : (
        <button
            type="button"
            onClick={onClick}
            className="h-9 cursor-pointer rounded-[10px] bg-teal-400 px-3 text-[13px] font-semibold whitespace-nowrap text-white hover:bg-teal-500 active:scale-[.98]"
        >
            Tambah ke daftar
        </button>
    );
}

function RejectDialog({ id, onClose }: { id: number; onClose: () => void }) {
    const form = useForm({ note: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('staf.pengadaan.suggestion.reject', id), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-xl p-7 sm:max-w-[440px]">
                <form onSubmit={submit} className="flex flex-col gap-3.5">
                    <DialogTitle className="font-display text-xl font-bold">Tolak usulan</DialogTitle>
                    <DialogDescription>Misalnya tidak relevan dengan bidang agraria, atau judulnya sudah ada di koleksi.</DialogDescription>
                    <input
                        value={form.data.note}
                        onChange={(e) => form.setData('note', e.target.value)}
                        placeholder="Alasan penolakan"
                        required
                        className={inputClass}
                    />
                    {form.errors.note && <span className="text-danger text-xs">{form.errors.note}</span>}
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="lg" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" variant="danger" size="lg" disabled={form.processing}>
                            Tolak
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
