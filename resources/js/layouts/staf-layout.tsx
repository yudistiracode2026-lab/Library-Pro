import { AppShell } from '@/components/app-shell';
import { FlashToast } from '@/components/flash-toast';
import { StafHeader } from '@/components/staf/staf-header';
import { StafSidebar } from '@/components/staf/staf-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { Head } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface StafLayoutProps {
    title: string;
    group?: string;
    children: ReactNode;
}

export default function StafLayout({ title, group, children }: StafLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <Head title={title} />
            <StafSidebar />
            {/* min-w-0: wide tables scroll inside their own box instead of widening the page on a phone. */}
            <SidebarInset className="min-w-0 bg-slate-50 dark:bg-slate-900">
                <StafHeader title={title} crumb={group ? `Portal staf · ${group}` : 'Portal staf'} />
                <main className="flex w-full max-w-[1440px] min-w-0 flex-col gap-6 p-4 md:p-7">{children}</main>
            </SidebarInset>
            <FlashToast />
        </AppShell>
    );
}
