import { PresenceQr, type PresenceQrData } from '@/components/pemustaka/presence-qr';
import { DDC_COLORS } from '@/components/staf/master/cells';
import PemustakaLayout from '@/layouts/pemustaka-layout';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { BadgeCheck, CircleAlert, Clock, Megaphone, TabletSmartphone } from 'lucide-react';
import { type ComponentType } from 'react';

interface BerandaProps {
    qr: PresenceQrData;
    purposes: string[];
    stats: { loans: number; history: number; ebooks: number };
    loans: { id: number; title: string; ddc_class: string; due: string; daysLeft: number; extensions: number; extendProblem: string | null }[];
    notifications: { icon: string; tone: string; text: string; time: string }[];
}

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
    clock: Clock,
    'tablet-smartphone': TabletSmartphone,
    'badge-check': BadgeCheck,
    'circle-alert': CircleAlert,
    megaphone: Megaphone,
};

const TONES: Record<string, string> = {
    warning: 'bg-warning-soft text-amber-800',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    slate: 'text-fg-2 bg-slate-100 dark:bg-slate-700',
};

export default function Beranda({ qr, purposes, stats, loans, notifications }: BerandaProps) {
    const { member, auth } = usePage<SharedData>().props;
    const first = (member?.name ?? auth.user.name).split(' ')[0];

    return (
        <PemustakaLayout title="Beranda">
            <h1 className="font-display text-[28px] font-bold">Haloo, {first}</h1>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-5">
                <PresenceQr initial={qr} purposes={purposes} />

                <div className="grid grid-cols-3 gap-3">
                    {[
                        ['Dipinjam', stats.loans],
                        ['Pernah dipinjam', stats.history],
                        ['E-book dipinjam', stats.ebooks],
                    ].map(([label, value]) => (
                        <Link
                            key={label}
                            href={route('pemustaka.pinjaman')}
                            className="flex flex-col gap-1.5 rounded-lg bg-white p-4 shadow-sm hover:shadow-md dark:bg-slate-800"
                        >
                            <span className="text-fg-3 text-xs">{label}</span>
                            <span className="font-display text-[26px] font-extrabold">{value}</span>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-5">
                <section className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                    <span className="font-display text-[17px] font-bold">Pinjaman aktif</span>
                    {loans.map((l) => (
                        <div key={l.id} className="flex items-center gap-3.5 rounded-[14px] border border-slate-200 p-3 dark:border-slate-700">
                            <div className={`h-[58px] w-[42px] flex-none rounded-[5px] ${DDC_COLORS[l.ddc_class] ?? 'bg-teal-600'}`} />
                            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                                <span className="text-sm font-semibold">{l.title}</span>
                                <span className="text-fg-3 text-xs">Kembali {l.due}</span>
                                <span
                                    className={`self-start rounded-full px-2 py-0.5 text-[11px] font-semibold ${l.daysLeft <= 1 ? 'bg-warning-soft text-amber-800' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                                >
                                    {l.daysLeft < 0 ? `Terlambat ${-l.daysLeft} hari` : l.daysLeft === 0 ? 'Hari ini' : `${l.daysLeft} hari lagi`}
                                </span>
                            </div>
                            <button
                                type="button"
                                disabled={!!l.extendProblem}
                                title={l.extendProblem ?? 'Perpanjang pinjaman'}
                                onClick={() => router.post(route('pemustaka.loan.extend', l.id), {}, { preserveScroll: true })}
                                className="text-fg-1 disabled:text-fg-4 h-9 cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-semibold hover:bg-slate-100 disabled:cursor-not-allowed disabled:hover:bg-white dark:bg-slate-800"
                            >
                                {l.extensions ? 'Sudah diperpanjang' : 'Perpanjang'}
                            </button>
                        </div>
                    ))}
                    {loans.length === 0 && (
                        <div className="text-fg-3 p-6 text-center text-sm">
                            Belum ada pinjaman.{' '}
                            <Link href={route('pemustaka.cari')} className="font-semibold text-teal-600">
                                Cari buku dulu, yuk.
                            </Link>
                        </div>
                    )}
                </section>

                <section className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                    <span className="font-display text-[17px] font-bold">Notifikasi</span>
                    {notifications.map((n, i) => {
                        const Icon = ICONS[n.icon] ?? Megaphone;

                        return (
                            <div key={i} className="flex gap-3 border-b border-slate-200 py-2.5 last:border-0 dark:border-slate-700">
                                <span className={`grid size-8 flex-none place-items-center rounded-full ${TONES[n.tone] ?? TONES.slate}`}>
                                    <Icon className="size-4" />
                                </span>
                                <div className="text-sm leading-[1.45]">
                                    {n.text}
                                    <div className="text-fg-3 text-xs">{n.time}</div>
                                </div>
                            </div>
                        );
                    })}
                    {notifications.length === 0 && <p className="text-fg-3 text-sm">Belum ada notifikasi.</p>}
                </section>
            </div>
        </PemustakaLayout>
    );
}
