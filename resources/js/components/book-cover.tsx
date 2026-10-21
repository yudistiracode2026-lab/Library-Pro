import { DDC_COLORS } from '@/components/staf/master/cells';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

/**
 * A title's cover image, or a block in its DDC class colour when there is
 * none (or it fails to load). `className` sets size and rounding; children
 * are only shown on the coloured block.
 *
 * With `zoom` (the title), clicking the image opens it large. Leave it out
 * where the cover sits inside another button.
 */
export function BookCover({
    cover,
    ddc,
    className = '',
    children,
    zoom,
}: {
    cover?: string | null;
    ddc: string;
    className?: string;
    children?: ReactNode;
    zoom?: string;
}) {
    const [broken, setBroken] = useState(false);
    const [open, setOpen] = useState(false);

    if (!cover || broken) {
        return <div className={`flex-none ${DDC_COLORS[ddc] ?? 'bg-teal-600'} ${className}`}>{children}</div>;
    }

    if (zoom === undefined) {
        return (
            <img src={cover} alt="" loading="lazy" onError={() => setBroken(true)} className={`flex-none bg-slate-100 object-cover ${className}`} />
        );
    }

    const show = (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        setOpen(true);
    };

    return (
        <>
            <img
                src={cover}
                alt={`Sampul ${zoom}`}
                loading="lazy"
                role="button"
                tabIndex={0}
                title="Perbesar sampul"
                onError={() => setBroken(true)}
                onClick={show}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), show(e))}
                className={`flex-none cursor-zoom-in bg-slate-100 object-cover transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-teal-400 ${className}`}
            />
            <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[80] bg-slate-950/85" />
                    <DialogPrimitive.Content
                        onClick={() => setOpen(false)}
                        className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed inset-0 z-[80] flex cursor-zoom-out flex-col items-center justify-center gap-3 p-4 outline-none sm:p-8"
                    >
                        <DialogPrimitive.Title className="sr-only">Sampul {zoom}</DialogPrimitive.Title>
                        <DialogPrimitive.Description className="sr-only">Klik di mana saja atau tekan Esc untuk menutup.</DialogPrimitive.Description>
                        <img
                            src={cover}
                            alt={`Sampul ${zoom}`}
                            className="max-h-[calc(100vh-7rem)] max-w-full rounded-md bg-white object-contain shadow-2xl"
                        />
                        <span className="max-w-xl text-center text-sm font-semibold text-white">{zoom}</span>
                        <DialogPrimitive.Close
                            aria-label="Tutup"
                            className="absolute top-3 right-3 grid size-10 cursor-pointer place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
                        >
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </>
    );
}
