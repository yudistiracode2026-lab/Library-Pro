import { router } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { type ReactNode, useRef } from 'react';

/** Score letter a–d with its status colour; the letter itself carries the meaning. */
export function LetterBadge({ letter, large }: { letter: string | null; large?: boolean }) {
    const tone: Record<string, string> = {
        a: 'bg-success-soft text-success',
        b: 'bg-teal-50 text-teal-700',
        c: 'bg-warning-soft text-amber-800',
        d: 'bg-danger-soft text-danger',
    };

    return (
        <span
            title={letter ? `Opsi ${letter}` : 'Belum dinilai'}
            className={`font-display grid flex-none place-items-center rounded-[8px] font-extrabold uppercase ${large ? 'size-12 text-2xl' : 'size-8 text-sm'} ${letter ? tone[letter] : 'text-fg-4 bg-slate-100 dark:bg-slate-700'}`}
        >
            {letter ?? '–'}
        </span>
    );
}

export const EVIDENCE_TONE: Record<string, 'success' | 'warning' | 'danger' | 'slate'> = {
    Disahkan: 'success',
    Draf: 'warning',
    Kedaluwarsa: 'danger',
    'Belum ada': 'slate',
};

/** File picker that uploads straight to an evidence item. */
export function UploadButton({ evidenceId, accept, children }: { evidenceId: number; accept: string; children?: ReactNode }) {
    const input = useRef<HTMLInputElement>(null);

    return (
        <>
            <button
                type="button"
                onClick={() => input.current?.click()}
                className="text-fg-1 inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-2.5 text-xs font-semibold hover:bg-slate-100 dark:bg-slate-800"
            >
                <Upload className="size-3.5" />
                {children ?? 'Unggah'}
            </button>
            <input
                ref={input}
                type="file"
                accept={accept
                    .split(',')
                    .map((ext) => `.${ext}`)
                    .join(',')}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        router.post(
                            route('staf.akreditasi.bukti.upload', evidenceId),
                            { file },
                            { forceFormData: true, preserveScroll: true, preserveState: true },
                        );
                    }
                    e.target.value = '';
                }}
            />
        </>
    );
}

export function formatSize(bytes: number | null): string {
    if (!bytes) return '';
    return bytes > 1024 * 1024
        ? `${(bytes / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`
        : `${Math.round(bytes / 1024)} KB`;
}
