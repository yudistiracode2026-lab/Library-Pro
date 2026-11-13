import AppLogoIcon from '@/components/app-logo-icon';
import { ColumnChart } from '@/components/charts';
import { duration } from '@/components/staf/ui';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CircleAlert, CircleCheck, LogIn, LogOut, ScanLine } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react';

/** Where members sign in, shown as a QR to open on their phone. */
const SITE_URL = 'https://pustagra.unrest.pro';

interface Recent {
    id: number;
    name: string | null;
    in: string;
    out: string | null;
    minutes: number | null;
}

interface Column {
    label: string;
    value: number;
    tip: string;
}

interface Chart {
    week: Column[];
    year: Column[];
}

interface MejaProps {
    codeLength: number;
    inside: number;
    recent: Recent[];
    chart: Chart;
}

type Status = 'masuk' | 'keluar' | 'ulang' | 'error';

interface Result {
    status: Status;
    message: string;
    name: string | null;
    number: string | null;
    time: string | null;
    minutes: number | null;
}

const SHOWN_MS = 6000;

const LOOK: Record<Status, { box: string; label: string; icon: ComponentType<{ className?: string }> }> = {
    masuk: { box: 'bg-success-soft text-success', label: 'Masuk', icon: LogIn },
    keluar: { box: 'bg-teal-100 text-teal-800', label: 'Keluar', icon: LogOut },
    ulang: { box: 'bg-slate-100 text-fg-2', label: 'Sudah tercatat', icon: CircleCheck },
    error: { box: 'bg-danger-soft text-danger', label: 'Gagal', icon: CircleAlert },
};

/** A short tone so the desk can be used without watching the screen. */
function beep(ok: boolean) {
    try {
        const audio = new AudioContext();
        const tone = audio.createOscillator();
        const gain = audio.createGain();
        tone.frequency.value = ok ? 880 : 220;
        gain.gain.value = 0.08;
        tone.connect(gain).connect(audio.destination);
        tone.start();
        tone.stop(audio.currentTime + (ok ? 0.12 : 0.35));
    } catch {
        // Sound is only a convenience.
    }
}

function xsrf(): string {
    return decodeURIComponent(document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
}

/**
 * The screen at the attendance desk. A USB scanner types like a keyboard, so
 * the page listens to the keyboard wherever the focus is: a scan ends at the
 * full code length, or at Enter or Tab if the scanner sends one.
 */
export default function MejaPresensi({ codeLength, inside: startInside, recent: startRecent, chart: startChart }: MejaProps) {
    const [inside, setInside] = useState(startInside);
    const [recent, setRecent] = useState(startRecent);
    const [chart, setChart] = useState(startChart);
    const [range, setRange] = useState<keyof Chart>('week');
    const [result, setResult] = useState<Result | null>(null);
    const [expired, setExpired] = useState(false);
    const [focused, setFocused] = useState(true);
    const [now, setNow] = useState(new Date());
    const buffer = useRef('');
    const clearBuffer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const clearResult = useRef<ReturnType<typeof setTimeout>>(undefined);

    const show = useCallback((next: Result) => {
        setResult(next);
        beep(next.status === 'masuk' || next.status === 'keluar');
        clearTimeout(clearResult.current);
        clearResult.current = setTimeout(() => setResult(null), SHOWN_MS);
    }, []);

    const send = useCallback(
        async (code: string) => {
            try {
                const response = await fetch(route('staf.kunjungan.scan'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': xsrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ code }),
                });
                if (response.status === 401 || response.status === 419) {
                    setExpired(true);
                    return;
                }
                if (!response.ok) throw new Error(String(response.status));
                const data = await response.json();
                setInside(data.inside);
                setRecent(data.recent);
                setChart(data.chart);
                show(data);
            } catch {
                show({
                    status: 'error',
                    message: 'Tidak tersambung ke server. Coba pindai lagi.',
                    name: null,
                    number: null,
                    time: null,
                    minutes: null,
                });
            }
        },
        [show],
    );

    useEffect(() => {
        const flush = () => {
            const code = buffer.current;
            buffer.current = '';
            if (code.length >= 4) send(code);
        };
        const key = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                flush();
            } else if (e.key.length === 1) {
                buffer.current += e.key;
                clearTimeout(clearBuffer.current);
                if (buffer.current.length >= codeLength) {
                    flush();
                } else {
                    // Scanners type within milliseconds; a pause means stray keys, not a code.
                    clearTimeout(clearBuffer.current);
                    clearBuffer.current = setTimeout(() => (buffer.current = ''), 400);
                }
            }
        };
        window.addEventListener('keydown', key);

        return () => window.removeEventListener('keydown', key);
    }, [codeLength, send]);

    useEffect(() => {
        const tick = setInterval(() => {
            setNow(new Date());
            setFocused(document.hasFocus());
        }, 1000);

        return () => clearInterval(tick);
    }, []);

    const look = result ? LOOK[result.status] : null;

    return (
        <div className="bg-grad-leaf text-fg-1 flex min-h-screen flex-col gap-6 p-6 lg:p-10">
            <Head title="Meja presensi" />
            <div className="flex items-center gap-3 text-white">
                <AppLogoIcon className="size-12 rounded-full bg-white" />
                <div className="flex flex-col leading-tight">
                    <span className="font-display text-xl font-extrabold">Meja presensi</span>
                    <span className="text-sm text-teal-50">Perpustakaan Politeknik Agraria STPN</span>
                </div>
                <div className="ml-auto text-right">
                    <div className="font-display text-3xl font-extrabold tabular-nums">
                        {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm text-teal-50">{now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                </div>
            </div>

            {expired && (
                <div className="bg-danger-soft text-danger rounded-lg px-5 py-4 font-semibold">
                    Sesi login petugas habis, pindaian tidak tercatat.{' '}
                    <a href={route('staf.login')} className="underline">
                        Masuk lagi
                    </a>
                </div>
            )}
            {!focused && !expired && (
                <div className="bg-warning-soft rounded-lg px-5 py-4 font-semibold text-amber-800">
                    Klik di mana saja pada halaman ini supaya alat pemindai bisa terbaca.
                </div>
            )}

            <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
                <div className="flex flex-col gap-6">
                    <section
                        className="flex min-h-[300px] flex-1 flex-col items-center justify-center gap-5 rounded-xl bg-white p-8 text-center shadow-xl"
                        aria-live="polite"
                    >
                        {result && look ? (
                            <>
                                <span className={`flex items-center gap-2.5 rounded-full px-6 py-2.5 text-2xl font-extrabold ${look.box}`}>
                                    <look.icon className="size-7" />
                                    {look.label}
                                </span>
                                {result.name && (
                                    <span className="font-display text-4xl leading-tight font-extrabold text-balance">{result.name}</span>
                                )}
                                {result.number && <span className="text-fg-3 font-mono text-xl">{result.number}</span>}
                                <span className="text-fg-2 text-xl">{result.message}</span>
                                {result.status !== 'error' && result.time && (
                                    <span className="text-fg-2 text-lg">
                                        Pukul <b className="text-fg-1">{result.time}</b>
                                        {result.minutes !== null && (
                                            <>
                                                {' · '}di perpustakaan selama{' '}
                                                <b className="text-fg-1">
                                                    {duration(result.minutes) === '0 m' ? 'kurang dari 1 menit' : duration(result.minutes)}
                                                </b>
                                            </>
                                        )}
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="font-display flex items-center gap-3 text-4xl font-extrabold">
                                    <ScanLine className="size-11 text-teal-500" />
                                    Petunjuk Presensi Perpustakaan
                                </span>
                                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                                    <figure className="flex shrink-0 flex-col items-center gap-2">
                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <QRCodeSVG value={SITE_URL} size={156} marginSize={0} title={SITE_URL} />
                                        </div>
                                        <figcaption className="text-fg-3 text-sm font-semibold">{SITE_URL.replace('https://', '')}</figcaption>
                                    </figure>
                                    <ol className="text-fg-2 flex max-w-lg list-decimal flex-col gap-1.5 pl-6 text-left text-lg leading-snug text-pretty">
                                        <li>
                                            Scan QR code berikut dengan kamera HP, lalu klik <b className="text-fg-1">Masuk</b>.
                                        </li>
                                        <li>
                                            Masukkan <b className="text-fg-1">NIM</b> sebagai nama pengguna dan kata sandi.
                                        </li>
                                        <li>
                                            Centang <b className="text-fg-1">Ingat saya</b> dan{' '}
                                            <b className="text-fg-1">Gunakan HP ini untuk presensi</b>.
                                        </li>
                                        <li>
                                            Tunjukkan QR code di HP ke alat pemindai sebagai tanda <b className="text-fg-1">masuk</b> dan{' '}
                                            <b className="text-fg-1">keluar</b>.
                                        </li>
                                    </ol>
                                </div>
                                <span className="text-fg-2 text-base font-semibold">
                                    Ke depan tidak perlu login lagi, QR code langsung tampil saat situs dibuka.
                                </span>
                            </>
                        )}
                    </section>

                    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-col">
                                <span className="text-fg-2 font-semibold">
                                    {range === 'week' ? 'Kunjungan minggu ini' : `Kunjungan tahun ${now.getFullYear()}`}
                                </span>
                                <span className="text-fg-3 text-sm">
                                    {chart[range].reduce((sum, c) => sum + c.value, 0).toLocaleString('id-ID')} kunjungan
                                </span>
                            </div>
                            <div className="flex rounded-lg bg-slate-100 p-1 text-sm font-semibold" role="group" aria-label="Rentang grafik">
                                {(['week', 'year'] as const).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        aria-pressed={range === key}
                                        onClick={() => setRange(key)}
                                        className={`cursor-pointer rounded-md px-3 py-1.5 ${range === key ? 'text-fg-1 bg-white shadow-sm' : 'text-fg-3 hover:text-fg-1'}`}
                                    >
                                        {key === 'week' ? 'Mingguan' : 'Bulanan'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ColumnChart
                            items={chart[range]}
                            caption={range === 'week' ? 'Kunjungan per hari, Senin sampai Minggu' : 'Kunjungan per bulan tahun ini'}
                            height={150}
                        />
                    </section>
                </div>

                <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-xl">
                    <div className="flex items-baseline justify-between">
                        <span className="text-fg-2 font-semibold">Sedang di perpustakaan</span>
                        <span className="font-display text-4xl font-extrabold text-teal-600">{inside}</span>
                    </div>
                    <div className="flex min-h-[240px] flex-1 flex-col">
                        <span className="text-fg-3 pb-2 text-xs font-semibold tracking-[.06em] uppercase">
                            Catatan hari ini{recent.length > 0 && ` · ${recent.length}`}
                        </span>
                        {/* On wide screens the list takes no height of its own: it fills what the left column leaves and scrolls. */}
                        <div className="relative flex-1">
                            <div className="max-h-[60vh] overflow-y-auto lg:absolute lg:inset-0 lg:max-h-none">
                                <table className="w-full table-fixed text-sm">
                                    <thead className="sticky top-0 bg-white">
                                        <tr className="text-fg-3 border-y border-slate-200 text-left text-xs">
                                            <th className="py-2 font-semibold">Nama</th>
                                            <th className="w-14 py-2 font-semibold">Masuk</th>
                                            <th className="w-14 py-2 font-semibold">Keluar</th>
                                            <th className="w-[72px] py-2 text-right font-semibold">Durasi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent.map((r) => (
                                            <tr key={r.id} className="border-b border-slate-200 last:border-0">
                                                <td className="py-2.5 pr-2">
                                                    <span className="block truncate font-semibold">{r.name}</span>
                                                </td>
                                                <td className="py-2.5 font-mono text-xs">{r.in}</td>
                                                <td className="py-2.5 font-mono text-xs">{r.out ?? '–'}</td>
                                                <td className="py-2.5 text-right font-mono text-xs">
                                                    {r.minutes === null ? (
                                                        <span className="font-sans font-semibold text-teal-700">Di dalam</span>
                                                    ) : r.minutes === 0 ? (
                                                        '< 1 m'
                                                    ) : (
                                                        duration(r.minutes)
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {recent.length === 0 && <p className="text-fg-3 py-6 text-center text-sm">Belum ada pindaian hari ini.</p>}
                            </div>
                        </div>
                    </div>
                    <Link
                        href={route('staf.kunjungan')}
                        className="text-fg-3 mt-auto flex items-center gap-1.5 text-sm font-semibold hover:text-teal-700"
                    >
                        <ArrowLeft className="size-4" />
                        Kunjungan & presensi
                    </Link>
                </section>
            </div>
        </div>
    );
}
