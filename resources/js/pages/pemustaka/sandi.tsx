import AppLogoIcon from '@/components/app-logo-icon';
import PemustakaLayout from '@/layouts/pemustaka-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { KeyRound, LogOut } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const field =
    'h-11 rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 text-sm font-normal text-fg-1 outline-none focus:border-teal-400 dark:bg-slate-800';

/**
 * Change the portal password. Right after the first sign-in (password still
 * the NIM/NIP) it is the only page the member can open, shown on its own.
 */
export default function Sandi({ required }: { required: boolean }) {
    const form = useForm({ current_password: '', password: '', password_confirmation: '' });
    const [show, setShow] = useState(false);
    const type = show ? 'text' : 'password';

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(route('pemustaka.sandi.update'), { onFinish: () => form.reset('current_password', 'password', 'password_confirmation') });
    };

    const card = (
        <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-6 shadow-sm sm:p-8 dark:bg-slate-800">
            <div className="flex flex-col gap-1.5">
                <h1 className="font-display flex items-center gap-2 text-2xl font-bold">
                    <KeyRound className="size-5 text-teal-600" />
                    {required ? 'Buat kata sandi baru' : 'Ganti kata sandi'}
                </h1>
                <p className="text-fg-2 text-[15px] leading-relaxed">
                    {required
                        ? 'Kamu masuk dengan kata sandi awal (NIM/NIP). Supaya akunmu aman, buat kata sandi baru dulu sebelum memakai portal.'
                        : 'Kata sandi baru dipakai saat masuk portal berikutnya.'}
                </p>
            </div>
            {!required && (
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                    Kata sandi saat ini
                    <input
                        type={type}
                        autoComplete="current-password"
                        value={form.data.current_password}
                        onChange={(e) => form.setData('current_password', e.target.value)}
                        required
                        className={field}
                    />
                    {form.errors.current_password && <span className="text-danger text-xs font-normal">{form.errors.current_password}</span>}
                </label>
            )}
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                Kata sandi baru
                <input
                    type={type}
                    autoComplete="new-password"
                    value={form.data.password}
                    onChange={(e) => form.setData('password', e.target.value)}
                    required
                    minLength={8}
                    className={field}
                />
                <span className="text-fg-3 text-xs font-normal">Minimal 8 karakter, tidak sama dengan NIM/NIP.</span>
                {form.errors.password && <span className="text-danger text-xs font-normal">{form.errors.password}</span>}
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                Ulangi kata sandi baru
                <input
                    type={type}
                    autoComplete="new-password"
                    value={form.data.password_confirmation}
                    onChange={(e) => form.setData('password_confirmation', e.target.value)}
                    required
                    className={field}
                />
            </label>
            <label className="text-fg-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-[18px] accent-teal-500" />
                Tampilkan kata sandi
            </label>
            <button
                type="submit"
                disabled={form.processing}
                className="h-11 cursor-pointer rounded-md bg-teal-400 font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
            >
                Simpan kata sandi
            </button>
            {required && (
                <button
                    type="button"
                    onClick={() => router.post(route('logout'))}
                    className="text-fg-3 hover:text-fg-1 flex cursor-pointer items-center justify-center gap-1.5 text-sm"
                >
                    <LogOut className="size-4" />
                    Keluar dulu
                </button>
            )}
        </form>
    );

    if (required) {
        return (
            <div className="text-fg-1 grid min-h-screen place-items-center bg-slate-50 px-4 py-10 dark:bg-slate-900">
                <Head title="Buat kata sandi baru" />
                <div className="flex w-full flex-col items-center gap-5">
                    <AppLogoIcon className="size-14 rounded-full bg-white" />
                    {card}
                </div>
            </div>
        );
    }

    return <PemustakaLayout title="Kata sandi">{card}</PemustakaLayout>;
}
