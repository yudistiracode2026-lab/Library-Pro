import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Presence {
    inside: boolean;
    kind: string;
    time: string;
    minutes: number;
}

export interface PresenceQrData {
    code: string;
    secondsLeft: number;
    period: number;
    presence: Presence | null;
}

const CHECK_EVERY_MS = 5000;

function spent(minutes: number): string {
    if (minutes < 1) return 'kurang dari 1 menit';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return [h ? `${h} jam` : '', m ? `${m} menit` : ''].filter(Boolean).join(' ');
}

/**
 * The member's own rotating QR, shown to the scanner at the attendance desk.
 * It refreshes before it expires and notices when the desk has recorded them.
 */
export function PresenceQr({ initial, purposes }: { initial: PresenceQrData; purposes: string[] }) {
    const [data, setData] = useState(initial);
    const [left, setLeft] = useState(initial.secondsLeft);
    const [purpose, setPurpose] = useState(0);
    const [offline, setOffline] = useState(false);
    const expiresAt = useRef(Date.now() + initial.secondsLeft * 1000);

    const refresh = useCallback(async (keperluan: number) => {
        try {
            const response = await fetch(`${route('pemustaka.presensi.code')}?keperluan=${keperluan}`, { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error(String(response.status));
            const next: PresenceQrData = await response.json();
            expiresAt.current = Date.now() + next.secondsLeft * 1000;
            setData(next);
            setLeft(next.secondsLeft);
            setOffline(false);
        } catch {
            setOffline(true);
        }
    }, []);

    useEffect(() => {
        // Only while the page is on screen: a phone in a pocket should not keep asking.
        const check = setInterval(() => document.visibilityState === 'visible' && refresh(purpose), CHECK_EVERY_MS);
        const tick = setInterval(() => {
            const remaining = Math.ceil((expiresAt.current - Date.now()) / 1000);
            setLeft(Math.max(0, remaining));
            if (remaining <= 0 && document.visibilityState === 'visible') refresh(purpose);
        }, 1000);
        const back = () => document.visibilityState === 'visible' && refresh(purpose);
        document.addEventListener('visibilitychange', back);

        return () => {
            clearInterval(check);
            clearInterval(tick);
            document.removeEventListener('visibilitychange', back);
        };
    }, [purpose, refresh]);

    const { presence } = data;
    const inside = !!presence?.inside;
    const stale = offline || left <= 0;

    return (
        <section className="bg-grad-leaf flex flex-col gap-4 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold tracking-[.08em] text-teal-50 uppercase">Presensi perpustakaan</span>
                    <span className="font-display text-xl font-extrabold">
                        {inside ? 'Kamu sedang di perpustakaan' : presence ? 'Kamu sudah keluar' : 'Belum presensi hari ini'}
                    </span>
                    <span className="text-[13px] text-teal-50">
                        {presence
                            ? inside
                                ? `Masuk pukul ${presence.time} · sudah ${spent(presence.minutes)}`
                                : `Keluar pukul ${presence.time} · di perpustakaan ${spent(presence.minutes)}`
                            : 'Tunjukkan QR ini ke alat pemindai saat masuk dan keluar.'}
                    </span>
                </div>
                <span className="flex-none rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">{inside ? 'Di dalam' : 'Di luar'}</span>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-[14px] bg-white p-5 text-teal-800">
                <div className={stale ? 'opacity-20' : ''}>
                    <QRCodeSVG value={data.code} size={220} level="M" marginSize={2} fgColor="#000000" bgColor="#ffffff" />
                </div>
                <div className="flex w-[220px] flex-col gap-1.5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-teal-50">
                        <div
                            className="h-full rounded-full bg-teal-400 transition-[width] duration-1000 ease-linear"
                            style={{ width: `${(left / data.period) * 100}%` }}
                        />
                    </div>
                    <span className="text-center text-xs font-semibold">
                        {offline ? 'Tidak tersambung, QR tidak bisa dipakai' : `Kode baru dalam ${left} detik`}
                    </span>
                </div>
            </div>

            {!inside && (
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                    Keperluan
                    <select
                        value={purpose}
                        onChange={(e) => {
                            const next = Number(e.target.value);
                            setPurpose(next);
                            refresh(next);
                        }}
                        className="text-fg-1 h-11 rounded-[10px] bg-white px-3 text-sm font-normal"
                    >
                        {purposes.map((p, i) => (
                            <option key={p} value={i}>
                                {p}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            <span className="text-xs">Naikkan kecerahan layar HP supaya QR mudah terbaca.</span>
        </section>
    );
}
