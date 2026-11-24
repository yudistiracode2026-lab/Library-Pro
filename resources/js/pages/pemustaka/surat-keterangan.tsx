import PemustakaLayout from '@/layouts/pemustaka-layout';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CircleCheck, Download, ScanLine } from 'lucide-react';
import { useState } from 'react';

interface SuratKeteranganProps {
    student: boolean;
    scans: number;
    lastScan: string | null;
    semesters: { value: number; label: string }[];
    programme: string;
}

const field =
    'h-11 rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 text-sm font-normal text-fg-1 outline-none focus:border-teal-400 dark:bg-slate-800';

export default function SuratKeterangan({ student, scans, lastScan, semesters, programme }: SuratKeteranganProps) {
    const { errors } = usePage<SharedData & { errors: Record<string, string> }>().props;
    const [semester, setSemester] = useState('');
    const [kelas, setKelas] = useState('');
    const ready = student && scans > 0;

    return (
        <PemustakaLayout title="Surat keterangan">
            <h1 className="font-display text-[26px] font-bold">Surat keterangan perpustakaan</h1>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-5">
                <section className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                    <span className="font-display text-[17px] font-bold">Tentang surat ini</span>
                    <p className="text-fg-2 text-sm leading-relaxed">
                        Surat dari Kepala UPA Perpustakaan yang menerangkan bahwa kamu taruna yang terdaftar sebagai anggota perpustakaan, pernah
                        berkunjung, meminjam koleksi, dan memakai fasilitas perpustakaan. Nomor surat dan tanda tangan diisi di perpustakaan.
                    </p>
                    {!student ? (
                        <p className="bg-warning-soft rounded-md px-3.5 py-3 text-sm font-semibold text-amber-800">
                            Surat keterangan ini khusus untuk taruna.
                        </p>
                    ) : scans > 0 ? (
                        <p className="flex items-start gap-2 rounded-md bg-teal-50 px-3.5 py-3 text-sm text-teal-800 dark:bg-teal-900/40 dark:text-teal-100">
                            <CircleCheck className="mt-0.5 size-4 flex-none" />
                            <span>
                                Syarat terpenuhi: kamu sudah {scans} kali presensi dengan scan QR. Terakhir {lastScan}.
                            </span>
                        </p>
                    ) : (
                        <p className="bg-warning-soft flex items-start gap-2 rounded-md px-3.5 py-3 text-sm text-amber-800">
                            <ScanLine className="mt-0.5 size-4 flex-none" />
                            <span>
                                Surat bisa diunduh setelah kamu <b>pernah presensi dengan scan QR</b> di meja presensi perpustakaan. Tunjukkan QR di
                                Beranda ke alat pemindai saat masuk perpustakaan.
                            </span>
                        </p>
                    )}
                </section>

                {student && (
                    <form
                        method="get"
                        action={route('pemustaka.surat-keterangan.download')}
                        className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800"
                    >
                        <span className="font-display text-[17px] font-bold">Unduh surat</span>
                        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                            Semester
                            <select
                                name="semester"
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                required
                                disabled={!ready}
                                className={field}
                            >
                                <option value="" disabled>
                                    Pilih semester
                                </option>
                                {semesters.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            {errors.semester && <span className="text-danger text-xs font-normal">{errors.semester}</span>}
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                            Kelas
                            <input
                                name="kelas"
                                value={kelas}
                                onChange={(e) => setKelas(e.target.value)}
                                maxLength={20}
                                placeholder="mis. B"
                                disabled={!ready}
                                className={field}
                            />
                            <span className="text-fg-3 text-xs font-normal">
                                Tertulis di surat: {programme}
                                {kelas.trim() ? ` – Kelas ${kelas.trim().replace(/^kelas\s+/i, '')}` : ''}
                            </span>
                            {errors.kelas && <span className="text-danger text-xs font-normal">{errors.kelas}</span>}
                        </label>
                        <button
                            type="submit"
                            disabled={!ready}
                            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-teal-400 font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            <Download className="size-4" />
                            Unduh surat (PDF)
                        </button>
                    </form>
                )}
            </div>
        </PemustakaLayout>
    );
}
