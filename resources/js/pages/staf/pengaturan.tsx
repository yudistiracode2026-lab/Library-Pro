import { Button, Card, CardTitle, inputClass } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { useForm } from '@inertiajs/react';
import { Check, LoaderCircle } from 'lucide-react';
import { type FormEvent } from 'react';

type Settings = {
    loan_days: number;
    max_loans: number;
    max_extensions: number;
    fine_per_day: number;
    clearance_no_loans: boolean;
    clearance_thesis: boolean;
    clearance_donation: boolean;
    clearance_hardcopy: boolean;
    sivitas: number;
    procurement_budget: number;
    ebook_loan_days: number;
    ebook_max_loans: number;
    reading_minutes: number;
    onsite_networks: string;
};

type NumberField = { key: keyof Settings; label: string; unit: string; hint?: string };

const PROFILE: NumberField[] = [
    { key: 'sivitas', label: 'Jumlah sivitas akademika', unit: 'orang', hint: 'Mahasiswa, dosen, dan tendik. Dipakai untuk luas per sivitas.' },
    { key: 'procurement_budget', label: 'Pagu pengadaan per semester', unit: 'Rp' },
];

const RULES: NumberField[] = [
    { key: 'loan_days', label: 'Lama peminjaman', unit: 'hari' },
    { key: 'max_loans', label: 'Maksimal buku dipinjam', unit: 'buku' },
    { key: 'max_extensions', label: 'Maksimal perpanjangan', unit: 'kali' },
    { key: 'fine_per_day', label: 'Denda keterlambatan', unit: 'Rp / hari', hint: 'Isi 0 kalau tidak memakai denda' },
];

const PORTAL: NumberField[] = [
    { key: 'ebook_loan_days', label: 'Lama pinjam e-book', unit: 'hari' },
    { key: 'ebook_max_loans', label: 'Maksimal e-book dipinjam', unit: 'judul' },
    { key: 'reading_minutes', label: 'Durasi satu sesi baca di tempat', unit: 'menit' },
];

const CLEARANCE: { key: keyof Settings; label: string }[] = [
    { key: 'clearance_no_loans', label: 'Tidak ada pinjaman aktif' },
    { key: 'clearance_thesis', label: 'Wajib unggah skripsi PDF ke repositori' },
    { key: 'clearance_donation', label: 'Wajib menyumbang 1 buku (terbitan 5 tahun terakhir)' },
    { key: 'clearance_hardcopy', label: 'Wajib menyerahkan hardcopy skripsi' },
];

export default function Pengaturan({ settings }: { settings: Settings }) {
    const form = useForm<Settings>(settings);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(route('staf.pengaturan.update'), { preserveScroll: true });
    };

    return (
        <StafLayout title="Pengaturan" group="Sistem">
            <form onSubmit={submit} className="flex max-w-3xl flex-col gap-6">
                {[
                    { title: 'Aturan sirkulasi', fields: RULES },
                    { title: 'Data perpustakaan', fields: PROFILE },
                    { title: 'Portal pemustaka', fields: PORTAL },
                ].map(({ title, fields }) => (
                    <Card key={title}>
                        <CardTitle>{title}</CardTitle>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {fields.map((rule) => (
                                <label key={rule.key} className="flex flex-col gap-1.5 text-[13px] font-semibold">
                                    {rule.label}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.data[rule.key] as number}
                                            onChange={(e) => form.setData(rule.key, Number(e.target.value))}
                                            aria-invalid={!!form.errors[rule.key]}
                                            className={`${inputClass} ${rule.key === 'procurement_budget' ? 'max-w-[200px]' : 'max-w-[140px]'}`}
                                        />
                                        <span className="text-fg-3 text-sm font-normal">{rule.unit}</span>
                                    </div>
                                    {form.errors[rule.key] ? (
                                        <span className="text-danger text-xs font-normal">{form.errors[rule.key]}</span>
                                    ) : (
                                        rule.hint && <span className="text-fg-3 text-xs font-normal">{rule.hint}</span>
                                    )}
                                </label>
                            ))}
                        </div>
                    </Card>
                ))}

                <Card>
                    <CardTitle>Jaringan perpustakaan</CardTitle>
                    <p className="text-fg-3 -mt-2 text-sm">
                        Teks lengkap skripsi, tesis, dan disertasi hanya terbuka dari jaringan ini (Wi-Fi perpustakaan), setelah pemustaka presensi
                        masuk. Tulis rentang IP dalam format CIDR, pisahkan dengan koma.
                    </p>
                    <input
                        value={form.data.onsite_networks}
                        onChange={(e) => form.setData('onsite_networks', e.target.value)}
                        aria-label="Jaringan perpustakaan"
                        aria-invalid={!!form.errors.onsite_networks}
                        placeholder="192.168.10.0/24, 10.20.0.0/16"
                        className={`${inputClass} font-mono`}
                    />
                    {form.errors.onsite_networks && <span className="text-danger text-xs">{form.errors.onsite_networks}</span>}
                </Card>

                <Card>
                    <CardTitle>Syarat bebas pustaka</CardTitle>
                    <p className="text-fg-3 -mt-2 text-sm">Syarat yang dimatikan tidak diperiksa saat staf menyetujui pengajuan.</p>
                    <div className="flex flex-col gap-2">
                        {CLEARANCE.map(({ key, label }) => {
                            const on = form.data[key] as boolean;

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    role="checkbox"
                                    aria-checked={on}
                                    onClick={() => form.setData(key, !on)}
                                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-left text-sm font-medium ${on ? 'border-teal-300 bg-teal-50 dark:bg-teal-900' : 'border-slate-200 bg-white dark:bg-slate-800'}`}
                                >
                                    <span
                                        className={`grid size-5 flex-none place-items-center rounded-[5px] border-[1.5px] ${on ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 bg-white'}`}
                                    >
                                        {on && <Check className="size-3.5" strokeWidth={3} />}
                                    </span>
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </Card>

                <Button type="submit" size="lg" disabled={form.processing} className="self-start">
                    {form.processing && <LoaderCircle className="animate-spin" />}
                    Simpan pengaturan
                </Button>
            </form>
        </StafLayout>
    );
}
