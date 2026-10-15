import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export interface KioskQr {
    url: string;
    secondsLeft: number;
    period: number;
}

/**
 * Counts down to the next kiosk code and reloads only the `qr` prop when it
 * rotates, so the rest of the page keeps its state.
 */
export function useKioskQr(qr: KioskQr): number {
    const [left, setLeft] = useState(qr.secondsLeft);

    useEffect(() => setLeft(qr.secondsLeft), [qr]);

    useEffect(() => {
        const timer = setInterval(() => {
            setLeft((s) => {
                if (s <= 1) {
                    router.reload({ only: ['qr'] });
                    return qr.period;
                }

                return s - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [qr.period]);

    return left;
}
