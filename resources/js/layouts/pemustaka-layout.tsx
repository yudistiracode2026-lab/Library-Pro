import { FlashToast } from '@/components/flash-toast';
import { initials } from '@/components/staf/ui';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Award,
    Bell,
    BookLock,
    BookMarked,
    BookOpen,
    ChevronDown,
    ChevronUp,
    FileCheck2,
    GraduationCap,
    History,
    House,
    KeyRound,
    Library,
    Lightbulb,
    LogOut,
    Menu,
    ScanSearch,
    Search,
    X,
} from 'lucide-react';
import { type ComponentType, type ReactNode, useState } from 'react';

type Icon = ComponentType<{ className?: string }>;

const TABS: [string, string, Icon][] = [
    ['pemustaka.beranda', 'Beranda', House],
    ['pemustaka.cari', 'Cari buku', Search],
    ['pemustaka.cek-judul', 'Cek judul skripsi', ScanSearch],
    ['pemustaka.pinjaman', 'Pinjaman', BookOpen],
    ['pemustaka.bebas-pustaka', 'Bebas pustaka', FileCheck2],
    ['pemustaka.usulan', 'Usulan', Lightbulb],
];

const READING: [string, string, Icon][] = [
    ['Skripsi', 'Skripsi', GraduationCap],
    ['Tesis', 'Tesis', BookMarked],
    ['Disertasi', 'Disertasi', Award],
    ['riwayat', 'Riwayat baca', History],
];

/** Shell of the member portal: sidebar and header from Portal Pemustaka.dc.html. */
export default function PemustakaLayout({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
    const { member, auth } = usePage<SharedData>().props;
    const [drawer, setDrawer] = useState(false);
    const name = member?.name ?? auth.user.name;

    return (
        <div className="text-fg-1 min-h-screen bg-slate-50 dark:bg-slate-900">
            <Head title={title} />
            <div className="grid min-h-screen md:grid-cols-[240px_minmax(0,1fr)]">
                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-[260px] flex-col gap-1 overflow-auto border-r border-slate-200 bg-white px-3 py-4 md:sticky md:top-0 md:z-auto md:flex md:h-screen md:w-auto dark:border-slate-700 dark:bg-slate-800 ${drawer ? 'flex' : 'hidden'}`}
                >
                    <div className="flex items-center gap-2.5 px-2 pt-1 pb-4">
                        <Link href={route('home')} className="flex flex-1 items-center gap-2.5">
                            <span className="bg-grad-leaf grid size-9 place-items-center rounded-[10px] text-white">
                                <Library className="size-[18px]" />
                            </span>
                            <span className="flex flex-col leading-tight">
                                <span className="font-display text-sm font-extrabold tracking-[.04em]">PUSTAGRA</span>
                                <span className="text-fg-3 text-[11px]">Portal pemustaka</span>
                            </span>
                        </Link>
                        <button type="button" aria-label="Tutup menu" onClick={() => setDrawer(false)} className="md:hidden">
                            <X className="size-5" />
                        </button>
                    </div>
                    <Nav />
                    <div className="mt-auto flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                        <div className="flex items-center gap-2.5 px-1.5">
                            <span className="grid size-9 flex-none place-items-center rounded-full bg-teal-100 text-[13px] font-bold text-teal-800">
                                {initials(name)}
                            </span>
                            <div className="flex min-w-0 flex-col leading-tight">
                                <span className="truncate text-[13px] font-semibold">{name}</span>
                                <span className="text-fg-3 font-mono text-xs">{member?.member_number}</span>
                            </div>
                        </div>
                        <Link
                            href={route('pemustaka.sandi')}
                            className={`hover:text-fg-1 flex h-[38px] items-center gap-2.5 rounded-[10px] px-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${route().current('pemustaka.sandi') ? 'text-fg-1 bg-slate-100 dark:bg-slate-700' : 'text-fg-2'}`}
                        >
                            <KeyRound className="size-4" />
                            Ganti kata sandi
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.post(route('logout'))}
                            className="text-fg-2 hover:text-fg-1 flex h-[38px] cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            <LogOut className="size-4" />
                            Keluar
                        </button>
                    </div>
                </aside>
                {drawer && <div className="fixed inset-0 z-40 bg-slate-900/40 md:hidden" onClick={() => setDrawer(false)} />}

                <div className="flex min-w-0 flex-col">
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-md md:px-7 dark:border-slate-700 dark:bg-slate-800/85">
                        <button type="button" aria-label="Buka menu" onClick={() => setDrawer(true)} className="md:hidden">
                            <Menu className="size-5" />
                        </button>
                        <span className="font-display min-w-0 flex-1 truncate text-[17px] font-bold">{title}</span>
                        <Link
                            href={route('pemustaka.beranda')}
                            aria-label="Notifikasi"
                            className="relative grid size-[38px] flex-none place-items-center rounded-[10px] bg-slate-100 dark:bg-slate-700"
                        >
                            <Bell className="size-[17px]" />
                            <span className="bg-sunset absolute top-1.5 right-[7px] size-2 rounded-full" />
                        </Link>
                    </header>
                    <main className={`flex w-full flex-col gap-5 px-4 pt-7 pb-16 md:px-7 ${wide ? 'max-w-[1200px]' : 'max-w-[1120px]'}`}>
                        {children}
                    </main>
                </div>
            </div>
            <FlashToast />
        </div>
    );
}

function Nav() {
    const { url } = usePage();
    const reading = url.startsWith('/pemustaka/baca');
    const jenis = new URLSearchParams(url.split('?')[1] ?? '').get('jenis') ?? 'Skripsi';
    const [open, setOpen] = useState(reading);
    const item = (on: boolean) =>
        `flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-sm font-semibold hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900 ${on ? 'bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-100' : 'text-fg-2'}`;

    return (
        <nav className="flex flex-col gap-1">
            {TABS.map(([name, label, Icon]) => (
                <Link key={name} href={route(name)} className={item(route().current(name))}>
                    <Icon className="size-[17px]" />
                    {label}
                </Link>
            ))}
            <button type="button" onClick={() => setOpen(!open)} className={`${item(false)} cursor-pointer ${reading ? '!text-teal-700' : ''}`}>
                <BookLock className="size-[17px]" />
                <span className="flex-1 text-left">Baca di tempat</span>
                {open ? <ChevronUp className="size-[15px]" /> : <ChevronDown className="size-[15px]" />}
            </button>
            {open && (
                <div className="ml-[19px] flex flex-col gap-0.5 border-l border-slate-200 pl-2.5 dark:border-slate-700">
                    {READING.map(([value, label, Icon]) => (
                        <Link
                            key={value}
                            href={route('pemustaka.baca', { jenis: value })}
                            className={`${item(reading && jenis === value)} h-9 text-[13px]`}
                        >
                            <Icon className="size-[15px]" />
                            {label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
