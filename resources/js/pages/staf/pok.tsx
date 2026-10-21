import { type FieldDef, type FormValues, RecordForm } from '@/components/staf/master/record-form';
import { Button, IconButton, inputClass, Kpi } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { router, useForm } from '@inertiajs/react';
import { Coins, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Figures {
    pagu: number;
    lock_pagu: number;
    previous: number;
    current: number;
    realised: number;
    percent: number;
    remaining: number;
}

interface Item extends Figures {
    id: number;
    code: string;
    name: string;
}

interface Progress {
    id: number;
    date: string;
    label: string;
    amount: number;
    by: string | null;
}

interface Line extends Item {
    /** What can still be entered before the pagu is reached. */
    available: number;
    progress: Progress[];
}

interface Account extends Item {
    items: Line[];
}

interface Activity extends Item {
    accounts: Account[];
}

interface PokProps {
    year: number;
    month: number;
    periodLabel: string;
    years: number[];
    activities: Activity[];
    total: Figures;
}

type Level = 'activity' | 'account' | 'item';

/** What the add/edit dialog is for: a new row under a parent, or an existing row. */
type Editing = { level: Level; row?: Item; parentId?: number; parentLabel?: string };

const COLUMNS = '70px minmax(190px,1fr) repeat(5,98px) 62px 104px 88px';

const LEVEL_NAME: Record<Level, string> = { activity: 'kegiatan', account: 'akun', item: 'rincian' };

const amountFields: FieldDef[] = [
    { name: 'pagu', label: 'Pagu (Rp)', type: 'number', required: true },
    { name: 'lock_pagu', label: 'Lock pagu (Rp)', type: 'number', required: true },
];

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const number = (n: number) => n.toLocaleString('id-ID');
const percent = (n: number) => `${n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export default function Pok({ year, month, periodLabel, years, activities, total }: PokProps) {
    const [editing, setEditing] = useState<(Editing & { nonce: number }) | null>(null);
    const [deleting, setDeleting] = useState<{ level: Level; row: Item } | null>(null);
    // The line whose progress dialog is open, looked up again after each change so the dialog shows fresh figures.
    const [progressFor, setProgressFor] = useState<number | null>(null);
    const progressLine = activities.flatMap((a) => a.accounts.flatMap((ac) => ac.items)).find((i) => i.id === progressFor) ?? null;

    const open = (e: Editing) => setEditing({ ...e, nonce: Date.now() });

    return (
        <StafLayout title="Petunjuk Operasional Kegiatan" group="Anggaran">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="font-display text-[26px] font-bold">POK tahun anggaran {year}</h1>
                    <p className="text-fg-3 text-sm">Realisasi dilaporkan untuk periode {periodLabel}.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="text-fg-2 flex items-center gap-2 text-sm font-semibold">
                        Tahun
                        <select
                            value={year}
                            onChange={(e) => router.get(route('staf.pok'), { tahun: e.target.value }, { preserveScroll: true })}
                            aria-label="Tahun anggaran"
                            className={`${inputClass} h-10 w-28`}
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-fg-2 flex items-center gap-2 text-sm font-semibold">
                        Periode
                        <select
                            value={month}
                            onChange={(e) => router.get(route('staf.pok'), { tahun: year, bulan: e.target.value }, { preserveScroll: true })}
                            aria-label="Periode (bulan)"
                            className={`${inputClass} h-10 w-36`}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </label>
                    <Button onClick={() => open({ level: 'activity' })}>
                        <Plus />
                        Tambah kegiatan
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                <Kpi label="Pagu" value={number(total.pagu)} sub={`${activities.length} kegiatan`} />
                <Kpi label={`Realisasi s.d. ${periodLabel}`} value={number(total.realised)} sub={`${percent(total.percent)} dari pagu`} tone="ok" />
                <Kpi label="Lock pagu" value={number(total.lock_pagu)} sub="Dalam proses revisi" />
                <Kpi label="Sisa" value={number(total.remaining)} sub="Pagu − realisasi" />
            </div>

            <section className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div className="overflow-x-auto">
                    <div className="min-w-[1080px] text-[13px]">
                        <div
                            className="text-fg-3 grid items-end gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold tracking-[.04em] uppercase dark:border-slate-700 dark:bg-slate-900"
                            style={{ gridTemplateColumns: COLUMNS }}
                        >
                            <span>Kode</span>
                            <span>Uraian</span>
                            <span className="text-right">Pagu</span>
                            <span className="text-right">Lock pagu</span>
                            <span className="text-right">Periode lalu</span>
                            <span className="text-right">Periode ini</span>
                            <span className="text-right">s.d. periode</span>
                            <span className="text-right">%</span>
                            <span className="text-right">Sisa</span>
                            <span />
                        </div>

                        {activities.map((activity) => (
                            <div key={activity.id}>
                                <Row
                                    level="activity"
                                    row={activity}
                                    onAdd={() => open({ level: 'account', parentId: activity.id, parentLabel: `${activity.code} ${activity.name}` })}
                                    onEdit={() => open({ level: 'activity', row: activity })}
                                    onDelete={() => setDeleting({ level: 'activity', row: activity })}
                                />
                                {activity.accounts.map((account) => (
                                    <div key={account.id}>
                                        <Row
                                            level="account"
                                            row={account}
                                            onAdd={() =>
                                                open({ level: 'item', parentId: account.id, parentLabel: `${account.code} ${account.name}` })
                                            }
                                            onEdit={() => open({ level: 'account', row: account })}
                                            onDelete={() => setDeleting({ level: 'account', row: account })}
                                        />
                                        {account.items.map((item) => (
                                            <Row
                                                key={item.id}
                                                level="item"
                                                row={item}
                                                onProgress={() => setProgressFor(item.id)}
                                                onEdit={() => open({ level: 'item', row: item })}
                                                onDelete={() => setDeleting({ level: 'item', row: item })}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {activities.length === 0 ? (
                            <div className="text-fg-3 flex flex-col items-center gap-2 px-5 py-12 text-center">
                                <Wallet className="size-7" />
                                Belum ada kegiatan untuk tahun {year}. Mulai dengan menambahkan kegiatan, ya.
                            </div>
                        ) : (
                            <div
                                className="grid items-center gap-2 border-t-2 border-slate-300 bg-slate-50 px-4 py-3 font-bold dark:border-slate-600 dark:bg-slate-900"
                                style={{ gridTemplateColumns: COLUMNS }}
                            >
                                <span />
                                <span>JUMLAH</span>
                                <Amounts row={total} />
                                <span />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {editing && <PokForm key={editing.nonce} editing={editing} year={year} onClose={() => setEditing(null)} />}

            {progressLine && <ProgressDialog key={progressLine.id} line={progressLine} year={year} onClose={() => setProgressFor(null)} />}

            <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
                <DialogContent className="rounded-xl p-7 sm:max-w-[460px]">
                    <DialogTitle className="font-display text-xl font-bold">Hapus {deleting && LEVEL_NAME[deleting.level]}?</DialogTitle>
                    <DialogDescription className="text-fg-2 text-[15px] leading-relaxed">
                        <b>
                            {deleting?.row.code} {deleting?.row.name}
                        </b>{' '}
                        akan dihapus permanen
                        {deleting?.level === 'activity' && ', beserta semua akun dan rinciannya'}
                        {deleting?.level === 'account' && ', beserta semua rinciannya'}.
                    </DialogDescription>
                    <div className="mt-2 flex justify-end gap-2">
                        <Button variant="secondary" size="lg" onClick={() => setDeleting(null)}>
                            Batal
                        </Button>
                        <Button
                            variant="danger"
                            size="lg"
                            onClick={() =>
                                deleting &&
                                router.delete(route(`staf.pok.${deleting.level}.destroy`, deleting.row.id), {
                                    preserveScroll: true,
                                    onFinish: () => setDeleting(null),
                                })
                            }
                        >
                            Hapus
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </StafLayout>
    );
}

function Amounts({ row }: { row: Figures }) {
    return (
        <>
            {[row.pagu, row.lock_pagu, row.previous, row.current, row.realised].map((n, i) => (
                <span key={i} className="text-right tabular-nums">
                    {number(n)}
                </span>
            ))}
            <span className="text-right tabular-nums">{percent(row.percent)}</span>
            <span className="text-right tabular-nums">{number(row.remaining)}</span>
        </>
    );
}

function Row({
    level,
    row,
    onAdd,
    onProgress,
    onEdit,
    onDelete,
}: {
    level: Level;
    row: Item;
    onAdd?: () => void;
    onProgress?: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const styles: Record<Level, string> = {
        activity: 'bg-teal-50/60 font-bold dark:bg-teal-950/40',
        account: 'font-bold',
        item: '',
    };
    const indent: Record<Level, string> = { activity: '', account: 'pl-3', item: 'pl-7 text-fg-2' };

    return (
        <div
            className={`grid items-center gap-2 border-b border-slate-200 px-4 py-2.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900 ${styles[level]}`}
            style={{ gridTemplateColumns: COLUMNS }}
        >
            <span className="font-mono text-xs">{row.code}</span>
            <span className={`min-w-0 ${indent[level]}`}>{row.name}</span>
            <Amounts row={row} />
            <span className="flex justify-end gap-0.5">
                {onAdd && (
                    <IconButton label={level === 'activity' ? 'Tambah akun' : 'Tambah rincian'} onClick={onAdd}>
                        <Plus className="size-4" />
                    </IconButton>
                )}
                {onProgress && (
                    <IconButton label="Input progres" onClick={onProgress}>
                        <Coins className="size-4" />
                    </IconButton>
                )}
                <IconButton label={`Ubah ${LEVEL_NAME[level]}`} onClick={onEdit}>
                    <Pencil className="size-4" />
                </IconButton>
                <IconButton label={`Hapus ${LEVEL_NAME[level]}`} danger onClick={onDelete}>
                    <Trash2 className="size-4" />
                </IconButton>
            </span>
        </div>
    );
}

function PokForm({ editing, year, onClose }: { editing: Editing; year: number; onClose: () => void }) {
    const { level, row, parentId, parentLabel } = editing;
    const item = row as (Item & Figures) | undefined;

    const fields: FieldDef[] = [
        ...(level === 'activity' ? [{ name: 'year', label: 'Tahun anggaran', type: 'number', required: true } as FieldDef] : []),
        {
            name: 'code',
            label:
                level === 'activity'
                    ? 'Kode kegiatan/output (mis. 051.0A)'
                    : level === 'account'
                      ? 'Kode akun (mis. 521213)'
                      : 'Kode rincian (mis. 001264)',
            required: true,
        },
        { name: 'name', label: 'Uraian', required: true, span: 2 },
        ...(level === 'item' ? amountFields : []),
    ];

    const initial: FormValues = {
        ...(level === 'activity' ? { year: String(year) } : {}),
        code: row?.code ?? '',
        name: row?.name ?? '',
        ...(level === 'item'
            ? {
                  pagu: String(item?.pagu ?? 0),
                  lock_pagu: String(item?.lock_pagu ?? 0),
              }
            : {}),
    };

    const url = row
        ? route(`staf.pok.${level}.update`, row.id)
        : level === 'activity'
          ? route('staf.pok.activity.store')
          : route(`staf.pok.${level}.store`, parentId!);

    const title = row ? `Ubah ${LEVEL_NAME[level]}` : `Tambah ${LEVEL_NAME[level]}${parentLabel ? ` · ${parentLabel}` : ''}`;

    return (
        <RecordForm
            open
            onOpenChange={(o) => !o && onClose()}
            title={title}
            fields={fields}
            initial={initial}
            method={row ? 'put' : 'post'}
            url={url}
        />
    );
}

/** Realisation entered as a dated amount, together never more than the line's pagu. */
function ProgressDialog({ line, year, onClose }: { line: Line; year: number; onClose: () => void }) {
    // Local date (toISOString would give yesterday's date before 07.00 WIB).
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const form = useForm({ date: today.startsWith(String(year)) ? today : `${year}-12-31`, amount: '' });
    const spent = line.pagu - line.available;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('staf.pok.progress.store', line.id), { preserveScroll: true, onSuccess: () => form.reset('amount') });
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl p-6 sm:max-w-[520px] sm:p-7">
                <DialogTitle className="font-display pr-6 text-xl font-bold">Input progres</DialogTitle>
                <DialogDescription className="text-fg-2 text-sm">
                    <span className="font-mono">{line.code}</span> {line.name}
                </DialogDescription>

                <dl className="grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-3 text-center text-xs dark:bg-slate-900">
                    <div>
                        <dt className="text-fg-3">Pagu</dt>
                        <dd className="text-fg-1 text-sm font-bold tabular-nums">{number(line.pagu)}</dd>
                    </div>
                    <div>
                        <dt className="text-fg-3">Sudah direalisasi</dt>
                        <dd className="text-fg-1 text-sm font-bold tabular-nums">{number(spent)}</dd>
                    </div>
                    <div>
                        <dt className="text-fg-3">Bisa diinput</dt>
                        <dd className="text-success text-sm font-bold tabular-nums">{number(line.available)}</dd>
                    </div>
                </dl>

                {line.available > 0 ? (
                    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[150px_1fr_auto] sm:items-start">
                        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                            Tanggal
                            <input
                                type="date"
                                required
                                min={`${year}-01-01`}
                                max={`${year}-12-31`}
                                value={form.data.date}
                                onChange={(e) => form.setData('date', e.target.value)}
                                className={inputClass}
                            />
                            {form.errors.date && <span className="text-danger text-xs font-normal">{form.errors.date}</span>}
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                            Nominal (Rp)
                            <input
                                type="number"
                                required
                                min={1}
                                max={line.available}
                                step={1}
                                inputMode="numeric"
                                placeholder={`maks. ${number(line.available)}`}
                                value={form.data.amount}
                                onChange={(e) => form.setData('amount', e.target.value)}
                                className={inputClass}
                            />
                            {form.errors.amount && <span className="text-danger text-xs font-normal">{form.errors.amount}</span>}
                        </label>
                        <Button type="submit" disabled={form.processing} className="h-[42px] sm:mt-[23px]">
                            Simpan
                        </Button>
                    </form>
                ) : (
                    <p className="bg-success-soft text-success rounded-md px-3.5 py-2.5 text-sm">Realisasi rincian ini sudah mencapai pagu.</p>
                )}

                <div className="flex flex-col gap-1.5">
                    <span className="text-fg-3 text-xs font-semibold tracking-[.06em] uppercase">Riwayat progres</span>
                    {line.progress.length === 0 && <p className="text-fg-3 text-sm">Belum ada progres.</p>}
                    {line.progress.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center gap-3 border-b border-slate-200 py-1.5 text-sm last:border-0 dark:border-slate-700"
                        >
                            <span className="w-24 flex-none">{p.label}</span>
                            <span className="flex-1 text-right font-semibold tabular-nums">{number(p.amount)}</span>
                            <span className="text-fg-3 hidden w-28 truncate text-xs sm:block">{p.by}</span>
                            <IconButton
                                label={`Hapus progres ${p.label}`}
                                danger
                                onClick={() => router.delete(route('staf.pok.progress.destroy', p.id), { preserveScroll: true })}
                            >
                                <Trash2 className="size-4" />
                            </IconButton>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
