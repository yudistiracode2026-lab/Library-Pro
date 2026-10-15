import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

const ROLE_LABEL = { admin: 'Administrator', pustakawan: 'Pustakawan', pemustaka: 'Pemustaka' } as const;

export function StafHeader({ title, crumb }: { title: string; crumb: string }) {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-md md:px-7 dark:bg-slate-900/85">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="text-fg-3 text-xs">{crumb}</span>
                <span className="font-display truncate text-[17px] font-bold">{title}</span>
            </div>

            <span className="text-fg-2 hidden rounded-xl bg-slate-100 px-3.5 py-1.5 text-[13px] font-semibold sm:inline-flex dark:bg-slate-800">
                {ROLE_LABEL[auth.user.role]}
            </span>

            <DropdownMenu>
                <DropdownMenuTrigger
                    title={[auth.user.name, auth.user.title].filter(Boolean).join(' · ')}
                    className="grid size-9 flex-none cursor-pointer place-items-center rounded-full bg-teal-100 text-[13px] font-bold text-teal-800"
                >
                    {getInitials(auth.user.name)}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-60 rounded-lg" align="end">
                    <UserMenuContent user={auth.user} />
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
