import { Badge, Cell, COLLECTION_TONES, DDC_COLORS, StatusBadge } from '@/components/staf/master/cells';
import { MasterPage } from '@/components/staf/master/master-page';
import { type FormValues } from '@/components/staf/master/record-form';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated, type SelectOption } from '@/types';
import { BookOpen, Tablet } from 'lucide-react';

interface BookRow {
    id: number;
    type: 'fisik' | 'ebook';
    title: string;
    author: string;
    publisher: string;
    year: number | null;
    isbn: string | null;
    ddc_class: string;
    collection_type: string;
    acquisition: string;
    donor: string | null;
    call_number: string | null;
    rack_id: string;
    rack: string | null;
    copies: number;
    available: number;
    format: string | null;
    file_size_mb: number | null;
    license_count: number | null;
    status: string | null;
}

interface BukuProps {
    records: Paginated<BookRow>;
    filters: { q: string; jenis: string };
    summary: { printed: number; copies: number; ebooks: number };
    options: {
        types: SelectOption[];
        ddc: SelectOption[];
        collectionTypes: SelectOption[];
        acquisitions: SelectOption[];
        formats: SelectOption[];
        ebookStatuses: SelectOption[];
        racks: SelectOption[];
        authors: string[];
        publishers: string[];
    };
}

const isEbook = (v: FormValues) => v.type === 'ebook';
const isPrinted = (v: FormValues) => v.type !== 'ebook';

export default function Buku({ records, filters, summary, options }: BukuProps) {
    return (
        <StafLayout title="Master buku & e-book" group="Master data">
            <MasterPage<BookRow>
                routeKey="buku"
                heading="Data buku & e-book"
                description={`${summary.printed} judul buku fisik (${summary.copies} eksemplar) · ${summary.ebooks} judul e-book`}
                addLabel="Tambah koleksi"
                records={records}
                filters={filters}
                tabs={[{ value: '', label: 'Semua' }, ...options.types]}
                grid="44px minmax(0,2.4fr) 140px minmax(0,1.2fr) 120px 100px 120px"
                describeRow={(b) => b.title}
                columns={[
                    {
                        label: 'Cover',
                        render: (b) => (
                            <span
                                title={b.type === 'ebook' ? 'E-book' : 'Buku fisik'}
                                className={`grid h-[62px] w-11 place-items-center rounded-xs text-white shadow-sm ${DDC_COLORS[b.ddc_class]}`}
                            >
                                {b.type === 'ebook' ? <Tablet className="size-4" /> : <BookOpen className="size-4" />}
                            </span>
                        ),
                    },
                    {
                        label: 'Judul',
                        render: (b) => (
                            <Cell bold sub={`${b.author} · ${b.publisher}${b.year ? `, ${b.year}` : ''}`}>
                                {b.title}
                            </Cell>
                        ),
                    },
                    {
                        label: 'Asal perolehan',
                        render: (b) => (
                            <>
                                <Badge tone={b.acquisition === 'Pengadaan' ? 'teal' : 'warning'}>{b.acquisition}</Badge>
                                {b.donor && <span className="text-fg-3 mt-0.5 truncate text-xs">dari {b.donor}</span>}
                            </>
                        ),
                    },
                    {
                        label: 'Klasifikasi koleksi',
                        render: (b) => <Badge tone={COLLECTION_TONES[b.collection_type] ?? 'slate'}>{b.collection_type}</Badge>,
                    },
                    {
                        label: 'Lokasi',
                        render: (b) =>
                            b.type === 'ebook' ? (
                                <Cell sub={`${b.format}${b.file_size_mb ? ` · ${b.file_size_mb} MB` : ''}`}>Daring</Cell>
                            ) : (
                                <Cell sub={<span className="font-mono">{b.call_number}</span>}>Rak {b.rack}</Cell>
                            ),
                    },
                    {
                        label: 'Ketersediaan',
                        render: (b) =>
                            b.type === 'ebook' ? (
                                <Cell sub="lisensi">{b.license_count}</Cell>
                            ) : (
                                <Cell sub="tersedia">
                                    {b.available}/{b.copies}
                                </Cell>
                            ),
                    },
                    {
                        label: 'Status',
                        render: (b) =>
                            b.type === 'ebook' ? (
                                <StatusBadge status={b.status ?? 'Draf'} />
                            ) : b.available > 0 ? (
                                <Badge tone="success">Tersedia</Badge>
                            ) : (
                                <Badge tone="warning">Dipinjam semua</Badge>
                            ),
                    },
                ]}
                form={{
                    title: (b) => (b ? 'Ubah koleksi' : 'Tambah koleksi'),
                    switcher: { name: 'type', options: options.types },
                    empty: {
                        type: 'fisik',
                        title: '',
                        author: '',
                        publisher: '',
                        year: String(new Date().getFullYear()),
                        isbn: '',
                        ddc_class: '',
                        collection_type: 'Buku teks',
                        acquisition: 'Pengadaan',
                        donor: '',
                        call_number: '',
                        rack_id: '',
                        copies: '1',
                        format: 'PDF',
                        file_size_mb: '',
                        license_count: '1',
                        status: 'Terbit',
                    },
                    fromRow: (b) => ({
                        type: b.type,
                        title: b.title,
                        author: b.author,
                        publisher: b.publisher,
                        year: b.year ? String(b.year) : '',
                        isbn: b.isbn ?? '',
                        ddc_class: b.ddc_class,
                        collection_type: b.collection_type,
                        acquisition: b.acquisition,
                        donor: b.donor ?? '',
                        call_number: b.call_number ?? '',
                        rack_id: b.rack_id,
                        copies: String(b.copies || 1),
                        format: b.format ?? 'PDF',
                        file_size_mb: b.file_size_mb != null ? String(b.file_size_mb) : '',
                        license_count: String(b.license_count ?? 1),
                        status: b.status ?? 'Terbit',
                    }),
                    fields: [
                        { name: 'title', label: 'Judul', span: 2, required: true },
                        {
                            name: 'author',
                            label: 'Pengarang',
                            type: 'combobox',
                            suggestions: options.authors,
                            required: true,
                            hint: 'Nama baru otomatis masuk ke master pengarang',
                        },
                        { name: 'publisher', label: 'Penerbit', type: 'combobox', suggestions: options.publishers, required: true },
                        { name: 'year', label: 'Tahun', type: 'number' },
                        { name: 'isbn', label: 'ISBN', placeholder: '978-…' },
                        { name: 'ddc_class', label: 'Kelas DDC', type: 'select', options: options.ddc, required: true },
                        { name: 'collection_type', label: 'Klasifikasi koleksi', type: 'select', options: options.collectionTypes, required: true },
                        { name: 'acquisition', label: 'Asal perolehan', type: 'select', options: options.acquisitions, required: true },
                        { name: 'donor', label: 'Nama penyumbang', hidden: (v) => v.acquisition !== 'Sumbangan mahasiswa' },
                        { name: 'call_number', label: 'No. panggil', required: true, hidden: isEbook },
                        { name: 'rack_id', label: 'Rak', type: 'select', options: options.racks, required: true, hidden: isEbook },
                        { name: 'copies', label: 'Jumlah eksemplar', type: 'number', required: true, hidden: isEbook },
                        { name: 'format', label: 'Format', type: 'select', options: options.formats, required: true, hidden: isPrinted },
                        { name: 'license_count', label: 'Jumlah lisensi', type: 'number', required: true, hidden: isPrinted },
                        { name: 'file_size_mb', label: 'Ukuran berkas (MB)', type: 'number', step: '0.1', hidden: isPrinted },
                        { name: 'status', label: 'Status', type: 'select', options: options.ebookStatuses, required: true, hidden: isPrinted },
                    ],
                }}
            />
        </StafLayout>
    );
}
