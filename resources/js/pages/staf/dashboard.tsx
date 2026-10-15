import StafLayout from '@/layouts/staf-layout';
import { CURRENT_STAGE, STAF_STAGES } from '@/lib/staf-stages';
import { type SharedData, type UserRole } from '@/types';
import { usePage } from '@inertiajs/react';
import { CircleCheck, CircleDashed, IdCard, ShieldCheck, UserCog } from 'lucide-react';

interface DashboardProps {
    userCounts: { role: UserRole; label: string; total: number }[];
    stages: { stage: number; pages: string[] }[];
}

const ROLE_STYLE: Record<UserRole, { icon: typeof IdCard; className: string }> = {
    admin: { icon: ShieldCheck, className: 'bg-teal-50 text-teal-700' },
    pustakawan: { icon: UserCog, className: 'bg-warning-soft text-amber-800' },
    pemustaka: { icon: IdCard, className: 'bg-danger-soft text-berry' },
};

export default function StafDashboard({ userCounts, stages }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user.name.split(',')[0].split(' ')[0];

    return (
        <StafLayout title="Dashboard" group="Utama">
            <section className="bg-grad-leaf rounded-lg p-6 text-white shadow-md">
                <span className="text-[11px] font-semibold tracking-[.08em] text-teal-50 uppercase">Selamat datang</span>
                <h1 className="mt-1 text-2xl font-extrabold">Halo, {firstName}</h1>
                <p className="mt-1 text-sm text-teal-50">{auth.user.title ?? 'Staf perpustakaan'}</p>
            </section>

            <section className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                {userCounts.map(({ role, label, total }) => {
                    const { icon: Icon, className } = ROLE_STYLE[role];

                    return (
                        <div key={role} className="flex flex-col gap-2.5 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                            <span className={`grid size-9 place-items-center rounded-[10px] ${className}`}>
                                <Icon className="size-[18px]" />
                            </span>
                            <span className="font-display text-[28px] font-extrabold tracking-tight">{total}</span>
                            <span className="text-fg-3 text-[13px]">Akun {label.toLowerCase()}</span>
                        </div>
                    );
                })}
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                <h2 className="text-lg font-bold">Pembangunan modul</h2>
                <p className="text-fg-3 mt-1 text-sm">Portal staf dibangun bertahap. Menu yang belum selesai menampilkan halaman "segera hadir".</p>
                <ol className="mt-5 flex flex-col gap-3">
                    {stages.map(({ stage, pages }) => {
                        const done = stage <= CURRENT_STAGE;

                        return (
                            <li key={stage} className="flex gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-700">
                                {done ? (
                                    <CircleCheck className="text-success mt-0.5 size-5 flex-none" />
                                ) : (
                                    <CircleDashed className="text-fg-4 mt-0.5 size-5 flex-none" />
                                )}
                                <div className="flex min-w-0 flex-col gap-1">
                                    <span className="text-sm font-semibold">
                                        Tahap {stage} · {STAF_STAGES[stage]}
                                    </span>
                                    <span className="text-fg-3 text-[13px] leading-relaxed">{pages.join(', ')}</span>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </section>
        </StafLayout>
    );
}
