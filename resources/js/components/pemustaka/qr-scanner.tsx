import { router } from '@inertiajs/react';
import { Check, ScanLine, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
    /** Entering needs a purpose; leaving does not. */
    entering: boolean;
    purposes: string[];
    firstName: string;
    onClose: () => void;
}

/**
 * Reads the kiosk QR with the phone camera and records presensi straight
 * away. Without camera access (no HTTPS, or permission denied) the member
 * can still scan with the phone's own camera app.
 */
export function QrScanner({ entering, purposes, firstName, onClose }: QrScannerProps) {
    const video = useRef<HTMLVideoElement>(null);
    const [purpose, setPurpose] = useState(purposes[0]);
    const [state, setState] = useState<'scan' | 'sending' | 'done' | 'error'>('scan');
    const [message, setMessage] = useState('');
    const purposeRef = useRef(purpose);
    purposeRef.current = purpose;

    useEffect(() => {
        let stream: MediaStream | null = null;
        let timer: number | undefined;
        let stopped = false;

        (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            } catch {
                setState('error');
                setMessage('Kamera tidak bisa dibuka di sini. Pakai aplikasi kamera HP untuk memindai QR di layar kios, ya.');
                return;
            }
            if (stopped || !video.current) return;
            video.current.srcObject = stream;
            await video.current.play().catch(() => undefined);

            const jsQR = (await import('jsqr')).default;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

            const tick = () => {
                const v = video.current;
                if (stopped || !v || !v.videoWidth) {
                    timer = window.setTimeout(tick, 250);
                    return;
                }
                canvas.width = v.videoWidth;
                canvas.height = v.videoHeight;
                ctx.drawImage(v, 0, 0);
                const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                const token = code ? tokenFrom(code.data) : null;

                if (token) {
                    stopped = true;
                    stream?.getTracks().forEach((t) => t.stop());
                    setState('sending');
                    router.post(
                        route('presensi.store'),
                        { t: token, purpose: purposeRef.current },
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                setState('done');
                                setMessage(entering ? `Selamat datang, ${firstName}!` : `Sampai jumpa, ${firstName}!`);
                            },
                            onError: () => {
                                setState('error');
                                setMessage('QR tidak dikenali. Pindai lagi QR di layar kios, ya.');
                            },
                        },
                    );
                    return;
                }
                timer = window.setTimeout(tick, 250);
            };
            tick();
        })();

        return () => {
            stopped = true;
            clearTimeout(timer);
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, [entering, firstName]);

    return (
        <div className="fixed inset-0 z-[70] flex flex-col bg-slate-900 text-white">
            <div className="flex h-14 flex-none items-center gap-3 px-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] bg-white/10 px-3 text-[13px] font-semibold"
                >
                    <X className="size-4" />
                    {state === 'done' ? 'Tutup' : 'Batal'}
                </button>
                <span className="text-[15px] font-semibold">Scan QR presensi</span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
                <div className="relative grid aspect-square w-[min(300px,75vw)] place-items-center overflow-hidden rounded-xl border-[3px] border-white/85 bg-slate-800">
                    {state === 'done' ? (
                        <div className="flex flex-col items-center gap-2.5">
                            <span className="bg-success grid size-[72px] place-items-center rounded-full">
                                <Check className="size-9" />
                            </span>
                            <span className="text-base font-bold">QR terbaca</span>
                        </div>
                    ) : (
                        <>
                            <video ref={video} muted playsInline className="absolute inset-0 size-full object-cover" />
                            <div className="absolute inset-x-[8%] h-[3px] [animation:scanline_2.4s_cubic-bezier(0.65,0,0.35,1)_infinite] rounded-[3px] bg-teal-300 shadow-[0_0_16px_var(--color-teal-300)]" />
                            {state === 'sending' && <span className="relative text-sm">Mencatat presensi…</span>}
                        </>
                    )}
                </div>
                {state === 'scan' && (
                    <>
                        {entering && (
                            <label className="flex items-center gap-2 text-sm text-slate-300">
                                Keperluan
                                <select
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    className="h-10 rounded-[10px] bg-white px-3 text-sm text-slate-900"
                                >
                                    {purposes.map((p) => (
                                        <option key={p}>{p}</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <span className="flex max-w-xs items-center gap-2 text-center text-sm text-slate-300">
                            <ScanLine className="size-4 flex-none" />
                            Arahkan kamera ke QR code di layar kios pintu masuk perpustakaan.
                        </span>
                    </>
                )}
                {(state === 'done' || state === 'error') && (
                    <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                        <span className="font-display text-[22px] font-extrabold">{state === 'done' ? message : 'Belum berhasil'}</span>
                        {state === 'error' && <span className="text-sm text-slate-300">{message}</span>}
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-[46px] cursor-pointer rounded-md bg-white px-6 text-[15px] font-bold text-teal-700"
                        >
                            Selesai
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/** The kiosk QR holds a link to /presensi?t=…; take the token from it. */
function tokenFrom(data: string): string | null {
    try {
        const url = new URL(data, window.location.origin);
        return url.pathname.endsWith('/presensi') ? url.searchParams.get('t') : null;
    } catch {
        return null;
    }
}
