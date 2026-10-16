import { ChevronLeft, ChevronRight, Lock, Timer, X, ZoomIn, ZoomOut } from 'lucide-react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useCallback, useEffect, useRef, useState } from 'react';

type PdfDocument = import('pdfjs-dist').PDFDocumentProxy;

interface PdfReaderProps {
    file: string;
    title: string;
    initialPage?: number;
    /** Called (debounced) with the page being read, to remember progress. */
    progressUrl?: string;
    onClose: () => void;
    closeLabel?: string;
    /** Text tiled over each page (name, NIM, time) for on-site reading. */
    watermark?: string;
    /** Session end (ms timestamp); the reader closes itself then. */
    endsAt?: number;
    /** Shown on the right of the top bar, e.g. "Akses s.d. 26 Okt 2026". */
    note?: string;
    locked?: boolean;
}

/**
 * Full-screen PDF reader drawn on a canvas with pdf.js: no text layer, no
 * download or print button, and the usual copy/save/print shortcuts are
 * blocked. It deters copying; it cannot stop a determined user.
 */
export function PdfReader({
    file,
    title,
    initialPage = 1,
    progressUrl,
    onClose,
    closeLabel = 'Tutup',
    watermark,
    endsAt,
    note,
    locked,
}: PdfReaderProps) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [doc, setDoc] = useState<PdfDocument | null>(null);
    const [page, setPage] = useState(initialPage);
    const [width, setWidth] = useState(640);
    const [error, setError] = useState<string | null>(null);
    const [left, setLeft] = useState(endsAt ? Math.max(0, endsAt - Date.now()) : 0);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
                const loaded = await pdfjs.getDocument({ url: file, withCredentials: true }).promise;
                if (!cancelled) {
                    setDoc(loaded);
                    setPage((p) => Math.min(Math.max(1, p), loaded.numPages));
                }
            } catch {
                if (!cancelled) setError('Berkas tidak bisa dibuka. Muat ulang halaman, atau hubungi petugas.');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [file]);

    useEffect(() => {
        if (!doc || !canvas.current) return;
        let task: { cancel: () => void } | null = null;

        doc.getPage(page).then((p) => {
            const base = p.getViewport({ scale: 1 });
            const scale = width / base.width;
            const ratio = window.devicePixelRatio || 1;
            const viewport = p.getViewport({ scale: scale * ratio });
            const el = canvas.current!;
            el.width = viewport.width;
            el.height = viewport.height;
            el.style.width = `${viewport.width / ratio}px`;
            el.style.height = `${viewport.height / ratio}px`;
            const render = p.render({ canvasContext: el.getContext('2d')!, viewport });
            task = render;
            render.promise.catch(() => undefined);
        });

        return () => task?.cancel();
    }, [doc, page, width]);

    // Remember the page a moment after the reader stops on it.
    useEffect(() => {
        if (!progressUrl) return;
        const timer = setTimeout(() => {
            const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
            fetch(progressUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': token },
                credentials: 'same-origin',
                body: JSON.stringify({ page }),
            }).catch(() => undefined);
        }, 800);

        return () => clearTimeout(timer);
    }, [page, progressUrl]);

    useEffect(() => {
        if (!endsAt) return;
        const timer = setInterval(() => {
            const remaining = Math.max(0, endsAt - Date.now());
            setLeft(remaining);
            if (remaining === 0) onClose();
        }, 1000);

        return () => clearInterval(timer);
    }, [endsAt, onClose]);

    const warn = useCallback((message: string) => {
        setNotice(message);
        setTimeout(() => setNotice(null), 2400);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c', 'a'].includes(k)) {
                e.preventDefault();
                warn('Teks lengkap hanya bisa dibaca di layar ini, ya.');
            }
            if (k === 'arrowright') setPage((p) => Math.min(doc?.numPages ?? p, p + 1));
            if (k === 'arrowleft') setPage((p) => Math.max(1, p - 1));
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [doc, warn]);

    const pages = doc?.numPages ?? 0;
    const go = (n: number) => setPage(Math.min(Math.max(1, n), pages || 1));
    const mm = (ms: number) => {
        const s = Math.floor(ms / 1000);
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    const control = 'grid size-10 cursor-pointer place-items-center rounded-[10px] bg-white/10 text-white hover:bg-white/20';

    return (
        <div
            className="fixed inset-0 z-[70] flex flex-col bg-slate-800 select-none"
            onContextMenu={(e) => {
                e.preventDefault();
                warn('Teks lengkap hanya bisa dibaca di layar ini, ya.');
            }}
            onCopy={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
        >
            <div className="flex h-14 flex-none items-center gap-3 bg-slate-900 px-4 text-white">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] bg-white/10 px-3 text-[13px] font-semibold hover:bg-white/20"
                >
                    <X className="size-4" />
                    {closeLabel}
                </button>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</span>
                {locked && (
                    <span className="hidden items-center gap-1.5 text-xs whitespace-nowrap text-slate-300 md:flex">
                        <Lock className="size-3.5" />
                        Unduh, cetak, dan salin dinonaktifkan
                    </span>
                )}
                {note && <span className="text-xs whitespace-nowrap text-slate-300">{note}</span>}
                {endsAt && (
                    <span
                        className={`flex h-[30px] items-center gap-1.5 rounded-full px-2.5 font-mono text-[13px] whitespace-nowrap ${left < 300000 ? 'bg-danger' : 'bg-white/10'}`}
                    >
                        <Timer className="size-3.5" />
                        {mm(left)}
                    </span>
                )}
            </div>

            <div className="flex min-h-0 flex-1">
                {pages > 1 && (
                    <div className="hidden w-[180px] flex-none flex-col gap-0.5 overflow-auto bg-slate-900 p-3 text-slate-300 md:flex">
                        <span className="px-2 py-1.5 text-[11px] font-semibold tracking-[.08em] text-slate-400 uppercase">Halaman</span>
                        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => go(n)}
                                className={`flex cursor-pointer justify-between rounded-[8px] px-2 py-1.5 text-left text-[13px] ${n === page ? 'bg-teal-400/20 text-white' : 'hover:bg-white/5'}`}
                            >
                                Halaman {n}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex-1 overflow-auto p-6">
                    <div className="relative mx-auto w-fit overflow-hidden rounded-[4px] bg-white shadow-xl">
                        <canvas ref={canvas} className="block" />
                        {!doc && !error && (
                            <div className="text-fg-3 grid h-[400px] w-[min(640px,80vw)] place-items-center text-sm">Membuka berkas…</div>
                        )}
                        {error && (
                            <div className="text-danger grid h-[300px] w-[min(640px,80vw)] place-items-center p-6 text-center text-sm">{error}</div>
                        )}
                        {watermark && doc && (
                            <div className="pointer-events-none absolute -inset-[20%] grid rotate-[-28deg] grid-cols-2 content-center gap-x-10 gap-y-16">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <span key={i} className="text-center text-[15px] font-bold whitespace-nowrap text-slate-900 opacity-[.08]">
                                        {watermark}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex h-[60px] flex-none flex-wrap items-center justify-center gap-3.5 bg-slate-900 text-white">
                <button type="button" title="Perkecil" onClick={() => setWidth((w) => Math.max(400, w - 80))} className={control}>
                    <ZoomOut className="size-[17px]" />
                </button>
                <button type="button" aria-label="Halaman sebelumnya" onClick={() => go(page - 1)} className={control}>
                    <ChevronLeft className="size-[18px]" />
                </button>
                <span className="min-w-[72px] text-center font-mono text-[13px]">
                    {page} / {pages || '–'}
                </span>
                <button type="button" aria-label="Halaman berikutnya" onClick={() => go(page + 1)} className={control}>
                    <ChevronRight className="size-[18px]" />
                </button>
                <button type="button" title="Perbesar" onClick={() => setWidth((w) => Math.min(1000, w + 80))} className={control}>
                    <ZoomIn className="size-[17px]" />
                </button>
            </div>

            {notice && (
                <div className="fixed top-20 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2.5 rounded-[14px] bg-slate-900 px-[18px] py-3.5 text-sm text-white shadow-lg">
                    <Lock className="size-[18px] text-teal-300" />
                    {notice}
                </div>
            )}
        </div>
    );
}
