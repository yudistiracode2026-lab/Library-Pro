import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface Label {
    code: string;
    call_number: string | null;
    title: string;
    author: string | null;
}

interface LabelProps {
    labels: Label[];
    page: { current: number; last: number; total: number };
    filters: { buku: number[]; q: string; jenis: string; sejak: string; ukuran: 'sedang' | 'kecil' };
}

/**
 * Label sheets in millimetres, laid out like common A4 sticker sheets:
 * medium 63.5 x 38.1 mm (3 x 7, as Avery L7160) and small 45.7 x 25.4 mm
 * (4 x 10, as Avery L7654). Plain paper cut by hand works too.
 */
const SIZES = {
    sedang: { label: 'Sedang · 63,5 × 38,1 mm · 21 per lembar', width: 63.5, height: 38.1, columns: 3, gap: 2.5, top: 15.15, side: 7.25, qr: 30 },
    kecil: { label: 'Kecil · 45,7 × 25,4 mm · 40 per lembar', width: 45.7, height: 25.4, columns: 4, gap: 2.5, top: 21.5, side: 9.75, qr: 20 },
};

export default function LabelPage({ labels, page, filters }: LabelProps) {
    const size = SIZES[filters.ukuran] ?? SIZES.sedang;
    const [showTitle, setShowTitle] = useState(true);

    const go = (params: Record<string, string | number | undefined>) =>
        router.get(
            route('staf.buku.labels'),
            Object.fromEntries(
                Object.entries({
                    q: filters.q || undefined,
                    jenis: filters.jenis || undefined,
                    sejak: filters.sejak || undefined,
                    ukuran: filters.ukuran,
                    ...params,
                }).filter(([, v]) => v !== undefined && v !== ''),
            ),
            { preserveScroll: true },
        );
    // Chosen titles travel as buku[]=1&buku[]=2.
    const visit = (params: Record<string, string | number | undefined>) =>
        filters.buku.length
            ? router.get(
                  route('staf.buku.labels'),
                  { buku: filters.buku, sejak: filters.sejak || undefined, ukuran: filters.ukuran, ...params },
                  { preserveScroll: true },
              )
            : go(params);

    return (
        <div className="text-fg-1 min-h-screen bg-slate-100 print:bg-white">
            <Head title="Cetak label QR" />
            <style>{`
                @page { size: A4; margin: ${size.top}mm ${size.side}mm; }
                @media print { .label-sheet { width: auto !important; padding: 0 !important; box-shadow: none !important; } }
            `}</style>

            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur print:hidden">
                <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-x-4 gap-y-2.5">
                    <Link href={route('staf.buku')} className="text-fg-2 flex items-center gap-1.5 text-sm font-semibold hover:text-teal-700">
                        <ArrowLeft className="size-4" />
                        Data buku
                    </Link>
                    <span className="font-display text-lg font-bold">Cetak label QR</span>
                    <span className="text-fg-3 text-sm">
                        {page.total.toLocaleString('id-ID')} eksemplar
                        {page.last > 1 && ` · bagian ${page.current} dari ${page.last}`}
                    </span>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        disabled={labels.length === 0}
                        className="ml-auto flex h-10 cursor-pointer items-center gap-2 rounded-md bg-teal-400 px-4 text-sm font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        <Printer className="size-4" />
                        Cetak
                    </button>
                    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <label className="text-fg-2 flex items-center gap-2 font-semibold">
                            Ukuran
                            <select
                                value={filters.ukuran}
                                onChange={(e) => visit({ ukuran: e.target.value, hal: undefined })}
                                className="text-fg-1 h-9 rounded-md border border-slate-300 bg-white px-2 font-normal"
                            >
                                {Object.entries(SIZES).map(([value, s]) => (
                                    <option key={value} value={value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-fg-2 flex items-center gap-2 font-semibold">
                            Eksemplar ditambahkan sejak
                            <input
                                type="date"
                                value={filters.sejak}
                                onChange={(e) => visit({ sejak: e.target.value || undefined, hal: undefined })}
                                className="text-fg-1 h-9 rounded-md border border-slate-300 bg-white px-2 font-normal"
                            />
                        </label>
                        <label className="text-fg-2 flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={showTitle}
                                onChange={(e) => setShowTitle(e.target.checked)}
                                className="size-4 accent-teal-500"
                            />
                            Tampilkan judul
                        </label>
                        {page.last > 1 && (
                            <span className="ml-auto flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={page.current <= 1}
                                    onClick={() => visit({ hal: page.current - 1 })}
                                    aria-label="Bagian sebelumnya"
                                    className="grid size-9 cursor-pointer place-items-center rounded-md border border-slate-300 bg-white disabled:opacity-40"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={page.current >= page.last}
                                    onClick={() => visit({ hal: page.current + 1 })}
                                    aria-label="Bagian berikutnya"
                                    className="grid size-9 cursor-pointer place-items-center rounded-md border border-slate-300 bg-white disabled:opacity-40"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </span>
                        )}
                    </div>
                    <p className="text-fg-3 w-full text-xs">
                        Saat mencetak: kertas A4, skala 100% (bukan "sesuaikan halaman"), dan matikan header/footer browser. Tiap bagian berisi paling
                        banyak 210 label.
                    </p>
                </div>
            </div>

            {labels.length === 0 ? (
                <p className="text-fg-3 p-12 text-center">Tidak ada eksemplar untuk dicetak. Judul tanpa eksemplar atau e-book tidak punya label.</p>
            ) : (
                <div
                    className="label-sheet mx-auto my-6 bg-white shadow-sm print:my-0"
                    style={{ width: '210mm', padding: `${size.top}mm ${size.side}mm` }}
                >
                    <div
                        className="grid"
                        style={{
                            gridTemplateColumns: `repeat(${size.columns}, ${size.width}mm)`,
                            columnGap: `${size.gap}mm`,
                            gridAutoRows: `${size.height}mm`,
                        }}
                    >
                        {labels.map((l) => (
                            <LabelCard key={l.code} label={l} size={size} showTitle={showTitle} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function LabelCard({ label, size, showTitle }: { label: Label; size: (typeof SIZES)['sedang']; showTitle: boolean }) {
    const small = size.qr < 25;

    return (
        <div
            className="flex items-center overflow-hidden text-black"
            style={{ gap: small ? '1.5mm' : '2.5mm', padding: small ? '1.5mm' : '2.5mm', breakInside: 'avoid', outline: '0.2mm dashed #d4d4d4' }}
        >
            <QRCodeSVG value={label.code} level="M" marginSize={0} style={{ width: `${size.qr}mm`, height: `${size.qr}mm`, flex: 'none' }} />
            <div className="flex min-w-0 flex-col justify-center" style={{ gap: small ? '0.6mm' : '1mm' }}>
                <span className="truncate font-semibold tracking-wide uppercase" style={{ fontSize: small ? '5pt' : '6pt' }}>
                    Perpustakaan STPN
                </span>
                {label.call_number && (
                    <span className="leading-tight font-bold" style={{ fontSize: small ? '7pt' : '9pt' }}>
                        {label.call_number}
                    </span>
                )}
                <span className="font-mono font-bold" style={{ fontSize: small ? '7.5pt' : '10pt' }}>
                    {label.code}
                </span>
                {showTitle && (
                    <span className="line-clamp-2 leading-tight" style={{ fontSize: small ? '5.5pt' : '6.5pt' }}>
                        {label.title}
                    </span>
                )}
            </div>
        </div>
    );
}
