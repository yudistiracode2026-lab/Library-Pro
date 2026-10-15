import { Cell, StatusBadge } from '@/components/staf/master/cells';
import { MasterPage } from '@/components/staf/master/master-page';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated, type SelectOption } from '@/types';

interface PublisherRow {
    id: number;
    name: string;
    city: string | null;
    status: string;
    printed_count: number;
    ebook_count: number;
}

interface PenerbitProps {
    records: Paginated<PublisherRow>;
    filters: { q: string };
    options: { statuses: SelectOption[] };
}

export default function Penerbit({ records, filters, options }: PenerbitProps) {
    return (
        <StafLayout title="Master penerbit" group="Master data">
            <MasterPage<PublisherRow>
                routeKey="penerbit"
                heading="Data penerbit"
                description="Penerbit baru juga otomatis tercatat saat menambah buku atau e-book"
                addLabel="Tambah penerbit"
                records={records}
                filters={filters}
                grid="minmax(0,1.8fr) 130px 110px 100px 100px"
                describeRow={(p) => p.name}
                columns={[
                    { label: 'Penerbit', render: (p) => <Cell bold>{p.name}</Cell> },
                    { label: 'Kota', render: (p) => <Cell>{p.city}</Cell> },
                    { label: 'Buku fisik', render: (p) => <Cell sub="judul">{p.printed_count}</Cell> },
                    { label: 'E-book', render: (p) => <Cell sub="judul">{p.ebook_count}</Cell> },
                    { label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
                ]}
                form={{
                    title: (p) => (p ? 'Ubah penerbit' : 'Tambah penerbit'),
                    empty: { name: '', city: '', status: 'Aktif' },
                    fromRow: (p) => ({ name: p.name, city: p.city ?? '', status: p.status }),
                    fields: [
                        { name: 'name', label: 'Nama penerbit', span: 2, required: true },
                        { name: 'city', label: 'Kota' },
                        { name: 'status', label: 'Status', type: 'select', options: options.statuses, required: true },
                    ],
                }}
            />
        </StafLayout>
    );
}
