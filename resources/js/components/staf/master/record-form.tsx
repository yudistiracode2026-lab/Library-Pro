import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { type SelectOption } from '@/types';
import { useForm } from '@inertiajs/react';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useState } from 'react';

export type FormValues = Record<string, string | number | boolean | null | string[] | File>;

export interface FieldDef {
    name: string;
    label: string;
    type?: 'text' | 'number' | 'email' | 'select' | 'combobox' | 'checkbox' | 'textarea' | 'tags' | 'image';
    /** Choices for "select". */
    options?: SelectOption[];
    /** Suggestions for "combobox": free text with a datalist. */
    suggestions?: string[];
    /** Server suggestions for "combobox"/"tags", fetched as `${url}&q=…` (JSON list of names). */
    suggestUrl?: string;
    /** "image": URL of the current image, shown until a new file is chosen. */
    currentImage?: (values: FormValues) => string | null;
    /** Heading shown above this field, to group long forms. */
    section?: string;
    span?: 1 | 2;
    required?: boolean;
    placeholder?: string;
    step?: string;
    hint?: string;
    hidden?: (values: FormValues) => boolean;
}

interface RecordFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    fields: FieldDef[];
    initial: FormValues;
    method: 'post' | 'put';
    url: string;
    /** Segmented control above the fields, e.g. Buku fisik / E-book. */
    switcher?: { name: string; options: SelectOption[] };
    /** Wider dialog for long forms. */
    wide?: boolean;
}

const inputClass =
    'h-[42px] w-full rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 text-sm font-normal text-fg-1 outline-none focus:border-teal-400 aria-[invalid=true]:border-danger dark:bg-slate-800';

/**
 * Add/edit dialog shared by every master page. Mount it with a `key` per
 * record so the form state starts fresh each time it opens.
 */
export function RecordForm({ open, onOpenChange, title, fields, initial, method, url, switcher, wide }: RecordFormProps) {
    const form = useForm<FormValues>(initial);
    const visible = fields.filter((f) => !f.hidden?.(form.data));
    const shownNames = new Set([...visible.map((f) => f.name), switcher?.name]);
    const otherErrors = Object.entries(form.errors).filter(([name]) => !shownNames.has(name.split('.')[0]));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onOpenChange(false) };

        // Files need multipart, which PHP only parses on POST: spoof PUT.
        if (Object.values(form.data).some((v) => v instanceof File)) {
            form.transform((data) => (method === 'put' ? { ...data, _method: 'put' } : data));
            form.post(url, { ...options, forceFormData: true });
        } else {
            form.submit(method, url, options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-h-[90vh] gap-0 overflow-y-auto rounded-xl p-7 ${wide ? 'sm:max-w-[760px]' : 'sm:max-w-[560px]'}`}>
                <form onSubmit={submit} className="flex flex-col gap-3.5">
                    <DialogTitle className="font-display text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="sr-only">Isi data lalu simpan.</DialogDescription>

                    {switcher && (
                        <div className="flex gap-1 self-start rounded-md bg-slate-100 p-1 dark:bg-slate-700">
                            {switcher.options.map((o) => {
                                const on = form.data[switcher.name] === o.value;

                                return (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => form.setData(switcher.name, o.value)}
                                        className={`h-[34px] cursor-pointer rounded-[9px] px-4 text-[13px] font-semibold ${on ? 'text-fg-1 bg-white shadow-sm dark:bg-slate-800' : 'text-fg-3'}`}
                                    >
                                        {o.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {otherErrors.length > 0 && (
                        <div className="bg-danger-soft text-danger rounded-md px-3.5 py-2.5 text-sm">
                            {otherErrors.map(([name, message]) => (
                                <p key={name}>{message}</p>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {visible.map((field) => (
                            <FieldBlock key={field.name} field={field}>
                                <Field
                                    field={field}
                                    value={form.data[field.name]}
                                    values={form.data}
                                    error={fieldError(form.errors, field.name)}
                                    onChange={(value) => form.setData(field.name, value)}
                                />
                            </FieldBlock>
                        ))}
                    </div>

                    <div className="mt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="h-11 cursor-pointer rounded-md border border-slate-200 bg-white px-[18px] font-semibold hover:bg-slate-100 dark:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="flex h-11 cursor-pointer items-center gap-2 rounded-md bg-teal-400 px-5 font-semibold text-white hover:bg-teal-500 active:scale-[.98] disabled:opacity-70"
                        >
                            {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                            Simpan
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** The field's own error, or the first error of one of its items (authors.0, …). */
function fieldError(errors: Partial<Record<string, string>>, name: string): string | undefined {
    return errors[name] ?? Object.entries(errors).find(([key]) => key.startsWith(`${name}.`))?.[1];
}

function FieldBlock({ field, children }: { field: FieldDef; children: React.ReactNode }) {
    if (!field.section) {
        return children;
    }

    return (
        <>
            <div className="text-fg-3 mt-2 border-b border-slate-200 pb-1.5 text-[11px] font-semibold tracking-[.08em] uppercase sm:col-span-2 dark:border-slate-700">
                {field.section}
            </div>
            {children}
        </>
    );
}

function Field({
    field,
    value,
    values,
    error,
    onChange,
}: {
    field: FieldDef;
    value: FormValues[string];
    values: FormValues;
    error?: string;
    onChange: (value: string | boolean | string[] | File | null) => void;
}) {
    const id = `field-${field.name}`;
    const span = field.span === 2 ? 'sm:col-span-2' : '';

    if (field.type === 'checkbox') {
        return (
            <label htmlFor={id} className={`flex cursor-pointer items-center gap-2.5 text-sm font-semibold ${span}`}>
                <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => onChange(e.target.checked)}
                    className="size-[18px] accent-teal-500"
                />
                {field.label}
                {field.hint && <span className="text-fg-3 font-normal">· {field.hint}</span>}
            </label>
        );
    }

    if (field.type === 'tags') {
        return (
            <div className={`flex flex-col gap-1.5 text-[13px] font-semibold ${span}`}>
                <label htmlFor={id}>{field.label}</label>
                <TagsInput id={id} field={field} value={Array.isArray(value) ? value : []} invalid={!!error} onChange={onChange} />
                {field.hint && !error && <span className="text-fg-3 text-xs font-normal">{field.hint}</span>}
                {error && <span className="text-danger text-xs font-normal">{error}</span>}
            </div>
        );
    }

    if (field.type === 'image') {
        return (
            <div className={`flex flex-col gap-1.5 text-[13px] font-semibold ${span}`}>
                {field.label}
                <ImageInput id={id} file={value instanceof File ? value : null} current={field.currentImage?.(values) ?? null} onChange={onChange} />
                {field.hint && !error && <span className="text-fg-3 text-xs font-normal">{field.hint}</span>}
                {error && <span className="text-danger text-xs font-normal">{error}</span>}
            </div>
        );
    }

    return (
        <label htmlFor={id} className={`flex flex-col gap-1.5 text-[13px] font-semibold ${span}`}>
            {field.label}
            {field.type === 'select' ? (
                <select
                    id={id}
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                    required={field.required}
                    aria-invalid={!!error}
                    className={inputClass}
                >
                    {!field.required && <option value="">—</option>}
                    {field.required && !value && (
                        <option value="" disabled>
                            Pilih…
                        </option>
                    )}
                    {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            ) : field.type === 'textarea' ? (
                <textarea
                    id={id}
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder}
                    rows={4}
                    aria-invalid={!!error}
                    className={`${inputClass} h-auto resize-y py-2.5 leading-normal`}
                />
            ) : (
                <ComboInput id={id} field={field} value={String(value ?? '')} invalid={!!error} onChange={onChange} />
            )}
            {field.hint && !error && <span className="text-fg-3 text-xs font-normal">{field.hint}</span>}
            {error && <span className="text-danger text-xs font-normal">{error}</span>}
        </label>
    );
}

function ComboInput({
    id,
    field,
    value,
    invalid,
    onChange,
}: {
    id: string;
    field: FieldDef;
    value: string;
    invalid: boolean;
    onChange: (value: string) => void;
}) {
    const remote = useSuggestions(field.type === 'combobox' ? field.suggestUrl : undefined, value);
    const suggestions = field.suggestUrl ? remote : field.suggestions;

    return (
        <>
            <input
                id={id}
                type={field.type === 'combobox' ? 'text' : (field.type ?? 'text')}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                step={field.step}
                list={field.type === 'combobox' ? `${id}-list` : undefined}
                autoComplete="off"
                aria-invalid={invalid}
                className={inputClass}
            />
            {field.type === 'combobox' && <datalist id={`${id}-list`}>{suggestions?.map((s) => <option key={s} value={s} />)}</datalist>}
        </>
    );
}

/**
 * Ordered list of names (authors, subjects): type and press Enter, or pick a
 * suggestion. Commas stay part of a name ("Habib, dkk").
 */
function TagsInput({
    id,
    field,
    value,
    invalid,
    onChange,
}: {
    id: string;
    field: FieldDef;
    value: string[];
    invalid: boolean;
    onChange: (value: string[]) => void;
}) {
    const [text, setText] = useState('');
    const suggestions = useSuggestions(field.suggestUrl, text);
    const listId = `${useId()}-list`;

    const add = (name: string) => {
        const clean = name.trim();
        if (clean && !value.some((v) => v.toLowerCase() === clean.toLowerCase())) {
            onChange([...value, clean]);
        }
        setText('');
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            add(text);
        } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div
            className={`flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-[10px] border-[1.5px] bg-white px-2 py-1.5 focus-within:border-teal-400 dark:bg-slate-800 ${invalid ? 'border-danger' : 'border-slate-300'}`}
        >
            {value.map((v, i) => (
                <span key={v} className="flex items-center gap-1 rounded-full bg-teal-50 py-0.5 pr-1 pl-2.5 text-xs font-semibold text-teal-700">
                    {v}
                    {i === 0 && value.length > 1 && <span className="font-normal text-teal-600">· utama</span>}
                    <button
                        type="button"
                        aria-label={`Hapus ${v}`}
                        onClick={() => onChange(value.filter((x) => x !== v))}
                        className="grid size-4 cursor-pointer place-items-center rounded-full hover:bg-teal-100"
                    >
                        <X className="size-3" />
                    </button>
                </span>
            ))}
            <input
                id={id}
                value={text}
                onChange={(e) => {
                    // Picking a datalist option fills the whole name at once.
                    const next = e.target.value;
                    if (suggestions.includes(next)) {
                        add(next);
                    } else {
                        setText(next);
                    }
                }}
                onKeyDown={onKeyDown}
                onBlur={() => add(text)}
                list={listId}
                placeholder={value.length === 0 ? field.placeholder : 'Tambah…'}
                autoComplete="off"
                className="text-fg-1 h-7 min-w-[140px] flex-1 bg-transparent px-1 text-sm font-normal outline-none"
            />
            <datalist id={listId}>
                {suggestions.map((s) => (
                    <option key={s} value={s} />
                ))}
            </datalist>
        </div>
    );
}

function ImageInput({
    id,
    file,
    current,
    onChange,
}: {
    id: string;
    file: File | null;
    current: string | null;
    onChange: (file: File | null) => void;
}) {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const shown = preview ?? current;

    return (
        <div className="flex items-center gap-3">
            <div className="grid h-[84px] w-[60px] flex-none place-items-center overflow-hidden rounded-[6px] border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                {shown ? <img src={shown} alt="" className="size-full object-cover" /> : <ImagePlus className="text-fg-4 size-5" />}
            </div>
            <label
                htmlFor={id}
                className="text-fg-1 cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold hover:bg-slate-100 dark:bg-slate-800"
            >
                {shown ? 'Ganti gambar' : 'Pilih gambar'}
                <input
                    id={id}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                />
            </label>
            {file && (
                <button type="button" onClick={() => onChange(null)} className="text-fg-3 cursor-pointer text-xs font-semibold hover:text-red-600">
                    Batal
                </button>
            )}
        </div>
    );
}

/** Names from the server matching what was typed, debounced. */
function useSuggestions(url: string | undefined, query: string): string[] {
    const [items, setItems] = useState<string[]>([]);

    useEffect(() => {
        const q = query.trim();
        if (!url || q.length < 2) {
            setItems([]);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => {
            fetch(`${url}${url.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}`, {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            })
                .then((r) => (r.ok ? r.json() : []))
                .then((names: string[]) => setItems(names))
                .catch(() => {});
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [url, query]);

    return items;
}
