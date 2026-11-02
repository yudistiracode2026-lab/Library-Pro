import { Alert, Button, Card, IconButton, inputClass } from '@/components/staf/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import StafLayout from '@/layouts/staf-layout';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Copy,
    History,
    ImagePlus,
    Library,
    Minus,
    MousePointer2,
    Plus,
    Redo2,
    Save,
    Shapes,
    Square,
    Trash2,
    Undo2,
} from 'lucide-react';
import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Kind = 'room' | 'rack' | 'fixture';
type Tool = 'select' | Kind;

/** One thing on the plan, placed in metres. */
interface Item {
    uid: string;
    id: number | null;
    kind: Kind;
    /** Room or rack name, or fixture label. */
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    code?: string;
    type?: string;
    area?: number;
    areaManual?: boolean;
    outside?: boolean;
    icon?: string;
    /** Assets in a room, or titles on a rack. */
    held: number;
}

interface Draft {
    name: string;
    width: number;
    length: number;
    items: Item[];
}

interface Layout {
    name: string;
    width: number;
    length: number;
    rooms: {
        id: number;
        name: string;
        type: string;
        area: number;
        area_manual: boolean;
        outside: boolean;
        x: number;
        y: number;
        w: number;
        h: number;
        assets?: number;
    }[];
    racks: { id: number; code: string; name: string; x: number; y: number; w: number; h: number; books?: number }[];
    fixtures: { id: number; label: string; icon: string; x: number; y: number; w: number; h: number }[];
}

interface DenahProps {
    floors: { id: number; number: number; name: string }[];
    floor: { id: number; number: number; version: number; background: string | null; layout: Layout };
    versions: { id: number; at: string; by: string | null; layout: Layout }[];
    targetRooms: { id: number; floor: number; name: string }[];
    options: { types: { value: string; label: string; group: 'd' | 'p' | 'f' | 'n' }[]; icons: string[] };
}

/** Drawing units per metre: the viewBox is fixed, the browser scales it to the space available. */
const SCALE = 40;
const MIN_SIZE = 0.5;

const COLORS = {
    d: { fill: '#dcfce7', stroke: '#16a34a', text: '#14532d' },
    p: { fill: '#fef3c7', stroke: '#d97706', text: '#92400e' },
    f: { fill: '#ffddb0', stroke: '#efa45a', text: '#8a4a10' },
    n: { fill: '#f1f5f9', stroke: '#94a3b8', text: '#475569' },
};

const ICON_LABELS: Record<string, string> = {
    'book-open': 'Area baca',
    'door-open': 'Pintu',
    'arrow-up-down': 'Tangga',
    monitor: 'Komputer',
    repeat: 'Meja layanan',
    'users-round': 'Area diskusi',
};

const KIND_NAMES: Record<Kind, string> = { room: 'ruang', rack: 'rak', fixture: 'fasilitas' };

const round = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const nf = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 });

function toDraft(layout: Layout, held = true): Draft {
    return {
        name: layout.name,
        width: Number(layout.width),
        length: Number(layout.length),
        items: [
            ...layout.rooms.map(
                (r): Item => ({
                    uid: `room-${r.id}`,
                    id: r.id,
                    kind: 'room',
                    name: r.name,
                    type: r.type,
                    area: r.area,
                    areaManual: r.area_manual,
                    outside: r.outside,
                    x: r.x,
                    y: r.y,
                    w: r.w,
                    h: r.h,
                    held: held ? (r.assets ?? 0) : 0,
                }),
            ),
            ...layout.fixtures.map(
                (f): Item => ({
                    uid: `fixture-${f.id}`,
                    id: f.id,
                    kind: 'fixture',
                    name: f.label,
                    icon: f.icon,
                    x: f.x,
                    y: f.y,
                    w: f.w,
                    h: f.h,
                    held: 0,
                }),
            ),
            ...layout.racks.map(
                (r): Item => ({
                    uid: `rack-${r.id}`,
                    id: r.id,
                    kind: 'rack',
                    name: r.name,
                    code: r.code,
                    x: r.x,
                    y: r.y,
                    w: r.w,
                    h: r.h,
                    held: held ? (r.books ?? 0) : 0,
                }),
            ),
        ],
    };
}

function overlaps(a: Item, b: Item): boolean {
    const across = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const down = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

    return across > 0.05 && down > 0.05;
}

/** The editor is keyed by floor and version, so a save or a floor change starts a fresh draft. */
export default function Denah(props: DenahProps) {
    return <Editor key={`${props.floor.id}-${props.floor.version}`} {...props} />;
}

function Editor({ floors, floor, versions, targetRooms, options }: DenahProps) {
    const { errors } = usePage().props as unknown as { errors: Record<string, string> };
    const initial = useMemo(() => toDraft(floor.layout), [floor.layout]);
    const [draft, setDraft] = useState<Draft>(initial);
    const [past, setPast] = useState<Draft[]>([]);
    const [future, setFuture] = useState<Draft[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [tool, setTool] = useState<Tool>('select');
    const [step, setStep] = useState(0.25);
    const [zoom, setZoom] = useState(100);
    const [layers, setLayers] = useState<Record<Kind, boolean>>({ room: true, rack: true, fixture: true });
    const [backgroundOpacity, setBackgroundOpacity] = useState(50);
    const [preview, setPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [moves, setMoves] = useState<Record<number, string> | null>(null);
    const [saving, setSaving] = useState(false);
    const svg = useRef<SVGSVGElement>(null);
    const counter = useRef(0);
    const skipGuard = useRef(false);
    const lastPatch = useRef('');
    const drag = useRef<{
        mode: 'move' | 'resize' | 'draw';
        handle: string;
        start: { x: number; y: number };
        origin: Item | null;
        kind: Kind | null;
        pushed: boolean;
    } | null>(null);

    const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
    const item = draft.items.find((i) => i.uid === selected) ?? null;
    const groupOf = useCallback((type?: string) => options.types.find((t) => t.value === type)?.group ?? 'n', [options.types]);
    const snap = useCallback((n: number) => round(Math.round(n / step) * step), [step]);

    const rooms = draft.items.filter((i) => i.kind === 'room');
    const clashes = useMemo(() => {
        const found: [Item, Item][] = [];
        rooms.forEach((a, i) => rooms.slice(i + 1).forEach((b) => overlaps(a, b) && found.push([a, b])));
        return found;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft.items]);
    const clashing = new Set(clashes.flat().map((r) => r.uid));
    const outside = draft.items.filter((i) => i.x + i.w > draft.width + 0.05 || i.y + i.h > draft.length + 0.05);

    /** A change that undo can take back. */
    const apply = useCallback(
        (change: (d: Draft) => Draft) => {
            setPast((p) => [...p.slice(-99), draft]);
            setFuture([]);
            setDraft(change(draft));
        },
        [draft],
    );
    const patch = (uid: string, changes: Partial<Item>, field = '') => {
        const change = (d: Draft) => ({ ...d, items: d.items.map((i) => (i.uid === uid ? { ...i, ...changes } : i)) });
        // Typing in one field counts as one change.
        if (field && lastPatch.current === `${uid}:${field}`) {
            setDraft(change);
        } else {
            lastPatch.current = `${uid}:${field}`;
            apply(change);
        }
    };
    const undo = useCallback(() => {
        const previous = past[past.length - 1];
        if (previous) {
            setPast(past.slice(0, -1));
            setFuture([draft, ...future]);
            setDraft(previous);
        }
    }, [past, future, draft]);
    const redo = useCallback(() => {
        if (future[0]) {
            setFuture(future.slice(1));
            setPast([...past, draft]);
            setDraft(future[0]);
        }
    }, [past, future, draft]);
    const remove = useCallback(
        (target: Item) => {
            if (target.kind === 'rack' && target.held > 0) {
                return;
            }
            apply((d) => ({ ...d, items: d.items.filter((i) => i.uid !== target.uid) }));
            setSelected(null);
        },
        [apply],
    );

    // Leaving with unsaved changes asks first, both in-app and when closing the tab.
    useEffect(() => {
        const leave = (e: BeforeUnloadEvent) => {
            if (dirty) e.preventDefault();
        };
        window.addEventListener('beforeunload', leave);
        const stop = router.on('before', (e) => {
            if (
                dirty &&
                !skipGuard.current &&
                e.detail.visit.method === 'get' &&
                !window.confirm('Perubahan denah belum disimpan. Tinggalkan halaman ini?')
            ) {
                e.preventDefault();
            }
        });

        return () => {
            window.removeEventListener('beforeunload', leave);
            stop();
        };
    }, [dirty]);

    useEffect(() => {
        const keys = (e: KeyboardEvent) => {
            const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !typing) {
                e.preventDefault();
                redo();
            } else if (typing || !item) {
                if (e.key === 'Escape') setTool('select');
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                remove(item);
            } else if (e.key === 'Escape') {
                setSelected(null);
            } else if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
                const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
                patch(
                    item.uid,
                    { x: clamp(round(item.x + dx), 0, draft.width - item.w), y: clamp(round(item.y + dy), 0, draft.length - item.h) },
                    'arrows',
                );
            }
        };
        window.addEventListener('keydown', keys);

        return () => window.removeEventListener('keydown', keys);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item, step, draft, undo, redo, remove]);

    const pointAt = (e: ReactPointerEvent) => {
        const matrix = svg.current!.getScreenCTM()!.inverse();
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix);

        return { x: p.x / SCALE, y: p.y / SCALE };
    };

    const begin = (e: ReactPointerEvent, mode: 'move' | 'resize' | 'draw', target: Item | null, handle = '') => {
        e.stopPropagation();
        e.preventDefault();
        svg.current!.setPointerCapture(e.pointerId);
        lastPatch.current = '';
        drag.current = { mode, handle, start: pointAt(e), origin: target, kind: tool === 'select' ? null : tool, pushed: false };
    };

    const moved = (e: ReactPointerEvent) => {
        const d = drag.current;
        if (!d) return;
        const p = pointAt(e);

        if (d.mode === 'draw') {
            const x1 = clamp(snap(Math.min(d.start.x, p.x)), 0, draft.width);
            const y1 = clamp(snap(Math.min(d.start.y, p.y)), 0, draft.length);
            const x2 = clamp(snap(Math.max(d.start.x, p.x)), 0, draft.width);
            const y2 = clamp(snap(Math.max(d.start.y, p.y)), 0, draft.length);
            setPreview({ x: x1, y: y1, w: round(x2 - x1), h: round(y2 - y1) });
            return;
        }

        const o = d.origin!;
        const dx = p.x - d.start.x;
        const dy = p.y - d.start.y;
        let next: Partial<Item>;

        if (d.mode === 'move') {
            next = { x: clamp(snap(o.x + dx), 0, round(draft.width - o.w)), y: clamp(snap(o.y + dy), 0, round(draft.length - o.h)) };
        } else {
            let { x, y, w, h } = o;
            if (d.handle.includes('e')) w = clamp(snap(o.x + o.w + dx) - o.x, MIN_SIZE, draft.width - o.x);
            if (d.handle.includes('s')) h = clamp(snap(o.y + o.h + dy) - o.y, MIN_SIZE, draft.length - o.y);
            if (d.handle.includes('w')) {
                x = clamp(snap(o.x + dx), 0, o.x + o.w - MIN_SIZE);
                w = o.x + o.w - x;
            }
            if (d.handle.includes('n')) {
                y = clamp(snap(o.y + dy), 0, o.y + o.h - MIN_SIZE);
                h = o.y + o.h - y;
            }
            next = { x: round(x), y: round(y), w: round(w), h: round(h) };
            if (o.kind === 'room' && !o.areaManual) {
                next.area = Math.round(w * h * 10) / 10;
            }
        }

        const current = draft.items.find((i) => i.uid === o.uid);
        if (current && Object.entries(next).some(([k, v]) => current[k as keyof Item] !== v)) {
            if (!d.pushed) {
                d.pushed = true;
                setPast((list) => [...list.slice(-99), draft]);
                setFuture([]);
            }
            setDraft((dr) => ({ ...dr, items: dr.items.map((i) => (i.uid === o.uid ? { ...i, ...next } : i)) }));
        }
    };

    const addItem = (kind: Kind, box: { x: number; y: number; w: number; h: number }) => {
        counter.current += 1;
        const uid = `new-${Date.now()}-${counter.current}`;
        const rackNumber = draft.items.filter((i) => i.kind === 'rack').length + 1;
        const fresh: Item = {
            uid,
            id: null,
            kind,
            held: 0,
            ...box,
            ...(kind === 'room'
                ? {
                      name: 'Ruang baru',
                      type: 'pendukung',
                      area: Math.round(box.w * box.h * 10) / 10,
                      areaManual: false,
                      outside: rooms[0]?.outside ?? false,
                  }
                : kind === 'rack'
                  ? { name: 'Rak baru', code: `L${floor.number}R${rackNumber}` }
                  : { name: 'Fasilitas baru', icon: 'book-open' }),
        };
        apply((d) => ({ ...d, items: [...d.items, fresh] }));
        setSelected(uid);
    };

    const ended = () => {
        const d = drag.current;
        drag.current = null;
        if (d?.mode === 'draw' && d.kind) {
            const box = preview;
            setPreview(null);
            setTool('select');
            if (box && box.w >= MIN_SIZE && box.h >= MIN_SIZE) {
                addItem(d.kind, box);
            } else {
                // A plain click places one at a usual size.
                const size = d.kind === 'room' ? { w: 4, h: 4 } : d.kind === 'rack' ? { w: 1.2, h: 3 } : { w: 3, h: 1.5 };
                const w = Math.min(size.w, draft.width);
                const h = Math.min(size.h, draft.length);
                addItem(d.kind, {
                    x: clamp(snap(d.start.x), 0, round(draft.width - w)),
                    y: clamp(snap(d.start.y), 0, round(draft.length - h)),
                    w,
                    h,
                });
            }
        }
    };

    const send = (chosen: Record<number, string>) => {
        skipGuard.current = true;
        setSaving(true);
        const list = (kind: Kind) => draft.items.filter((i) => i.kind === kind);
        router.put(
            route('staf.aset.denah.save', floor.id),
            {
                version: floor.version,
                name: draft.name,
                width: draft.width,
                length: draft.length,
                rooms: list('room').map((r) => ({
                    id: r.id,
                    name: r.name,
                    type: r.type ?? 'pendukung',
                    area: r.area ?? 0,
                    area_manual: !!r.areaManual,
                    outside: !!r.outside,
                    x: r.x,
                    y: r.y,
                    w: r.w,
                    h: r.h,
                })),
                racks: list('rack').map((r) => ({ id: r.id, code: r.code ?? '', name: r.name, x: r.x, y: r.y, w: r.w, h: r.h })),
                fixtures: list('fixture').map((f) => ({ id: f.id, label: f.name, icon: f.icon ?? 'book-open', x: f.x, y: f.y, w: f.w, h: f.h })),
                moves: Object.fromEntries(Object.entries(chosen).map(([k, v]) => [k, Number(v)])),
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSaving(false);
                    skipGuard.current = false;
                },
            },
        );
    };

    // Rooms taken off the plan whose assets need somewhere to go.
    const orphaned = initial.items.filter((i) => i.kind === 'room' && i.held > 0 && !draft.items.some((d) => d.id === i.id && d.kind === 'room'));
    const save = () => {
        setMoves(null);
        if (orphaned.length > 0) {
            setMoves(Object.fromEntries(orphaned.map((r) => [r.id!, ''])));
        } else {
            send({});
        }
    };
    const removedIds = new Set(orphaned.map((r) => r.id));
    const removedAll = initial.items
        .filter((i) => i.kind === 'room' && !draft.items.some((d) => d.id === i.id && d.kind === 'room'))
        .map((r) => r.id);

    const loadVersion = (layout: Layout) => {
        const known = new Map(initial.items.map((i) => [`${i.kind}-${i.id}`, i.held]));
        const next = toDraft(layout, false);
        apply(() => ({ ...next, items: next.items.map((i) => ({ ...i, held: known.get(`${i.kind}-${i.id}`) ?? 0 })) }));
        setSelected(null);
    };

    const toolButton = (value: Tool, label: string, Icon: typeof Square) => (
        <button
            type="button"
            aria-pressed={tool === value}
            onClick={() => setTool(value)}
            className={`flex h-[34px] cursor-pointer items-center gap-1.5 rounded-[9px] px-2.5 text-[13px] font-semibold ${tool === value ? 'bg-teal-400 text-white' : 'text-fg-2 hover:bg-teal-50 hover:text-teal-700'}`}
        >
            <Icon className="size-4" />
            {label}
        </button>
    );

    const handles = item && layers[item.kind] ? ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] : [];
    const handlePosition = (h: string, i: Item) => ({
        x: (h.includes('w') ? i.x : h.includes('e') ? i.x + i.w : i.x + i.w / 2) * SCALE,
        y: (h.includes('n') ? i.y : h.includes('s') ? i.y + i.h : i.y + i.h / 2) * SCALE,
    });
    const errorList = Object.values(errors ?? {});

    return (
        <StafLayout title="Editor denah" group="Master data">
            <div className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm md:hidden">
                <p className="text-fg-2 text-sm">Denah hanya bisa diedit dari komputer. Di ponsel, lihat denah di halaman Ruang & denah.</p>
                <Link href={route('staf.aset.ruang')} className="text-sm font-semibold text-teal-700">
                    Kembali ke Ruang & denah
                </Link>
            </div>

            <div className="hidden flex-col gap-3 md:flex">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('staf.aset.ruang', { lantai: floor.number })}
                        className="text-fg-2 flex items-center gap-1.5 text-sm font-semibold hover:text-teal-700"
                    >
                        <ArrowLeft className="size-4" />
                        Ruang & denah
                    </Link>
                    <div className="ml-2 flex flex-wrap gap-1 rounded-[10px] bg-slate-100 p-1 dark:bg-slate-700">
                        {floors.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => router.get(route('staf.aset.denah'), { lantai: f.number })}
                                className={`h-[30px] cursor-pointer rounded-sm px-3 text-[13px] font-semibold whitespace-nowrap ${f.id === floor.id ? 'text-fg-1 bg-white shadow-sm dark:bg-slate-800' : 'text-fg-3'}`}
                            >
                                {f.name}
                            </button>
                        ))}
                        <IconButton label="Tambah lantai" onClick={() => router.post(route('staf.aset.denah.store'))} disabled={dirty}>
                            <Plus className="size-4" />
                        </IconButton>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {dirty && <span className="text-xs font-semibold text-amber-700">Belum disimpan</span>}
                        <Button variant="secondary" size="sm" disabled={!dirty || saving} onClick={() => apply(() => initial)}>
                            Batalkan perubahan
                        </Button>
                        <Button size="sm" disabled={!dirty || saving} onClick={save}>
                            <Save />
                            {saving ? 'Menyimpan…' : 'Simpan denah'}
                        </Button>
                    </div>
                </div>

                {errorList.length > 0 && (
                    <Alert>
                        {errorList.map((m) => (
                            <p key={m}>{m}</p>
                        ))}
                    </Alert>
                )}

                <div className="grid grid-cols-[minmax(0,1fr)_290px] items-start gap-3">
                    <Card className="min-w-0 gap-2.5 p-3 md:p-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <div className="flex gap-0.5">
                                {toolButton('select', 'Pilih', MousePointer2)}
                                {toolButton('room', 'Ruang', Square)}
                                {toolButton('rack', 'Rak', Library)}
                                {toolButton('fixture', 'Fasilitas', Shapes)}
                            </div>
                            <div className="flex items-center gap-0.5">
                                <IconButton label="Urungkan (Ctrl+Z)" onClick={undo} disabled={past.length === 0}>
                                    <Undo2 className="size-4" />
                                </IconButton>
                                <IconButton label="Ulangi (Ctrl+Y)" onClick={redo} disabled={future.length === 0}>
                                    <Redo2 className="size-4" />
                                </IconButton>
                            </div>
                            <label className="text-fg-3 flex items-center gap-1.5 text-xs font-semibold">
                                Grid
                                <select
                                    value={step}
                                    onChange={(e) => setStep(Number(e.target.value))}
                                    className="text-fg-1 h-[30px] rounded-md border border-slate-200 bg-white pl-1.5 text-xs dark:bg-slate-800"
                                >
                                    {[0.1, 0.25, 0.5, 1].map((s) => (
                                        <option key={s} value={s}>
                                            {nf(s)} m
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="flex items-center gap-0.5">
                                <IconButton label="Perkecil" onClick={() => setZoom((z) => Math.max(50, z - 25))}>
                                    <Minus className="size-4" />
                                </IconButton>
                                <span className="text-fg-3 w-10 text-center text-xs font-semibold">{zoom}%</span>
                                <IconButton label="Perbesar" onClick={() => setZoom((z) => Math.min(300, z + 25))}>
                                    <Plus className="size-4" />
                                </IconButton>
                            </div>
                            <div className="text-fg-3 ml-auto flex items-center gap-2.5 text-xs font-semibold">
                                {(['room', 'rack', 'fixture'] as Kind[]).map((k) => (
                                    <label key={k} className="flex cursor-pointer items-center gap-1 capitalize">
                                        <input
                                            type="checkbox"
                                            checked={layers[k]}
                                            onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })}
                                            className="size-3.5 accent-teal-500"
                                        />
                                        {KIND_NAMES[k]}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="max-h-[calc(100vh-290px)] overflow-auto rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700">
                            <svg
                                ref={svg}
                                data-testid="denah"
                                viewBox={`0 0 ${draft.width * SCALE} ${draft.length * SCALE}`}
                                className={`mx-auto block touch-none bg-white select-none ${tool === 'select' ? '' : 'cursor-crosshair'}`}
                                style={{
                                    width: `${zoom}%`,
                                    maxWidth: zoom === 100 ? `min(100%, calc((100vh - 300px) * ${draft.width / draft.length}))` : undefined,
                                }}
                                onPointerDown={(e) => {
                                    if (tool === 'select') {
                                        setSelected(null);
                                    } else {
                                        begin(e, 'draw', null);
                                    }
                                }}
                                onPointerMove={moved}
                                onPointerUp={ended}
                                onPointerCancel={ended}
                            >
                                <defs>
                                    <pattern id="grid-metre" width={SCALE} height={SCALE} patternUnits="userSpaceOnUse">
                                        <path d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`} fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                    </pattern>
                                </defs>
                                {floor.background && (
                                    <image
                                        href={floor.background}
                                        x={0}
                                        y={0}
                                        width={draft.width * SCALE}
                                        height={draft.length * SCALE}
                                        opacity={backgroundOpacity / 100}
                                        preserveAspectRatio="xMidYMid meet"
                                    />
                                )}
                                <rect x={0} y={0} width={draft.width * SCALE} height={draft.length * SCALE} fill="url(#grid-metre)" />

                                {draft.items
                                    .filter((i) => layers[i.kind])
                                    .map((i) => (
                                        <PlanItem
                                            key={i.uid}
                                            item={i}
                                            group={groupOf(i.type)}
                                            on={i.uid === selected}
                                            clash={clashing.has(i.uid)}
                                            idle={tool === 'select'}
                                            onPointerDown={(e) => {
                                                if (tool === 'select') {
                                                    setSelected(i.uid);
                                                    begin(e, 'move', i);
                                                } else {
                                                    begin(e, 'draw', null);
                                                }
                                            }}
                                        />
                                    ))}

                                {preview && (
                                    <rect
                                        x={preview.x * SCALE}
                                        y={preview.y * SCALE}
                                        width={preview.w * SCALE}
                                        height={preview.h * SCALE}
                                        fill="#5eead433"
                                        stroke="#0d9488"
                                        strokeWidth="2"
                                        strokeDasharray="6 4"
                                    />
                                )}

                                {item &&
                                    handles.map((h) => {
                                        const p = handlePosition(h, item);

                                        return (
                                            <rect
                                                key={h}
                                                data-handle={h}
                                                x={p.x - 6}
                                                y={p.y - 6}
                                                width={12}
                                                height={12}
                                                fill="#fff"
                                                stroke="#0d9488"
                                                strokeWidth="2"
                                                style={{ cursor: `${h}-resize` }}
                                                onPointerDown={(e) => begin(e, 'resize', item, h)}
                                            />
                                        );
                                    })}
                            </svg>
                        </div>
                        <p className="text-fg-3 text-xs">
                            Satu kotak grid = 1 meter. Pilih alat Ruang, Rak, atau Fasilitas lalu seret di denah. Tombol panah menggeser, Delete
                            menghapus.
                        </p>
                    </Card>

                    <div className="flex min-w-0 flex-col gap-3">
                        {outside.length > 0 && (
                            <Alert tone="warning">
                                Keluar dari batas lantai: {outside.map((i) => i.code ?? i.name).join(', ')}. Geser atau perbesar lantainya sebelum
                                menyimpan.
                            </Alert>
                        )}
                        {clashes.length > 0 && (
                            <Alert tone="warning">
                                <span className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 size-4 flex-none" />
                                    Ruang bertumpuk:{' '}
                                    {clashes
                                        .slice(0, 4)
                                        .map(([a, b]) => `${a.name} × ${b.name}`)
                                        .join('; ')}
                                    {clashes.length > 4 && ` dan ${clashes.length - 4} lainnya`}. Tetap bisa disimpan, tetapi luasnya mungkin
                                    terhitung ganda.
                                </span>
                            </Alert>
                        )}
                        <Card className="gap-2.5 p-4 md:p-4">
                            {item ? (
                                <ItemPanel
                                    key={item.uid}
                                    item={item}
                                    draft={draft}
                                    options={options}
                                    patch={patch}
                                    remove={() => remove(item)}
                                    duplicate={() => {
                                        const w = item.w;
                                        const h = item.h;
                                        addItem(item.kind, {
                                            x: clamp(round(item.x + step * 2), 0, round(draft.width - w)),
                                            y: clamp(round(item.y + step * 2), 0, round(draft.length - h)),
                                            w,
                                            h,
                                        });
                                    }}
                                />
                            ) : (
                                <p className="text-fg-3 text-sm">Klik ruang, rak, atau fasilitas di denah untuk mengubahnya.</p>
                            )}
                        </Card>

                        <Card className="gap-2.5 p-4 md:p-4">
                            <span className="text-sm font-bold">Pengaturan lantai</span>
                            <TextField label="Nama lantai" value={draft.name} onChange={(v) => apply((d) => ({ ...d, name: v }))} />
                            <div className="grid grid-cols-2 gap-2">
                                <NumberField
                                    label="Lebar (m)"
                                    value={draft.width}
                                    min={3}
                                    max={200}
                                    onCommit={(v) => apply((d) => ({ ...d, width: v }))}
                                />
                                <NumberField
                                    label="Panjang (m)"
                                    value={draft.length}
                                    min={3}
                                    max={200}
                                    onCommit={(v) => apply((d) => ({ ...d, length: v }))}
                                />
                            </div>
                            <span className="text-fg-3 text-xs">Total luas ruang {nf(rooms.reduce((sum, r) => sum + (r.area ?? 0), 0))} m²</span>

                            <label className="text-fg-2 mt-1 flex cursor-pointer items-center gap-2 text-[13px] font-semibold hover:text-teal-700">
                                <ImagePlus className="size-4" />
                                {floor.background ? 'Ganti gambar latar' : 'Pasang gambar denah sebagai latar'}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                            router.post(
                                                route('staf.aset.denah.background.store', floor.id),
                                                { file },
                                                { forceFormData: true, preserveScroll: true, preserveState: true },
                                            );
                                        e.target.value = '';
                                    }}
                                />
                            </label>
                            {floor.background && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min={10}
                                        max={100}
                                        value={backgroundOpacity}
                                        aria-label="Kejelasan gambar latar"
                                        onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                                        className="min-w-0 flex-1 accent-teal-500"
                                    />
                                    <IconButton
                                        label="Hapus gambar latar"
                                        danger
                                        onClick={() =>
                                            router.delete(route('staf.aset.denah.background.destroy', floor.id), {
                                                preserveScroll: true,
                                                preserveState: true,
                                            })
                                        }
                                    >
                                        <Trash2 className="size-4" />
                                    </IconButton>
                                </div>
                            )}
                            {initial.items.length === 0 && floors.length > 1 && (
                                <Button variant="secondary" size="sm" onClick={() => router.delete(route('staf.aset.denah.destroy', floor.id))}>
                                    Hapus lantai kosong ini
                                </Button>
                            )}
                        </Card>

                        <Card className="gap-1.5 p-4 md:p-4">
                            <span className="flex items-center gap-1.5 text-sm font-bold">
                                <History className="size-4" />
                                Riwayat denah
                            </span>
                            {versions.length === 0 && (
                                <p className="text-fg-3 text-xs">Belum ada. Setiap simpan menyimpan versi sebelumnya di sini.</p>
                            )}
                            <div className="flex max-h-[180px] flex-col overflow-auto">
                                {versions.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center justify-between gap-2 border-b border-slate-200 py-1.5 text-xs last:border-0 dark:border-slate-700"
                                    >
                                        <span className="min-w-0">
                                            <span className="block font-semibold">{v.at}</span>
                                            <span className="text-fg-3 block truncate">{v.by ?? '—'}</span>
                                        </span>
                                        <Button variant="secondary" size="sm" className="h-7 px-2 text-xs" onClick={() => loadVersion(v.layout)}>
                                            Muat
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {versions.length > 0 && <p className="text-fg-3 text-xs">Versi yang dimuat baru berlaku setelah klik Simpan denah.</p>}
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={moves !== null} onOpenChange={(o) => !o && setMoves(null)}>
                <DialogContent className="rounded-xl p-7 sm:max-w-[520px]">
                    <DialogTitle className="font-display text-xl font-bold">Pindahkan aset dulu</DialogTitle>
                    <DialogDescription className="text-fg-2 text-sm leading-relaxed">
                        Ruang berikut dihapus dari denah tetapi masih berisi aset. Pilih ruang tujuannya.
                    </DialogDescription>
                    <div className="flex flex-col gap-3">
                        {orphaned.map((r) => (
                            <label key={r.id} className="flex flex-col gap-1.5 text-[13px] font-semibold">
                                {r.name} ({r.held} aset)
                                <select
                                    value={moves?.[r.id!] ?? ''}
                                    onChange={(e) => setMoves({ ...moves, [r.id!]: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Pilih ruang…</option>
                                    {targetRooms
                                        .filter((t) => !removedIds.has(t.id) && !removedAll.includes(t.id))
                                        .map((t) => (
                                            <option key={t.id} value={t.id}>
                                                Lt {t.floor} · {t.name}
                                            </option>
                                        ))}
                                </select>
                            </label>
                        ))}
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                        <Button variant="secondary" size="lg" onClick={() => setMoves(null)}>
                            Batal
                        </Button>
                        <Button
                            size="lg"
                            disabled={!moves || Object.values(moves).some((v) => !v)}
                            onClick={() => {
                                const chosen = moves!;
                                setMoves(null);
                                send(chosen);
                            }}
                        >
                            Pindahkan & simpan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </StafLayout>
    );
}

function PlanItem({
    item,
    group,
    on,
    clash,
    idle,
    onPointerDown,
}: {
    item: Item;
    group: keyof typeof COLORS;
    on: boolean;
    clash: boolean;
    idle: boolean;
    onPointerDown: (e: ReactPointerEvent) => void;
}) {
    const box = { x: item.x * SCALE, y: item.y * SCALE, width: item.w * SCALE, height: item.h * SCALE };
    const color =
        item.kind === 'room'
            ? COLORS[group]
            : item.kind === 'rack'
              ? { fill: '#ffffff', stroke: '#0f766e', text: '#134e4a' }
              : { fill: '#e2e8f0', stroke: '#94a3b8', text: '#475569' };
    const stroke = on ? '#0d9488' : clash ? '#dc2626' : color.stroke;

    return (
        <g data-item={item.uid} onPointerDown={onPointerDown} style={{ cursor: idle ? 'move' : 'crosshair' }}>
            <rect
                {...box}
                rx={3}
                fill={color.fill}
                fillOpacity={item.kind === 'room' ? 0.82 : item.kind === 'fixture' ? 0.7 : 1}
                stroke={stroke}
                strokeWidth={on ? 3.5 : 2}
                strokeDasharray={item.name === 'Void' ? '6 4' : undefined}
            />
            <foreignObject {...box} style={{ pointerEvents: 'none' }}>
                <div
                    style={{
                        color: color.text,
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        padding: item.kind === 'rack' ? 1 : 5,
                        lineHeight: 1.15,
                    }}
                    className={item.kind === 'room' ? 'flex flex-col justify-between' : 'flex items-center justify-center text-center'}
                >
                    {item.kind === 'rack' ? (
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{item.code}</span>
                    ) : item.kind === 'fixture' ? (
                        <span style={{ fontSize: 12 }}>{item.name}</span>
                    ) : (
                        <>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{item.area ? `${nf(item.area)} m²` : '—'}</span>
                        </>
                    )}
                </div>
            </foreignObject>
        </g>
    );
}

function ItemPanel({
    item,
    draft,
    options,
    patch,
    remove,
    duplicate,
}: {
    item: Item;
    draft: Draft;
    options: DenahProps['options'];
    patch: (uid: string, changes: Partial<Item>, field?: string) => void;
    remove: () => void;
    duplicate: () => void;
}) {
    const size = (changes: Partial<Item>, field: string) => {
        const next = { ...item, ...changes };
        patch(item.uid, item.kind === 'room' && !item.areaManual ? { ...changes, area: Math.round(next.w * next.h * 10) / 10 } : changes, field);
    };
    const full = item.kind === 'rack' && item.held > 0;

    return (
        <>
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold capitalize">{KIND_NAMES[item.kind]}</span>
                <span className="flex gap-0.5">
                    <IconButton label="Gandakan" onClick={duplicate}>
                        <Copy className="size-4" />
                    </IconButton>
                    <IconButton
                        label={full ? `Rak berisi ${item.held} judul, pindahkan bukunya dulu` : 'Hapus'}
                        danger
                        disabled={full}
                        onClick={remove}
                    >
                        <Trash2 className="size-4" />
                    </IconButton>
                </span>
            </div>

            {item.kind === 'rack' && (
                <TextField
                    label="Kode rak"
                    value={item.code ?? ''}
                    maxLength={10}
                    onChange={(v) => patch(item.uid, { code: v.toUpperCase() }, 'code')}
                />
            )}
            <TextField
                label={item.kind === 'fixture' ? 'Keterangan' : 'Nama'}
                value={item.name}
                onChange={(v) => patch(item.uid, { name: v }, 'name')}
            />

            {item.kind === 'room' && (
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                    Jenis ruang
                    <select value={item.type} onChange={(e) => patch(item.uid, { type: e.target.value })} className={inputClass}>
                        {options.types.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            {item.kind === 'fixture' && (
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                    Ikon di peta rak
                    <select value={item.icon} onChange={(e) => patch(item.uid, { icon: e.target.value })} className={inputClass}>
                        {options.icons.map((i) => (
                            <option key={i} value={i}>
                                {ICON_LABELS[i] ?? i}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <div className="grid grid-cols-2 gap-2">
                <NumberField
                    label="Dari kiri (m)"
                    value={item.x}
                    min={0}
                    max={round(draft.width - item.w)}
                    onCommit={(x) => patch(item.uid, { x })}
                />
                <NumberField
                    label="Dari atas (m)"
                    value={item.y}
                    min={0}
                    max={round(draft.length - item.h)}
                    onCommit={(y) => patch(item.uid, { y })}
                />
                <NumberField label="Lebar (m)" value={item.w} min={MIN_SIZE} max={round(draft.width - item.x)} onCommit={(w) => size({ w }, '')} />
                <NumberField label="Panjang (m)" value={item.h} min={MIN_SIZE} max={round(draft.length - item.y)} onCommit={(h) => size({ h }, '')} />
            </div>

            {item.kind === 'room' && (
                <>
                    <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                        <input
                            type="checkbox"
                            checked={!!item.areaManual}
                            onChange={(e) =>
                                patch(
                                    item.uid,
                                    e.target.checked ? { areaManual: true } : { areaManual: false, area: Math.round(item.w * item.h * 10) / 10 },
                                )
                            }
                            className="size-4 accent-teal-500"
                        />
                        Luas diisi manual (data resmi)
                    </label>
                    {item.areaManual ? (
                        <NumberField label="Luas (m²)" value={item.area ?? 0} min={0} max={99999} onCommit={(area) => patch(item.uid, { area })} />
                    ) : (
                        <span className="text-fg-3 text-xs">Luas dari gambar: {nf(item.area ?? 0)} m²</span>
                    )}
                    <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                        <input
                            type="checkbox"
                            checked={!!item.outside}
                            onChange={(e) => patch(item.uid, { outside: e.target.checked })}
                            className="size-4 accent-teal-500"
                        />
                        Bukan area perpustakaan
                    </label>
                    {item.held > 0 && <span className="text-fg-3 text-xs">{item.held} aset di ruang ini.</span>}
                </>
            )}
            {full && <span className="text-fg-3 text-xs">{item.held} judul di rak ini.</span>}
        </>
    );
}

function TextField({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (v: string) => void; maxLength?: number }) {
    return (
        <label className="flex flex-col gap-1 text-[13px] font-semibold">
            {label}
            <input value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} className={inputClass} />
        </label>
    );
}

/** A number kept as typed text until it is committed, so clearing the field while typing does not jump to the minimum. */
function NumberField({
    label,
    value,
    min,
    max,
    onCommit,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    onCommit: (v: number) => void;
}) {
    const [text, setText] = useState(String(value));
    const [seen, setSeen] = useState(value);
    if (seen !== value) {
        setSeen(value);
        setText(String(value));
    }
    const commit = () => {
        const n = Number(text.replace(',', '.'));
        const next = Number.isFinite(n) && text.trim() !== '' ? round(clamp(n, min, Math.max(min, max))) : value;
        setText(String(next));
        if (next !== value) onCommit(next);
    };

    return (
        <label className="flex flex-col gap-1 text-[13px] font-semibold">
            {label}
            <input
                inputMode="decimal"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        commit();
                    }
                }}
                className={inputClass}
            />
        </label>
    );
}
