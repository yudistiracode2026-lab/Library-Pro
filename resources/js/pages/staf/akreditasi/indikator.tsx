import { EVIDENCE_TONE, formatSize, LetterBadge, UploadButton } from '@/components/staf/akreditasi';
import { Badge } from '@/components/staf/master/cells';
import { Alert, Button, inputClass, PillTabs } from '@/components/staf/ui';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import StafLayout from '@/layouts/staf-layout';
import { router, useForm } from '@inertiajs/react';
import { Check, ExternalLink, Lightbulb } from 'lucide-react';
import { type FormEvent } from 'react';

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

    return (
        <StafLayout title="Akreditasi · indikator kunci" group="Akreditasi">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <PillTabs
                    tabs={[{ number: 0, name: 'Semua' }, ...components].map((c) => ({
                        label: c.number ? `${c.number}. ${c.name}` : c.name,
                        href: route('staf.akreditasi.indikator', {
                            ...(c.number ? { komponen: c.number } : {}),
                            ...(filters.mode ? { mode: filters.mode } : {}),
                        }),
                        active: (filters.komponen ?? 0) === c.number,
                    }))}
                />
                <select
                    value={filters.mode}
                    onChange={(e) => go({ mode: e.target.value, ik: undefined })}
                    aria-label="Mode"
                    className={`${inputClass} w-auto`}
                >
                    <option value="">Semua mode</option>
                    {Object.entries(MODE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <table className="w-full min-w-[860px] text-sm">
                    <thead className="text-fg-3 border-b border-slate-200 bg-slate-50 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900">
                        <tr>
                            {['IK', 'Indikator', 'Mode', 'Nilai terukur', 'Opsi', 'Bukti'].map((h) => (
                                <th key={h} className="px-5 py-3 font-semibold">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr
                                key={r.number}
                                onClick={() => go({ ik: r.number })}
                                className={`cursor-pointer border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900 ${selected?.number === r.number ? 'bg-teal-50 dark:bg-teal-900' : ''}`}
                            >
                                <td className="px-5 py-3 font-mono font-semibold">{r.number}</td>
                                <td className="px-5 py-3">
                                    <div className="font-semibold">{r.name}</div>
                                    <div className="text-fg-3 text-xs">Sumber: {r.source}</div>
                                </td>
                                <td className="px-5 py-3">
                                    <Badge tone={r.computed ? 'teal' : r.mode === 'Manual' ? 'warning' : 'slate'}>
                                        {r.computed ? 'Dari data' : MODE_LABEL[r.mode]}
                                    </Badge>
                                </td>
                                <td className="text-fg-2 max-w-[260px] px-5 py-3">{r.value ?? <span className="text-fg-4">Belum dinilai</span>}</td>
                                <td className="px-5 py-3">
                                    <LetterBadge letter={r.letter} />
                                </td>
                                <td className="px-5 py-3 font-mono text-xs">
                                    {r.evidenceDone}/{r.evidenceTotal}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && <p className="text-fg-3 py-10 text-center text-sm">Tidak ada indikator yang cocok.</p>}
            </div>

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
        <div className="flex flex-col gap-5 p-6">
            <div>
                <span className="text-fg-3 text-xs">
                    Komponen {ik.component} · {ik.componentName}
                </span>
                <SheetTitle className="font-display mt-1 text-xl font-bold">
                    IK {ik.number} · {ik.name}
                </SheetTitle>
                <SheetDescription className="sr-only">Detail penilaian dan bukti indikator.</SheetDescription>
            </div>

            <div className="flex items-center gap-4 rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                <LetterBadge letter={ik.letter} large />
                <div className="min-w-0 flex-1">
                    <div className="font-semibold">{ik.value ?? 'Belum dinilai'}</div>
                    <div className="text-fg-3 text-xs">
                        {ik.computed ? 'Dihitung otomatis dari data' : `Mode ${MODE_LABEL[ik.mode].toLowerCase()}`} · sumber: {ik.source}
                    </div>
                </div>
                {ik.gain !== null && (
                    <span className="text-success text-right text-xs font-semibold">
                        +{ik.gain.toLocaleString('id-ID', { minimumFractionDigits: 2 })} NA
                        <br />
                        <span className="text-fg-3 font-normal">jika naik 1 opsi</span>
                    </span>
                )}
            </div>

            {ik.recommendation && (
                <div className="flex gap-2.5 rounded-md bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-900 dark:text-teal-100">
                    <Lightbulb className="mt-0.5 size-4 flex-none" />
                    {ik.recommendation}
                </div>
            )}

            <section className="flex flex-col gap-2">
                <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">Opsi penilaian</span>
                {ik.options.map((text, i) => {
                    const on = ik.letter === LETTERS[i];

                    return (
                        <div
                            key={text}
                            className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${on ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                            <LetterBadge letter={LETTERS[i]} />
                            <span className="flex-1">{text}</span>
                            <span className="text-fg-3 text-xs">skor {4 - i}</span>
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
                    <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">Checklist bukti fisik</span>
                    <span className="text-fg-3 text-xs">
                        {done} dari {ik.evidence.length} tersahkan
                    </span>
                </div>
                {ik.evidence.map((e) => (
                    <div
                        key={e.id}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700"
                    >
                        <span
                            className={`grid size-5 flex-none place-items-center rounded-[5px] ${e.status === 'Disahkan' ? 'bg-success text-white' : 'border-[1.5px] border-slate-300'}`}
                        >
                            {e.status === 'Disahkan' && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
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
