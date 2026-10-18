import { Badge, Cell } from '@/components/staf/master/cells';
import { MasterPage } from '@/components/staf/master/master-page';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated, type SelectOption } from '@/types';

interface AuthorRow {
    id: number;
    name: string;
    type: string;
    books_count: number;
    sample: string | null;
}

interface PengarangProps {
    records: Paginated<AuthorRow>;
    filters: { q: string; urut?: string; arah?: string };
    options: { types: SelectOption[] };
}

export default function Pengarang({ records, filters, options }: PengarangProps) {
    return (
        <StafLayout title="Master pengarang" group="Master data">
            <MasterPage<AuthorRow>
                routeKey="pengarang"
                heading="Data pengarang"
                description="Pengarang baru juga otomatis tercatat saat menambah buku atau e-book"
                addLabel="Tambah pengarang"
                records={records}
                filters={filters}
                numbered
                grid="minmax(0,1.4fr) 120px 130px minmax(0,1.8fr)"
                describeRow={(a) => a.name}
                columns={[
                    { label: 'Pengarang', sort: 'nama', render: (a) => <Cell bold>{a.name}</Cell> },
                    { label: 'Jenis', sort: 'jenis', render: (a) => <Badge tone={a.type === 'Lembaga' ? 'warning' : 'teal'}>{a.type}</Badge> },
                    { label: 'Judul di koleksi', sort: 'judul', render: (a) => <Cell sub="judul">{a.books_count}</Cell> },
                    { label: 'Contoh judul', sort: 'contoh', render: (a) => <Cell>{a.sample}</Cell> },
                ]}
                form={{
                    title: (a) => (a ? 'Ubah pengarang' : 'Tambah pengarang'),
                    empty: { name: '', type: 'Perorangan' },
                    fromRow: (a) => ({ name: a.name, type: a.type }),
                    fields: [
                        { name: 'name', label: 'Nama pengarang', span: 2, required: true },
                        { name: 'type', label: 'Jenis', type: 'select', options: options.types, required: true },
                    ],
                }}
            />
        </StafLayout>
    );
}
