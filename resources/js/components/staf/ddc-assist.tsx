import { type FormValues } from '@/components/staf/master/record-form';
import { ExternalLink, LoaderCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Suggestion {
    number: string;
    reason: string;
    count: number;
    examples: string[];
}

interface Result {
    loc: { number: string; title: string } | null;
    locError: boolean;
    catalogue: Suggestion[];
}

const PERPUSNAS_OPAC = 'https://opac.perpusnas.go.id/';

/**
 * Under the "Klasifikasi" field of the catalogue form: DDC numbers from the
 * Library of Congress (by ISBN) and from titles this library already
 * classified; a click fills the field. The Perpusnas OPAC has no open
 * interface, so it opens in a new tab with the ISBN or title copied.
 */
export function DdcAssist({ values, set, bookId }: { values: FormValues; set: (name: string, value: string) => void; bookId?: number }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [failed, setFailed] = useState(false);
    const [copied, setCopied] = useState('');

    const isbn = String(values.isbn ?? '').trim();
    const title = String(values.title ?? '').trim();
    const subjects = Array.isArray(values.subjects) ? values.subjects : [];

    const find = async () => {
        setLoading(true);
        setFailed(false);
        try {
            const params = new URLSearchParams({ isbn, title, ...(bookId ? { id: String(bookId) } : {}) });
            subjects.forEach((s) => params.append('subjects[]', s));
            const response = await fetch(`${route('staf.buku.ddc')}?${params}`, { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error(String(response.status));
            setResult(await response.json());
        } catch {
            setFailed(true);
        } finally {
            setLoading(false);
        }
    };

    const openPerpusnas = async () => {
        const text = isbn || title;
        if (text) {
            try {
                await navigator.clipboard.writeText(text);
                setCopied(text);
            } catch {
                setCopied('');
            }
        }
        window.open(PERPUSNAS_OPAC, '_blank', 'noopener');
    };

    const pick = (number: string) => set('classification', number);
    const current = String(values.classification ?? '').trim();
    const chip = (number: string) =>
        `cursor-pointer rounded-full border px-2.5 py-0.5 font-mono text-[13px] font-semibold ${current === number ? 'border-teal-400 bg-teal-400 text-white' : 'border-teal-200 bg-white text-teal-700 hover:bg-teal-50 dark:bg-slate-800'}`;

    return (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-slate-300 p-3 text-[13px] dark:border-slate-600">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={find}
                    disabled={loading || (!isbn && !title && subjects.length === 0)}
                    className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-teal-50 px-3 font-semibold text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-900 dark:text-teal-100"
                >
                    {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Cari nomor DDC
                </button>
                <button
                    type="button"
                    onClick={openPerpusnas}
                    className="text-fg-2 flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 font-semibold hover:bg-slate-100 dark:bg-slate-800"
                >
                    <ExternalLink className="size-4" />
                    Buka OPAC Perpusnas
                </button>
                <span className="text-fg-3">dari ISBN, judul, dan tajuk subjek di atas</span>
            </div>

            {copied && (
                <p className="text-fg-3">
                    <b className="text-fg-2">{copied}</b> sudah disalin; tempel (Ctrl+V) di kotak pencarian OPAC Perpusnas.
                </p>
            )}
            {failed && <p className="text-danger">Saran belum bisa diambil. Coba lagi sebentar lagi, ya.</p>}

            {result && (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-fg-3 w-full sm:w-auto">Library of Congress:</span>
                        {result.loc ? (
                            <>
                                <button type="button" onClick={() => pick(result.loc!.number)} className={chip(result.loc.number)}>
                                    {result.loc.number}
                                </button>
                                <span className="text-fg-3 min-w-0 truncate">{result.loc.title}</span>
                            </>
                        ) : (
                            <span className="text-fg-3">
                                {result.locError ? 'sedang tidak bisa dihubungi' : isbn ? 'tidak ada nomor DDC untuk ISBN ini' : 'isi ISBN dulu'}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-fg-3">Katalog perpustakaan ini:</span>
                        {result.catalogue.length === 0 && <span className="text-fg-3">Belum ada judul serupa yang sudah berklasifikasi.</span>}
                        {result.catalogue.map((s) => (
                            <div key={s.number} className="flex items-start gap-2">
                                <button type="button" onClick={() => pick(s.number)} className={`${chip(s.number)} flex-none`}>
                                    {s.number}
                                </button>
                                <span className="text-fg-3 min-w-0 leading-snug">
                                    <b className="text-fg-2 font-semibold">
                                        {s.reason} · {s.count} judul
                                    </b>
                                    {s.examples.length > 0 && <> — {s.examples.join('; ')}</>}
                                </span>
                            </div>
                        ))}
                    </div>
                    <span className="text-fg-3">Klik nomor untuk mengisi kolom Klasifikasi; kelas utama DDC menyesuaikan otomatis.</span>
                </div>
            )}
        </div>
    );
}
