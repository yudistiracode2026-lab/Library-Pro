import { EVIDENCE_TONE, formatSize, UploadButton } from '@/components/staf/akreditasi';
import { Badge } from '@/components/staf/master/cells';
import { Button, Card, PillTabs } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { Link, router } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';

interface BuktiProps {
    status: string;
    counts: Record<string, number>;
    items: {
        id: number;
        label: string;
        status: string;
        file: string | null;
        fileName: string | null;
        size: number | null;
        uploadedAt: string | null;
        approvedAt: string | null;
        validUntil: string | null;
        indicator: { number: string; name: string };
    }[];
    canApprove: boolean;
    accept: string;
}

export default function Bukti({ status, counts, items, canApprove, accept }: BuktiProps) {
    return (
        <StafLayout title="Akreditasi · bank bukti fisik" group="Akreditasi">
            <p className="text-fg-3 -mb-2 text-sm">
                Unggah berkas PDF, JPG, PNG, DOCX, XLSX, atau MP4 (maks. 25 MB). Bukti baru tersimpan sebagai draf sampai disahkan kepala
                perpustakaan.
            </p>
            <PillTabs
                tabs={['', 'Belum ada', 'Draf', 'Disahkan', 'Kedaluwarsa'].map((s) => ({
                    label: s || 'Semua',
                    href: route('staf.akreditasi.bukti', s ? { status: s } : {}),
                    active: status === s,
                    count: counts[s] ?? 0,
                }))}
            />
            <Card className="gap-0 p-0 md:p-0">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-sm">
                        <thead className="text-fg-3 border-b border-slate-200 bg-slate-50 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900">
                            <tr>
                                {['IK', 'Bukti fisik', 'Berkas', 'Status', ''].map((h) => (
                                    <th key={h} className="px-5 py-3 font-semibold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((e) => (
                                <tr key={e.id} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="px-5 py-3 font-mono font-semibold">{e.indicator.number}</td>
                                    <td className="px-5 py-3">
                                        <div className="font-semibold">{e.label}</div>
                                        <div className="text-fg-3 text-xs">{e.indicator.name}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        {e.file ? (
                                            <a
                                                href={e.file}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 text-teal-700 hover:text-teal-500 dark:text-teal-200"
                                            >
                                                <ExternalLink className="size-3.5 flex-none" />
                                                <span className="max-w-[220px] truncate">{e.fileName}</span>
                                            </a>
                                        ) : (
                                            <span className="text-fg-4">—</span>
                                        )}
                                        {e.file && (
                                            <div className="text-fg-3 text-xs">
                                                {formatSize(e.size)} · {e.uploadedAt}
                                                {e.validUntil && ` · berlaku s.d. ${e.validUntil}`}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <Badge tone={EVIDENCE_TONE[e.status]}>{e.status}</Badge>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex justify-end gap-1.5">
                                            <UploadButton evidenceId={e.id} accept={accept}>
                                                {e.file ? 'Ganti' : 'Unggah'}
                                            </UploadButton>
                                            {canApprove && e.file && e.status !== 'Disahkan' && (
                                                <Button
                                                    size="sm"
                                                    className="h-[30px]"
                                                    onClick={() =>
                                                        router.post(
                                                            route('staf.akreditasi.bukti.approve', e.id),
                                                            {},
                                                            { preserveScroll: true, preserveState: true },
                                                        )
                                                    }
                                                >
                                                    Sahkan
                                                </Button>
                                            )}
                                            <Link
                                                href={route('staf.akreditasi.indikator', { ik: e.indicator.number })}
                                                className="text-fg-1 inline-flex h-[30px] items-center rounded-[8px] border border-slate-200 bg-white px-2.5 text-xs font-semibold hover:bg-slate-100 dark:bg-slate-800"
                                            >
                                                Buka IK
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {items.length === 0 && <p className="text-fg-3 py-10 text-center text-sm">Tidak ada bukti di kategori ini.</p>}
                </div>
            </Card>
        </StafLayout>
    );
}
