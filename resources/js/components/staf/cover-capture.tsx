import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { LoaderCircle, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { type ReactNode, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';

/** Asks first, then removes a book's cover (for a wrong photo). */
export function removeCover(id: number, title: string, onFinish?: () => void) {
    if (!window.confirm(`Hapus sampul "${title}"? Buku akan kembali ke daftar belum bersampul.`)) return;
    router.delete(route('staf.sampul.destroy', id), { preserveScroll: true, preserveState: true, onFinish });
}

export function RemoveCoverButton({ id, title, className }: { id: number; title: string; className: string }) {
    return (
        <button type="button" onClick={() => removeCover(id, title)} title="Hapus sampul" aria-label={`Hapus sampul ${title}`} className={className}>
            <Trash2 className="size-4" />
        </button>
    );
}

type Point = { x: number; y: number };
/** Top-left, top-right, bottom-right, bottom-left, in source pixels. */
type Quad = [Point, Point, Point, Point];

/** Photos are worked on at this size at most, so a 12 MP phone shot stays quick. */
const SOURCE_MAX = 2000;
/** The long side of the saved cover. */
const OUTPUT_MAX = 1200;
const LOUPE = 120;

/**
 * Two hidden inputs (camera and gallery) and the crop dialog. Whatever is
 * picked is straightened and cropped before it reaches `onPicked`.
 */
export function CoverPicker({ onPicked, children }: { onPicked: (file: File) => void; children: (pick: (camera: boolean) => void) => ReactNode }) {
    const camera = useRef<HTMLInputElement>(null);
    const gallery = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);

    const input = (ref: typeof camera, capture: boolean) => (
        <input
            ref={ref}
            type="file"
            accept="image/*"
            capture={capture ? 'environment' : undefined}
            className="hidden"
            onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                e.target.value = '';
            }}
        />
    );

    return (
        <>
            {children((useCamera) => (useCamera ? camera : gallery).current?.click())}
            {input(camera, true)}
            {input(gallery, false)}
            <CoverCropDialog
                file={file}
                onCancel={() => setFile(null)}
                onDone={(cropped) => {
                    setFile(null);
                    onPicked(cropped);
                }}
            />
        </>
    );
}

/**
 * Drag the four corners onto the cover's corners; the picture is then
 * straightened (perspective corrected), so a cover photographed at a slant
 * still comes out as a flat rectangle.
 */
export function CoverCropDialog({ file, onCancel, onDone }: { file: File | null; onCancel: () => void; onDone: (file: File) => void }) {
    const [source, setSource] = useState<HTMLCanvasElement | null>(null);
    const [quad, setQuad] = useState<Quad | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setSource(null);
        setQuad(null);
        setError(null);
        if (!file) return;

        let cancelled = false;
        loadSource(file)
            .then((canvas) => {
                if (cancelled) return;
                setSource(canvas);
                setQuad(defaultQuad(canvas));
            })
            .catch(() => !cancelled && setError('Gambar tidak bisa dibuka. Coba foto ulang atau pilih berkas JPG/PNG.'));

        return () => {
            cancelled = true;
        };
    }, [file]);

    const rotate = (clockwise: boolean) => {
        if (!source || !quad) return;
        const { canvas, map } = rotateCanvas(source, clockwise);
        const [tl, tr, br, bl] = quad.map(map) as Quad;
        setSource(canvas);
        // Keep the corners in reading order after the turn.
        setQuad(clockwise ? [bl, tl, tr, br] : [tr, br, bl, tl]);
    };

    const save = () => {
        if (!source || !quad) return;
        setBusy(true);
        // Let the spinner paint before the pixel work.
        setTimeout(() => {
            warp(source, quad).toBlob(
                (blob) => {
                    setBusy(false);
                    if (blob) onDone(new File([blob], 'sampul.jpg', { type: 'image/jpeg' }));
                    else setError('Gagal menyimpan potongan gambar.');
                },
                'image/jpeg',
                0.86,
            );
        }, 30);
    };

    return (
        <Dialog open={file !== null} onOpenChange={(open) => !open && !busy && onCancel()}>
            <DialogContent className="max-h-[100dvh] w-full max-w-2xl gap-3 overflow-y-auto p-4 sm:p-5">
                <DialogTitle className="text-fg-1 text-base">Rapikan gambar sampul</DialogTitle>
                <DialogDescription className="text-fg-3 text-[13px]">
                    Geser keempat titik ke sudut sampul buku. Gambar akan diluruskan dan dipotong otomatis.
                </DialogDescription>

                <div className="grid min-h-[200px] place-items-center rounded-lg bg-slate-900 p-2">
                    {error ? (
                        <p className="px-4 py-10 text-center text-sm text-white">{error}</p>
                    ) : source && quad ? (
                        <CornerEditor source={source} quad={quad} onChange={setQuad} />
                    ) : (
                        <LoaderCircle className="size-6 animate-spin text-white" />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => rotate(false)}
                        disabled={!source || busy}
                        aria-label="Putar ke kiri"
                        className="text-fg-1 grid size-10 cursor-pointer place-items-center rounded-[10px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-800"
                    >
                        <RotateCcw className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => rotate(true)}
                        disabled={!source || busy}
                        aria-label="Putar ke kanan"
                        className="text-fg-1 grid size-10 cursor-pointer place-items-center rounded-[10px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-800"
                    >
                        <RotateCw className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => source && setQuad(fullQuad(source))}
                        disabled={!source || busy}
                        className="text-fg-1 h-10 cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-semibold hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-800"
                    >
                        Seluruh foto
                    </button>
                    <div className="ml-auto flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={busy}
                            className="text-fg-2 h-10 cursor-pointer rounded-[10px] px-3 text-[13px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={save}
                            disabled={!source || busy}
                            className="flex h-10 cursor-pointer items-center gap-2 rounded-[10px] bg-teal-600 px-4 text-[13px] font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                        >
                            {busy && <LoaderCircle className="size-4 animate-spin" />}
                            Pakai gambar
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CornerEditor({ source, quad, onChange }: { source: HTMLCanvasElement; quad: Quad; onChange: (quad: Quad) => void }) {
    const view = useRef<HTMLCanvasElement>(null);
    const svg = useRef<SVGSVGElement>(null);
    const loupe = useRef<HTMLCanvasElement>(null);
    const [dragging, setDragging] = useState<number | null>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const canvas = view.current;
        if (!canvas) return;
        canvas.width = source.width;
        canvas.height = source.height;
        canvas.getContext('2d')?.drawImage(source, 0, 0);
    }, [source]);

    // Source pixels per screen pixel, so the handles keep a finger-sized look.
    useEffect(() => {
        const canvas = view.current;
        if (!canvas) return;
        const update = () => canvas.clientWidth && setScale(source.width / canvas.clientWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(canvas);

        return () => observer.disconnect();
    }, [source]);

    const toSource = (e: ReactPointerEvent): Point => {
        const rect = svg.current!.getBoundingClientRect();
        return {
            x: clamp(((e.clientX - rect.left) / rect.width) * source.width, 0, source.width),
            y: clamp(((e.clientY - rect.top) / rect.height) * source.height, 0, source.height),
        };
    };

    const drawLoupe = (p: Point) => {
        const ctx = loupe.current?.getContext('2d');
        if (!ctx) return;
        const span = 70 * scale * 0.5;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, LOUPE, LOUPE);
        ctx.drawImage(source, p.x - span / 2, p.y - span / 2, span, span, 0, 0, LOUPE, LOUPE);
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(LOUPE / 2, 0);
        ctx.lineTo(LOUPE / 2, LOUPE);
        ctx.moveTo(0, LOUPE / 2);
        ctx.lineTo(LOUPE, LOUPE / 2);
        ctx.stroke();
    };

    const onDown = (e: ReactPointerEvent<SVGSVGElement>) => {
        const p = toSource(e);
        let best = -1;
        let bestDistance = Infinity;
        quad.forEach((c, i) => {
            const d = Math.hypot(c.x - p.x, c.y - p.y);
            if (d < bestDistance) [best, bestDistance] = [i, d];
        });
        // Within about 50 screen pixels of a corner: grab it.
        if (bestDistance / scale > 50) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(best);
        drawLoupe(quad[best]);
    };

    const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
        if (dragging === null) return;
        const p = toSource(e);
        const next = [...quad] as Quad;
        next[dragging] = p;
        onChange(next);
        drawLoupe(p);
    };

    const onUp = () => setDragging(null);

    const r = 13 * scale;
    const points = quad.map((p) => `${p.x},${p.y}`).join(' ');
    const loupeOnRight = dragging !== null && quad[dragging].x < source.width / 2;

    return (
        <div className="relative inline-block select-none">
            <canvas ref={view} className="block max-h-[58dvh] max-w-full" />
            <svg
                ref={svg}
                viewBox={`0 0 ${source.width} ${source.height}`}
                className="absolute inset-0 size-full touch-none"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
            >
                <path
                    d={`M0,0H${source.width}V${source.height}H0Z M${points.replaceAll(' ', ' L')}Z`}
                    fill="rgba(15,23,42,0.55)"
                    fillRule="evenodd"
                />
                <polygon points={points} fill="none" stroke="#2dd4bf" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                {quad.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={dragging === i ? r * 1.25 : r}
                        fill="rgba(45,212,191,0.35)"
                        stroke="#fff"
                        strokeWidth={2.5}
                        vectorEffect="non-scaling-stroke"
                        className="cursor-grab"
                    />
                ))}
            </svg>
            <canvas
                ref={loupe}
                width={LOUPE}
                height={LOUPE}
                aria-hidden
                className={`pointer-events-none absolute top-2 size-[120px] rounded-full border-2 border-white shadow-lg ${
                    dragging === null ? 'hidden' : loupeOnRight ? 'right-2' : 'left-2'
                }`}
            />
        </div>
    );
}

async function loadSource(file: File): Promise<HTMLCanvasElement> {
    // createImageBitmap applies the phone's EXIF rotation.
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, SOURCE_MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    return canvas;
}

/** A book-shaped frame in the middle of the photo to start from. */
function defaultQuad(canvas: HTMLCanvasElement): Quad {
    const { width: w, height: h } = canvas;
    let fw = w * 0.8;
    let fh = fw * 1.45;
    if (fh > h * 0.85) {
        fh = h * 0.85;
        fw = fh / 1.45;
    }
    const x = (w - fw) / 2;
    const y = (h - fh) / 2;

    return [
        { x, y },
        { x: x + fw, y },
        { x: x + fw, y: y + fh },
        { x, y: y + fh },
    ];
}

function fullQuad(canvas: HTMLCanvasElement): Quad {
    const { width: w, height: h } = canvas;

    return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
    ];
}

function rotateCanvas(source: HTMLCanvasElement, clockwise: boolean) {
    const canvas = document.createElement('canvas');
    canvas.width = source.height;
    canvas.height = source.width;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(((clockwise ? 1 : -1) * Math.PI) / 2);
    ctx.drawImage(source, -source.width / 2, -source.height / 2);

    const map = (p: Point): Point => (clockwise ? { x: source.height - p.y, y: p.x } : { x: p.y, y: source.width - p.x });

    return { canvas, map };
}

/** Maps the unit square onto the quad (Heckbert's square-to-quad projection). */
function projection([p0, p1, p2, p3]: Quad) {
    const dx1 = p1.x - p2.x;
    const dx2 = p3.x - p2.x;
    const dx3 = p0.x - p1.x + p2.x - p3.x;
    const dy1 = p1.y - p2.y;
    const dy2 = p3.y - p2.y;
    const dy3 = p0.y - p1.y + p2.y - p3.y;
    const det = dx1 * dy2 - dx2 * dy1;
    const g = det === 0 ? 0 : (dx3 * dy2 - dx2 * dy3) / det;
    const h = det === 0 ? 0 : (dx1 * dy3 - dx3 * dy1) / det;
    const a = p1.x - p0.x + g * p1.x;
    const b = p3.x - p0.x + h * p3.x;
    const d = p1.y - p0.y + g * p1.y;
    const e = p3.y - p0.y + h * p3.y;

    return (u: number, v: number): [number, number] => {
        const w = g * u + h * v + 1;

        return [(a * u + b * v + p0.x) / w, (d * u + e * v + p0.y) / w];
    };
}

/** The quad straightened into a rectangle, sampled bilinearly. */
function warp(source: HTMLCanvasElement, quad: Quad): HTMLCanvasElement {
    const [tl, tr, br, bl] = quad;
    const width = Math.max(dist(tl, tr), dist(bl, br));
    const height = Math.max(dist(tl, bl), dist(tr, br));
    const ratio = Math.min(1, OUTPUT_MAX / Math.max(width, height));
    const W = Math.max(1, Math.round(width * ratio));
    const H = Math.max(1, Math.round(height * ratio));

    const sw = source.width;
    const sh = source.height;
    const src = source.getContext('2d')!.getImageData(0, 0, sw, sh).data;
    const out = new ImageData(W, H);
    const dst = out.data;
    const map = projection(quad);

    for (let j = 0; j < H; j++) {
        const v = (j + 0.5) / H;
        for (let i = 0; i < W; i++) {
            const [x, y] = map((i + 0.5) / W, v);
            const fx = clamp(x - 0.5, 0, sw - 1);
            const fy = clamp(y - 0.5, 0, sh - 1);
            const x0 = Math.floor(fx);
            const y0 = Math.floor(fy);
            const x1 = Math.min(x0 + 1, sw - 1);
            const y1 = Math.min(y0 + 1, sh - 1);
            const ax = fx - x0;
            const ay = fy - y0;
            const i00 = (y0 * sw + x0) * 4;
            const i10 = (y0 * sw + x1) * 4;
            const i01 = (y1 * sw + x0) * 4;
            const i11 = (y1 * sw + x1) * 4;
            const o = (j * W + i) * 4;
            for (let c = 0; c < 3; c++) {
                const top = src[i00 + c] + (src[i10 + c] - src[i00 + c]) * ax;
                const bottom = src[i01 + c] + (src[i11 + c] - src[i01 + c]) * ax;
                dst[o + c] = top + (bottom - top) * ay;
            }
            dst[o + 3] = 255;
        }
    }

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.getContext('2d')!.putImageData(out, 0, 0);

    return canvas;
}

function dist(a: Point, b: Point) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}
