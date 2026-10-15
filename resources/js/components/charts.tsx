/**
 * Single-series charts for the staff portal. One hue (teal-600 light /
 * teal-500 dark, both ≥ 3:1 on their surface); values are printed as text
 * beside the marks because the brand teal is low-chroma. Each chart has a
 * hover tooltip and a screen-reader table.
 */

const BAR = 'bg-teal-600 dark:bg-teal-500';

interface Datum {
    label: string;
    value: number;
    /** Tooltip text; defaults to "label: value". */
    tip?: string;
}

/** Horizontal bars, one per row, sorted by the caller. */
export function BarList({
    items,
    caption,
    format = (v) => v.toLocaleString('id-ID'),
}: {
    items: Datum[];
    caption: string;
    format?: (v: number) => string;
}) {
    const max = Math.max(1, ...items.map((i) => i.value));

    return (
        <figure className="flex flex-col gap-2.5">
            {items.map((item) => (
                <div key={item.label} className="group relative grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-[13px]">
                    <span className="text-fg-2 truncate">{item.label}</span>
                    <span className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700">
                        <span
                            className={`block h-full rounded-full ${BAR} group-hover:brightness-110`}
                            style={{ width: `${item.value === 0 ? 0 : Math.max(2, (item.value / max) * 100)}%` }}
                        />
                    </span>
                    <span className="text-fg-1 w-12 text-right font-mono font-semibold">{format(item.value)}</span>
                    <Tip text={item.tip ?? `${item.label}: ${format(item.value)}`} className="bottom-full left-36 mb-1" />
                </div>
            ))}
            <SrTable caption={caption} items={items} format={format} />
        </figure>
    );
}

/**
 * Vertical columns over a time axis. Only the highest and the latest values
 * are labelled on the chart; the tooltip carries every value.
 */
export function ColumnChart({ items, caption, height = 160 }: { items: Datum[]; caption: string; height?: number }) {
    const max = Math.max(1, ...items.map((i) => i.value));
    const peak = items.reduce((best, item, i) => (item.value > items[best].value ? i : best), 0);
    const step = items.length > 10 ? 2 : 1;

    return (
        <figure className="flex flex-col gap-1.5">
            <div className="relative flex items-end gap-[2px] border-b border-slate-300 dark:border-slate-600" style={{ height }}>
                <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200 dark:border-slate-700" />
                {items.map((item, i) => {
                    const labelled = i === peak || i === items.length - 1;

                    return (
                        <div key={item.label} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                            {labelled && item.value > 0 && <span className="text-fg-2 mb-1 font-mono text-[11px] font-semibold">{item.value}</span>}
                            <div
                                className={`w-full max-w-7 rounded-t-[4px] ${BAR} group-hover:brightness-110`}
                                style={{ height: `${(item.value / max) * (height - 22)}px`, minHeight: item.value > 0 ? 2 : 0 }}
                            />
                            <Tip text={item.tip ?? `${item.label}: ${item.value}`} className="bottom-full left-1/2 mb-1 -translate-x-1/2" />
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-[2px]">
                {items.map((item, i) => (
                    <span key={item.label} className="text-fg-3 flex-1 truncate text-center text-[10px]">
                        {i % step === (items.length - 1) % step ? item.label : ''}
                    </span>
                ))}
            </div>
            <SrTable caption={caption} items={items} format={(v) => String(v)} />
        </figure>
    );
}

function Tip({ text, className }: { text: string; className: string }) {
    return (
        <span
            role="tooltip"
            className={`pointer-events-none absolute z-10 hidden rounded-[8px] bg-slate-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg group-hover:block ${className}`}
        >
            {text}
        </span>
    );
}

function SrTable({ caption, items, format }: { caption: string; items: Datum[]; format: (v: number) => string }) {
    return (
        <table className="sr-only">
            <caption>{caption}</caption>
            <tbody>
                {items.map((item) => (
                    <tr key={item.label}>
                        <th scope="row">{item.label}</th>
                        <td>{format(item.value)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
