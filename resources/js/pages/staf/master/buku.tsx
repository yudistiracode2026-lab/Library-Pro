import { BookCover } from '@/components/book-cover';
import { DdcAssist } from '@/components/staf/ddc-assist';
import { Badge, Cell, COLLECTION_TONES, StatusBadge } from '@/components/staf/master/cells';
import { MasterPage } from '@/components/staf/master/master-page';
import { type FormValues } from '@/components/staf/master/record-form';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated, type SelectOption } from '@/types';
import { router } from '@inertiajs/react';
import { BookOpen, QrCode, Star, Tablet } from 'lucide-react';

interface BookRow {
    id: number;
    type: 'fisik' | 'ebook';
    title: string;
    series_title: string | null;
    author: string;
    authors: string[];
    subjects: string[];
    publisher: string;
    publish_place: string | null;
    year: number | null;
    edition: string | null;
    collation: string | null;
    language: string;
    isbn: string | null;
    classification: string | null;
    abstract: string | null;
    cover: string | null;
    featured: boolean;
    ddc_class: string;
    collection_type: string;
    collection_category: string | null;
    material_type: string | null;
    acquisition: string | null;
    donor: string | null;
    call_number: string | null;
    rack_id: string;
    rack: string | null;
    copies: number;
    available: number;
    format: string | null;
    file_size_mb: number | null;
    has_file: boolean;
    license_count: number | null;
    status: string | null;
}

interface BukuProps {
    records: Paginated<BookRow>;
    filters: { q: string; jenis: string; urut?: string; arah?: string };
    summary: { printed: number; copies: number; ebooks: number };
    options: {
        types: SelectOption[];
        ddc: SelectOption[];
        collectionTypes: SelectOption[];
        materialTypes: SelectOption[];
        acquisitions: SelectOption[];
        formats: SelectOption[];
        ebookStatuses: SelectOption[];
        racks: SelectOption[];
        languages: SelectOption[];
    };
}

const isEbook = (v: FormValues) => v.type === 'ebook';
const isPrinted = (v: FormValues) => v.type !== 'ebook';
/** The DDC class is derived from a classification number such as 346.04. */
const hasClassNumber = (v: FormValues) => /(^|[^0-9])[0-9][0-9xX]{2}([^0-9]|$)/.test(String(v.classification ?? ''));
const suggest = (jenis: string) => route('staf.buku.suggest', { jenis });

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
                numbered
                grid="48px minmax(140px,2.2fr) 90px 120px minmax(120px,1fr) 110px 110px 100px"
                describeRow={(b) => b.title}
                headerActions={
                    <a
                        href={route(
                            'staf.buku.labels',
                            Object.fromEntries(Object.entries({ q: filters.q, jenis: filters.jenis }).filter(([, v]) => v)),
                        )}
                        target="_blank"
                        rel="noopener"
                        title="Label QR untuk semua eksemplar dalam daftar ini (sesuai pencarian dan filter)"
                        className="text-fg-1 flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800"
                    >
                        <QrCode className="size-4" />
                        Cetak label QR
                    </a>
                }
                rowActions={(b) =>
                    b.type === 'fisik' && (
                        <a
                            href={route('staf.buku.labels', { buku: [b.id] })}
                            target="_blank"
                            rel="noopener"
                            title="Cetak label QR"
                            aria-label={`Cetak label QR ${b.title}`}
                            className="text-fg-2 grid size-[34px] place-items-center rounded-[9px] hover:bg-teal-50 hover:text-teal-700"
                        >
                            <QrCode className="size-4" />
                        </a>
                    )
                }
                columns={[
                    {
                        label: 'Cover',
                        render: (b) => (
                            <BookCover
                                cover={b.cover}
                                ddc={b.ddc_class}
                                zoom={b.title}
                                className="grid h-[62px] w-11 place-items-center rounded-xs text-white shadow-sm"
                            >
                                {b.type === 'ebook' ? <Tablet className="size-4" /> : <BookOpen className="size-4" />}
                            </BookCover>
                        ),
                    },
                    {
                        label: 'Judul',
                        sort: 'judul',
                        render: (b) => (
                            <Cell
                                bold
                                sub={`${b.authors.join('; ') || b.author} · ${b.publisher}${b.year ? `, ${b.year}` : ''}${b.classification ? ` · ${b.classification}` : ''}`}
                            >
                                {b.featured && <Star className="mr-1 inline size-3.5 fill-amber-400 text-amber-500" aria-label="Buku unggulan" />}
                                {b.title}
                            </Cell>
                        ),
                    },
                    {
                        label: 'Jenis',
                        sort: 'jenis',
                        render: (b) => <Badge tone={b.type === 'ebook' ? 'teal' : 'slate'}>{b.type === 'ebook' ? 'E-book' : 'Buku fisik'}</Badge>,
                    },
                    {
                        label: 'Asal perolehan',
                        sort: 'perolehan',
                        render: (b) => (
                            <>
                                {b.acquisition ? (
                                    <Badge tone={b.acquisition === 'Pembelian' ? 'teal' : 'warning'}>{b.acquisition}</Badge>
                                ) : (
                                    <span className="text-fg-3">—</span>
                                )}
                                {b.donor && <span className="text-fg-3 mt-0.5 truncate text-xs">dari {b.donor}</span>}
                            </>
                        ),
                    },
                    {
                        label: 'Jenis koleksi',
                        sort: 'koleksi',
                        render: (b) => (
                            <>
                                <Badge tone={COLLECTION_TONES[b.collection_type] ?? 'slate'}>{b.collection_type}</Badge>
                                <span className="text-fg-3 mt-0.5 truncate text-xs">
                                    {b.collection_category} · {b.material_type}
                                </span>
                            </>
                        ),
                    },
                    {
                        label: 'Lokasi',
                        sort: 'lokasi',
                        render: (b) =>
                            b.type === 'ebook' ? (
                                <>
                                    <Cell sub={`${b.format}${b.file_size_mb ? ` · ${b.file_size_mb} MB` : ''}`}>Daring</Cell>
                                    <EbookFile id={b.id} hasFile={b.has_file} />
                                </>
                            ) : (
                                <Cell sub={<span className="font-mono">{b.call_number}</span>}>{b.rack ? `Rak ${b.rack}` : 'Belum ada rak'}</Cell>
                            ),
                    },
                    {
                        label: 'Ketersediaan',
                        sort: 'tersedia',
                        render: (b) =>
                            b.type === 'ebook' ? (
                                <Cell sub="lisensi tersedia">
                                    {b.license_count}/{b.license_count}
                                </Cell>
                            ) : (
                                <Cell sub="eksemplar tersedia">
                                    {b.available}/{b.copies}
                                </Cell>
                            ),
                    },
                    {
                        label: 'Status',
                        sort: 'status',
                        render: (b) =>
                            b.type === 'ebook' ? (
                                <StatusBadge status={b.status ?? 'Draf'} />
                            ) : b.available > 0 ? (
                                <Badge tone="success">Tersedia</Badge>
                            ) : b.copies === 0 ? (
                                <Badge tone="slate">Tanpa eksemplar</Badge>
                            ) : (
                                <Badge tone="warning">Dipinjam semua</Badge>
                            ),
                    },
                ]}
                form={{
                    title: (b) => (b ? 'Ubah koleksi' : 'Tambah koleksi'),
                    switcher: { name: 'type', options: options.types },
                    wide: true,
                    empty: {
                        type: 'fisik',
                        title: '',
                        series_title: '',
                        authors: [],
                        publisher: '',
                        publish_place: '',
                        year: String(new Date().getFullYear()),
                        edition: '',
                        collation: '',
                        language: 'Indonesia',
                        isbn: '',
                        classification: '',
                        ddc_class: '',
                        subjects: [],
                        abstract: '',
                        cover: null,
                        cover_url: null,
                        featured: false,
                        collection_type: 'Buku teks',
                        material_type: '',
                        acquisition: 'Pembelian',
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
                        // Only for the DDC suggestions (not to suggest this title's own number); the server ignores it.
                        _id: b.id,
                        type: b.type,
                        title: b.title,
                        series_title: b.series_title ?? '',
                        authors: b.authors.length ? b.authors : [b.author],
                        publisher: b.publisher,
                        publish_place: b.publish_place ?? '',
                        year: b.year ? String(b.year) : '',
                        edition: b.edition ?? '',
                        collation: b.collation ?? '',
                        language: b.language,
                        isbn: b.isbn ?? '',
                        classification: b.classification ?? '',
                        ddc_class: b.ddc_class,
                        subjects: b.subjects,
                        abstract: b.abstract ?? '',
                        cover: null,
                        cover_url: b.cover,
                        featured: b.featured,
                        collection_type: b.collection_type,
                        material_type: b.material_type ?? '',
                        acquisition: b.acquisition ?? '',
                        donor: b.donor ?? '',
                        call_number: b.call_number ?? '',
                        rack_id: b.rack_id,
                        copies: String(b.copies),
                        format: b.format ?? 'PDF',
                        file_size_mb: b.file_size_mb != null ? String(b.file_size_mb) : '',
                        license_count: String(b.license_count ?? 1),
                        status: b.status ?? 'Terbit',
                    }),
                    fields: [
                        { name: 'title', label: 'Judul', span: 2, required: true, section: 'Data bibliografi' },
                        { name: 'series_title', label: 'Judul seri', span: 2, placeholder: 'Jika ada' },
                        {
                            name: 'authors',
                            label: 'Pengarang',
                            type: 'tags',
                            span: 2,
                            suggestUrl: suggest('pengarang'),
                            placeholder: 'Ketik nama lalu Enter',
                            hint: 'Pengarang pertama menjadi pengarang utama. Nama baru otomatis masuk ke master pengarang.',
                        },
                        { name: 'publisher', label: 'Penerbit', type: 'combobox', suggestUrl: suggest('penerbit'), required: true },
                        { name: 'publish_place', label: 'Tempat terbit', type: 'combobox', suggestUrl: suggest('tempat') },
                        { name: 'year', label: 'Tahun terbit', type: 'number' },
                        { name: 'edition', label: 'Edisi', placeholder: 'mis. Cet. 2, Ed. revisi' },
                        { name: 'isbn', label: 'ISBN/ISSN', placeholder: '978-…' },
                        { name: 'language', label: 'Bahasa', type: 'select', options: options.languages, required: true },
                        {
                            name: 'collation',
                            label: 'Kolasi',
                            span: 2,
                            placeholder: 'mis. xv, 320 hlm.: ilus.; 26 cm',
                            hint: 'Halaman romawi, halaman arab (hlm.), ilustrasi (ilus.), tinggi buku (cm)',
                        },
                        {
                            name: 'classification',
                            label: 'Klasifikasi',
                            placeholder: 'mis. 346.04',
                            hint: 'Kelas DDC utama mengikuti angka ini',
                            section: 'Klasifikasi & subjek',
                            assist: ({ values, set }) => (
                                <DdcAssist values={values} set={set} bookId={typeof values._id === 'number' ? values._id : undefined} />
                            ),
                        },
                        { name: 'ddc_class', label: 'Kelas DDC', type: 'select', options: options.ddc, hidden: hasClassNumber },
                        {
                            name: 'collection_type',
                            label: 'Jenis koleksi',
                            type: 'select',
                            options: options.collectionTypes,
                            required: true,
                            hint: 'Sub-jenis · jenis koleksi SNP Perpusnas',
                        },
                        {
                            name: 'material_type',
                            label: 'Jenis bahan',
                            type: 'select',
                            options: options.materialTypes,
                            hint: 'Kosongkan: Monograf, atau Sumber elektronik untuk e-book',
                        },
                        {
                            name: 'subjects',
                            label: 'Tajuk subjek',
                            type: 'tags',
                            span: 2,
                            suggestUrl: suggest('subjek'),
                            placeholder: 'Ketik subjek lalu Enter',
                        },
                        { name: 'abstract', label: 'Abstrak', type: 'textarea', span: 2 },
                        {
                            name: 'cover',
                            label: 'Gambar sampul',
                            type: 'image',
                            currentImage: (v) => (typeof v.cover_url === 'string' ? v.cover_url : null),
                            hint: 'JPG, PNG, atau WebP, maks. 2 MB',
                        },
                        { name: 'featured', label: 'Buku unggulan', type: 'checkbox', hint: 'tampil di website' },
                        {
                            name: 'acquisition',
                            label: 'Asal perolehan',
                            type: 'select',
                            options: options.acquisitions,
                            required: true,
                            section: 'Perolehan & lokasi',
                        },
                        {
                            name: 'donor',
                            label: 'Nama penyumbang',
                            placeholder: 'Nama orang atau instansi',
                            hidden: (v) => !String(v.acquisition ?? '').startsWith('Sumbangan'),
                        },
                        { name: 'call_number', label: 'No. panggil', required: true, hidden: isEbook, placeholder: 'mis. 346.04 Boe h' },
                        { name: 'rack_id', label: 'Rak', type: 'select', options: options.racks, hidden: isEbook },
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

/** Uploads the PDF members read in the portal (e-book loans). */
function EbookFile({ id, hasFile }: { id: number; hasFile: boolean }) {
    return (
        <label className={`mt-0.5 cursor-pointer self-start text-xs font-semibold ${hasFile ? 'text-teal-600' : 'text-amber-800'}`}>
            {hasFile ? 'Ganti berkas PDF' : 'Unggah berkas PDF'}
            <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) router.post(route('staf.buku.file', id), { file }, { forceFormData: true, preserveScroll: true, preserveState: true });
                    e.target.value = '';
                }}
            />
        </label>
    );
}
