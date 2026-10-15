import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { type SelectOption } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEvent } from 'react';

export type FormValues = Record<string, string | number | boolean | null>;

export interface FieldDef {
    name: string;
    label: string;
    type?: 'text' | 'number' | 'email' | 'select' | 'combobox' | 'checkbox';
    /** Choices for "select". */
    options?: SelectOption[];
    /** Suggestions for "combobox": free text with a datalist. */
    suggestions?: string[];
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
}

const inputClass =
    'h-[42px] w-full rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 text-sm font-normal text-fg-1 outline-none focus:border-teal-400 aria-[invalid=true]:border-danger dark:bg-slate-800';

/**
 * Add/edit dialog shared by every master page. Mount it with a `key` per
 * record so the form state starts fresh each time it opens.
 */
export function RecordForm({ open, onOpenChange, title, fields, initial, method, url, switcher }: RecordFormProps) {
    const form = useForm<FormValues>(initial);
    const visible = fields.filter((f) => !f.hidden?.(form.data));
    const shownNames = new Set([...visible.map((f) => f.name), switcher?.name]);
    const otherErrors = Object.entries(form.errors).filter(([name]) => !shownNames.has(name));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.submit(method, url, { preserveScroll: true, onSuccess: () => onOpenChange(false) });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-xl p-7 sm:max-w-[560px]">
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
                            <Field
                                key={field.name}
                                field={field}
                                value={form.data[field.name]}
                                error={form.errors[field.name]}
                                onChange={(value) => form.setData(field.name, value)}
                            />
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

function Field({
    field,
    value,
    error,
    onChange,
}: {
    field: FieldDef;
    value: FormValues[string];
    error?: string;
    onChange: (value: string | boolean) => void;
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
            ) : (
                <>
                    <input
                        id={id}
                        type={field.type === 'combobox' ? 'text' : (field.type ?? 'text')}
                        value={String(value ?? '')}
                        onChange={(e) => onChange(e.target.value)}
                        required={field.required}
                        placeholder={field.placeholder}
                        step={field.step}
                        list={field.type === 'combobox' ? `${id}-list` : undefined}
                        autoComplete="off"
                        aria-invalid={!!error}
                        className={inputClass}
                    />
                    {field.type === 'combobox' && (
                        <datalist id={`${id}-list`}>{field.suggestions?.map((s) => <option key={s} value={s} />)}</datalist>
                    )}
                </>
            )}
            {field.hint && !error && <span className="text-fg-3 text-xs font-normal">{field.hint}</span>}
            {error && <span className="text-danger text-xs font-normal">{error}</span>}
        </label>
    );
}
