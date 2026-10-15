import { Badge, type Tone } from '@/components/staf/master/cells';
import { Alert, Button, Card, CardTitle, IconButton, inputClass, PillTabs, rupiah } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { Link, router, useForm } from '@inertiajs/react';
import { Check, Download, Flame, Lightbulb, Minus, PackageCheck, Plus, Send, ShoppingCart, Sparkles, Trash2, Undo2, Wallet } from 'lucide-react';
import { type FormEvent, useState } from 'react';

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
        ddc: string;
        inList: boolean;
    }[];
    favorites: {
        id: number;
        title: string;
        author: string;
        call_number: string | null;
        copies: number;
        available: number;
        loans: number;
        ratio: number;
        add: number;
        inList: boolean;
    }[];
    suggestions: { id: number; title: string; author: string; votes: number; status: string; note: string | null; by: string }[];
    list: {
        submitted_at: string | null;
        items: {
            id: number;
            title: string;
            author: string;
            publisher: string | null;
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

const STATUS_TONE: Record<string, Tone> = { Diusulkan: 'slate', Disetujui: 'teal', Dipesan: 'warning', Tersedia: 'success', Ditolak: 'danger' };

const STEPS = [
    ['Diusulkan', 'Pemustaka mengirim usulan, dan pemustaka lain bisa ikut mendukung.'],
    ['Disetujui', 'Pustakawan menyetujui, judul otomatis masuk daftar pengadaan (2 eks).'],
    ['Dipesan', 'Otomatis setelah daftar pengadaan diajukan ke bagian keuangan.'],
    ['Tersedia', 'Buku tiba dan dicatat di koleksi.'],
];

const post = (name: string, id: number, data = {}) => router.post(route(name, id), data, { preserveScroll: true, preserveState: true });

export default function Pengadaan({ tab, kpis, newPublications, favorites, suggestions, list }: PengadaanProps) {
    const [rejecting, setRejecting] = useState<number | null>(null);
    const submitted = list.submitted_at !== null;

    return (
        <StafLayout title="Pengadaan buku" group="Koleksi">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
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
                        tone: 'bg-slate-100 text-fg-2',
                    },
                ].map(({ t, label, value, sub, icon: Icon, tone }) => (
                    <Link
                        key={t}
                        href={route('staf.pengadaan', { tab: t })}
                        preserveScroll
                        className={`flex flex-col gap-1 rounded-lg bg-white px-[18px] py-4 shadow-sm hover:shadow-md dark:bg-slate-800 ${tab === t ? 'ring-2 ring-teal-300' : ''}`}
                    >
                        <span className="text-fg-3 flex items-center justify-between text-[13px]">
                            {label}
                            <span className={`grid size-7 place-items-center rounded-[8px] ${tone}`}>
                                <Icon className="size-4" />
                            </span>
                        </span>
                        <span className="font-display text-2xl font-extrabold">{value}</span>
                        <span className="text-fg-3 text-xs">{sub}</span>
                    </Link>
                ))}
            </div>

            <PillTabs
                tabs={[
                    { label: 'Terbitan baru', href: route('staf.pengadaan', { tab: 'baru' }), active: tab === 'baru', icon: <Sparkles /> },
                    { label: 'Favorit stok sedikit', href: route('staf.pengadaan', { tab: 'favorit' }), active: tab === 'favorit', icon: <Flame /> },
                    {
                        label: 'Usulan pemustaka',
                        href: route('staf.pengadaan', { tab: 'usulan' }),
                        active: tab === 'usulan',
                        icon: <Lightbulb />,
                        count: kpis.pending,
                    },
                    {
                        label: 'Daftar pengadaan',
                        href: route('staf.pengadaan', { tab: 'daftar' }),
                        active: tab === 'daftar',
                        icon: <ShoppingCart />,
                        count: list.items.length,
                    },
                ]}
            />

            {tab === 'baru' && (
                <Card>
                    <p className="text-fg-3 text-sm">
                        Terbitan terbaru di bidang pertanahan, survei, dan tata ruang yang belum ada di koleksi, disusun dari katalog penerbit,
                        pencarian OPAC tanpa hasil, dan kebutuhan kurikulum.
                    </p>
                    <Table cols={['Judul', 'Klasifikasi', 'Alasan', 'Harga', '']}>
                        {newPublications.map((n) => (
                            <tr key={n.id} className="border-b border-slate-200 dark:border-slate-700">
                                <td className="py-3 pr-4">
                                    <div className="font-semibold">{n.title}</div>
                                    <div className="text-fg-3 text-xs">
                                        {n.author} · {n.publisher}, {n.year}
                                    </div>
                                </td>
                                <td className="text-fg-2 py-3 pr-4">{n.ddc}</td>
                                <td className="text-fg-2 py-3 pr-4">{n.reason}</td>
                                <td className="py-3 pr-4 font-mono">{rupiah(n.price)}</td>
                                <td className="py-3 text-right">
                                    <AddButton inList={n.inList} onClick={() => post('staf.pengadaan.new', n.id)} />
                                </td>
                            </tr>
                        ))}
                    </Table>
                </Card>
            )}

            {tab === 'favorit' && (
                <Card>
                    <p className="text-fg-3 text-sm">
                        Judul yang sering dipinjam dalam 6 bulan terakhir, tetapi eksemplarnya sedikit. Rasio = jumlah peminjaman dibagi eksemplar.
                        Saran tambahan dihitung agar rasio turun ke 4× atau kurang.
                    </p>
                    <Table cols={['Judul', 'Eksemplar', 'Dipinjam 6 bln', 'Rasio', 'Saran', '']}>
                        {favorites.map((f) => (
                            <tr key={f.id} className="border-b border-slate-200 dark:border-slate-700">
                                <td className="py-3 pr-4">
                                    <div className="font-semibold">{f.title}</div>
                                    <div className="text-fg-3 text-xs">
                                        {f.author} · <span className="font-mono">{f.call_number}</span>
                                    </div>
                                </td>
                                <td className="py-3 pr-4">
                                    {f.copies}
                                    <div className={`text-xs ${f.available ? 'text-fg-3' : 'text-danger'}`}>{f.available} tersedia</div>
                                </td>
                                <td className="font-display py-3 pr-4 font-bold">{f.loans}×</td>
                                <td className="py-3 pr-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                            <div
                                                className={`h-full rounded-full ${f.ratio >= 8 ? 'bg-danger' : 'bg-marigold'}`}
                                                style={{ width: `${Math.min(100, f.ratio * 10)}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-xs">{f.ratio.toLocaleString('id-ID')}×</span>
                                    </div>
                                </td>
                                <td className="py-3 pr-4 font-semibold text-teal-700">+{f.add} eks</td>
                                <td className="py-3 text-right">
                                    <AddButton inList={f.inList} onClick={() => post('staf.pengadaan.favorite', f.id, { quantity: f.add })} />
                                </td>
                            </tr>
                        ))}
                    </Table>
                    {favorites.length === 0 && <p className="text-fg-3 py-6 text-center text-sm">Tidak ada judul dengan rasio pinjam di atas 4×.</p>}
                </Card>
            )}

            {tab === 'usulan' && (
                <>
                    <Card>
                        <CardTitle>Alur usulan pemustaka</CardTitle>
                        <div className="grid gap-3 md:grid-cols-4">
                            {STEPS.map(([label, desc], i) => (
                                <div key={label} className="flex gap-3">
                                    <span className="grid size-7 flex-none place-items-center rounded-full bg-teal-100 text-[13px] font-bold text-teal-800">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <div className="text-sm font-semibold">{label}</div>
                                        <div className="text-fg-3 text-xs leading-relaxed">{desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card>
                        <Table cols={['Suara', 'Judul & pengusul', 'Tahap', 'Aksi']}>
                            {suggestions.map((u) => (
                                <tr key={u.id} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="py-3 pr-4">
                                        <span className="font-display text-lg font-extrabold">{u.votes}</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <div className="font-semibold">{u.title}</div>
                                        <div className="text-fg-3 text-xs">
                                            {u.author} · diusulkan {u.by}
                                        </div>
                                        {u.note && <div className="text-danger mt-0.5 text-xs">{u.note}</div>}
                                    </td>
                                    <td className="py-3 pr-4">
                                        <Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {u.status === 'Diusulkan' && (
                                                <>
                                                    <Button variant="secondary" size="sm" onClick={() => setRejecting(u.id)}>
                                                        Tolak
                                                    </Button>
                                                    <Button size="sm" onClick={() => post('staf.pengadaan.suggestion.approve', u.id)}>
                                                        <Check />
                                                        Setujui
                                                    </Button>
                                                </>
                                            )}
                                            {(u.status === 'Disetujui' || u.status === 'Ditolak') && (
                                                <Button variant="ghost" size="sm" onClick={() => post('staf.pengadaan.suggestion.undo', u.id)}>
                                                    <Undo2 />
                                                    Batalkan
                                                </Button>
                                            )}
                                            {u.status === 'Dipesan' && (
                                                <Button variant="secondary" size="sm" onClick={() => post('staf.pengadaan.suggestion.arrived', u.id)}>
                                                    <PackageCheck />
                                                    Sudah tiba
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </Card>
                </>
            )}

            {tab === 'daftar' && (
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card>
                        <CardTitle aside={submitted && <Badge tone="warning">Diajukan {list.submitted_at}</Badge>}>Daftar pengadaan</CardTitle>
                        <div className="flex flex-col">
                            {list.items.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex flex-wrap items-center gap-3 border-b border-slate-200 py-3 text-sm last:border-0 dark:border-slate-700"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate font-semibold">{p.title}</span>
                                            <span className="flex-none">
                                                <Badge tone={p.source === 'Usulan' ? 'danger' : p.source === 'Favorit' ? 'warning' : 'teal'}>
                                                    {p.source}
                                                </Badge>
                                            </span>
                                        </div>
                                        <div className="text-fg-3 text-xs">
                                            {p.author} · {rupiah(p.price)}/eks
                                        </div>
                                    </div>
                                    {!submitted ? (
                                        <div className="flex items-center gap-1">
                                            <IconButton
                                                label="Kurangi"
                                                disabled={p.quantity <= 1}
                                                onClick={() =>
                                                    router.patch(
                                                        route('staf.pengadaan.item.update', p.id),
                                                        { quantity: p.quantity - 1 },
                                                        { preserveScroll: true, preserveState: true },
                                                    )
                                                }
                                            >
                                                <Minus className="size-3.5" />
                                            </IconButton>
                                            <span className="w-8 text-center font-mono">{p.quantity}</span>
                                            <IconButton
                                                label="Tambah"
                                                onClick={() =>
                                                    router.patch(
                                                        route('staf.pengadaan.item.update', p.id),
                                                        { quantity: p.quantity + 1 },
                                                        { preserveScroll: true, preserveState: true },
                                                    )
                                                }
                                            >
                                                <Plus className="size-3.5" />
                                            </IconButton>
                                        </div>
                                    ) : (
                                        <span className="font-mono">{p.quantity} eks</span>
                                    )}
                                    <span className="w-[110px] text-right font-mono font-semibold">{rupiah(p.subtotal)}</span>
                                    {!submitted && (
                                        <IconButton
                                            label={`Hapus ${p.title}`}
                                            danger
                                            onClick={() => router.delete(route('staf.pengadaan.item.destroy', p.id), { preserveScroll: true })}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </IconButton>
                                    )}
                                </div>
                            ))}
                            {list.items.length === 0 && (
                                <p className="text-fg-3 py-8 text-center text-sm">
                                    Daftar masih kosong. Tambahkan dari tab terbitan baru, favorit, atau usulan, ya.
                                </p>
                            )}
                        </div>
                    </Card>
                    <Summary list={list} />
                </div>
            )}

            {rejecting !== null && <RejectDialog id={rejecting} onClose={() => setRejecting(null)} />}
        </StafLayout>
    );
}

function Summary({ list }: { list: PengadaanProps['list'] }) {
    const over = list.total > list.budget;
    const submitted = list.submitted_at !== null;
    const used = list.budget ? Math.min(100, Math.round((list.total / list.budget) * 100)) : 0;

    return (
        <Card>
            <CardTitle>Ringkasan</CardTitle>
            <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-sm">
                <dt className="text-fg-3">Judul</dt>
                <dd className="font-semibold">{list.items.length}</dd>
                <dt className="text-fg-3">Eksemplar</dt>
                <dd className="font-semibold">{list.items.reduce((s, i) => s + i.quantity, 0)}</dd>
                {list.bySource.map((b) => (
                    <div key={b.label} className="contents">
                        <dt className="text-fg-3 pl-3">· {b.label}</dt>
                        <dd>{b.copies}</dd>
                    </div>
                ))}
            </dl>
            <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-3 dark:border-slate-700">
                <span className="text-fg-3 text-[13px]">Estimasi anggaran</span>
                <span className={`font-display text-2xl font-extrabold ${over ? 'text-danger' : ''}`}>{rupiah(list.total)}</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div className={`h-full rounded-full ${over ? 'bg-danger' : 'bg-teal-400'}`} style={{ width: `${used}%` }} />
                </div>
                <span className="text-fg-3 text-xs">
                    {over ? `Melebihi pagu ${rupiah(list.budget)}.` : `${used}% dari pagu ${rupiah(list.budget)}.`}
                </span>
            </div>
            {over && !submitted && <Alert tone="warning">Kurangi jumlah eksemplar sebelum mengajukan.</Alert>}
            <Button
                size="lg"
                disabled={submitted || over || list.items.length === 0}
                onClick={() => router.post(route('staf.pengadaan.submit'), {}, { preserveScroll: true })}
            >
                <Send />
                {submitted ? 'Sudah diajukan' : 'Ajukan ke bagian keuangan'}
            </Button>
            <a
                href={route('staf.pengadaan.export')}
                className="text-fg-1 flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
            >
                <Download className="size-4" />
                Unduh daftar (Excel)
            </a>
        </Card>
    );
}

function AddButton({ inList, onClick }: { inList: boolean; onClick: () => void }) {
    // After a list is submitted, adding a title starts the next draft list.
    return inList ? (
        <Badge tone="teal">Di daftar</Badge>
    ) : (
        <Button size="sm" variant="secondary" onClick={onClick}>
            <Plus />
            Tambah ke daftar
        </Button>
    );
}

function Table({ cols, children }: { cols: string[]; children: React.ReactNode }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
                <thead className="text-fg-3 border-b border-slate-200 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700">
                    <tr>
                        {cols.map((c) => (
                            <th key={c} className="py-2.5 pr-4 font-semibold">
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
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
