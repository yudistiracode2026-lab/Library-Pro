import { RecordForm } from '@/components/staf/master/record-form';
import { Button, inputClass } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    Camera as CameraIcon,
    CircleDot,
    ExternalLink,
    Info,
    RefreshCw,
    Settings2,
    Siren,
    Square,
    Unplug,
    Users,
    VideoOff,
} from 'lucide-react';
import { type ComponentType, type FormEvent, useEffect, useState } from 'react';

interface Camera {
    id: number;
    code: string;
    name: string;
    floor: number;
    area: string;
    stream_url: string | null;
    online: boolean;
    recording: boolean;
}

interface CctvProps {
    area: string;
    areas: string[];
    summary: { total: number; online: number; recording: number };
    cameras: Camera[];
    selected: string | null;
    events: { id: number; time: string; camera: string; where: string; kind: string; description: string }[];
    kinds: string[];
    canConfigure: boolean;
    cameraAreas: string[];
}

const KINDS: Record<string, [ComponentType<{ className?: string }>, string]> = {
    Antrean: [Users, 'bg-warning-soft text-amber-800'],
    Alarm: [Siren, 'bg-danger-soft text-danger'],
    Gerakan: [Activity, 'bg-teal-50 text-teal-700'],
    Offline: [VideoOff, 'text-fg-2 bg-slate-100 dark:bg-slate-700'],
    Info: [Info, 'text-fg-2 bg-slate-100 dark:bg-slate-700'],
    Snapshot: [CameraIcon, 'bg-teal-50 text-teal-700'],
};

const control = 'flex h-[38px] cursor-pointer items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold whitespace-nowrap';
const secondary = 'text-fg-1 border border-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800';

function useClock(): string {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Cctv({ area, areas, summary, cameras, selected, events, kinds, canConfigure, cameraAreas }: CctvProps) {
    const clock = useClock();
    const [configuring, setConfiguring] = useState(false);
    const cam = cameras.find((c) => c.code === selected) ?? cameras[0];
    const go = (params: Record<string, string>) =>
        router.get(route('staf.cctv'), { ...(area !== 'Semua' ? { area } : {}), ...params }, { preserveScroll: true, preserveState: true });
    const post = (name: string) => cam && router.post(route(name, cam.id), {}, { preserveScroll: true, preserveState: true });

    return (
        <StafLayout title="Pantau CCTV · sirkulasi & referensi" group="Layanan">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {['Semua', ...areas].map((a) => (
                        <Link
                            key={a}
                            href={route('staf.cctv', a === 'Semua' ? {} : { area: a })}
                            preserveScroll
                            className={`flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap ${area === a ? 'border-teal-400 bg-teal-400 text-white' : 'text-fg-2 border-slate-200 bg-white dark:bg-slate-800'}`}
                        >
                            {a === 'Semua' ? 'Semua kamera' : `Ruang ${a.toLowerCase()}`}
                        </Link>
                    ))}
                </div>
                <span className="text-fg-3 flex items-center gap-2 text-[13px]">
                    <span className="bg-success size-2 rounded-full" />
                    {summary.total} kamera · {summary.online} online · {summary.recording} merekam
                </span>
            </div>

            <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 flex-[62_1_460px] flex-col gap-4">
                    {cam && (
                        <section className="flex flex-col gap-3.5 rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800">
                            <Feed camera={cam} clock={clock} large />
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    disabled={!cam.online}
                                    onClick={() => post('staf.cctv.recording')}
                                    className={`${control} border-0 text-white disabled:opacity-50 ${cam.recording ? 'bg-danger' : 'bg-teal-400 hover:bg-teal-500'}`}
                                >
                                    {cam.recording ? <Square className="size-4" /> : <CircleDot className="size-4" />}
                                    {cam.recording ? 'Hentikan rekam' : 'Mulai rekam'}
                                </button>
                                {cam.online ? (
                                    <button type="button" onClick={() => post('staf.cctv.online')} className={`${control} ${secondary}`}>
                                        <Unplug className="size-4" />
                                        Tandai offline
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => post('staf.cctv.online')}
                                        className={`${control} border-0 bg-teal-400 text-white hover:bg-teal-500`}
                                    >
                                        <RefreshCw className="size-4" />
                                        Sambungkan ulang
                                    </button>
                                )}
                                {cam.stream_url && (
                                    <a href={cam.stream_url} target="_blank" rel="noreferrer" className={`${control} ${secondary}`}>
                                        <ExternalLink className="size-4" />
                                        Buka stream
                                    </a>
                                )}
                                {canConfigure && (
                                    <button type="button" onClick={() => setConfiguring(true)} className={`${control} ${secondary}`}>
                                        <Settings2 className="size-4" />
                                        Atur
                                    </button>
                                )}
                            </div>
                        </section>
                    )}

                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-3">
                        {cameras.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => go({ kamera: c.code })}
                                className={`cursor-pointer rounded-[15px] border-[3px] p-0 text-left ${c.code === cam?.code ? 'border-teal-400' : 'border-transparent'}`}
                            >
                                <Feed camera={c} clock={clock} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex min-w-0 flex-[38_1_300px] flex-col gap-4">
                    <section className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                            <span className="font-display text-[17px] font-bold">Log kejadian hari ini</span>
                            <span className="text-fg-3 text-xs">{events.length} catatan</span>
                        </div>
                        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                            <EventForm cameras={cameras} kinds={kinds} defaultCamera={cam?.id} />
                        </div>
                        {events.map((e) => {
                            const [Icon, tone] = KINDS[e.kind] ?? KINDS.Info;

                            return (
                                <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => go({ kamera: e.camera })}
                                    className="flex w-full cursor-pointer items-start gap-3 border-b border-slate-200 bg-white px-5 py-3 text-left last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-900"
                                >
                                    <span className={`grid size-[30px] flex-none place-items-center rounded-full ${tone}`}>
                                        <Icon className="size-3.5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm leading-[1.4]">{e.description}</div>
                                        <div className="text-fg-3 text-xs">
                                            <span className="font-mono">{e.time}</span> · {e.camera} · {e.where}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        {events.length === 0 && <p className="text-fg-3 px-5 py-6 text-center text-sm">Belum ada kejadian hari ini.</p>}
                    </section>
                    <section className="text-fg-2 flex flex-col gap-2 rounded-lg bg-white px-5 py-4 text-[13px] leading-[1.55] shadow-sm dark:bg-slate-800">
                        <span className="text-fg-1 font-semibold">Penyimpanan rekaman</span>
                        <span>
                            Rekaman disimpan 30 hari di NVR Ruang TI &amp; pengelolaan (lantai 2). Snapshot dan potongan rekaman bisa dipakai sebagai
                            bukti IK 2.9 (sarana keamanan) di modul akreditasi.
                        </span>
                    </section>
                </div>
            </div>

            {configuring && cam && (
                <RecordForm
                    key={cam.id}
                    open
                    onOpenChange={(open) => !open && setConfiguring(false)}
                    title={`Atur ${cam.code}`}
                    method="put"
                    url={route('staf.cctv.update', cam.id)}
                    initial={{ name: cam.name, floor: String(cam.floor), area: cam.area, stream_url: cam.stream_url ?? '' }}
                    fields={[
                        { name: 'name', label: 'Lokasi', span: 2, required: true },
                        { name: 'floor', label: 'Lantai', type: 'number', required: true },
                        { name: 'area', label: 'Area', type: 'select', options: cameraAreas.map((a) => ({ value: a, label: a })), required: true },
                        {
                            name: 'stream_url',
                            label: 'URL stream atau snapshot',
                            span: 2,
                            placeholder: 'http://192.168.1.20/cgi-bin/mjpg/video.cgi',
                            hint: 'Alamat MJPEG atau gambar snapshot dari NVR/kamera. Kosongkan kalau belum ada.',
                        },
                    ]}
                />
            )}
        </StafLayout>
    );
}

function Feed({ camera, clock, large }: { camera: Camera; clock: string; large?: boolean }) {
    return (
        <div className={`relative aspect-video overflow-hidden bg-slate-900 ${large ? 'rounded-[14px]' : 'rounded-[12px]'}`}>
            {camera.online && camera.stream_url && (
                <img src={camera.stream_url} alt={`Tayangan ${camera.name}`} className="absolute inset-0 size-full object-cover" />
            )}
            <div
                className={`pointer-events-none absolute inset-0 flex flex-col justify-between ${large ? 'p-3.5' : 'p-2.5'}`}
                style={{
                    background: 'linear-gradient(180deg, rgba(15,14,10,.55) 0%, rgba(15,14,10,0) 30%, rgba(15,14,10,0) 65%, rgba(15,14,10,.65) 100%)',
                }}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[.06em] text-white">
                        <span className={`size-2 rounded-full ${camera.online ? 'bg-danger' : 'bg-slate-400'}`} />
                        {camera.online ? 'LIVE' : 'OFFLINE'} · {camera.code}
                    </span>
                    <span className="font-mono text-[11px] text-white">{clock}</span>
                </div>
                {!camera.online && (
                    <div className="flex flex-col items-center gap-1.5 self-center text-[13px] font-semibold text-white">
                        <VideoOff className={large ? 'size-8' : 'size-[22px]'} />
                        Kamera offline
                    </div>
                )}
                {camera.online && !camera.stream_url && large && (
                    <div className="flex max-w-xs flex-col items-center gap-1.5 self-center text-center text-xs text-slate-300">
                        <VideoOff className="size-8" />
                        Belum ada sumber video. Isi URL stream dari NVR lewat tombol Atur.
                    </div>
                )}
                <div className="flex items-end justify-between gap-2">
                    <span className={`leading-tight font-bold text-white ${large ? 'text-[15px]' : 'text-xs'}`}>
                        {camera.name}
                        <span className="block text-[11px] font-medium text-slate-200">
                            Lantai {camera.floor} · ruang {camera.area.toLowerCase()}
                        </span>
                    </span>
                    {camera.online && camera.recording && (
                        <span className="bg-danger flex-none rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold text-white">REC</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function EventForm({ cameras, kinds, defaultCamera }: { cameras: Camera[]; kinds: string[]; defaultCamera?: number }) {
    const form = useForm({ camera_id: String(defaultCamera ?? cameras[0]?.id ?? ''), kind: kinds[0], description: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('staf.cctv.event'), { preserveScroll: true, onSuccess: () => form.reset('description') });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
                <select
                    value={form.data.camera_id}
                    onChange={(e) => form.setData('camera_id', e.target.value)}
                    aria-label="Kamera"
                    className={inputClass}
                >
                    {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.code}
                        </option>
                    ))}
                </select>
                <select
                    value={form.data.kind}
                    onChange={(e) => form.setData('kind', e.target.value)}
                    aria-label="Jenis kejadian"
                    className={inputClass}
                >
                    {kinds.map((k) => (
                        <option key={k}>{k}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2">
                <input
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    placeholder="Catat kejadian, mis. antrean panjang di loket"
                    aria-label="Keterangan kejadian"
                    required
                    className={inputClass}
                />
                <Button type="submit" className="h-[42px]" disabled={form.processing}>
                    Catat
                </Button>
            </div>
        </form>
    );
}
