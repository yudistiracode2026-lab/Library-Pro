import AppLogoIcon from '@/components/app-logo-icon';
import { Head, router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

/** Shown to an account that the circulation desk has not linked to a member yet. */
export default function BelumTerhubung() {
    return (
        <div className="grid min-h-screen place-items-center bg-slate-50 p-4 dark:bg-slate-900">
            <Head title="Portal pemustaka" />
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
                <AppLogoIcon className="size-12" />
                <h1 className="font-display text-2xl font-bold">Akun belum terhubung</h1>
                <p className="text-fg-2 text-[15px] leading-relaxed">
                    Akun ini belum terhubung dengan data anggota perpustakaan. Datang ke meja sirkulasi dengan KTM agar petugas bisa menautkannya, ya.
                </p>
                <button
                    type="button"
                    onClick={() => router.post(route('logout'))}
                    className="text-fg-1 flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
                >
                    <LogOut className="size-4" />
                    Keluar
                </button>
            </div>
        </div>
    );
}
