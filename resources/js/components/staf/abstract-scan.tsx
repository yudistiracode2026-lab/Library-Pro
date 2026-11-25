import { CoverCropDialog } from '@/components/staf/cover-capture';
import { Camera, ImagePlus, ScanText } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Worker } from 'tesseract.js';

type Progress = { label: string } | null;

/**
 * One reader for the whole page: the language data (Indonesian and English,
 * about 10–15 MB) is downloaded the first time and then cached by the browser.
 */
let reader: Promise<Worker> | null = null;
let report: (progress: Progress) => void = () => {};

function getReader(): Promise<Worker> {
    reader ??= import('tesseract.js')
        .then(({ createWorker }) =>
            createWorker(['ind', 'eng'], 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') report({ label: `Membaca teks… ${Math.round(m.progress * 100)}%` });
                    else if (m.status.includes('traineddata')) report({ label: `Mengunduh data bahasa… ${Math.round(m.progress * 100)}%` });
                    else report({ label: 'Menyiapkan pembaca teks…' });
                },
            }),
        )
        .catch((error) => {
            reader = null;
            throw error;
        });

    return reader;
}

/**
 * Photograph the back cover, frame the abstract, and the recognised text
 * fills the Abstrak field, ready to be checked and corrected.
 */
export function AbstractScan({ current, onText }: { current: string; onText: (text: string) => void }) {
    const camera = useRef<HTMLInputElement>(null);
    const gallery = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<Progress>(null);
    const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

    const read = async (image: File) => {
        report = setProgress;
        setProgress({ label: 'Menyiapkan pembaca teks…' });
        try {
            const worker = await getReader();
            const { data } = await worker.recognize(image);
            const text = tidy(data.text);

            if (text.length < 20) {
                setMessage({
                    tone: 'error',
                    text: 'Teks tidak terbaca. Coba foto lebih dekat, terang, dan tidak buram, lalu batasi titik ke area abstrak saja.',
                });
            } else {
                const existing = current.trim();
                const replace =
                    existing === '' ||
                    window.confirm('Kolom abstrak sudah berisi.\n\nOK = ganti dengan teks hasil foto\nBatal = tambahkan di bagian akhir');
                onText(replace ? text : `${existing}\n\n${text}`);
                setMessage({
                    tone: 'ok',
                    text: `Teks terbaca (${Math.round(data.confidence)}% yakin). Periksa dan koreksi bila ada huruf yang keliru sebelum menyimpan.`,
                });
            }
        } catch {
            setMessage({ tone: 'error', text: 'Pembaca teks gagal dimuat. Pastikan HP tersambung ke internet, lalu coba lagi.' });
        } finally {
            setProgress(null);
            setFile(null);
            report = () => {};
        }
    };

    const input = (ref: typeof camera, capture: boolean) => (
        <input
            ref={ref}
            type="file"
            accept="image/*"
            capture={capture ? 'environment' : undefined}
            className="hidden"
            onChange={(e) => {
                setMessage(null);
                setFile(e.target.files?.[0] ?? null);
                e.target.value = '';
            }}
        />
    );

    return (
        <div className="-mt-1 flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => camera.current?.click()}
                    disabled={progress !== null}
                    className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-teal-200 bg-teal-50 px-3 py-1.5 text-[13px] font-semibold text-teal-700 hover:bg-teal-100 disabled:opacity-60 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300"
                >
                    <ScanText className="size-4" />
                    Foto abstrak
                    <Camera className="size-3.5 opacity-60" />
                </button>
                <button
                    type="button"
                    onClick={() => gallery.current?.click()}
                    disabled={progress !== null}
                    className="text-fg-2 flex cursor-pointer items-center gap-1 rounded-[10px] px-2 py-1.5 text-xs font-semibold hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-slate-800"
                >
                    <ImagePlus className="size-3.5" />
                    dari galeri
                </button>
                <span className="text-fg-3 text-xs font-normal">Ambil dari sampul belakang, teks langsung masuk ke kolom abstrak</span>
            </div>
            {message && (
                <p className={`text-xs font-normal ${message.tone === 'ok' ? 'text-teal-700 dark:text-teal-300' : 'text-danger'}`}>{message.text}</p>
            )}
            {input(camera, true)}
            {input(gallery, false)}
            <CoverCropDialog
                file={file}
                frame="page"
                outputMax={2400}
                text={{
                    title: 'Pilih area abstrak',
                    description: 'Geser keempat titik ke batas teks abstrak saja (tanpa judul, gambar, atau barcode), lalu ketuk Baca teks.',
                    confirm: 'Baca teks',
                }}
                busyLabel={progress?.label ?? null}
                onCancel={() => progress === null && setFile(null)}
                onDone={read}
            />
        </div>
    );
}

/**
 * Tesseract keeps the printed line breaks: rejoin lines into paragraphs,
 * mend words split with a hyphen at the end of a line, and drop stray
 * symbols read from the edges.
 */
export function tidy(raw: string): string {
    return raw
        .replace(/\r/g, '')
        .split(/\n\s*\n/)
        .map((paragraph) =>
            paragraph
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => /\p{L}{2}/u.test(line))
                .reduce((text, line) => {
                    if (text === '') return line;
                    // "perpus-" + "takaan" -> "perpustakaan"
                    if (/\p{L}-$/u.test(text) && /^\p{Ll}/u.test(line)) return text.slice(0, -1) + line;
                    return `${text} ${line}`;
                }, '')
                .replace(/[‘’]/g, "'")
                .replace(/[“”]/g, '"')
                .replace(/\s+([,.;:!?)])/g, '$1')
                .replace(/\s{2,}/g, ' ')
                .trim(),
        )
        .filter(Boolean)
        .join('\n\n');
}
