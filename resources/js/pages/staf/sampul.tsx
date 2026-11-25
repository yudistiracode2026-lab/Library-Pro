import { BookCover } from '@/components/book-cover';
import { CoverPicker } from '@/components/staf/cover-capture';
import { Card, inputClass } from '@/components/staf/ui';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated } from '@/types';
import { Link, router } from '@inertiajs/react';
import { BookOpen, Camera, ImagePlus, LoaderCircle, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface CoverBook {
    id: number;
    title: string;
    author: string | null;
    year: string | number | null;
    call_number: string | null;
    ddc_class: string;
    type: 'fisik' | 'ebook';
    cover: string | null;
}

interface Props {
    books: Paginated<CoverBook>;
    filters: { q: string; semua: boolean };
    missing: number;
}

/**
 * Made for the cataloguer's phone: books are typed in on a PC, then this list
 * (newest first, books without a cover by default) is opened on the phone to
 * photograph each one.
 */
export default function Sampul({ books, filters, missing }: Props) {
    const [q, setQ] = useState(filters.q);

    const search = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('staf.sampul'), { q: q.trim() || undefined, semua: filters.semua ? 1 : undefined }, { preserveState: true });
    };

    return (
        <StafLayout title="Foto sampul buku" group="Koleksi">
            <Card>
                <p className="text-fg-2 text-sm">
                    Entri data buku di PC, lalu buka halaman ini di HP. Ketuk <b>Foto</b>, potret sampul, geser keempat titik ke sudut buku, dan
                    simpan. Sampul langsung terpasang di data buku.
                </p>
                <form onSubmit={search} className="mt-3 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="text-fg-4 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Judul, ISBN, no. panggil, atau kode eksemplar"
                            className={`${inputClass} pl-9`}
                            enterKeyHint="search"
                        />
                    </div>
                    <button
                        type="submit"
                        className="h-10 cursor-pointer rounded-[10px] bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
                    >
                        Cari
                    </button>
                </form>
                <div className="mt-3 flex flex-wrap gap-2 text-[13px] font-semibold">
                    <Link
                        href={route('staf.sampul')}
                        className={`rounded-full px-3 py-1.5 ${!filters.semua && !filters.q ? 'bg-teal-600 text-white' : 'text-fg-2 bg-slate-100 dark:bg-slate-800'}`}
                    >
                        Belum bersampul ({missing.toLocaleString('id-ID')})
                    </Link>
                    <Link
                        href={route('staf.sampul', { semua: 1 })}
                        className={`rounded-full px-3 py-1.5 ${filters.semua && !filters.q ? 'bg-teal-600 text-white' : 'text-fg-2 bg-slate-100 dark:bg-slate-800'}`}
                    >
                        Semua buku
                    </Link>
                </div>
            </Card>

            <Card className="p-0">
                {books.data.length === 0 ? (
                    <p className="text-fg-3 p-6 text-center text-sm">{filters.q ? 'Buku tidak ditemukan.' : 'Semua buku sudah bersampul.'}</p>
                ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {books.data.map((b) => (
                            <CoverRow key={b.id} book={b} />
                        ))}
                    </ul>
                )}
            </Card>

            {(books.prev_page_url || books.next_page_url) && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-fg-3">
                        {books.from}–{books.to} dari {books.total.toLocaleString('id-ID')}
                    </span>
                    <div className="flex gap-2">
                        {books.prev_page_url && (
                            <Link
                                href={books.prev_page_url}
                                preserveScroll
                                className="text-fg-1 rounded-[10px] border border-slate-200 px-3 py-2 font-semibold"
                            >
                                Sebelumnya
                            </Link>
                        )}
                        {books.next_page_url && (
                            <Link
                                href={books.next_page_url}
                                preserveScroll
                                className="text-fg-1 rounded-[10px] border border-slate-200 px-3 py-2 font-semibold"
                            >
                                Berikutnya
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </StafLayout>
    );
}

function CoverRow({ book }: { book: CoverBook }) {
    const [uploading, setUploading] = useState(false);

    const upload = (file: File) => {
        setUploading(true);
        router.post(
            route('staf.sampul.store', book.id),
            { cover: file },
            { forceFormData: true, preserveScroll: true, preserveState: true, onFinish: () => setUploading(false) },
        );
    };

    return (
        <li className="flex items-center gap-3 px-4 py-3">
            <BookCover
                cover={book.cover}
                ddc={book.ddc_class}
                zoom={book.title}
                className="grid h-[72px] w-[50px] place-items-center rounded-xs text-white shadow-sm"
            >
                <BookOpen className="size-4" />
            </BookCover>
            <div className="min-w-0 flex-1">
                <p className="text-fg-1 line-clamp-2 text-sm font-semibold">{book.title}</p>
                <p className="text-fg-3 truncate text-xs">
                    {[book.author, book.year, book.call_number].filter(Boolean).join(' · ')}
                    {book.type === 'ebook' && ' · e-book'}
                </p>
            </div>
            <CoverPicker onPicked={upload}>
                {(pick) => (
                    <div className="flex flex-none gap-1.5">
                        <button
                            type="button"
                            onClick={() => pick(false)}
                            disabled={uploading}
                            aria-label={`Pilih gambar sampul ${book.title} dari galeri`}
                            title="Pilih dari galeri"
                            className="text-fg-2 grid size-11 cursor-pointer place-items-center rounded-[10px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-800"
                        >
                            <ImagePlus className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => pick(true)}
                            disabled={uploading}
                            className="flex h-11 cursor-pointer items-center gap-1.5 rounded-[10px] bg-teal-600 px-3.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                        >
                            {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                            {book.cover ? 'Ganti' : 'Foto'}
                        </button>
                    </div>
                )}
            </CoverPicker>
        </li>
    );
}
