import { EVIDENCE_TONE, formatSize, LetterBadge, UploadButton } from '@/components/staf/akreditasi';
import { Badge } from '@/components/staf/master/cells';
import { Alert, Button, inputClass } from '@/components/staf/ui';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import StafLayout from '@/layouts/staf-layout';
import { Link, router, useForm } from '@inertiajs/react';
import { CalendarX, CircleAlert, CircleCheck, CircleDashed, ExternalLink, FileClock, Lightbulb, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Row {
    number: string;
    component: number;
    name: string;
    mode: string;
    computed: boolean;
    value: string | null;
    score: number | null;
    letter: string | null;
    source: string | null;
    evidenceDone?: number;
    evidenceTotal?: number;
}

interface EvidenceItem {
    id: number;
    label: string;
    status: string;
    file: string | null;
    fileName: string | null;
    size: number | null;
    uploadedAt: string | null;
    approvedAt: string | null;
    validUntil: string | null;
}

interface Detail extends Row {
    id: number;
    componentName: string;
    options: string[];
    recommendation: string | null;
    manualNote: string | null;
    manualValue: string | null;
    assessedAt: string | null;
    gain: number | null;
    picId: number | null;
    dueDate: string | null;
    evidence: EvidenceItem[];
    accept: string;
}

interface IndikatorProps {
    components: { number: number; name: string }[];
    filters: { komponen: number | null; mode: string };
    rows: Row[];
    selected: Detail | null;
    staff: { id: number; name: string }[];
    canApprove: boolean;
}

const LETTERS = ['a', 'b', 'c', 'd'];

const MODE_LABEL: Record<string, string> = { Otomatis: 'Otomatis', Semi: 'Semi-otomatis', Manual: 'Manual' };

const MODE_TONE: Record<string, string> = {
    Otomatis: 'bg-teal-50 text-teal-700',
    Semi: 'bg-warning-soft text-amber-800',
    Manual: 'text-fg-2 bg-slate-100 dark:bg-slate-700',
};

const COLS = 'grid-cols-[52px_minmax(0,1.5fr)_100px_minmax(0,1.2fr)_64px_90px]';

export default function Indikator({ components, filters, rows, selected, staff, canApprove }: IndikatorProps) {
    const base = { ...(filters.komponen ? { komponen: filters.komponen } : {}), ...(filters.mode ? { mode: filters.mode } : {}) };
    const go = (params: Record<string, string | number | undefined>) =>
        router.get(
            route('staf.akreditasi.indikator'),
            Object.fromEntries(Object.entries({ ...base, ...params }).filter(([, v]) => v !== undefined && v !== '')),
            {
                preserveScroll: true,
                preserveState: true,
            },
        );

    const [q, setQ] = useState('');
    const needle = q.trim().toLowerCase();
    const shown = rows.filter((r) => !needle || `${r.number} ${r.name}`.toLowerCase().includes(needle));

    return (
        <StafLayout title="Akreditasi · indikator kunci" group="Akreditasi">
            <div className="flex flex-wrap items-center gap-3">
                <label className="text-fg-3 flex h-[42px] flex-[1_1_260px] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 dark:bg-slate-800">
                    <Search className="size-4 flex-none" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cari nomor atau nama indikator"
                        aria-label="Cari indikator"
                        className="text-fg-1 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                </label>
                <select
                    value={filters.mode}
                    onChange={(e) => go({ mode: e.target.value, ik: undefined })}
                    aria-label="Mode"
                    className="text-fg-1 h-[42px] rounded-md border border-slate-200 bg-white px-3 text-sm dark:bg-slate-800"
                >
                    <option value="">Semua mode</option>
                    {Object.entries(MODE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {[{ number: 0, name: 'Semua' }, ...components].map((c) => {
                    const on = (filters.komponen ?? 0) === c.number;

                    return (
                        <Link
                            key={c.number}
                            href={route('staf.akreditasi.indikator', {
                                ...(c.number ? { komponen: c.number } : {}),
                                ...(filters.mode ? { mode: filters.mode } : {}),
                            })}
                            preserveScroll
                            className={`flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap ${on ? 'border-teal-400 bg-teal-400 text-white' : 'text-fg-2 border-slate-200 bg-white dark:bg-slate-800'}`}
                        >
                            {c.number ? `${c.number}. ${c.name}` : c.name}
                        </Link>
                    );
                })}
            </div>

            <section className="overflow-auto rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div
                    className={`text-fg-3 grid min-w-[760px] ${COLS} gap-3.5 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900`}
                >
                    <span>IK</span>
                    <span>Indikator</span>
                    <span>Mode</span>
                    <span>Nilai terukur</span>
                    <span>Opsi</span>
                    <span>Bukti</span>
                </div>
                {shown.map((r) => {
                    const complete = r.evidenceDone === r.evidenceTotal;

                    return (
                        <button
                            key={r.number}
                            type="button"
                            onClick={() => go({ ik: r.number })}
                            className={`text-fg-1 grid w-full min-w-[760px] cursor-pointer ${COLS} items-center gap-3.5 border-b border-slate-200 px-5 py-3 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900 ${selected?.number === r.number ? 'bg-teal-50 dark:bg-teal-900' : 'bg-white dark:bg-slate-800'}`}
                        >
                            <span className="font-mono font-semibold">{r.number}</span>
                            <div className="min-w-0">
                                <div className="font-semibold">{r.name}</div>
                                <div className="text-fg-3 text-xs">Sumber: {r.source}</div>
                            </div>
                            <span className={`justify-self-start rounded-full px-2.5 py-[3px] text-xs font-semibold ${MODE_TONE[r.mode]}`}>
                                {MODE_LABEL[r.mode]}
                            </span>
                            <span className="text-fg-2 text-[13px]">{r.value ?? <span className="text-fg-4">Belum dinilai</span>}</span>
                            <LetterBadge letter={r.letter} />
                            <span className={`flex items-center gap-1 text-xs font-semibold ${complete ? 'text-success' : 'text-amber-800'}`}>
                                {complete ? <CircleCheck className="size-3.5" /> : <CircleAlert className="size-3.5" />}
                                {r.evidenceDone}/{r.evidenceTotal} sah
                            </span>
                        </button>
                    );
                })}
                {shown.length === 0 && <div className="text-fg-3 p-10 text-center">Tidak ada indikator yang cocok.</div>}
            </section>

            <Sheet open={selected !== null} onOpenChange={(open) => !open && go({ ik: undefined })}>
                <SheetContent side="right" className="w-full overflow-y-auto bg-white p-0 sm:max-w-xl dark:bg-slate-800">
                    {selected && <IndicatorDetail key={selected.number} ik={selected} staff={staff} canApprove={canApprove} />}
                </SheetContent>
            </Sheet>
        </StafLayout>
    );
}

function IndicatorDetail({ ik, staff, canApprove }: { ik: Detail; staff: IndikatorProps['staff']; canApprove: boolean }) {
    const assess = useForm({ manual_score: ik.computed ? null : ik.score, manual_value: ik.manualValue ?? '', manual_note: ik.manualNote ?? '' });
    const assign = (data: Record<string, string | null>) =>
        router.patch(route('staf.akreditasi.indikator.update', ik.id), data, { preserveScroll: true, preserveState: true });
    const done = ik.evidence.filter((e) => e.status === 'Disahkan').length;

    const save = (e: FormEvent) => {
        e.preventDefault();
        assess.patch(route('staf.akreditasi.indikator.update', ik.id), { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="flex flex-col gap-[18px] p-7">
            <div>
                <span className="text-fg-3 text-xs">
                    Komponen {ik.component} · {ik.componentName}
                </span>
                <SheetTitle className="font-display mt-1 text-[22px] leading-tight font-bold">
                    IK {ik.number} · {ik.name}
                </SheetTitle>
                <SheetDescription className="sr-only">Detail penilaian dan bukti indikator.</SheetDescription>
            </div>

            <div className="flex items-center gap-3.5 rounded-[14px] bg-slate-50 p-4 dark:bg-slate-900">
                <LetterBadge letter={ik.letter} large />
                <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold">{ik.value ?? 'Belum dinilai'}</div>
                    <div className="text-fg-3 text-xs">
                        {ik.computed ? 'Dihitung otomatis dari data' : `Mode ${MODE_LABEL[ik.mode].toLowerCase()}`} · sumber: {ik.source}
                    </div>
                </div>
                <span className="flex-none text-xs font-semibold text-teal-700 dark:text-teal-200">
                    {ik.gain !== null
                        ? `+${ik.gain.toLocaleString('id-ID', { minimumFractionDigits: 2 })} NA jika naik satu opsi`
                        : 'Sudah opsi tertinggi'}
                </span>
            </div>

            {ik.recommendation && (
                <div className="flex gap-2.5 rounded-md bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-900 dark:text-teal-100">
                    <Lightbulb className="mt-0.5 size-4 flex-none" />
                    {ik.recommendation}
                </div>
            )}

            <section className="flex flex-col gap-2">
                <span className="text-fg-2 text-[13px] font-semibold">Opsi penilaian</span>
                {ik.options.map((text, i) => {
                    const on = ik.letter === LETTERS[i];

                    return (
                        <div
                            key={text}
                            className={`flex items-center gap-3 rounded-md border-[1.5px] px-3 py-2.5 text-sm ${on ? 'border-teal-400 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}
                        >
                            <span
                                className={`font-display grid size-7 flex-none place-items-center rounded-[8px] text-[13px] font-extrabold ${on ? 'bg-teal-400 text-white' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                            >
                                {LETTERS[i]}
                            </span>
                            <span className="flex-1">{text}</span>
                            <span className="text-fg-3 font-mono text-xs">skor {4 - i}</span>
                        </div>
                    );
                })}
                {ik.computed && (
                    <p className="text-fg-3 text-xs">
                        Opsi dipilih otomatis dari data. Nilai di antara dua opsi dibulatkan ke opsi yang lebih rendah.
                    </p>
                )}
            </section>

            {!ik.computed && (
                <form onSubmit={save} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-700">
                    <span className="text-sm font-semibold">Penilaian {ik.mode === 'Manual' ? 'manual' : 'petugas'}</span>
                    <div className="flex gap-1.5">
                        {LETTERS.map((l, i) => (
                            <button
                                key={l}
                                type="button"
                                aria-pressed={assess.data.manual_score === 4 - i}
                                onClick={() => assess.setData('manual_score', 4 - i)}
                                className={`size-10 cursor-pointer rounded-[10px] border text-sm font-extrabold uppercase ${assess.data.manual_score === 4 - i ? 'border-teal-400 bg-teal-400 text-white' : 'text-fg-2 border-slate-200'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    <input
                        value={assess.data.manual_value}
                        onChange={(e) => assess.setData('manual_value', e.target.value)}
                        placeholder="Nilai terukur, mis. 6 komponen, ditinjau Mar 2024"
                        aria-label="Nilai terukur"
                        className={inputClass}
                    />
                    <textarea
                        value={assess.data.manual_note}
                        onChange={(e) => assess.setData('manual_note', e.target.value)}
                        rows={2}
                        placeholder="Catatan alasan pemilihan opsi (wajib)"
                        aria-label="Catatan alasan"
                        className={`${inputClass} h-auto py-2.5`}
                    />
                    {Object.values(assess.errors)[0] && <Alert>{Object.values(assess.errors)[0]}</Alert>}
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-fg-3 text-xs">{ik.assessedAt && `Terakhir dinilai ${ik.assessedAt}`}</span>
                        <Button type="submit" size="sm" disabled={assess.processing || !assess.data.manual_score}>
                            Simpan penilaian
                        </Button>
                    </div>
                </form>
            )}

            <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-fg-2 text-[13px] font-semibold">Checklist bukti fisik</span>
                    <span className="text-fg-3 text-xs">
                        {done} dari {ik.evidence.length} tersahkan
                    </span>
                </div>
                {ik.evidence.map((e) => (
                    <div
                        key={e.id}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700"
                    >
                        <EvidenceIcon status={e.status} />
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold">{e.label}</div>
                            <div className="text-fg-3 truncate text-xs">
                                {e.file ? `${e.fileName} · ${formatSize(e.size)} · ${e.uploadedAt}` : 'Belum ada berkas'}
                                {e.validUntil && ` · berlaku s.d. ${e.validUntil}`}
                            </div>
                        </div>
                        <Badge tone={EVIDENCE_TONE[e.status]}>{e.status}</Badge>
                        <div className="flex gap-1.5">
                            {e.file && (
                                <a
                                    href={e.file}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Buka ${e.label}`}
                                    className="text-fg-2 grid size-[30px] place-items-center rounded-[8px] hover:bg-teal-50 hover:text-teal-700"
                                >
                                    <ExternalLink className="size-3.5" />
                                </a>
                            )}
                            <UploadButton evidenceId={e.id} accept={ik.accept}>
                                {e.file ? 'Ganti' : 'Unggah'}
                            </UploadButton>
                            {canApprove && e.file && e.status !== 'Disahkan' && (
                                <Button
                                    size="sm"
                                    className="h-[30px]"
                                    onClick={() =>
                                        router.post(route('staf.akreditasi.bukti.approve', e.id), {}, { preserveScroll: true, preserveState: true })
                                    }
                                >
                                    Sahkan
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                {!canApprove && <p className="text-fg-3 text-xs">Pengesahan bukti dilakukan oleh kepala perpustakaan.</p>}
            </section>

            <section className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                    Penanggung jawab
                    <select value={ik.picId ?? ''} onChange={(e) => assign({ pic_employee_id: e.target.value || null })} className={inputClass}>
                        <option value="">—</option>
                        {staff.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                    Tenggat
                    <input
                        type="date"
                        value={ik.dueDate ?? ''}
                        onChange={(e) => assign({ due_date: e.target.value || null })}
                        className={inputClass}
                    />
                </label>
            </section>
        </div>
    );
}

function EvidenceIcon({ status }: { status: string }) {
    const [Icon, tone] =
        {
            Disahkan: [CircleCheck, 'text-success'],
            Draf: [FileClock, 'text-amber-800'],
            Kedaluwarsa: [CalendarX, 'text-danger'],
        }[status] ?? ([CircleDashed, 'text-fg-3'] as const);

    return <Icon className={`size-[18px] flex-none ${tone}`} />;
}
