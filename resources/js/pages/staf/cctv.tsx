import { Badge, type Tone } from '@/components/staf/master/cells';
import { RecordForm } from '@/components/staf/master/record-form';
import { Button, Card, CardTitle, inputClass, PillTabs } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { router, useForm } from '@inertiajs/react';
import { Circle, ExternalLink, RefreshCw, Settings2, Square, Unplug, VideoOff } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

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

const KIND_TONE: Record<string, Tone> = { Info: 'slate', Antrean: 'warning', Gerakan: 'teal', Alarm: 'danger', Offline: 'danger' };

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
                <PillTabs
                    tabs={['Semua', ...areas].map((a) => ({
                        label: a,
                        href: route('staf.cctv', a === 'Semua' ? {} : { area: a }),
                        active: area === a,
                    }))}
                />
                <span className="text-fg-3 text-sm">
                    {summary.total} kamera · {summary.online} online · {summary.recording} merekam
                </span>
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-4">
                    {cam && (
                        <Card className="gap-3 p-3 md:p-3">
                            <Feed camera={cam} clock={clock} large />
                            <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
                                <div className="mr-auto min-w-0">
                                    <div className="truncate font-semibold">{cam.name}</div>
                                    <div className="text-fg-3 text-xs">
                                        {cam.code} · Lantai {cam.floor} · {cam.area}
                                    </div>
                                </div>
                                <Button
                                    variant={cam.recording ? 'danger' : 'primary'}
                                    size="sm"
                                    disabled={!cam.online}
                                    onClick={() => post('staf.cctv.recording')}
                                >
                                    {cam.recording ? <Square /> : <Circle />}
                                    {cam.recording ? 'Hentikan rekam' : 'Mulai rekam'}
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => post('staf.cctv.online')}>
                                    {cam.online ? <Unplug /> : <RefreshCw />}
                                    {cam.online ? 'Tandai offline' : 'Sambungkan ulang'}
                                </Button>
                                {cam.stream_url && (
                                    <a
                                        href={cam.stream_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-fg-1 inline-flex h-[34px] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-semibold hover:bg-slate-100 dark:bg-slate-800"
                                    >
                                        <ExternalLink className="size-4" />
                                        Buka stream
                                    </a>
                                )}
                                {canConfigure && (
                                    <Button variant="ghost" size="sm" onClick={() => setConfiguring(true)}>
                                        <Settings2 />
                                        Atur
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {cameras.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => go({ kamera: c.code })}
                                className={`flex cursor-pointer flex-col gap-1.5 rounded-lg bg-white p-2 text-left shadow-sm dark:bg-slate-800 ${c.code === cam?.code ? 'ring-2 ring-teal-400' : 'hover:shadow-md'}`}
                            >
                                <Feed camera={c} clock={clock} />
                                <span className="truncate px-1 text-xs font-semibold">{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Card>
                        <CardTitle aside={<span className="text-fg-3 text-xs">{events.length} catatan</span>}>Log kejadian hari ini</CardTitle>
                        <EventForm cameras={cameras} kinds={kinds} defaultCamera={cam?.id} />
                        <div className="flex max-h-[420px] flex-col overflow-auto">
                            {events.map((e) => (
                                <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => go({ kamera: e.camera })}
                                    className="flex cursor-pointer gap-3 border-b border-slate-200 py-2.5 text-left text-sm last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                                >
                                    <span className="text-fg-3 w-11 flex-none font-mono text-xs">{e.time}</span>
                                    <div className="min-w-0 flex-1">
                                        <div>{e.description}</div>
                                        <div className="text-fg-3 truncate text-xs">
                                            {e.camera} · {e.where}
                                        </div>
                                    </div>
                                    <Badge tone={KIND_TONE[e.kind] ?? 'slate'}>{e.kind}</Badge>
                                </button>
                            ))}
                            {events.length === 0 && <p className="text-fg-3 py-6 text-center text-sm">Belum ada kejadian hari ini.</p>}
                        </div>
                    </Card>
                    <Card className="gap-2">
                        <span className="text-sm font-bold">Penyimpanan rekaman</span>
                        <p className="text-fg-3 text-[13px] leading-relaxed">
                            Rekaman disimpan 30 hari di NVR Ruang TI & pengelolaan (lantai 2). Snapshot dan potongan rekaman bisa dipakai sebagai
                            bukti IK 2.9 (sarana keamanan) di modul akreditasi.
                        </p>
                    </Card>
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
    const text = large ? 'text-xs' : 'text-[10px]';

    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-slate-800">
            {camera.online && camera.stream_url ? (
                <img src={camera.stream_url} alt={`Tayangan ${camera.name}`} className="size-full object-cover" />
            ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-slate-400">
                    <VideoOff className={large ? 'size-8' : 'size-5'} />
                    {large && (
                        <span className="max-w-xs text-xs leading-relaxed">
                            {camera.online ? 'Belum ada sumber video. Isi URL stream dari NVR lewat tombol Atur.' : 'Kamera offline'}
                        </span>
                    )}
                    {!large && !camera.online && <span className="text-[10px]">Offline</span>}
                </div>
            )}
            <span className={`absolute top-2 left-2 rounded-sm bg-black/55 px-1.5 py-0.5 font-mono text-white ${text}`}>
                {camera.online ? 'LIVE' : 'OFF'} · {camera.code}
            </span>
            <span className={`absolute right-2 bottom-2 rounded-sm bg-black/55 px-1.5 py-0.5 font-mono text-white ${text}`}>{clock}</span>
            {camera.online && camera.recording && (
                <span className={`bg-danger absolute top-2 right-2 flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-bold text-white ${text}`}>
                    <span className="size-1.5 animate-pulse rounded-full bg-white" />
                    REC
                </span>
            )}
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
        <form onSubmit={submit} className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 dark:bg-slate-900">
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
