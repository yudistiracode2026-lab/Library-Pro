import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useState, type FormEventHandler } from 'react';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    /** Members sign in at /login with their NIM/NIP, staff at /staf/masuk with their email. */
    portal: 'pemustaka' | 'staf';
    status?: string;
    canResetPassword: boolean;
}

const field =
    'h-[46px] rounded-md border-[1.5px] border-slate-300 bg-white px-3.5 text-[15px] font-normal text-fg-1 outline-none focus:border-teal-400 dark:bg-slate-800';

const COPY = {
    pemustaka: {
        title: 'Masuk · Portal pemustaka',
        heading: 'Portal pemustaka',
        pitch: 'Lihat pinjaman, perpanjang buku, baca e-book, dan urus bebas pustaka tanpa antre di meja sirkulasi.',
        aside: 'Untuk mahasiswa, dosen, dan anggota perpustakaan.',
        greeting: 'Haloo, silakan masuk',
        login: 'NIM / NIP',
        placeholder: 'mis. 20220311',
        footer: 'Belum terdaftar? Datang ke meja sirkulasi dengan KTM, ya.',
    },
    staf: {
        title: 'Masuk · Portal staf',
        heading: 'Portal staf',
        pitch: 'Sirkulasi, katalog, kunjungan, aset, dan akreditasi perpustakaan dalam satu tempat.',
        aside: 'Khusus pustakawan, tendik, dan administrator perpustakaan.',
        greeting: 'Masuk sebagai petugas',
        login: 'Email',
        placeholder: 'nama@kampus.ac.id',
        footer: 'Belum punya akun? Minta administrator perpustakaan membuatkannya.',
    },
} as const;

/** Split-screen login from Portal Pemustaka.dc.html, in a member and a staff version. */
export default function Login({ portal, status, canResetPassword }: LoginProps) {
    const copy = COPY[portal];
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({ email: '', password: '', remember: false });
    const [showPassword, setShowPassword] = useState(false);
    // Read-only until touched: browsers do not autofill read-only fields when the page
    // loads, so a saved login (say the admin's, on the members' page) does not appear by
    // itself. Saved logins are still offered once the field is tapped.
    const [unlocked, setUnlocked] = useState(false);
    const unlock = { readOnly: !unlocked, onPointerDown: () => setUnlocked(true), onFocus: () => setUnlocked(true) };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route(portal === 'staf' ? 'staf.login.store' : 'login'), { onFinish: () => reset('password') });
    };

    return (
        <div className="text-fg-1 grid min-h-screen bg-slate-50 md:grid-cols-[repeat(auto-fit,minmax(360px,1fr))] dark:bg-slate-900">
            <Head title={copy.title} />
            <div className={`flex flex-col justify-between gap-8 p-8 text-white md:p-14 ${portal === 'staf' ? 'bg-teal-900' : 'bg-grad-leaf'}`}>
                <Link href={route('home')} className="flex items-center gap-3 text-white">
                    <AppLogoIcon className="size-[46px] flex-none rounded-full bg-white" />
                    <span className="font-display font-extrabold">Perpustakaan Politeknik Agraria</span>
                </Link>
                <div className="flex max-w-[440px] flex-col gap-4">
                    <h1 className="font-display text-[40px] leading-[1.1] font-extrabold">{copy.heading}</h1>
                    <p className="text-[17px] leading-relaxed">{copy.pitch}</p>
                </div>
                <span className="text-[13px] text-teal-50">{copy.aside}</span>
            </div>

            <div className="grid place-items-center px-6 py-10">
                <form onSubmit={submit} className="flex w-[min(380px,100%)] flex-col gap-4">
                    <h2 className="font-display text-[26px] font-bold">{copy.greeting}</h2>
                    {status && <div className="bg-success-soft text-success rounded-md px-3.5 py-2.5 text-sm">{status}</div>}
                    <label htmlFor="email" className="flex flex-col gap-1.5 text-[13px] font-semibold">
                        {copy.login}
                        <input
                            id="email"
                            type={portal === 'staf' ? 'email' : 'text'}
                            inputMode={portal === 'staf' ? 'email' : 'numeric'}
                            required
                            {...unlock}
                            autoComplete="username"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={copy.placeholder}
                            className={`${field} ${portal === 'staf' ? '' : 'font-mono'}`}
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
                        <span className="relative flex flex-col">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                {...unlock}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className={`${field} pr-12`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((shown) => !shown)}
                                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                aria-pressed={showPassword}
                                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                className="text-fg-3 absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center rounded-r-md hover:text-teal-600 focus-visible:text-teal-600 focus-visible:outline-none"
                            >
                                {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                            </button>
                        </span>
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
                    <span className="text-fg-3 text-center text-[13px]">{copy.footer}</span>
                </form>
            </div>
        </div>
    );
}
