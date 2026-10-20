import AppLogoIcon from '@/components/app-logo-icon';
import { type KioskQr, useKioskQr } from '@/hooks/use-kiosk-qr';
import { Head } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

/** Full-screen display for the entrance kiosk. */
export default function Kios({ qr }: { qr: KioskQr }) {
    const left = useKioskQr(qr);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <Head title="Kios presensi" />
            <div className="bg-grad-leaf flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-white">
                <div className="flex items-center gap-3">
                    <AppLogoIcon className="size-14 rounded-full bg-white" />
                    <div className="flex flex-col leading-tight">
                        <span className="font-display text-xl font-extrabold tracking-[.04em]">PUSTAGRA</span>
                        <span className="text-sm text-teal-50">Perpustakaan Politeknik Agraria STPN</span>
                    </div>
                </div>
                <h1 className="text-center text-4xl font-extrabold text-balance">Pindai untuk presensi masuk atau keluar</h1>
                <div className="w-[388px] max-w-full rounded-xl bg-white p-6 shadow-xl">
                    <QRCodeSVG value={qr.url} size={340} marginSize={0} fgColor="#0F0E0A" style={{ width: '100%', height: 'auto' }} />
                </div>
                <div className="flex w-[388px] max-w-full flex-col gap-2">
                    <div className="h-2 overflow-hidden rounded-full bg-white/25">
                        <div
                            className="h-full rounded-full bg-white transition-[width] duration-1000 ease-linear"
                            style={{ width: `${(left / qr.period) * 100}%` }}
                        />
                    </div>
                    <span className="text-center text-sm font-semibold">Kode baru dalam {left} detik</span>
                </div>
                <p className="max-w-md text-center text-lg text-teal-50">
                    Buka kamera HP, arahkan ke kode di atas, lalu ketuk tautan yang muncul. Masuk dengan akun pemustaka kamu, ya.
                </p>
                <span className="font-mono text-2xl font-semibold">
                    {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
            </div>
        </>
    );
}
