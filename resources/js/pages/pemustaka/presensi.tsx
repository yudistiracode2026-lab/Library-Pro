import AppLogoIcon from '@/components/app-logo-icon';
import { Alert } from '@/components/staf/ui';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, LogIn, LogOut } from 'lucide-react';
import { type FormEvent } from 'react';

interface PresensiProps {
    notice: string | null;
    member: { name: string; member_number: string } | null;
    hasUser: boolean;
    inside: { since: string; purpose: string } | null;
    purposes: string[];
}

/** Opened from the kiosk QR on the member's phone. */
export default function Presensi({ notice, member, hasUser, inside, purposes }: PresensiProps) {
    const { flash } = usePage<SharedData>().props;
    const form = useForm({ purpose: inside?.purpose ?? purposes[0] });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('presensi.store'), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Presensi" />
            <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
                <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-white p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                        <AppLogoIcon className="size-11" />
                        <div className="flex flex-col leading-tight">
                            <span className="font-display text-sm font-extrabold tracking-[.04em]">PUSTAGRA</span>
                            <span className="text-fg-3 text-xs">Presensi kunjungan</span>
                        </div>
                    </div>

                    {flash.success && <Alert tone="success">{flash.success}</Alert>}
                    {flash.error && <Alert>{flash.error}</Alert>}

                    {hasUser && !member ? (
                        <Alert tone="warning">Akun kamu belum terhubung dengan data anggota. Hubungi petugas di meja sirkulasi, ya.</Alert>
                    ) : notice ? (
                        <>
                            {!flash.success && <p className="text-fg-2 text-[15px] leading-relaxed">{notice}</p>}
                            {!hasUser && (
                                <Link href={route('login')} className="text-sm font-semibold text-teal-600">
                                    Masuk ke akun pemustaka
                                </Link>
                            )}
                        </>
                    ) : (
                        member && (
                            <form onSubmit={submit} className="flex flex-col gap-4">
                                <div>
                                    <h1 className="text-xl font-bold">Halo, {member.name.split(' ')[0]}</h1>
                                    <p className="text-fg-3 text-sm">
                                        {inside ? `Kamu tercatat di dalam sejak pukul ${inside.since}.` : 'Kamu belum tercatat masuk hari ini.'}
                                    </p>
                                </div>
                                {!inside && (
                                    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                                        Keperluan
                                        <select
                                            value={form.data.purpose}
                                            onChange={(e) => form.setData('purpose', e.target.value)}
                                            className="h-[46px] rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 text-[15px] font-normal"
                                        >
                                            {purposes.map((p) => (
                                                <option key={p}>{p}</option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="shadow-teal flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-teal-400 font-semibold text-white hover:bg-teal-500 active:scale-[.98]"
                                >
                                    {form.processing ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    ) : inside ? (
                                        <LogOut className="size-4" />
                                    ) : (
                                        <LogIn className="size-4" />
                                    )}
                                    {inside ? 'Catat keluar' : 'Catat masuk'}
                                </button>
                            </form>
                        )
                    )}
                </div>
            </div>
        </>
    );
}
