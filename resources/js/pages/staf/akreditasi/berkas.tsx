import { Alert, Button, Card, CardTitle } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { router } from '@inertiajs/react';
import { Award, Camera, Download, FileText, FolderArchive, IdCard } from 'lucide-react';

interface BerkasProps {
    finalScore: number;
    predicate: { letter: string; label: string };
    unscored: number;
    approvedEvidence: number;
    missingEvidence: number;
    snapshots: { id: number; taken_at: string; finalScore: number; predicate: string }[];
}

const DOCS = [
    {
        type: 'formulir',
        icon: FileText,
        name: 'Formulir pengajuan',
        description: 'Identitas lembaga, permohonan akreditasi, dan hasil penilaian mandiri per komponen.',
    },
    {
        type: 'profil',
        icon: IdCard,
        name: 'Data profil perpustakaan',
        description: 'Luas, koleksi, tenaga, sivitas, dan jam layanan dari data sistem.',
    },
    {
        type: 'pernyataan',
        icon: Award,
        name: 'Pernyataan penulisan sertifikat',
        description: 'Nama lembaga dan kepala perpustakaan sesuai penulisan di sertifikat.',
    },
];

const nf = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Berkas({ finalScore, predicate, unscored, approvedEvidence, missingEvidence, snapshots }: BerkasProps) {
    return (
        <StafLayout title="Akreditasi · berkas pengajuan SiPAPI" group="Akreditasi">
            <p className="text-fg-3 -mb-2 text-sm">
                Sistem menyiapkan berkas; pengunggahan tetap dilakukan petugas di laman SiPAPI (akreditasi.perpusnas.go.id).
            </p>

            {(unscored > 0 || missingEvidence > 0) && (
                <Alert tone="warning">
                    {unscored > 0 && `${unscored} IK belum dinilai. `}
                    {missingEvidence > 0 && `${missingEvidence} butir bukti belum disahkan, jadi belum ikut paket bukti.`}
                </Alert>
            )}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                {DOCS.map(({ type, icon: Icon, name, description }) => (
                    <Card key={type}>
                        <span className="grid size-10 place-items-center rounded-[10px] bg-teal-50 text-teal-700">
                            <Icon className="size-5" />
                        </span>
                        <div>
                            <div className="font-bold">{name}</div>
                            <p className="text-fg-3 mt-1 text-sm">{description}</p>
                        </div>
                        <a
                            href={route('staf.akreditasi.berkas.document', type)}
                            className="text-fg-1 mt-auto flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
                        >
                            <Download className="size-4" />
                            Unduh PDF
                        </a>
                    </Card>
                ))}
                <Card>
                    <span className="grid size-10 place-items-center rounded-[10px] bg-teal-50 text-teal-700">
                        <FolderArchive className="size-5" />
                    </span>
                    <div>
                        <div className="font-bold">Paket bukti (ZIP)</div>
                        <p className="text-fg-3 mt-1 text-sm">
                            {approvedEvidence} bukti tersahkan, tersusun per komponen dan nomor IK untuk diunggah ke SiPAPI.
                        </p>
                    </div>
                    <a
                        href={route('staf.akreditasi.berkas.package')}
                        className="shadow-teal mt-auto flex h-10 items-center justify-center gap-2 rounded-md bg-teal-400 text-sm font-semibold text-white hover:bg-teal-500"
                    >
                        <Download className="size-4" />
                        Unduh ZIP
                    </a>
                </Card>
            </div>

            <Card>
                <CardTitle
                    aside={
                        <Button variant="secondary" onClick={() => router.post(route('staf.akreditasi.snapshot'), {}, { preserveScroll: true })}>
                            <Camera />
                            Simpan snapshot
                        </Button>
                    }
                >
                    Snapshot penilaian
                </CardTitle>
                <p className="text-fg-3 -mt-2 text-sm">
                    Membekukan skor saat ini (NA {nf(finalScore)} · {predicate.letter}) sebagai riwayat dan bahan simulasi.
                </p>
                {snapshots.map((s) => (
                    <div
                        key={s.id}
                        className="flex items-center justify-between border-b border-slate-200 pb-2 text-sm last:border-0 dark:border-slate-700"
                    >
                        <span className="text-fg-2">{s.taken_at}</span>
                        <span className="font-mono font-semibold">
                            NA {nf(s.finalScore)} · {s.predicate}
                        </span>
                    </div>
                ))}
                {snapshots.length === 0 && <p className="text-fg-3 text-sm">Belum ada snapshot.</p>}
            </Card>
        </StafLayout>
    );
}
