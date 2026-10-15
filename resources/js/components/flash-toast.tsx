import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Shows the session flash (`success` / `error`) set by a controller redirect.
 * Top-right on desktop, top-center on mobile, per the design system.
 */
export function FlashToast() {
    const { flash } = usePage<SharedData>().props;
    const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const message = flash?.error ?? flash?.success;

        if (!message) return;

        setToast({ kind: flash.error ? 'error' : 'success', message });
        const timer = setTimeout(() => setToast(null), 3200);

        return () => clearTimeout(timer);
    }, [flash]);

    if (!toast) return null;

    const Icon = toast.kind === 'error' ? CircleAlert : CircleCheck;

    return (
        <div
            role="status"
            className="animate-in fade-in slide-in-from-top-3 fixed top-20 left-1/2 z-[90] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2.5 rounded-[14px] bg-slate-900 px-4 py-3.5 text-sm text-white shadow-lg duration-200 md:right-6 md:left-auto md:translate-x-0"
        >
            <Icon className={`size-[18px] flex-none ${toast.kind === 'error' ? 'text-coral' : 'text-teal-300'}`} />
            {toast.message}
        </div>
    );
}
