import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEventHandler } from 'react';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

const field =
    'h-[46px] rounded-md border-[1.5px] border-slate-300 bg-white px-3.5 text-[15px] font-normal text-fg-1 outline-none focus:border-teal-400 dark:bg-slate-800';

/** Split-screen login from Portal Pemustaka.dc.html; staff sign in here too. */
export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({ email: '', password: '', remember: false });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <div className="text-fg-1 grid min-h-screen bg-slate-50 md:grid-cols-[repeat(auto-fit,minmax(360px,1fr))] dark:bg-slate-900">
            <Head title="Masuk" />
            <div className="bg-grad-leaf flex flex-col justify-between gap-8 p-8 text-white md:p-14">
                <Link href={route('home')} className="flex items-center gap-3 text-white">
                    <AppLogoIcon className="size-[46px] flex-none rounded-full bg-white" />
                    <span className="font-display font-extrabold">Perpustakaan Politeknik Agraria</span>
                </Link>
                <div className="flex max-w-[440px] flex-col gap-4">
                    <h1 className="font-display text-[40px] leading-[1.1] font-extrabold">Portal pemustaka</h1>
                    <p className="text-[17px] leading-relaxed">
                        Lihat pinjaman, perpanjang buku, baca e-book, dan urus bebas pustaka tanpa antre di meja sirkulasi.
                    </p>
                </div>
                <span className="text-[13px] text-teal-50">Petugas perpustakaan juga masuk dari halaman ini.</span>
            </div>

            <div className="grid place-items-center px-6 py-10">
                <form onSubmit={submit} className="flex w-[min(380px,100%)] flex-col gap-4">
                    <h2 className="font-display text-[26px] font-bold">Haloo, silakan masuk</h2>
                    {status && <div className="bg-success-soft text-success rounded-md px-3.5 py-2.5 text-sm">{status}</div>}
                    <label htmlFor="email" className="flex flex-col gap-1.5 text-[13px] font-semibold">
                        NIM / NIP atau email
                        <input
                            id="email"
                            required
                            autoFocus
                            autoComplete="username"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="mis. 20220311"
                            className={`${field} font-mono`}
                        />
                        <InputError message={errors.email} />
                    </label>
                    <label htmlFor="password" className="flex flex-col gap-1.5 text-[13px] font-semibold">
                        <span className="flex items-center justify-between">
                            Kata sandi
                            {canResetPassword && (
                                <Link href={route('password.request')} className="text-xs font-semibold text-teal-600">
                                    Lupa kata sandi?
                                </Link>
                            )}
                        </span>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className={field}
                        />
                        <InputError message={errors.password} />
                    </label>
                    <label className="text-fg-2 flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="size-[18px] accent-teal-500"
                        />
                        Ingat saya
                    </label>
                    <button
                        type="submit"
                        disabled={processing}
                        className="shadow-teal flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-teal-400 text-[15px] font-semibold text-white hover:bg-teal-500 disabled:opacity-70"
                    >
                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                        Masuk
                    </button>
                    <span className="text-fg-3 text-center text-[13px]">Belum terdaftar? Datang ke meja sirkulasi dengan KTM, ya.</span>
                </form>
            </div>
        </div>
    );
}
