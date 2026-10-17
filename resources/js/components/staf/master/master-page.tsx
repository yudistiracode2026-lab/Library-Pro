import { FieldDef, FormValues, RecordForm } from '@/components/staf/master/record-form';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { type Paginated, type SelectOption } from '@/types';
import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, SearchX, Trash2 } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

export interface Column<T> {
    label: string;
    render: (row: T) => ReactNode;
}

interface MasterPageProps<T extends { id: number }> {
    /** Menu key: routes are staf.{key}, staf.{key}.store, .update, .destroy, .export */
    routeKey: string;
    heading: string;
    description: ReactNode;
    addLabel: string;
    records: Paginated<T>;
    filters: { q: string; jenis?: string };
    columns: Column<T>[];
    /** CSS grid-template-columns for the data columns (the action column is appended). */
    grid: string;
    /** Optional filter chips bound to the "jenis" query parameter; "" means all. */
    tabs?: SelectOption[];
    /** A "No" column first, numbered across pages (page 2 starts at 26). */
    numbered?: boolean;
    form: {
        title: (row: T | null) => string;
        fields: FieldDef[];
        empty: FormValues;
        fromRow: (row: T) => FormValues;
        switcher?: { name: string; options: SelectOption[] };
        wide?: boolean;
    };
    describeRow: (row: T) => string;
}

export function MasterPage<T extends { id: number }>({
    routeKey,
    heading,
    description,
    addLabel,
    records,
    filters,
    columns,
    grid,
    tabs,
    numbered,
    form,
    describeRow,
}: MasterPageProps<T>) {
    const [q, setQ] = useState(filters.q ?? '');
    const [editor, setEditor] = useState<{ row: T | null; nonce: number } | null>(null);
    const [deleting, setDeleting] = useState<T | null>(null);
    const firstRender = useRef(true);
    const jenis = filters.jenis ?? '';

    const visit = (params: Record<string, string>) =>
        router.get(route(`staf.${routeKey}`), clean({ q, jenis, ...params }), { preserveState: true, preserveScroll: true, replace: true });

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const timer = setTimeout(() => visit({ q }), 350);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const numbers = new Map(records.data.map((row, i) => [row.id, (records.from ?? 1) + i]));
    const allColumns: Column<T>[] = numbered
        ? [{ label: 'No', render: (row) => <span className="text-fg-3 font-mono text-[13px] tabular-nums">{numbers.get(row.id)}</span> }, ...columns]
        : columns;
    const gridTemplate = `${numbered ? '44px ' : ''}${grid} 80px`;
    const editing = editor?.row ?? null;

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold">{heading}</h1>
                    <p className="text-fg-3 mt-1 text-sm">{description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <label className="text-fg-3 flex h-10 w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 sm:w-[280px] dark:bg-slate-800">
                        <Search className="size-4 flex-none" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari…"
                            aria-label="Cari"
                            className="text-fg-1 min-w-0 flex-1 bg-transparent text-sm outline-none"
                        />
                    </label>
                    <a
                        href={route(`staf.${routeKey}.export`, clean({ q, jenis }))}
                        className="text-fg-1 flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
                    >
                        <Download className="size-4" />
                        Ekspor
                    </a>
                    <button
                        type="button"
                        onClick={() => setEditor({ row: null, nonce: Date.now() })}
                        className="shadow-teal flex h-10 cursor-pointer items-center gap-2 rounded-md bg-teal-400 px-4 text-sm font-semibold text-white hover:bg-teal-500 active:scale-[.98]"
                    >
                        <Plus className="size-4" />
                        {addLabel}
                    </button>
                </div>
            </div>

            {tabs && (
                <div className="flex flex-wrap gap-1.5">
                    {tabs.map((t) => {
                        const on = jenis === t.value;

                        return (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => visit({ jenis: t.value })}
                                className={`h-9 cursor-pointer rounded-full border px-3.5 text-[13px] font-semibold ${on ? 'border-teal-400 bg-teal-400 text-white' : 'text-fg-2 border-slate-200 bg-white dark:bg-slate-800'}`}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg bg-white shadow-sm dark:bg-slate-800">
                <div
                    className="text-fg-3 grid min-w-[900px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900"
                    style={{ gridTemplateColumns: gridTemplate }}
                >
                    {allColumns.map((c) => (
                        <span key={c.label}>{c.label}</span>
                    ))}
                    <span />
                </div>

                {records.data.map((row) => (
                    <div
                        key={row.id}
                        className="grid min-w-[900px] items-center gap-4 border-b border-slate-200 px-5 py-3.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                        style={{ gridTemplateColumns: gridTemplate }}
                    >
                        {allColumns.map((c) => (
                            <div key={c.label} className="flex min-w-0 flex-col gap-0.5">
                                {c.render(row)}
                            </div>
                        ))}
                        <div className="flex justify-end gap-1">
                            <button
                                type="button"
                                title="Ubah"
                                aria-label={`Ubah ${describeRow(row)}`}
                                onClick={() => setEditor({ row, nonce: Date.now() })}
                                className="text-fg-2 grid size-[34px] cursor-pointer place-items-center rounded-[9px] hover:bg-teal-50 hover:text-teal-700"
                            >
                                <Pencil className="size-4" />
                            </button>
                            <button
                                type="button"
                                title="Hapus"
                                aria-label={`Hapus ${describeRow(row)}`}
                                onClick={() => setDeleting(row)}
                                className="text-fg-2 hover:bg-danger-soft hover:text-danger grid size-[34px] cursor-pointer place-items-center rounded-[9px]"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {records.data.length === 0 && (
                    <div className="text-fg-3 flex flex-col items-center gap-2 px-5 py-12 text-center text-sm">
                        <SearchX className="size-7" />
                        {q || jenis ? 'Belum ada data yang cocok. Coba kata kunci lain, ya.' : 'Belum ada data. Mulai dengan menambahkan satu, ya.'}
                    </div>
                )}

                <div className="text-fg-3 flex items-center justify-between gap-3 px-5 py-3 text-[13px]">
                    <span>{records.total > 0 ? `Menampilkan ${records.from}–${records.to} dari ${records.total} data` : 'Menampilkan 0 data'}</span>
                    {records.last_page > 1 && (
                        <div className="flex items-center gap-1">
                            <PageLink href={records.prev_page_url} label="Sebelumnya" icon={<ChevronLeft className="size-4" />} />
                            <span className="px-2 font-mono text-xs">
                                {records.current_page} / {records.last_page}
                            </span>
                            <PageLink href={records.next_page_url} label="Berikutnya" icon={<ChevronRight className="size-4" />} />
                        </div>
                    )}
                </div>
            </div>

            {editor && (
                <RecordForm
                    key={editor.nonce}
                    open
                    onOpenChange={(open) => !open && setEditor(null)}
                    title={form.title(editing)}
                    fields={form.fields}
                    initial={editing ? form.fromRow(editing) : form.empty}
                    method={editing ? 'put' : 'post'}
                    url={editing ? route(`staf.${routeKey}.update`, { record: editing.id }) : route(`staf.${routeKey}.store`)}
                    switcher={editing ? undefined : form.switcher}
                    wide={form.wide}
                />
            )}

            <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
                <DialogContent className="rounded-xl p-7 sm:max-w-[440px]">
                    <DialogTitle className="font-display text-xl font-bold">Hapus data?</DialogTitle>
                    <DialogDescription className="text-fg-2 text-[15px] leading-relaxed">
                        <b>{deleting && describeRow(deleting)}</b> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                    </DialogDescription>
                    <div className="mt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setDeleting(null)}
                            className="h-11 cursor-pointer rounded-md border border-slate-200 bg-white px-[18px] font-semibold hover:bg-slate-100 dark:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                deleting &&
                                router.delete(route(`staf.${routeKey}.destroy`, { record: deleting.id }), {
                                    preserveScroll: true,
                                    onFinish: () => setDeleting(null),
                                })
                            }
                            className="bg-danger h-11 cursor-pointer rounded-md px-5 font-semibold text-white hover:bg-red-700 active:scale-[.98]"
                        >
                            Hapus
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function PageLink({ href, label, icon }: { href: string | null; label: string; icon: ReactNode }) {
    if (!href) {
        return (
            <span aria-disabled className="text-fg-4 grid size-8 place-items-center rounded-[9px]">
                {icon}
            </span>
        );
    }

    return (
        <Link
            href={href}
            preserveScroll
            preserveState
            aria-label={label}
            className="text-fg-2 grid size-8 place-items-center rounded-[9px] hover:bg-teal-50 hover:text-teal-700"
        >
            {icon}
        </Link>
    );
}

/** Drop empty query parameters so URLs stay clean (?q=&jenis= -> nothing). */
function clean(params: Record<string, string>): Record<string, string> {
    return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
}
