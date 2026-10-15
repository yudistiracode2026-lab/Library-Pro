import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

// Placeholder until the member portal (design/Portal Pemustaka.dc.html) is built.
export default function BerandaPemustaka() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Portal pemustaka" />
            <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
                <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl bg-white p-8 text-center shadow-lg">
                    <AppLogoIcon className="size-14" />
                    <h1 className="text-2xl font-bold">Halo, {auth.user.name.split(' ')[0]}</h1>
                    <p className="text-fg-2 text-[15px] leading-relaxed">
                        Portal pemustaka sedang disiapkan. Nanti kamu bisa pinjam, perpanjang, dan urus bebas pustaka dari sini, ya.
                    </p>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="mt-2 inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-100"
                    >
                        <LogOut className="size-4" />
                        Keluar
                    </Link>
                </div>
            </div>
        </>
    );
}
