import PemustakaLayout from '@/layouts/pemustaka-layout';
import { router, useForm } from '@inertiajs/react';
import { ThumbsUp } from 'lucide-react';
import { type FormEvent } from 'react';

interface UsulanProps {
    suggestions: { id: number; title: string; author: string; votes: number; status: string; mine: boolean; canVote: boolean }[];
}

const field =
    'h-11 rounded-[10px] border-[1.5px] border-slate-300 bg-white px-3 text-sm font-normal text-fg-1 outline-none focus:border-teal-400 dark:bg-slate-800';

export default function Usulan({ suggestions }: UsulanProps) {
    const form = useForm({ title: '', author: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('pemustaka.usulan.store'), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <PemustakaLayout title="Usulan">
            <h1 className="font-display text-[26px] font-bold">Usulan koleksi</h1>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-5">
                <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-800">
                    <span className="text-fg-3 text-sm">Buku yang kamu butuhkan belum ada? Usulkan di sini.</span>
                    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                        Judul
                        <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} required className={field} />
                        {form.errors.title && <span className="text-danger text-xs font-normal">{form.errors.title}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                        Pengarang
                        <input value={form.data.author} onChange={(e) => form.setData('author', e.target.value)} className={field} />
                    </label>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="h-11 cursor-pointer rounded-md bg-teal-400 font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
                    >
                        Kirim usulan
                    </button>
                </form>
                <section className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                    {suggestions.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5 last:border-0 dark:border-slate-700">
                            <button
                                type="button"
                                disabled={!u.canVote}
                                aria-pressed={u.mine}
                                title={u.canVote ? (u.mine ? 'Batalkan dukungan' : 'Dukung usulan ini') : 'Usulan sudah diproses'}
                                onClick={() => router.post(route('pemustaka.usulan.vote', u.id), {}, { preserveScroll: true })}
                                className={`flex size-[52px] flex-none cursor-pointer flex-col items-center justify-center rounded-md border font-bold disabled:cursor-default ${u.mine ? 'border-teal-400 bg-teal-400 text-white' : 'border-slate-200 bg-white text-teal-700 dark:bg-slate-800'}`}
                            >
                                <ThumbsUp className="size-4" />
                                {u.votes}
                            </button>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">{u.title}</div>
                                <div className="text-fg-3 text-xs">
                                    {u.author} · {u.status}
                                </div>
                            </div>
                        </div>
                    ))}
                    {suggestions.length === 0 && <div className="text-fg-3 p-8 text-center text-sm">Belum ada usulan. Jadilah yang pertama, ya.</div>}
                </section>
            </div>
        </PemustakaLayout>
    );
}
