import { IndicatorCard, type IndicatorBrief } from '@/components/staf/akreditasi';
import { RecordForm } from '@/components/staf/master/record-form';
import { Alert, Button, Card, IconButton, PillTabs } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type SelectOption } from '@/types';
import { router } from '@inertiajs/react';
import { Download, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface AssetRow {
    id: number;
    name: string;
    category: string;
    function: string;
    quantity: number;
    condition: string;
    acquired_year: number | null;
    inventory_code: string | null;
    room: string | null;
}

interface LicenseRow {
    id: number;
    name: string;
    usage: string;
    license_type: string | null;
    seats: number;
    status: string;
}

interface InventarisProps {
    indicators: IndicatorBrief[];
    tab: string;
    counts: Record<string, number>;
    assets: AssetRow[];
    licenses: LicenseRow[];
    missingFacilities: string[];
    summary: { units: number; damaged: number; unlicensed: number };
    options: { categories: string[]; functions: Record<string, string[]>; conditions: string[]; licenseStatuses: string[]; rooms: SelectOption[] };
}

const CONDITION_STYLE: Record<string, string> = {
    Baik: 'border-success text-success',
    'Rusak ringan': 'border-marigold text-amber-800',
    'Rusak berat': 'border-danger text-danger',
};

const LICENSE_STYLE: Record<string, string> = {
    Berlisensi: 'border-success text-success',
    'Open source': 'border-teal-400 text-teal-700',
    'Tidak berlisensi': 'border-danger text-danger',
};

const selectClass = 'h-[34px] cursor-pointer rounded-[9px] border-[1.5px] bg-white px-2 text-[13px] font-semibold dark:bg-slate-800';

export default function Inventaris({ tab, assets, licenses, missingFacilities, options, indicators }: InventarisProps) {
    const [form, setForm] = useState<'asset' | 'license' | null>(null);
    const isLicense = tab === 'Lisensi';
    const tabs = ['Semua', ...options.categories, 'Lisensi'];
    const patch = (url: string, data: Record<string, string>) => router.patch(url, data, { preserveScroll: true, preserveState: true });

    return (
        <StafLayout title="Manajemen aset · inventaris & lisensi" group="Master data">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,210px),1fr))] gap-3">
                {indicators.map((ik) => (
                    <IndicatorCard key={ik.number} ik={ik} compact />
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <PillTabs
                    tabs={tabs.map((t) => ({
                        label: t,
                        href: route('staf.aset.inventaris', t === 'Semua' ? {} : { kategori: t }),
                        active: tab === t,
                    }))}
                />
                <div className="flex gap-2">
                    {!isLicense && (
                        <a
                            href={route('staf.aset.inventaris.export')}
                            className="text-fg-1 flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
                        >
                            <Download className="size-4" />
                            Ekspor
                        </a>
                    )}
                    <Button onClick={() => setForm(isLicense ? 'license' : 'asset')}>
                        <Plus />
                        {isLicense ? 'Tambah lisensi' : 'Tambah aset'}
                    </Button>
                </div>
            </div>

            {!isLicense && missingFacilities.length > 0 && (tab === 'Semua' || tab === 'Fasilitas umum') && (
                <Alert tone="warning">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mr-1">Fasilitas umum belum tercatat: {missingFacilities.join(', ')}.</span>
                        {missingFacilities.map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => router.post(route('staf.aset.inventaris.facility'), { function: f }, { preserveScroll: true })}
                                className="h-[30px] cursor-pointer rounded-full border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                            >
                                Catat {f.toLowerCase()}
                            </button>
                        ))}
                    </div>
                </Alert>
            )}

            <Card className="gap-0 p-0 md:p-0">
                <div className="overflow-x-auto">
                    {isLicense ? (
                        <table className="w-full min-w-[720px] text-sm">
                            <Head cols={['No', 'Perangkat lunak', 'Jenis lisensi', 'Unit', 'Status', '']} />
                            <tbody>
                                {licenses.map((l, i) => (
                                    <tr key={l.id} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="text-fg-3 w-12 px-5 py-3 font-mono text-[13px] tabular-nums">{i + 1}</td>
                                        <td className="px-5 py-3">
                                            <div className="font-semibold">{l.name}</div>
                                            <div className="text-fg-3 text-xs">{l.usage}</div>
                                        </td>
                                        <td className="text-fg-2 px-5 py-3">{l.license_type ?? '—'}</td>
                                        <td className="px-5 py-3 font-mono">{l.seats}</td>
                                        <td className="px-5 py-3">
                                            <select
                                                value={l.status}
                                                aria-label={`Status lisensi ${l.name}`}
                                                onChange={(e) =>
                                                    patch(route('staf.aset.inventaris.licenses.update', l.id), { status: e.target.value })
                                                }
                                                className={`${selectClass} ${LICENSE_STYLE[l.status]}`}
                                            >
                                                {options.licenseStatuses.map((s) => (
                                                    <option key={s}>{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <IconButton
                                                label={`Hapus ${l.name}`}
                                                danger
                                                onClick={() =>
                                                    router.delete(route('staf.aset.inventaris.licenses.destroy', l.id), { preserveScroll: true })
                                                }
                                            >
                                                <Trash2 className="size-3.5" />
                                            </IconButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full min-w-[820px] text-sm">
                            <Head cols={['No', 'Aset', 'Fungsi', 'Ruang', 'Jml', 'Kondisi', '']} />
                            <tbody>
                                {assets.map((a, i) => (
                                    <tr key={a.id} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="text-fg-3 w-12 px-5 py-3 font-mono text-[13px] tabular-nums">{i + 1}</td>
                                        <td className="px-5 py-3">
                                            <div className="font-semibold">{a.name}</div>
                                            <div className="text-fg-3 text-xs">
                                                {a.category}
                                                {a.inventory_code && <span className="font-mono"> · {a.inventory_code}</span>}
                                                {a.acquired_year && ` · ${a.acquired_year}`}
                                            </div>
                                        </td>
                                        <td className="text-fg-2 px-5 py-3">{a.function}</td>
                                        <td className="text-fg-2 px-5 py-3">{a.room ?? '—'}</td>
                                        <td className="px-5 py-3 font-mono">{a.quantity}</td>
                                        <td className="px-5 py-3">
                                            <select
                                                value={a.condition}
                                                aria-label={`Kondisi ${a.name}`}
                                                onChange={(e) =>
                                                    patch(route('staf.aset.inventaris.assets.update', a.id), { condition: e.target.value })
                                                }
                                                className={`${selectClass} ${CONDITION_STYLE[a.condition]}`}
                                            >
                                                {options.conditions.map((c) => (
                                                    <option key={c}>{c}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <IconButton
                                                label={`Hapus ${a.name}`}
                                                danger
                                                onClick={() =>
                                                    router.delete(route('staf.aset.inventaris.assets.destroy', a.id), { preserveScroll: true })
                                                }
                                            >
                                                <Trash2 className="size-3.5" />
                                            </IconButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!isLicense && assets.length === 0 && <p className="text-fg-3 py-10 text-center text-sm">Belum ada aset di kategori ini.</p>}
                </div>
            </Card>

            {form === 'asset' && (
                <RecordForm
                    open
                    onOpenChange={(open) => !open && setForm(null)}
                    title="Tambah aset"
                    method="post"
                    url={route('staf.aset.inventaris.assets.store')}
                    initial={{
                        name: '',
                        category: tab !== 'Semua' ? tab : options.categories[0],
                        function: '',
                        room_id: '',
                        quantity: '1',
                        condition: 'Baik',
                        acquired_year: String(new Date().getFullYear()),
                        inventory_code: '',
                    }}
                    fields={[
                        { name: 'name', label: 'Nama barang', span: 2, required: true },
                        {
                            name: 'category',
                            label: 'Kategori',
                            type: 'select',
                            options: options.categories.map((c) => ({ value: c, label: c })),
                            required: true,
                        },
                        { name: 'function', label: 'Fungsi', type: 'combobox', suggestions: Object.values(options.functions).flat(), required: true },
                        { name: 'room_id', label: 'Ruang', type: 'select', options: options.rooms, required: true, span: 2 },
                        { name: 'quantity', label: 'Jumlah', type: 'number', required: true },
                        {
                            name: 'condition',
                            label: 'Kondisi',
                            type: 'select',
                            options: options.conditions.map((c) => ({ value: c, label: c })),
                            required: true,
                        },
                        { name: 'acquired_year', label: 'Tahun perolehan', type: 'number' },
                        { name: 'inventory_code', label: 'Kode inventaris', placeholder: 'mis. 3.05.02.01.003' },
                    ]}
                />
            )}
            {form === 'license' && (
                <RecordForm
                    open
                    onOpenChange={(open) => !open && setForm(null)}
                    title="Tambah lisensi"
                    method="post"
                    url={route('staf.aset.inventaris.licenses.store')}
                    initial={{ name: '', usage: '', license_type: '', seats: '1', status: options.licenseStatuses[0] }}
                    fields={[
                        { name: 'name', label: 'Nama perangkat lunak', span: 2, required: true },
                        { name: 'usage', label: 'Dipakai untuk', span: 2, required: true },
                        { name: 'license_type', label: 'Jenis lisensi', placeholder: 'mis. OEM, GPL, langganan' },
                        { name: 'seats', label: 'Jumlah unit', type: 'number', required: true },
                        {
                            name: 'status',
                            label: 'Status',
                            type: 'select',
                            options: options.licenseStatuses.map((s) => ({ value: s, label: s })),
                            required: true,
                        },
                    ]}
                />
            )}
        </StafLayout>
    );
}

function Head({ cols }: { cols: string[] }) {
    return (
        <thead className="text-fg-3 border-b border-slate-200 bg-slate-50 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900">
            <tr>
                {cols.map((c) => (
                    <th key={c} className="px-5 py-3 font-semibold">
                        {c}
                    </th>
                ))}
            </tr>
        </thead>
    );
}
