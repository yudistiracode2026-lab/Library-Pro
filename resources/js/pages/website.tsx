import AppLogoIcon from '@/components/app-logo-icon';
import { BookCover } from '@/components/book-cover';
import { Pager } from '@/components/pager';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BookCopy,
    BookLock,
    BookOpen,
    Clock,
    Database,
    FileCheck2,
    Footprints,
    GraduationCap,
    Info,
    LibraryBig,
    Lightbulb,
    Lock,
    LogIn,
    type LucideProps,
    Map,
    MapPin,
    MessageCircleQuestion,
    Monitor,
    Repeat,
    Search,
    SearchX,
    ShieldCheck,
    Star,
    TabletSmartphone,
    Users,
    UsersRound,
} from 'lucide-react';
import { type ComponentType, type FormEvent, useState } from 'react';

interface Card {
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
    abstract: string | null;
    cover: string | null;
    ddc_class: string;
    collection_type: string;
    call_number: string | null;
    rack: string | null;
    floor: number | null;
    copies: number;
    available: number;
    format: string | null;
}

interface WebsiteProps {
    hero: { title: string; subtitle: string };
    today: { open: boolean; label: string };
    schedule: { label: string; hours: string; note: string; today: boolean; closed: boolean }[];
    stats: [string, string, string][];
    filters: { q: string; field: string; type: string; available: boolean };
    resultCount: number;
    results: Card[];
    resultPage: { current: number; last: number; from: number | null; to: number | null };
    classes: { code: string; name: string; count: number }[];
    selectedClass: string;
    gallery: Card[];
    collectionTypes: string[];
    services: { icon: string; name: string; description: string }[];
    facilities: { icon: string; name: string; description: string }[];
    news: { id: number; tag: string; title: string; excerpt: string | null; date: string }[];
}

const ICONS: Record<string, ComponentType<LucideProps>> = {
    'book-copy': BookCopy,
    'library-big': LibraryBig,
    'graduation-cap': GraduationCap,
    'tablet-smartphone': TabletSmartphone,
    users: Users,
    footprints: Footprints,
    repeat: Repeat,
    'file-check-2': FileCheck2,
    'book-lock': BookLock,
    'message-circle-question': MessageCircleQuestion,
    database: Database,
    lightbulb: Lightbulb,
    'book-open': BookOpen,
    'users-round': UsersRound,
    monitor: Monitor,
    map: Map,
    lock: Lock,
};

const NAV = [
    ['#beranda', 'Beranda'],
    ['#opac', 'OPAC'],
    ['#koleksi', 'Koleksi'],
    ['#fasilitas', 'Fasilitas'],
    ['#layanan', 'Layanan'],
    ['#berita', 'Berita'],
];

const POPULAR = [
    ['Reforma agraria', 'reforma agraria'],
    ['SIG', 'geografis'],
    ['Pendaftaran tanah', 'pendaftaran tanah'],
    ['GNSS', 'GNSS'],
];

const TAG_STYLE: Record<string, string> = {
    Pengumuman: 'bg-warning-soft text-amber-800',
    'Koleksi baru': 'bg-teal-50 text-teal-700',
    Kegiatan: 'bg-danger-soft text-berry',
};

const inputClass = 'h-12 rounded-md border-[1.5px] border-slate-300 bg-white px-3.5 text-sm text-fg-1 outline-none focus:border-teal-400';

function Icon({ name, ...props }: { name: string } & LucideProps) {
    const C = ICONS[name] ?? BookOpen;
    return <C {...props} />;
}

export default function Website(props: WebsiteProps) {
    const { auth } = usePage<SharedData>().props;
    const {
        hero,
        today,
        schedule,
        stats,
        filters,
        resultCount,
        results,
        resultPage,
        classes,
        selectedClass,
        gallery,
        collectionTypes,
        services,
        facilities,
        news,
    } = props;
    const [q, setQ] = useState(filters.q);
    const [detail, setDetail] = useState<Card | null>(null);

    // Any change but the page number starts again at page 1.
    const search = (params: Partial<{ q: string; field: string; type: string; tersedia: string; hal: string }>) => {
        const next = { q, field: filters.field, type: filters.type, tersedia: filters.available ? '1' : '', kelas: selectedClass, ...params };
        router.get(
            route('home'),
            Object.fromEntries(
                Object.entries(next).filter(([k, v]) => v !== '' && !(k === 'field' && v === 'all') && !(k === 'kelas' && v === '300')),
            ),
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => document.getElementById('opac')?.scrollIntoView({ behavior: 'smooth' }),
            },
        );
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        search({ q });
    };

    return (
        <>
            <Head title="Perpustakaan Politeknik Agraria STPN" />
            <div className="text-fg-1 min-h-screen scroll-smooth bg-slate-50">
                <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
                    <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-6 px-4 md:px-6">
                        <a href="#beranda" className="flex items-center gap-3">
                            <AppLogoIcon className="size-11 rounded-full bg-white" />
                            <span className="flex flex-col leading-tight">
                                <span className="font-display text-[15px] font-extrabold tracking-[.04em]">PUSTAGRA</span>
                                <span className="text-fg-3 hidden text-xs sm:block">Perpustakaan Politeknik Agraria STPN</span>
                            </span>
                        </a>
                        <nav className="ml-auto hidden gap-1 lg:flex">
                            {NAV.map(([href, label]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="text-fg-2 rounded-sm px-3 py-2 text-sm font-medium hover:bg-teal-50 hover:text-teal-700"
                                >
                                    {label}
                                </a>
                            ))}
                        </nav>
                        <div className="ml-auto flex gap-2 lg:ml-0">
                            <Link
                                href={auth.user ? route('dashboard') : route('login')}
                                className="shadow-teal flex h-10 items-center gap-2 rounded-md bg-teal-400 px-4 text-sm font-semibold text-white hover:bg-teal-500"
                            >
                                <LogIn className="size-4" />
                                {auth.user ? 'Buka portal' : 'Masuk'}
                            </Link>
                        </div>
                    </div>
                </header>

                <section
                    id="beranda"
                    className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 pt-10 pb-12 md:px-6 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12"
                >
                    <div className="flex flex-col gap-6">
                        <span className="inline-flex items-center gap-2 self-start rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold tracking-[.08em] text-teal-700 uppercase">
                            <MapPin className="size-3.5" />
                            Yogyakarta · sejak 1963
                        </span>
                        <h1 className="text-4xl leading-[1.08] font-extrabold tracking-tight text-balance md:text-[52px]">{hero.title}</h1>
                        <p className="text-fg-2 max-w-xl text-lg leading-relaxed text-pretty">{hero.subtitle}</p>
                        <form onSubmit={submit} className="flex max-w-xl gap-2 rounded-lg bg-white p-2 shadow-lg">
                            <label className="text-fg-3 flex min-w-0 flex-1 items-center gap-2.5 px-2 sm:px-3">
                                <Search className="size-5 flex-none" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Judul, pengarang, subjek, atau ISBN"
                                    aria-label="Cari koleksi"
                                    className="text-fg-1 h-11 min-w-0 flex-1 bg-transparent text-base outline-none"
                                />
                            </label>
                            <button
                                type="submit"
                                className="h-12 flex-none cursor-pointer rounded-md bg-teal-400 px-4 font-semibold text-white hover:bg-teal-500 active:scale-[.98] sm:px-5"
                            >
                                Cari<span className="hidden sm:inline"> di OPAC</span>
                            </button>
                        </form>
                        <div className="text-fg-3 flex flex-wrap items-center gap-2 text-[13px]">
                            Populer:
                            {POPULAR.map(([label, query]) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => {
                                        setQ(query);
                                        search({ q: query, field: 'all' });
                                    }}
                                    className="text-fg-2 cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative h-[340px] sm:h-[380px] lg:h-[440px]">
                        <div className="bg-grad-leaf absolute inset-[0_0_40px_24px] flex flex-col items-center justify-center gap-4 overflow-hidden rounded-xl p-6 text-center text-white shadow-xl sm:inset-[0_0_40px_40px] sm:p-8">
                            <AppLogoIcon className="size-24 rounded-full bg-white p-2 shadow-lg sm:size-28" />
                            <span className="font-display text-xl font-extrabold sm:text-2xl">Perpustakaan Politeknik Agraria STPN</span>
                            <span className="max-w-sm text-sm text-teal-50">
                                Koleksi pertanahan, survei, dan tata ruang untuk sivitas STPN dan masyarakat umum.
                            </span>
                        </div>
                        <div className="absolute bottom-0 left-0 flex items-center gap-3.5 rounded-lg bg-white px-5 py-4 shadow-lg">
                            <span
                                className={`grid size-11 place-items-center rounded-md ${today.open ? 'bg-success-soft text-success' : 'text-fg-3 bg-slate-100'}`}
                            >
                                <Clock className="size-5" />
                            </span>
                            <div>
                                <div className="font-display font-bold">{today.open ? 'Buka sekarang' : 'Sedang tutup'}</div>
                                <div className="text-fg-3 text-[13px]">{today.label}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {stats.map(([icon, value, label]) => (
                            <div key={label} className="flex flex-col gap-2.5 rounded-lg bg-white p-5 shadow-sm">
                                <span className="grid size-9 place-items-center rounded-[10px] bg-teal-50 text-teal-700">
                                    <Icon name={icon} className="size-[18px]" />
                                </span>
                                <span className="font-display text-[26px] font-extrabold tracking-tight">{value}</span>
                                <span className="text-fg-3 text-[13px]">{label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="opac" className="scroll-mt-[68px] border-y border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-16 md:px-6">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">OPAC · katalog daring</span>
                                <h2 className="mt-1 text-3xl font-bold">Cari koleksi</h2>
                            </div>
                            <span className="text-fg-3 text-sm">{resultCount} hasil ditemukan</span>
                        </div>
                        <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
                            <label className="text-fg-3 flex h-12 min-w-[260px] flex-[1_1_320px] items-center gap-2.5 rounded-md border-[1.5px] border-slate-300 px-3.5">
                                <Search className="size-4" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Ketik kata kunci…"
                                    aria-label="Kata kunci"
                                    className="text-fg-1 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                                />
                            </label>
                            <select
                                value={filters.field}
                                onChange={(e) => search({ field: e.target.value })}
                                aria-label="Bidang"
                                className={inputClass}
                            >
                                <option value="all">Semua bidang</option>
                                <option value="title">Judul</option>
                                <option value="author">Pengarang</option>
                                <option value="subject">Subjek / no. panggil</option>
                                <option value="isbn">ISBN</option>
                            </select>
                            <select
                                value={filters.type}
                                onChange={(e) => search({ type: e.target.value })}
                                aria-label="Jenis koleksi"
                                className={inputClass}
                            >
                                <option value="">Semua jenis</option>
                                <option value="fisik">Buku fisik</option>
                                <option value="ebook">E-book</option>
                                {collectionTypes.map((t) => (
                                    <option key={t}>{t}</option>
                                ))}
                            </select>
                            <label className="text-fg-2 flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={filters.available}
                                    onChange={(e) => search({ tersedia: e.target.checked ? '1' : '' })}
                                    className="size-[18px] accent-teal-500"
                                />
                                Hanya yang tersedia
                            </label>
                        </form>
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                            {results.map((b) => (
                                <div
                                    key={b.id}
                                    className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-4 border-b border-slate-200 bg-white px-4 py-4 last:border-0 hover:bg-slate-50 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:px-5"
                                >
                                    <BookCover
                                        cover={b.cover}
                                        ddc={b.ddc_class}
                                        zoom={b.title}
                                        className="h-[70px] w-full overflow-hidden rounded-[6px] p-1.5 text-[8px] leading-tight font-bold text-white shadow-sm"
                                    >
                                        {b.title}
                                    </BookCover>
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-fg-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold">
                                                {b.type === 'ebook' ? 'E-book' : b.collection_type}
                                            </span>
                                            {b.call_number && <span className="text-fg-3 font-mono text-xs">{b.call_number}</span>}
                                        </div>
                                        <div className="font-display text-[17px] font-bold">{b.title}</div>
                                        <div className="text-fg-3 text-sm">
                                            {b.authors.join('; ') || b.author} · {b.publisher}
                                            {b.year ? `, ${b.year}` : ''}
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-end gap-4 sm:col-span-1">
                                        <Availability book={b} />
                                        <button
                                            type="button"
                                            onClick={() => setDetail(b)}
                                            className="h-10 cursor-pointer rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                                        >
                                            Detail
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {results.length === 0 && (
                                <div className="text-fg-3 flex flex-col items-center gap-2 p-12 text-center">
                                    <SearchX className="size-7" />
                                    Belum ada koleksi yang cocok. Coba kata kunci lain, ya.
                                </div>
                            )}
                        </div>
                        {resultPage.last > 1 && (
                            <div className="flex flex-col items-center gap-2">
                                <Pager page={resultPage.current} last={resultPage.last} onPage={(page) => search({ hal: String(page) })} />
                                <p className="text-fg-3 text-center text-sm">
                                    Menampilkan {resultPage.from}–{resultPage.to} dari {resultCount} hasil
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section id="koleksi" className="mx-auto flex max-w-[1200px] scroll-mt-[68px] flex-col gap-6 px-4 py-20 md:px-6">
                    <div>
                        <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">Galeri koleksi</span>
                        <h2 className="mt-1 text-3xl font-bold">Jelajahi berdasarkan klasifikasi DDC</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {classes.map((c) => (
                            <Link
                                key={c.code}
                                href={route('home', { ...(filters.q ? { q: filters.q } : {}), kelas: c.code })}
                                preserveScroll
                                preserveState
                                className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium ${c.code === selectedClass ? 'border-teal-400 bg-teal-400 text-white' : 'text-fg-2 border-slate-200 bg-white'}`}
                            >
                                {c.code === 'unggulan' ? <Star className="size-3.5" /> : <span className="font-mono text-xs">{c.code}</span>}
                                {c.name} ({c.count})
                            </Link>
                        ))}
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-6">
                        {gallery.map((b) => (
                            <button
                                key={b.id}
                                type="button"
                                onClick={() => setDetail(b)}
                                className="flex cursor-pointer flex-col gap-2.5 text-left hover:-translate-y-0.5"
                            >
                                <BookCover
                                    cover={b.cover}
                                    ddc={b.ddc_class}
                                    className="flex aspect-[2/3] w-full flex-col justify-between rounded-sm p-3.5 text-white shadow-md"
                                >
                                    <span className="font-mono text-[10px] opacity-85">{b.call_number ?? b.format}</span>
                                    <span className="font-display text-[15px] leading-tight font-extrabold">{b.title}</span>
                                    <span className="text-[11px] opacity-85">{b.author}</span>
                                </BookCover>
                                <span className="text-sm leading-snug font-semibold">{b.title}</span>
                                <span className="text-fg-3 text-xs">
                                    {b.year} · {b.type === 'ebook' ? 'E-book' : b.available > 0 ? `${b.available} tersedia` : 'Sedang dipinjam'}
                                </span>
                            </button>
                        ))}
                        {gallery.length === 0 && <p className="text-fg-3 text-sm">Belum ada koleksi di kelas ini.</p>}
                    </div>
                </section>

                <section id="fasilitas" className="scroll-mt-[68px] bg-teal-50">
                    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-20 md:px-6">
                        <div>
                            <span className="text-xs font-semibold tracking-[.08em] text-teal-700 uppercase">Fasilitas</span>
                            <h2 className="mt-1 text-3xl font-bold">Ruang untuk membaca, berdiskusi, dan meneliti</h2>
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                            {facilities.map((f) => (
                                <div key={f.name} className="flex flex-col gap-2 rounded-lg bg-white p-5 shadow-sm">
                                    <span className="grid size-11 place-items-center rounded-md bg-teal-50 text-teal-700">
                                        <Icon name={f.icon} className="size-5" />
                                    </span>
                                    <span className="font-display text-[17px] font-bold">{f.name}</span>
                                    <span className="text-fg-3 text-sm leading-relaxed">{f.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="layanan" className="mx-auto grid max-w-[1200px] scroll-mt-[68px] gap-12 px-4 py-20 md:px-6 lg:grid-cols-2">
                    <div className="flex flex-col gap-6">
                        <div>
                            <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">Layanan</span>
                            <h2 className="mt-1 text-3xl font-bold">Apa yang bisa kami bantu</h2>
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                            {services.map((s) => (
                                <div key={s.name} className="flex gap-3 rounded-md border border-slate-200 bg-white p-4">
                                    <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-teal-50 text-teal-700">
                                        <Icon name={s.icon} className="size-4" />
                                    </span>
                                    <div>
                                        <div className="text-[15px] font-semibold">{s.name}</div>
                                        <div className="text-fg-3 text-[13px] leading-relaxed">{s.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div id="jadwal" className="flex flex-col gap-6">
                        <div>
                            <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">Jadwal layanan</span>
                            <h2 className="mt-1 text-3xl font-bold">Jam buka</h2>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                            {schedule.map((d) => (
                                <div
                                    key={d.label}
                                    className={`flex items-center justify-between border-b border-slate-200 px-5 py-4 last:border-0 ${d.today ? 'bg-teal-50' : ''}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-semibold">{d.label}</span>
                                        {d.today && (
                                            <span className="rounded-full bg-teal-400 px-2 py-0.5 text-[11px] font-semibold text-white">
                                                Hari ini
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`font-mono text-sm ${d.closed ? 'text-danger' : ''}`}>{d.hours}</span>
                                        <span className="text-fg-3 text-xs">{d.note}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-warning-soft text-fg-2 flex gap-3 rounded-md p-4 text-sm leading-relaxed">
                            <Info className="text-marigold size-[18px] flex-none" />
                            Layanan sirkulasi ditutup 30 menit sebelum perpustakaan tutup.
                        </div>
                    </div>
                </section>

                <section id="berita" className="scroll-mt-[68px] border-t border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-20 md:px-6">
                        <div>
                            <span className="text-xs font-semibold tracking-[.08em] text-teal-600 uppercase">Berita & pengumuman</span>
                            <h2 className="mt-1 text-3xl font-bold">Kabar perpustakaan</h2>
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                            {news.map((n) => (
                                <article key={n.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-6">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${TAG_STYLE[n.tag] ?? 'text-fg-2 bg-slate-100'}`}>
                                            {n.tag}
                                        </span>
                                        <span className="text-fg-3">{n.date}</span>
                                    </div>
                                    <h3 className="text-[19px] leading-snug font-bold">{n.title}</h3>
                                    {n.excerpt && <p className="text-fg-3 text-sm leading-relaxed">{n.excerpt}</p>}
                                </article>
                            ))}
                            {news.length === 0 && <p className="text-fg-3 text-sm">Belum ada berita.</p>}
                        </div>
                    </div>
                </section>

                <footer className="bg-slate-900 text-slate-300">
                    <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 px-4 py-14 text-sm leading-relaxed md:px-6">
                        <div className="flex flex-col gap-3">
                            <div className="font-display flex items-center gap-2.5 font-extrabold text-white">
                                <AppLogoIcon className="size-10 rounded-full bg-white" />
                                Perpustakaan STPN
                            </div>
                            <span>Jl. Tata Bumi No. 5, Banyuraden, Gamping, Sleman, D.I. Yogyakarta 55293</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="font-semibold text-white">Kontak</span>
                            <span>(0274) 587239</span>
                            <span>perpustakaan@stpn.ac.id</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="font-semibold text-white">Tautan</span>
                            <a href="#opac" className="text-slate-300 hover:text-white">
                                OPAC
                            </a>
                            <Link href={route('login')} className="flex items-center gap-1.5 text-slate-300 hover:text-white">
                                <ShieldCheck className="size-3.5" />
                                Masuk portal
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>

            <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl p-7 sm:max-w-[680px]">
                    {detail && (
                        <div className="grid gap-6 sm:grid-cols-[160px_minmax(0,1fr)]">
                            <BookCover
                                cover={detail.cover}
                                ddc={detail.ddc_class}
                                zoom={detail.title}
                                className="flex aspect-[2/3] w-full flex-col justify-between self-start rounded-sm p-4 text-white shadow-md"
                            >
                                <span className="font-mono text-[11px]">{detail.call_number ?? detail.format}</span>
                                <span className="font-display text-[17px] leading-tight font-extrabold">{detail.title}</span>
                                <span className="text-xs">{detail.author}</span>
                            </BookCover>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <DialogTitle className="font-display pr-6 text-2xl leading-tight font-bold">{detail.title}</DialogTitle>
                                    {detail.series_title && <p className="text-fg-3 mt-1 text-sm">Seri: {detail.series_title}</p>}
                                </div>
                                <DialogDescription className="sr-only">Detail koleksi</DialogDescription>
                                <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
                                    <dt className="text-fg-3">Pengarang</dt>
                                    <dd>{detail.authors.join('; ') || detail.author}</dd>
                                    <dt className="text-fg-3">Penerbit</dt>
                                    <dd>
                                        {[detail.publish_place, detail.publisher].filter(Boolean).join(': ')}
                                        {detail.year ? `, ${detail.year}` : ''}
                                    </dd>
                                    {detail.edition && (
                                        <>
                                            <dt className="text-fg-3">Edisi</dt>
                                            <dd>{detail.edition}</dd>
                                        </>
                                    )}
                                    {detail.collation && (
                                        <>
                                            <dt className="text-fg-3">Kolasi</dt>
                                            <dd>{detail.collation}</dd>
                                        </>
                                    )}
                                    <dt className="text-fg-3">Bahasa</dt>
                                    <dd>{detail.language}</dd>
                                    {detail.isbn && (
                                        <>
                                            <dt className="text-fg-3">ISBN</dt>
                                            <dd className="font-mono">{detail.isbn}</dd>
                                        </>
                                    )}
                                    <dt className="text-fg-3">Jenis</dt>
                                    <dd>{detail.type === 'ebook' ? `E-book (${detail.format})` : detail.collection_type}</dd>
                                    {detail.type === 'fisik' && (
                                        <>
                                            <dt className="text-fg-3">No. panggil</dt>
                                            <dd className="font-mono">{detail.call_number}</dd>
                                            <dt className="text-fg-3">Eksemplar</dt>
                                            <dd>
                                                {detail.available} tersedia dari {detail.copies}
                                            </dd>
                                            <dt className="text-fg-3">Lokasi</dt>
                                            <dd>{detail.rack ? `Lantai ${detail.floor} · Rak ${detail.rack}` : 'Tanyakan ke petugas sirkulasi'}</dd>
                                        </>
                                    )}
                                    {detail.subjects.length > 0 && (
                                        <>
                                            <dt className="text-fg-3">Subjek</dt>
                                            <dd className="flex flex-wrap gap-1.5">
                                                {detail.subjects.map((t) => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => {
                                                            setDetail(null);
                                                            setQ(t);
                                                            search({ q: t, field: 'subject' });
                                                        }}
                                                        className="cursor-pointer rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </dd>
                                        </>
                                    )}
                                </dl>
                                {detail.abstract && <p className="text-fg-2 text-sm leading-relaxed whitespace-pre-line">{detail.abstract}</p>}
                                <p className="text-fg-3 text-xs">
                                    {detail.type === 'ebook'
                                        ? 'Pinjam e-book lewat portal pemustaka.'
                                        : 'Ambil buku di rak, lalu pinjam di meja sirkulasi lantai 1.'}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function Availability({ book }: { book: Card }) {
    if (book.type === 'ebook') {
        return <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">E-book · daring</span>;
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${book.available > 0 ? 'bg-success-soft text-success' : 'bg-warning-soft text-amber-800'}`}
            >
                {book.available > 0 ? `${book.available} tersedia` : 'Sedang dipinjam'}
            </span>
            <span className="text-fg-3 flex items-center gap-1 text-xs">
                <MapPin className="size-3" />
                Lt {book.floor} · Rak {book.rack}
            </span>
        </div>
    );
}
