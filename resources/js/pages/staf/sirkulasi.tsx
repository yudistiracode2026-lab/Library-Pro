import { Badge, type Tone } from '@/components/staf/master/cells';
import { Alert, Card, CardTitle, initials, PillTabs, rupiah } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, List, ScanBarcode, X } from 'lucide-react';
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

const scanInput =
    'h-11 min-w-0 flex-1 rounded-md border-[1.5px] border-slate-300 bg-white px-3 font-mono text-sm text-fg-1 outline-none focus:border-teal-400 disabled:bg-slate-50 dark:bg-slate-800';
const scanButton =
    'h-11 flex-none cursor-pointer rounded-md border border-slate-200 bg-white px-4 font-semibold text-fg-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-fg-4 dark:bg-slate-800';

const visit = (params: Record<string, string>) => router.get(route('staf.sirkulasi'), params, { preserveScroll: true, preserveState: true });

export default function Sirkulasi(props: SirkulasiProps) {
    const { tab } = props;

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
                        },
                    ]}
                />
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-4">
            <Card>
                <Step n={1}>Anggota</Step>
                <form onSubmit={findMember} className="flex gap-2">
                    <input
                        value={memberQ}
                        onChange={(e) => setMemberQ(e.target.value)}
                        placeholder="Scan kartu atau ketik NIM"
                        aria-label="NIM / NIP anggota"
                        className={scanInput}
                    />
                    <button type="submit" className={scanButton}>
                        Cari
                    </button>
                </form>
                <Hints label="Coba:" values={hints.members} onPick={(v) => findMember(undefined, v)} />

                {borrower && 'error' in borrower && <Alert>{borrower.error}</Alert>}
                {member && (
                    <div className="flex gap-3.5 rounded-[14px] bg-teal-50 p-4 dark:bg-teal-900">
                        <span className="font-display grid size-12 flex-none place-items-center rounded-full bg-white font-extrabold text-teal-700 dark:bg-slate-800">
                            {initials(member.name)}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="font-display text-base font-bold">{member.name}</span>
                            <span className="text-fg-2 text-[13px]">
                                {member.member_number} · {member.study_program}
                            </span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-white px-2.5 py-[3px] text-xs font-semibold dark:bg-slate-800">
                                    Pinjaman {member.active + cart.length}/{rules.maxLoans}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {member?.block && <Alert>{member.block}</Alert>}

                <span className="mt-2">
                    <Step n={2}>Eksemplar</Step>
                </span>
                <form onSubmit={addCopy} className="flex gap-2">
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Scan barcode buku, mis. B0002-1"
                        aria-label="Barcode eksemplar"
                        disabled={!member || !!member.block}
                        className={scanInput}
                    />
                    <button type="submit" className={scanButton} disabled={!member || !!member.block}>
                        Tambah
                    </button>
                </form>
                <Hints label="Coba:" values={hints.copies} onPick={setCode} />
                {error && <Alert>{error}</Alert>}
            </Card>

            <Card>
                <CardTitle aside={<span className="text-fg-3 text-[13px]">Jatuh tempo {rules.dueDate}</span>}>Daftar pinjam</CardTitle>
                <div className="flex flex-col gap-3.5">
                    {cart.map((c) => (
                        <div key={c.code} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                            <span className="h-[50px] w-9 flex-none rounded-xs bg-teal-600" />
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
                    {cart.length === 0 && (
                        <div className="text-fg-3 rounded-md border-[1.5px] border-dashed border-slate-300 p-8 text-center text-sm dark:border-slate-600">
                            Belum ada buku. Scan barcode di sebelah kiri.
                        </div>
                    )}
                </div>
                {serverError && <Alert>{serverError}</Alert>}
                <button
                    type="button"
                    onClick={lend}
                    disabled={!member || cart.length === 0 || processing}
                    className="h-[46px] cursor-pointer rounded-md bg-teal-400 text-[15px] font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    Proses peminjaman
                </button>
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-4">
            <Card>
                <CardTitle>Scan buku yang dikembalikan</CardTitle>
                <form onSubmit={find} className="flex gap-2">
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Barcode eksemplar"
                        aria-label="Barcode eksemplar"
                        className={scanInput}
                    />
                    <button type="submit" className={scanButton}>
                        Cek
                    </button>
                </form>
                <span className="text-fg-3 text-[13px]">Atau pilih dari pinjaman aktif:</span>
                <div className="flex flex-col gap-3.5">
                    {loans.data.map((l) => {
                        const status = loanStatus(l.days_left);

                        return (
                            <button
                                key={l.id}
                                type="button"
                                onClick={() => find(undefined, l.code)}
                                className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm ${loan?.id === l.id ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700'}`}
                            >
                                <span className="text-fg-3 w-[72px] flex-none font-mono text-xs">{l.code}</span>
                                <span className="min-w-0 flex-1 font-semibold">{l.title}</span>
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
                        <h2 className="font-display text-[17px] font-bold">{loan.title}</h2>
                        <dl className="grid grid-cols-[140px_1fr] gap-2.5 text-sm">
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
                        <button
                            type="button"
                            onClick={() => router.post(route('staf.sirkulasi.return', loan.id), { damaged }, { preserveScroll: true })}
                            className="h-[46px] cursor-pointer rounded-md bg-teal-400 text-[15px] font-semibold text-white hover:bg-teal-500"
                        >
                            Proses pengembalian
                        </button>
                    </>
                ) : (
                    !returning && (
                        <div className="text-fg-3 flex flex-col items-center gap-1 px-4 py-12 text-center text-sm">
                            <ScanBarcode className="size-7" />
                            Detail pinjaman tampil di sini setelah buku di-scan.
                        </div>
                    )
                )}
            </Card>
        </div>
    );
}

/** Columns of the active loans table, shared by its header and rows. */
const ACTIVE_GRID = 'grid min-w-[900px] grid-cols-[44px_90px_minmax(0,1.6fr)_minmax(0,1fr)_110px_110px_130px_120px] items-center gap-3 px-5';

function ActiveLoans({ loans, filters }: SirkulasiProps) {
    const [q, setQ] = useState(filters.q);

    return (
        <Card className="gap-0 p-0 md:p-0">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    visit({ tab: 'aktif', q });
                }}
                className="flex gap-2 px-5 pt-5"
            >
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari eksemplar, judul, atau peminjam"
                    aria-label="Cari pinjaman"
                    className={`${scanInput} max-w-md font-sans`}
                />
                <button type="submit" className={scanButton}>
                    Cari
                </button>
            </form>
            <div className="mt-4 overflow-x-auto border-t border-slate-200 dark:border-slate-700">
                <div
                    className={`${ACTIVE_GRID} text-fg-3 border-b border-slate-200 bg-slate-50 py-3 text-xs font-semibold tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900`}
                >
                    <span>No</span>
                    <span>Eksemplar</span>
                    <span>Judul</span>
                    <span>Peminjam</span>
                    <span>Tgl. pinjam</span>
                    <span>Jatuh tempo</span>
                    <span>Status</span>
                    <span>Aksi</span>
                </div>
                {loans.data.map((l, i) => {
                    const status = loanStatus(l.days_left);

                    return (
                        <div key={l.id} className={`${ACTIVE_GRID} border-b border-slate-200 py-3.5 text-sm dark:border-slate-700`}>
                            {/* Numbers continue across pages (page 2 starts at 26). */}
                            <span className="text-fg-3 font-mono text-[13px] tabular-nums">{(loans.from ?? 1) + i}</span>
                            <span className="text-fg-3 font-mono text-xs">{l.code}</span>
                            <span className="font-semibold">{l.title}</span>
                            <span>
                                {l.member}
                                <span className="text-fg-3 block text-xs">{l.member_number}</span>
                            </span>
                            <span className="text-fg-3 whitespace-nowrap">{l.loaned_at}</span>
                            <span className="whitespace-nowrap">
                                {l.due_at}
                                {l.extensions > 0 && <span className="text-fg-3 block text-xs">diperpanjang {l.extensions}×</span>}
                            </span>
                            <span className="justify-self-start">
                                <Badge tone={status.tone}>{status.label}</Badge>
                            </span>
                            <button
                                type="button"
                                disabled={!!l.extend_problem}
                                title={l.extend_problem ?? 'Perpanjang pinjaman'}
                                onClick={() => router.post(route('staf.sirkulasi.extend', l.id), {}, { preserveScroll: true })}
                                className="text-fg-1 disabled:text-fg-4 h-[34px] cursor-pointer rounded-[10px] border border-slate-200 bg-white text-[13px] font-semibold hover:bg-slate-100 disabled:cursor-not-allowed disabled:hover:bg-white dark:bg-slate-800"
                            >
                                Perpanjang
                            </button>
                        </div>
                    );
                })}
                {loans.data.length === 0 && <p className="text-fg-3 py-10 text-center text-sm">Tidak ada pinjaman aktif yang cocok.</p>}
            </div>
            <div className="text-fg-3 flex items-center justify-between px-5 py-3 text-[13px]">
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

function Hints({ label, values, onPick }: { label: string; values: string[]; onPick: (v: string) => void }) {
    if (values.length === 0) return null;

    return (
        <div className="text-fg-3 -mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            {label}
            {values.map((v) => (
                <button
                    key={v}
                    type="button"
                    onClick={() => onPick(v)}
                    className="text-fg-1 cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-xs hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-900"
                >
                    {v}
                </button>
            ))}
        </div>
    );
}
