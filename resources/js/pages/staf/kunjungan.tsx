import { Badge } from '@/components/staf/master/cells';
import { Button, Card, CardTitle, initials, inputClass, PillTabs } from '@/components/staf/ui';
import { type KioskQr, useKioskQr } from '@/hooks/use-kiosk-qr';
import StafLayout from '@/layouts/staf-layout';
import { router, useForm } from '@inertiajs/react';
import { LogOut, Monitor, UserPlus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { type FormEvent } from 'react';

interface VisitRow {
    id: number;
    name: string;
    detail: string;
    purpose: string;
    method: string;
    in: string;
    out: string | null;
}

interface KunjunganProps {
    stats: { total: number; inside: number; out: number; purposes: { label: string; total: number }[] };
    visits: VisitRow[];
    filter: '' | 'dalam' | 'keluar';
    purposes: string[];
    qr: KioskQr;
}

export default function Kunjungan({ stats, visits, filter, purposes, qr }: KunjunganProps) {
    const left = useKioskQr(qr);
    const form = useForm({ mode: 'anggota', member_number: '', guest_name: '', guest_org: '', purpose: purposes[0] });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('staf.kunjungan.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('member_number', 'guest_name', 'guest_org'),
        });
    };

    return (
        <StafLayout title="Kunjungan & presensi" group="Layanan">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
                <Stat label="Total pengunjung hari ini" value={stats.total} sub="semua yang masuk sejak buka" />
                <Stat label="Sedang di perpustakaan" value={stats.inside} sub="sudah masuk, belum keluar" accent />
                <Stat label="Sudah pulang" value={stats.out} sub="sudah tercatat keluar" />
                <div className="flex flex-col gap-1.5 rounded-lg bg-white px-[18px] py-4 shadow-sm dark:bg-slate-800">
                    <span className="text-fg-3 text-[13px]">Per keperluan</span>
                    {stats.purposes.map((p) => (
                        <div key={p.label} className="flex justify-between text-[13px]">
                            <span className="text-fg-2">{p.label}</span>
                            <span className="font-mono font-bold">{p.total}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 flex-[45_1_340px] flex-col gap-4">
                    <Card>
                        <CardTitle
                            aside={
                                <span className="text-success flex items-center gap-1.5 text-xs font-semibold">
                                    <span className="bg-success size-2 rounded-full" />
                                    Kios aktif · pintu masuk
                                </span>
                            }
                        >
                            QR presensi
                        </CardTitle>
                        <p className="text-fg-3 -mt-2 text-[13px] leading-relaxed">
                            Pemustaka memindai QR ini dengan kamera HP untuk mencatat masuk dan keluar. Kode berganti tiap {qr.period} detik.
                        </p>
                        <div className="flex flex-col items-center gap-3 rounded-lg bg-teal-50 p-6 dark:bg-teal-900">
                            <div className="rounded-lg bg-white p-4 shadow-md">
                                <QRCodeSVG value={qr.url} size={200} marginSize={0} fgColor="#0F0E0A" />
                            </div>
                            <div className="flex w-[232px] flex-col gap-1.5">
                                <div className="h-1.5 overflow-hidden rounded-full bg-white">
                                    <div
                                        className="h-full rounded-full bg-teal-400 transition-[width] duration-1000 ease-linear"
                                        style={{ width: `${(left / qr.period) * 100}%` }}
                                    />
                                </div>
                                <span className="text-center text-xs font-semibold text-teal-700 dark:text-teal-200">
                                    Kode baru dalam {left} detik
                                </span>
                            </div>
                        </div>
                        <a
                            href={route('staf.kunjungan.kiosk')}
                            target="_blank"
                            rel="noreferrer"
                            className="shadow-teal flex h-[46px] items-center justify-center gap-2 rounded-md bg-teal-400 text-[15px] font-semibold text-white hover:bg-teal-500"
                        >
                            <Monitor className="size-4" />
                            Tampilkan di layar kios
                        </a>
                    </Card>

                    <Card>
                        <CardTitle>Catat manual</CardTitle>
                        <form onSubmit={submit} className="flex flex-col gap-3">
                            <div className="flex gap-1 self-start rounded-md bg-slate-100 p-1 dark:bg-slate-700">
                                {[
                                    ['anggota', 'Anggota'],
                                    ['tamu', 'Tamu umum'],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => form.setData('mode', value)}
                                        className={`h-[34px] cursor-pointer rounded-[9px] px-4 text-[13px] font-semibold ${form.data.mode === value ? 'text-fg-1 bg-white shadow-sm dark:bg-slate-800' : 'text-fg-3'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            {form.data.mode === 'anggota' ? (
                                <>
                                    <p className="text-fg-3 text-[13px]">
                                        Untuk anggota yang tidak membawa HP. Ketik NIM/NIP untuk mencatat masuk atau keluar.
                                    </p>
                                    <input
                                        value={form.data.member_number}
                                        onChange={(e) => form.setData('member_number', e.target.value)}
                                        placeholder="NIM / NIP, mis. 20220145"
                                        aria-label="NIM / NIP"
                                        aria-invalid={!!form.errors.member_number}
                                        className={inputClass}
                                    />
                                    {form.errors.member_number && <span className="text-danger -mt-1 text-xs">{form.errors.member_number}</span>}
                                </>
                            ) : (
                                <>
                                    <p className="text-fg-3 text-[13px]">Untuk tamu dari luar kampus yang belum terdaftar sebagai anggota.</p>
                                    <input
                                        value={form.data.guest_name}
                                        onChange={(e) => form.setData('guest_name', e.target.value)}
                                        placeholder="Nama tamu"
                                        aria-label="Nama tamu"
                                        aria-invalid={!!form.errors.guest_name}
                                        className={inputClass}
                                    />
                                    {form.errors.guest_name && <span className="text-danger -mt-1 text-xs">{form.errors.guest_name}</span>}
                                    <input
                                        value={form.data.guest_org}
                                        onChange={(e) => form.setData('guest_org', e.target.value)}
                                        placeholder="Instansi asal"
                                        aria-label="Instansi asal"
                                        className={inputClass}
                                    />
                                </>
                            )}
                            <select
                                value={form.data.purpose}
                                onChange={(e) => form.setData('purpose', e.target.value)}
                                aria-label="Keperluan"
                                className={inputClass}
                            >
                                {purposes.map((p) => (
                                    <option key={p}>{p}</option>
                                ))}
                            </select>
                            <Button type="submit" disabled={form.processing}>
                                <UserPlus />
                                Catat kunjungan
                            </Button>
                        </form>
                    </Card>
                </div>

                <Card className="min-w-0 flex-[55_1_420px]">
                    <CardTitle
                        aside={
                            <PillTabs
                                tabs={[
                                    ['', 'Semua'],
                                    ['dalam', 'Di dalam'],
                                    ['keluar', 'Sudah keluar'],
                                ].map(([value, label]) => ({
                                    label,
                                    href: route('staf.kunjungan', value ? { status: value } : {}),
                                    active: filter === value,
                                }))}
                            />
                        }
                    >
                        Log kunjungan hari ini
                    </CardTitle>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-sm">
                            <thead className="text-fg-3 border-b border-slate-200 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700">
                                <tr>
                                    {['Pengunjung', 'Keperluan', 'Masuk', 'Keluar', 'Cara', ''].map((h) => (
                                        <th key={h} className="py-2.5 pr-3 font-semibold">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visits.map((v) => (
                                    <tr key={v.id} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="py-2.5 pr-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="grid size-9 flex-none place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                                                    {initials(v.name)}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="truncate font-semibold">{v.name}</div>
                                                    <div className="text-fg-3 truncate text-xs">{v.detail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-fg-2 py-2.5 pr-3">{v.purpose}</td>
                                        <td className="py-2.5 pr-3 font-mono">{v.in}</td>
                                        <td className={`py-2.5 pr-3 font-mono ${v.out ? '' : 'text-fg-4'}`}>{v.out ?? '—'}</td>
                                        <td className="py-2.5 pr-3">
                                            <Badge tone={v.method === 'QR' ? 'teal' : v.method === 'Tamu' ? 'warning' : 'slate'}>{v.method}</Badge>
                                        </td>
                                        <td className="py-2.5 text-right">
                                            {!v.out && (
                                                <button
                                                    type="button"
                                                    title="Tandai keluar"
                                                    aria-label={`Tandai ${v.name} keluar`}
                                                    onClick={() => router.post(route('staf.kunjungan.checkout', v.id), {}, { preserveScroll: true })}
                                                    className="text-fg-2 grid size-8 cursor-pointer place-items-center rounded-[9px] hover:bg-teal-50 hover:text-teal-700"
                                                >
                                                    <LogOut className="size-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {visits.length === 0 && <p className="text-fg-3 py-10 text-center text-sm">Belum ada kunjungan di kategori ini.</p>}
                    </div>
                </Card>
            </div>
        </StafLayout>
    );
}

function Stat({ label, value, sub, accent }: { label: string; value: number; sub: string; accent?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5 rounded-lg bg-white px-[18px] py-4 shadow-sm dark:bg-slate-800">
            <span className="text-fg-3 text-[13px]">{label}</span>
            <span className={`font-display text-[28px] font-extrabold ${accent ? 'text-teal-600' : ''}`}>{value}</span>
            <span className="text-fg-3 text-xs">{sub}</span>
        </div>
    );
}
