import PemustakaLayout from '@/layouts/pemustaka-layout';
import { Link, router } from '@inertiajs/react';
import { BookLock, ScanSearch } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Work {
    id: number;
    type: string;
    title: string;
    author: string;
    study_program: string | null;
    year: number;
    tags: string[];
    pct: number;
    words: { t: string; hit: boolean }[];
}

interface CekJudulProps {
    q: string;
    result: { keywords: string[]; results: Work[]; themes: Record<string, number> } | null;
    samples: string[];
}

export default function CekJudul({ q, result, samples }: CekJudulProps) {
    const [text, setText] = useState(q);
    const [theme, setTheme] = useState('');
    const run = (value: string) => {
        setTheme('');
        router.get(route('pemustaka.cek-judul'), value.trim() ? { q: value.trim() } : {}, { preserveScroll: true });
    };
    const submit = (e: FormEvent) => {
        e.preventDefault();
        run(text);
    };

    const works = (result?.results ?? []).filter((r) => !theme || r.tags.includes(theme));
    const top = result?.results[0]?.pct ?? 0;
    const verdict =
        top >= 70
            ? ['Sangat mirip — pertimbangkan ubah fokus atau lokasi', 'bg-danger-soft text-danger']
            : top >= 40
              ? ['Ada kemiripan — pertajam kebaruan penelitian', 'bg-warning-soft text-amber-800']
              : ['Relatif baru', 'bg-success-soft text-success'];
    const tone = (pct: number) => (pct >= 70 ? 'text-danger' : pct >= 40 ? 'text-amber-800' : 'text-teal-700');
    const bar = (pct: number) => (pct >= 70 ? 'bg-danger' : pct >= 40 ? 'bg-amber-700' : 'bg-teal-700');

    return (
        <PemustakaLayout title="Cek judul skripsi">
            <div className="flex flex-col gap-1">
                <h1 className="font-display text-[26px] font-bold">Cek judul skripsi</h1>
                <p className="text-fg-3 text-sm leading-relaxed">
                    Tulis rencana judul atau tema penelitianmu. Sistem mencari skripsi, tesis, dan disertasi terdahulu yang memakai kata kunci atau
                    tema serupa.
                </p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                <label className="text-fg-2 flex flex-col gap-1.5 text-[13px] font-semibold">
                    Rencana judul / tema penelitian
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={2}
                        maxLength={300}
                        placeholder="mis. Evaluasi pelaksanaan PTSL di Kabupaten Sleman"
                        className="text-fg-1 w-full resize-y rounded-md border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-[15px] leading-normal font-normal outline-none focus:border-teal-400 dark:bg-slate-800"
                    />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-fg-3 text-xs">Coba contoh:</span>
                        {samples.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => {
                                    setText(s);
                                    run(s);
                                }}
                                className="text-fg-2 h-[30px] cursor-pointer rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold whitespace-nowrap hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-800"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button
                        type="submit"
                        className="flex h-[42px] cursor-pointer items-center gap-2 rounded-md bg-teal-400 px-[18px] text-sm font-semibold text-white hover:bg-teal-500 active:scale-[.98]"
                    >
                        <ScanSearch className="size-4" />
                        Cek kemiripan
                    </button>
                </div>
            </form>

            {result && result.keywords.length > 0 && (
                <>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                        <div className="flex flex-col gap-1.5 rounded-lg bg-white px-5 py-[18px] shadow-sm dark:bg-slate-800">
                            <span className="text-fg-3 text-[13px]">Kemiripan tertinggi</span>
                            <span className={`font-display text-[30px] font-extrabold ${tone(top)}`}>{top}%</span>
                            <span className={`self-start rounded-full px-2.5 py-[3px] text-xs font-semibold ${verdict[1]}`}>{verdict[0]}</span>
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg bg-white px-5 py-[18px] shadow-sm dark:bg-slate-800">
                            <span className="text-fg-3 text-[13px]">Kata kunci yang dicari</span>
                            <div className="flex flex-wrap gap-1.5">
                                {result.keywords.map((k) => (
                                    <span key={k} className="rounded-full bg-teal-50 px-2.5 py-[3px] text-xs font-semibold text-teal-700">
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg bg-white px-5 py-[18px] shadow-sm dark:bg-slate-800">
                            <span className="text-fg-3 text-[13px]">Tema serupa di repositori</span>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(result.themes).map(([label, n]) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => setTheme(theme === label ? '' : label)}
                                        className={`cursor-pointer rounded-full px-2.5 py-[3px] text-xs font-semibold ${theme === label ? 'bg-teal-400 text-white' : 'text-fg-2 bg-slate-100 dark:bg-slate-700'}`}
                                    >
                                        {label} · {n}
                                    </button>
                                ))}
                                {Object.keys(result.themes).length === 0 && <span className="text-fg-3 text-xs">—</span>}
                            </div>
                        </div>
                    </div>

                    <section className="rounded-lg bg-white px-5 pt-2 pb-1 shadow-sm dark:bg-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-2 py-3">
                            <span className="font-display text-[17px] font-bold">{works.length} karya terdahulu ditemukan</span>
                            <span className="text-fg-3 text-[13px]">
                                {theme ? `Tema: ${theme} · klik lagi untuk hapus filter` : 'Diurutkan dari yang paling mirip'}
                            </span>
                        </div>
                        {works.map((r) => (
                            <div key={r.id} className="flex flex-wrap items-start gap-4 border-t border-slate-200 py-3.5 dark:border-slate-700">
                                <div className="flex w-[58px] flex-none flex-col items-center gap-1">
                                    <span className={`font-display text-lg font-extrabold ${tone(r.pct)}`}>{r.pct}%</span>
                                    <div className="h-[5px] w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                        <div className={`h-full ${bar(r.pct)}`} style={{ width: `${r.pct}%` }} />
                                    </div>
                                </div>
                                <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
                                    <div className="text-[15px] leading-normal font-semibold">
                                        {r.words.map((w, i) => (
                                            <span key={i}>
                                                <span className={w.hit ? 'bg-warning-soft rounded-[3px]' : ''}>{w.t}</span>{' '}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-fg-3 text-[13px]">
                                        {r.author} · {r.type} {r.study_program} · {r.year}
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {r.tags.map((t) => (
                                            <span
                                                key={t}
                                                className="text-fg-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold dark:bg-slate-700"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Link
                                    href={route('pemustaka.baca', { jenis: r.type, karya: r.id })}
                                    className="flex h-9 flex-none items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-semibold text-teal-700 hover:bg-teal-50 dark:bg-slate-800"
                                >
                                    <BookLock className="size-4" />
                                    Baca di tempat
                                </Link>
                            </div>
                        ))}
                        {works.length === 0 && (
                            <div className="text-fg-3 border-t border-slate-200 py-7 text-center text-sm dark:border-slate-700">
                                Belum ada karya terdahulu dengan kata kunci ini. Temamu kemungkinan masih baru.
                            </div>
                        )}
                    </section>
                    <p className="text-fg-3 text-xs leading-relaxed">
                        Persentase dihitung dari kecocokan kata kunci di judul dan tema, bukan uji plagiasi isi. Diskusikan hasilnya dengan dosen
                        pembimbing.
                    </p>
                </>
            )}
        </PemustakaLayout>
    );
}
