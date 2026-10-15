import { Link } from '@inertiajs/react';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';

/** White surface with the design system's card radius and shadow. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <section className={`flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm md:p-6 dark:bg-slate-800 ${className}`}>{children}</section>;
}

export function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold">{children}</h2>
            {aside}
        </div>
    );
}

export function Eyebrow({ children }: { children: ReactNode }) {
    return <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">{children}</span>;
}

const VARIANTS = {
    primary: 'bg-teal-400 text-white shadow-teal hover:bg-teal-500 disabled:bg-slate-300 disabled:shadow-none',
    secondary: 'border border-slate-200 bg-white text-fg-1 hover:bg-slate-100 dark:bg-slate-800',
    danger: 'bg-danger text-white hover:bg-red-700',
    ghost: 'text-fg-2 hover:bg-teal-50 hover:text-teal-700',
};

export function Button({
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS; size?: 'sm' | 'md' | 'lg' }) {
    const sizes = { sm: 'h-[34px] px-3 text-[13px]', md: 'h-10 px-4 text-sm', lg: 'h-[46px] px-5 text-[15px]' };

    return (
        <button
            type="button"
            {...props}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap active:scale-[.98] disabled:cursor-not-allowed disabled:active:scale-100 [&>svg]:size-4 ${sizes[size]} ${VARIANTS[variant]} ${className}`}
        />
    );
}

/** Segmented pill tabs that change a query parameter, as in the prototype. */
export function PillTabs({ tabs }: { tabs: { label: string; href: string; active: boolean; icon?: ReactNode; count?: number | null }[] }) {
    return (
        <div className="flex flex-wrap gap-1 self-start rounded-md bg-white p-1 shadow-sm dark:bg-slate-800">
            {tabs.map((t) => (
                <Link
                    key={t.href}
                    href={t.href}
                    preserveScroll
                    className={`flex h-9 items-center gap-2 rounded-[9px] px-3.5 text-sm font-semibold [&>svg]:size-4 ${t.active ? 'bg-teal-400 text-white' : 'text-fg-2 hover:bg-teal-50 hover:text-teal-700'}`}
                >
                    {t.icon}
                    {t.label}
                    {t.count != null && (
                        <span className={`rounded-full px-1.5 text-[11px] ${t.active ? 'bg-white/25' : 'text-fg-3 bg-slate-100 dark:bg-slate-700'}`}>
                            {t.count}
                        </span>
                    )}
                </Link>
            ))}
        </div>
    );
}

export function Alert({ children, tone = 'danger' }: { children: ReactNode; tone?: 'danger' | 'warning' | 'success' }) {
    const tones = { danger: 'bg-danger-soft text-danger', warning: 'bg-warning-soft text-amber-800', success: 'bg-success-soft text-success' };

    return <div className={`rounded-md px-3.5 py-2.5 text-sm ${tones[tone]}`}>{children}</div>;
}

export const inputClass =
    'h-[42px] w-full rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 text-sm text-fg-1 outline-none focus:border-teal-400 aria-[invalid=true]:border-danger dark:bg-slate-800';

export function rupiah(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function initials(name: string): string {
    return name
        .replace(/^(Dr|Dra|Prof)\.?\s*/i, '')
        .split(',')[0]
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.charAt(0))
        .join('')
        .toUpperCase();
}

export function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'ok' | 'warn' }) {
    return (
        <div className="flex flex-col gap-0.5 rounded-lg bg-white px-[18px] py-4 shadow-sm dark:bg-slate-800">
            <span className="text-fg-3 text-[13px]">{label}</span>
            <span className={`font-display text-[26px] font-extrabold ${tone === 'ok' ? 'text-success' : tone === 'warn' ? 'text-amber-700' : ''}`}>
                {value}
            </span>
            <span className="text-fg-3 text-xs">{sub}</span>
        </div>
    );
}

export function IconButton({
    label,
    onClick,
    disabled,
    danger,
    children,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={`text-fg-2 grid size-7 cursor-pointer place-items-center rounded-[8px] disabled:cursor-not-allowed disabled:opacity-40 ${danger ? 'hover:bg-danger-soft hover:text-danger' : 'hover:bg-teal-100 hover:text-teal-700'}`}
        >
            {children}
        </button>
    );
}

/** Minutes as "2 j 30 m". */
export function duration(minutes: number): string {
    if (minutes <= 0) return '0 m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return [h ? `${h} j` : '', m ? `${m} m` : ''].filter(Boolean).join(' ');
}
