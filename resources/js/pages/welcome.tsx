import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Beranda" />
            <div className="text-fg-1 flex min-h-screen flex-col bg-slate-50">
                <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
                    <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-6 px-6">
                        <Link href="/" className="flex items-center gap-3">
                            <AppLogoIcon className="size-11 rounded-full bg-white" />
                            <span className="flex flex-col leading-tight">
                                <span className="font-display text-[15px] font-extrabold tracking-wide">PUSTAGRA</span>
                                <span className="text-fg-3 text-xs">Perpustakaan Politeknik Agraria STPN</span>
                            </span>
                        </Link>
                        <nav className="ml-auto flex gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="shadow-teal flex h-10 items-center rounded-md bg-teal-400 px-4 text-sm font-semibold text-white hover:bg-teal-500"
                                >
                                    Buka dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="shadow-teal flex h-10 items-center rounded-md bg-teal-400 px-4 text-sm font-semibold text-white hover:bg-teal-500"
                                >
                                    Masuk
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center gap-6 px-6 py-16">
                    <span className="inline-flex items-center self-start rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold tracking-[.08em] text-teal-700 uppercase">
                        Yogyakarta · sejak 1963
                    </span>
                    <h1 className="max-w-3xl text-5xl leading-[1.08] font-extrabold tracking-tight text-balance">
                        Sumber pengetahuan pertanahan dan agraria Indonesia
                    </h1>
                    <p className="text-fg-2 max-w-xl text-lg leading-relaxed text-pretty">
                        Cari buku, skripsi, jurnal, dan peta koleksi Perpustakaan Politeknik Agraria. Halaman ini sementara, dan akan diganti dengan
                        website perpustakaan lengkap.
                    </p>
                </main>
            </div>
        </>
    );
}
