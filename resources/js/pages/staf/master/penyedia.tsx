import { Cell, StatusBadge } from '@/components/staf/master/cells';
import { MasterPage } from '@/components/staf/master/master-page';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated, type SelectOption } from '@/types';

interface SupplierRow {
    id: number;
    name: string;
    type: string;
    city: string | null;
    contact_name: string | null;
    phone: string | null;
    status: string;
}

interface PenyediaProps {
    records: Paginated<SupplierRow>;
    filters: { q: string };
    options: { types: SelectOption[]; statuses: SelectOption[] };
}

export default function Penyedia({ records, filters, options }: PenyediaProps) {
    return (
        <StafLayout title="Master penyedia buku" group="Master data">
            <MasterPage<SupplierRow>
                routeKey="penyedia"
                heading="Data penyedia buku"
                description="Distributor, toko buku, dan penerbit yang memasok koleksi"
                addLabel="Tambah penyedia"
                records={records}
                filters={filters}
                numbered
                grid="minmax(0,1.8fr) 140px minmax(0,1.4fr) 120px 100px"
                describeRow={(s) => s.name}
                columns={[
                    { label: 'Nama penyedia', render: (s) => <Cell bold>{s.name}</Cell> },
                    { label: 'Jenis', render: (s) => <Cell>{s.type}</Cell> },
                    { label: 'Kontak', render: (s) => <Cell sub={s.phone}>{s.contact_name}</Cell> },
                    { label: 'Kota', render: (s) => <Cell>{s.city}</Cell> },
                    { label: 'Status', render: (s) => <StatusBadge status={s.status} /> },
                ]}
                form={{
                    title: (s) => (s ? 'Ubah penyedia' : 'Tambah penyedia'),
                    empty: { name: '', type: 'Distributor', city: '', contact_name: '', phone: '', status: 'Aktif' },
                    fromRow: (s) => ({
                        name: s.name,
                        type: s.type,
                        city: s.city ?? '',
                        contact_name: s.contact_name ?? '',
                        phone: s.phone ?? '',
                        status: s.status,
                    }),
                    fields: [
                        { name: 'name', label: 'Nama penyedia', span: 2, required: true },
                        { name: 'type', label: 'Jenis', type: 'select', options: options.types, required: true },
                        { name: 'city', label: 'Kota' },
                        { name: 'contact_name', label: 'Nama kontak' },
                        { name: 'phone', label: 'Telepon' },
                        { name: 'status', label: 'Status', type: 'select', options: options.statuses, required: true },
                    ],
                }}
            />
        </StafLayout>
    );
}
