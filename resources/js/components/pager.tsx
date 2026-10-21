import { ChevronLeft, ChevronRight } from 'lucide-react';

/** "Sebelumnya · Halaman 2 dari 3 · Berikutnya" under a list of search results. Hidden when everything fits on one page. */
export function Pager({ page, last, onPage, className = '' }: { page: number; last: number; onPage: (page: number) => void; className?: string }) {
    if (last <= 1) {
        return null;
    }

    const button =
        'text-fg-2 flex h-9 cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-fg-2 dark:bg-slate-800';

    return (
        <nav aria-label="Halaman hasil" className={`flex items-center justify-center gap-2 ${className}`}>
            <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={button}>
                <ChevronLeft className="size-4" />
                Sebelumnya
            </button>
            <span className="text-fg-3 px-1 text-sm whitespace-nowrap">
                {page} / {last}
            </span>
            <button type="button" disabled={page >= last} onClick={() => onPage(page + 1)} className={button}>
                Berikutnya
                <ChevronRight className="size-4" />
            </button>
        </nav>
    );
}
