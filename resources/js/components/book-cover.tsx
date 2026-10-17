import { DDC_COLORS } from '@/components/staf/master/cells';
import { type ReactNode, useState } from 'react';

/**
 * A title's cover image, or a block in its DDC class colour when there is
 * none (or it fails to load). `className` sets size and rounding; children
 * are only shown on the coloured block.
 */
export function BookCover({
    cover,
    ddc,
    className = '',
    children,
}: {
    cover?: string | null;
    ddc: string;
    className?: string;
    children?: ReactNode;
}) {
    const [broken, setBroken] = useState(false);

    if (cover && !broken) {
        return (
            <img src={cover} alt="" loading="lazy" onError={() => setBroken(true)} className={`flex-none bg-slate-100 object-cover ${className}`} />
        );
    }

    return <div className={`flex-none ${DDC_COLORS[ddc] ?? 'bg-teal-600'} ${className}`}>{children}</div>;
}
