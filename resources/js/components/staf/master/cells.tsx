import { type ReactNode } from 'react';

export type Tone = 'success' | 'warning' | 'teal' | 'slate' | 'danger';

const TONES: Record<Tone, string> = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-amber-800',
    teal: 'bg-teal-50 text-teal-700',
    slate: 'bg-slate-100 text-fg-2',
    danger: 'bg-danger-soft text-berry',
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
    return (
        <span
            title={typeof children === 'string' ? children : undefined}
            className={`max-w-full self-start truncate rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}
        >
            {children}
        </span>
    );
}

/** Primary text with an optional muted line underneath, as in the prototype tables. */
export function Cell({ children, sub, bold, mono }: { children: ReactNode; sub?: ReactNode; bold?: boolean; mono?: boolean }) {
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <span className={`truncate ${bold ? 'font-semibold' : ''} ${mono ? 'font-mono text-[13px]' : ''}`}>{children ?? '—'}</span>
            {sub && <span className="text-fg-3 truncate text-xs">{sub}</span>}
        </div>
    );
}

export function StatusBadge({ status }: { status: string }) {
    const tone: Tone = ['Aktif', 'Terbit', 'Tersedia'].includes(status) ? 'success' : status === 'Diblokir' ? 'danger' : 'warning';

    return <Badge tone={tone}>{status}</Badge>;
}

export const DDC_COLORS: Record<string, string> = {
    '000': 'bg-teal-700',
    '100': 'bg-violet',
    '200': 'bg-teal-500',
    '300': 'bg-berry',
    '400': 'bg-marigold',
    '500': 'bg-teal-600',
    '600': 'bg-sunset',
    '700': 'bg-coral',
    '800': 'bg-plum',
    '900': 'bg-teal-800',
};

export const COLLECTION_TONES: Record<string, Tone> = {
    'Buku teks': 'teal',
    Skripsi: 'warning',
    'Tugas akhir & laporan PKL': 'warning',
    Prosiding: 'danger',
    'Jurnal & majalah': 'slate',
    Referensi: 'danger',
    'Peta & atlas': 'slate',
    'Terbitan STPN Press': 'teal',
};
