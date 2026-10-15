import { StafIcon } from '@/components/staf/staf-icon';
import StafLayout from '@/layouts/staf-layout';
import { STAF_STAGES } from '@/lib/staf-stages';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Construction } from 'lucide-react';

interface SegeraHadirProps {
    page: {
        title: string;
        group: string;
        icon: string;
        description: string | null;
        stage: number;
    };
}

export default function SegeraHadir({ page }: SegeraHadirProps) {
    return (
        <StafLayout title={page.title} group={page.group}>
            <section className="flex flex-col items-center gap-4 rounded-lg bg-white px-6 py-14 text-center shadow-sm dark:bg-slate-800">
                <span className="grid size-14 place-items-center rounded-lg bg-teal-50 text-teal-700">
                    <StafIcon name={page.icon} className="size-7" />
                </span>
                <h1 className="text-2xl font-bold">{page.title}</h1>
                {page.description && <p className="text-fg-2 max-w-lg text-[15px] leading-relaxed text-pretty">{page.description}</p>}
                <span className="bg-warning-soft inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold text-amber-800">
                    <Construction className="size-4" />
                    Segera hadir · tahap {page.stage}: {STAF_STAGES[page.stage]?.toLowerCase()}
                </span>
                <Link href="/staf" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-500">
                    <ArrowLeft className="size-4" />
                    Kembali ke dashboard
                </Link>
            </section>
        </StafLayout>
    );
}
