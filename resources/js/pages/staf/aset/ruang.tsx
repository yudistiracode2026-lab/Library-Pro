import { Badge } from '@/components/staf/master/cells';
import { Button, Card, CardTitle, IconButton, inputClass, Kpi } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type SelectOption } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface RoomRow {
    id: number;
    floor: number;
    name: string;
    type: string;
    group: 'd' | 'p' | 'f' | 'n';
    typeLabel: string;
    area: number;
    x: number;
    y: number;
    w: number;
    h: number;
    fixed: boolean;
    outside: boolean;
    assets: number;
}

interface AssetRow {
    id: number;
    name: string;
    category: string;
    function: string;
    quantity: number;
    condition: string;
}

interface RuangProps {
    kpis: { area: number; perSivitas: number; sivitas: number; basic: number; supporting: number };
    floor: number;
    rooms: RoomRow[];
    selected: { id: number; assets: AssetRow[] } | null;
    options: { types: SelectOption[]; categories: string[]; functions: Record<string, string[]>; conditions: string[] };
}

const GROUP_STYLE: Record<RoomRow['group'], string> = {
    d: 'bg-success-soft border-success text-[#14532d]',
    p: 'bg-warning-soft border-marigold text-amber-800',
    f: 'bg-[#ffddb0e6] border-[#EFA45A] text-[#8A4A10]',
    n: 'bg-slate-100 border-slate-300 text-fg-3',
};

const LEGEND: [RoomRow['group'], string][] = [
    ['d', 'Ruang dasar'],
    ['p', 'Ruang pendukung'],
    ['f', 'Fasilitas umum'],
    ['n', 'Non-layanan'],
];

const nf = (n: number, digits = 0) => n.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const go = (params: Record<string, number>) => router.get(route('staf.aset.ruang'), params, { preserveState: true, preserveScroll: true });

export default function Ruang({ kpis, floor, rooms, selected, options }: RuangProps) {
    const room = rooms.find((r) => r.id === selected?.id) ?? null;
    const floorRooms = rooms.filter((r) => r.floor === floor);
    const floorArea = floorRooms.reduce((sum, r) => sum + r.area, 0);

    return (
        <StafLayout title="Manajemen aset · ruang & denah" group="Master data">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <Kpi label="Luas perpustakaan" value={`${nf(kpis.area)} m²`} sub="Lantai 2–3 · lantai 1 bukan area perpustakaan" />
                <Kpi
                    label="Luas per sivitas"
                    value={`${nf(kpis.perSivitas, 2)} m²`}
                    sub={`${nf(kpis.sivitas)} sivitas · syarat lebih dari 0,5`}
                    tone={kpis.perSivitas > 0.5 ? 'ok' : 'warn'}
                />
                <Kpi label="Ruang dasar" value={`${kpis.basic} / 4`} sub="koleksi, baca, kerja, layanan" tone={kpis.basic === 4 ? 'ok' : 'warn'} />
                <Kpi label="Ruang pendukung" value={String(kpis.supporting)} sub="diskusi, IT, multimedia, dll" />
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <Card>
                    <CardTitle
                        aside={
                            <div className="flex gap-1 rounded-[10px] bg-slate-100 p-1 dark:bg-slate-700">
                                {[1, 2, 3].map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => go({ lantai: f })}
                                        className={`h-[30px] cursor-pointer rounded-sm px-3 text-[13px] font-semibold ${f === floor ? 'text-fg-1 bg-white shadow-sm dark:bg-slate-800' : 'text-fg-3'}`}
                                    >
                                        Lantai {f}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        Denah ruang lantai {floor}
                    </CardTitle>
                    <p className="text-fg-3 -mt-2 text-[13px]">Luas lantai {nf(floorArea)} m² · klik ruang untuk detail</p>
                    <div className="overflow-x-auto">
                        <div className="relative aspect-[100/66] w-full min-w-[480px] rounded-md bg-slate-50 dark:bg-slate-900">
                            {floorRooms.map((r) => {
                                const on = r.id === room?.id;

                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        disabled={r.fixed}
                                        onClick={() => go({ ruang: r.id })}
                                        title={`${r.name} · ${r.typeLabel}${r.area ? ` · ${r.area} m²` : ''}`}
                                        className={`absolute flex flex-col items-center justify-center overflow-hidden rounded-[4px] p-1 text-center text-[11px] leading-tight font-semibold ${GROUP_STYLE[r.group]} ${r.name === 'Void' ? 'border-2 border-dashed' : on ? 'z-10 border-[3px] shadow-lg' : 'border-2'} ${r.fixed ? 'cursor-default' : 'cursor-pointer hover:brightness-95'}`}
                                        style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
                                    >
                                        <span className="line-clamp-3">{r.name}</span>
                                        {r.area > 0 && <span className="font-mono text-[10px] font-medium opacity-80">{r.area} m²</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="text-fg-3 flex flex-wrap gap-3.5 text-xs">
                        {LEGEND.map(([g, label]) => (
                            <span key={g} className="flex items-center gap-1.5">
                                <span className={`size-3 rounded-[3px] border-2 ${GROUP_STYLE[g]}`} />
                                {label}
                            </span>
                        ))}
                    </div>
                </Card>

                {room && selected && <RoomDetail key={room.id} room={room} assets={selected.assets} options={options} />}
            </div>

            <Card className="gap-0 p-0 md:p-0">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead className="text-fg-3 border-b border-slate-200 bg-slate-50 text-left text-xs tracking-[.06em] uppercase dark:border-slate-700 dark:bg-slate-900">
                            <tr>
                                {['Lantai', 'Ruang', 'Jenis', 'Luas', 'Aset'].map((h) => (
                                    <th key={h} className="px-5 py-3 font-semibold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rooms
                                .filter((r) => !r.fixed)
                                .map((r) => (
                                    <tr
                                        key={r.id}
                                        onClick={() => go({ ruang: r.id })}
                                        className={`cursor-pointer border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 ${r.id === room?.id ? 'bg-teal-50 dark:bg-teal-900' : ''}`}
                                    >
                                        <td className="text-fg-3 px-5 py-2.5">Lt {r.floor}</td>
                                        <td className="px-5 py-2.5 font-semibold">
                                            {r.name}
                                            {r.outside && <span className="text-fg-3 ml-2 text-xs font-normal">bukan area perpustakaan</span>}
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${GROUP_STYLE[r.group]}`}>
                                                {r.typeLabel}
                                            </span>
                                        </td>
                                        <td className="px-5 py-2.5 font-mono">{r.area} m²</td>
                                        <td className="px-5 py-2.5">{r.assets}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </StafLayout>
    );
}

function RoomDetail({ room, assets, options }: { room: RoomRow; assets: AssetRow[]; options: RuangProps['options'] }) {
    const roomForm = useForm({ area_m2: String(room.area), type: room.type });
    const [adding, setAdding] = useState(false);
    const dirty = roomForm.data.area_m2 !== String(room.area) || roomForm.data.type !== room.type;

    const saveRoom = (e: FormEvent) => {
        e.preventDefault();
        roomForm.put(route('staf.aset.ruang.update', room.id), { preserveScroll: true });
    };

    const setQty = (a: AssetRow, quantity: number) =>
        quantity >= 1 && router.patch(route('staf.aset.inventaris.assets.update', a.id), { quantity }, { preserveScroll: true, preserveState: true });

    return (
        <Card>
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                    <span className="text-fg-3 text-xs">Lantai {room.floor}</span>
                    <h2 className="text-lg font-bold">{room.name}</h2>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${GROUP_STYLE[room.group]}`}>{room.typeLabel}</span>
            </div>

            <form onSubmit={saveRoom} className="grid grid-cols-[1fr_1.4fr_auto] items-end gap-2">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                    Luas (m²)
                    <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={roomForm.data.area_m2}
                        onChange={(e) => roomForm.setData('area_m2', e.target.value)}
                        className={inputClass}
                    />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                    Jenis ruang
                    <select value={roomForm.data.type} onChange={(e) => roomForm.setData('type', e.target.value)} className={inputClass}>
                        {options.types.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </label>
                <Button type="submit" variant="secondary" className="h-[42px]" disabled={!dirty || roomForm.processing}>
                    Simpan
                </Button>
            </form>
            {(roomForm.errors.area_m2 || roomForm.errors.type) && (
                <span className="text-danger -mt-2 text-xs">{roomForm.errors.area_m2 ?? roomForm.errors.type}</span>
            )}

            <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">Aset di ruang ini ({assets.length})</span>
            <div className="-mt-2 flex max-h-[320px] flex-col overflow-auto">
                {assets.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 border-b border-slate-200 py-2 text-sm dark:border-slate-700">
                        <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold">{a.name}</div>
                            <div className="text-fg-3 truncate text-xs">
                                {a.category} · {a.function}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <IconButton label="Kurangi" onClick={() => setQty(a, a.quantity - 1)} disabled={a.quantity <= 1}>
                                <Minus className="size-3.5" />
                            </IconButton>
                            <span className="w-8 text-center font-mono text-[13px]">{a.quantity}</span>
                            <IconButton label="Tambah" onClick={() => setQty(a, a.quantity + 1)}>
                                <Plus className="size-3.5" />
                            </IconButton>
                        </div>
                        <Badge tone={a.condition === 'Baik' ? 'success' : a.condition === 'Rusak ringan' ? 'warning' : 'danger'}>{a.condition}</Badge>
                        <IconButton
                            label={`Hapus ${a.name}`}
                            danger
                            onClick={() =>
                                router.delete(route('staf.aset.inventaris.assets.destroy', a.id), { preserveScroll: true, preserveState: true })
                            }
                        >
                            <Trash2 className="size-3.5" />
                        </IconButton>
                    </div>
                ))}
                {assets.length === 0 && <p className="text-fg-3 py-4 text-sm">Belum ada aset tercatat di ruang ini.</p>}
            </div>

            {adding ? (
                <AddAsset roomId={room.id} roomName={room.name} options={options} onClose={() => setAdding(false)} />
            ) : (
                <Button variant="secondary" onClick={() => setAdding(true)} className="border-dashed">
                    <Plus />
                    Tambah perabot / sarana ke ruang ini
                </Button>
            )}
        </Card>
    );
}

function AddAsset({ roomId, roomName, options, onClose }: { roomId: number; roomName: string; options: RuangProps['options']; onClose: () => void }) {
    const form = useForm({
        name: '',
        category: options.categories[0],
        function: options.functions[options.categories[0]][0],
        room_id: String(roomId),
        quantity: '1',
        condition: 'Baik',
        acquired_year: String(new Date().getFullYear()),
        inventory_code: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('staf.aset.inventaris.assets.store'), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-3 rounded-md border border-teal-200 bg-teal-50 p-4 dark:bg-teal-900">
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Entri aset · {roomName}</span>
                <IconButton label="Tutup" onClick={onClose}>
                    <X className="size-4" />
                </IconButton>
            </div>
            <label className="flex flex-col gap-1 text-[13px] font-semibold">
                Nama barang
                <input
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder="mis. Meja baca individu"
                    required
                    className={inputClass}
                />
            </label>
            <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                    Kategori
                    <select
                        value={form.data.category}
                        onChange={(e) =>
                            form.setData((d) => ({ ...d, category: e.target.value, function: options.functions[e.target.value]?.[0] ?? '' }))
                        }
                        className={inputClass}
                    >
                        {options.categories.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                    Fungsi
                    <input
                        value={form.data.function}
                        onChange={(e) => form.setData('function', e.target.value)}
                        list="asset-functions"
                        required
                        className={inputClass}
                    />
                    <datalist id="asset-functions">
                        {(options.functions[form.data.category] ?? []).map((f) => (
                            <option key={f} value={f} />
                        ))}
                    </datalist>
                </label>
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                    Jumlah
                    <input
                        type="number"
                        min={1}
                        value={form.data.quantity}
                        onChange={(e) => form.setData('quantity', e.target.value)}
                        className={inputClass}
                    />
                </label>
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                    Kondisi
                    <select value={form.data.condition} onChange={(e) => form.setData('condition', e.target.value)} className={inputClass}>
                        {options.conditions.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                    Tahun perolehan
                    <input
                        type="number"
                        value={form.data.acquired_year}
                        onChange={(e) => form.setData('acquired_year', e.target.value)}
                        className={inputClass}
                    />
                </label>
                <label className="flex flex-col gap-1 text-[13px] font-semibold">
                    Kode inventaris
                    <input
                        value={form.data.inventory_code}
                        onChange={(e) => form.setData('inventory_code', e.target.value)}
                        placeholder="opsional"
                        className={inputClass}
                    />
                </label>
            </div>
            {Object.values(form.errors)[0] && <span className="text-danger text-xs">{Object.values(form.errors)[0]}</span>}
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>
                    Batal
                </Button>
                <Button type="submit" disabled={form.processing}>
                    Simpan aset
                </Button>
            </div>
        </form>
    );
}
