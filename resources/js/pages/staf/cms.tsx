import { Badge } from '@/components/staf/master/cells';
import { Alert, Button, Card, CardTitle, IconButton, inputClass } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { router, useForm } from '@inertiajs/react';
import { ExternalLink, Plus, Trash2, Upload } from 'lucide-react';
import { type FormEvent } from 'react';

type ScheduleRow = {
    label: string;
    days: number[];
    open: string | null;
    close: string | null;
    break_minutes: number;
    note: string;
};

interface CmsProps {
    content: { hero_title: string; hero_subtitle: string; schedule: ScheduleRow[] };
    weeklyHours: number;
    news: { id: number; title: string; tag: string; excerpt: string | null; published: boolean; date: string | null }[];
    tags: string[];
    websiteUrl: string;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function minutesBetween(open: string | null, close: string | null): number {
    if (!open || !close) return 0;
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);

    return ch * 60 + cm - (oh * 60 + om);
}

export default function Cms({ content, weeklyHours, news, tags, websiteUrl }: CmsProps) {
    const form = useForm<{ hero_title: string; hero_subtitle: string; schedule: ScheduleRow[] }>(content);
    const post = useForm({ title: '', tag: tags[0], excerpt: '' });
    const liveHours =
        form.data.schedule.reduce((sum, r) => sum + Math.max(0, minutesBetween(r.open, r.close) - r.break_minutes) * r.days.length, 0) / 60;

    const setRow = (i: number, patch: Partial<ScheduleRow>) =>
        form.setData(
            'schedule',
            form.data.schedule.map((r, k) => (k === i ? { ...r, ...patch } : r)),
        );

    const publish = (e: FormEvent) => {
        e.preventDefault();
        form.put(route('staf.cms.content'), { preserveScroll: true });
    };

    const addNews = (e: FormEvent) => {
        e.preventDefault();
        post.post(route('staf.cms.news.store'), { preserveScroll: true, onSuccess: () => post.reset() });
    };

    return (
        <StafLayout title="CMS website" group="Sistem">
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-4">
                    <form onSubmit={publish} className="flex flex-col gap-4">
                        <Card>
                            <CardTitle>Hero beranda</CardTitle>
                            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                                Judul
                                <input
                                    value={form.data.hero_title}
                                    onChange={(e) => form.setData('hero_title', e.target.value)}
                                    className={inputClass}
                                />
                            </label>
                            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                                Subjudul
                                <textarea
                                    value={form.data.hero_subtitle}
                                    onChange={(e) => form.setData('hero_subtitle', e.target.value)}
                                    rows={3}
                                    className={`${inputClass} h-auto py-2.5`}
                                />
                            </label>
                        </Card>

                        <Card>
                            <CardTitle
                                aside={
                                    <span className="text-fg-3 text-xs">
                                        {liveHours.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jam/minggu · IK 3.1
                                    </span>
                                }
                            >
                                Jadwal layanan
                            </CardTitle>
                            {form.data.schedule.map((row, i) => (
                                <div key={i} className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            value={row.label}
                                            onChange={(e) => setRow(i, { label: e.target.value })}
                                            aria-label="Nama hari"
                                            className={`${inputClass} h-9 w-auto min-w-[120px] flex-1 font-semibold`}
                                        />
                                        <div className="flex gap-1">
                                            {DAYS.map((d, day) => {
                                                const on = row.days.includes(day);

                                                return (
                                                    <button
                                                        key={d}
                                                        type="button"
                                                        aria-pressed={on}
                                                        onClick={() =>
                                                            setRow(i, { days: on ? row.days.filter((x) => x !== day) : [...row.days, day].sort() })
                                                        }
                                                        className={`h-8 w-10 cursor-pointer rounded-[8px] text-xs font-semibold ${on ? 'bg-teal-400 text-white' : 'text-fg-3 bg-slate-100 dark:bg-slate-700'}`}
                                                    >
                                                        {d}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {form.data.schedule.length > 1 && (
                                            <IconButton
                                                label="Hapus baris"
                                                danger
                                                onClick={() =>
                                                    form.setData(
                                                        'schedule',
                                                        form.data.schedule.filter((_, k) => k !== i),
                                                    )
                                                }
                                            >
                                                <Trash2 className="size-3.5" />
                                            </IconButton>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto_auto_1fr]">
                                        <label className="text-fg-3 flex items-center gap-2 text-xs">
                                            <input
                                                type="checkbox"
                                                checked={!row.open}
                                                onChange={(e) =>
                                                    setRow(i, e.target.checked ? { open: null, close: null } : { open: '08:00', close: '16:00' })
                                                }
                                                className="size-4 accent-teal-500"
                                            />
                                            Tutup
                                        </label>
                                        {row.open && (
                                            <>
                                                <input
                                                    type="time"
                                                    value={row.open}
                                                    onChange={(e) => setRow(i, { open: e.target.value })}
                                                    aria-label="Jam buka"
                                                    className={`${inputClass} h-9`}
                                                />
                                                <input
                                                    type="time"
                                                    value={row.close ?? ''}
                                                    onChange={(e) => setRow(i, { close: e.target.value })}
                                                    aria-label="Jam tutup"
                                                    className={`${inputClass} h-9`}
                                                />
                                                <label className="text-fg-3 flex items-center gap-2 text-xs">
                                                    Istirahat
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={row.break_minutes}
                                                        onChange={(e) => setRow(i, { break_minutes: Number(e.target.value) })}
                                                        className={`${inputClass} h-9 w-20`}
                                                    />
                                                    menit
                                                </label>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        value={row.note}
                                        onChange={(e) => setRow(i, { note: e.target.value })}
                                        placeholder="Keterangan"
                                        aria-label="Keterangan"
                                        className={`${inputClass} h-9`}
                                    />
                                </div>
                            ))}
                            <Button
                                variant="secondary"
                                className="border-dashed"
                                onClick={() =>
                                    form.setData('schedule', [
                                        ...form.data.schedule,
                                        { label: 'Hari baru', days: [], open: '08:00', close: '12:00', break_minutes: 0, note: '' },
                                    ])
                                }
                            >
                                <Plus />
                                Tambah baris jadwal
                            </Button>
                            {Object.values(form.errors)[0] && <Alert>{Object.values(form.errors)[0]}</Alert>}
                        </Card>

                        <Button type="submit" size="lg" className="self-start" disabled={form.processing}>
                            <Upload />
                            Terbitkan perubahan
                        </Button>
                    </form>

                    <Card>
                        <CardTitle>Berita & pengumuman</CardTitle>
                        <form onSubmit={addNews} className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                            <div className="flex gap-2">
                                <input
                                    value={post.data.title}
                                    onChange={(e) => post.setData('title', e.target.value)}
                                    placeholder="Judul berita baru"
                                    aria-label="Judul berita"
                                    required
                                    className={inputClass}
                                />
                                <select
                                    value={post.data.tag}
                                    onChange={(e) => post.setData('tag', e.target.value)}
                                    aria-label="Label"
                                    className={`${inputClass} w-auto`}
                                >
                                    {tags.map((t) => (
                                        <option key={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <input
                                value={post.data.excerpt}
                                onChange={(e) => post.setData('excerpt', e.target.value)}
                                placeholder="Ringkasan singkat"
                                aria-label="Ringkasan"
                                className={inputClass}
                            />
                            <Button type="submit" size="sm" className="self-end" disabled={post.processing}>
                                <Plus />
                                Tambah sebagai draf
                            </Button>
                        </form>
                        {news.map((n) => (
                            <div
                                key={n.id}
                                className="flex items-center gap-3 border-b border-slate-200 pb-2.5 text-sm last:border-0 dark:border-slate-700"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-semibold">{n.title}</div>
                                    <div className="text-fg-3 text-xs">
                                        {n.tag} · {n.date ?? 'Draf'}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.patch(route('staf.cms.news.update', n.id), { published: !n.published }, { preserveScroll: true })
                                    }
                                    className="cursor-pointer"
                                    title={n.published ? 'Tarik ke draf' : 'Terbitkan'}
                                >
                                    <Badge tone={n.published ? 'success' : 'slate'}>{n.published ? 'Terbit' : 'Draf'}</Badge>
                                </button>
                                <IconButton
                                    label={`Hapus ${n.title}`}
                                    danger
                                    onClick={() => router.delete(route('staf.cms.news.destroy', n.id), { preserveScroll: true })}
                                >
                                    <Trash2 className="size-3.5" />
                                </IconButton>
                            </div>
                        ))}
                    </Card>
                </div>

                <Card className="xl:sticky xl:top-20">
                    <CardTitle
                        aside={
                            <a
                                href={websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-xs font-semibold text-teal-600"
                            >
                                Buka website
                                <ExternalLink className="size-3.5" />
                            </a>
                        }
                    >
                        Pratinjau langsung
                    </CardTitle>
                    <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
                        <div className="text-fg-3 bg-slate-100 px-3 py-1.5 font-mono text-[11px] dark:bg-slate-900">perpustakaan.stpn.ac.id</div>
                        <div className="flex flex-col gap-3 p-5">
                            <h2 className="text-xl leading-tight font-extrabold">{form.data.hero_title}</h2>
                            <p className="text-fg-2 text-sm">{form.data.hero_subtitle}</p>
                            <div className="rounded-md bg-teal-50 p-3 dark:bg-teal-900">
                                <div className="mb-1.5 text-xs font-semibold text-teal-700 dark:text-teal-100">Jam buka</div>
                                {form.data.schedule.map((r, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span>{r.label}</span>
                                        <span className="font-mono">
                                            {r.open ? `${r.open.replace(':', '.')} – ${r.close?.replace(':', '.')}` : 'Tutup'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="mb-1 text-xs font-semibold">Berita terbit</div>
                                {news
                                    .filter((n) => n.published)
                                    .map((n) => (
                                        <div key={n.id} className="text-fg-2 truncate text-xs">
                                            · {n.title}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <p className="text-fg-3 text-xs">Jam layanan yang sudah terbit: {weeklyHours.toLocaleString('id-ID')} jam/minggu.</p>
                </Card>
            </div>
        </StafLayout>
    );
}
