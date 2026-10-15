import { Badge, type Tone } from '@/components/staf/master/cells';
import { Alert, Button, Card, CardTitle, initials, inputClass, PillTabs, rupiah } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, List, ScanBarcode, Search, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface LoanRow {
    id: number;
    code: string;
    title: string;
    call_number: string | null;
    member: string;
    member_number: string;
    loaned_at: string;
    due_at: string;
    days_left: number;
    extensions: number;
    extend_problem: string | null;
}

type Borrower =
    | { error: string }
    | { id: number; name: string; member_number: string; study_program: string | null; active: number; block: string | null };

type Returning = { error: string } | (LoanRow & { fine: number });

interface SirkulasiProps {
    tab: 'pinjam' | 'kembali' | 'aktif';
    rules: { loanDays: number; maxLoans: number; maxExtensions: number; finePerDay: number; dueDate: string };
    counts: { open: number; overdue: number };
    borrower: Borrower | null;
    returning: Returning | null;
    loans: Paginated<LoanRow>;
    filters: { q: string };
    hints: { members: string[]; copies: string[] };
}

function loanStatus(daysLeft: number): { label: string; tone: Tone } {
    if (daysLeft < 0) return { label: `Terlambat ${-daysLeft} hari`, tone: 'danger' };
    if (daysLeft === 0) return { label: 'Jatuh tempo hari ini', tone: 'warning' };

    return { label: `${daysLeft} hari lagi`, tone: 'slate' };
}

const visit = (params: Record<string, string>) => router.get(route('staf.sirkulasi'), params, { preserveScroll: true, preserveState: true });

export default function Sirkulasi(props: SirkulasiProps) {
    const { tab, counts } = props;

    return (
        <StafLayout title="Sirkulasi" group="Layanan">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <PillTabs
                    tabs={[
                        { label: 'Peminjaman', href: route('staf.sirkulasi', { tab: 'pinjam' }), active: tab === 'pinjam', icon: <ArrowUpRight /> },
                        {
                            label: 'Pengembalian',
                            href: route('staf.sirkulasi', { tab: 'kembali' }),
                            active: tab === 'kembali',
                            icon: <ArrowDownLeft />,
                        },
                        {
                            label: 'Pinjaman aktif',
                            href: route('staf.sirkulasi', { tab: 'aktif' }),
                            active: tab === 'aktif',
                            icon: <List />,
                            count: counts.open,
                        },
                    ]}
                />
                {counts.overdue > 0 && <Badge tone="danger">{counts.overdue} pinjaman terlambat</Badge>}
            </div>

            {tab === 'pinjam' && <Lend key={'id' in (props.borrower ?? {}) ? (props.borrower as { id: number }).id : 'none'} {...props} />}
            {tab === 'kembali' && <Return {...props} />}
            {tab === 'aktif' && <ActiveLoans {...props} />}
        </StafLayout>
    );
}

function Lend({ borrower, rules, hints }: SirkulasiProps) {
    const errors = usePage().props.errors as Record<string, string>;
    const [memberQ, setMemberQ] = useState(borrower && 'member_number' in borrower ? borrower.member_number : '');
    const [code, setCode] = useState('');
    const [cart, setCart] = useState<{ code: string; title: string; call: string | null }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const member = borrower && 'id' in borrower ? borrower : null;

    const findMember = (e?: FormEvent, value = memberQ) => {
        e?.preventDefault();
        setMemberQ(value);
        visit({ tab: 'pinjam', anggota: value.trim() });
    };

    const addCopy = async (e: FormEvent) => {
        e.preventDefault();
        if (!member) return setError('Pilih anggota terlebih dahulu.');
        if (!code.trim()) return;

        const url = route('staf.sirkulasi.check', { member_id: member.id, code: code.trim(), cart: cart.map((c) => c.code) });
        const response = await fetch(url, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
        const body = await response.json();

        if (!response.ok) {
            setError(body.error ?? Object.values(body.errors ?? {}).flat()[0] ?? 'Barcode tidak dikenali.');
            return;
        }

        setCart([...cart, body]);
        setCode('');
        setError(null);
    };

    const lend = () =>
        member &&
        router.post(
            route('staf.sirkulasi.lend'),
            { member_id: member.id, codes: cart.map((c) => c.code) },
            { preserveScroll: true, onStart: () => setProcessing(true), onFinish: () => setProcessing(false) },
        );

    const serverError = errors.member ?? errors.codes;

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <Card>
                <Step n={1}>Anggota</Step>
                <form onSubmit={findMember} className="flex gap-2">
                    <input
                        value={memberQ}
                        onChange={(e) => setMemberQ(e.target.value)}
                        placeholder="Scan kartu atau ketik NIM / NIP"
                        aria-label="NIM / NIP anggota"
                        className={inputClass}
                    />
                    <Button type="submit" variant="secondary" className="h-[42px]">
                        <Search />
                        Cari
                    </Button>
                </form>
                <Hints label="Coba:" values={hints.members} onPick={(v) => findMember(undefined, v)} />

                {borrower && 'error' in borrower && <Alert>{borrower.error}</Alert>}
                {member && (
                    <div className="flex items-center gap-3 rounded-md bg-teal-50 p-3.5 dark:bg-teal-900">
                        <span className="grid size-11 flex-none place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                            {initials(member.name)}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-semibold">{member.name}</span>
                            <span className="text-fg-3 text-xs">
                                {member.member_number} · {member.study_program}
                            </span>
                        </div>
                        <Badge tone={member.active + cart.length >= rules.maxLoans ? 'warning' : 'teal'}>
                            Pinjaman {member.active + cart.length}/{rules.maxLoans}
                        </Badge>
                    </div>
                )}
                {member?.block && <Alert>{member.block}</Alert>}

                <Step n={2}>Eksemplar</Step>
                <form onSubmit={addCopy} className="flex gap-2">
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Scan barcode buku, mis. B0002-1"
                        aria-label="Barcode eksemplar"
                        disabled={!member || !!member.block}
                        className={`${inputClass} font-mono`}
                    />
                    <Button type="submit" variant="secondary" className="h-[42px]" disabled={!member || !!member.block}>
                        <ScanBarcode />
                        Tambah
                    </Button>
                </form>
                <Hints label="Coba:" values={hints.copies} onPick={setCode} mono />
                {error && <Alert>{error}</Alert>}
            </Card>

            <Card>
                <CardTitle aside={<span className="text-fg-3 text-[13px]">Jatuh tempo {rules.dueDate}</span>}>Daftar pinjam</CardTitle>
                <div className="flex flex-col gap-2">
                    {cart.map((c) => (
                        <div key={c.code} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                            <span className="grid h-11 w-8 flex-none place-items-center rounded-xs bg-teal-600 text-white">
                                <BookOpen className="size-3.5" />
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-semibold">{c.title}</span>
                                <span className="text-fg-3 font-mono text-xs">
                                    {c.code} · {c.call}
                                </span>
                            </div>
                            <button
                                type="button"
                                aria-label={`Hapus ${c.code} dari daftar`}
                                onClick={() => setCart(cart.filter((x) => x.code !== c.code))}
                                className="text-fg-3 hover:bg-danger-soft hover:text-danger grid size-8 cursor-pointer place-items-center rounded-[9px]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ))}
                    {cart.length === 0 && <p className="text-fg-3 py-8 text-center text-sm">Belum ada buku. Scan barcode di sebelah kiri.</p>}
                </div>
                {serverError && <Alert>{serverError}</Alert>}
                <Button size="lg" onClick={lend} disabled={!member || cart.length === 0 || processing}>
                    <ArrowUpRight />
                    Proses peminjaman
                </Button>
            </Card>
        </div>
    );
}

function Return({ returning, loans, rules }: SirkulasiProps) {
    const [code, setCode] = useState(returning && 'code' in returning ? returning.code : '');
    const [damaged, setDamaged] = useState(false);
    const loan = returning && 'id' in returning ? returning : null;

    const find = (e?: FormEvent, value = code) => {
        e?.preventDefault();
        setCode(value);
        setDamaged(false);
        visit({ tab: 'kembali', kode: value.trim() });
    };

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <Card>
                <CardTitle>Scan buku yang dikembalikan</CardTitle>
                <form onSubmit={find} className="flex gap-2">
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Barcode eksemplar"
                        aria-label="Barcode eksemplar"
                        className={`${inputClass} font-mono`}
                    />
                    <Button type="submit" variant="secondary" className="h-[42px]">
                        <ScanBarcode />
                        Cek
                    </Button>
                </form>
                <span className="text-fg-3 text-[13px]">Atau pilih dari pinjaman aktif:</span>
                <div className="flex max-h-[360px] flex-col gap-1.5 overflow-auto">
                    {loans.data.map((l) => {
                        const status = loanStatus(l.days_left);

                        return (
                            <button
                                key={l.id}
                                type="button"
                                onClick={() => find(undefined, l.code)}
                                className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-left text-sm ${loan?.id === l.id ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700'}`}
                            >
                                <span className="text-fg-3 w-[72px] flex-none font-mono text-xs">{l.code}</span>
                                <span className="min-w-0 flex-1 truncate">{l.title}</span>
                                <Badge tone={status.tone}>{status.label}</Badge>
                            </button>
                        );
                    })}
                </div>
            </Card>

            <Card>
                {returning && 'error' in returning && <Alert>{returning.error}</Alert>}
                {loan ? (
                    <>
                        <h2 className="text-xl font-bold">{loan.title}</h2>
                        <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
                            <dt className="text-fg-3">Peminjam</dt>
                            <dd>
                                {loan.member} ({loan.member_number})
                            </dd>
                            <dt className="text-fg-3">Eksemplar</dt>
                            <dd className="font-mono">{loan.code}</dd>
                            <dt className="text-fg-3">Tanggal pinjam</dt>
                            <dd>{loan.loaned_at}</dd>
                            <dt className="text-fg-3">Jatuh tempo</dt>
                            <dd>{loan.due_at}</dd>
                            <dt className="text-fg-3">Keterlambatan</dt>
                            <dd className={loan.days_left < 0 ? 'text-danger font-semibold' : ''}>
                                {loan.days_left < 0 ? `${-loan.days_left} hari` : 'Tepat waktu'}
                            </dd>
                            <dt className="text-fg-3">Denda</dt>
                            <dd className={loan.fine > 0 ? 'text-danger font-semibold' : ''}>
                                {loan.fine > 0 ? `${rupiah(loan.fine)} (${rupiah(rules.finePerDay)} × ${-loan.days_left} hari)` : 'Tidak ada'}
                            </dd>
                        </dl>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                            <input
                                type="checkbox"
                                checked={damaged}
                                onChange={(e) => setDamaged(e.target.checked)}
                                className="size-[18px] accent-teal-500"
                            />
                            Buku rusak / perlu perbaikan
                        </label>
                        <Button size="lg" onClick={() => router.post(route('staf.sirkulasi.return', loan.id), { damaged }, { preserveScroll: true })}>
                            <ArrowDownLeft />
                            Proses pengembalian
                        </Button>
                    </>
                ) : (
                    !returning && (
                        <div className="text-fg-3 flex flex-col items-center gap-2 py-14 text-center text-sm">
                            <ScanBarcode className="size-8" />
                            Detail pinjaman tampil di sini setelah buku di-scan.
                        </div>
                    )
                )}
            </Card>
        </div>
    );
}

function ActiveLoans({ loans, filters }: SirkulasiProps) {
    const [q, setQ] = useState(filters.q);

    return (
        <Card className="p-0 md:p-0">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    visit({ tab: 'aktif', q });
                }}
                className="flex gap-2 p-5 pb-0"
            >
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari eksemplar, judul, atau peminjam"
                    aria-label="Cari pinjaman"
                    className={`${inputClass} max-w-md`}
                />
                <Button type="submit" variant="secondary" className="h-[42px]">
                    <Search />
                    Cari
                </Button>
            </form>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                    <thead className="text-fg-3 border-b border-slate-200 bg-slate-50 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900">
                        <tr>
                            {['Eksemplar', 'Judul', 'Peminjam', 'Dipinjam', 'Jatuh tempo', 'Status', ''].map((h) => (
                                <th key={h} className="px-5 py-3 font-semibold">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loans.data.map((l) => {
                            const status = loanStatus(l.days_left);

                            return (
                                <tr key={l.id} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="px-5 py-3 font-mono text-[13px]">{l.code}</td>
                                    <td className="max-w-[280px] truncate px-5 py-3 font-semibold">{l.title}</td>
                                    <td className="px-5 py-3">
                                        {l.member}
                                        <div className="text-fg-3 text-xs">{l.member_number}</div>
                                    </td>
                                    <td className="px-5 py-3">{l.loaned_at}</td>
                                    <td className="px-5 py-3">
                                        {l.due_at}
                                        {l.extensions > 0 && <div className="text-fg-3 text-xs">diperpanjang {l.extensions}×</div>}
                                    </td>
                                    <td className="px-5 py-3">
                                        <Badge tone={status.tone}>{status.label}</Badge>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={!!l.extend_problem}
                                            title={l.extend_problem ?? 'Perpanjang pinjaman'}
                                            onClick={() => router.post(route('staf.sirkulasi.extend', l.id), {}, { preserveScroll: true })}
                                        >
                                            Perpanjang
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {loans.data.length === 0 && <p className="text-fg-3 py-10 text-center text-sm">Tidak ada pinjaman aktif yang cocok.</p>}
            </div>
            <div className="text-fg-3 flex items-center justify-between px-5 pb-4 text-[13px]">
                <span>{loans.total} pinjaman aktif</span>
                {loans.last_page > 1 && (
                    <div className="flex items-center gap-1">
                        {loans.prev_page_url && (
                            <Link
                                href={loans.prev_page_url}
                                preserveScroll
                                aria-label="Sebelumnya"
                                className="grid size-8 place-items-center rounded-[9px] hover:bg-teal-50"
                            >
                                <ChevronLeft className="size-4" />
                            </Link>
                        )}
                        <span className="font-mono text-xs">
                            {loans.current_page} / {loans.last_page}
                        </span>
                        {loans.next_page_url && (
                            <Link
                                href={loans.next_page_url}
                                preserveScroll
                                aria-label="Berikutnya"
                                className="grid size-8 place-items-center rounded-[9px] hover:bg-teal-50"
                            >
                                <ChevronRight className="size-4" />
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}

function Step({ n, children }: { n: number; children: string }) {
    return (
        <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">
            Langkah {n} · {children}
        </span>
    );
}

function Hints({ label, values, onPick, mono }: { label: string; values: string[]; onPick: (v: string) => void; mono?: boolean }) {
    if (values.length === 0) return null;

    return (
        <div className="text-fg-3 -mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            {label}
            {values.map((v) => (
                <button
                    key={v}
                    type="button"
                    onClick={() => onPick(v)}
                    className={`text-fg-2 cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-0.5 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-800 ${mono ? 'font-mono' : ''}`}
                >
                    {v}
                </button>
            ))}
        </div>
    );
}
