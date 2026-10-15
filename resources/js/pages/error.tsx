import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, House } from 'lucide-react';

const MESSAGES: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Akses tidak diizinkan',
        description: 'Halaman ini hanya bisa dibuka oleh peran tertentu. Hubungi administrator sistem kalau Anda memerlukan akses.',
    },
    404: {
        title: 'Halaman tidak ditemukan',
        description: 'Alamat yang Anda buka tidak ada atau sudah dipindahkan.',
    },
    500: {
        title: 'Terjadi kesalahan',
        description: 'Permintaan Anda tidak dapat diproses. Silakan coba lagi atau hubungi administrator sistem.',
    },
    503: {
        title: 'Sedang dalam pemeliharaan',
        description: 'Sistem sedang diperbarui. Silakan kembali beberapa saat lagi.',
    },
};

export default function ErrorPage({ status }: { status: number }) {
    const { auth } = usePage<SharedData>().props;
    const { title, description } = MESSAGES[status] ?? MESSAGES[500];

    return (
        <>
            <Head title={title} />
            <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
                <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl bg-white p-8 text-center shadow-lg">
                    <AppLogoIcon className="size-14" />
                    <span className="text-fg-3 font-mono text-sm">Kode {status}</span>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-fg-2 text-[15px] leading-relaxed text-pretty">{description}</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-100"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali
                        </button>
                        <Link
                            href={auth?.user ? '/dashboard' : '/'}
                            className="shadow-teal inline-flex h-10 items-center gap-2 rounded-md bg-teal-400 px-4 text-sm font-semibold text-white hover:bg-teal-500"
                        >
                            <House className="size-4" />
                            Ke beranda
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
